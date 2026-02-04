/**
 * Integration tests using sample Udonarium save data
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { extractZip } from './ZipExtractor';
import { parseXml, parseXmlFiles } from './XmlParser';

// Use process.cwd() since Vitest runs from project root
const SAMPLE_ZIP_PATH = path.join(process.cwd(), 'src', '__fixtures__', 'roomdata-sample.zip');

describe('Integration: Sample Save Data', () => {
  describe('extractZip with sample data', () => {
    it('should extract XML files from sample ZIP', () => {
      const result = extractZip(SAMPLE_ZIP_PATH);

      expect(result.xmlFiles.length).toBeGreaterThan(0);

      const fileNames = result.xmlFiles.map((f) => f.name);
      expect(fileNames).toContain('data');
      expect(fileNames).toContain('chat');
      expect(fileNames).toContain('summary');
    });

    it('should extract data.xml with content', () => {
      const result = extractZip(SAMPLE_ZIP_PATH);

      const dataFile = result.xmlFiles.find((f) => f.name === 'data');
      expect(dataFile).toBeDefined();
      expect(dataFile!.data.length).toBeGreaterThan(0);

      const content = dataFile!.data.toString('utf-8');
      expect(content).toContain('<room>');
      expect(content).toContain('<character');
      expect(content).toContain('<terrain');
    });
  });

  describe('parseXml with sample data.xml', () => {
    it('should parse data.xml and extract objects', () => {
      const extracted = extractZip(SAMPLE_ZIP_PATH);
      const dataFile = extracted.xmlFiles.find((f) => f.name === 'data');
      expect(dataFile).toBeDefined();

      const content = dataFile!.data.toString('utf-8');
      const result = parseXml(content, 'data.xml');

      // Should not have parsing errors
      expect(result.errors).toHaveLength(0);

      // Log for debugging
      console.log(
        'Parsed objects:',
        result.objects.map((o) => ({ type: o.type, name: o.name }))
      );
    });

    it('should handle room wrapper element', () => {
      // The sample data wraps everything in <room>, which may affect parsing
      const extracted = extractZip(SAMPLE_ZIP_PATH);
      const dataFile = extracted.xmlFiles.find((f) => f.name === 'data');
      const content = dataFile!.data.toString('utf-8');

      // Verify room structure
      expect(content).toMatch(/<room>/);
      expect(content).toMatch(/<\/room>/);
    });
  });

  describe('parseXmlFiles with all sample files', () => {
    it('should parse all XML files from sample ZIP', () => {
      const extracted = extractZip(SAMPLE_ZIP_PATH);

      const result = parseXmlFiles(
        extracted.xmlFiles.map((f) => ({
          name: f.name,
          data: f.data,
        }))
      );

      // Log results for debugging
      console.log('Total objects parsed:', result.objects.length);
      console.log(
        'Object types:',
        result.objects.map((o) => o.type)
      );
      console.log('Errors:', result.errors);

      // Should complete without throwing
      expect(result).toBeDefined();
    });
  });

  describe('sample data structure validation', () => {
    it('should have characters with Japanese names', () => {
      const extracted = extractZip(SAMPLE_ZIP_PATH);
      const dataFile = extracted.xmlFiles.find((f) => f.name === 'data');
      const content = dataFile!.data.toString('utf-8');

      // Verify Japanese content exists
      expect(content).toContain('モンスターA');
      expect(content).toContain('モンスターB');
      expect(content).toContain('モンスターC');
    });

    it('should have terrain objects', () => {
      const extracted = extractZip(SAMPLE_ZIP_PATH);
      const dataFile = extracted.xmlFiles.find((f) => f.name === 'data');
      const content = dataFile!.data.toString('utf-8');

      expect(content).toContain('<terrain');
      expect(content).toContain('地形');
    });

    it('should have card and card-stack objects', () => {
      const extracted = extractZip(SAMPLE_ZIP_PATH);
      const dataFile = extracted.xmlFiles.find((f) => f.name === 'data');
      const content = dataFile!.data.toString('utf-8');

      expect(content).toContain('<card-stack');
      expect(content).toContain('<card ');
      expect(content).toContain('山札');
    });

    it('should have game-table', () => {
      const extracted = extractZip(SAMPLE_ZIP_PATH);
      const dataFile = extracted.xmlFiles.find((f) => f.name === 'data');
      const content = dataFile!.data.toString('utf-8');

      expect(content).toContain('<game-table');
      expect(content).toContain('最初のテーブル');
    });
  });
});
