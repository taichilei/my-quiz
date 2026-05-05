# 贡献指南

## 你可以怎么贡献

- 🐛 **报告 Bug**：通过 Issue 提交，使用 Bug 模板
- 🚀 **提议新功能**：通过 Issue 提交，使用 Feature 模板
- 📝 **改进文档**：直接提 PR
- 📚 **贡献题库**：参考 [题目格式规范](./docs/question-schema.md)
- 💻 **贡献代码**：先开 Issue 讨论方案，再提 PR

## Commit 规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范。

### 格式

\`\`\`
<type>: <简短描述>

[可选的详细说明]
\`\`\`

### 类型（type）

| type | 用途 | 示例 |
|---|---|---|
| `feat` | 新功能 | `feat: 添加错题本一键重刷` |
| `fix` | 修复 bug | `fix: 修复 Makefile 路径错误` |
| `docs` | 文档变更 | `docs: 更新 README 截图` |
| `refactor` | 重构（不改功能） | `refactor: 拆分独立 Exam 表` |
| `chore` | 杂项（依赖、配置） | `chore: add issue templates` |
| `style` | 代码格式 | `style: format with prettier` |
| `test` | 测试相关 | `test: add auth handler tests` |
| `perf` | 性能优化 | `perf: 题目列表添加 GIN 索引` |
| `build` | 构建相关 | `build: upgrade vite to 5.4` |
| `ci` | CI 配置 | `ci: add github actions workflow` |

### 描述约定

中英文都可以（项目里两种 commit 都常见），但同一条 commit 内不要混用。

**中文：**
- 用动词开头（`添加`、`修复`、`重构`），不要 `加了`、`改完了` 这类完成态
- 句末不加句号

**英文：**
- 使用祈使句（`add`，不是 `added` / `adds`）
- 首字母小写
- 句末不加句号

**通用：**
- 整行不超过 72 字符
- 推荐用 scope 标注影响范围：`feat(web): ...`、`fix(server): ...`、`refactor(native): ...`

## 分支规范

本项目使用 `dev` 作为**主开发分支**（不是 `main`），所有 PR 都合并到 `dev`。

- `dev` —— 主开发分支，保持可发布状态
- `feat/xxx` —— 新功能
- `fix/xxx` —— 修复
- `refactor/xxx` —— 重构
- `docs/xxx` —— 文档

例：`feat/wrong-notes-replay`、`fix/makefile-path`

> 提 PR 时记得把目标分支选成 `dev`，GitHub 默认可能是 `main`。

## Issue 流程

1. 提 Issue 前，先搜一下是否已存在
2. 选择合适的模板：Feature / Bug / Refactor / Docs
3. 按模板字段尽量填完整
4. 重要变更建议先在 Issue 中讨论方案，再开始写代码

## Pull Request 流程

1. Fork 仓库（外部贡献者）或新建分支（项目成员）
2. 在新分支上开发，遵循 commit 规范
3. 提 PR 前请确保（按改动涉及的端执行）：
   - [ ] Web 前端：`cd apps/web && npm run lint && npm run typecheck && npm test`
   - [ ] Native 端：`cd apps/native && npm run lint && npm test`
   - [ ] 后端：`cd server && go test ./...`
   - [ ] 涉及多端类型契约（如新增 Question / Exam 字段）时，**web、native、server 三端类型同步更新**
4. PR 标题遵循 commit 规范
5. PR 描述中关联相关 Issue（如 `Closes #12`）

## 代码风格

工具配置（ESLint / Prettier / gofmt / EditorConfig）和缩进规范详见 [CLAUDE.md](./CLAUDE.md) 的"代码风格和格式化"段。

提交前**必须**运行（这是 PR Checklist 的硬性要求）：

\`\`\`bash
# 前端
cd apps/web
npm run lint:fix
npm run format

# 后端
cd server
gofmt -w .
\`\`\`

## 题库贡献

外部贡献题库请按以下方式：

1. 准备符合 [题目格式规范](./docs/question-schema.md) 的 JSON 文件
2. 开一个 Issue（用 Feature 模板），标题 `[题库] 考试名 + 年份`，并在附件中提供 JSON
3. 维护者审核内容后通过 `POST /api/uploads` 或后台脚本批量导入

要求：
- 内容准确（答案、解析正确）
- 标注来源（避免版权问题）
- 符合 JSON Schema


---