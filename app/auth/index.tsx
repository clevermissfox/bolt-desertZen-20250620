import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const { theme, isDark } = useTheme();
  const {
    signIn,
    signUp,
    resetPassword,
    resendConfirmationEmail,
    continueAsGuest,
  } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    // Trim all input values to remove leading/trailing whitespace
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
        // Switch to login mode so user can sign in after confirming email
        setIsLogin(true);
        // Clear the password field for security
        setPassword('');
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // Handle specific error cases with more helpful messages
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
          'An account with this email already exists. Please sign in instead or use a different email address.';
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

    try {
      await resetPassword(trimmedEmail);
      setSuccess('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
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
            {!showForgotPassword ? (
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
                      // Autofill props for name
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
                    // Autofill props for email
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
                    // Autofill props for password
                    textContentType={isLogin ? 'password' : 'newPassword'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    autoCorrect={false}
                    // Enable password saving prompt
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
                    onPress={() => setShowForgotPassword(true)}
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
                    // Autofill props for email
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
