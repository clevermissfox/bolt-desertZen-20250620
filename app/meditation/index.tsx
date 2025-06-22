import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/contexts/ThemeContext';
import { useAudio } from '@/contexts/AudioContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  Heart,
  Clock,
  Volume2,
  Info,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function MeditationScreen() {
  const { theme } = useTheme();
  const {
    currentMeditation,
    isPlaying,
    position,
    duration,
    volume,
    setVolume,
    pauseAudio,
    resumeAudio,
    seekTo,
  } = useAudio();
  const { user, isFavorite, addToFavorites, removeFromFavorites } = useAuth();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    if (!currentMeditation) {
      router.back();
    }
  }, [currentMeditation, router]);

  if (!currentMeditation) {
    return null;
  }

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pauseAudio();
    } else {
      await resumeAudio();
    }
  };

  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  const handleSkipBack = async () => {
    const newPosition = Math.max(0, position - 15000); // Skip back 15 seconds
    await seekTo(newPosition);
  };

  const handleSkipForward = async () => {
    const newPosition = Math.min(duration, position + 15000); // Skip forward 15 seconds
    await seekTo(newPosition);
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (isFavorite(currentMeditation.id)) {
        await removeFromFavorites(currentMeditation.id);
      } else {
        await addToFavorites(currentMeditation.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleClose = () => {
    // Don't stop audio, just navigate back
    router.back();
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isUserFavorite = user && isFavorite(currentMeditation.id);
  const progress = duration > 0 ? position / duration : 0;

  // Calculate responsive dimensions
  const imageSize = Math.min(280, width - 80); // Ensure 40px padding on each side
  const controlsGap = Math.max(30, Math.min(60, (width - 240) / 3)); // Responsive gap with better minimum

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image with Overlay */}
      <Image
        source={{ uri: currentMeditation.imageUrl }}
        style={styles.backgroundImage}
        blurRadius={30}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
        style={styles.overlay}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Now Playing</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Info size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meditation Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: currentMeditation.imageUrl }}
              style={[
                styles.meditationImage,
                {
                  width: imageSize,
                  height: imageSize,
                  borderRadius: imageSize / 2,
                },
              ]}
            />
          </View>
        </View>

        {/* Meditation Info - Just Title */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{currentMeditation.title}</Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="white"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="white"
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={[styles.controlsContainer, { gap: controlsGap }]}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipBack}>
            <SkipBack size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            {isPlaying ? (
              <Pause size={36} color="white" fill="white" />
            ) : (
              <Play size={36} color="white" fill="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipForward}
          >
            <SkipForward size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Volume Control */}
        <View style={styles.volumeContainer}>
          <Volume2 size={20} color="rgba(255,255,255,0.7)" />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor="white"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="white"
          />
        </View>

        {/* Details Section */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>About this meditation</Text>
              <Text style={styles.description}>
                {currentMeditation.description}
              </Text>

              <View style={styles.metaContainer}>
                <View style={styles.detailMetaRow}>
                  <View style={styles.detailMetaItem}>
                    <Clock size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaLabel}>Duration</Text>
                    <Text style={styles.metaValue}>
                      {currentMeditation.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailMetaRow}>
                  <View style={styles.detailMetaItem}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    />
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue}>
                      {formatCategoryName(currentMeditation.category)}
                    </Text>
                  </View>
                </View>

                {/* Favorite in Details */}
                <View style={styles.detailMetaRow}>
                  <TouchableOpacity
                    style={styles.favoriteDetailRow}
                    onPress={handleFavorite}
                  >
                    <Heart
                      size={16}
                      color={
                        isUserFavorite
                          ? theme.colors.accent
                          : 'rgba(255,255,255,0.8)'
                      }
                      fill={
                        isUserFavorite ? theme.colors.accent : 'transparent'
                      }
                    />
                    <Text style={styles.metaLabel}>Favorite</Text>
                    <Text
                      style={[
                        styles.metaValue,
                        {
                          color: isUserFavorite
                            ? theme.colors.accent
                            : 'rgba(255,255,255,0.8)',
                        },
                      ]}
                    >
                      {isUserFavorite
                        ? 'Added to favorites'
                        : 'Add to favorites'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to use</Text>
                <Text style={styles.instructionsText}>
                  • Find a comfortable position{'\n'}• Close your eyes or soften
                  your gaze{'\n'}• Follow the guided instructions{'\n'}• Use the
                  skip buttons to go back/forward 15 seconds{'\n'}• Adjust
                  volume as needed
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatCategoryName(category: string) {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    backgroundImage: {
      position: 'absolute',
      width: width,
      height: height,
      resizeMode: 'cover',
    },
    overlay: {
      position: 'absolute',
      width: width,
      height: height,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: 'white',
      fontSize: 18,
      fontFamily: 'Lora-Bold',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    imageContainer: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
      paddingHorizontal: 20, // Ensure image has proper padding
    },
    imageWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    meditationImage: {
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    infoContainer: {
      alignItems: 'center',
      marginBottom: 40,
      paddingHorizontal: 20, // Add padding for title
    },
    title: {
      fontSize: Math.min(32, width * 0.08), // Responsive font size
      fontFamily: 'Lora-Bold',
      color: 'white',
      textAlign: 'center',
      paddingHorizontal: 20,
      lineHeight: Math.min(40, width * 0.1), // Responsive line height
    },
    progressContainer: {
      marginBottom: 40,
      paddingHorizontal: 16, // Add padding for sliders
    },
    slider: {
      width: '100%',
      height: 40,
    },
    sliderThumb: {
      width: 20,
      height: 20,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 8,
    },
    timeText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'rgba(255,255,255,0.8)',
    },
    controlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 30,
      paddingHorizontal: 40, // Ensure buttons never get cut off
    },
    playButton: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    skipButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    volumeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 30,
      paddingHorizontal: 16, // Add padding for volume controls
    },
    volumeSlider: {
      flex: 1,
      height: 30,
    },
    volumeThumb: {
      width: 16,
      height: 16,
      backgroundColor: 'white',
    },
    detailsContainer: {
      marginTop: 20,
    },
    detailsCard: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: 24,
      backdropFilter: 'blur(10px)',
    },
    detailsTitle: {
      fontSize: 20,
      fontFamily: 'Lora-Bold',
      color: 'white',
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: 'rgba(255,255,255,0.9)',
      lineHeight: 24,
      marginBottom: 24,
    },
    metaContainer: {
      gap: 16,
      marginBottom: 24,
    },
    detailMetaRow: {
      flexDirection: 'row',
    },
    detailMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    favoriteDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      paddingVertical: 4, // Add some touch area
    },
    categoryDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    metaLabel: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'rgba(255,255,255,0.7)',
      flex: 1,
    },
    metaValue: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
    instructionsContainer: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.2)',
      paddingTop: 20,
    },
    instructionsTitle: {
      fontSize: 18,
      fontFamily: 'Lora-Bold',
      color: 'white',
      marginBottom: 12,
    },
    instructionsText: {
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: 'rgba(255,255,255,0.8)',
      lineHeight: 22,
    },
  });
