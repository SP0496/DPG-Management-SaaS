import { z } from 'zod';

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

export const mobilePhoneSchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/\s+/g, '').trim())
    .refine(
      (val) => /^[6-9]\d{9}$/.test(val),
      'Enter a valid 10-digit Indian mobile number starting with 6-9'
    ),
});

export function isValidIndianMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits);
}

export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

export const otpSchema = z.object({
  otp: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => /^\d{6}$/.test(val), 'Enter the 6-digit verification code'),
});

export const createPropertySchema = z.object({
  name: z
    .string()
    .min(3, 'Property name must be at least 3 characters')
    .max(100, 'Property name cannot exceed 100 characters')
    .transform(sanitizeInput),
  address: z
    .string()
    .min(5, 'Street address is required')
    .max(200, 'Address cannot exceed 200 characters')
    .transform(sanitizeInput),
  city: z
    .string()
    .min(2, 'City name is required')
    .max(80)
    .transform(sanitizeInput),
  monthlyRentStarting: z
    .string()
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 1000, 'Enter rent of at least Rs. 1,000'),
});

export const createComplaintSchema = z.object({
  title: z
    .string()
    .min(4, 'Complaint title must be at least 4 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .transform(sanitizeInput),
  description: z
    .string()
    .min(10, 'Please describe the issue in at least 10 characters')
    .max(600, 'Description cannot exceed 600 characters')
    .transform(sanitizeInput),
});
