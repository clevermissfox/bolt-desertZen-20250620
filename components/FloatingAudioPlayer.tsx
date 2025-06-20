import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAudio } from '@/contexts/AudioContext';
import { Play, Pause, Maximize2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function FloatingAudioPlayer() {
  const { theme } = useTheme();
  const { currentMeditation, isPlaying, pauseAudio, resumeAudio } = useAudio();
  const router = useRouter();
  const pathname = usePathname();

  const styles = createStyles(theme);

  // Don't show if no meditation is playing or if we're on the meditation screen
  if (!currentMeditation || pathname === '/meditation') {
    return null;
  }

  const handlePlayPause = async (event: any) => {
    event.stopPropagation();
    if (isPlaying) {
      await pauseAudio();
    } else {
      await resumeAudio();
    }
  };

  const handleExpand = () => {
    router.push('/meditation');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleExpand} activeOpacity={0.8}>
      <Image source={{ uri: currentMeditation.imageUrl }} style={styles.backgroundImage} />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          {isPlaying ? (
            <Pause size={20} color="white" fill="white" />
          ) : (
            <Play size={20} color="white" fill="white" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.expandButton} onPress={handleExpand}>
          <Maximize2 size={14} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 115, // Above tab bar with proper spacing
      right: 20,
      width: 80,
      height: 80,
      borderRadius: 16,
      overflow: 'hidden',
      zIndex: 1000,
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
    },
    expandButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });