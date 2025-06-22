import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { useMeditations } from '@/hooks/useMeditations';
import MeditationCard from '@/components/MeditationCard';
import { Play, Clock, User, Moon, Sun, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const FEATURED_HEIGHT = 200;

export default function HomeScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isGuest, isFavorite, addToFavorites, removeFromFavorites } =
    useAuth();
  const { playMeditation } = useAudio();
  const { meditations, categories, loading, error, refreshData } =
    useMeditations();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(theme);

  const featuredMeditations = meditations.filter((m) => m.featured);
  const filteredMeditations = selectedCategory
    ? meditations.filter((m) => m.category === selectedCategory && !m.featured)
    : meditations.filter((m) => !m.featured);

  const handlePlayMeditation = async (meditation: any) => {
    await playMeditation(meditation);
    router.push('/meditation');
  };

  const handleFavoriteToggle = async (meditationId: string, event: any) => {
    event.stopPropagation();

    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (isFavorite(meditationId)) {
        await removeFromFavorites(meditationId);
      } else {
        await addToFavorites(meditationId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const greeting = user
    ? `Good ${getTimeOfDay()}, ${user.name}`
    : `Good ${getTimeOfDay()}`;

  // Determine layout based on screen width
  const useRowLayout = width >= 600;

  if (loading && meditations.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading meditations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading meditations</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Find your inner peace today</Text>
        </View>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          {isDark ? (
            <Sun size={24} color={theme.colors.text} />
          ) : (
            <Moon size={24} color={theme.colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Featured Section */}
      {featuredMeditations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredContainer}
          >
            {featuredMeditations.map((meditation, index) => (
              <TouchableOpacity
                key={meditation.id}
                style={[
                  styles.featuredCard,
                  { marginLeft: index === 0 ? 24 : 16 },
                ]}
                onPress={() => handlePlayMeditation(meditation)}
              >
                <Image
                  source={{ uri: meditation.imageUrl }}
                  style={styles.featuredImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.featuredOverlay}
                >
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle}>{meditation.title}</Text>
                    <View style={styles.featuredMeta}>
                      <Clock size={14} color="white" />
                      <Text style={styles.featuredDuration}>
                        {meditation.length}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.favoriteButtonFeatured}
                    onPress={(event) =>
                      handleFavoriteToggle(meditation.id, event)
                    }
                  >
                    <Heart
                      size={20}
                      color={
                        user && isFavorite(meditation.id)
                          ? theme.colors.accent
                          : theme.colors.accent
                      }
                      fill={
                        user && isFavorite(meditation.id)
                          ? theme.colors.accent
                          : 'transparent'
                      }
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
              { marginLeft: 24 },
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Meditation List */}
      <View style={[styles.section, { paddingBottom: 100 }]}>
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? categories.find((c) => c.id === selectedCategory)?.name ||
              'Meditations'
            : 'All Meditations'}
        </Text>
        {filteredMeditations.map((meditation) => (
          <MeditationCard
            key={meditation.id}
            meditation={meditation}
            onPress={() => handlePlayMeditation(meditation)}
            onFavoriteToggle={(event) =>
              handleFavoriteToggle(meditation.id, event)
            }
            isFavorite={user ? isFavorite(meditation.id) : false}
            theme={theme}
            layout={useRowLayout ? 'row' : 'column'}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    retryButtonText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 32,
    },
    greetingContainer: {
      flex: 1,
      paddingRight: 16,
    },
    greeting: {
      fontSize: 32,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
    },
    themeToggle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      flexShrink: 0,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 24,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    featuredContainer: {
      paddingRight: 24,
    },
    featuredCard: {
      width: CARD_WIDTH * 0.8,
      height: FEATURED_HEIGHT,
      borderRadius: 20,
      overflow: 'hidden',
      marginRight: 16,
      elevation: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    featuredImage: {
      width: '100%',
      height: '100%',
    },
    featuredOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: 20,
    },
    featuredContent: {
      flex: 1,
    },
    featuredTitle: {
      fontSize: 20,
      fontFamily: 'Lora-Bold',
      color: 'white',
      marginBottom: 8,
    },
    featuredMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featuredDuration: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    favoriteButtonFeatured: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
    },
    categoriesContainer: {
      paddingRight: 24,
    },
    categoryChip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      backgroundColor: theme.colors.card,
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    categoryText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
    },
    categoryTextActive: {
      color: 'white',
    },
  });
