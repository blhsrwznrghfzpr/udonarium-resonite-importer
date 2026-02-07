import { Card } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';
import { buildQuadMeshComponents } from './componentBuilders';

export function applyCardConversion(udonObj: Card, resoniteObj: ResoniteObject): void {
  resoniteObj.scale = { x: 0.06, y: 0.001, z: 0.09 };
  resoniteObj.components = buildQuadMeshComponents(
    resoniteObj.id,
    udonObj.images[0]?.identifier,
    true
  );
}
