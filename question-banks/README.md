# 题库贡献指南

本目录存放各类考试的题库，欢迎贡献！

## 目录结构

```
question-banks/
└── {题库ID}/                    # 使用英文小写+连字符
    ├── metadata.json            # 题库元信息（必填）
    ├── questions.json           # 题目数据（必填）
    └── images/                  # 题目图片（可选）
        ├── 2017_obj_15.png
        └── ...
```

## 如何贡献

### 1. 创建新题库

在 `question-banks/` 下创建新目录，以题库 ID 命名：

```
question-banks/
└── guangdong-civil-service/     # 广东省考
    ├── metadata.json
    ├── questions.json
    └── images/
```

### 2. 编写 metadata.json

```json
{
  "id": "guangdong-civil-service",
  "name": "广东省公务员考试",
  "description": "广东省公务员录用考试真题",
  "language": "zh-CN",
  "author": "你的名字",
  "source": "历年真题整理",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "questionCount": 100,
  "tags": ["公务员", "广东"],
  "exams": [
    {
      "name": "2024年广东省公务员录用考试",
      "year": 2024,
      "subject": "行测"
    }
  ]
}
```

### 3. 编写 questions.json

题目数组，每道题遵循以下格式：

#### 单选题

```json
{
  "id": "q_2024_gd_01",
  "type": "single",
  "content": "题目内容？",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "answer": "A",
  "exam": {
    "name": "2024年广东省公务员录用考试",
    "year": 2024,
    "subject": "行测",
    "part": "言语理解",
    "order": 1
  },
  "explanation": "解析内容",
  "difficulty": 2,
  "tags": ["言语理解"],
  "createdAt": 1700000000000
}
```

#### 多选题

```json
{
  "id": "q_2024_gd_02",
  "type": "multiple",
  "content": "题目内容？",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "answer": "A,B,C",
  "exam": {
    "name": "2024年广东省公务员录用考试",
    "part": "常识判断",
    "order": 2
  },
  "tags": ["常识"],
  "createdAt": 1700000000000
}
```

#### 判断题

```json
{
  "id": "q_2024_gd_03",
  "type": "judge",
  "content": "题目内容。",
  "answer": true,
  "exam": {
    "name": "2024年广东省公务员录用考试",
    "part": "判断题",
    "order": 3
  },
  "createdAt": 1700000000000
}
```

### 4. 添加图片（可选）

如果题目包含图片：

1. 在题库目录下创建 `images/` 文件夹
2. 图片命名建议：`{考试}_{部分}_{题号}.png`
3. 在题目中引用：

```json
{
  "id": "q_2024_gd_04",
  "content": "如图所示，...",
  "images": ["./images/2024_gd_04.png"],
  ...
}
```

## 字段说明

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 全局唯一标识，建议格式：`q_{考试}_{部分}_{题号}` |
| `type` | string | 题型：`single`/`multiple`/`judge` |
| `content` | string | 题干内容 |
| `answer` | string/boolean | 答案（单选/多选用string，判断用boolean） |
| `createdAt` | number | 创建时间戳（毫秒） |

### 选择题必填

| 字段 | 类型 | 说明 |
|------|------|------|
| `options` | string[] | 选项数组，顺序对应 A/B/C/D |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `exam` | object | 所属考试信息 |
| `exam.name` | string | 考试名称 |
| `exam.year` | number | 年份 |
| `exam.subject` | string | 科目 |
| `exam.part` | string | 部分（如"客观题"、"专业知识"） |
| `exam.order` | number | 该部分内题号 |
| `explanation` | string | 解析 |
| `difficulty` | number | 难度：1=简单，2=中等，3=困难 |
| `tags` | string[] | 标签 |
| `images` | string[] | 图片相对路径 |

## 现有题库

| 题库 | 说明 | 题目数 |
|------|------|--------|
| [jiangsu-institution](./jiangsu-institution/) | 江苏事业编-计算机专业技术岗 | 20 |

## 提交贡献

1. Fork 本仓库
2. 添加或更新题库
3. 提交 Pull Request

感谢你的贡献！
