import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const TYPOGRAPHY = StyleSheet.create({
  hero: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: COLORS.midnightNavy,
    letterSpacing: -0.4,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: COLORS.midnightNavy,
    letterSpacing: -0.2,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.midnightNavy,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: COLORS.midnightNavy,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: COLORS.midnightNavy,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: COLORS.midnightNavy,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: COLORS.midnightNavyMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: COLORS.midnightNavy,
    letterSpacing: 0.3,
  },
});
