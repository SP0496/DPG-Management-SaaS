import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  onRetry,
}) => {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.row}>
        <Ionicons name="warning" size={20} color={COLORS.tangerineHover} />
        <Text style={styles.message}>{message}</Text>
      </View>
      {(onRetry || onDismiss) ? (
        <View style={styles.actions}>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.actionBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
          {onDismiss ? (
            <Pressable onPress={onDismiss} style={styles.actionBtn}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.tangerineTint,
    borderWidth: 1.5,
    borderColor: COLORS.tangerine,
    borderRadius: RADII.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.bodyMedium,
    flex: 1,
    color: COLORS.midnightNavy,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  actionBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tangerineHover,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.midnightNavyMuted,
  },
});
