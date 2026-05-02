import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authApi } from '@/api/client';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit() {
    if (!token || !newPassword) {
      setError('请填写 Token 和新密码');
      return;
    }
    if (newPassword.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setInfo('密码已重置，正在跳转登录…');
      setTimeout(() => router.replace('/login' as never), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '重置密码', headerShown: false }} />

      <ThemedText type="title" style={styles.title}>
        重置密码
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        填写邮件里的 Token 和新密码
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="重置 Token"
          placeholderTextColor="#999"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="新密码（至少 6 位）"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!submitting}
        />

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {info && <ThemedText style={styles.info}>{info}</ThemedText>}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>重置密码</ThemedText>
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
  container: { flex: 1, padding: 24, paddingTop: 96 },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#d33', fontSize: 14 },
  info: { color: '#2a7', fontSize: 14 },
  linkRow: { alignItems: 'center', marginTop: 16 },
  link: { paddingVertical: 4 },
  linkText: { color: '#0a7ea4', fontSize: 14 },
});
