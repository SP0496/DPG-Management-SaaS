import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PortalDataProvider } from './src/context/PortalDataContext';
import { SecurityProvider } from './src/context/SecurityContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { COLORS } from './src/theme/colors';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <SecurityProvider isAuthenticated={isAuthenticated}>
      <PortalDataProvider>
        <StatusBar style="light" backgroundColor={COLORS.midnightNavy} />
        <RootNavigator />
      </PortalDataProvider>
    </SecurityProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
