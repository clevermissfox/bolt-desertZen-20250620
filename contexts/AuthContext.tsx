import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as Linking from 'expo-linking';
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

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading profile for user:', supabaseUser.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);

        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');

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
            console.error('Error creating profile:', createError);
            setLoading(false);
            return;
          }

          if (newProfile) {
            console.log('Profile created successfully:', newProfile);
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
            });
            await loadFavorites(newProfile.id);
          }
        } else {
          setLoading(false);
          return;
        }
      } else if (profile) {
        console.log('Profile loaded successfully:', profile);
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
        });
        await loadFavorites(profile.id);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async (userId: string) => {
    try {
      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select('meditation_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }

      setFavorites(favoritesData?.map((fav) => fav.meditation_id) || []);
    } catch (error) {
      console.error('Error in loadFavorites:', error);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');

        // Handle URL-based authentication (email confirmation, password reset, etc.)
        if (
          typeof window !== 'undefined' &&
          window.location &&
          typeof window.location.search === 'string'
        ) {
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const type = urlParams.get('type');

          if (accessToken && refreshToken) {
            console.log('Found auth tokens in URL, setting session...');

            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session from URL:', error);
            } else if (data.session) {
              console.log('Session set from URL successfully');
              // Clear the URL parameters
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );

              if (isCancelled) return;

              setSession(data.session);
              setIsGuest(false);
              await loadUserProfile(data.session.user);
              setInitialized(true);
              return;
            }
          }
        }

        // Get existing session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting initial session:', error);
        }

        if (isCancelled) return;

        console.log(
          'Initial session:',
          initialSession?.user?.id || 'No session'
        );

        if (initialSession?.user) {
          setSession(initialSession);
          setIsGuest(false);
          await loadUserProfile(initialSession.user);
        } else {
          setLoading(false);
        }

        setInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (!isCancelled) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isCancelled) return;

      console.log(
        'Auth state changed:',
        event,
        newSession?.user?.id || 'No session'
      );

      setSession(newSession);

      if (newSession?.user) {
        setIsGuest(false);
        setLoading(true);
        await loadUserProfile(newSession.user);
      } else {
        setUser(null);
        setFavorites([]);
        setLoading(false);
        // Don't automatically set guest mode when user signs out
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    console.log('Sign in successful:', data.user?.id);
    setIsGuest(false);

    // The auth state change listener will handle loading the profile
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting to sign up with email:', email);

    // Use Linking.createURL to generate platform-appropriate redirect URLs
    // const redirectUrl = Linking.createURL('/auth/confirm');
    const redirectUrl = 'https://desert-zenmeditations.com/confirm-signup/';
    console.log('Generated redirect URL for signup:', redirectUrl);

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

    console.log('Sign up successful:', data.user?.id);
    setIsGuest(false);

    // Don't set loading state here - let the auth screen handle the UI
    // The auth state change listener will handle loading the profile if email is auto-confirmed
  };

  const resetPassword = async (email: string) => {
    try {
      // Use Linking.createURL to generate platform-appropriate redirect URLs
      const redirectUrl = Linking.createURL('/auth?type=recovery');
      console.log('Generated redirect URL for password reset:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateUserPassword = async (password: string) => {
    try {
      console.log('Updating user password...');

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      console.log('Password updated successfully');
      return data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      console.log('Resending confirmation email to:', email);

      // Use Linking.createURL to generate platform-appropriate redirect URLs
      const redirectUrl = Linking.createURL('/auth/confirm');
      console.log(
        'Generated redirect URL for resend confirmation:',
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

      console.log('Confirmation email resent successfully');
    } catch (error) {
      console.error('Resend confirmation email error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      setFavorites([]);
      setIsGuest(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const continueAsGuest = () => {
    console.log('Continuing as guest...');
    setIsGuest(true);
    setUser(null);
    setSession(null);
    setFavorites([]);
    setLoading(false);
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
    return null;
  }

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