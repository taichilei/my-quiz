import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      // 成功后 (tabs)/_layout 的网关会自动停止重定向，stack 会切回 tabs
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '登录', headerShown: false }} />

      <ThemedText type="title" style={styles.title}>
        登录
      </ThemedText>
      <ThemedText style={styles.subtitle}>使用 Web 端账号登录</ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="用户名"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="密码"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
        />

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>登录</ThemedText>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Link href={'/register' as never} style={styles.link}>
            <ThemedText style={styles.linkText}>注册账号</ThemedText>
          </Link>
          <Link href={'/forgot-password' as never} style={styles.link}>
            <ThemedText style={styles.linkText}>忘记密码？</ThemedText>
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
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.6,
  },
  form: {
    gap: 12,
  },
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#d33',
    fontSize: 14,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  link: {
    paddingVertical: 4,
  },
  linkText: {
    color: '#0a7ea4',
    fontSize: 14,
  },
});
