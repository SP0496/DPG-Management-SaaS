import React, { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/tokens';

interface AppCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  highlighted?: boolean;
  onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  highlighted = false,
  onPress,
}) => {
  const cardStyle = [
    styles.card,
    highlighted ? styles.highlighted : styles.standard,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  standard: {
    backgroundColor: COLORS.iceBlueLight,
    borderColor: COLORS.navyBorder,
  },
  highlighted: {
    backgroundColor: COLORS.tangerineTint,
    borderColor: COLORS.tangerine,
  },
  pressed: {
    backgroundColor: COLORS.iceBlueShade,
  },
});
