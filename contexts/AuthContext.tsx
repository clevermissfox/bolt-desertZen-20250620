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
  const [profileLoading, setProfileLoading] = useState(false);

  // Enhanced logging for loading state changes with stack trace
  const setLoadingWithLog = useCallback((newLoading: boolean, context: string) => {
    const currentLoading = loading;
    console.log(`🔄 [AuthContext] Loading state change: ${currentLoading} → ${newLoading} - Context: ${context}`);
    
    if (newLoading === true) {
      console.log(`⚠️ [AuthContext] SETTING LOADING TO TRUE - This might cause the loading screen!`);
      console.log(`📍 [AuthContext] Stack trace for loading=true:`, new Error().stack?.split('\n').slice(1, 6).join('\n'));
    } else {
      console.log(`✅ [AuthContext] Setting loading to false - should hide loading screen`);
    }
    
    setLoading(newLoading);
  }, [loading]);

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    if (profileLoading) {
      console.log('⏳ [AuthContext] Profile already loading, skipping...');
      return;
    }

    try {
      console.log('👤 [AuthContext] Starting loadUserProfile for user:', supabaseUser.id);
      setProfileLoading(true);

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
      setProfileLoading(false);
      setLoadingWithLog(false, 'loadUserProfile - finally block');
    }
  }, [setLoadingWithLog, profileLoading]);

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
    let authStateSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🚀 [AuthContext] Initializing auth...');
        setLoadingWithLog(true, 'initializeAuth - start');

        // Get existing session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ [AuthContext] Error getting initial session:', error);
        }

        if (isCancelled) {
          console.log('🚫 [AuthContext] initializeAuth cancelled after getSession');
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

    // Set up auth state listener
    const setupAuthListener = () => {
      console.log('👂 [AuthContext] Setting up auth state listener...');
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

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ [AuthContext] User signed in');
            setSession(newSession);
            setIsGuest(false);
            if (newSession?.user) {
              setLoadingWithLog(true, 'onAuthStateChange - SIGNED_IN');
              await loadUserProfile(newSession.user);
            }
            break;

          case 'SIGNED_OUT':
            console.log('👋 [AuthContext] User signed out');
            setSession(null);
            setUser(null);
            setFavorites([]);
            setLoadingWithLog(false, 'onAuthStateChange - SIGNED_OUT');
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 [AuthContext] Token refreshed');
            setSession(newSession);
            // Don't reload profile on token refresh if we already have user data
            if (!user && newSession?.user) {
              setLoadingWithLog(true, 'onAuthStateChange - TOKEN_REFRESHED');
              await loadUserProfile(newSession.user);
            }
            break;

          case 'USER_UPDATED':
            console.log('👤 [AuthContext] User updated');
            setSession(newSession);
            if (newSession?.user && user) {
              // Update existing user data without full reload
              const updatedUser = {
                ...user,
                email: newSession.user.email || user.email,
              };
              setUser(updatedUser);
            }
            break;

          case 'PASSWORD_RECOVERY':
            console.log('🔑 [AuthContext] Password recovery event - EXPLICITLY NOT setting loading state');
            setSession(newSession);
            // CRITICAL: Don't set loading for password recovery events
            // This was causing the loading screen to appear during password reset
            console.log('🚫 [AuthContext] Skipping loading state change for PASSWORD_RECOVERY');
            break;

          case 'INITIAL_SESSION':
            console.log('🔄 [AuthContext] Initial session event');
            setSession(newSession);
            if (newSession?.user && !user) {
              console.log('👤 [AuthContext] Initial session has user, loading profile...');
              setLoadingWithLog(true, 'onAuthStateChange - INITIAL_SESSION - has user');
              await loadUserProfile(newSession.user);
            } else if (!newSession?.user) {
              console.log('👤 [AuthContext] Initial session has no user');
              setLoadingWithLog(false, 'onAuthStateChange - INITIAL_SESSION - no user');
            }
            break;

          default:
            console.log('❓ [AuthContext] Unknown auth event:', event);
            setSession(newSession);
            if (newSession?.user && !user) {
              console.log('👤 [AuthContext] Unknown event with user, loading profile...');
              setLoadingWithLog(true, `onAuthStateChange - ${event} - has user`);
              await loadUserProfile(newSession.user);
            } else if (!newSession?.user) {
              console.log('👤 [AuthContext] Unknown event with no user');
              setLoadingWithLog(false, `onAuthStateChange - ${event} - no user`);
            }
        }
      });

      authStateSubscription = subscription;
    };

    // Initialize auth and set up listener
    initializeAuth().then(() => {
      if (!isCancelled) {
        setupAuthListener();
      }
    });

    return () => {
      console.log('🧹 [AuthContext] Cleanup - cancelling auth initialization');
      isCancelled = true;
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, [loadUserProfile, setLoadingWithLog, user]);

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
      console.log('🔑 [AuthContext] Starting resetPassword function for:', email);
      console.log('🔄 [AuthContext] Current loading state before reset:', loading);
      
      // Use the external bridge page for password reset
      const redirectUrl = 'https://desert-zenmeditations.com/confirm-signup/';
      console.log('🔗 [AuthContext] Using bridge page redirect URL for password reset:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('❌ [AuthContext] Reset password error:', error);
        throw error;
      }

      console.log('📧 [AuthContext] Password reset email sent successfully');
      
      // CRITICAL: Force loading state to false immediately after password reset
      console.log('🔄 [AuthContext] FORCE setting loading to false after password reset');
      setLoadingWithLog(false, 'resetPassword - force completed');
      
      // Add a small delay and check again to ensure it sticks
      setTimeout(() => {
        console.log('🔄 [AuthContext] Double-checking loading state after delay...');
        setLoadingWithLog(false, 'resetPassword - delayed check');
      }, 100);
      
    } catch (error) {
      console.error('❌ [AuthContext] Reset password error:', error);
      // Ensure loading is false even on error
      setLoadingWithLog(false, 'resetPassword - error');
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
      setLoadingWithLog(false, 'signOut');
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

  console.log('🎯 [AuthContext] Rendering children - loading:', loading, 'user:', user?.id || 'none', 'isGuest:', isGuest, 'profileLoading:', profileLoading);

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