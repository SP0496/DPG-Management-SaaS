import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';

interface LoadingViewProps {
  message?: string;
  fullscreen?: boolean;
  overlay?: boolean;
  visible?: boolean;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Loading workspace...',
  fullscreen = false,
  overlay = false,
  visible = true,
}) => {
  if (!visible) return null;

  const content = (
    <View style={[styles.box, fullscreen && styles.fullscreen]}>
      <View style={styles.spinnerCard}>
        <ActivityIndicator size="large" color={COLORS.tangerine} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent animationType="fade" visible={visible}>
        <View style={styles.modalBackdrop}>{content}</View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  box: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: COLORS.iceBlue,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 43, 74, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  spinnerCard: {
    backgroundColor: COLORS.iceBlueLight,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
    minWidth: 220,
  },
  text: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
  },
});
