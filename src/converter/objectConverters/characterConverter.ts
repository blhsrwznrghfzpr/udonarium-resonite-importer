import { GameCharacter } from '../UdonariumObject';
import { ResoniteObject, Vector3 } from '../ResoniteObject';
import { buildQuadMeshComponents } from './componentBuilders';

export function applyCharacterConversion(
  udonObj: GameCharacter,
  resoniteObj: ResoniteObject,
  convertSize: (size: number) => Vector3
): void {
  resoniteObj.scale = convertSize(udonObj.size);
  resoniteObj.components = buildQuadMeshComponents(
    resoniteObj.id,
    udonObj.images[0]?.identifier,
    true
  );
}
