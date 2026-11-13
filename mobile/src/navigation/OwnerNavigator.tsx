import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OwnerComplaintsScreen } from '../screens/owner/OwnerComplaintsScreen';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { OwnerPaymentsScreen } from '../screens/owner/OwnerPaymentsScreen';
import { OwnerProfileScreen } from '../screens/owner/OwnerProfileScreen';
import { PropertiesScreen } from '../screens/owner/PropertiesScreen';
import { RentManagementScreen } from '../screens/owner/RentManagementScreen';
import { ReportsScreen } from '../screens/owner/ReportsScreen';
import { ResidentsScreen } from '../screens/owner/ResidentsScreen';
import { RoomsBedsScreen } from '../screens/owner/RoomsBedsScreen';
import { COLORS } from '../theme/colors';

export type OwnerTabParamList = {
  OwnerDashboard: undefined;
  Properties: undefined;
  Residents: undefined;
  RentManagement: undefined;
  OwnerProfile: undefined;
};

export type OwnerStackParamList = {
  OwnerTabs: undefined;
  RoomsBeds: { propertyId?: string } | undefined;
  OwnerPayments: undefined;
  OwnerComplaints: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator<OwnerTabParamList>();
const Stack = createNativeStackNavigator<OwnerStackParamList>();

const OwnerTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.midnightNavy },
        headerTintColor: COLORS.iceBlue,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: COLORS.midnightNavy,
          borderTopColor: COLORS.midnightNavyHover,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.tangerine,
        tabBarInactiveTintColor: COLORS.navyBorder,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof OwnerTabParamList, keyof typeof Ionicons.glyphMap> = {
            OwnerDashboard: 'grid-outline',
            Properties: 'business-outline',
            Residents: 'people-outline',
            RentManagement: 'receipt-outline',
            OwnerProfile: 'person-circle-outline',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="OwnerDashboard"
        component={OwnerDashboardScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{ title: 'Properties', tabBarLabel: 'Properties' }}
      />
      <Tab.Screen
        name="Residents"
        component={ResidentsScreen}
        options={{ title: 'Residents', tabBarLabel: 'Residents' }}
      />
      <Tab.Screen
        name="RentManagement"
        component={RentManagementScreen}
        options={{ title: 'Rent & Dues', tabBarLabel: 'Rent' }}
      />
      <Tab.Screen
        name="OwnerProfile"
        component={OwnerProfileScreen}
        options={{ title: 'Owner Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const OwnerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.midnightNavy },
        headerTintColor: COLORS.iceBlue,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORS.iceBlue },
      }}
    >
      <Stack.Screen
        name="OwnerTabs"
        component={OwnerTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoomsBeds"
        component={RoomsBedsScreen}
        options={{ title: 'Rooms and Beds' }}
      />
      <Stack.Screen
        name="OwnerPayments"
        component={OwnerPaymentsScreen}
        options={{ title: 'Payments' }}
      />
      <Stack.Screen
        name="OwnerComplaints"
        component={OwnerComplaintsScreen}
        options={{ title: 'Complaints' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </Stack.Navigator>
  );
};
