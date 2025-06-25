import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  addToFavorites: (meditationId: string) => Promise<void>;
  removeFromFavorites: (meditationId: string) => Promise<void>;
  isFavorite: (meditationId: string) => boolean;
  favorites: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Add logging for loading state changes
  const setLoadingWithLog = useCallback((newLoading: boolean, context: string) => {
    console.log(`🔄 [AuthContext] Setting loading to ${newLoading} - Context: ${context}`);
    setLoading(newLoading);
  }, []);

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      console.log('👤 [AuthContext] Loading profile for user:', supabaseUser.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('❌ [AuthContext] Error loading profile:', error);

        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('🆕 [AuthContext] Profile not found, creating new profile...');

          const userName =
            supabaseUser.user_metadata?.name ||
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.email?.split('@')[0] ||
            'User';

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: userName,
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ [AuthContext] Error creating profile:', createError);
            setLoadingWithLog(false, 'loadUserProfile - create profile error');
            return;
          }

          if (newProfile) {
            console.log('✅ [AuthContext] Profile created successfully:', newProfile);
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
            });
            await loadFavorites(newProfile.id);
          }
        } else {
          setLoadingWithLog(false, 'loadUserProfile - other profile error');
          return;
        }
      } else if (profile) {
        console.log('✅ [AuthContext] Profile loaded successfully:', profile);
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
        });
        await loadFavorites(profile.id);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error in loadUserProfile:', error);
    } finally {
      console.log('🏁 [AuthContext] loadUserProfile finally block - setting loading to false');
      setLoadingWithLog(false, 'loadUserProfile - finally block');
    }
  }, [setLoadingWithLog]);

  const loadFavorites = useCallback(async (userId: string) => {
    try {
      console.log('❤️ [AuthContext] Loading favorites for user:', userId);
      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select('meditation_id')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [AuthContext] Error loading favorites:', error);
        return;
      }

      console.log('✅ [AuthContext] Favorites loaded:', favoritesData?.length || 0, 'items');
      setFavorites(favoritesData?.map((fav) => fav.meditation_id) || []);
    } catch (error) {
      console.error('❌ [AuthContext] Error in loadFavorites:', error);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const initializeAuth = async () => {
      try {
        console.log('🚀 [AuthContext] Initializing auth...');

        // Get existing session (don't handle URL params here anymore)
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ [AuthContext] Error getting initial session:', error);
        }

        if (isCancelled) {
          console.log('🚫 [AuthContext] initializeAuth cancelled');
          return;
        }

        console.log(
          '📋 [AuthContext] Initial session:',
          initialSession?.user?.id || 'No session'
        );

        if (initialSession?.user) {
          console.log('👤 [AuthContext] User found in initial session, loading profile...');
          setSession(initialSession);
          setIsGuest(false);
          await loadUserProfile(initialSession.user);
        } else {
          console.log('👤 [AuthContext] No user in initial session, setting loading to false');
          setLoadingWithLog(false, 'initializeAuth - no initial session');
        }

        console.log('✅ [AuthContext] Setting initialized to true');
        setInitialized(true);
      } catch (error) {
        console.error('❌ [AuthContext] Error initializing auth:', error);
        if (!isCancelled) {
          setLoadingWithLog(false, 'initializeAuth - error');
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isCancelled) {
        console.log('🚫 [AuthContext] onAuthStateChange cancelled');
        return;
      }

      console.log(
        '🔄 [AuthContext] Auth state changed:',
        event,
        newSession?.user?.id || 'No session'
      );

      setSession(newSession);

      if (newSession?.user) {
        console.log('👤 [AuthContext] New user session detected, setting loading to true and loading profile...');
        setIsGuest(false);
        setLoadingWithLog(true, 'onAuthStateChange - new user session');
        await loadUserProfile(newSession.user);
      } else {
        console.log('👤 [AuthContext] No user in new session, clearing user data and setting loading to false');
        setUser(null);
        setFavorites([]);
        setLoadingWithLog(false, 'onAuthStateChange - no user session');
        // Don't automatically set guest mode when user signs out
      }
    });

    return () => {
      console.log('🧹 [AuthContext] Cleanup - cancelling auth initialization');
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [loadUserProfile, setLoadingWithLog]);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AuthContext] Attempting to sign in with email:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    console.log('✅ [AuthContext] Sign in successful:', data.user?.id);
    setIsGuest(false);

    // The auth state change listener will handle loading the profile
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('📝 [AuthContext] Attempting to sign up with email:', email);

    // Use the external bridge page for email confirmation
    const redirectUrl = 'https://desert-zenmeditations.com/confirm-signup/';
    console.log('🔗 [AuthContext] Using bridge page redirect URL for signup:', redirectUrl);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw error;
    }

    // Check if user and session are both null (indicates existing user or email enumeration protection)
    if (!data.user && !data.session) {
      // Check if a profile already exists with this email
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingProfile && !profileError) {
        // User already exists
        throw new Error('User already registered');
      }
      
      // If no existing profile found, it's a new user who needs email confirmation
      // This is the normal flow for new users
    }

    console.log('✅ [AuthContext] Sign up successful:', data.user?.id);
    setIsGuest(false);

    // Don't set loading state here - let the auth screen handle the UI
    // The auth state change listener will handle loading the profile if email is auto-confirmed
  };

  const resetPassword = async (email: string) => {
    try {
      // Use the external bridge page for password reset
      const redirectUrl = 'https://desert-zenmeditations.com/confirm-signup/';
      console.log('🔗 [AuthContext] Using bridge page redirect URL for password reset:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      console.log('📧 [AuthContext] Password reset email sent successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Reset password error:', error);
      throw error;
    }
  };

  const updateUserPassword = async (password: string) => {
    try {
      console.log('🔑 [AuthContext] Updating user password...');

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('❌ [AuthContext] Error updating password:', error);
        throw error;
      }

      console.log('✅ [AuthContext] Password updated successfully');
      // Don't return data - function should return void
    } catch (error) {
      console.error('❌ [AuthContext] Update password error:', error);
      throw error;
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      console.log('📧 [AuthContext] Resending confirmation email to:', email);

      // Use the external bridge page for email confirmation
      const redirectUrl = 'https://desert-zenmeditations.com/confirm-signup/';
      console.log(
        '🔗 [AuthContext] Using bridge page redirect URL for resend confirmation:',
        redirectUrl
      );

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      console.log('✅ [AuthContext] Confirmation email resent successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Resend confirmation email error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 [AuthContext] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      setFavorites([]);
      setIsGuest(false);
    } catch (error) {
      console.error('❌ [AuthContext] Error signing out:', error);
      throw error;
    }
  };

  const continueAsGuest = () => {
    console.log('👤 [AuthContext] Continuing as guest...');
    setIsGuest(true);
    setUser(null);
    setSession(null);
    setFavorites([]);
    setLoadingWithLog(false, 'continueAsGuest');
  };

  const addToFavorites = async (meditationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        meditation_id: meditationId,
      });

      if (error) {
        throw error;
      }

      setFavorites((prev) => [...prev, meditationId]);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  };

  const removeFromFavorites = async (meditationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('meditation_id', meditationId);

      if (error) {
        throw error;
      }

      setFavorites((prev) => prev.filter((id) => id !== meditationId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  };

  const isFavorite = useCallback(
    (meditationId: string) => {
      return favorites.includes(meditationId);
    },
    [favorites]
  );

  // Don't render children until auth is initialized
  if (!initialized) {
    console.log('⏳ [AuthContext] Not initialized yet, returning null');
    return null;
  }

  console.log('🎯 [AuthContext] Rendering children - loading:', loading, 'user:', user?.id || 'none', 'isGuest:', isGuest);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isGuest,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserPassword,
        resendConfirmationEmail,
        continueAsGuest,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        favorites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}