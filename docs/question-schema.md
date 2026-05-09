# 题目数据格式规范 (Question Schema)

> 版本：1.2.0
> 更新日期：2026-05-08

## 一、概述

本文档定义了 my-quiz 项目的题目数据格式规范。设计原则：

- **简洁**：核心字段少，贡献者友好
- **可选**：扩展字段均为可选，不强制填写
- **国际化友好**：枚举值使用英文，显示层由 i18n 处理
- **可演进**：导入文件携带 `schemaVersion`，未来字段变更可识别老文件

### 1.1 v1.2.0 关键变更

| # | 变更 | 影响 |
|---|------|------|
| 1 | 新增题型 `essay`（简答题 / 名词解释） | 覆盖无客观选项、依赖人工评判的题目 |
| 2 | `essay` 题 `answer` 改为**可选**（其他题型仍必填） | 允许"裸题入库"作为抽认卡使用，鼓励后续补全参考答案 |
| 3 | `essay` 题**禁止 `options`**字段 | 校验侧拒收，避免脏数据 |
| 4 | 自评判分写入约定：用户「掌握 / 未掌握」直接落 `AnswerRecord.IsCorrect`，`userAnswer` 留空 | 简答题不存用户填写文本，只记是否掌握 |

### 1.2 v1.1.0 变更（保留）

| # | 变更 | 影响 |
|---|------|------|
| 1 | 拆分 `sourceId`（导入幂等键，string）和 `id`（系统主键，number） | 导入文件填 `sourceId`；`id` 由后端自增 |
| 2 | 判断题答案改 `string` `"true"` / `"false"` | 与后端 `Answer string` 对齐，少一层序列化 |
| 3 | `createdAt` 改可选 | 缺省由服务端填 server time |
| 4 | `metadata.schemaVersion` 必填 | 用于版本识别与未来兼容 |
| 5 | 多选答案规则明确：字母大写、逗号分隔、字典序排好 | 避免 `"a,b"` `"B,A"` 等不一致 |
| 6 | 文件形态固化为「单 JSON + metadata wrapper」 | 目录形态（含 images/）留给后续版本 |

---

## 二、类型定义

### 2.1 题目类型 (QuestionType)

```typescript
type QuestionType = 'single' | 'multiple' | 'judge' | 'essay';
```

| 值 | 说明 | 判分方式 |
|----|------|---------|
| `single` | 单选题 | 自动（与 `answer` 比对） |
| `multiple` | 多选题 | 自动（排序后与 `answer` 比对） |
| `judge` | 判断题 | 自动（与 `answer` 比对） |
| `essay` | 简答题 / 名词解释 | **自评**（用户看完参考答案后自己点「掌握/未掌握」） |

### 2.2 难度等级 (Difficulty)

```typescript
type Difficulty = 1 | 2 | 3;
```

| 值 | 说明 |
|----|------|
| `1` | 简单 |
| `2` | 中等 |
| `3` | 困难 |

### 2.3 答案格式 (Answer)

**所有题型答案均为字符串。** 这是 v1.1 的统一规则。

| 题型 | 类型 | 必填 | 规则 | 示例 |
|------|------|------|------|------|
| `single` | string | 是 | 单个字母大写 | `"A"` |
| `multiple` | string | 是 | 字母大写、逗号分隔、**字典序排好** | `"A,B,C"` |
| `judge` | string | 是 | `"true"` / `"false"`（小写、不带引号嵌套） | `"true"` |
| `essay` | string | **否** | 参考答案全文（多行可用 `\n`）；空字符串或缺省表示该题暂无参考答案，刷题时进入纯抽认卡模式 | `"DB 是 DataBase 的缩写，指数据库..."` |

**多选反例：** `"a,b,c"` / `"B,A,C"` / `"A, B, C"`（带空格）均**不合规**。

**essay 注意事项：**
- `answer` 为空时，导入工具应在 `metadata._warnings` 写一条提示（如 `"3 道 essay 题暂无参考答案，已作为抽认卡入库"`），便于后续人工补全
- 不要伪造答案。原文没标准答案就留空，不要凭推断填上

### 2.4 考试归属 (ExamRef)

```typescript
interface ExamRef {
  name: string;       // 必填，如"数据库习题"
  part: string;       // 必填，如"习题1"、"客观题"、"专业知识"
  year?: number;      // 可选，如 2017
  subject?: string;   // 可选，如"综合知识和能力素质"
}
```

> 导入文件里 `exam` 字段是 **嵌入式 ExamRef**，不写 `examId`。后端按 `(name, year, subject, part)` 复合唯一键 **upsert** 到 `exams` 表，同一组合多次导入不会建多个 exam。

### 2.5 完整题目 (Question)

```typescript
interface Question {
  // ===== 必填字段 =====
  sourceId: string;                // 业务幂等键（见 §3.1）
  type: QuestionType;              // 题型
  content: string;                 // 题干内容
  answer: string;                  // 答案（统一字符串，见 §2.3）；essay 题可为空字符串

  // ===== 选择题必填，essay/judge 不允许 =====
  options?: string[];              // 选项数组，按 A/B/C/D 顺序

  // ===== 可选字段 =====
  exam?: ExamRef;                  // 所属考试（嵌入式）
  examOrder?: number;              // 题目在考试中的序号
  explanation?: string;            // 解析
  difficulty?: Difficulty;         // 难度
  tags?: string[];                 // 标签
  images?: string[];               // 图片路径（v1.1 暂允许空数组；目录形态待后续版本）

  // ===== 可选时间戳 =====
  createdAt?: number;              // 缺省由服务端填
  updatedAt?: number;              // 缺省由服务端填
}
```

> **注意**：导入文件**不写 `id`**。`id: number` 是后端 `questions.id` 自增主键，导入时由后端分配。前端从 API 拿到的 `Question` 对象会带 `id`。

### 2.6 题库元信息 (Metadata)

```typescript
interface Metadata {
  schemaVersion: string;           // 必填，当前版本固定 "1.1.0"
  id: string;                      // 必填，题库唯一标识（slug，如 "db-exercises"）
  name: string;                    // 必填，题库展示名
  description?: string;            // 可选
  language?: string;               // 可选，如 "zh-CN"
  author?: string;                 // 可选
  source?: string;                 // 可选，如 "课本第 3 章习题"
  questionCount?: number;          // 可选，题目数量
  createdAt?: number;              // 可选
  updatedAt?: number;              // 可选
  _warnings?: string[];            // 可选，转换工具回填的警告（人工 review 用）
}
```

---

## 三、字段详解

### 3.1 `sourceId` 命名规则（重要）

`sourceId` 是导入幂等键：**同一 `sourceId` 多次导入只 upsert，不重复建题**。

**建议格式：** `{bank-slug}-{part-slug}-q{N}`

| 题库 | 部分 | 题号 | sourceId |
|------|------|------|----------|
| 数据库习题 | 习题1 | 1 | `db-ex-p1-q1` |
| 数据库习题 | 习题1 | 5 | `db-ex-p1-q5` |
| 江苏事业编 | 客观题 | 23 | `js-inst-obj-q23` |

**规则：**
- 全小写、`-` 分隔
- 不含中文（slug 化）
- `q` 前缀避免和数字 part 混
- 导入失败修复后**保留原 sourceId** 重导才能 upsert 而非新建

### 3.2 必填字段速查

| 字段 | 题型 | 类型 | 备注 |
|------|------|------|------|
| `sourceId` | 全部 | string | 幂等键 |
| `type` | 全部 | string 枚举 | single / multiple / judge / essay |
| `content` | 全部 | string | 题干 |
| `answer` | single / multiple / judge | string | 见 §2.3 答案格式 |
| `answer` | essay | string \| 缺省 | 可为空字符串 / 不写；空时进抽认卡模式 |
| `options` | single / multiple | string[] | 至少 2 个 |
| ~~`options`~~ | judge / essay | — | **禁止**填写，校验侧拒收 |

### 3.3 可选字段填充建议

转换工具默认应**尽力填**这些字段，提升题库可用性：

| 字段 | 不填的代价 | 填法 |
|------|-----------|------|
| `exam` | 无法按试卷筛选 | 至少填 `name` + `part` |
| `examOrder` | 失去原题号顺序 | 抄原 PDF/Word 的题号 |
| `explanation` | 错题复习时无解析参考 | 原文有就抄；没有就**不写**（**不要编造**） |
| `difficulty` | 无法按难度刷 | 简单 1 / 中等 2 / 困难 3，不确定填 2 |
| `tags` | 无法按知识点筛 | 学科 + 知识点 + 题型，至少 2-3 个 |

---

## 四、示例

### 4.1 完整题库文件（推荐形态）

```json
{
  "metadata": {
    "schemaVersion": "1.1.0",
    "id": "db-exercises",
    "name": "数据库习题",
    "language": "zh-CN",
    "author": "我",
    "source": "课本配套习题",
    "questionCount": 3
  },
  "questions": [
    {
      "sourceId": "db-ex-p1-q1",
      "type": "single",
      "content": "下列关于关系数据库的描述，正确的是：",
      "options": [
        "关系是有序的",
        "关系是元组的集合",
        "关系允许重复元组",
        "关系的属性顺序固定"
      ],
      "answer": "B",
      "exam": { "name": "数据库习题", "part": "习题1" },
      "examOrder": 1,
      "explanation": "关系是元组的无序集合，不允许重复，属性顺序无关。",
      "difficulty": 2,
      "tags": ["数据库", "关系模型", "基础"]
    },
    {
      "sourceId": "db-ex-p1-q5",
      "type": "multiple",
      "content": "下列哪些是关系数据库的完整性约束？",
      "options": ["实体完整性", "参照完整性", "用户自定义完整性", "排序完整性"],
      "answer": "A,B,C",
      "exam": { "name": "数据库习题", "part": "习题1" },
      "examOrder": 5,
      "difficulty": 2,
      "tags": ["数据库", "完整性约束"]
    },
    {
      "sourceId": "db-ex-p1-q10",
      "type": "judge",
      "content": "SQL 中 DELETE 语句不能删除表结构。",
      "answer": "true",
      "exam": { "name": "数据库习题", "part": "习题1" },
      "examOrder": 10,
      "explanation": "DELETE 删除数据；DROP TABLE 才删除表结构。",
      "difficulty": 1,
      "tags": ["SQL", "DML"]
    },
    {
      "sourceId": "db-ex-p1-q11",
      "type": "essay",
      "content": "名词解释：DBMS",
      "answer": "DBMS（DataBase Management System）数据库管理系统，是位于用户与操作系统之间的一层数据管理软件，负责对数据库进行统一的管理与控制。",
      "exam": { "name": "数据库习题", "part": "习题1" },
      "examOrder": 11,
      "difficulty": 1,
      "tags": ["数据库", "名词解释"]
    },
    {
      "sourceId": "db-ex-p1-q12",
      "type": "essay",
      "content": "人工管理阶段的数据管理有哪些特点？",
      "answer": "",
      "exam": { "name": "数据库习题", "part": "习题1" },
      "examOrder": 12,
      "difficulty": 2,
      "tags": ["数据库", "发展历史"]
    }
  ]
}
```

> 上面 `q12` 演示了「裸题」形态——`answer` 留空，刷题时只显示题干让用户回忆，配合自评按钮记掌握情况。后续若整理出参考答案，按相同 `sourceId` 重新导入即可 upsert 补全。

### 4.2 最小可用形态（仅必填）

```json
{
  "metadata": {
    "schemaVersion": "1.1.0",
    "id": "minimal",
    "name": "最小题库"
  },
  "questions": [
    {
      "sourceId": "min-q1",
      "type": "single",
      "content": "1+1=?",
      "options": ["1", "2", "3", "4"],
      "answer": "B"
    }
  ]
}
```

---

## 五、文件形态

**v1.1 固化形态：单 JSON 文件 + metadata wrapper**（即 §4.1 形态）。

向后兼容：导入工具同时接受**纯数组形态**（顶层就是 `Question[]`），但**不推荐**——少 metadata 就少 schemaVersion，未来演进困难。

> 目录形态（多文件 + `images/`）规划在 v1.2 引入图片支持时再做。当前 `images` 字段允许空数组占位。

---

## 六、国际化方案

数据层使用语言无关的值（`single` / `multiple` / `judge` / `essay` / `1` / `2` / `3` / `"true"` / `"false"`），显示层由 i18n 处理。详细映射见 v1.0 附录（保留不变）。

---

## 七、版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-14 | 初始版本 |
| 1.1.0 | 2026-05-08 | 拆 sourceId / id；判断题答案字符串化；createdAt 可选；metadata 加 schemaVersion；多选答案排序规则明确；文件形态固化为单 JSON wrapper |
| 1.2.0 | 2026-05-08 | 新增 `essay` 题型（简答题/名词解释），自评判分；essay 的 `answer` 改可选，`options` 禁止 |
