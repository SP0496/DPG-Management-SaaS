import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SecuritySetupModal } from '../components/SecuritySetupModal';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { AppLockScreen } from '../screens/auth/AppLockScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { COLORS } from '../theme/colors';
import { AuthNavigator } from './AuthNavigator';
import { OwnerNavigator } from './OwnerNavigator';
import { ResidentNavigator } from './ResidentNavigator';

const AppNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.iceBlue,
    card: COLORS.midnightNavy,
    text: COLORS.midnightNavy,
    border: COLORS.navyBorder,
    primary: COLORS.tangerine,
    notification: COLORS.tangerine,
  },
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isBootstrapping } = useAuth();
  const { isAppLocked } = useSecurity();

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer theme={AppNavigationTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  if (isAppLocked) {
    return <AppLockScreen />;
  }

  return (
    <NavigationContainer theme={AppNavigationTheme}>
      {user?.role === 'OWNER' ? <OwnerNavigator /> : <ResidentNavigator />}
      <SecuritySetupModal />
    </NavigationContainer>
  );
};
