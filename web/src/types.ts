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
 * 题目所属考试信息
 */
export interface ExamRef {
  name: string;       // 考试名称，如"2017年下半年江苏省事业单位招聘考试"
  year?: number;      // 年份，如 2017
  subject?: string;   // 科目，如"综合知识和能力素质"
  part: string;       // 部分，如"客观题"、"专业知识"、"实务题"
  order: number;      // 该部分内的题号，从 1 开始
}

/**
 * 作答记录
 */
export interface AnswerRecord {
  answeredAt: number;           // 作答时间戳（毫秒）
  userAnswer: string | boolean; // 用户答案
  isCorrect: boolean;           // 是否正确
  timeSpent?: number;           // 作答耗时（秒）
}

/**
 * 题目
 */
export interface Question {
  // ===== 必填字段 =====
  id: string;                      // 唯一标识
  type: QuestionType;              // 题型
  content: string;                 // 题干内容
  answer: string | boolean;        // 答案（single/multiple: string, judge: boolean）
  createdAt: number;               // 创建时间戳（毫秒）

  // ===== 选择题必填 =====
  options?: string[];              // 选项数组，顺序对应 A/B/C/D

  // ===== 可选字段 =====
  exam?: ExamRef;                  // 所属考试信息
  explanation?: string;            // 解析
  difficulty?: Difficulty;         // 难度等级
  tags?: string[];                 // 标签
  images?: string[];               // 图片相对路径列表
  sourceType?: DataSourceType;     // 数据来源类型

  // ===== 系统字段 =====
  updatedAt?: number;              // 更新时间戳（毫秒）
  answerHistory?: AnswerRecord[];  // 作答记录（本地存储）
}

/**
 * 上传文件信息
 */
export interface UploadedFile {
  id: string;              // 文件唯一标识
  name: string;            // 文件名
  type: string;            // 文件类型
  size: number;            // 文件大小（字节）
  url: string;             // 文件本地 URL
  createdAt: number;       // 上传时间戳
  sourceType?: DataSourceType; // 数据来源类型
}

/**
 * 题库元信息
 */
export interface QuestionBankMeta {
  id: string;              // 题库唯一标识
  name: string;            // 题库名称
  description?: string;    // 描述
  language?: string;       // 语言，如 "zh-CN"
  author?: string;         // 作者/贡献者
  source?: string;         // 来源
  createdAt: number;       // 创建时间戳
  updatedAt?: number;      // 更新时间戳
  questionCount: number;   // 题目数量
}
