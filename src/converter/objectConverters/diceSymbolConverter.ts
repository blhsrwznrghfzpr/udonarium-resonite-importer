import { DiceSymbol } from '../../domain/UdonariumObject';
import { ResoniteObject, Vector3 } from '../../domain/ResoniteObject';
import {
  BlendModeValue,
  buildBoxColliderComponent,
  buildQuadMeshComponents,
  resolveTextureValue,
} from './componentBuilders';
import { lookupImageHasAlpha } from '../imageAspectRatioMap';

function resolveBlendMode(
  identifier: string | undefined,
  imageAlphaMap?: Map<string, boolean>
): BlendModeValue {
  if (!imageAlphaMap) {
    return 'Cutout';
  }
  const hasAlpha = lookupImageHasAlpha(imageAlphaMap, identifier);
  if (hasAlpha === undefined) {
    return 'Cutout';
  }
  return hasAlpha ? 'Alpha' : 'Opaque';
}

export function applyDiceSymbolConversion(
  udonObj: DiceSymbol,
  resoniteObj: ResoniteObject,
  convertSize: (size: number) => Vector3,
  textureMap?: Map<string, string>,
  imageAlphaMap?: Map<string, boolean>
): void {
  const size = convertSize(udonObj.size);
  const activeFaceName = udonObj.face ?? udonObj.faceImages[0]?.name;

  // Keep only collider on parent; visual renderers live on face child slots.
  resoniteObj.components = [
    buildBoxColliderComponent(resoniteObj.id, {
      x: size.x,
      y: size.y,
      z: 0.05,
    }),
  ];
  resoniteObj.children = udonObj.faceImages.map((faceImage, index) => {
    const childId = `${resoniteObj.id}-face-${index}`;
    const childTextureValue = resolveTextureValue(faceImage.identifier, textureMap);
    const childBlendMode = resolveBlendMode(faceImage.identifier, imageAlphaMap);
    return {
      id: childId,
      name: `${resoniteObj.name}-face-${faceImage.name}`,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      isActive: faceImage.name === activeFaceName,
      textures: [faceImage.identifier],
      components: buildQuadMeshComponents(
        childId,
        childTextureValue,
        true,
        {
          x: size.x,
          y: size.y,
        },
        childBlendMode
      ),
      children: [],
    };
  });

  // Udonarium positions are edge-based; Resonite uses center-based transforms.
  resoniteObj.position.x += size.x / 2;
  resoniteObj.position.z -= size.x / 2;
  resoniteObj.position.y += size.y / 2;
}
