import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { ResoniteObject } from '../domain/ResoniteObject';
import { extractZip } from '../parser/ZipExtractor';
import { parseXmlFiles } from '../parser/XmlParser';
import { buildImageAspectRatioMap, buildImageBlendModeMap } from './imageAspectRatioMap';
import { convertObjectsWithTextureMap } from './ObjectConverter';

const SAMPLE_DICE_ZIP_PATH = path.join(process.cwd(), 'src', '__fixtures__', 'sample-dice.zip');
const SAMPLE_CARD_ZIP_PATH = path.join(process.cwd(), 'src', '__fixtures__', 'sample-card.zip');
const SAMPLE_MAPMASK_ZIP_PATH = path.join(
  process.cwd(),
  'src',
  '__fixtures__',
  'sample-mapmask.zip'
);
const SAMPLE_TERRAIN_ZIP_PATH = path.join(
  process.cwd(),
  'src',
  '__fixtures__',
  'sample-terrain.zip'
);
const CONVERTER_INTEGRATION_TIMEOUT = 30000;

async function loadConvertedFromZip(zipPath: string): Promise<ResoniteObject[]> {
  const extracted = extractZip(zipPath);
  const parsed = parseXmlFiles(extracted.xmlFiles.map((f) => ({ name: f.name, data: f.data })));
  const imageAspectRatioMap = await buildImageAspectRatioMap(extracted.imageFiles, parsed.objects);
  const imageBlendModeMap = await buildImageBlendModeMap(extracted.imageFiles, parsed.objects);
  return convertObjectsWithTextureMap(
    parsed.objects,
    new Map(),
    imageAspectRatioMap,
    imageBlendModeMap
  );
}

function flattenObjects(objects: ResoniteObject[]): ResoniteObject[] {
  const result: ResoniteObject[] = [];
  const visit = (obj: ResoniteObject): void => {
    result.push(obj);
    for (const child of obj.children) {
      visit(child);
    }
  };
  for (const obj of objects) {
    visit(obj);
  }
  return result;
}

describe('Converter integration (sample-dice.zip)', () => {
  it(
    'converts parsed dice objects with image maps',
    async () => {
      const converted = await loadConvertedFromZip(SAMPLE_DICE_ZIP_PATH);
      const convertedDice = converted.filter((obj) => obj.name === 'D6');

      expect(convertedDice.length).toBeGreaterThan(0);
      const dice = convertedDice[0];
      expect(dice.components.map((c) => c.type)).toEqual([
        '[FrooxEngine]FrooxEngine.BoxCollider',
        '[FrooxEngine]FrooxEngine.Grabbable',
      ]);
      expect(dice.children.length).toBe(6);
      expect(dice.children.filter((child) => child.isActive)).toHaveLength(1);

      const material = dice.children[0].components.find(
        (c) => c.type === '[FrooxEngine]FrooxEngine.XiexeToonMaterial'
      );
      expect(material?.fields.BlendMode).toEqual({
        $type: 'enum',
        value: 'Cutout',
        enumType: 'BlendMode',
      });
    },
    CONVERTER_INTEGRATION_TIMEOUT
  );
});

describe('Converter integration (sample-card.zip)', () => {
  it(
    'converts card and card-stack objects',
    async () => {
      const converted = await loadConvertedFromZip(SAMPLE_CARD_ZIP_PATH);
      const flattened = flattenObjects(converted);

      const cards = flattened.filter((obj) => {
        const hasGrabbable = obj.components.some(
          (c) => c.type === '[FrooxEngine]FrooxEngine.Grabbable'
        );
        const hasCardCollider = obj.components.some(
          (c) =>
            c.type === '[FrooxEngine]FrooxEngine.BoxCollider' &&
            (c.fields.Size as { value?: { y?: number } }).value?.y === 0.01
        );
        const front = obj.children.find((c) => c.id.endsWith('-front'));
        const back = obj.children.find((c) => c.id.endsWith('-back'));
        return hasGrabbable && hasCardCollider && !!front && !!back;
      });
      const stacks = flattened.filter((obj) =>
        obj.components.some(
          (c) =>
            c.type === '[FrooxEngine]FrooxEngine.BoxCollider' &&
            (c.fields.Size as { value?: { y?: number } }).value?.y === 0.05
        )
      );

      expect(cards.length).toBeGreaterThan(0);
      expect(stacks.length).toBeGreaterThan(0);
    },
    CONVERTER_INTEGRATION_TIMEOUT
  );
});

describe('Converter integration (sample-mapmask.zip)', () => {
  it(
    'converts table-mask objects with alpha blend and thin collider',
    async () => {
      const converted = await loadConvertedFromZip(SAMPLE_MAPMASK_ZIP_PATH);
      const flattened = flattenObjects(converted);

      const masks = flattened.filter((obj) => {
        const material = obj.components.find(
          (c) => c.type === '[FrooxEngine]FrooxEngine.XiexeToonMaterial'
        );
        const collider = obj.components.find(
          (c) => c.type === '[FrooxEngine]FrooxEngine.BoxCollider'
        );
        const blendMode = (material?.fields.BlendMode as { value?: string } | undefined)?.value;
        const colliderZ = (collider?.fields.Size as { value?: { z?: number } } | undefined)?.value
          ?.z;
        return obj.rotation.x === 90 && blendMode === 'Alpha' && colliderZ === 0.01;
      });

      expect(masks.length).toBeGreaterThan(0);
    },
    CONVERTER_INTEGRATION_TIMEOUT
  );
});

describe('Converter integration (sample-terrain.zip)', () => {
  it(
    'converts terrain objects with top and walls child slots',
    async () => {
      const converted = await loadConvertedFromZip(SAMPLE_TERRAIN_ZIP_PATH);
      const flattened = flattenObjects(converted);

      const terrains = flattened.filter((obj) => {
        const top = obj.children.find((c) => c.id.endsWith('-top'));
        const walls = obj.children.find((c) => c.id.endsWith('-walls'));
        const hasCollider = obj.components.some(
          (c) => c.type === '[FrooxEngine]FrooxEngine.BoxCollider'
        );
        return !!top && !!walls && hasCollider;
      });

      expect(terrains.length).toBeGreaterThan(0);
      expect(
        terrains.some((terrain) =>
          terrain.components.some((c) => c.type === '[FrooxEngine]FrooxEngine.Grabbable')
        )
      ).toBe(true);
    },
    CONVERTER_INTEGRATION_TIMEOUT
  );
});
