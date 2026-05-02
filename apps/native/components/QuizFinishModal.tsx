// 单轮刷题结束后的成绩弹窗。

import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

interface Props {
  visible: boolean;
  total: number;
  correct: number;
  /** 单位：秒。来源 quizStore.startedAt 与 Date.now() 的差。 */
  durationSec: number | null;
  onRetry: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} 分钟` : `${m} 分 ${s} 秒`;
}

export default function QuizFinishModal({
  visible,
  total,
  correct,
  durationSec,
  onRetry,
  onClose,
}: Props) {
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  const headline =
    rate >= 90 ? '太棒了！🎉' : rate >= 60 ? '继续努力 💪' : '再来一次吧 📚';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ThemedText type="title" style={styles.headline}>
            {headline}
          </ThemedText>

          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <ThemedText style={styles.scoreNumber}>{correct}</ThemedText>
              <ThemedText style={styles.scoreLabel}>答对</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreItem}>
              <ThemedText style={styles.scoreNumber}>{total}</ThemedText>
              <ThemedText style={styles.scoreLabel}>总题</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreItem}>
              <ThemedText style={styles.scoreNumber}>{rate}%</ThemedText>
              <ThemedText style={styles.scoreLabel}>正确率</ThemedText>
            </View>
          </View>

          {durationSec !== null && (
            <ThemedText style={styles.duration}>
              用时 {formatDuration(durationSec)}
            </ThemedText>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={onRetry}
            >
              <ThemedText style={styles.btnGhostText}>再来一轮</ThemedText>
            </Pressable>
            <Pressable style={styles.btn} onPress={onClose}>
              <ThemedText style={styles.btnText}>完成</ThemedText>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headline: {
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(10,126,164,0.06)',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  duration: {
    marginTop: 16,
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 24,
  },
  btn: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
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
