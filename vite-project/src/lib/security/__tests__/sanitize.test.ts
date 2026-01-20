/**
 * Security Utilities Tests
 *
 * Unit tests for sanitization and security functions.
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeInternalUrl,
  sanitizeFileName,
  sanitizeQueryValue,
  sanitizeObject,
  secureRandomString,
} from '../sanitize';

describe('Security Utilities', () => {
  describe('escapeHtml', () => {
    it('escapes HTML entities', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('escapes ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('handles mixed content', () => {
      const input = '<div class="test">Hello & goodbye</div>';
      expect(escapeHtml(input)).toContain('&lt;div');
      expect(escapeHtml(input)).toContain('&amp;');
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('handles self-closing tags', () => {
      expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1Line 2');
    });

    it('handles nested tags', () => {
      expect(stripHtml('<div><span>Nested</span></div>')).toBe('Nested');
    });

    it('preserves text outside tags', () => {
      expect(stripHtml('Plain text')).toBe('Plain text');
    });
  });

  describe('sanitizeText', () => {
    it('removes null bytes', () => {
      expect(sanitizeText('Hello\0World')).toBe('HelloWorld');
    });

    it('removes control characters', () => {
      expect(sanitizeText('Hello\x00\x01\x02World')).toBe('HelloWorld');
    });

    it('preserves newlines by default', () => {
      expect(sanitizeText('Line1\nLine2')).toBe('Line1\nLine2');
    });

    it('removes newlines when disabled', () => {
      expect(sanitizeText('Line1\nLine2', { allowNewlines: false })).toBe('Line1 Line2');
    });

    it('trims by default', () => {
      expect(sanitizeText('  Hello  ')).toBe('Hello');
    });

    it('respects maxLength', () => {
      const result = sanitizeText('Hello World', { maxLength: 5 });
      expect(result.length).toBe(5);
      expect(result).toBe('Hello');
    });
  });

  describe('sanitizeUrl', () => {
    it('accepts valid http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('accepts valid https URLs', () => {
      expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('rejects javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('rejects data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
    });

    it('accepts mailto: protocol', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });
  });

  describe('sanitizeInternalUrl', () => {
    it('ensures path starts with /', () => {
      expect(sanitizeInternalUrl('path/to/page')).toBe('/path/to/page');
    });

    it('removes protocol', () => {
      expect(sanitizeInternalUrl('https://example.com/page')).toBe('/example.com/page');
    });

    it('prevents directory traversal', () => {
      const result = sanitizeInternalUrl('/path/../../../etc/passwd');
      expect(result).not.toContain('..');
    });

    it('removes double slashes', () => {
      expect(sanitizeInternalUrl('//path//to///page')).toBe('/path/to/page');
    });
  });

  describe('sanitizeFileName', () => {
    it('removes unsafe characters', () => {
      expect(sanitizeFileName('file<>:"/\\|?*.txt')).toBe('file_________.txt');
    });

    it('removes leading/trailing dots and spaces', () => {
      expect(sanitizeFileName('...file.txt...')).toBe('file.txt');
    });

    it('handles reserved names', () => {
      expect(sanitizeFileName('CON.txt')).toBe('_CON.txt');
    });

    it('respects maxLength', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName, { maxLength: 100 });
      expect(result.length).toBe(100);
      expect(result.endsWith('.txt')).toBe(true);
    });

    it('provides fallback for empty result', () => {
      expect(sanitizeFileName('...')).toBe('unnamed_file');
    });
  });

  describe('sanitizeQueryValue', () => {
    it('removes $ characters', () => {
      expect(sanitizeQueryValue('$where')).toBe('where');
    });

    it('removes dots', () => {
      expect(sanitizeQueryValue('field.subfield')).toBe('fieldsubfield');
    });

    it('removes slashes', () => {
      expect(sanitizeQueryValue('path/to/field')).toBe('pathtofield');
    });

    it('removes brackets', () => {
      expect(sanitizeQueryValue('field[0]')).toBe('field0');
    });

    it('trims whitespace', () => {
      expect(sanitizeQueryValue('  value  ')).toBe('value');
    });
  });

  describe('sanitizeObject', () => {
    it('sanitizes nested objects', () => {
      const input = {
        name: 'Test\0Name',
        nested: {
          value: '<script>alert(1)</script>',
        },
      };

      const result = sanitizeObject(input);
      expect(result.name).toBe('TestName');
    });

    it('sanitizes arrays', () => {
      const input = {
        items: ['item1\0', 'item2\x00'],
      };

      const result = sanitizeObject(input);
      expect(result.items).toEqual(['item1', 'item2']);
    });

    it('preserves numbers and booleans', () => {
      const input = {
        count: 42,
        active: true,
      };

      const result = sanitizeObject(input);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('sanitizes object keys', () => {
      const input: Record<string, string> = {
        'valid.key': 'value',
        '$special': 'value2',
      };

      const result = sanitizeObject(input) as Record<string, string>;
      expect(result['validkey']).toBe('value');
      expect(result['special']).toBe('value2');
    });

    it('respects maxDepth', () => {
      const deepObject = {
        l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } },
      };

      const result = sanitizeObject(deepObject, { maxDepth: 3 });
      expect(result.l1?.l2?.l3?.l4).toBeNull();
    });
  });

  describe('secureRandomString', () => {
    it('generates string of specified length', () => {
      const result = secureRandomString(16);
      expect(result.length).toBe(16);
    });

    it('uses default length of 32', () => {
      const result = secureRandomString();
      expect(result.length).toBe(32);
    });

    it('generates unique strings', () => {
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(secureRandomString(16));
      }
      expect(results.size).toBe(100);
    });

    it('only contains alphanumeric characters', () => {
      const result = secureRandomString(100);
      expect(/^[A-Za-z0-9]+$/.test(result)).toBe(true);
    });
  });
});
