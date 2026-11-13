import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/tokens';

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  selectedValue,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const selected = opt.value === selectedValue;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[styles.chip, selected ? styles.selectedChip : styles.unselectedChip]}
          >
            <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  selectedChip: {
    backgroundColor: COLORS.tangerine,
    borderColor: COLORS.tangerine,
  },
  unselectedChip: {
    backgroundColor: COLORS.iceBlueLight,
    borderColor: COLORS.navyBorder,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedLabel: {
    color: COLORS.midnightNavy,
  },
  unselectedLabel: {
    color: COLORS.midnightNavy,
  },
});
