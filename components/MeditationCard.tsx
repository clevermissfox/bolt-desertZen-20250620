import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Clock, Heart } from 'lucide-react-native';
import type { Meditation } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface MeditationCardProps {
  meditation: Meditation;
  onPress: () => void;
  onFavoriteToggle: (event: any) => void;
  isFavorite: boolean;
  theme: any;
  layout?: 'column' | 'row';
}

export default function MeditationCard({
  meditation,
  onPress,
  onFavoriteToggle,
  isFavorite,
  theme,
  layout = 'column'
}: MeditationCardProps) {
  const styles = createStyles(theme, layout);

  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (layout === 'row') {
    return (
      <TouchableOpacity style={styles.cardRow} onPress={onPress}>
        <Image source={{ uri: meditation.imageUrl }} style={styles.imageRow} />
        
        <View style={styles.contentRow}>
          <View style={styles.textContent}>
            <Text style={styles.titleRow}>{meditation.title}</Text>
            <Text style={styles.descriptionRow}>{meditation.description}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>{meditation.length}</Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.categoryBadgeText}>{formatCategoryName(meditation.category)}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.favoriteButtonRow} onPress={onFavoriteToggle}>
            <Heart 
              size={18} 
              color={isFavorite ? theme.colors.accent : theme.colors.accent} 
              fill={isFavorite ? theme.colors.accent : 'transparent'} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // Column layout (default)
  return (
    <TouchableOpacity style={styles.cardColumn} onPress={onPress}>
      <Image source={{ uri: meditation.imageUrl }} style={styles.imageColumn} />
      
      <TouchableOpacity style={styles.favoriteButtonColumn} onPress={onFavoriteToggle}>
        <Heart 
          size={18} 
          color={isFavorite ? theme.colors.accent : theme.colors.accent} 
          fill={isFavorite ? theme.colors.accent : 'transparent'} 
        />
      </TouchableOpacity>
      
      <View style={styles.contentColumn}>
        <Text style={styles.titleColumn}>{meditation.title}</Text>
        <Text style={styles.descriptionColumn}>{meditation.description}</Text>
        <View style={styles.metaColumn}>
          <View style={styles.metaItem}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{meditation.length}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.categoryBadgeText}>{formatCategoryName(meditation.category)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, layout: 'column' | 'row') =>
  StyleSheet.create({
    // Column layout styles
    cardColumn: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      marginHorizontal: 24,
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      position: 'relative',
      overflow: 'hidden',
    },
    imageColumn: {
      width: '100%',
      height: 160,
    },
    contentColumn: {
      padding: 20,
    },
    titleColumn: {
      fontSize: 18,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 6,
    },
    descriptionColumn: {
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    metaColumn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    favoriteButtonColumn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      zIndex: 1,
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },

    // Row layout styles
    cardRow: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      marginHorizontal: 24,
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      flexDirection: 'row',
      overflow: 'hidden',
      minHeight: 120,
    },
    imageRow: {
      width: 120,
      height: '100%',
      minHeight: 120,
    },
    contentRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textContent: {
      flex: 1,
      padding: 16,
      paddingRight: 8,
    },
    titleRow: {
      fontSize: 16,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 4,
      lineHeight: 22,
    },
    descriptionRow: {
      fontSize: 13,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
      numberOfLines: 2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    favoriteButtonRow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      elevation: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },

    // Shared styles
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginLeft: layout === 'row' ? 0 : 'auto',
    },
    categoryBadgeText: {
      fontSize: 9,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
  });