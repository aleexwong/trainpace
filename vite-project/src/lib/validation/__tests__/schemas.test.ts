/**
 * Validation Schemas Tests
 *
 * Unit tests for Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  paceInputsSchema,
  fuelPlanInputsSchema,
  registerSchema,
  emailSchema,
  passwordSchema,
  safeParse,
  validateOrThrow,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('paceInputsSchema', () => {
    it('validates correct pace inputs', () => {
      const validInput = {
        distance: 42.195,
        units: 'km',
        hours: 3,
        minutes: 30,
        seconds: 0,
      };

      const result = paceInputsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects zero time', () => {
      const invalidInput = {
        distance: 42.195,
        units: 'km',
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      const result = paceInputsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects negative distance', () => {
      const invalidInput = {
        distance: -5,
        units: 'km',
        hours: 1,
        minutes: 0,
        seconds: 0,
      };

      const result = paceInputsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects invalid units', () => {
      const invalidInput = {
        distance: 10,
        units: 'meters',
        hours: 1,
        minutes: 0,
        seconds: 0,
      };

      const result = paceInputsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('accepts optional age within range', () => {
      const validInput = {
        distance: 10,
        units: 'km',
        hours: 1,
        minutes: 0,
        seconds: 0,
        age: 35,
      };

      const result = paceInputsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects age outside range', () => {
      const invalidInput = {
        distance: 10,
        units: 'km',
        hours: 1,
        minutes: 0,
        seconds: 0,
        age: 5,
      };

      const result = paceInputsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('fuelPlanInputsSchema', () => {
    it('validates correct fuel plan inputs', () => {
      const validInput = {
        raceType: 'Full',
        weight: 70,
        timeHours: 3,
        timeMinutes: 30,
      };

      const result = fuelPlanInputsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects invalid race type', () => {
      const invalidInput = {
        raceType: 'Sprint',
        weight: 70,
        timeHours: 1,
        timeMinutes: 0,
      };

      const result = fuelPlanInputsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects user context over 2000 characters', () => {
      const invalidInput = {
        raceType: 'Full',
        weight: 70,
        timeHours: 3,
        timeMinutes: 30,
        userContext: 'a'.repeat(2001),
      };

      const result = fuelPlanInputsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = registerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('trims whitespace from name', () => {
      const input = {
        name: '  John Doe  ',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('rejects empty name', () => {
      const invalidInput = {
        name: '',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = registerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'no@',
        'spaces in@email.com',
      ];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'Password1',
        'MySecure123',
        'AbCdEf123456',
      ];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('rejects weak passwords', () => {
      const weakPasswords = [
        'short1A',      // Too short
        'nouppercase1', // No uppercase
        'NOLOWERCASE1', // No lowercase
        'NoNumbers',    // No numbers
      ];

      weakPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('safeParse utility', () => {
    it('returns success with data on valid input', () => {
      const result = safeParse(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('returns failure with errors on invalid input', () => {
      const result = safeParse(emailSchema, 'invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateOrThrow utility', () => {
    it('returns data on valid input', () => {
      const result = validateOrThrow(emailSchema, 'test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('throws on invalid input', () => {
      expect(() => validateOrThrow(emailSchema, 'invalid')).toThrow();
    });

    it('uses custom error message when provided', () => {
      expect(() =>
        validateOrThrow(emailSchema, 'invalid', 'Custom error message')
      ).toThrow('Custom error message');
    });
  });
});
