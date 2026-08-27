import { sanitizeString, fullNameSchema } from '../sanitize';

describe('Sanitize Utility Tests', () => {
  describe('sanitizeString', () => {
    it('should strip basic HTML tags', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('alert(1)');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello World');
    });

    it('should strip nested recursive HTML tags to prevent bypasses', () => {
      expect(sanitizeString('<scr<script>ipt>alert(1)</scr</script>ipt>')).toBe('iptalert(1)ipt');
      expect(sanitizeString('<<script>script>alert(1)<</script>/script>')).toBe('scriptalert(1)/script');
      expect(sanitizeString('<<script>script>')).toBe('script');
    });

    it('should encode remaining special HTML characters', () => {
      expect(sanitizeString('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(sanitizeString('Quotes "test" and \'test\'')).toBe('Quotes &quot;test&quot; and &#x27;test&#x27;');
    });

    it('should trim leading and trailing whitespaces', () => {
      expect(sanitizeString('   Clean Name   ')).toBe('Clean Name');
    });
  });

  describe('fullNameSchema', () => {
    it('should validate and transform valid full names', async () => {
      const parsed = await fullNameSchema.parseAsync('  John Doe  ');
      expect(parsed).toBe('John Doe');
    });

    it('should sanitize HTML from full name', async () => {
      const parsed = await fullNameSchema.parseAsync('John <script>alert(1)</script> Doe');
      expect(parsed).toBe('John alert(1) Doe');
    });

    it('should reject names shorter than 2 characters after sanitization', async () => {
      await expect(fullNameSchema.parseAsync('<img src=x onerror=alert(1)>')).rejects.toThrow();
      await expect(fullNameSchema.parseAsync('  A  ')).rejects.toThrow();
    });

    it('should reject names longer than 100 characters', async () => {
      const longName = 'A'.repeat(101);
      await expect(fullNameSchema.parseAsync(longName)).rejects.toThrow();
    });
  });
});
