import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Link, type Href } from 'expo-router';

import QuizCard from '@/components/QuizCard';
import ContinueQuizModal from '@/components/ContinueQuizModal';
import QuizFinishModal from '@/components/QuizFinishModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authApi, questionApi, sessionApi } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useQuizStore } from '@/store/quizStore';
import type { QuizSession } from '@/types';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isQuizActive = useQuizStore((s) => s.isQuizActive);
  const quizTitle = useQuizStore((s) => s.quizTitle);
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const correctCount = useQuizStore((s) => s.correctCount);
  const finished = useQuizStore((s) => s.finished);
  const startedAt = useQuizStore((s) => s.startedAt);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);
  const restoreFromSession = useQuizStore((s) => s.restoreFromSession);

  const [debugResult, setDebugResult] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // 跨设备恢复：登录后检查后端是否有未完成会话
  const [pendingSession, setPendingSession] = useState<QuizSession | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isQuizActive) return; // 已经在刷题就别打断
    let cancelled = false;
    (async () => {
      try {
        const session = await sessionApi.getCurrent();
        if (!cancelled && session) setPendingSession(session);
      } catch {
        // 没有会话或网络错误：静默
      }
    })();
    return () => {
      cancelled = true;
    };
    // 仅在用户切换时重新检查；isQuizActive 改变不应触发查询
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleContinue() {
    if (!pendingSession) return;
    setRestoring(true);
    try {
      // 没有按 ID 批量获取的接口，先拉全量再过滤
      const all = await questionApi.list();
      const ids = new Set(pendingSession.questionIds);
      const restored = pendingSession.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q));

      if (restored.length === 0 || restored.length !== ids.size) {
        // 题目对不齐：放弃恢复
        await sessionApi.deleteCurrent().catch(() => {});
        setPendingSession(null);
        setDebugError('题目已变更，无法恢复进度');
        return;
      }
      restoreFromSession(pendingSession, restored);
      setPendingSession(null);
    } catch (e) {
      setDebugError(e instanceof Error ? e.message : '恢复失败');
    } finally {
      setRestoring(false);
    }
  }

  async function handleDiscard() {
    setRestoring(true);
    try {
      await sessionApi.deleteCurrent().catch(() => {});
    } finally {
      setPendingSession(null);
      setRestoring(false);
    }
  }

  async function handlePing() {
    setDebugError(null);
    setDebugResult('请求中...');
    try {
      const info = await authApi.debugClientInfo();
      setDebugResult(JSON.stringify(info, null, 2));
    } catch (e) {
      setDebugResult(null);
      setDebugError(e instanceof Error ? e.message : String(e));
    }
  }

  // 快速开始：拉前 10 道题启动一轮（更专业的考试选择走 M1.5 的 select-exam 页）
  async function handleQuickStart() {
    setStarting(true);
    setDebugError(null);
    try {
      const all = await questionApi.list();
      const picked = all.slice(0, 10);
      if (picked.length === 0) {
        setDebugError('题库为空，请先在 Web 端导入题目');
        return;
      }
      startQuiz(picked, '快速刷题（10 道）');
    } catch (e) {
      setDebugError(e instanceof Error ? e.message : '启动失败');
    } finally {
      setStarting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ContinueQuizModal
        visible={pendingSession !== null}
        session={pendingSession}
        busy={restoring}
        onContinue={() => void handleContinue()}
        onDiscard={() => void handleDiscard()}
      />
      <QuizFinishModal
        visible={isQuizActive && finished}
        total={questions.length}
        correct={correctCount}
        durationSec={
          startedAt
            ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
            : null
        }
        onRetry={() => {
          // 用同一批题目重新开始
          startQuiz(questions, quizTitle);
        }}
        onClose={resetQuiz}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.account}>
          <ThemedText type="subtitle">
            已登录：{user?.username ?? '加载中...'}
          </ThemedText>
          {user?.email && (
            <ThemedText style={styles.email}>{user.email}</ThemedText>
          )}

          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={handlePing}>
              <ThemedText style={styles.btnText}>验证后端联调</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => void logout()}
            >
              <ThemedText style={styles.btnGhostText}>退出登录</ThemedText>
            </Pressable>
          </View>

          {debugResult && (
            <View style={styles.debugBox}>
              <ThemedText style={styles.debugLabel}>
                后端识别到的客户端信息：
              </ThemedText>
              <ThemedText style={styles.debugCode}>{debugResult}</ThemedText>
            </View>
          )}
          {debugError && (
            <View style={[styles.debugBox, styles.debugErrorBox]}>
              <ThemedText style={styles.debugLabel}>请求失败：</ThemedText>
              <ThemedText style={styles.debugCode}>{debugError}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {!isQuizActive ? (
          <View style={styles.empty}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              开始刷题
            </ThemedText>
            <ThemedText style={styles.emptyHint}>
              选择一份考试开始练习，或快速从题库随机抽 10 道
            </ThemedText>

            <Pressable
              style={[styles.btn, starting && styles.btnDisabled]}
              onPress={handleQuickStart}
              disabled={starting}
            >
              {starting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.btnText}>快速开始</ThemedText>
              )}
            </Pressable>

            <Link
              href={'/quiz/select-exam' as Href}
              style={[styles.btn, styles.btnGhost, styles.linkBtn]}
            >
              <ThemedText style={styles.btnGhostText}>选择考试</ThemedText>
            </Link>
          </View>
        ) : (
          <View>
            <View style={styles.titleBar}>
              <ThemedText style={styles.titleBarText}>{quizTitle}</ThemedText>
              <Pressable onPress={resetQuiz}>
                <ThemedText style={styles.titleBarExit}>退出</ThemedText>
              </Pressable>
            </View>
            <QuizCard
              key={questions[currentIndex]?.id ?? currentIndex}
              question={questions[currentIndex]}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              onAnswer={(answer, isCorrect) => {
                selectAnswer(answer, isCorrect);
              }}
              onNext={() => nextQuestion()}
            />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  scroll: {
    paddingBottom: 40,
  },
  account: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  btnGhostText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  linkBtn: {
    marginTop: 8,
    textAlign: 'center',
    paddingVertical: 12,
  },
  debugBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(10,126,164,0.08)',
    borderRadius: 8,
  },
  debugErrorBox: {
    backgroundColor: 'rgba(221,51,51,0.08)',
  },
  debugLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugCode: {
    fontFamily: 'Courier',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  empty: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleBarText: {
    fontSize: 14,
    opacity: 0.7,
  },
  titleBarExit: {
    color: '#d33',
    fontSize: 14,
  },
});
