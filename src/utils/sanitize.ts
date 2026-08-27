import { z } from 'zod';

/**
 * Iteratively removes HTML tags (preventing nested bypasses like <<script>script>)
 * and HTML-encodes special characters.
 */
export function sanitizeString(val: string): string {
  let clean = val;
  // Iteratively strip HTML tags until no tags remain
  while (/<[^>]*>/.test(clean)) {
    clean = clean.replace(/<[^>]*>/g, '');
  }

  // Strip any unmatched or stray angle brackets
  clean = clean.replace(/[<>]/g, '');

  return clean
    .replace(/[&"']/g, c => ({
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;',
    }[c] || c))
    .trim();
}

/**
 * Reusable Zod schema for full_name fields with length checks and XSS sanitization.
 */
export const fullNameSchema = z.string()
  .min(2, 'Ad en az 2 karakter')
  .max(100, 'Ad en fazla 100 karakter')
  .transform(sanitizeString)
  .refine(val => val.length >= 2, 'Ad en az 2 karakter olmalı');
