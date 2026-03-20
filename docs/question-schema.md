# 题目数据格式规范 (Question Schema)

> 版本：1.0.0
> 更新日期：2026-03-14

## 一、概述

本文档定义了 my-quiz 项目的题目数据格式规范。设计原则：

- **简洁**：核心字段少，贡献者友好
- **可选**：扩展字段均为可选，不强制填写
- **国际化友好**：枚举值使用英文，显示层由 i18n 处理
- **离线可用**：图片采用本地文件 + 相对路径

---

## 二、类型定义

### 2.1 题目类型 (QuestionType)

```typescript
type QuestionType = 'single' | 'multiple' | 'judge';
```

| 值 | 说明 | 答案类型 |
|----|------|----------|
| `single` | 单选题 | string，如 `"A"` |
| `multiple` | 多选题 | string，如 `"A,B,C"` |
| `judge` | 判断题 | boolean，`true` 或 `false` |

### 2.2 难度等级 (Difficulty)

```typescript
type Difficulty = 1 | 2 | 3;
```

| 值 | 说明 |
|----|------|
| `1` | 简单 |
| `2` | 中等 |
| `3` | 困难 |

### 2.3 考试归属 (ExamRef)

```typescript
interface ExamRef {
  name: string;       // 考试名称，如"2017年下半年江苏省事业单位招聘考试"
  year?: number;      // 年份，如 2017
  subject?: string;   // 科目，如"综合知识和能力素质"
  part: string;       // 部分，如"客观题"、"专业知识"、"实务题"
  order: number;      // 该部分内的题号，从 1 开始
}
```

### 2.4 作答记录 (AnswerRecord)

```typescript
interface AnswerRecord {
  answeredAt: number;           // 作答时间戳（毫秒）
  userAnswer: string | boolean; // 用户答案
  isCorrect: boolean;           // 是否正确
  timeSpent?: number;           // 作答耗时（秒）
}
```

### 2.5 图片引用 (ImageRef)

```typescript
type ImageRef = string;  // 相对路径，如 "./images/2017_obj_15.png"
```

### 2.6 完整题目 (Question)

```typescript
interface Question {
  // ===== 必填字段 =====
  id: string;                      // 唯一标识
  type: QuestionType;              // 题型
  content: string;                 // 题干内容
  answer: string | boolean;        // 答案
  createdAt: number;               // 创建时间戳（毫秒）

  // ===== 选择题必填 =====
  options?: string[];              // 选项数组，顺序对应 A/B/C/D

  // ===== 可选字段 =====
  exam?: ExamRef;                  // 所属考试信息
  explanation?: string;            // 解析
  difficulty?: Difficulty;         // 难度等级
  tags?: string[];                 // 标签
  images?: ImageRef[];             // 图片相对路径列表

  // ===== 系统字段 =====
  updatedAt?: number;              // 更新时间戳（毫秒）
  answerHistory?: AnswerRecord[];  // 作答记录（本地存储）
}
```

---

## 三、字段详解

### 3.1 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 全局唯一标识，建议格式：`q_{考试}_{部分}_{题号}` |
| `type` | QuestionType | 题型枚举 |
| `content` | string | 题干内容，支持纯文本 |
| `answer` | string \| boolean | 答案，见下表 |
| `createdAt` | number | 创建时间戳（毫秒） |

**答案格式：**

| 题型 | 类型 | 示例 |
|------|------|------|
| single | string | `"A"` |
| multiple | string | `"A,B,C"`（逗号分隔，字母大写，已排序） |
| judge | boolean | `true`（正确）或 `false`（错误） |

### 3.2 选择题必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `options` | string[] | 选项数组，按顺序对应 A/B/C/D，至少 2 个选项 |

**示例：**
```json
{
  "options": ["选项A内容", "选项B内容", "选项C内容", "选项D内容"]
}
```

### 3.3 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `exam` | ExamRef | 所属考试信息，方便按试卷练习 |
| `explanation` | string | 答案解析 |
| `difficulty` | Difficulty | 难度等级：1=简单，2=中等，3=困难 |
| `tags` | string[] | 标签，如 `["计算机", "网络"]` |
| `images` | string[] | 图片相对路径列表 |

### 3.4 系统字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `updatedAt` | number | 最后更新时间戳 |
| `answerHistory` | AnswerRecord[] | 用户作答记录，存储在本地 IndexedDB |

---

## 四、示例

### 4.1 单选题

```json
{
  "id": "q_2017h2_js_obj_15",
  "type": "single",
  "content": "下列关于计算机网络的叙述中，正确的是：",
  "options": [
    "局域网的范围比广域网大",
    "城域网介于局域网和广域网之间",
    "互联网就是万维网",
    "以太网是一种广域网"
  ],
  "answer": "B",
  "exam": {
    "name": "2017年下半年江苏省事业单位招聘考试",
    "year": 2017,
    "subject": "综合知识和能力素质",
    "part": "客观题",
    "order": 15
  },
  "explanation": "城域网覆盖范围介于局域网和广域网之间，通常覆盖一个城市。",
  "difficulty": 2,
  "tags": ["计算机", "网络"],
  "createdAt": 1700000000000
}
```

### 4.2 多选题

```json
{
  "id": "q_2017h2_js_obj_23",
  "type": "multiple",
  "content": "以下哪些属于 OSI 七层模型的层次？",
  "options": [
    "会话层",
    "链路层",
    "表示层",
    "接口层"
  ],
  "answer": "A,B,C",
  "exam": {
    "name": "2017年下半年江苏省事业单位招聘考试",
    "year": 2017,
    "subject": "综合知识和能力素质",
    "part": "客观题",
    "order": 23
  },
  "explanation": "OSI 七层：物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。",
  "difficulty": 2,
  "tags": ["计算机", "网络", "OSI"],
  "createdAt": 1700000000000
}
```

### 4.3 判断题

```json
{
  "id": "q_2017h2_js_pro_01",
  "type": "judge",
  "content": "TCP协议提供面向连接的、可靠的数据传输服务。",
  "answer": true,
  "exam": {
    "name": "2017年下半年江苏省事业单位招聘考试",
    "year": 2017,
    "subject": "综合知识和能力素质",
    "part": "专业知识",
    "order": 1
  },
  "explanation": "TCP是传输层协议，提供面向连接、可靠、有序的数据传输。",
  "tags": ["计算机", "网络", "TCP"],
  "createdAt": 1700000000000
}
```

### 4.4 带图片的题目

```json
{
  "id": "q_2017h2_js_obj_35",
  "type": "single",
  "content": "如图所示的网络拓扑结构是：",
  "options": ["星型", "环型", "总线型", "树型"],
  "answer": "A",
  "images": ["./images/2017_obj_35.png"],
  "exam": {
    "name": "2017年下半年江苏省事业单位招聘考试",
    "year": 2017,
    "subject": "综合知识和能力素质",
    "part": "客观题",
    "order": 35
  },
  "createdAt": 1700000000000
}
```

---

## 五、题库目录结构

```
question-banks/
└── jiangsu-institution/           # 题库目录
    ├── metadata.json              # 题库元信息
    ├── questions.json             # 题目数据
    └── images/                    # 图片文件夹
        ├── 2017_obj_35.png
        ├── 2018_obj_12.png
        └── ...
```

### 5.1 metadata.json

```json
{
  "id": "jiangsu-institution",
  "name": "江苏事业编-计算机岗",
  "description": "江苏省事业单位招聘考试计算机专业技术岗真题",
  "language": "zh-CN",
  "author": "贡献者名称",
  "source": "真题整理",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "questionCount": 150
}
```

### 5.2 questions.json

```json
[
  { "id": "q_2017h2_js_obj_01", ... },
  { "id": "q_2017h2_js_obj_02", ... },
  ...
]
```

---

## 六、国际化方案

### 6.1 数据层

数据层使用语言无关的值：

- 题型：`single`, `multiple`, `judge`
- 判断题答案：`true`, `false`
- 难度：`1`, `2`, `3`

### 6.2 显示层

由 i18n 模块处理显示文本：

```typescript
// zh-CN
const i18n = {
  questionType: {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题'
  },
  judgeAnswer: {
    true: '正确',
    false: '错误'
  },
  difficulty: {
    1: '简单',
    2: '中等',
    3: '困难'
  }
};

// en-US
const i18n = {
  questionType: {
    single: 'Single Choice',
    multiple: 'Multiple Choice',
    judge: 'True/False'
  },
  judgeAnswer: {
    true: 'True',
    false: 'False'
  },
  difficulty: {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard'
  }
};
```

---

## 七、图片处理规范

### 7.1 存储方式

- 图片存放在题库目录的 `images/` 文件夹内
- JSON 中使用相对路径引用：`"./images/文件名.png"`

### 7.2 命名规范

建议命名格式：`{考试}_{部分}_{题号}.{扩展名}`

示例：`2017_obj_15.png`

### 7.3 支持格式

| 格式 | 扩展名 | 适用场景 |
|------|--------|----------|
| PNG | .png | 截图、图表（推荐） |
| JPEG | .jpg, .jpeg | 照片 |
| GIF | .gif | 动图 |
| SVG | .svg | 矢量图 |
| WebP | .webp | 现代格式，体积小 |

---

## 八、版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-14 | 初始版本 |
