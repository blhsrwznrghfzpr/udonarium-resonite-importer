import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { extractZip, getImageByIdentifier, ExtractedFile } from './ZipExtractor';

describe('ZipExtractor', () => {
  let tempDir: string;
  let testZipPath: string;

  beforeAll(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zipextractor-test-'));

    // Create a test ZIP file
    const zip = new AdmZip();

    // Add XML files
    zip.addFile('character1.xml', Buffer.from('<character name="test"/>'));
    zip.addFile('data/character2.xml', Buffer.from('<character name="test2"/>'));

    // Add image files
    zip.addFile('images/token.png', Buffer.from('PNG_DATA'));
    zip.addFile('images/card.jpg', Buffer.from('JPG_DATA'));
    zip.addFile('background.jpeg', Buffer.from('JPEG_DATA'));
    zip.addFile('icon.gif', Buffer.from('GIF_DATA'));
    zip.addFile('avatar.webp', Buffer.from('WEBP_DATA'));

    // Add unsupported files (should be ignored)
    zip.addFile('readme.txt', Buffer.from('Text file'));
    zip.addFile('data.json', Buffer.from('{}'));

    testZipPath = path.join(tempDir, 'test.zip');
    zip.writeZip(testZipPath);
  });

  afterAll(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('extractZip', () => {
    it('should extract XML files', () => {
      const result = extractZip(testZipPath);

      expect(result.xmlFiles).toHaveLength(2);
      expect(result.xmlFiles.map((f) => f.path)).toContain('character1.xml');
      expect(result.xmlFiles.map((f) => f.path)).toContain('data/character2.xml');
    });

    it('should extract image files with supported extensions', () => {
      const result = extractZip(testZipPath);

      expect(result.imageFiles).toHaveLength(5);

      const extensions = result.imageFiles.map((f) => path.extname(f.path).toLowerCase());
      expect(extensions).toContain('.png');
      expect(extensions).toContain('.jpg');
      expect(extensions).toContain('.jpeg');
      expect(extensions).toContain('.gif');
      expect(extensions).toContain('.webp');
    });

    it('should not include unsupported file types', () => {
      const result = extractZip(testZipPath);

      const allPaths = [...result.xmlFiles, ...result.imageFiles].map((f) => f.path);
      expect(allPaths).not.toContain('readme.txt');
      expect(allPaths).not.toContain('data.json');
    });

    it('should set correct file name without extension', () => {
      const result = extractZip(testZipPath);

      const pngFile = result.imageFiles.find((f) => f.path === 'images/token.png');
      expect(pngFile?.name).toBe('token');

      const xmlFile = result.xmlFiles.find((f) => f.path === 'character1.xml');
      expect(xmlFile?.name).toBe('character1');
    });

    it('should include file data as Buffer', () => {
      const result = extractZip(testZipPath);

      const xmlFile = result.xmlFiles.find((f) => f.path === 'character1.xml');
      expect(xmlFile?.data).toBeInstanceOf(Buffer);
      expect(xmlFile?.data.toString()).toBe('<character name="test"/>');
    });

    it('should handle empty ZIP file', () => {
      const emptyZip = new AdmZip();
      const emptyZipPath = path.join(tempDir, 'empty.zip');
      emptyZip.writeZip(emptyZipPath);

      const result = extractZip(emptyZipPath);

      expect(result.xmlFiles).toHaveLength(0);
      expect(result.imageFiles).toHaveLength(0);
    });

    it('should skip directories', () => {
      const zipWithDirs = new AdmZip();
      zipWithDirs.addFile('folder/', Buffer.alloc(0));
      zipWithDirs.addFile('folder/file.xml', Buffer.from('<data/>'));
      const dirZipPath = path.join(tempDir, 'withdir.zip');
      zipWithDirs.writeZip(dirZipPath);

      const result = extractZip(dirZipPath);

      expect(result.xmlFiles).toHaveLength(1);
      expect(result.xmlFiles[0].path).toBe('folder/file.xml');
    });

    it('should handle case-insensitive extensions', () => {
      const mixedCaseZip = new AdmZip();
      mixedCaseZip.addFile('upper.XML', Buffer.from('<data/>'));
      mixedCaseZip.addFile('mixed.Xml', Buffer.from('<data/>'));
      mixedCaseZip.addFile('image.PNG', Buffer.from('PNG'));
      mixedCaseZip.addFile('photo.JpG', Buffer.from('JPG'));
      const mixedCasePath = path.join(tempDir, 'mixed.zip');
      mixedCaseZip.writeZip(mixedCasePath);

      const result = extractZip(mixedCasePath);

      expect(result.xmlFiles).toHaveLength(2);
      expect(result.imageFiles).toHaveLength(2);
    });

    it('should throw error for invalid ZIP file', () => {
      const invalidPath = path.join(tempDir, 'invalid.zip');
      fs.writeFileSync(invalidPath, 'not a zip file');

      expect(() => extractZip(invalidPath)).toThrow();
    });

    it('should throw error for non-existent file', () => {
      expect(() => extractZip('/nonexistent/path.zip')).toThrow();
    });
  });

  describe('getImageByIdentifier', () => {
    const imageFiles: ExtractedFile[] = [
      { path: 'images/token123.png', name: 'token123', data: Buffer.from('a') },
      { path: 'backgrounds/bg_001.jpg', name: 'bg_001', data: Buffer.from('b') },
      { path: 'avatar.webp', name: 'avatar', data: Buffer.from('c') },
    ];

    it('should find image by exact name match', () => {
      const result = getImageByIdentifier(imageFiles, 'token123');
      expect(result?.name).toBe('token123');
    });

    it('should find image by path containing identifier', () => {
      const result = getImageByIdentifier(imageFiles, 'backgrounds');
      expect(result?.name).toBe('bg_001');
    });

    it('should return undefined when not found', () => {
      const result = getImageByIdentifier(imageFiles, 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return first match when multiple matches exist', () => {
      const filesWithDuplicates: ExtractedFile[] = [
        { path: 'folder1/image.png', name: 'image', data: Buffer.from('1') },
        { path: 'folder2/image.jpg', name: 'image', data: Buffer.from('2') },
      ];

      const result = getImageByIdentifier(filesWithDuplicates, 'image');
      expect(result?.path).toBe('folder1/image.png');
    });

    it('should handle empty array', () => {
      const result = getImageByIdentifier([], 'any');
      expect(result).toBeUndefined();
    });

    it('should match partial path', () => {
      const result = getImageByIdentifier(imageFiles, 'bg_001.jpg');
      expect(result?.name).toBe('bg_001');
    });
  });
});
