import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { usePet } from '../store/petStore';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'fur-snips.social-token';
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const redirectUri = makeRedirectUri({
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'fursnips',
  path: 'auth',
});

const palette = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  bg: '#F3FBF8',
  card: '#FFFFFF',
  border: '#BEE3DD',
  text: '#134E4A',
  textMuted: '#5F7C77',
  placeholder: '#E6FFFA',
};

function SocialButton({ disabled, label, loading, loadingLabel, onPress }) {
  return (
    <Pressable
      style={[styles.socialButton, disabled ? styles.socialButtonDisabled : null]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
      <Text style={styles.socialButtonText}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

function GoogleLoginButton({ disabled, onError, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleClientId,
    responseType: ResponseType.Token,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken || response.params?.access_token || response.params?.id_token;
      if (token) {
        void onSuccess('google', token);
      } else {
        onError('Google login did not return a token.');
      }
      setLoading(false);
      return;
    }

    if (response?.type === 'error') {
      onError(response.error?.message || 'Google login failed.');
      setLoading(false);
      return;
    }

    if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [onError, onSuccess, response]);

  return (
    <SocialButton
      disabled={!request || disabled}
      label="Continue with Google"
      loading={loading}
      loadingLabel="Opening Google..."
      onPress={async () => {
        setLoading(true);
        await promptAsync();
      }}
    />
  );
}

function FacebookLoginButton({ disabled, onError, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: facebookAppId,
    responseType: ResponseType.Token,
    scopes: ['public_profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken || response.params?.access_token;
      if (token) {
        void onSuccess('facebook', token);
      } else {
        onError('Facebook login did not return a token.');
      }
      setLoading(false);
      return;
    }

    if (response?.type === 'error') {
      onError(response.error?.message || 'Facebook login failed.');
      setLoading(false);
      return;
    }

    if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [onError, onSuccess, response]);

  return (
    <SocialButton
      disabled={!request || disabled}
      label="Continue with Facebook"
      loading={loading}
      loadingLabel="Opening Facebook..."
      onPress={async () => {
        setLoading(true);
        await promptAsync();
      }}
    />
  );
}

export default function LoginScreen() {
  const { dispatch } = usePet();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const hasGoogle = Boolean(googleClientId);
  const hasFacebook = Boolean(facebookAppId);

  const handleLogin = useCallback(
    async (provider, token) => {
      setError('');
      setSaving(true);

      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            provider,
            token,
            savedAt: new Date().toISOString(),
          })
        );
        dispatch({ type: 'SET_PHASE', phase: 'home' });
      } catch (storageError) {
        setError('We could not save your login yet. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [dispatch]
  );

  const handleGuest = useCallback(() => {
    setError('');
    dispatch({ type: 'SET_PHASE', phase: 'home' });
  }, [dispatch]);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.logo}>FurSnips</Text>
        <Text style={styles.heading}>Sign in to continue</Text>
        <Text style={styles.subheading}>Jump into grooming bookings with social login or continue as a guest.</Text>

        <View style={styles.buttonGroup}>
          {hasGoogle ? <GoogleLoginButton disabled={saving} onError={setError} onSuccess={handleLogin} /> : null}
          {hasFacebook ? <FacebookLoginButton disabled={saving} onError={setError} onSuccess={handleLogin} /> : null}
          {!hasGoogle && !hasFacebook ? (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Login coming soon</Text>
              <Text style={styles.placeholderText}>Add a Google or Facebook App ID to enable social login for this demo.</Text>
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.guestButton} onPress={handleGuest}>
          <Text style={styles.guestButtonText}>Continue as guest</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: palette.bg,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    gap: 12,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.primary,
    textAlign: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textMuted,
    textAlign: 'center',
  },
  buttonGroup: {
    marginTop: 8,
    gap: 12,
  },
  socialButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
  },
  socialButtonDisabled: {
    opacity: 0.65,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeholderCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.placeholder,
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#DC2626',
    textAlign: 'center',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.primaryDark,
  },
});
