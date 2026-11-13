import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, TYPOGRAPHY } from '../theme/tokens';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View style={styles.row}>
      <Text style={TYPOGRAPHY.h2}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tangerineHover,
  },
});
