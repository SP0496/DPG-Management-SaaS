import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/tokens';

type BadgeTone = 'accent' | 'navy' | 'soft' | 'tint';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'soft' }) => {
  const containerStyle =
    tone === 'accent'
      ? styles.accentBg
      : tone === 'navy'
        ? styles.navyBg
        : tone === 'tint'
          ? styles.tintBg
          : styles.softBg;

  const textColor = tone === 'navy' ? COLORS.iceBlue : COLORS.midnightNavy;

  return (
    <View style={[styles.badge, containerStyle]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
    alignSelf: 'flex-start',
  },
  accentBg: {
    backgroundColor: COLORS.tangerine,
  },
  navyBg: {
    backgroundColor: COLORS.midnightNavy,
  },
  tintBg: {
    backgroundColor: COLORS.tangerineTint,
    borderWidth: 1,
    borderColor: COLORS.tangerine,
  },
  softBg: {
    backgroundColor: COLORS.iceBlueShade,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
