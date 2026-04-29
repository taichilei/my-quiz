# 项目架构

技术栈、目录结构、核心模块详解。

## 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |

### UI 与样式

| 技术 | 用途 |
|------|------|
| Tailwind CSS | 原子化 CSS 框架 |
| PostCSS | CSS 后处理器 |

### 数据存储

| 技术 | 用途 |
|------|------|
| localStorage | 保存未完成刷题进度（前端） |
| PostgreSQL | 后端主数据库（题目、答题记录） |

### 测试

| 技术 | 用途 |
|------|------|
| Vitest | 单元测试框架 |
| React Testing Library | React 组件测试 |

### PWA

| 技术 | 用途 |
|------|------|
| Service Worker | 离线缓存 |
| Web App Manifest | 应用配置 |

## 目录结构

```
web/
├── src/
│   ├── App.tsx             # 主应用（Tab 路由/全局状态管理）
│   ├── main.tsx            # 应用入口
│   ├── index.css           # 全局样式
│   ├── types.ts            # 所有 TypeScript 类型定义
│   │
│   ├── api/                # 后端 API 客户端
│   │   ├── client.ts       # API 封装（request、questionApi、examApi、recordApi）
│   │   └── client.test.ts  # API 单元测试
│   │
│   ├── components/         # React 组件
│   │   ├── QuizCard.tsx           # 刷题卡片
│   │   ├── QuizCard.test.tsx      # 刷题卡片测试
│   │   ├── QuestionList.tsx       # 题目列表管理
│   │   ├── QuestionForm.tsx       # 添加/编辑题目表单
│   │   ├── ExamSelector.tsx       # 按考试分类选择题目
│   │   ├── ContinueQuizModal.tsx  # 继续刷题弹窗
│   │   ├── WrongNotes.tsx         # 错题本
│   │   ├── Profile.tsx            # 用户统计信息、深色模式、导入导出
│   │   └── ImportExport.tsx       # 导入导出组件
│   │
│   ├── context/            # React Context
│   │   └── ThemeContext.tsx  # 深色主题切换
│   │
│   ├── utils/              # 工具函数
│   │   ├── import.ts       # 题目导入解析/验证
│   │   └── progressStorage.ts  # 未完成进度存储
│   │
│   ├── data/               # 初始数据
│   │   └── questions.ts    # 示例题目
│   │
│   ├── test/               # 测试配置
│   │   └── setup.ts        # 测试环境设置
│   │
│   ├── db.ts               # 兼容旧版 IndexedDB（已弃用，保留用于数据迁移）
│   └── db.test.ts          # db 单元测试
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

// 作答记录
export interface AnswerRecord {
  id: string;
  userId: string;
  questionId: string;
  userAnswer: string | boolean;
  isCorrect: boolean;
  answeredAt: number;
}

// 保存的未完成刷题进度
export interface SavedQuizProgress {
  isQuizActive: boolean;
  quizQuestionIds: string[];
  quizTitle: string;
  currentIndex: number;
  selectedAnswer?: string | boolean;
  showResult: boolean;
  correctCount: number;
  savedAt: number;
}
```

### 2. api/client.ts - API 客户端封装

封装所有与后端的 REST API 通信：

```typescript
// 获取题目列表
questionApi.list: (params?) => Promise<Question[]>

// CRUD operations
questionApi.create: (question) => Promise<Question>
questionApi.update: (id, question) => Promise<Question>
questionApi.delete: (id) => Promise<{ message: string }>

// 获取考试列表
examApi.list: () => Promise<ExamInfo[]>

// 创建答题记录
recordApi.create: (record) => Promise<AnswerRecord>

// 获取用户答题统计
recordApi.stats: (userId) => Promise<{ total, correct, rate }>
```

### 3. components/ - UI 组件

#### App.tsx

主应用组件，负责：
- 底部 Tab 路由切换（刷题 / 题库 / 我的）
- 题目数据加载
- 全局刷题状态管理（currentIndex, selectedAnswer, showResult, correctCount 等）
- 自动保存未完成进度到 localStorage
- 恢复进度弹窗提示

#### QuizCard.tsx

刷题卡片组件：
- 显示题目内容、图片、选项
- 处理用户选择（单选/多选/判断）
- 显示答案解析和对错
- 统计正确率
- 点击下一题

#### ExamSelector.tsx

试卷选择器：
- 按考试分组显示题目
- 支持选择整份试卷开始刷题
- 支持选择"全部题目"随机刷题

#### QuestionList.tsx

题目列表：
- 显示所有题目（按考试分组）
- 支持删除题目
- 支持编辑题目

#### QuestionForm.tsx

添加/编辑题目表单：
- 支持单选/多选/判断三种题型
- 表单验证
- 可选字段：难度、标签、考试信息、解析

#### ContinueQuizModal.tsx

继续刷题弹窗：
- 检测到未完成进度时弹出
- 显示上次刷题到第几题
- 提供"取消"和"继续刷题"选项

#### WrongNotes.tsx

错题本：
- 显示用户所有答错的题目
- 支持一键开始错题重刷

#### Profile.tsx

个人中心：
- 显示答题统计（总题数、正确率）
- 深色模式切换
- 导入导出功能入口

#### ImportExport.tsx

导入导出：
- 支持 JSON 文件导入题目
- 支持导出所有题目为 JSON
- 支持清空数据

### 4. utils/ - 工具函数

#### import.ts

```typescript
// 验证题目格式
export function validateQuestion(q: unknown): q is Question

// 导入题库文件
export async function importQuestionBank(file: File): Promise<ImportResult>

// 导出为 JSON
export function exportQuestionsJson(questions: Question[], filename: string): void
```

#### progressStorage.ts

```typescript
// 保存未完成刷题进度到 localStorage
export function saveQuizProgress(progress: Omit<SavedQuizProgress, 'savedAt'>): void

// 读取保存的进度
export function getSavedQuizProgress(): SavedQuizProgress | null

// 清除保存的进度
export function clearQuizProgress(): void

// 检查是否有未完成进度
export function hasUnfinishedProgress(): boolean
```

### 5. context/ThemeContext.tsx

- 提供深色/浅色主题切换功能
- 主题偏好保存到 localStorage

## 数据流

### 初始化流程

```
App.tsx
  │
  ├── useEffect(() => loadQuestions())
  │     │
  │     └── questionApi.list()       // 从后端 API 获取所有题目
  │
  ├── setQuestions(data)              // 更新状态
  │
  └── 检查 localStorage
       └── 如果有未完成进度 → 弹出"继续刷题"弹窗
```

### 刷题流程

```
App 全局维护状态：
  - quizQuestions: 当前刷题题目数组
  - currentIndex: 当前题号
  - selectedAnswer: 用户已选答案
  - showResult: 是否显示结果
  - correctCount: 答对题数
  - finished: 是否完成

↓

QuizCard.tsx 通过 props 接收状态
  │
  ├── 用户点击选项
  │     │
  │     ├── onSelectedAnswerChange(answer)  // 回调给 App
  │     ├── onShowResultChange(true)
  │     ├── 检查是否正确 → onCorrectCountChange
  │     └── 调用 recordApi.create() 记录作答到后端
  │
  └── 用户点击"下一题"
        │
        └── onCurrentIndexChange(currentIndex + 1)  // App 更新索引
            ↓
            清空 selectedAnswer，showResult = false
```

### 自动保存流程

```
用户刷新/关闭页面 → 触发 beforeunload 事件
  ↓
如果 isQuizActive && !finished → 保存当前状态到 localStorage
  ↓
保存内容：题目ID列表、当前索引、正确题数等
  ↓
用户重新打开应用 → App 初始化时检查 localStorage
  ↓
如果有未完成进度 → 弹出 ContinueQuizModal
  ↓
用户点击"继续" → 根据题目ID从全量题目恢复数组，恢复所有状态
用户点击"取消" → 清除 localStorage，正常启动
```

### 导入流程

```
ImportExport.tsx
  │
  ├── 用户选择文件
  │     │
  │     └── importQuestionBank(file)
  │               │
  │               ├── parseJsonFile()      // 解析 JSON
  │               ├── validateQuestion()   // 验证格式
  │               └── return { questions, errors }
  │
  └── 遍历调用 questionApi.create()   // 逐个创建到后端
```

## 状态管理设计

### 为什么把刷题状态提升到 App 层？

1. **方便自动保存进度**：所有状态都在 App，可以一次性保存到 localStorage
2. **方便恢复进度**：从 localStorage 恢复后，直接设置 App 状态即可
3. **组件职责清晰**：QuizCard 只负责渲染和用户交互，状态由父组件管理

### 保存进度时为什么只存题目 ID 列表？

- **节省空间**：localStorage 容量有限，不存储完整题目对象
- **避免数据不一致**：恢复时从后端重新获取最新题目数据
- **处理题目删除**：恢复时自动过滤已删除的题目，不影响进度恢复

## 构建与部署

### 开发模式

```bash
cd web
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

### 运行测试

```bash
npm run test          # 运行所有测试
npm run test:watch    # 监听模式
npx vitest run <file> # 运行单个测试
```

### 预览构建结果

```bash
npm run preview
```

### Docker 部署

整个项目（PostgreSQL + 后端 + 前端）使用 Docker Compose 部署：

```bash
make build   # 构建镜像
make up      # 启动所有服务
```

详见 [docker-compose.yml](../../../docker-compose.yml)

## 扩展指南

### 添加新题型

1. 更新 `web/src/types.ts`：
```typescript
export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill';
```

2. 更新 `web/src/components/QuizCard.tsx`：
```tsx
if (currentQuestion.type === 'fill') {
  // 填空题渲染逻辑
}
```

3. 更新 `web/src/components/QuestionForm.tsx`：
```tsx
<option value="fill">填空题</option>
```

4. 后端无需修改，使用动态 JSON 兼容

### 添加新功能

1. 在 `src/components/` 创建新组件
2. 在 `App.tsx` 添加 Tab 路由或入口
3. 如需后端 API，在 `server/handlers/` 添加处理器
4. 在 `web/src/api/client.ts` 添加 API 客户端方法

## 性能优化

### 当前优化

- 使用 `useMemo` 缓存打乱题目顺序的计算结果
- 后端分页支持（API 层面）
- Service Worker 缓存静态资源
- PWA 支持离线使用

### 可选优化

- 虚拟列表（题目列表过长时）
- 图片懒加载
- Web Worker 处理大量数据导入

## 项目演进

项目架构经历了两个阶段：

1. **v0.x** - 纯前端方案：React + IndexedDB，数据存储在浏览器本地，不支持多设备同步
2. **v1.x** - 前后端分离方案：React + Go + PostgreSQL，数据持久化在后端，支持多设备同步

### 未来迭代规划 (Roadmap)

为了进一步提升系统的专业性，后续将围绕以下核心点进行迭代（详见 [roadmap.md](../roadmap.md)）：

- **v1.1**: 引入独立 Exam 表、物理外键及逻辑删除。
- **v1.2**: 优化 Tags 的 GIN 索引及中文全文检索。
- **v2.0**: 实现完整用户体系及海量答题记录的分区化存储。
