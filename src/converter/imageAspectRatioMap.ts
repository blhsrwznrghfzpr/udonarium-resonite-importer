import sharp from 'sharp';
import { ExtractedFile } from '../parser/ZipExtractor';

/**
 * Build image aspect ratio map keyed by Udonarium image identifier.
 * ratio = height / width
 */
export async function buildImageAspectRatioMap(
  imageFiles: ExtractedFile[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  await Promise.all(
    imageFiles.map(async (file) => {
      try {
        const metadata = await sharp(file.data).metadata();
        const width = metadata.width;
        const height = metadata.height;
        if (!width || !height || width <= 0 || height <= 0) {
          return;
        }

        map.set(file.name, height / width);
      } catch {
        // Ignore unsupported/corrupted images and fall back to default card ratio.
      }
    })
  );

  return map;
}
