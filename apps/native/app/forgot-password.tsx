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

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setInfo('重置邮件已发送，请查收邮箱并复制 Token');
      // 1.2 秒后跳到 reset-password 页让用户输入 token
      setTimeout(
        () =>
          router.push({
            pathname: '/reset-password' as never,
            params: { email },
          }),
        1200
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '忘记密码', headerShown: false }} />

      <ThemedText type="title" style={styles.title}>
        忘记密码
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        填写邮箱，我们会发送一封含重置 Token 的邮件
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
            <ThemedText style={styles.buttonText}>发送重置邮件</ThemedText>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Link href={'/reset-password' as never} style={styles.link}>
            <ThemedText style={styles.linkText}>已有 Token？去重置</ThemedText>
          </Link>
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
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  link: { paddingVertical: 4 },
  linkText: { color: '#0a7ea4', fontSize: 14 },
});
