import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { useAuth } from '@/contexts/AuthContext';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';
import FloatingBolt from '@/components/FloatingBolt';
import LoadingScreen from '@/components/LoadingScreen';
import { useFonts } from 'expo-font';
import {
  Karla_400Regular,
  Karla_500Medium,
  Karla_400Regular_Italic,
  Karla_500Medium_Italic,
} from '@expo-google-fonts/karla';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_700Bold,
  Lora_400Regular_Italic,
  Lora_500Medium_Italic,
  Lora_700Bold_Italic,
} from '@expo-google-fonts/lora';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    'Karla-Regular': Karla_400Regular,
    'Karla-Medium': Karla_500Medium,
    'Karla-RegularItalic': Karla_400Regular_Italic,
    'Karla-MediumItalic': Karla_500Medium_Italic,
    'Lora-Regular': Lora_400Regular,
    'Lora-Medium': Lora_500Medium,
    'Lora-Bold': Lora_700Bold,
    'Lora-RegularItalic': Lora_400Regular_Italic,
    'Lora-MediumItalic': Lora_500Medium_Italic,
    'Lora-BoldItalic': Lora_700Bold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <AudioProvider>
        <AuthWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth/index" />
            <Stack.Screen name="auth/bridge" />
            <Stack.Screen name="meditation/index" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <FloatingAudioPlayer />
          <FloatingBolt />
          <StatusBar style="auto" />
        </AuthWrapper>
      </AudioProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}