import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesPath = path.resolve(__dirname, 'google-services.json');
  const hasGoogleServices = fs.existsSync(googleServicesPath);

  const plugins = Array.isArray(config.plugins) ? [...config.plugins] : [];
  if (hasGoogleServices && !plugins.includes('@react-native-firebase/app')) {
    plugins.push('@react-native-firebase/app');
  }

  return {
    ...config,
    name: config.name ?? 'PG Management',
    slug: config.slug ?? 'pg-management-mobile',
    plugins,
    android: {
      ...config.android,
      package: config.android?.package ?? 'com.pgmanagement.saas',
      ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
    },
    extra: {
      ...(config.extra ?? {}),
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8080/api/v1',
      firebaseConfigured: hasGoogleServices,
    },
  };
};
