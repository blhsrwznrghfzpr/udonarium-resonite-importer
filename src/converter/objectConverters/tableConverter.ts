import { GameTable } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';
import { SCALE_FACTOR } from '../../config/MappingConfig';
import { buildQuadMeshComponents } from './componentBuilders';

export function applyTableConversion(udonObj: GameTable, resoniteObj: ResoniteObject): void {
  resoniteObj.scale = {
    x: udonObj.width * SCALE_FACTOR,
    y: 0.01,
    z: udonObj.height * SCALE_FACTOR,
  };
  resoniteObj.position.y = -0.01;
  resoniteObj.components = buildQuadMeshComponents(
    resoniteObj.id,
    udonObj.images[0]?.identifier,
    false
  );
}
