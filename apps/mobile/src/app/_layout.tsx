import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { AuthProvider } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase-env';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.foreground,
    border: colors.border,
    notification: colors.accent,
  },
};

function MissingConfig() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center', gap: 12 }}>
      <Text variant="heading" selectable>Firebase is not configured</Text>
      <Text variant="muted" selectable>
        Copy apps/mobile/.env.example to .env and fill in the EXPO_PUBLIC_FIREBASE_* values (the same as the
        Next app's NEXT_PUBLIC_FIREBASE_*), or set EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1. Then restart Metro.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  const { t } = useT();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      {!isFirebaseConfigured ? (
        <MissingConfig />
      ) : (
        <AuthProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.primary,
              headerTitleStyle: { fontFamily: fonts.semibold, color: colors.foreground },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="analyzing" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="review" options={{ title: t.review.title }} />
            <Stack.Screen name="entry/[id]" options={{ title: '' }} />
            <Stack.Screen name="badges" options={{ title: t.badges.title }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          </Stack>
        </AuthProvider>
      )}
    </ThemeProvider>
  );
}
