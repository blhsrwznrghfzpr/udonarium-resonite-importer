import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { buildImageAspectRatioMap } from './imageAspectRatioMap';

describe('buildImageAspectRatioMap', () => {
  it('maps identifier to height/width ratio', async () => {
    const png = await sharp({
      create: {
        width: 100,
        height: 200,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await buildImageAspectRatioMap([
      { path: 'images/front.png', name: 'front', data: png },
    ]);

    expect(result.get('front')).toBe(2);
  });

  it('ignores invalid image data', async () => {
    const result = await buildImageAspectRatioMap([
      { path: 'images/bad.png', name: 'bad', data: Buffer.from('not-image') },
    ]);

    expect(result.size).toBe(0);
  });
});
