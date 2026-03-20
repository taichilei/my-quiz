# 贡献指南

感谢你考虑为 my-quiz 做贡献！

## 贡献方式

| 方式 | 说明 |
|------|------|
| 提交 Issue | 报告 Bug、提出功能建议 |
| 贡献代码 | 修复 Bug、添加新功能 |
| 贡献题库 | 整理并提交题库 JSON 文件 |
| 完善文档 | 改进文档、翻译 |

## 提交 Issue

### Bug 报告

请包含以下信息：

- 操作系统和浏览器版本
- 复现步骤
- 期望行为
- 实际行为
- 截图（如有）

### 功能建议

请说明：

- 功能描述
- 使用场景
- 期望的实现方式（可选）

## 贡献代码

### 开发流程

```bash
# 1. Fork 仓库
# 2. 克隆你的 Fork
git clone https://github.com/your-username/my-quiz.git
cd my-quiz

# 3. 创建分支
git checkout -b feature/your-feature-name

# 4. 安装依赖
cd web && npm install

# 5. 开发
npm run dev

# 6. 提交代码
git add .
git commit -m "feat: 添加 xxx 功能"

# 7. 推送到 Fork
git push origin feature/your-feature-name

# 8. 创建 Pull Request
```

### 代码规范

#### 提交信息

使用约定式提交：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `test` | 测试 |
| `chore` | 构建/工具变更 |

示例：

```
feat: 添加按标签筛选功能
fix: 修复多选题答案验证错误
docs: 更新安装文档
```

#### 代码风格

- 使用 TypeScript
- 使用函数式组件 + Hooks
- 遵循 ESLint 规则
- 变量/函数使用 camelCase
- 组件使用 PascalCase
- 常量使用 UPPER_SNAKE_CASE

#### 目录规范

```
src/
├── components/       # React 组件
│   └── ComponentName.tsx
├── hooks/            # 自定义 Hooks
│   └── useHookName.ts
├── utils/            # 工具函数
│   └── utilName.ts
├── types.ts          # 类型定义
└── db.ts             # 数据库操作
```

### Pull Request 规范

PR 标题格式：`类型: 简短描述`

PR 描述包含：

1. **变更内容**：做了什么修改
2. **关联 Issue**：Fixes #xxx
3. **测试方式**：如何验证变更
4. **截图**：如有 UI 变更

### 审核流程

1. 提交 PR
2. 等待审核
3. 根据反馈修改
4. 合并到 main 分支

## 贡献题库

### 题库格式

参考 [题目格式规范](../question-schema.md)。

### 提交流程

```bash
# 1. 在 question-banks/ 下创建新目录
mkdir question-banks/your-question-bank

# 2. 创建必要文件
touch question-banks/your-question-bank/metadata.json
touch question-banks/your-question-bank/questions.json
mkdir question-banks/your-question-bank/images  # 可选

# 3. 编写题库
# 编辑 metadata.json 和 questions.json

# 4. 提交
git add question-banks/your-question-bank
git commit -m "feat: 添加 xxx 题库"
git push
```

### 题库要求

- 内容准确：答案和解析正确
- 格式规范：符合 JSON Schema
- 版权合规：不侵犯他人版权
- 标注来源：注明题目出处

### 题库审核

- 格式验证：JSON 格式正确
- 内容抽检：随机检查题目准确性
- 完整性：metadata 信息完整

## 完善文档

### 文档结构

```
docs/
├── README.md              # 文档首页
├── user-guide/            # 用户文档
├── developer-guide/       # 开发者文档
├── question-schema.md     # 题目格式规范
└── industry-research.md   # 行业调研
```

### 文档规范

- 使用 Markdown 格式
- 中文文档
- 代码块标注语言
- 表格对齐
- 链接使用相对路径

### 翻译

欢迎将文档翻译成其他语言：

- 英文 (en)
- 日文 (ja)
- 韩文 (ko)

翻译文件放在 `docs/{lang}/` 目录。

## 开源协议

本项目采用 MIT 协议。贡献的代码将按相同协议开源。

## 联系方式

- GitHub Issues：提交问题和建议
- GitHub Discussions：讨论和交流

---

再次感谢你的贡献！
