# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

My-Quiz 是一个刷题 Web 应用，采用前后端分离架构：
- **前端**：React + TypeScript，浏览器端渲染，支持 PWA 离线
- **后端**：Go + PostgreSQL，提供 RESTful API，数据持久化存储在数据库
- 支持多设备同步，核心功能：题目管理、随机刷题、错题本、统计信息、批量导入导出、未完成进度跨设备恢复

---

## 常用命令

### Docker 部署（完整栈）
```bash
make build    # 构建 Docker 镜像
make up       # 启动所有服务（PostgreSQL + server + web）
make down     # 停止所有服务
make restart  # 重启所有服务
make logs     # 查看服务日志
make clean    # 清理容器和镜像
make test     # 运行前端测试
make dev      # 显示本地开发命令提示
```

访问地址（Docker 启动后）：
- Web UI: http://localhost:3000
- API: http://localhost:8081
- PostgreSQL: localhost:5434

### 前端本地开发
```bash
cd web
npm install              # 安装依赖
npm run dev              # 启动开发服务器（http://localhost:5173）
npm run build            # 生产构建
npm run test             # 运行所有测试
npm run test:watch       # 监听模式运行测试
npx vitest run <file>    # 运行单个测试文件
npm run preview          # 预览构建结果
```

### 后端本地开发
```bash
cd server
go run main.go           # 启动服务器（端口 8080）
go build                 # 编译二进制
go test ./...            # 运行所有 Go 测试
go test ./handlers       # 运行 handlers 包的所有测试
go test ./handlers -run TestName  # 运行单个测试
```

### TypeScript 类型检查
```bash
cd web
npm run typecheck         # 类型检查（等同于 npx tsc --noEmit）
```

### 代码风格检查和格式化
```bash
cd web
npm run lint              # 检查 src 目录下的 TS/TSX 文件
npm run lint:fix          # 自动修复可修复的问题
npm run format            # Prettier 格式化 src 目录
```

---

## 代码架构

### 目录结构
```
my-quiz/
├── web/                    # 前端 React 应用
├── server/                 # Go 后端 API
├── database/               # 转换脚本和原始数据文件
│   ├── database/           # PostgreSQL 数据存储（Docker 卷挂载点，git 忽略）
│   ├── raw/                # 原始题目 JSON 文件（可选，不提交到 git）
│   └── scripts/            # 格式转换脚本（PDF/Markdown 批量导入工具）
├── docs/                   # 项目文档（PRD、用户指南、开发指南）
├── uploads/                # 用户上传文件（git 忽略）
├── Makefile                # Docker 部署命令
└── docker-compose.yml      # Docker Compose 配置（PostgreSQL + server + web）
```

**数据存储策略：**
- 所有题目、答题记录、会话数据都持久化存储在 **PostgreSQL 数据库**中
- 不将题库数据提交到 git 代码库，只保留转换脚本
- PostgreSQL 运行在本地 Docker 容器中，数据存储在 Docker 卷

### 前端架构（web/）

**核心文件：**
- `web/src/types.ts` - 所有 TypeScript 类型定义（Question, ExamRef, AnswerRecord, SavedQuizProgress 等）
- `web/src/main.tsx` - 应用入口
- `web/src/App.tsx` - 主应用，底部 Tab 路由和全局刷题状态管理
- `web/src/api/client.ts` - 后端 API 客户端封装（含单元测试）
- `web/src/index.css` - 全局样式
- `web/src/db.ts` - 兼容旧版 IndexedDB（已弃用，保留用于数据迁移）

**组件：**
- `QuizCard.tsx` - 刷题卡片，显示题目内容、图片、选项，处理用户作答，记录答案到后端，显示解析
- `QuizCard.test.tsx` - 刷题卡片单元测试
- `QuestionList.tsx` - 题目列表管理，按考试分组，支持删除题目
- `QuestionForm.tsx` - 添加/编辑题目表单，支持三种题型
- `ExamSelector.tsx` - 按考试分类选择，支持选择整卷刷题或随机刷题
- `ContinueQuizModal.tsx` - 未完成刷题进度恢复弹窗
- `QuizFinishModal.tsx` - 刷题完成统计弹窗
- `WrongNotes.tsx` - 错题本，显示所有答错题目，支持错题重刷
- `Profile.tsx` - 用户统计信息、深色模式切换、导入导出入口
- `ImportExport.tsx` - 题目批量导入导出组件
- `FileManager.tsx` - 文件管理器，管理上传的 PDF/图片文件

**上下文和工具：**
- `web/src/context/ThemeContext.tsx` - React Context，提供深色/浅色主题切换
- `web/src/utils/import.ts` - 题目导入验证和解析
- `web/src/utils/progressStorage.ts` - 未完成刷题进度本地存储（localStorage）

**技术：**
- React 18 + TypeScript 5
- Tailwind CSS 原子化样式
- Vite 构建工具
- Vitest + React Testing Library 测试框架
- PWA + Service Worker 离线缓存
- localStorage 本地缓存未完成进度

### 后端架构（server/）

**核心文件：**
- `server/main.go` - 入口，启动 Gin 引擎，注册路由
- `server/config/config.go` - 配置加载和数据库连接（GORM）
- `server/handlers/question.go` - 题目 CRUD 接口
- `server/handlers/question_test.go` - 题目接口单元测试（10 个测试）
- `server/handlers/record.go` - 答题记录接口
- `server/handlers/record_test.go` - 答题记录单元测试（5 个测试）
- `server/handlers/session.go` - 未完成刷题会话接口（跨设备同步）
- `server/handlers/session_test.go` - 会话接口单元测试（4 个测试）
- `server/handlers/upload.go` - 文件上传管理接口
- `server/handlers/upload_test.go` - 文件上传单元测试（9 个测试）
- `server/models/question.go` - 数据模型定义（题目、答题记录、刷题会话）
- `server/models/upload.go` - 上传文件数据模型

**API 路由：**
- `GET /api/questions` - 获取题目列表（支持按考试、类型、标签筛选）
- `GET /api/questions/:id` - 获取单个题目
- `POST /api/questions` - 创建题目
- `PUT /api/questions/:id` - 更新题目
- `DELETE /api/questions/:id` - 删除题目
- `GET /api/exams` - 获取所有考试列表
- `POST /api/records` - 创建答题记录
- `GET /api/records/:userId` - 获取用户答题记录
- `GET /api/records/:userId/stats` - 获取用户统计信息
- `GET /api/session/current` - 获取当前用户未完成刷题会话
- `POST /api/session` - 创建或更新当前刷题会话
- `DELETE /api/session/current` - 删除当前未完成刷题会话
- `GET /api/uploads` - 获取用户上传文件列表
- `GET /api/uploads/:id` - 获取单个文件信息
- `GET /api/uploads/:id/download` - 下载原文件
- `POST /api/uploads` - 上传文件
- `PUT /api/uploads/:id` - 更新文件信息（标题、描述）
- `DELETE /api/uploads/:id` - 删除文件（可选择同时删除关联题目）

**技术：**
- Go + Gin 框架
- PostgreSQL + GORM ORM
- CORS 支持跨域请求

---

## 数据模型

### 考试（Exam）- 独立表
```go
ID          int       // 数据库唯一标识（自增）
Name        string    // 考试名称
Year        int       // 年份
Subject     string    // 科目
Part        string    // 部分（如"客观题"）
CreatedAt   int64     // 创建时间戳
UpdatedAt   int64     // 更新时间戳
```

### 题目（Question）
```go
ID          int       // 数据库唯一标识（自增）
Type        string    // 题型: single|multiple|judge
Content     string    // 题干内容
Options     []string  // 选项数组（单选多选），JSON 序列化存储
Answer      string    // 正确答案
Explanation string    // 解析
Difficulty  int       // 难度（1=简单, 2=中等, 3=困难）
Tags        []string  // 标签，JSON 序列化存储
ExamID      *int      // 外键，关联到考试（可为空）
Exam        *Exam     // 关联的考试对象，GORM 外键关联
ExamOrder   int       // 题目在考试中的序号
Images      []string  // 图片 URL 列表，JSON 序列化存储
UploadID    *int      // 来源文件 ID（批量导入时关联上传的文件）
PageNumber  *int      // 来自原文件第几页
CreatedAt   int64     // 创建时间戳
UpdatedAt   int64     // 更新时间戳
```

### 答题记录（AnswerRecord）
```go
ID          int    // 数据库唯一标识（自增）
UserID      string // 用户标识
QuestionID  int    // 题目 ID
UserAnswer  string // 用户答案
IsCorrect   bool   // 是否正确
TimeSpent   int    // 作答耗时（秒）
AnsweredAt  int64  // 作答时间戳
```

### 刷题会话（QuizSession）- 跨设备进度同步
```go
ID             int       // 数据库唯一标识（自增）
UserID         string    // 用户标识
QuizTitle      string    // 刷题标题（如"2021江苏真题 - 全部"）
QuestionIDs    []int     // 题目 ID 列表，JSON 序列化存储
CurrentIndex   int       // 当前刷题到第几题
SelectedAnswer string    // 当前题目用户已选答案
ShowResult     bool      // 是否显示结果
CorrectCount   int       // 已答对题目数
CreatedAt      int64     // 创建时间戳
UpdatedAt      int64     // 更新时间戳
```

### 上传文件（Upload）
```go
ID          int          // 数据库唯一标识（自增）
UserID     string       // 用户标识
FileName    string       // 原始文件名
FileSize    int64        // 文件大小（字节）
FileType    string       // 文件类型: pdf/image/other
StoragePath string       // 磁盘存储路径（不返回前端）
Status      string       // 解析状态: pending/parsing/parsed/failed
ParsedAt    *int64       // 解析完成时间戳
ErrorMsg    *string      // 解析错误信息
Title       string       // 文件标题（可编辑）
Description string       // 文件描述
CreatedAt   int64        // 创建时间戳
UpdatedAt   int64        // 更新时间戳
```

---

## 开发说明

### 添加新题型步骤
1. 更新 `web/src/types.ts` 中的 `QuestionType` 联合类型
2. 更新 `web/src/components/QuizCard.tsx` 添加渲染逻辑
3. 更新 `web/src/components/QuestionForm.tsx` 添加表单选项
4. 后端无需修改，使用动态 JSON 结构兼容

### 环境变量
- 后端：`PORT` - 服务端口（默认 8080），`POSTGRES_URI` - PostgreSQL 连接字符串
- 前端：`VITE_API_URL` - 后端 API 地址（默认 `http://localhost:8080`）
- 默认连接字符串（Docker）：`postgres://postgres:postgres@postgres:5432/my-quiz?sslmode=disable`

### 测试
- **前端**：使用 Vitest + React Testing Library
  - 测试文件：`*.test.ts` 或 `*.test.tsx` 与源码同目录
  - 运行单个测试：`npx vitest run <file>`

- **后端**：使用 Go 内置 testing 包 + SQLite 内存数据库
  - 测试文件：`*_test.go` 与源码同目录（`server/handlers/`）
  - 测试策略：每个测试使用独立的 SQLite 内存数据库，完全隔离，无需外部 PostgreSQL
  - 运行单个测试：`go test ./handlers -run TestName`
  - 当前覆盖：question, record, session, upload 所有 handler 主要端点，共 25 个单元测试

### 代码风格和格式化
项目使用 **ESLint + Prettier** 进行代码检查和格式化，同时用 `.editorconfig` 统一编辑器配置：

**前端（JS/TS/TSX）：**
- ESLint 配置：`web/eslint.config.js` - 基于 Google 风格 + Prettier
- Prettier 配置：`web/.prettierrc` - 单引号、80字符行宽、2空格缩进
- 必须通过 ESLint 检查才能提交

**编辑器配置（.editorconfig）：**
- **所有文件默认**：2 空格缩进，使用空格（not tabs），UTF-8 编码，LF 换行符
- **Go 文件**：遵循 Go 社区约定，4 空格缩进，使用 tab
- **Markdown 文件**：保留 trailing whitespace（不修剪）

请重启编辑器让 `.editorconfig` 生效。支持 EditorConfig 的编辑器会自动读取该配置。

缩进规范总结：
- JS/TS/TSX/React/CSS/其他前端：**2 空格**
- Go：**4 空格 / tab**

### 数据库迁移
- 当前项目已从**纯前端 IndexedDB 本地存储**架构演进为**前后端分离 + PostgreSQL**架构
- 支持多设备数据同步
- 所有业务数据存储在 PostgreSQL 中，不提交到 git 代码库
- PostgreSQL 通过 Docker Compose 在本地容器化运行
- 后端使用 GORM ORM 操作数据库
- 保留 `web/src/db.ts` 用于旧数据迁移（用户可以从旧 IndexedDB 导出数据，再导入到新系统）

### 最近架构变更
- **v1.1+**: Exam 从题目中的嵌入式 JSONB 字段重构为独立表，通过外键关联，支持更好的数据一致性和查询

### Docker 重新打包部署
当代码修改后需要重新打包部署到本地 Docker：
```bash
# 1. 停止当前运行的容器
make down

# 2. 重新构建镜像
make build

# 3. 启动服务
make up

# 查看启动日志
make logs
```
- 数据库数据会保留在 Docker 卷中，不会丢失
- 如果需要完全清空数据库重新开始：`make clean` 会删除数据卷

### 数据流

**初始化流程：**
```
App.tsx
  ├─ useEffect 加载题目 → questionApi.list() → 更新状态
  └─ 检查后端 Session → 如果有未完成进度 → 弹出 ContinueQuizModal
```

**刷题流程：**
```
App 全局维护刷题状态（currentIndex, selectedAnswer, showResult, correctCount...）
  ↓
QuizCard → 用户点击选项 → 回调 App 更新状态 → 调用 recordApi.create() 记录到后端
  ↓
自动同步 Session → 调用 sessionApi.create() 更新后端会话
  ↓
用户点击"下一题" → App 更新索引 → 清空状态
```

**跨设备恢复流程：**
```
用户在设备 A 刷题未完成 → Session 自动保存到后端
  ↓
用户在设备 B 打开应用 → App 初始化请求 /api/session/current
  ↓
如果返回会话 → 弹出恢复弹窗 → 用户确认后恢复所有状态
```

---

## 文档参考

- [PRD](./docs/PRD.md) - 产品需求文档
- [用户文档](./docs/user-guide/README.md) - 使用指南
- [开发者文档](./docs/developer-guide/README.md) - 详细开发指南
- [架构文档](./docs/developer-guide/architecture.md) - 详细架构说明
- [题目格式规范](./docs/question-schema.md) - JSON Schema 定义

---

## 项目演进

项目架构经历了两个阶段：
1. **v0.x** - 纯前端方案：React + IndexedDB，数据存储在浏览器本地，不支持多设备同步
2. **v1.x** - 前后端分离方案：React + Go + PostgreSQL，数据持久化在后端，支持多设备同步和进度跨设备恢复
