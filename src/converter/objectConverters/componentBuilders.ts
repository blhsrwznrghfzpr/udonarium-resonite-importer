import { ResoniteComponent } from '../ResoniteObject';

const TEXTURE_PLACEHOLDER_PREFIX = 'texture://';

export function buildQuadMeshComponents(
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

export function buildBoxMeshComponents(
  slotId: string,
  textureIdentifier?: string
): ResoniteComponent[] {
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

export function toTexturePlaceholder(identifier: string): string {
  return `${TEXTURE_PLACEHOLDER_PREFIX}${identifier}`;
}

export function replaceTexturesInValue(value: unknown, textureMap: Map<string, string>): unknown {
  if (typeof value === 'string') {
    if (!value.startsWith(TEXTURE_PLACEHOLDER_PREFIX)) {
      return value;
    }
    const identifier = value.slice(TEXTURE_PLACEHOLDER_PREFIX.length);
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
