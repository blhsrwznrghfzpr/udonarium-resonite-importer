import { Terrain } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';
import { SIZE_MULTIPLIER } from '../../config/MappingConfig';
import { buildBoxMeshComponents } from './componentBuilders';

export function applyTerrainConversion(udonObj: Terrain, resoniteObj: ResoniteObject): void {
  resoniteObj.scale = {
    x: udonObj.width * SIZE_MULTIPLIER,
    y: udonObj.height * SIZE_MULTIPLIER,
    z: udonObj.depth * SIZE_MULTIPLIER,
  };
  resoniteObj.components = buildBoxMeshComponents(
    resoniteObj.id,
    udonObj.floorImage?.identifier ?? udonObj.images[0]?.identifier
  );
}
