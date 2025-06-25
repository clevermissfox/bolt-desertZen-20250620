import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthCallbackScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const localSearchParams = useLocalSearchParams();
  const [processing, setProcessing] = useState(true);
  const [message, setMessage] = useState('Processing authentication...');

  const styles = createStyles(theme);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const processCallback = async () => {
      try {
        console.log('🔄 Processing auth callback...');
        console.log('📋 Local search params:', JSON.stringify(localSearchParams, null, 2));

        // Set a maximum timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.log('⏰ Callback processing timeout, redirecting to auth');
          setMessage('Taking longer than expected. Redirecting...');
          router.replace('/auth');
        }, 15000); // 15 second timeout

        // Get URL parameters from multiple sources
        let urlParams: Record<string, string> = {};
        
        // First, check localSearchParams
        Object.keys(localSearchParams).forEach(key => {
          const value = localSearchParams[key];
          if (typeof value === 'string') {
            urlParams[key] = value;
          }
        });

        // Also check the initial URL in case params aren't in localSearchParams
        try {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            console.log('🌐 Initial URL:', initialUrl);
            const parsedUrl = Linking.parse(initialUrl);
            if (parsedUrl.queryParams) {
              // Safely merge query params, ensuring only string values
              Object.entries(parsedUrl.queryParams).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  urlParams[key] = value;
                } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                  // If it's an array, take the first string value
                  urlParams[key] = value[0];
                }
              });
            }
          }
        } catch (error) {
          console.error('❌ Error parsing initial URL:', error);
        }

        // Also check current URL if we're on web
        if (typeof window !== 'undefined' && window.location) {
          const webUrlParams = new URLSearchParams(window.location.search);
          webUrlParams.forEach((value, key) => {
            urlParams[key] = value;
          });
        }

        console.log('🔍 Combined URL params:', JSON.stringify(urlParams, null, 2));

        const { access_token, refresh_token, type, error, error_description } = urlParams;

        // Handle errors first
        if (error) {
          console.error('❌ Auth callback error:', error, error_description);
          setMessage('Authentication failed. Redirecting...');
          clearTimeout(timeoutId);
          setTimeout(() => {
            router.replace({
              pathname: '/auth',
              params: { error: error_description || error }
            });
          }, 2000);
          return;
        }

        // Handle session establishment
        if (access_token && refresh_token) {
          console.log('🔑 Setting session with tokens...');
          setMessage('Establishing session...');

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('❌ Error setting session:', sessionError);
            setMessage('Session error. Redirecting...');
            clearTimeout(timeoutId);
            setTimeout(() => {
              router.replace({
                pathname: '/auth',
                params: { error: sessionError.message }
              });
            }, 2000);
            return;
          }

          if (data.session) {
            console.log('✅ Session established successfully');
            clearTimeout(timeoutId);
            
            // Route based on type parameter
            if (type === 'recovery') {
              console.log('🔑 Password recovery flow detected');
              setMessage('Password reset verified. Redirecting...');
              setTimeout(() => {
                router.replace({
                  pathname: '/auth',
                  params: { type: 'recovery' }
                });
              }, 1500);
            } else if (type === 'signup') {
              console.log('✅ Email confirmation flow detected');
              setMessage('Email confirmed successfully. Redirecting...');
              setTimeout(() => {
                router.replace({
                  pathname: '/auth',
                  params: { type: 'signup' }
                });
              }, 1500);
            } else {
              console.log('✅ General authentication flow');
              setMessage('Authentication successful. Redirecting...');
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 1500);
            }
          } else {
            console.error('❌ No session data received');
            setMessage('Authentication failed. Redirecting...');
            clearTimeout(timeoutId);
            setTimeout(() => {
              router.replace({
                pathname: '/auth',
                params: { error: 'No session established' }
              });
            }, 2000);
          }
        } else if (type === 'signup') {
          // Handle email confirmation without tokens (some flows)
          console.log('✅ Email confirmation detected without tokens');
          setMessage('Email confirmed. Redirecting...');
          clearTimeout(timeoutId);
          setTimeout(() => {
            router.replace({
              pathname: '/auth',
              params: { type: 'signup' }
            });
          }, 1500);
        } else {
          console.log('❓ No tokens or type found, redirecting to auth');
          setMessage('Redirecting to authentication...');
          clearTimeout(timeoutId);
          setTimeout(() => {
            router.replace('/auth');
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Error in auth callback:', error);
        setMessage('An error occurred. Redirecting...');
        clearTimeout(timeoutId);
        setTimeout(() => {
          router.replace({
            pathname: '/auth',
            params: { error: 'Callback processing failed' }
          });
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    processCallback();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [localSearchParams, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Desert Zen</Text>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.accent} 
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 32,
      textAlign: 'center',
    },
    spinner: {
      marginBottom: 24,
    },
    message: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });