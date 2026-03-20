# 行业题目数据格式调研报告

> 调研日期：2026-03-14

## 一、国际标准

### 1. IMS QTI 3.0 (Question and Test Interoperability)

**业界最权威标准**，由 IMS Global Learning Consortium 制定。广泛应用于教育机构、考试系统、LMS 平台。

```json
{
  "identifier": "q1",
  "title": "选择题示例",
  "time-dependent": false,
  "adaptive": false,

  "response-declaration": [
    { "identifier": "RESPONSE", "baseType": "identifier" }
  ],
  "outcome-declaration": [
    { "identifier": "SCORE", "baseType": "float" }
  ],

  "item-body": {
    "choice-interaction": {
      "response-identifier": "RESPONSE",
      "shuffle": true,
      "max-choices": 1,
      "prompt": "题目内容",
      "simple-choice": [
        { "identifier": "choiceA", "label": "选项A内容" },
        { "identifier": "choiceB", "label": "选项B内容" }
      ]
    }
  },

  "response-processing": {
    "if": { "match": ["RESPONSE", "choiceA"] },
    "then": { "set-outcome-value": ["SCORE", 1] }
  }
}
```

**核心特点：**
- 支持响应声明、结果声明、模板声明
- 题目内容与评分逻辑分离
- 支持自适应测试
- 支持共享刺激材料（如阅读理解共用材料）

**支持 22 种题型：**
| 题型 | 说明 |
|------|------|
| Choice Interaction | 单选/多选题 |
| Text Entry Interaction | 文本输入题 |
| Extended Text Interaction | 扩展文本（作文） |
| Gap Match Interaction | 填空匹配题 |
| Hotspot Interaction | 热点选择题（点击图片区域） |
| Hot Text Interaction | 热文本选择题 |
| Inline Choice Interaction | 内联选择题 |
| Match Interaction | 匹配题 |
| Order Interaction | 排序题 |
| Graphic Order Interaction | 图形排序题 |
| Associate Interaction | 关联题 |
| Graphic Associate Interaction | 图形关联题 |
| Graphic Gap Match Interaction | 图形填空匹配 |
| Media Interaction | 媒体交互题 |
| Position Object Interaction | 对象定位题 |
| Select Point Interaction | 选点题 |
| Slider Interaction | 滑块题 |
| Upload Interaction | 上传题 |
| Drawing Interaction | 绘图题 |
| End Attempt Interaction | 结束尝试 |
| Custom Interaction | 自定义交互 |
| Portable Custom Interaction | 可移植自定义交互 |

**参考链接：** https://www.imsglobal.org/spec/qti/v3p0/impl/

---

### 2. Schema.org Question

**语义网标准**，SEO 友好，搜索引擎可识别。适用于网页题目展示。

```json
{
  "@type": "Question",
  "text": "Which number is prime?",
  "eduQuestionType": "Multiple choice",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "7",
    "answerExplanation": "7 只能被 1 和 7 整除"
  },
  "suggestedAnswer": [
    { "@type": "Answer", "text": "4" },
    { "@type": "Answer", "text": "6" },
    { "@type": "Answer", "text": "9" }
  ]
}
```

**核心特点：**
- 基于 RDF/JSON-LD 格式
- 搜索引擎可直接解析
- 结构简单，易于嵌入网页
- 支持 `eduQuestionType` 标识题型

**继承层次：** Thing > CreativeWork > Comment > Question

**主要属性：**
| 属性 | 类型 | 说明 |
|------|------|------|
| `text` | Text | 题目内容 |
| `eduQuestionType` | Text | 题型（如 "Multiple choice", "Open ended", "Flashcard"） |
| `acceptedAnswer` | Answer | 正确答案 |
| `suggestedAnswer` | Answer[] | 所有候选答案（含错误选项） |
| `answerCount` | Integer | 答案数量 |

**参考链接：** https://schema.org/Question

---

## 二、主流平台格式

### 1. Canvas LMS (Instructure)

全球最大开源学习管理系统，被成千上万的学校和大学使用。

```json
{
  "id": 1,
  "quiz_id": 2,
  "assessment_question_bank_id": 3,
  "position": 1,
  "question_name": "Prime Number Identification",
  "question_type": "multiple_choice_question",
  "question_text": "Which of the following is NOT a prime number?",
  "points_possible": 5,
  "correct_comments": "That's correct!",
  "incorrect_comments": "Unfortunately, that IS a prime number.",
  "neutral_comments": "Goldbach's conjecture...",
  "answers": [
    {
      "id": 6656,
      "answer_text": "Constantinople",
      "answer_weight": 100,
      "answer_comments": "Remember to check your spelling..."
    }
  ]
}
```

**支持的题型：**
| question_type | 说明 |
|---------------|------|
| `multiple_choice_question` | 单选题 |
| `multiple_answers_question` | 多选题 |
| `true_false_question` | 判断题 |
| `fill_in_multiple_blanks_question` | 多空填空题 |
| `matching_question` | 匹配题 |
| `numerical_question` | 数值题 |
| `essay_question` | 问答题 |
| `file_upload_question` | 文件上传题 |
| `calculated_question` | 计算题 |
| `multiple_dropdowns_question` | 多下拉选择题 |
| `short_answer_question` | 简答题 |
| `text_only_question` | 纯文本（不评分） |

**参考链接：** https://canvas.instructure.com/doc/api/quiz_questions.html

---

### 2. LeetCode (力扣)

全球知名在线编程练习平台。

```json
{
  "stat_status_pairs": [
    {
      "stat": {
        "question_id": 1,
        "frontend_question_id": "1. Two Sum",
        "question__title": "Two Sum",
        "question__title_slug": "two-sum",
        "question__article__live": true,
        "question__article__slug": "two-sum",
        "question__article__has_video_solution": true,
        "question__hide": false,
        "total_acs": 2500000,
        "total_submitted": 5000000,
        "is_new_question": false
      },
      "status": "ac",
      "difficulty": { "level": 1 },
      "paid_only": false,
      "is_favor": false,
      "frequency": 0,
      "progress": 0
    }
  ]
}
```

**难度等级：**
- `level: 1` - Easy
- `level: 2` - Medium
- `level: 3` - Hard

**核心特点：**
- 面向编程题，有在线判题系统
- 统计提交量、通过率
- 支持视频题解
- 会员专享题目标记

**参考链接：** https://leetcode.com/api/problems/algorithms/

---

### 3. Anki (记忆卡片软件)

开源间隔重复记忆软件，适合语言学习、考试复习。

**数据模型：**

```
层级关系：
Collection (集合)
├── Decks (牌组)
│   └── Cards (卡片)
└── Notes (笔记)
    └── Note Types (笔记类型)
        ├── Card Types (卡片类型)
        └── Fields (字段)
```

**笔记示例：**
```
French: Bonjour
English: Hello
Page: 12
```

**卡片模板：**
```
Front: {{French}}
Back: {{English}}<br>
       Page #{{Page}}
```

**内置笔记类型：**
| 类型 | 字段 | 说明 |
|------|------|------|
| Basic | Front, Back | 基础卡片 |
| Basic (reversed) | Front, Back | 创建两张卡片（正反问） |
| Cloze | Text | 填空删除题 |
| Image Occlusion | Image | 图像遮挡题 |

**核心特点：**
- 卡片与笔记分离（一个笔记可生成多张卡片）
- 支持自定义字段
- 支持模板语法
- 间隔重复算法

**参考链接：** https://docs.ankiweb.net/getting-started.html

---

### 4. Moodle GIFT 格式

Moodle 支持的文本导入格式，适合人工编写。

```
// 单选题
What is 2+2? {
    =4
    ~3
    ~5
}

// 多选题
Which are even? {
    ~%50%2
    ~%50%4
    ~%-50%3
    ~%-50%5
}

// 判断题
The sky is blue.{T}

// 填空题
The capital of France is {=Paris}.

// 匹配题
Match countries with capitals {
    =China -> Beijing
    =Japan -> Tokyo
    =Korea -> Seoul
}
```

**语法说明：**
| 符号 | 含义 |
|------|------|
| `=` | 正确答案 |
| `~` | 错误答案 |
| `~%50%` | 部分得分（50%） |
| `#` | 答案反馈 |
| `//` | 注释 |
| `{T}` | 正确 |
| `{F}` | 错误 |

---

## 三、格式对比分析

| 标准/平台 | 复杂度 | 题型支持 | 国际化 | 互操作性 | 适用场景 |
|-----------|--------|----------|--------|----------|----------|
| **QTI 3.0** | 高 | 22种 | ✅ | ✅ | 企业级考试系统、系统间迁移 |
| **Schema.org** | 低 | 通用 | ✅ | ✅ | SEO、语义化网页、简单场景 |
| **Canvas** | 中 | 12种 | ✅ | ✅ | LMS 系统、教育机构 |
| **LeetCode** | 低 | 编程题 | ✅ | ❌ | 在线判题系统 |
| **Anki** | 低 | 闪卡 | ✅ | ✅ | 记忆复习、间隔重复 |
| **GIFT** | 低 | 通用 | ✅ | ✅ | 人工编写、批量导入 |

---

## 四、设计建议

### 1. 内部格式设计原则

考虑到本项目定位（开源、轻量、易用），建议采用**简化版 JSON 格式**：

```typescript
/**
 * 题目类型枚举
 */
type QuestionType =
  | 'single'        // 单选题
  | 'multiple'      // 多选题
  | 'judge'         // 判断题
  | 'fill'          // 填空题
  | 'short_answer'  // 简答题
  | 'matching'      // 匹配题
  | 'ordering';     // 排序题

/**
 * 题目核心字段（必须）
 */
interface QuestionCore {
  id: string;              // 唯一标识
  type: QuestionType;      // 题型
  content: string;         // 题干内容
  answer: string | string[];  // 正确答案
}

/**
 * 题目扩展字段（可选）
 */
interface QuestionExt {
  options?: string[];      // 选项（选择题）
  explanation?: string;    // 解析
  source?: string;         // 来源（如"2017年江苏省事业单位真题"）
  difficulty?: 1 | 2 | 3;  // 难度等级（简单/中等/困难）
  tags?: string[];         // 标签分类
  points?: number;         // 分值
  language?: string;       // 语言（如"zh-CN"）
  image?: string;          // 题目图片 URL
  audio?: string;          // 题目音频 URL
  createdAt?: number;      // 创建时间戳
  updatedAt?: number;      // 更新时间戳
}

/**
 * 完整题目类型
 */
interface Question extends QuestionCore, QuestionExt {}

/**
 * 作答记录
 */
interface AnswerRecord {
  answeredAt: number;      // 作答时间戳
  userAnswer: string;      // 用户答案
  isCorrect: boolean;      // 是否正确
  timeSpent?: number;      // 作答耗时（秒）
}
```

### 2. 导入格式支持

```typescript
type ImportFormat =
  | 'qti-json'       // QTI 3.0 JSON
  | 'canvas-json'    // Canvas LMS 格式
  | 'schema-org'     // Schema.org 格式
  | 'simple-json'    // 简化 JSON（本项目格式）
  | 'markdown'       // Markdown 格式
  | 'gift';          // Moodle GIFT 格式
```

### 3. 导出格式支持

```typescript
type ExportFormat =
  | 'simple-json'    // 本项目格式（默认）
  | 'qti-json'       // QTI 3.0 兼容格式
  | 'schema-org'     // Schema.org JSON-LD
  | 'markdown'       // Markdown 文档
  | 'csv';           // CSV 表格
```

### 4. 兼容性映射

| 本项目字段 | QTI 3.0 | Canvas | Schema.org |
|------------|---------|--------|------------|
| `id` | `identifier` | `id` | `@id` |
| `type` | `choice-interaction` 类型 | `question_type` | `eduQuestionType` |
| `content` | `prompt` | `question_text` | `text` |
| `options` | `simple-choice` | `answers[].answer_text` | `suggestedAnswer[].text` |
| `answer` | 正确的 `identifier` | `answer_weight=100` | `acceptedAnswer.text` |
| `explanation` | `modal-feedback` | `correct_comments` | `answerExplanation` |
| `difficulty` | - | - | - |
| `tags` | - | - | - |

---

## 五、参考资料

- [IMS QTI 3.0 Specification](https://www.imsglobal.org/spec/qti/v3p0/impl/)
- [Schema.org Question Type](https://schema.org/Question)
- [Canvas LMS Quiz Questions API](https://canvas.instructure.com/doc/api/quiz_questions.html)
- [Anki Manual](https://docs.ankiweb.net/getting-started.html)
- [Moodle GIFT Format](https://docs.moodle.org/en/GIFT_format)
