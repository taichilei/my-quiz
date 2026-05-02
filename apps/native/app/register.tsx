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
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!username || !email || !password) {
      setError('请填写所有字段');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({ username, email, password });
      // 注册成功不自动登录，跳到验证邮箱页继续流程
      router.replace({
        pathname: '/verify-email' as never,
        params: { email },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '注册', headerShown: false }} />

      <ThemedText type="title" style={styles.title}>
        注册
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        注册后将向邮箱发送验证码
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="用户名（3-50 字符）"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="邮箱"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="密码（至少 6 位）"
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
            <ThemedText style={styles.buttonText}>注册</ThemedText>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Link href={'/login' as never} style={styles.link}>
            <ThemedText style={styles.linkText}>已有账号？去登录</ThemedText>
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
    alignItems: 'center',
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
