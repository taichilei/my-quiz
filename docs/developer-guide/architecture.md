# 项目架构

技术栈、目录结构、核心模块详解。

## 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 5.2 | 类型安全 |
| Vite | 5.0 | 构建工具 |

### UI 与样式

| 技术 | 用途 |
|------|------|
| Tailwind CSS | 原子化 CSS 框架 |
| PostCSS | CSS 后处理器 |

### 数据存储

| 技术 | 用途 |
|------|------|
| IndexedDB | 浏览器数据库 |
| localforage | IndexedDB 封装库 |

### PWA

| 技术 | 用途 |
|------|------|
| Service Worker | 离线缓存 |
| Web App Manifest | 应用配置 |

## 目录结构

```
web/
├── src/
│   ├── components/           # React 组件
│   │   ├── App.tsx           # 主应用（路由/状态）
│   │   ├── QuizCard.tsx      # 刷题卡片
│   │   ├── QuestionList.tsx  # 题目列表
│   │   ├── QuestionForm.tsx  # 添加题目表单
│   │   └── ImportExport.tsx  # 导入导出组件
│   │
│   ├── types.ts              # TypeScript 类型定义
│   ├── db.ts                 # 数据库操作封装
│   ├── utils/                # 工具函数
│   │   └── import.ts         # 导入解析/验证
│   ├── data/                 # 初始数据
│   │   └── questions.ts      # 示例题目
│   ├── main.tsx              # 应用入口
│   └── index.css             # 全局样式
│
├── public/                   # 静态资源
│   ├── manifest.json         # PWA 配置
│   ├── sw.js                 # Service Worker
│   └── icons/                # 应用图标
│
├── index.html                # HTML 入口
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目配置
```

## 核心模块

### 1. types.ts - 类型定义

定义所有 TypeScript 类型：

```typescript
// 题目类型
export type QuestionType = 'single' | 'multiple' | 'judge';

// 题目
export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  answer: string | boolean;
  // ...
}

// 考试归属
export interface ExamRef {
  name: string;
  part: string;
  order: number;
  // ...
}
```

### 2. db.ts - 数据库操作

封装 IndexedDB 操作：

```typescript
// 获取所有题目
export async function getQuestions(): Promise<Question[]>

// 保存题目
export async function saveQuestion(question: Question): Promise<void>

// 导入题目（批量）
export async function importQuestions(questions: Question[]): Promise<void>

// 导出题目
export async function exportQuestions(): Promise<Question[]>

// 记录作答
export async function recordAnswer(id: string, answer: string | boolean, isCorrect: boolean): Promise<void>
```

### 3. components/ - UI 组件

#### App.tsx

主应用组件，负责：
- 页面路由（Tab 切换）
- 题目数据加载
- 全局布局

#### QuizCard.tsx

刷题卡片组件：
- 显示题目内容和选项
- 处理用户选择
- 显示答案解析
- 统计正确率

#### QuestionList.tsx

题目列表组件：
- 显示所有题目
- 支持删除操作
- 显示题目详情

#### QuestionForm.tsx

添加题目表单：
- 表单验证
- 支持所有题型
- 可选字段（难度、标签、考试信息）

#### ImportExport.tsx

导入导出组件：
- 文件选择
- JSON 解析
- 导出下载
- 清空数据

### 4. utils/import.ts - 导入工具

```typescript
// 验证题目格式
export function validateQuestion(q: unknown): q is Question

// 导入题库文件
export async function importQuestionBank(file: File): Promise<ImportResult>

// 导出为 JSON
export function exportQuestionsJson(questions: Question[], filename: string): void
```

## 数据流

### 初始化流程

```
App.tsx
  │
  ├── useEffect(() => loadQuestions())
  │     │
  │     ├── initQuestions()     // 首次加载示例数据
  │     └── getQuestions()      // 获取所有题目
  │
  └── setQuestions(data)        // 更新状态
```

### 刷题流程

```
QuizCard.tsx
  │
  ├── 用户点击选项
  │     │
  │     ├── handleSelect()      // 记录选择
  │     └── setShowResult()     // 显示结果
  │
  └── 下一题
        │
        └── setCurrentIndex()   // 更新索引
```

### 导入流程

```
ImportExport.tsx
  │
  ├── 用户选择文件
  │     │
  │     └── importQuestionBank(file)
  │           │
  │           ├── parseJsonFile()      // 解析 JSON
  │           ├── validateQuestion()   // 验证格式
  │           └── return { questions, errors }
  │
  └── importQuestions(questions)  // 存入数据库
```

## 构建与部署

### 开发模式

```bash
npm run dev
```

- 启动 Vite 开发服务器
- 热更新
- 访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

- TypeScript 类型检查
- Vite 打包
- 输出到 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 扩展指南

### 添加新题型

1. 更新 `types.ts`：
```typescript
export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill';
```

2. 更新 `QuizCard.tsx`：
```tsx
if (currentQuestion.type === 'fill') {
  // 填空题渲染逻辑
}
```

3. 更新 `QuestionForm.tsx`：
```tsx
<option value="fill">填空题</option>
```

### 添加新功能

1. 在 `src/components/` 创建新组件
2. 在 `App.tsx` 添加路由
3. 如需数据持久化，在 `db.ts` 添加方法

## 性能优化

### 当前优化

- 使用 `useMemo` 缓存计算结果
- IndexedDB 异步存储
- Service Worker 缓存静态资源

### 可选优化

- 虚拟列表（题目列表过长时）
- 分页加载
- Web Worker 处理大量数据
