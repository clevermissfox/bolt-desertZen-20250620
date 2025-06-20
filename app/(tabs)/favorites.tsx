import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { useMeditations } from '@/hooks/useMeditations';
import MeditationCard from '@/components/MeditationCard';
import { Heart, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const { user, isGuest, isFavorite, removeFromFavorites, favorites } = useAuth();
  const { playMeditation } = useAudio();
  const { meditations, loading, error, refreshData } = useMeditations();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const styles = createStyles(theme);

  const favoriteMeditations = user 
    ? meditations.filter(meditation => isFavorite(meditation.id))
    : [];

  const handlePlayMeditation = async (meditation: any) => {
    await playMeditation(meditation);
    router.push('/meditation');
  };

  const handleRemoveFavorite = async (meditationId: string, event: any) => {
    event.stopPropagation();
    try {
      await removeFromFavorites(meditationId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Determine layout based on screen width
  const useRowLayout = width >= 600;

  // Show guest prompt if user is not authenticated (either guest mode or no user)
  if (isGuest || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved meditations</Text>
        </View>
        
        <View style={styles.guestPrompt}>
          <Sparkles size={48} color={theme.colors.accent} />
          <Text style={styles.guestTitle}>Sign in to save favorites</Text>
          <Text style={styles.guestDescription}>
            Create an account to save your favorite meditations and access them anytime
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && meditations.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading favorites</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (favoriteMeditations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved meditations</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Heart size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>No favorites yet</Text>
          <Text style={styles.emptyStateDescription}>
            Tap the heart icon on any meditation to add it to your favorites
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Text style={styles.discoverButtonText}>Discover Meditations</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {favoriteMeditations.length} saved meditation{favoriteMeditations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favoriteMeditations.map((meditation) => (
          <MeditationCard
            key={meditation.id}
            meditation={meditation}
            onPress={() => handlePlayMeditation(meditation)}
            onFavoriteToggle={(event) => handleRemoveFavorite(meditation.id, event)}
            isFavorite={true}
            theme={theme}
            layout={useRowLayout ? 'row' : 'column'}
          />
        ))}
      </ScrollView>
    </View>
  );
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
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 24,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
    },
    guestPrompt: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    guestTitle: {
      fontSize: 28,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    guestDescription: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    signInButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      paddingHorizontal: 32,
      paddingVertical: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    signInButtonText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
      fontSize: 28,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateDescription: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    discoverButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      paddingHorizontal: 32,
      paddingVertical: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    discoverButtonText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
  });