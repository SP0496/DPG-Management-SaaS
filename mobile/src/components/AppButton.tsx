import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  iconName,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const textColor =
    isDisabled
      ? COLORS.disabledText
      : variant === 'secondary'
        ? COLORS.iceBlue
        : COLORS.midnightNavy;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        pressed && !isDisabled && variant === 'primary' && styles.primaryPressed,
        pressed && !isDisabled && variant === 'secondary' && styles.secondaryPressed,
        pressed && !isDisabled && variant === 'outline' && styles.outlinePressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {iconName && <Ionicons name={iconName} size={18} color={textColor} />}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  primary: {
    backgroundColor: COLORS.tangerine,
  },
  primaryPressed: {
    backgroundColor: COLORS.tangerineHover,
  },
  secondary: {
    backgroundColor: COLORS.midnightNavy,
  },
  secondaryPressed: {
    backgroundColor: COLORS.midnightNavyHover,
  },
  outline: {
    backgroundColor: COLORS.iceBlue,
    borderWidth: 1.5,
    borderColor: COLORS.midnightNavy,
  },
  outlinePressed: {
    backgroundColor: COLORS.iceBlueShade,
  },
  disabled: {
    backgroundColor: COLORS.disabledBg,
    borderColor: COLORS.disabledBg,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});
