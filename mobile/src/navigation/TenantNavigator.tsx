import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TenantDashboardScreen } from '../screens/TenantDashboardScreen';

export type TenantStackParamList = {
  TenantDashboard: undefined;
};

const Stack = createNativeStackNavigator<TenantStackParamList>();

export const TenantNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="TenantDashboard"
        component={TenantDashboardScreen}
        options={{ title: 'Resident Portal' }}
      />
    </Stack.Navigator>
  );
};
