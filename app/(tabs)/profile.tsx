import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { meditations } from '@/data/meditations';
import {
  User,
  Heart,
  Moon,
  Sun,
  LogOut,
  Settings,
  Clock,
  Target,
  TrendingUp,
  ChevronRight,
  Info,
  Database,
  Code,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isGuest, signOut, isFavorite } = useAuth();
  const router = useRouter();

  const styles = createStyles(theme);

  const favoriteCount = user
    ? meditations.filter((m) => isFavorite(m.id)).length
    : 0;
  const totalMeditationTime = user ? favoriteCount * 15 : 0; // Mock calculation

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show guest view if user is in guest mode OR if there's no user and not in guest mode
  const showGuestView = isGuest || (!user && !isGuest);

  if (showGuestView) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.guestScrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.guestSection}>
          <View style={styles.avatarContainer}>
            <User size={32} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>Welcome, Guest!</Text>
          <Text style={styles.guestDescription}>
            Sign in to track your progress and save favorites
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={20} color={theme.colors.textSecondary} />
              ) : (
                <Sun size={20} color={theme.colors.textSecondary} />
              )}
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.textSecondary,
                true: theme.colors.text,
              }}
              thumbColor={theme.colors.accent}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        {/* App Information Section - Moved to bottom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Info size={20} color={theme.colors.accent} />
              <Text style={styles.infoCardTitle}>Desert Zen Meditations</Text>
            </View>
            <Text style={styles.infoDescription}>
              Desert Zen is for anyone in need of healing, hope, and a gentle
              reminder that even in the harshest environments, wellness is
              attainable.
            </Text>

            <View style={styles.techDetails}>
              <View style={styles.techItem}>
                <Code size={16} color={theme.colors.textSecondary} />
                <Text style={styles.techLabel}>Platform</Text>
                <Text style={styles.techValue}>Bolt AI</Text>
              </View>
              <View style={styles.techItem}>
                <Database size={16} color={theme.colors.textSecondary} />
                <Text style={styles.techLabel}>Supabase</Text>
                <Text style={styles.techValueCode}>tzzslprrcyjzxmbkpmem</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Heart size={24} color={theme.colors.accent} />
          <Text style={styles.statNumber}>{favoriteCount}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color={theme.colors.accent} />
          <Text style={styles.statNumber}>{totalMeditationTime}m</Text>
          <Text style={styles.statLabel}>Meditation Time</Text>
        </View>
        <View style={styles.statCard}>
          <Target size={24} color={theme.colors.accent} />
          <Text style={styles.statNumber}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <TrendingUp size={20} color={theme.colors.textSecondary} />
            <Text style={styles.menuText}>Progress & Analytics</Text>
          </View>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Settings size={20} color={theme.colors.textSecondary} />
            <Text style={styles.menuText}>Meditation Settings</Text>
          </View>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            {isDark ? (
              <Moon size={20} color={theme.colors.textSecondary} />
            ) : (
              <Sun size={20} color={theme.colors.textSecondary} />
            )}
            <Text style={styles.menuText}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: theme.colors.textSecondary,
              true: theme.colors.text,
            }}
            thumbColor={theme.colors.accent}
            ios_backgroundColor={theme.colors.border}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="white" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Information Section - Moved to bottom */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info size={20} color={theme.colors.accent} />
            <Text style={styles.infoCardTitle}>Desert Zen Meditations</Text>
          </View>
          <Text style={styles.infoDescription}>
            Desert Zen is for anyone in need of healing, hope, and a gentle
            reminder that even in the harshest environments, wellness is
            attainable.
          </Text>

          <View style={styles.techDetails}>
            <View style={styles.techItem}>
              <Code size={16} color={theme.colors.textSecondary} />
              <Text style={styles.techLabel}>Platform</Text>
              <Text style={styles.techValue}>Bolt AI</Text>
            </View>
            <View style={styles.techItem}>
              <Database size={16} color={theme.colors.textSecondary} />
              <Text style={styles.techLabel}>Supabase</Text>
              <Text style={styles.techValueCode}>tzzslprrcyjzxmbkpmem</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    guestScrollContent: {
      flexGrow: 1,
      paddingBottom: 100,
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
    },
    guestSection: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      flex: 1,
      justifyContent: 'center',
      minHeight: 400, // Ensure minimum height for proper centering
      alignItems: 'center',
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    avatarText: {
      fontSize: 32,
      fontFamily: 'Lora-Bold',
      color: 'white',
    },
    guestTitle: {
      fontSize: 28,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
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
    userSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    userName: {
      fontSize: 28,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      marginBottom: 32,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    statNumber: {
      fontSize: 24,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
    },
    section: {
      marginHorizontal: 24,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    infoCardTitle: {
      fontSize: 18,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
    },
    infoDescription: {
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    techDetails: {
      gap: 12,
    },
    techItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    techLabel: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
      flex: 1,
    },
    techValue: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: theme.colors.text,
      fontWeight: '600',
    },
    techValueCode: {
      fontSize: 12,
      fontFamily: 'Karla-Medium',
      color: theme.colors.text,
      fontWeight: '600',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 12,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: theme.colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: theme.colors.text,
    },
    signOutButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      padding: 20,
      gap: 12,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    signOutText: {
      fontSize: 16,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
  });
