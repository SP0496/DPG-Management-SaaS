import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  title,
  message,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={28} color={COLORS.midnightNavy} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onActionPress ? (
        <View style={styles.actionWrap}>
          <AppButton label={actionLabel} onPress={onActionPress} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.iceBlueLight,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    borderRadius: RADII.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.iceBlueShade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.midnightNavyMuted,
    textAlign: 'center',
  },
  actionWrap: {
    marginTop: SPACING.sm,
  },
});
