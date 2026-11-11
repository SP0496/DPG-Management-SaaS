import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const TenantDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Resident Portal</Text>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.badge}>Resident</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Current Stay Details</Text>
        <Text style={styles.detailRow}>Room: 204 (Double Sharing)</Text>
        <Text style={styles.detailRow}>Bed Code: 204-A</Text>
        <Text style={styles.detailRow}>Monthly Rent: ₹8,500</Text>
        <Text style={styles.detailRow}>Rent Due Date: 5th of every month</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Billing & Dues</Text>
        <Text style={styles.statusSuccess}>Current Status: No Pending Dues</Text>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionText}>Raise Maintenance Ticket</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
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
  userName: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#065F46',
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 8,
    marginBottom: 16,
    borderColor: '#334155',
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  detailRow: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  statusSuccess: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 15,
  },
});
