import { z } from 'zod';

/**
 * Form Sanitization & XSS Defense Utilities.
 * Sanitizes input strings by neutralizing HTML tags, scripts, and pseudo-protocols.
 */

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/<[^>]+>/g, '') // Strip all HTML tags
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/on\w+=/gi, ''); // Strip inline event handlers (onerror, onload)
}

// Password Policy: min 10 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).{10,64}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(sanitizeInput),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

export const registerSchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(150, 'Organization name cannot exceed 150 characters')
    .transform(sanitizeInput),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(75)
    .transform(sanitizeInput),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(75)
    .transform(sanitizeInput),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(sanitizeInput),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .transform(sanitizeInput),
  password: z
    .string()
    .regex(
      passwordRegex,
      'Password must be 10-64 characters and include uppercase, lowercase, number, and special character'
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
