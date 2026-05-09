// 同步源: apps/web/src/types.ts
// 修改时请保持两端一致；v2 升级 OpenAPI codegen 后此文件将自动生成。
//
// 与 Web 版的差异：
// - 删除 Upload / UploadedFile / QuestionBankMeta（RN 端不做文件上传 / 题库管理）
// - 新增 User / AuthResponse（auth 流需要）

/**
 * 数据来源类型
 */
export type DataSourceType = 'human' | 'machine';

/**
 * 题目类型
 *
 * - single / multiple / judge: 自动判分
 * - essay: 简答题/名词解释，自评判分
 */
export type QuestionType = 'single' | 'multiple' | 'judge' | 'essay';

/**
 * 难度等级
 * 1 = 简单, 2 = 中等, 3 = 困难
 */
export type Difficulty = 1 | 2 | 3;

/**
 * 考试信息（独立表）
 */
export interface Exam {
  id: number;
  name: string;
  year: number;
  subject: string;
  part: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 题目所属考试信息（精简版，用于嵌入题目）
 */
export interface ExamRef {
  name: string;
  year?: number;
  subject?: string;
  part: string;
}

/**
 * 考试列表项（带题目计数）
 */
export interface ExamInfo {
  id: number;
  name: string;
  year: number;
  subject: string;
  part: string;
  count: number;
}

/**
 * 作答记录
 */
export interface AnswerRecord {
  id?: number;
  userId: string;
  questionId: number;
  answeredAt: number;
  userAnswer: string | boolean;
  isCorrect: boolean;
  timeSpent?: number;
}

/**
 * 题目
 */
export interface Question {
  id: number;
  type: QuestionType;
  content: string;
  answer: string | boolean;
  createdAt: number;

  options?: string[];

  examId?: number;
  exam?: Exam;
  examOrder?: number;
  explanation?: string;
  difficulty?: Difficulty;
  tags?: string[];
  images?: string[];
  sourceType?: DataSourceType;

  updatedAt?: number;
  answerHistory?: AnswerRecord[];
  favorite?: boolean;
  uploadId?: number;
  pageNumber?: number;
}

/**
 * 刷题模式
 * - unanswered: 只刷未答过的题目（默认）
 * - wrong: 只刷答错的题目（v2）
 * - all: 所有题目随机
 */
export type QuizMode = 'unanswered' | 'wrong' | 'all';

/**
 * 保存的未完成刷题进度（本地 AsyncStorage 兜底）
 */
export interface SavedQuizProgress {
  isQuizActive: boolean;
  quizQuestionIds: number[];
  quizTitle: string;
  currentIndex: number;
  selectedAnswer?: string | boolean;
  showResult: boolean;
  correctCount: number;
  savedAt: number;
}

/**
 * 未完成刷题会话（后端存储，跨设备同步）
 */
export interface QuizSession {
  id: number;
  userId: string;
  quizTitle: string;
  questionIds: number[];
  currentIndex: number;
  selectedAnswer: string;
  showResult: boolean;
  correctCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 用户信息（后端 GET /api/user/me 返回）
 */
export interface User {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 登录 / 注册成功响应
 */
export interface AuthResponse {
  token: string;
  user: User;
}
