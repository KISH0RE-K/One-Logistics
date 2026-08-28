import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth';
import { colors } from '../src/theme';

/**
 * Root layout: providers plus the signed-in / signed-out gate.
 *
 * As on the web, this guard is presentation only - the Express API verifies
 * the JWT on every protected request and is the real boundary.
 */
function RootNavigator() {
  const { isSignedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabs = segments[0] === '(tabs)';

    if (!isSignedIn && inTabs) router.replace('/login');
    else if (isSignedIn && !inTabs) router.replace('/(tabs)');
  }, [isSignedIn, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brown,
  },
});
