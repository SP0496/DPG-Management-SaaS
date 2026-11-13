import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';

export const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Ionicons name="business" size={38} color={COLORS.iceBlue} />
      </View>
      <Text style={TYPOGRAPHY.h1}>DPG Manager</Text>
      <Text style={styles.subtitle}>Verifying encrypted session and account role...</Text>
      <ActivityIndicator size="large" color={COLORS.tangerine} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.iceBlue,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.midnightNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.midnightNavyMuted,
    textAlign: 'center',
  },
  spinner: {
    marginTop: SPACING.sm,
  },
});
