import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { examApi, questionApi } from '@/api/client';
import { useQuizStore } from '@/store/quizStore';
import type { ExamInfo } from '@/types';

export default function SelectExamScreen() {
  const router = useRouter();
  const startQuiz = useQuizStore((s) => s.startQuiz);

  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await examApi.list();
        if (!cancelled) {
          // 隐藏没有题目的考试
          setExams(list.filter((e) => e.count > 0));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePick(exam: ExamInfo) {
    setStartingId(exam.id);
    setError(null);
    try {
      const questions = await questionApi.list({
        exam: exam.name,
        year: exam.year,
        subject: exam.subject,
      });
      if (questions.length === 0) {
        setError('该考试暂无题目');
        return;
      }
      const title = `${exam.name}${exam.year ? ` ${exam.year}` : ''} - ${exam.part}`;
      startQuiz(questions, title);
      router.replace('/(tabs)' as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : '启动失败');
    } finally {
      setStartingId(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '选择考试' }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : error && exams.length === 0 ? (
        <View style={styles.center}>
          <ThemedText style={styles.error}>{error}</ThemedText>
        </View>
      ) : exams.length === 0 ? (
        <View style={styles.center}>
          <ThemedText style={styles.hint}>
            暂无可练习的考试，请先在 Web 端导入题目
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            error ? (
              <ThemedText style={[styles.error, styles.errorBanner]}>
                {error}
              </ThemedText>
            ) : null
          }
          renderItem={({ item }) => {
            const busy = startingId === item.id;
            const disabled = startingId !== null;
            return (
              <Pressable
                style={[styles.item, disabled && styles.itemDisabled]}
                onPress={() => void handlePick(item)}
                disabled={disabled}
              >
                <View style={styles.itemMain}>
                  <ThemedText style={styles.itemTitle}>
                    {item.name}
                    {item.year ? ` · ${item.year}` : ''}
                  </ThemedText>
                  <ThemedText style={styles.itemMeta}>
                    {[item.subject, item.part].filter(Boolean).join(' · ')}
                  </ThemedText>
                </View>
                <View style={styles.itemRight}>
                  {busy ? (
                    <ActivityIndicator color="#0a7ea4" />
                  ) : (
                    <ThemedText style={styles.count}>{item.count} 题</ThemedText>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.2)',
    backgroundColor: 'rgba(10,126,164,0.04)',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemMain: { flex: 1 },
  itemRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  count: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  error: { color: '#d33', fontSize: 14 },
  errorBanner: {
    padding: 12,
    backgroundColor: 'rgba(221,51,51,0.08)',
    borderRadius: 8,
    marginBottom: 12,
  },
});
