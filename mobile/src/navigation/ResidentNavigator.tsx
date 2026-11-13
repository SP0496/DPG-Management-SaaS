import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AnnouncementsScreen } from '../screens/resident/AnnouncementsScreen';
import { FoodMenuScreen } from '../screens/resident/FoodMenuScreen';
import { MyPaymentsScreen } from '../screens/resident/MyPaymentsScreen';
import { MyRoomScreen } from '../screens/resident/MyRoomScreen';
import { PaymentHistoryScreen } from '../screens/resident/PaymentHistoryScreen';
import { ResidentComplaintsScreen } from '../screens/resident/ResidentComplaintsScreen';
import { ResidentHomeScreen } from '../screens/resident/ResidentHomeScreen';
import { ResidentProfileScreen } from '../screens/resident/ResidentProfileScreen';
import { COLORS } from '../theme/colors';

export type ResidentTabParamList = {
  ResidentHome: undefined;
  MyRoom: undefined;
  MyPayments: undefined;
  ResidentComplaints: undefined;
  ResidentProfile: undefined;
};

export type ResidentStackParamList = {
  ResidentTabs: undefined;
  PaymentHistory: undefined;
  Announcements: undefined;
  FoodMenu: undefined;
};

const Tab = createBottomTabNavigator<ResidentTabParamList>();
const Stack = createNativeStackNavigator<ResidentStackParamList>();

const ResidentTabNavigator: React.FC = () => {
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
          const iconMap: Record<keyof ResidentTabParamList, keyof typeof Ionicons.glyphMap> = {
            ResidentHome: 'home-outline',
            MyRoom: 'bed-outline',
            MyPayments: 'wallet-outline',
            ResidentComplaints: 'construct-outline',
            ResidentProfile: 'person-circle-outline',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ResidentHome"
        component={ResidentHomeScreen}
        options={{ title: 'Resident Home', tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="MyRoom"
        component={MyRoomScreen}
        options={{ title: 'My Room', tabBarLabel: 'My Room' }}
      />
      <Tab.Screen
        name="MyPayments"
        component={MyPaymentsScreen}
        options={{ title: 'My Payments', tabBarLabel: 'Payments' }}
      />
      <Tab.Screen
        name="ResidentComplaints"
        component={ResidentComplaintsScreen}
        options={{ title: 'Complaints', tabBarLabel: 'Complaints' }}
      />
      <Tab.Screen
        name="ResidentProfile"
        component={ResidentProfileScreen}
        options={{ title: 'Resident Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const ResidentNavigator: React.FC = () => {
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
        name="ResidentTabs"
        component={ResidentTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: 'Payment History' }}
      />
      <Stack.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ title: 'Announcements' }}
      />
      <Stack.Screen
        name="FoodMenu"
        component={FoodMenuScreen}
        options={{ title: 'Food Menu' }}
      />
    </Stack.Navigator>
  );
};
