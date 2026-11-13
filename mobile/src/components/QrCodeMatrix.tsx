import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'qrcode';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';

interface QrCodeMatrixProps {
  value: string;
  size?: number;
  caption?: string;
}

export const QrCodeMatrix: React.FC<QrCodeMatrixProps> = ({
  value,
  size = 188,
  caption = 'Scan with any UPI app',
}) => {
  const matrix = useMemo(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      const rows: boolean[][] = [];
      for (let r = 0; r < count; r += 1) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c += 1) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        rows.push(row);
      }
      return rows;
    } catch {
      return [];
    }
  }, [value]);

  if (matrix.length === 0) {
    return (
      <View style={styles.fallbackBox}>
        <Text style={styles.fallbackText}>UPI QR preview unavailable</Text>
      </View>
    );
  }

  const moduleSize = Math.max(3, Math.floor(size / matrix.length));
  const actualSize = moduleSize * matrix.length;

  return (
    <View style={styles.container} testID="upi-qr-matrix">
      <View style={[styles.qrFrame, { width: actualSize + 16, height: actualSize + 16 }]}>
        {matrix.map((row, rIdx) => (
          <View key={`qr-r-${rIdx}`} style={{ flexDirection: 'row' }}>
            {row.map((dark, cIdx) => (
              <View
                key={`qr-c-${rIdx}-${cIdx}`}
                style={{
                  width: moduleSize,
                  height: moduleSize,
                  backgroundColor: dark ? COLORS.midnightNavy : COLORS.iceBlueLight,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  qrFrame: {
    padding: 8,
    backgroundColor: COLORS.iceBlueLight,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.midnightNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.midnightNavyMuted,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  fallbackBox: {
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    alignItems: 'center',
  },
  fallbackText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.midnightNavyMuted,
  },
});
