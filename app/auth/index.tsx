import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle,
  RefreshCw,
} from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSetNewPasswordForm, setShowSetNewPasswordForm] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const { theme, isDark } = useTheme();
  const {
    user,
    session,
    signIn,
    signUp,
    resetPassword,
    updateUserPassword,
    resendConfirmationEmail,
    continueAsGuest,
  } = useAuth();
  const router = useRouter();

  // Clear success message when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setSuccess(null);
      setError(null);
      setShowResendConfirmation(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowSetNewPasswordForm(false);
    }, [])
  );

  // Handle deep link parameters from your external bridge
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Handling deep link:', url);
      
      try {
        const parsedUrl = Linking.parse(url);
        const { access_token, refresh_token, type, error: linkError } = parsedUrl.queryParams || {};

        console.log('🔍 Deep link params:', { access_token: !!access_token, refresh_token: !!refresh_token, type, linkError });

        // Handle errors from bridge
        if (linkError) {
          console.error('❌ Error from bridge:', linkError);
          setError(typeof linkError === 'string' ? linkError : 'Authentication failed');
          return;
        }

        // Handle session establishment
        if (access_token && refresh_token && typeof access_token === 'string' && typeof refresh_token === 'string') {
          console.log('🔑 Setting session from deep link...');
          setLoading(true);

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('❌ Error setting session:', sessionError);
            setError('Failed to establish session. Please try again.');
            setLoading(false);
            return;
          }

          if (data.session) {
            console.log('✅ Session established from deep link');
            
            // Handle different flow types
            if (type === 'recovery') {
              console.log('🔑 Password recovery flow detected');
              setShowSetNewPasswordForm(true);
              setShowForgotPassword(false);
              setError(null);
              setSuccess('Please enter your new password below.');
              setIsLogin(false);
            } else if (type === 'signup') {
              console.log('✅ Email confirmation flow detected');
              setSuccess('Your email has been confirmed. You are now signed in!');
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 2000);
            } else {
              console.log('✅ General authentication flow');
              setSuccess('Authentication successful!');
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 1500);
            }
          }
          
          setLoading(false);
        } else if (type === 'signup') {
          // Handle email confirmation without tokens
          console.log('✅ Email confirmation detected without tokens');
          setSuccess('Your email has been confirmed. Please sign in.');
          setIsLogin(true);
        }
      } catch (error) {
        console.error('❌ Error processing deep link:', error);
        setError('Failed to process authentication link');
        setLoading(false);
      }
    };

    // Handle initial URL (when app is opened from link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL changes (when app is already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, [router]);

  // Auto-redirect if user is already authenticated (but not during password reset)
  useEffect(() => {
    if (user && !showSetNewPasswordForm) {
      console.log('✅ User already authenticated, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, showSetNewPasswordForm, router]);

  const handleAuth = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword || (!isLogin && !trimmedName)) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowResendConfirmation(false);
    setShowSetNewPasswordForm(false);

    try {
      if (isLogin) {
        await signIn(trimmedEmail, trimmedPassword);
        setSuccess('Successfully signed in!');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        await signUp(trimmedEmail, trimmedPassword, trimmedName);
        setSuccess(
          'Account created successfully! Please check your email for a confirmation link before signing in.'
        );
        setIsLogin(true);
        setPassword('');
        setShowResendConfirmation(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      let errorMessage =
        error.message || 'Authentication failed. Please try again.';
      let shouldShowResend = false;

      if (
        error.message &&
        error.message.toLowerCase().includes('email not confirmed')
      ) {
        errorMessage =
          'Your email address has not been confirmed. Please check your inbox for a verification link and click it to activate your account.';
        shouldShowResend = true;
      } else if (
        error.message &&
        error.message.toLowerCase().includes('invalid login credentials')
      ) {
        errorMessage =
          'Invalid email or password. Please check your credentials and try again.';
      } else if (
        error.message &&
        error.message.toLowerCase().includes('user already registered')
      ) {
        errorMessage =
          'An account with this email already exists. Please sign in instead or use the "Resend Confirmation" option if you haven\'t confirmed your email yet.';
        shouldShowResend = true;
        setIsLogin(true);
        setPassword('');
      } else if (
        error.message &&
        error.message.toLowerCase().includes('signup disabled')
      ) {
        errorMessage =
          'New account registration is currently disabled. Please contact support for assistance.';
      }

      setError(errorMessage);
      setShowResendConfirmation(shouldShowResend);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowSetNewPasswordForm(false);

    try {
      await resetPassword(trimmedEmail);
      setSuccess(
        'Password reset email sent! Check your inbox and click the link to reset your password.'
      );
      setShowForgotPassword(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmNewPassword = confirmNewPassword.trim();

    if (!trimmedNewPassword || !trimmedConfirmNewPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserPassword(trimmedNewPassword);
      setSuccess(
        'Password updated successfully! You will now be signed in with your new password.'
      );
      
      // Clear the form and redirect to main app
      setShowSetNewPasswordForm(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setPassword('');
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setResendingConfirmation(true);
    setError(null);
    setSuccess(null);

    try {
      await resendConfirmationEmail(trimmedEmail);
      setSuccess(
        'Confirmation email sent! Please check your inbox and click the verification link.'
      );
      setShowResendConfirmation(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send confirmation email');
    } finally {
      setResendingConfirmation(false);
    }
  };

  const handleGuestMode = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Desert Zen</Text>
            <Text style={styles.subtitle}>
              Find peace and tranquility in your daily practice
            </Text>
          </View>

          <View style={styles.form}>
            {showSetNewPasswordForm ? (
              <>
                <View style={styles.forgotPasswordHeader}>
                  <Text style={styles.forgotPasswordTitle}>
                    Set New Password
                  </Text>
                  <Text style={styles.forgotPasswordSubtitle}>
                    Enter your new password below.
                  </Text>
                </View>

                {error && (
                  <View style={styles.messageContainer}>
                    <AlertCircle size={16} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {success && (
                  <View
                    style={[styles.messageContainer, styles.successContainer]}
                  >
                    <CheckCircle size={16} color={theme.colors.success} />
                    <Text style={styles.successText}>{success}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Lock size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    editable={!loading}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    autoCorrect={false}
                    passwordRules="minlength: 6;"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!showConfirmNewPassword}
                    editable={!loading}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmNewPassword(!showConfirmNewPassword)
                    }
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.authButton,
                    loading && styles.authButtonDisabled,
                  ]}
                  onPress={handleSetNewPassword}
                  disabled={loading}
                >
                  <Text style={styles.authButtonText}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowSetNewPasswordForm(false);
                    setError(null);
                    setSuccess(null);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setIsLogin(true);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : !showForgotPassword ? (
              <>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isLogin && styles.toggleActive,
                    ]}
                    onPress={() => {
                      setIsLogin(true);
                      setError(null);
                      setSuccess(null);
                      setShowResendConfirmation(false);
                      setShowSetNewPasswordForm(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        isLogin && styles.toggleTextActive,
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      !isLogin && styles.toggleActive,
                    ]}
                    onPress={() => {
                      setIsLogin(false);
                      setError(null);
                      setSuccess(null);
                      setShowResendConfirmation(false);
                      setShowSetNewPasswordForm(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        !isLogin && styles.toggleTextActive,
                      ]}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {error && (
                  <View style={styles.messageContainer}>
                    <AlertCircle size={16} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {success && (
                  <View
                    style={[styles.messageContainer, styles.successContainer]}
                  >
                    <CheckCircle size={16} color={theme.colors.success} />
                    <Text style={styles.successText}>{success}</Text>
                  </View>
                )}

                {showResendConfirmation && (
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                      Didn't receive the confirmation email?
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.resendButton,
                        resendingConfirmation && styles.resendButtonDisabled,
                      ]}
                      onPress={handleResendConfirmation}
                      disabled={resendingConfirmation}
                    >
                      <RefreshCw size={16} color="white" />
                      <Text style={styles.resendButtonText}>
                        {resendingConfirmation
                          ? 'Sending...'
                          : 'Resend Confirmation Email'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <User size={20} color={theme.colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!loading}
                      textContentType="name"
                      autoComplete="name"
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Mail size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    textContentType={isLogin ? 'username' : 'emailAddress'}
                    autoComplete={isLogin ? 'username' : 'email'}
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    textContentType={isLogin ? 'password' : 'newPassword'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    autoCorrect={false}
                    passwordRules={!isLogin ? 'minlength: 6;' : undefined}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                {isLogin && (
                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() => {
                      setShowForgotPassword(true);
                      setShowSetNewPasswordForm(false);
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.authButton,
                    loading && styles.authButtonDisabled,
                  ]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <Text style={styles.authButtonText}>
                    {loading
                      ? 'Please wait...'
                      : isLogin
                      ? 'Sign In'
                      : 'Sign Up'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={handleGuestMode}
                  disabled={loading}
                >
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.forgotPasswordHeader}>
                  <Text style={styles.forgotPasswordTitle}>Reset Password</Text>
                  <Text style={styles.forgotPasswordSubtitle}>
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </Text>
                </View>

                {error && (
                  <View style={styles.messageContainer}>
                    <AlertCircle size={16} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {success && (
                  <View
                    style={[styles.messageContainer, styles.successContainer]}
                  >
                    <CheckCircle size={16} color={theme.colors.success} />
                    <Text style={styles.successText}>{success}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Mail size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.authButton,
                    loading && styles.authButtonDisabled,
                  ]}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  <Text style={styles.authButtonText}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowForgotPassword(false);
                    setShowSetNewPasswordForm(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 48,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 32,
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      position: 'relative',
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      padding: 4,
      marginBottom: 32,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 16,
    },
    toggleActive: {
      backgroundColor: theme.colors.accent,
    },
    toggleText: {
      fontFamily: 'Karla-Medium',
      color: theme.colors.textSecondary,
    },
    toggleTextActive: {
      color: '#ffffff',
    },
    messageContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: `${theme.colors.error}15`,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    successContainer: {
      backgroundColor: `${theme.colors.success}15`,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: theme.colors.error,
      lineHeight: 20,
    },
    successText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: theme.colors.success,
      lineHeight: 20,
    },
    resendContainer: {
      backgroundColor: `${theme.colors.accent}10`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    resendText: {
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    resendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    resendButtonDisabled: {
      opacity: 0.6,
    },
    resendButtonText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: 'white',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      backgroundColor: theme.colors.background,
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      fontFamily: 'Karla-Regular',
      color: theme.colors.text,
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: 16,
      paddingVertical: 4,
    },
    forgotPasswordText: {
      fontSize: 14,
      fontFamily: 'Karla-Medium',
      color: theme.colors.accent,
    },
    authButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    authButtonDisabled: {
      opacity: 0.6,
    },
    authButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: 'Karla-Medium',
    },
    guestButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 20,
    },
    guestButtonText: {
      color: isDark ? '#ffffff' : theme.colors.accent,
      fontSize: 16,
      fontFamily: 'Karla-Medium',
    },
    forgotPasswordHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    forgotPasswordTitle: {
      fontSize: 24,
      fontFamily: 'Lora-Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    forgotPasswordSubtitle: {
      fontSize: 14,
      fontFamily: 'Karla-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    backButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 20,
    },
    backButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontFamily: 'Karla-Medium',
    },
  });