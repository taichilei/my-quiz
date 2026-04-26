import type { SavedQuizProgress } from '../types';

const STORAGE_KEY = 'my-quiz-progress';

/**
 * 保存刷题进度到 localStorage
 */
export function saveQuizProgress(
  progress: Omit<SavedQuizProgress, 'savedAt'>
): void {
  const data: SavedQuizProgress = {
    ...progress,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save quiz progress:', err);
  }
}

/**
 * 从 localStorage 读取刷题进度
 */
export function getSavedQuizProgress(): SavedQuizProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedQuizProgress;
  } catch (err) {
    console.error('Failed to parse saved quiz progress:', err);
    clearQuizProgress();
    return null;
  }
}

/**
 * 清除保存的刷题进度
 */
export function clearQuizProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear quiz progress:', err);
  }
}

/**
 * 检查是否有未完成的刷题进度
 */
export function hasUnfinishedProgress(): boolean {
  const progress = getSavedQuizProgress();
  return progress !== null && progress.isQuizActive;
}
