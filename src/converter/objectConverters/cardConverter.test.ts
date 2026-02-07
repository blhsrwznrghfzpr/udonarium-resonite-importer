import { describe, expect, it } from 'vitest';
import { applyCardConversion } from './cardConverter';
import { Card } from '../UdonariumObject';
import { ResoniteObject } from '../ResoniteObject';

describe('applyCardConversion', () => {
  it('カードサイズと両面Quad構成を設定する', () => {
    const udonObj: Card = {
      id: 'card-1',
      type: 'card',
      name: 'Card',
      position: { x: 0, y: 0 },
      images: [{ identifier: 'front.png', name: 'front.png' }],
      properties: new Map(),
      isFaceUp: true,
      frontImage: { identifier: 'front.png', name: 'front.png' },
      backImage: { identifier: 'back.png', name: 'back.png' },
    };
    const resoniteObj: ResoniteObject = {
      id: 'slot-card-1',
      name: 'Card',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      textures: ['front.png', 'back.png'],
      components: [],
      children: [],
    };

    applyCardConversion(udonObj, resoniteObj);

    expect(resoniteObj.scale).toEqual({ x: 0.06, y: 0.001, z: 0.09 });
    expect(resoniteObj.components[0].fields).toEqual({
      DualSided: { $type: 'bool', value: true },
    });
  });
});
