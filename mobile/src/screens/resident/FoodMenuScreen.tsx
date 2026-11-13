import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';

export const FoodMenuScreen: React.FC = () => {
  const { foodMenu, loading, refreshing, error, clearError, refreshAll } = usePortalData();

  if (loading && foodMenu.length === 0) {
    return <LoadingView fullscreen message="Loading weekly PG food menu..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="Weekly Food Menu" />
      <Text style={TYPOGRAPHY.caption}>
        PG dining schedule published by your PG Owner. Timings: Breakfast 7:30-9:30 AM, Lunch
        12:30-2:30 PM, Evening Snacks 5:00-6:00 PM, Dinner 7:30-9:30 PM.
      </Text>

      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}

      {foodMenu.length === 0 ? (
        <EmptyState
          iconName="restaurant-outline"
          title="Weekly Food Menu Unavailable"
          message="Your weekly PG meal schedule appears automatically once your profile is linked to a PG property."
          actionLabel="Refresh Menu"
          onActionPress={refreshAll}
        />
      ) : (
        foodMenu.map((dayItem) => (
          <AppCard key={dayItem.day} style={styles.dayCard}>
            <View style={styles.headerRow}>
              <Text style={TYPOGRAPHY.h3}>{dayItem.day}</Text>
              <StatusBadge label="MESS MENU" tone="navy" />
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealLabel}>Breakfast</Text>
              <Text style={styles.mealValue}>{dayItem.breakfast}</Text>
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealLabel}>Lunch</Text>
              <Text style={styles.mealValue}>{dayItem.lunch}</Text>
            </View>
            {dayItem.snacks ? (
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Snacks</Text>
                <Text style={styles.mealValue}>{dayItem.snacks}</Text>
              </View>
            ) : null}
            <View style={styles.mealRow}>
              <Text style={styles.mealLabel}>Dinner</Text>
              <Text style={styles.mealValue}>{dayItem.dinner}</Text>
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  dayCard: { gap: SPACING.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  mealLabel: { fontSize: 12, fontWeight: '700', color: COLORS.tangerineHover, width: 76 },
  mealValue: { flex: 1, fontSize: 13, color: COLORS.midnightNavy },
});
