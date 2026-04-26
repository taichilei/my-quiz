/**
 * 数据来源类型
 */
export type DataSourceType = 'human' | 'machine';

/**
 * 题目类型
 */
export type QuestionType = 'single' | 'multiple' | 'judge';

/**
 * 难度等级
 * 1 = 简单, 2 = 中等, 3 = 困难
 */
export type Difficulty = 1 | 2 | 3;

/**
 * 考试信息（独立表）
 */
export interface Exam {
  id: number; // 考试ID
  name: string; // 考试名称，如"2017年下半年江苏省事业单位招聘考试"
  year: number; // 年份，如 2017
  subject: string; // 科目，如"综合知识和能力素质"
  part: string; // 部分，如"客观题"、"专业知识"、"实务题"
  createdAt: number; // 创建时间戳
  updatedAt: number; // 更新时间戳
}

/**
 * 题目所属考试信息（精简版，用于嵌入题目）
 */
export interface ExamRef {
  name: string; // 考试名称，如"2017年下半年江苏省事业单位招聘考试"
  year?: number; // 年份，如 2017
  subject?: string; // 科目，如"综合知识和能力素质"
  part: string; // 部分，如"客观题"、"专业知识"、"实务题"
  order: number; // 该部分内的题号，从 1 开始
}

/**
 * 作答记录
 */
export interface AnswerRecord {
  id?: number; // 记录ID
  userId: string; // 用户ID
  questionId: number; // 题目ID
  answeredAt: number; // 作答时间戳（毫秒）
  userAnswer: string | boolean; // 用户答案
  isCorrect: boolean; // 是否正确
  timeSpent?: number; // 作答耗时（秒）
}

/**
 * 题目
 */
export interface Question {
  // ===== 必填字段 =====
  id: number; // 唯一标识
  type: QuestionType; // 题型
  content: string; // 题干内容
  answer: string | boolean; // 答案（single/multiple: string, judge: boolean）
  createdAt: number; // 创建时间戳（毫秒）

  // ===== 选择题必填 =====
  options?: string[]; // 选项数组，顺序对应 A/B/C/D

  // ===== 可选字段 =====
  examId?: number; // 考试ID（外键）
  exam?: Exam; // 关联的考试信息（预加载）
  examOrder?: number; // 题目在考试中的序号
  explanation?: string; // 解析
  difficulty?: Difficulty; // 难度等级
  tags?: string[]; // 标签
  images?: string[]; // 图片相对路径列表
  sourceType?: DataSourceType; // 数据来源类型

  // ===== 系统字段 =====
  updatedAt?: number; // 更新时间戳（毫秒）
  answerHistory?: AnswerRecord[]; // 作答记录（本地存储）
  favorite?: boolean; // 是否收藏
  uploadId?: number; // 来源文件ID
  pageNumber?: number; // 原文件页码
}

/**
 * 上传文件信息
 */
export interface UploadedFile {
  id: string; // 文件唯一标识
  name: string; // 文件名
  type: string; // 文件类型
  size: number; // 文件大小（字节）
  url: string; // 文件本地 URL
  createdAt: number; // 上传时间戳
  sourceType?: DataSourceType; // 数据来源类型
}

/**
 * 题库元信息
 */
export interface QuestionBankMeta {
  id: string; // 题库唯一标识
  name: string; // 题库名称
  description?: string; // 描述
  language?: string; // 语言，如 "zh-CN"
  author?: string; // 作者/贡献者
  source?: string; // 来源
  createdAt: number; // 创建时间戳
  updatedAt?: number; // 更新时间戳
  questionCount: number; // 题目数量
}

/**
 * 刷题模式
 * - unanswered: 只刷未答过的题目（默认）
 * - wrong: 只刷答错的题目
 * - all: 所有题目随机
 */
export type QuizMode = 'unanswered' | 'wrong' | 'all';

/**
 * 保存的未完成刷题进度
 */
export interface SavedQuizProgress {
  isQuizActive: boolean;
  quizQuestionIds: number[]; // 本次刷题题目ID列表
  quizTitle: string; // 刷题标题
  currentIndex: number; // 当前题号索引
  selectedAnswer?: string | boolean; // 当前题用户已选答案
  showResult: boolean; // 当前题是否已作答显示结果
  correctCount: number; // 已答对题目数量
  savedAt: number; // 保存时间戳
}

/**
 * 未完成刷题会话（后端存储，用于跨设备同步）
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
 * 考试列表项（带题目计数）
 */
export interface ExamInfo {
  id: number;
  name: string;
  year: number;
  subject: string;
  part: string;
  count: number; // 该考试题目数量
}

/**
 * 用户上传文件
 */
export interface Upload {
  id: number;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'pending' | 'parsing' | 'parsed' | 'failed';
  parsedAt?: number;
  errorMsg?: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}
