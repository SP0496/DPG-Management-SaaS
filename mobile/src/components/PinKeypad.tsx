import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';

interface PinKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  testIDPrefix?: string;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  value,
  onChange,
  maxLength = 6,
  disabled = false,
  testIDPrefix = 'pin',
}) => {
  const handleDigitPress = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  };

  const handleDeletePress = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', 'DEL'],
  ];

  return (
    <View style={styles.container}>
      {/* PIN dot indicators */}
      <View style={styles.dotsRow}>
        {Array.from({ length: maxLength }).map((_, idx) => {
          const isFilled = idx < value.length;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                isFilled ? styles.dotFilled : styles.dotEmpty,
                disabled ? styles.dotDisabled : null,
              ]}
              testID={`${testIDPrefix}-dot-${idx}`}
            />
          );
        })}
      </View>

      {/* Numeric Keypad Grid */}
      <View style={styles.keypadGrid}>
        {keys.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((key) => {
              if (key === 'DEL') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.keyButton, styles.actionButton, disabled && styles.keyDisabled]}
                    onPress={handleDeletePress}
                    disabled={disabled || value.length === 0}
                    accessibilityLabel="Delete digit"
                    testID={`${testIDPrefix}-key-del`}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={disabled || value.length === 0 ? COLORS.disabledText : COLORS.midnightNavy}
                    />
                  </TouchableOpacity>
                );
              }
              if (key === 'C') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.keyButton, styles.actionButton, disabled && styles.keyDisabled]}
                    onPress={handleClear}
                    disabled={disabled || value.length === 0}
                    accessibilityLabel="Clear PIN"
                    testID={`${testIDPrefix}-key-clear`}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        (disabled || value.length === 0) && styles.textDisabled,
                      ]}
                    >
                      CLEAR
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.keyButton, disabled && styles.keyDisabled]}
                  onPress={() => handleDigitPress(key)}
                  disabled={disabled}
                  accessibilityLabel={`Digit ${key}`}
                  testID={`${testIDPrefix}-key-${key}`}
                >
                  <Text style={[styles.keyText, disabled && styles.textDisabled]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dotEmpty: {
    borderColor: COLORS.navyBorder,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    borderColor: COLORS.tangerine,
    backgroundColor: COLORS.tangerine,
  },
  dotDisabled: {
    borderColor: COLORS.disabledBg,
    backgroundColor: COLORS.disabledBg,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 290,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  keyButton: {
    flex: 1,
    height: 60,
    borderRadius: RADII.md,
    backgroundColor: COLORS.iceBlueLight,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.iceBlue,
  },
  keyDisabled: {
    backgroundColor: COLORS.disabledBg,
    borderColor: COLORS.disabledBg,
    opacity: 0.6,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    letterSpacing: 0.5,
  },
  textDisabled: {
    color: COLORS.disabledText,
  },
});
