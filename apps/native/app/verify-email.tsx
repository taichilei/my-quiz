import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authApi } from '@/api/client';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const presetEmail = typeof params.email === 'string' ? params.email : '';

  const [email, setEmail] = useState(presetEmail);
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleVerify() {
    if (!token) {
      setError('请输入邮箱里收到的验证码');
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await authApi.verifyEmail(token);
      setInfo('邮箱验证成功，正在跳转登录…');
      setTimeout(() => router.replace('/login' as never), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : '验证失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError('请输入邮箱以重发验证码');
      return;
    }
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setInfo('验证码已重发，请查收邮箱');
    } catch (e) {
      setError(e instanceof Error ? e.message : '重发失败');
    } finally {
      setResending(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '验证邮箱', headerShown: false }} />

      <ThemedText type="title" style={styles.title}>
        验证邮箱
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        请查收邮件并输入验证码
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="邮箱"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!submitting && !resending}
        />
        <TextInput
          style={styles.input}
          placeholder="验证码"
          placeholderTextColor="#999"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting && !resending}
        />

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {info && <ThemedText style={styles.info}>{info}</ThemedText>}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={submitting || resending}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>验证</ThemedText>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.buttonSecondary,
            resending && styles.buttonDisabled,
          ]}
          onPress={handleResend}
          disabled={submitting || resending}
        >
          {resending ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : (
            <ThemedText style={styles.buttonSecondaryText}>
              重发验证码
            </ThemedText>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Link href={'/login' as never} style={styles.link}>
            <ThemedText style={styles.linkText}>返回登录</ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 96,
  },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32, opacity: 0.6 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonSecondaryText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  error: { color: '#d33', fontSize: 14 },
  info: { color: '#2a7', fontSize: 14 },
  linkRow: { alignItems: 'center', marginTop: 16 },
  link: { paddingVertical: 4 },
  linkText: { color: '#0a7ea4', fontSize: 14 },
});
