# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

My-Quiz 是一个多端刷题应用，采用前后端分离架构：
- **Web 前端**（`apps/web/`）：React + TypeScript + Vite，支持 PWA 离线
- **iOS 原生端**（`apps/native/`）：React Native + Expo（独立 npm 工程）
- **后端**（`server/`）：Go + Gin + PostgreSQL（GORM），提供 RESTful API，多端共用
- 支持多设备同步，核心功能：题目管理、随机刷题、错题本、统计信息、批量导入导出、未完成进度跨设备恢复

> `packages/` 当前为空，预留作未来 Web/Native 共享包目录。

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

### Web 前端本地开发
```bash
cd apps/web
npm install              # 安装依赖
npm run dev              # 启动开发服务器（http://localhost:5173）
npm run build            # 生产构建
npm run test             # 运行所有测试
npm run test:watch       # 监听模式运行测试
npx vitest run <file>    # 运行单个测试文件
npm run preview          # 预览构建结果
```

### iOS 原生端（Expo）
```bash
cd apps/native
npm install              # 安装依赖
npx expo start           # 启动 Expo dev server（扫码或模拟器运行）
npm test                 # 运行 jest 测试
```
> 注意：`apps/native/` 是独立 npm 工程，不与 `apps/web/` 共享 node_modules。

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
cd apps/web
npm run typecheck         # 类型检查（等同于 npx tsc --noEmit）
```

### 代码风格检查和格式化
```bash
cd apps/web
npm run lint              # 检查 src 目录下的 TS/TSX 文件
npm run lint:fix          # 自动修复可修复的问题
npm run format            # Prettier 格式化 src 目录
```

> ⚠️ `Makefile` 的 `test` / `typecheck` / `dev` 目标里写的是 `cd web`，与实际目录 `apps/web` 不一致——直接 `cd apps/web` 跑 npm 命令最稳。修复 Makefile 时请同步这三处。

### Makefile 常用命令（项目根目录）
```bash
make build    # 构建 Docker 镜像
make up       # 启动所有服务
make down     # 停止所有服务
make restart  # 重启所有服务
make logs     # 查看服务日志
make clean    # 清理容器和镜像（含数据卷）
make test     # 运行前端测试
make typecheck  # 前端 TypeScript 类型检查
make dev      # 显示本地开发命令
```

---

## 代码架构

### 目录结构
```
my-quiz/
├── apps/
│   ├── web/                # React Web 应用（前端）
│   └── native/             # React Native iOS 应用（Expo）
├── packages/               # 共享代码包
├── server/                 # Go 后端 API
├── docs/                   # 项目文档（PRD、用户指南、开发指南）
├── tools/
│   └── postman/            # Postman API 测试配置
├── uploads/                # 用户上传文件（git 忽略）
├── Makefile                # Docker 部署命令
└── docker-compose.yml      # Docker Compose 配置（PostgreSQL + server + web）
```

**数据存储策略：**
- 所有题目、答题记录、会话数据都持久化存储在 **PostgreSQL 数据库**中
- 不将题库数据提交到 git 代码库，只保留转换脚本
- PostgreSQL 运行在本地 Docker 容器中，数据存储在 Docker 卷

### 前端架构（apps/web/）

**关键约定（理解组件前先看这些）：**
- `src/App.tsx` 是**全局刷题状态的唯一持有者**：currentIndex / selectedAnswer / showResult / correctCount 等都在这里，子组件通过回调上抛事件，不要在 `QuizCard` 等子组件里复制一份本地状态。
- `src/api/client.ts` 是**后端唯一入口**：所有 fetch 调用集中在此，按领域分 `questionApi` / `examApi` / `recordApi` / `sessionApi` / `uploadApi` / `authApi`，新增接口请加在对应 namespace 下，不要在组件里直接 fetch。
- `src/types.ts` 是**前后端类型契约**（Question / ExamRef / AnswerRecord / SavedQuizProgress 等），加字段时要同步后端 model 和此文件。
- `src/db.ts` 是**已弃用的 IndexedDB 适配层**，仅保留旧用户数据迁移用途，不要往里加新逻辑。
- `src/utils/progressStorage.ts` 是**localStorage 本地兜底**，与后端 `/api/session` 是双写关系，断网时用 localStorage，恢复时优先后端。

**技术：** React 18 + TypeScript 5 + Tailwind + Vite + Vitest + RTL；PWA + Service Worker 离线缓存。

### 原生端架构（apps/native/）

- 独立的 Expo Router 工程（`expo-router/entry`），与 `apps/web/` 不共享代码或 node_modules。
- React 19 + React Native 0.81，Tab 路由位于 `app/`，可复用资源放 `assets/` / `components/` / `constants/` / `hooks/`。
- 调用同一个后端 API；调用时请务必在请求头带上 `X-Client-Type: mobile` / `X-Platform: ios|android` / `X-App-Version` / `X-Device-Id`，便于服务端 `ClientInfoMiddleware` 识别。

**关键约定（理解组件前先看这些）：**
- `api/client.ts` 是**后端唯一入口**：所有 fetch 集中在此，按领域分 `authApi` / `userApi` / `questionApi` / `examApi` / `recordApi` / `sessionApi`，自动注入多端 Header 和 `Authorization: Bearer <jwt>`，401 触发 `unauthorizedHandler` 回调。**不要**在组件里直接 fetch。
- `store/authStore.ts`（zustand）是**登录态唯一持有者**：JWT 持久化到 `expo-secure-store`，App 启动调一次 `bootstrap()` 恢复 token + 拉 user + 绑 401 回调。组件通过 selector 订阅 `token` / `user` / `bootstrapping`。
- `utils/device.ts` 是**多端 Header 来源**：`getDeviceId()` 用 SecureStore 持久化（异步），`APP_VERSION` 从 `expo-constants` 读 `app.json`，`PLATFORM` 用 `Platform.OS`。
- `types.ts` 是**与 web 同步的类型契约**（Question / Exam / AnswerRecord / QuizSession + 原生独有的 User / AuthResponse），文件头部写明同步源；加字段时要同步后端 model + web 端 + 此文件三处。
- 路由网关：根 `app/_layout.tsx` 调 `bootstrap()`，`app/(tabs)/_layout.tsx` 在 `bootstrapping` 期间渲染空、`token` 为空时 `<Redirect href="/login">`。新增登录态保护的 stack 时复用这个模式。
- API base URL 解析顺序：`EXPO_PUBLIC_API_URL` 环境变量 → `app.json` 的 `expo.extra.apiUrl` → 平台默认（iOS 模拟器 `localhost:8081`、Android 模拟器 `10.0.2.2:8081`）。**真机调试必须**通过 `EXPO_PUBLIC_API_URL` 指向 Mac 的 LAN IP。

### 后端架构（server/）

**核心目录：**
- `server/main.go` - 入口，启动 Gin 引擎，注册路由（`/health` + `/api/*`）
- `server/config/config.go` - 配置加载和数据库连接（GORM + PostgreSQL）
- `server/middleware/` - Gin 中间件
  - `jwt_auth.go` - JWT 认证中间件，保护需登录接口
  - `client_info.go` - **多端识别中间件**：解析 `X-Client-Type` / `X-App-Version` / `X-Device-Id` / `X-Platform` Header（缺失时从 User-Agent 兜底推断），结果存入 Gin Context 由 `middleware.GetClient(c)` 取用，全局注册
- `server/handlers/` - HTTP 处理器（每个领域一对 `*.go` + `*_test.go`）：`auth`, `user`, `question`, `exam`, `record`, `session`, `upload`
- `server/models/` - GORM 模型：`user`, `question`（含 Exam / AnswerRecord / QuizSession）, `upload`, `email_verification`, `password_reset`
- `server/utils/` - 工具包：`email.go`（邮件发送）、`random.go`（验证码/Token 随机串）
- `server/async/task_pool.go` - **轻量异步任务池**：进程内 Goroutine 池（默认 5 worker / 队列 100），通过 `async.Submit(fn)` 提交非核心任务（如发邮件）；`init()` 自动启动；调用方不要阻塞 worker

**API 路由：**

**公开接口（无需认证）：**
- `GET /health` - 健康检查
- `POST /api/auth/register` - 用户注册（bcrypt 密码哈希，邮箱必填，默认未验证）
- `POST /api/auth/login` - 用户登录（返回 JWT Token，有效期 7 天）
- `POST /api/auth/verify-email` - 提交邮箱验证码完成验证
- `POST /api/auth/resend-verification` - 重发邮箱验证码
- `POST /api/auth/forgot-password` - 申请密码重置（发送邮件 Token）
- `POST /api/auth/reset-password` - 用 Token 完成密码重置

**需要 JWT 认证的接口（Authorization: Bearer <token>）：**

**调试：**
- `GET /api/debug/client-info` - 回显当前请求被 `ClientInfoMiddleware` 解析出的端信息，便于多端联调

**用户管理：**
- `GET /api/user/me` - 获取当前登录用户信息
- `PUT /api/user/me` - 更新当前用户信息

**题目管理：**
- `GET /api/questions` - 获取题目列表（支持按考试、类型、标签筛选）
- `GET /api/questions/:id` - 获取单个题目
- `POST /api/questions` - 创建题目
- `PUT /api/questions/:id` - 更新题目
- `DELETE /api/questions/:id` - 删除题目

**考试管理：**
- `GET /api/exams` - 获取所有考试列表
- `GET /api/exams/:id` - 获取单个考试详情
- `POST /api/exams` - 创建考试
- `PUT /api/exams/:id` - 更新考试
- `DELETE /api/exams/:id` - 删除考试

**答题记录：**
- `POST /api/records` - 创建答题记录
- `GET /api/records/:userId` - 获取用户答题记录
- `GET /api/records/:userId/stats` - 获取用户统计信息

**刷题会话（跨设备同步）：**
- `GET /api/session/current` - 获取当前用户未完成刷题会话
- `POST /api/session` - 创建或更新当前刷题会话
- `DELETE /api/session/current` - 删除当前未完成刷题会话

**文件上传管理：**
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

### 用户（User）
```go
ID            int    // 数据库唯一标识（自增）
Username      string // 用户名（唯一，3-50字符）
Password      string // bcrypt 哈希后的密码（json:"-" 永不返回前端）
Email         string // 邮箱（必填，注册强制）
EmailVerified bool   // 邮箱是否已验证
CreatedAt     int64  // 创建时间戳（毫秒）
UpdatedAt     int64  // 更新时间戳（毫秒）
```
**认证机制：** JWT + bcrypt 密码哈希，Token 有效期 7 天。配套有 `email_verification` / `password_reset` 两张表存储一次性验证码/Token，邮件发送通过 `async.Submit` 走异步任务池。

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
1. 更新 `apps/web/src/types.ts` 中的 `QuestionType` 联合类型
2. 更新 `apps/web/src/components/QuizCard.tsx` 添加渲染逻辑
3. 更新 `apps/web/src/components/QuestionForm.tsx` 添加表单选项
4. 后端无需修改，使用动态 JSON 结构兼容

### 环境变量
- 后端：
  - `PORT` - 服务端口（默认 8080）
  - `POSTGRES_URI` - PostgreSQL 连接字符串
  - `JWT_SECRET` - JWT 签名密钥（生产环境必须设置，默认开发密钥）
- 前端：`VITE_API_URL` - 后端 API 地址（默认 `http://localhost:8080`）
- 默认连接字符串（Docker）：`postgres://postgres:postgres@postgres:5432/my-quiz?sslmode=disable`

### 测试
- **前端**：使用 Vitest + React Testing Library
  - 测试文件：`*.test.ts` 或 `*.test.tsx` 与源码同目录
  - 运行单个测试：`npx vitest run <file>`

- **后端**：使用 Go 内置 testing 包 + SQLite 内存数据库
  - 测试文件：`*_test.go` 与源码同目录（`server/handlers/`、`server/middleware/`）
  - 测试策略：每个测试使用独立的 SQLite 内存数据库，完全隔离，无需外部 PostgreSQL
  - 运行单个测试：`go test ./handlers -run TestName`
  - 覆盖范围：auth / user / question / exam / record / session / upload 全部 handler 主要端点，外加 `client_info` 中间件

### 代码风格和格式化
项目使用 **ESLint + Prettier** 进行代码检查和格式化，同时用 `.editorconfig` 统一编辑器配置：

**前端（JS/TS/TSX）：**
- ESLint 配置：`apps/web/eslint.config.js` - 基于 Google 风格 + Prettier
- Prettier 配置：`apps/web/.prettierrc` - 单引号、80字符行宽、2空格缩进
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
- 保留 `apps/web/src/db.ts` 用于旧数据迁移（用户可以从旧 IndexedDB 导出数据，再导入到新系统）

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

- [README.zh-CN.md](./README.zh-CN.md) - 项目中文 README（功能特性、快速开始）
- [PRD](./docs/PRD.md) - 产品需求文档
- [用户文档](./docs/user-guide/README.md) - 使用指南
- [开发者文档](./docs/developer-guide/README.md) - 详细开发指南
- [架构文档](./docs/developer-guide/architecture.md) - 详细架构说明
- [题目格式规范](./docs/question-schema.md) - JSON Schema 定义
- [API 测试用例](./docs/API接口测试用例.md) - 接口手测脚本与示例

---

## 项目演进

项目架构经历了两个阶段：
1. **v0.x** - 纯前端方案：React + IndexedDB，数据存储在浏览器本地，不支持多设备同步
2. **v1.x** - 前后端分离方案：React + Go + PostgreSQL，数据持久化在后端，支持多设备同步和进度跨设备恢复
