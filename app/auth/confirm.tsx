import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  ExternalLink,
  Smartphone,
} from 'lucide-react-native';
import Constants from 'expo-constants';

export default function ConfirmScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isExpoGo, setIsExpoGo] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    // Detect if running in Expo Go
    const isExpoGoApp = Constants.appOwnership === 'expo';
    setIsExpoGo(isExpoGoApp);
  }, []);

  const handleOpenApp = async () => {
    try {
      if (isExpoGo) {
        // For Expo Go, use the exp:// scheme with your project slug
        const expUrl = `exp://exp.host/@anonymous/desert-zen-meditations`;
        const canOpen = await Linking.canOpenURL(expUrl);
        if (canOpen) {
          await Linking.openURL(expUrl);
        } else {
          // Fallback to the custom scheme
          await Linking.openURL('desertzen://');
        }
      } else {
        // For standalone apps, use the custom scheme
        const canOpen = await Linking.canOpenURL('desertzen://');
        if (canOpen) {
          await Linking.openURL('desertzen://');
        } else {
          // If custom scheme doesn't work, show instructions
          console.log('Cannot open app with custom scheme');
        }
      }
    } catch (error) {
      console.error('Error opening app:', error);
    }
  };

  const handleContinueInBrowser = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={64} color={theme.colors.success} />
        </View>

        <Text style={styles.title}>Email Confirmed!</Text>
        <Text style={styles.description}>
          Your email has been successfully verified. You can now sign in to your
          Desert Zen account.
        </Text>

        <View style={styles.actionsContainer}>
          {Platform.OS !== 'web' ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenApp}
            >
              <Smartphone size={20} color="white" />
              <Text style={styles.primaryButtonText}>Open Desert Zen App</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinueInBrowser}
            >
              <Text style={styles.primaryButtonText}>Continue to App</Text>
            </TouchableOpacity>
          )}

          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContinueInBrowser}
            >
              <ExternalLink size={16} color={theme.colors.accent} />
              <Text style={styles.secondaryButtonText}>
                Continue in Browser
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <AlertCircle size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>
            If you're having trouble opening the app, you can continue using
            Desert Zen in your browser.
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      maxWidth: 400,
      width: '100%',
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    iconContainer: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    actionsContainer: {
      width: '100%',
      gap: 12,
      marginBottom: 24,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 24,
      gap: 8,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    primaryButtonText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.accent,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 24,
      gap: 8,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: theme.colors.accent,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: `${theme.colors.textSecondary}10`,
      borderRadius: 12,
      padding: 12,
      gap: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
  });
