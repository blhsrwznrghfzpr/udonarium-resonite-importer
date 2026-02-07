import { describe, expect, it } from 'vitest';
import { applyTableConversion } from './tableConverter';
import { GameTable } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';
import { SCALE_FACTOR } from '../../config/MappingConfig';

describe('applyTableConversion', () => {
  it('テーブルサイズ・Yオフセット・Quad系コンポーネントを設定する', () => {
    const udonObj: GameTable = {
      id: 'table-1',
      type: 'table',
      name: 'Table',
      position: { x: 0, y: 0 },
      images: [{ identifier: 'table.png', name: 'table.png' }],
      properties: new Map(),
      width: 20,
      height: 10,
      gridType: 'square',
      gridColor: '#ffffff',
    };
    const resoniteObj: ResoniteObject = {
      id: 'slot-table-1',
      name: 'Table',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      textures: ['table.png'],
      components: [],
      children: [],
    };

    applyTableConversion(udonObj, resoniteObj);

    expect(resoniteObj.scale).toEqual({
      x: 20 * SCALE_FACTOR,
      y: 0.01,
      z: 10 * SCALE_FACTOR,
    });
    expect(resoniteObj.position.y).toBe(-0.01);
    expect(resoniteObj.components[0].fields).toEqual({});
  });
});
