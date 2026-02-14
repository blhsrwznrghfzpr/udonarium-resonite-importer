import { Card } from '../../domain/UdonariumObject';
import { ResoniteObject } from '../../domain/ResoniteObject';
import {
  buildBoxColliderComponent,
  buildQuadMeshComponents,
  resolveTextureValue,
} from './componentBuilders';

const CARD_Y_OFFSET = 0.001;
const CARD_FACE_SEPARATION = 0.0001;
const DEFAULT_CARD_ASPECT_RATIO = 1.5;

function resolveFrontTextureIdentifier(card: Card): string | undefined {
  return card.frontImage?.identifier ?? card.backImage?.identifier ?? card.images[0]?.identifier;
}

function resolveBackTextureIdentifier(card: Card): string | undefined {
  return (
    card.backImage?.identifier ??
    card.frontImage?.identifier ??
    card.images[1]?.identifier ??
    card.images[0]?.identifier
  );
}

function resolveCardAspectRatio(card: Card, imageAspectRatioMap?: Map<string, number>): number {
  if (!imageAspectRatioMap) {
    return DEFAULT_CARD_ASPECT_RATIO;
  }

  const frontIdentifier = resolveFrontTextureIdentifier(card);
  const backIdentifier = resolveBackTextureIdentifier(card);
  const frontAspect = frontIdentifier ? imageAspectRatioMap.get(frontIdentifier) : undefined;
  const backAspect = backIdentifier ? imageAspectRatioMap.get(backIdentifier) : undefined;

  if (frontAspect && Number.isFinite(frontAspect) && frontAspect > 0) {
    return frontAspect;
  }
  if (backAspect && Number.isFinite(backAspect) && backAspect > 0) {
    return backAspect;
  }
  return DEFAULT_CARD_ASPECT_RATIO;
}

export function applyCardConversion(
  udonObj: Card,
  resoniteObj: ResoniteObject,
  textureMap?: Map<string, string>,
  imageAspectRatioMap?: Map<string, number>
): void {
  const cardWidth = udonObj.size ?? 1;
  const cardHeight = cardWidth * resolveCardAspectRatio(udonObj, imageAspectRatioMap);
  const frontTextureValue = resolveTextureValue(resolveFrontTextureIdentifier(udonObj), textureMap);
  const backTextureValue = resolveTextureValue(resolveBackTextureIdentifier(udonObj), textureMap);

  // Udonarium positions are edge-based; Resonite uses center-based transforms.
  resoniteObj.position.x += cardWidth / 2;
  resoniteObj.position.z -= cardHeight / 2;
  // Slight Y offset so cards don't z-fight with the table surface.
  resoniteObj.position.y += CARD_Y_OFFSET;
  // Keep parent slot rotation on table plane; lay-flat rotation is applied on child faces.
  resoniteObj.rotation = {
    x: 0,
    y: udonObj.rotate ?? 0,
    z: udonObj.isFaceUp ? 0 : 180,
  };
  resoniteObj.components = [
    // Parent slot rotates only on Y, so make collider thin on local Y.
    buildBoxColliderComponent(resoniteObj.id, { x: cardWidth, y: 0.01, z: cardHeight }),
    {
      id: `${resoniteObj.id}-grabbable`,
      type: '[FrooxEngine]FrooxEngine.Grabbable',
      fields: {},
    },
  ];
  resoniteObj.children = [
    {
      id: `${resoniteObj.id}-front`,
      name: `${resoniteObj.name}-front`,
      position: { x: 0, y: CARD_FACE_SEPARATION, z: 0 },
      rotation: { x: 90, y: 0, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(`${resoniteObj.id}-front`, frontTextureValue, false, {
        x: cardWidth,
        y: cardHeight,
      }),
      children: [],
    },
    {
      id: `${resoniteObj.id}-back`,
      name: `${resoniteObj.name}-back`,
      position: { x: 0, y: -CARD_FACE_SEPARATION, z: 0 },
      rotation: { x: -90, y: 180, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(`${resoniteObj.id}-back`, backTextureValue, false, {
        x: cardWidth,
        y: cardHeight,
      }),
      children: [],
    },
  ];
}
