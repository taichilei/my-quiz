// 跨设备进度恢复弹窗。App 启动后若后端 /api/session/current 有未完成会话则弹出。
// 用户点"继续"时调用 onContinue（外层会把题目拉回来 + restoreFromSession）；
// 点"重开"时调用 onDiscard（外层负责清后端会话）。

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from './themed-text';
import type { QuizSession } from '@/types';

interface Props {
  visible: boolean;
  session: QuizSession | null;
  busy?: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export default function ContinueQuizModal({
  visible,
  session,
  busy,
  onContinue,
  onDiscard,
}: Props) {
  if (!session) return null;
  const total = session.questionIds.length;
  const progress = `${session.currentIndex + 1} / ${total}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !busy && onDiscard()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            发现未完成的练习
          </ThemedText>
          <ThemedText style={styles.body}>
            {session.quizTitle}
          </ThemedText>
          <ThemedText style={styles.meta}>
            进度 {progress} · 已答对 {session.correctCount} 题
          </ThemedText>

          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.btnGhost, busy && styles.btnDisabled]}
              onPress={onDiscard}
              disabled={busy}
            >
              <ThemedText style={styles.btnGhostText}>重新开始</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, busy && styles.btnDisabled]}
              onPress={onContinue}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.btnText}>继续</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  title: {
    marginBottom: 4,
  },
  body: {
    fontSize: 15,
    color: '#333',
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
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
});
