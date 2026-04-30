import type { Question, UploadedFile } from './types';
import {
  questionApi,
  recordApi,
  type AnswerRecord as APIAnswerRecord,
} from './api/client';

// 本地存储（降级使用）
import localforage from 'localforage';

localforage.config({
  name: 'my-quiz',
  storeName: 'questions',
});

const QUESTIONS_KEY = 'questions';
const USER_ID_KEY = 'userId';
const UPLOADED_FILES_KEY = 'uploadedFiles';

/**
 * 获取用户 ID（本地生成或从后端获取）
 */
export async function getUserId(): Promise<string> {
  let userId = await localforage.getItem<string>(USER_ID_KEY);
  if (!userId) {
    userId =
      'user_' +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2);
    await localforage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * 获取所有题目
 */
export async function getQuestions(): Promise<Question[]> {
  try {
    const questions = await questionApi.list();
    return questions as Question[];
  } catch /* eslint-disable no-empty */ {}
  // 降级到本地存储
  console.warn('API unavailable, using local storage');
  const questions = await localforage.getItem<Question[]>(QUESTIONS_KEY);
  return questions || [];
}

/**
 * 初始化题目（首次加载时）
 */
export async function initQuestions(): Promise<void> {
  try {
    // 尝试从后端获取
    await questionApi.list();
    // 后端已有数据，无需初始化
  } catch {
    // 后端不可用，降级到本地
    console.warn('API unavailable, using local storage');
    const initialized = await localforage.getItem<boolean>('initialized');
    if (!initialized) {
      await localforage.setItem(QUESTIONS_KEY, []);
      await localforage.setItem('initialized', true);
    }
  }
}

/**
 * 保存题目
 */
export async function saveQuestion(question: Question): Promise<void> {
  try {
    await questionApi.create(question as Omit<Question, 'id'>);
  } catch {
    // 降级到本地
    const questions = await getQuestions();
    questions.push(question);
    await localforage.setItem(QUESTIONS_KEY, questions);
  }
}

/**
 * 更新题目
 */
export async function updateQuestion(
  id: string,
  updates: Partial<Question>
): Promise<void> {
  try {
    await questionApi.update(Number(id), updates);
  } catch {
    // 降级到本地
    const questions = await getQuestions();
    const numId = Number(id);
    const index = questions.findIndex((q) => q.id === numId);
    if (index !== -1) {
      questions[index] = {
        ...questions[index],
        ...updates,
        updatedAt: Date.now(),
      };
      await localforage.setItem(QUESTIONS_KEY, questions);
    }
  }
}

/**
 * 删除题目
 */
export async function deleteQuestion(id: string): Promise<void> {
  try {
    await questionApi.delete(Number(id));
  } catch {
    // 降级到本地
    const questions = await getQuestions();
    const numId = Number(id);
    const filtered = questions.filter((q) => q.id !== numId);
    await localforage.setItem(QUESTIONS_KEY, filtered);
  }
}

/**
 * 批量导入题目
 */
export async function importQuestions(newQuestions: Question[]): Promise<void> {
  try {
    // 逐个创建
    for (const q of newQuestions) {
      await questionApi.create(q as Omit<Question, 'id'>);
    }
  } catch {
    // 降级到本地
    const questions = await getQuestions();
    const existingIds = new Set(questions.map((q) => q.id));
    const uniqueNewQuestions = newQuestions.filter(
      (q) => !existingIds.has(q.id)
    );
    await localforage.setItem(QUESTIONS_KEY, [
      ...questions,
      ...uniqueNewQuestions,
    ]);
  }
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
  // 仅清空本地，后端数据保留
  await localforage.setItem(QUESTIONS_KEY, []);
  await localforage.setItem('initialized', false);
}

/**
 * 重新从 question-banks 目录加载题目并合并
 */
export async function reloadQuestionBanks(): Promise<number> {
  // 静默失败，后端已内置题库
  console.warn('reloadQuestionBanks: not supported in API mode');
  return 0;
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
  const userId = await getUserId();
  const record: APIAnswerRecord = {
    userId,
    questionId: Number(questionId),
    userAnswer: String(userAnswer),
    isCorrect,
    timeSpent,
    answeredAt: Date.now(),
  };

  try {
    await recordApi.create(record);
  } catch {
    // 降级到本地存储
    const userId = await getUserId();
    const questions = await getQuestions();
    const numId = Number(questionId);
    const index = questions.findIndex((q) => q.id === numId);
    if (index !== -1) {
      const question = questions[index];
      question.answerHistory = question.answerHistory || [];
      question.answerHistory.push({
        userId,
        questionId: numId,
        answeredAt: Date.now(),
        userAnswer: String(userAnswer),
        isCorrect,
        timeSpent,
      });
      question.updatedAt = Date.now();
      await localforage.setItem(QUESTIONS_KEY, questions);
    }
  }
}

/**
 * 获取答题统计
 */
export async function getStats(): Promise<{
  total: number;
  correct: number;
  rate: number;
}> {
  const userId = await getUserId();
  try {
    return await recordApi.stats(userId);
  } catch {
    // 从本地 answerHistory 统计
    const questions = await getQuestions();
    let total = 0;
    let correct = 0;
    questions.forEach((q) => {
      if (q.answerHistory) {
        q.answerHistory.forEach((h) => {
          total++;
          if (h.isCorrect) correct++;
        });
      }
    });
    const rate = total > 0 ? correct / total : 0;
    return { total, correct, rate };
  }
}

/**
 * 获取错题列表（做错过的题目）
 */
export async function getWrongQuestions(): Promise<Question[]> {
  const all = await getQuestions();
  return all.filter(
    (q) => q.answerHistory && q.answerHistory.some((h) => !h.isCorrect)
  );
}

/**
 * 获取收藏题目列表
 */
export async function getFavoriteQuestions(): Promise<Question[]> {
  const all = await getQuestions();
  return all.filter((q) => q.favorite === true);
}

/**
 * 上传文件
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  // 生成唯一ID
  const id = generateId();

  // 创建文件URL
  const url = URL.createObjectURL(file);

  // 构建文件信息
  const uploadedFile: UploadedFile = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    url,
    createdAt: Date.now(),
    sourceType: 'human', // 默认设置为人工来源
  };

  // 保存到本地存储
  const files = await getUploadedFiles();
  files.push(uploadedFile);
  await localforage.setItem(UPLOADED_FILES_KEY, files);

  return uploadedFile;
}

/**
 * 获取所有上传的文件
 */
export async function getUploadedFiles(): Promise<UploadedFile[]> {
  try {
    const files = await localforage.getItem<UploadedFile[]>(UPLOADED_FILES_KEY);
    return files || [];
  } catch {
    return [];
  }
}

/**
 * 删除上传的文件
 */
export async function deleteUploadedFile(id: string): Promise<void> {
  try {
    const files = await getUploadedFiles();
    const filteredFiles = files.filter((file) => file.id !== id);
    await localforage.setItem(UPLOADED_FILES_KEY, filteredFiles);
  } catch {
    // 静默失败
  }
}

/**
 * 清空所有上传的文件
 */
export async function clearUploadedFiles(): Promise<void> {
  try {
    await localforage.setItem(UPLOADED_FILES_KEY, []);
  } catch {
    // 静默失败
  }
}
