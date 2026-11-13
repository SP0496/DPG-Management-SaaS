import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { COLORS } from '../theme/colors';

export type AuthStackParamList = {
  MobileLogin: undefined;
  OtpVerification: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
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
        name="MobileLogin"
        component={MobileLoginScreen}
        options={{ title: 'StayLedger PG' }}
      />
      <Stack.Screen
        name="OtpVerification"
        component={OtpVerificationScreen}
        options={{ title: 'OTP Verification' }}
      />
    </Stack.Navigator>
  );
};
