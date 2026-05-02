// 刷题会话全局 store。所有刷题状态（当前题号、已选答案、是否已展示结果、累计正确数）
// 都由这里持有；QuizCard 等组件只通过 props + 回调交互，不再持有重复状态。
//
// Action 内会 fire-and-forget 调后端 API：
//   - selectAnswer  → recordApi.create + sessionApi.upsert（保证下次能回到这道题）
//   - nextQuestion  → sessionApi.upsert（推进 currentIndex）
//   - startQuiz     → sessionApi.upsert（创建服务器会话）
//   - resetQuiz     → sessionApi.deleteCurrent
//   - 全部答完      → sessionApi.deleteCurrent（清掉未完成会话）
//
// 网络失败不阻塞 UI——后端同步是 best-effort，本地状态始终是真值；
// 真正的离线兜底在 M1.7 加 AsyncStorage 后再补。

import { create } from 'zustand';
import { recordApi, sessionApi } from '../api/client';
import type { Question, QuizSession } from '../types';
import { useAuthStore } from './authStore';

interface QuizState {
  // ===== 会话基础信息 =====
  isQuizActive: boolean;
  quizTitle: string;
  questions: Question[];

  // ===== 当前题状态 =====
  currentIndex: number;
  selectedAnswer: string | boolean;
  showResult: boolean;

  // ===== 累计统计 =====
  correctCount: number;
  finished: boolean;
  /** 本次刷题开始的时间戳（ms），用于计算用时 */
  startedAt: number | null;
  /** 当前题展示给用户的时间戳，selectAnswer 时计算 timeSpent */
  questionStartedAt: number | null;

  // ===== Actions =====
  startQuiz: (questions: Question[], title: string) => void;
  selectAnswer: (answer: string | boolean, isCorrect: boolean) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
  /** 从后端会话恢复（跨设备同步） */
  restoreFromSession: (
    session: QuizSession,
    questions: Question[]
  ) => void;
}

// ============================================================
// 后端同步：fire-and-forget，失败时只 console.warn 不抛错
// ============================================================

function getUserId(): string | null {
  const u = useAuthStore.getState().user;
  return u ? String(u.id) : null;
}

function answerToString(answer: string | boolean): string {
  return typeof answer === 'string' ? answer : String(answer);
}

function syncSession(
  state: Pick<
    QuizState,
    | 'quizTitle'
    | 'questions'
    | 'currentIndex'
    | 'selectedAnswer'
    | 'showResult'
    | 'correctCount'
  >
): void {
  const userId = getUserId();
  if (!userId) return;
  void sessionApi
    .upsert({
      userId,
      quizTitle: state.quizTitle,
      questionIds: state.questions.map((q) => q.id),
      currentIndex: state.currentIndex,
      selectedAnswer: answerToString(state.selectedAnswer),
      showResult: state.showResult,
      correctCount: state.correctCount,
    })
    .catch((e) => console.warn('[quizStore] session sync failed:', e));
}

function deleteSession(): void {
  const userId = getUserId();
  if (!userId) return;
  void sessionApi
    .deleteCurrent()
    .catch((e) => console.warn('[quizStore] session delete failed:', e));
}

function recordAnswer(
  question: Question,
  answer: string | boolean,
  isCorrect: boolean,
  timeSpent: number | undefined
): void {
  const userId = getUserId();
  if (!userId) return;
  void recordApi
    .create({
      userId,
      questionId: question.id,
      userAnswer: answerToString(answer),
      isCorrect,
      answeredAt: Date.now(),
      ...(timeSpent !== undefined ? { timeSpent } : {}),
    })
    .catch((e) => console.warn('[quizStore] record sync failed:', e));
}

// ============================================================

export const useQuizStore = create<QuizState>((set, get) => ({
  isQuizActive: false,
  quizTitle: '',
  questions: [],
  currentIndex: 0,
  selectedAnswer: '',
  showResult: false,
  correctCount: 0,
  finished: false,
  startedAt: null,
  questionStartedAt: null,

  startQuiz: (questions, title) => {
    const now = Date.now();
    set({
      isQuizActive: true,
      quizTitle: title,
      questions,
      currentIndex: 0,
      selectedAnswer: '',
      showResult: false,
      correctCount: 0,
      finished: false,
      startedAt: now,
      questionStartedAt: now,
    });
    syncSession({
      quizTitle: title,
      questions,
      currentIndex: 0,
      selectedAnswer: '',
      showResult: false,
      correctCount: 0,
    });
  },

  selectAnswer: (answer, isCorrect) => {
    const {
      questions,
      currentIndex,
      correctCount,
      quizTitle,
      questionStartedAt,
    } = get();
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    set({
      selectedAnswer: answer,
      showResult: true,
      correctCount: newCorrect,
    });

    const q = questions[currentIndex];
    if (q) {
      const timeSpent = questionStartedAt
        ? Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000))
        : undefined;
      recordAnswer(q, answer, isCorrect, timeSpent);
    }
    syncSession({
      quizTitle,
      questions,
      currentIndex,
      selectedAnswer: answer,
      showResult: true,
      correctCount: newCorrect,
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions, correctCount, quizTitle } = get();
    if (currentIndex + 1 >= questions.length) {
      // 答完了：清掉服务器会话
      set({ finished: true });
      deleteSession();
      return;
    }
    const newIndex = currentIndex + 1;
    set({
      currentIndex: newIndex,
      selectedAnswer: '',
      showResult: false,
      questionStartedAt: Date.now(),
    });
    syncSession({
      quizTitle,
      questions,
      currentIndex: newIndex,
      selectedAnswer: '',
      showResult: false,
      correctCount,
    });
  },

  finishQuiz: () => {
    set({
      isQuizActive: false,
      finished: true,
    });
    deleteSession();
  },

  resetQuiz: () => {
    set({
      isQuizActive: false,
      quizTitle: '',
      questions: [],
      currentIndex: 0,
      selectedAnswer: '',
      showResult: false,
      correctCount: 0,
      finished: false,
      startedAt: null,
      questionStartedAt: null,
    });
    deleteSession();
  },

  restoreFromSession: (session, questions) => {
    set({
      isQuizActive: true,
      quizTitle: session.quizTitle,
      questions,
      currentIndex: session.currentIndex,
      selectedAnswer: session.selectedAnswer,
      showResult: session.showResult,
      correctCount: session.correctCount,
      finished: false,
      startedAt: session.createdAt,
      questionStartedAt: Date.now(),
    });
  },
}));
