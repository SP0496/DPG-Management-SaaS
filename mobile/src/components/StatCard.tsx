import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { AppCard } from './AppCard';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  iconName,
  accent = false,
  onPress,
}) => {
  return (
    <AppCard style={styles.card} highlighted={accent} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, accent ? styles.iconAccent : styles.iconNavy]}>
          <Ionicons
            name={iconName}
            size={18}
            color={accent ? COLORS.midnightNavy : COLORS.iceBlue}
          />
        </View>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={TYPOGRAPHY.caption} numberOfLines={1}>
        {label}
      </Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    gap: SPACING.xs + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: RADII.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNavy: {
    backgroundColor: COLORS.midnightNavy,
  },
  iconAccent: {
    backgroundColor: COLORS.tangerine,
  },
  caption: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tangerineHover,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
});
