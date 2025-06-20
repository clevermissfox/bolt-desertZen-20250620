import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function FloatingBolt() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handlePress = () => {
    Linking.openURL('https://bolt.new');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.content}>
        <Image 
          source={require('@/assets/images/builtWithBolt.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 120, // Above tab bar with proper spacing
      left: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      zIndex: 1000,
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    image: {
      width: 44,
      height: 44,
    },
  });