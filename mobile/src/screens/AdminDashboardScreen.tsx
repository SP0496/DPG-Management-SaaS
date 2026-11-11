import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Property Admin Dashboard</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.badge}>{user?.role}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>87.5%</Text>
          <Text style={styles.statLabel}>Occupancy Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Active Properties</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₹45,000</Text>
          <Text style={styles.statLabel}>Pending Dues</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Open Complaints</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Multi-Tenant Status</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>• Zero-Trust Session Active</Text>
          <Text style={styles.infoText}>• Tenant Scoped: {user?.organizationId || 'Global'}</Text>
          <Text style={styles.infoText}>• Token Stored in Secure Keystore</Text>
          <Text style={styles.infoText}>• Rate Limiter Active (60 req/min)</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Secure Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#0F172A',
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A8A',
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 8,
    borderColor: '#334155',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
