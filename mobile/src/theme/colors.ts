/**
 * Official 60-30-10 Design System Color Tokens.
 * - 60% Ice Blue (#EAF6FF): primary page, section, card, dashboard, and form surfaces
 * - 30% Midnight Navy (#142B4A): headings, body text, navigation chrome, icons, borders, secondary CTA
 * - 10% Tangerine (#FF8C42): primary CTA, active tab/nav indicator, focus borders, badges
 */
export const COLORS = {
  // 60% Primary: Ice Blue & subtle approved surface tints
  iceBlue: '#EAF6FF',
  iceBlueLight: '#F4FAFF',
  iceBlueShade: '#D5EBFC',

  // 30% Secondary: Midnight Navy & approved interactive hover/muted shades
  midnightNavy: '#142B4A',
  midnightNavyHover: '#1D3D63',
  midnightNavyMuted: '#3B567A',
  navyBorder: '#B9D6EC',

  // 10% Accent: Tangerine & approved interactive/tint shades
  tangerine: '#FF8C42',
  tangerineHover: '#E8752E',
  tangerineTint: '#FFF1E6',

  // Disabled State: Muted Neutral Gray
  disabledBg: '#D1D5DB',
  disabledText: '#6B7280',
} as const;
