import localforage from 'localforage';
import type { Question } from './types';
import { initialQuestions } from './data/questions';

localforage.config({
  name: 'my-quiz',
  storeName: 'questions',
});

const QUESTIONS_KEY = 'questions';
const INIT_KEY = 'initialized';

/**
 * 获取所有题目
 */
export async function getQuestions(): Promise<Question[]> {
  const questions = await localforage.getItem<Question[]>(QUESTIONS_KEY);
  return questions || [];
}

/**
 * 初始化题目（首次加载时）
 */
export async function initQuestions(): Promise<void> {
  const initialized = await localforage.getItem<boolean>(INIT_KEY);
  if (!initialized) {
    await localforage.setItem(QUESTIONS_KEY, initialQuestions);
    await localforage.setItem(INIT_KEY, true);
  }
}

/**
 * 保存题目
 */
export async function saveQuestion(question: Question): Promise<void> {
  const questions = await getQuestions();
  questions.push(question);
  await localforage.setItem(QUESTIONS_KEY, questions);
}

/**
 * 更新题目
 */
export async function updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
  const questions = await getQuestions();
  const index = questions.findIndex(q => q.id === id);
  if (index !== -1) {
    questions[index] = { ...questions[index], ...updates, updatedAt: Date.now() };
    await localforage.setItem(QUESTIONS_KEY, questions);
  }
}

/**
 * 删除题目
 */
export async function deleteQuestion(id: string): Promise<void> {
  const questions = await getQuestions();
  const filtered = questions.filter(q => q.id !== id);
  await localforage.setItem(QUESTIONS_KEY, filtered);
}

/**
 * 批量导入题目
 */
export async function importQuestions(newQuestions: Question[]): Promise<void> {
  const questions = await getQuestions();
  const existingIds = new Set(questions.map(q => q.id));
  const uniqueNewQuestions = newQuestions.filter(q => !existingIds.has(q.id));
  await localforage.setItem(QUESTIONS_KEY, [...questions, ...uniqueNewQuestions]);
}

/**
 * 导出所有题目
 */
export async function exportQuestions(): Promise<Question[]> {
  return await getQuestions();
}

/**
 * 清空所有题目
 */
export async function clearQuestions(): Promise<void> {
  await localforage.setItem(QUESTIONS_KEY, []);
  await localforage.setItem(INIT_KEY, false);
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 记录作答
 */
export async function recordAnswer(
  questionId: string,
  userAnswer: string | boolean,
  isCorrect: boolean,
  timeSpent?: number
): Promise<void> {
  const questions = await getQuestions();
  const index = questions.findIndex(q => q.id === questionId);
  if (index !== -1) {
    const question = questions[index];
    const answerRecord = {
      answeredAt: Date.now(),
      userAnswer,
      isCorrect,
      timeSpent,
    };
    question.answerHistory = question.answerHistory || [];
    question.answerHistory.push(answerRecord);
    question.updatedAt = Date.now();
    await localforage.setItem(QUESTIONS_KEY, questions);
  }
}
