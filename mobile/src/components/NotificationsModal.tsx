import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { NotificationItem } from '../types/domain';
import { formatDateShort } from '../utils/displayFormatters';

interface NotificationsModalProps {
  visible: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkRead: (notificationId: string) => Promise<void> | void;
  onMarkAllRead: () => Promise<void> | void;
  onOpenNotificationTarget?: (notification: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onOpenNotificationTarget,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 ? (
              <AppButton
                label="Mark All Read"
                variant="secondary"
                onPress={() => onMarkAllRead()}
                style={styles.smallBtn}
              />
            ) : null}
            <AppButton label="Close" onPress={onClose} style={styles.smallBtn} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {notifications.length === 0 ? (
            <EmptyState
              iconName="notifications-outline"
              title="No Notifications"
              message="Payment verification alerts, rent invoices, and status updates appear here."
            />
          ) : (
            notifications.map((item) => (
              <Pressable
                key={item.id}
                onPress={async () => {
                  if (!item.read) {
                    await onMarkRead(item.id);
                  }
                  if (onOpenNotificationTarget) {
                    onClose();
                    onOpenNotificationTarget(item);
                  }
                }}
              >
                <AppCard highlighted={!item.read} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={TYPOGRAPHY.h3}>{item.title}</Text>
                    <StatusBadge
                      label={item.read ? 'READ' : 'UNREAD'}
                      tone={item.read ? 'navy' : 'accent'}
                    />
                  </View>
                  <Text style={TYPOGRAPHY.body}>{item.body}</Text>
                  <View style={styles.rowBetween}>
                    <Text style={TYPOGRAPHY.caption}>{item.type}</Text>
                    <Text style={TYPOGRAPHY.caption}>{formatDateShort(item.createdAt)}</Text>
                  </View>
                  {item.transactionSubmissionId ? (
                    <Text style={styles.navHint}>Tap to open linked payment submission</Text>
                  ) : null}
                </AppCard>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.iceBlue },
  header: {
    backgroundColor: COLORS.midnightNavy,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.iceBlue },
  headerSub: { fontSize: 12, color: COLORS.tangerine, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: SPACING.xs },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  card: { gap: SPACING.xs, borderRadius: RADII.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  navHint: { fontSize: 12, fontWeight: '600', color: COLORS.tangerineHover, marginTop: 4 },
});
