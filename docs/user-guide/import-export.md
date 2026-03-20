# 导入导出

数据备份与恢复指南。

## 导出备份

### 操作步骤

1. 进入"设置"页面
2. 点击"导出题目"按钮
3. 浏览器自动下载 `questions_xxx.json` 文件

### 导出文件格式

```json
[
  {
    "id": "q_001",
    "type": "single",
    "content": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "A",
    "explanation": "解析内容",
    "createdAt": 1700000000000
  },
  ...
]
```

### 用途

- **备份**：防止数据丢失
- **迁移**：在另一台设备导入
- **分享**：发送给他人使用
- **编辑**：用文本编辑器批量修改

## 导入题库

### 操作步骤

1. 准备好 JSON 格式的题库文件
2. 进入"设置"页面
3. 点击"选择文件"
4. 选择题库文件
5. 等待导入完成

### 支持的格式

#### 格式一：题目数组

```json
[
  {
    "id": "q_001",
    "type": "single",
    "content": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "A",
    "createdAt": 1700000000000
  },
  {
    "id": "q_002",
    "type": "judge",
    "content": "判断题内容",
    "answer": true,
    "createdAt": 1700000000000
  }
]
```

#### 格式二：带元信息的题库

```json
{
  "metadata": {
    "id": "my-question-bank",
    "name": "我的题库",
    "questionCount": 100
  },
  "questions": [
    { "id": "q_001", ... },
    { "id": "q_002", ... }
  ]
}
```

### 导入规则

- **重复检测**：相同 `id` 的题目会被跳过
- **格式验证**：格式错误的题目会被跳过
- **结果提示**：显示成功导入数量和错误数量

## 使用官方题库

项目提供了示例题库，位于 `question-banks/` 目录。

### 导入方法

1. 下载仓库中的题库文件（如 `question-banks/jiangsu-institution/questions.json`）
2. 在应用中导入该文件

### 可用题库

| 题库 | 说明 |
|------|------|
| jiangsu-institution | 江苏事业编 - 计算机专业技术岗 |

## 批量编辑题目

### 方法一：导出后编辑

1. 导出题目为 JSON 文件
2. 用文本编辑器或 JSON 编辑器修改
3. 清空应用中的题目
4. 导入修改后的文件

### 方法二：直接编辑 JSON

使用 VS Code、Notepad++ 等编辑器打开 JSON 文件：

```json
{
  "id": "q_001",
  "type": "single",
  "content": "修改题目内容",  // 修改这里
  "options": [
    "修改选项A",              // 修改选项
    "选项B",
    "选项C",
    "选项D"
  ],
  "answer": "A",
  "explanation": "添加解析",  // 添加解析
  "difficulty": 2,           // 添加难度
  "tags": ["标签1", "标签2"] // 添加标签
}
```

## 数据安全

### 存储位置

数据存储在浏览器的 IndexedDB 中：

- Chrome：`~/Library/Application Support/Google/Chrome/Default/IndexedDB/`
- Safari：`~/Library/Safari/Databases/`
- Firefox：`~/Library/Application Support/Firefox/Profiles/xxx/storage/default/`

### 数据不会丢失的情况

- 关闭浏览器
- 重启电脑
- 更新应用

### 数据会丢失的情况

- 清除浏览器数据
- 使用隐私/无痕模式
- 卸载浏览器

### 最佳实践

1. **定期备份**：每周导出一次
2. **多云备份**：保存到云盘（iCloud、Google Drive 等）
3. **版本管理**：文件名加上日期，如 `questions_20240115.json`
