/**
 * Converts Udonarium objects to Resonite objects
 */

import { randomUUID } from 'crypto';
import { UdonariumObject } from './UdonariumObject';
import { ResoniteComponent, ResoniteObject, Vector3 } from './ResoniteObject';
import { SCALE_FACTOR, SIZE_MULTIPLIER } from '../config/MappingConfig';

const SLOT_ID_PREFIX = 'udon-imp';

/**
 * Convert Udonarium 2D coordinates to Resonite 3D coordinates
 * Udonarium: +X right, +Y down (CSS-like)
 * Resonite: +X right, +Y up, +Z forward (Y-up system)
 */
export function convertPosition(x: number, y: number): Vector3 {
  return {
    x: x * SCALE_FACTOR,
    y: 0, // Table height
    z: -y * SCALE_FACTOR,
  };
}

/**
 * Convert Udonarium size to Resonite scale
 */
export function convertSize(size: number): Vector3 {
  const scale = size * SIZE_MULTIPLIER;
  return {
    x: scale,
    y: scale,
    z: scale,
  };
}

/**
 * Convert a single Udonarium object to Resonite object
 */
export function convertObject(udonObj: UdonariumObject): ResoniteObject {
  const position = convertPosition(udonObj.position.x, udonObj.position.y);

  const slotId = `${SLOT_ID_PREFIX}-${randomUUID()}`;
  const resoniteObj: ResoniteObject = {
    id: slotId,
    name: udonObj.name,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    textures: udonObj.images.map((img) => img.identifier),
    components: buildComponents(udonObj, slotId),
    children: [],
  };

  // Apply type-specific conversions
  switch (udonObj.type) {
    case 'character':
      resoniteObj.scale = convertSize(udonObj.size);
      break;
    case 'terrain':
      resoniteObj.scale = {
        x: udonObj.width * SIZE_MULTIPLIER,
        y: udonObj.height * SIZE_MULTIPLIER,
        z: udonObj.depth * SIZE_MULTIPLIER,
      };
      break;
    case 'table':
      resoniteObj.scale = {
        x: udonObj.width * SCALE_FACTOR,
        y: 0.01, // Thin table
        z: udonObj.height * SCALE_FACTOR,
      };
      resoniteObj.position.y = -0.01; // Slightly below origin
      break;
    case 'card':
      resoniteObj.scale = { x: 0.06, y: 0.001, z: 0.09 }; // Standard card size
      break;
    case 'card-stack':
      resoniteObj.scale = { x: 0.06, y: 0.001, z: 0.09 }; // Standard card size
      resoniteObj.children = udonObj.cards.map((card, i) => {
        const child = convertObject(card);
        // Stack cards locally under the parent slot.
        child.position = { x: 0, y: i * 0.0005, z: 0 };
        return child;
      });
      resoniteObj.components = [];
      break;
    case 'text-note':
      resoniteObj.scale = { x: 0.1, y: 0.1, z: 0.1 };
      break;
    default:
      break;
  }

  return resoniteObj;
}

/**
 * Convert multiple Udonarium objects to Resonite objects
 */
export function convertObjects(udonObjects: UdonariumObject[]): ResoniteObject[] {
  return udonObjects.map(convertObject);
}

/**
 * Resolve texture placeholders in component fields.
 * Placeholders use the format "texture://<identifier>".
 */
export function resolveTexturePlaceholders(
  objects: ResoniteObject[],
  textureMap: Map<string, string>
): void {
  for (const obj of objects) {
    for (const component of obj.components) {
      component.fields = replaceTexturesInValue(component.fields, textureMap) as Record<
        string,
        unknown
      >;
    }
    if (obj.children.length > 0) {
      resolveTexturePlaceholders(obj.children, textureMap);
    }
  }
}

function buildComponents(udonObj: UdonariumObject, slotId: string): ResoniteComponent[] {
  switch (udonObj.type) {
    case 'character':
    case 'card':
      return buildQuadMeshComponents(slotId, udonObj.images[0]?.identifier, true);
    case 'table':
      return buildQuadMeshComponents(slotId, udonObj.images[0]?.identifier, false);
    case 'terrain':
      return buildBoxMeshComponents(
        slotId,
        udonObj.floorImage?.identifier ?? udonObj.images[0]?.identifier
      );
    case 'text-note':
      return [
        {
          id: `${slotId}-text`,
          type: '[FrooxEngine]FrooxEngine.UIX.Text',
          fields: {
            Content: { $type: 'string', value: udonObj.text },
            Size: { $type: 'float', value: Math.max(8, udonObj.fontSize) },
          },
        },
      ];
    case 'card-stack':
    case 'table-mask':
    default:
      return [];
  }
}

function buildQuadMeshComponents(
  slotId: string,
  textureIdentifier?: string,
  dualSided: boolean = false
): ResoniteComponent[] {
  const meshId = `${slotId}-mesh`;
  const materialId = `${slotId}-mat`;
  const textureId = `${slotId}-tex`;
  const components: ResoniteComponent[] = [
    {
      id: meshId,
      type: '[FrooxEngine]FrooxEngine.QuadMesh',
      fields: dualSided ? { DualSided: { $type: 'bool', value: true } } : {},
    },
    {
      id: materialId,
      type: '[FrooxEngine]FrooxEngine.UnlitMaterial',
      fields: textureIdentifier
        ? {
            Texture: { $type: 'reference', targetId: textureId },
          }
        : {},
    },
    {
      id: `${slotId}-renderer`,
      type: '[FrooxEngine]FrooxEngine.MeshRenderer',
      fields: {
        Mesh: { $type: 'reference', targetId: meshId },
        Materials: {
          $type: 'list',
          elements: [{ $type: 'reference', targetId: materialId }],
        },
      },
    },
  ];

  if (textureIdentifier) {
    components.push({
      id: textureId,
      type: '[FrooxEngine]FrooxEngine.StaticTexture2D',
      fields: {
        URL: { $type: 'Uri', value: toTexturePlaceholder(textureIdentifier) },
      },
    });
  }

  return components;
}

function buildBoxMeshComponents(slotId: string, textureIdentifier?: string): ResoniteComponent[] {
  const meshId = `${slotId}-mesh`;
  const materialId = `${slotId}-mat`;
  const textureId = `${slotId}-tex`;
  const components: ResoniteComponent[] = [
    {
      id: meshId,
      type: '[FrooxEngine]FrooxEngine.BoxMesh',
      fields: {},
    },
    {
      id: materialId,
      type: '[FrooxEngine]FrooxEngine.PBS_Metallic',
      fields: textureIdentifier
        ? {
            AlbedoTexture: { $type: 'reference', targetId: textureId },
          }
        : {},
    },
    {
      id: `${slotId}-renderer`,
      type: '[FrooxEngine]FrooxEngine.MeshRenderer',
      fields: {
        Mesh: { $type: 'reference', targetId: meshId },
        Materials: {
          $type: 'list',
          elements: [{ $type: 'reference', targetId: materialId }],
        },
      },
    },
  ];

  if (textureIdentifier) {
    components.push({
      id: textureId,
      type: '[FrooxEngine]FrooxEngine.StaticTexture2D',
      fields: {
        URL: { $type: 'Uri', value: toTexturePlaceholder(textureIdentifier) },
      },
    });
  }

  return components;
}

function toTexturePlaceholder(identifier: string): string {
  return `texture://${identifier}`;
}

function replaceTexturesInValue(value: unknown, textureMap: Map<string, string>): unknown {
  if (typeof value === 'string') {
    if (!value.startsWith('texture://')) {
      return value;
    }
    const identifier = value.slice('texture://'.length);
    return textureMap.get(identifier) ?? identifier;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTexturesInValue(item, textureMap));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const recordValue = value as Record<string, unknown>;
  const replaced: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(recordValue)) {
    replaced[key] = replaceTexturesInValue(item, textureMap);
  }
  return replaced;
}
