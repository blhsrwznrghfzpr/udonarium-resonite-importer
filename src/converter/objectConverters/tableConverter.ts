import { GameTable, UdonariumObject } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';
import { buildQuadMeshComponents, resolveTextureValue } from './componentBuilders';

export function applyTableConversion(
  udonObj: GameTable,
  resoniteObj: ResoniteObject,
  textureMap?: Map<string, string>,
  convertObject?: (obj: UdonariumObject) => ResoniteObject
): void {
  // Lay table surface flat (horizontal quad).
  resoniteObj.rotation = { x: 90, y: 0, z: 0 };
  const textureValue = resolveTextureValue(udonObj.images[0]?.identifier, textureMap);
  resoniteObj.components = buildQuadMeshComponents(resoniteObj.id, textureValue, false, {
    x: udonObj.width,
    y: udonObj.height,
  });

  // Convert child objects (terrain, characters, etc. nested inside game-table)
  if (convertObject && udonObj.children.length > 0) {
    resoniteObj.children = udonObj.children.map((child) => convertObject(child));
  }
}
