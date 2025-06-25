import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    console.log('🔄 [LoadingScreen] LoadingScreen component mounted');
    return () => {
      console.log('🗑️ [LoadingScreen] LoadingScreen component unmounted');
    };
  }, []);

  console.log('🎬 [LoadingScreen] LoadingScreen rendering...');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desert Zen</Text>
      <Text style={styles.subtitle}>Meditations</Text>
      <ActivityIndicator
        size="large"
        color={theme.colors.accent}
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>Loading your meditation journey...</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 48,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 24,
      fontFamily: 'Lora-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 48,
      textAlign: 'center',
    },
    spinner: {
      marginBottom: 24,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
