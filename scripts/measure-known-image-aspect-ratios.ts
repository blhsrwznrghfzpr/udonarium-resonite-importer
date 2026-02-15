import sharp from 'sharp';
import { KNOWN_IMAGES } from '../src/config/MappingConfig';

async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const bytes = await response.arrayBuffer();
  return Buffer.from(bytes);
}

async function main(): Promise<void> {
  console.log('Known image aspect ratio measurement');
  console.log('id\twidth\theight\tratio');

  for (const [id, known] of KNOWN_IMAGES) {
    try {
      const buffer = await fetchBuffer(known.url);
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width;
      const height = metadata.height;
      if (!width || !height) {
        console.log(`${id}\tN/A\tN/A\tERROR: missing width/height`);
        continue;
      }
      const ratio = height / width;
      console.log(`${id}\t${width}\t${height}\t${ratio.toFixed(6)}`);
    } catch (error) {
      console.log(`${id}\tN/A\tN/A\tERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

void main();
