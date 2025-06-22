import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { useMeditations } from '@/hooks/useMeditations';
import MeditationCard from '@/components/MeditationCard';
import { Search, Filter } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const { playMeditation } = useAudio();
  const { user, isFavorite, addToFavorites, removeFromFavorites } = useAuth();
  const { meditations, categories, loading, error, refreshData } =
    useMeditations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(theme);

  // Generate duration options from actual meditation data
  const durations = Array.from(new Set(meditations.map((m) => m.length))).sort(
    (a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return aNum - bNum;
    }
  );

  const filteredMeditations = meditations.filter((meditation) => {
    const matchesSearch =
      meditation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meditation.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || meditation.category === selectedCategory;

    const matchesDuration =
      !selectedDuration || meditation.length === selectedDuration;

    return matchesSearch && matchesCategory && matchesDuration;
  });

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

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDuration(null);
    setSearchQuery('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const hasActiveFilters = selectedCategory || selectedDuration || searchQuery;

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find the perfect meditation for you</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meditations..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter
            size={20}
            color={hasActiveFilters ? 'white' : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Categories</Text>
              <View style={styles.filterChips}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterChip,
                      selectedCategory === category.id &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === category.id &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Duration</Text>
              <View style={styles.filterChips}>
                {durations.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.filterChip,
                      selectedDuration === duration && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedDuration(
                        selectedDuration === duration ? null : duration
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedDuration === duration &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.resultsHeader}>
          {filteredMeditations.length} meditation
          {filteredMeditations.length !== 1 ? 's' : ''} found
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

        {filteredMeditations.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No meditations found</Text>
            <Text style={styles.emptyStateDescription}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
      gap: 12,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.text,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.accent,
    },
    filtersContainer: {
      maxHeight: 300,
      backgroundColor: theme.colors.card,
      marginHorizontal: 24,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    filterSection: {
      marginBottom: 20,
    },
    filterTitle: {
      fontSize: 18,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    filterChipText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
    },
    filterChipTextActive: {
      color: 'white',
    },
    clearButton: {
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.error,
    },
    clearButtonText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
    resultsContainer: {
      flex: 1,
    },
    resultsHeader: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
      fontSize: 24,
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
    },
  });
