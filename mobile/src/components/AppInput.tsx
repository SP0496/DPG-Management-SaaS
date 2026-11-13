import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  prefixText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  prefixText,
  iconName,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={TYPOGRAPHY.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.focusedBorder,
          Boolean(error) && styles.errorBorder,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={focused ? COLORS.tangerineHover : COLORS.midnightNavyMuted}
            style={styles.leftIcon}
          />
        )}
        {prefixText && (
          <View style={styles.prefixBadge}>
            <Text style={styles.prefixText}>{prefixText}</Text>
          </View>
        )}
        <TextInput
          placeholderTextColor={COLORS.midnightNavyMuted}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={COLORS.tangerineHover} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.iceBlue,
    borderWidth: 1.5,
    borderColor: COLORS.navyBorder,
    borderRadius: RADII.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  focusedBorder: {
    borderColor: COLORS.tangerine,
  },
  errorBorder: {
    borderColor: COLORS.tangerineHover,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  prefixBadge: {
    backgroundColor: COLORS.iceBlueShade,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.sm,
    marginRight: SPACING.sm,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.midnightNavy,
    paddingVertical: SPACING.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.tangerineHover,
  },
});
