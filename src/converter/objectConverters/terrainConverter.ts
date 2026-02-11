import { Terrain } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';
import {
  buildBoxColliderComponent,
  buildQuadMeshComponents,
  resolveTextureValue,
} from './componentBuilders';

export function applyTerrainConversion(
  udonObj: Terrain,
  resoniteObj: ResoniteObject,
  textureMap?: Map<string, string>
): void {
  const topTextureIdentifier =
    udonObj.floorImage?.identifier ??
    udonObj.wallImage?.identifier ??
    udonObj.images[0]?.identifier;
  const sideTextureIdentifier =
    udonObj.wallImage?.identifier ??
    udonObj.floorImage?.identifier ??
    udonObj.images[0]?.identifier;
  const topTextureValue = resolveTextureValue(topTextureIdentifier, textureMap);
  const sideTextureValue = resolveTextureValue(sideTextureIdentifier, textureMap);
  // Axis mapping: width -> X, height -> Y, depth -> Z
  resoniteObj.components = [
    buildBoxColliderComponent(resoniteObj.id, {
      x: udonObj.width,
      y: udonObj.height,
      z: udonObj.depth,
    }),
  ];
  if (!udonObj.isLocked) {
    resoniteObj.components.push({
      id: `${resoniteObj.id}-grabbable`,
      type: '[FrooxEngine]FrooxEngine.Grabbable',
      fields: {},
    });
  }

  const topId = `${resoniteObj.id}-top`;
  const frontId = `${resoniteObj.id}-front`;
  const backId = `${resoniteObj.id}-back`;
  const leftId = `${resoniteObj.id}-left`;
  const rightId = `${resoniteObj.id}-right`;

  resoniteObj.children = [
    {
      id: topId,
      name: `${resoniteObj.name}-top`,
      position: { x: 0, y: udonObj.height / 2, z: 0 },
      rotation: { x: 90, y: 0, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(topId, topTextureValue, false, {
        x: udonObj.width,
        y: udonObj.depth,
      }),
      children: [],
    },
    {
      id: frontId,
      name: `${resoniteObj.name}-front`,
      position: { x: 0, y: 0, z: -udonObj.depth / 2 },
      rotation: { x: 0, y: 0, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(frontId, sideTextureValue, false, {
        x: udonObj.width,
        y: udonObj.height,
      }),
      children: [],
    },
    {
      id: backId,
      name: `${resoniteObj.name}-back`,
      position: { x: 0, y: 0, z: udonObj.depth / 2 },
      rotation: { x: 0, y: 180, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(backId, sideTextureValue, false, {
        x: udonObj.width,
        y: udonObj.height,
      }),
      children: [],
    },
    {
      id: leftId,
      name: `${resoniteObj.name}-left`,
      position: { x: -udonObj.width / 2, y: 0, z: 0 },
      rotation: { x: 0, y: 90, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(leftId, sideTextureValue, false, {
        x: udonObj.depth,
        y: udonObj.height,
      }),
      children: [],
    },
    {
      id: rightId,
      name: `${resoniteObj.name}-right`,
      position: { x: udonObj.width / 2, y: 0, z: 0 },
      rotation: { x: 0, y: -90, z: 0 },
      textures: [],
      components: buildQuadMeshComponents(rightId, sideTextureValue, false, {
        x: udonObj.depth,
        y: udonObj.height,
      }),
      children: [],
    },
  ];

  // Udonarium positions are edge-based; Resonite uses center-based transforms.
  resoniteObj.position.x += udonObj.width / 2;
  resoniteObj.position.y += udonObj.height / 2;
  resoniteObj.position.z -= udonObj.depth / 2;
}
