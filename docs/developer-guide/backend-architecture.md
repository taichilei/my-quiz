# 后端架构设计

## 概述

My-Quiz 后端采用**简洁的分层设计**，使用 Go + Gin + PostgreSQL 提供 RESTful API 服务。

核心设计思想：**简单直接，不过度设计**。在满足功能需求的前提下，保持最小依赖和最少代码，便于维护。

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 编程语言 | Go | 静态编译，性能优秀，部署简单 |
| Web 框架 | Gin | 轻量高性能，路由清晰，社区成熟 |
| 数据库 | PostgreSQL | 支持 JSONB 类型，适合存储半结构化题目数据 |
| ORM | GORM | 成熟的 Go ORM，简化 CRUD 开发 |
| 数据库驱动 | `gorm.io/driver/postgres` | PostgreSQL 驱动 |

## 目录结构

```
server/
├── main.go                 # 应用入口：启动服务、注册路由、初始化数据库
├── config/
│   └── config.go           # 配置加载、数据库连接、表结构初始化
├── middleware/
│   ├── jwt_auth.go         # JWT 认证中间件
│   └── client_info.go      # 多端识别中间件（解析 X-Client-* Header / UA 兜底）
├── async/
│   └── task_pool.go        # 轻量 Goroutine 任务池（init() 自启动，进程内）
├── utils/
│   ├── email.go            # SMTP 邮件发送（验证邮件、密码重置邮件）
│   └── random.go           # 随机字符串/Token 生成
├── models/
│   ├── question.go         # 题目、记录、会话数据结构定义
│   ├── user.go             # 用户数据结构定义
│   ├── email_verification.go  # 邮箱验证 Token
│   ├── password_reset.go   # 密码重置 Token
│   └── upload.go           # 文件上传数据结构定义
└── handlers/
    ├── question.go         # 题目相关 API 处理器
    ├── exam.go             # 考试管理相关 API 处理器
    ├── record.go           # 答题记录相关 API 处理器
    ├── session.go          # 未完成刷题会话处理器（跨设备同步）
    ├── upload.go           # 文件上传管理 API 处理器
    ├── auth.go             # 用户认证 API 处理器（注册、登录、邮箱验证、密码重置）
    └── user.go             # 用户信息 API 处理器（获取、更新）
```

## 整体架构

```mermaid
graph TD
    A[前端 React<br>http://localhost:5173] --> B[Gin Engine<br>路由 + CORS + 日志]
    B --> M[JWT Middleware<br>token 验证]
    M --> C[Handler<br>question.go / auth.go / user.go]
    C --> D[PostgreSQL<br>driver: github.com/lib/pq]
    D --> C
    C --> M
    M --> B
    B --> A

    subgraph "认证流程"
    direction LR
    Register[注册] --> Bcrypt[bcrypt 加密密码]
    Login[登录] --> JWT[生成 JWT Token]
    end

    subgraph "数据模型层"
    C --> models[models/question.go<br>models/user.go<br>Go Struct 定义]
    end

    subgraph "配置初始化"
    E[config/config.go<br>加载环境变量<br>创建表初始化] --> D
    end

    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style M fill:#e8f5e9
```

## 数据模型

### PostgreSQL 表结构

#### `questions` 表 - 题目表

存储所有题目信息，支持单选、多选、判断等多种题型。

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| `id` | `SERIAL PRIMARY KEY` | 否 | 自增主键 |
| `type` | `VARCHAR(20)` | 否 | 题型：`single`单选 / `multiple`多选 / `judge`判断 |
| `content` | `TEXT` | 否 | 题干内容 |
| `options` | `JSONB` | 是 | 选项数组，JSON 格式存储 |
| `answer` | `TEXT` | 否 | 正确答案 |
| `explanation` | `TEXT` | 是 | 答案解析 |
| `difficulty` | `INTEGER` | 是 | 难度：1=简单 / 2=中等 / 3=困难 |
| `tags` | `JSONB` | 是 | 标签数组，JSON 格式存储 |
| `exam` | `JSONB` | 是 | 考试归属信息，JSON 格式存储 |
| `images` | `JSONB` | 是 | 图片 URL 数组，JSON 格式存储 |
| `created_at` | `BIGINT` | 否 | 创建时间戳（毫秒）|
| `updated_at` | `BIGINT` | 否 | 更新时间戳（毫秒）|

**索引：**
```sql
-- 按考试名称筛选加速
CREATE INDEX IF NOT EXISTS idx_questions_exam_name ON questions ((exam->>'name'));
-- 按题型筛选加速
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (type);
```

#### `records` 表 - 答题记录表

存储用户的每一次作答记录，用于错题本和统计分析。

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| `id` | `SERIAL PRIMARY KEY` | 否 | 自增主键 |
| `user_id` | `VARCHAR(100)` | 否 | 用户标识（支持多用户）|
| `question_id` | `INTEGER` | 否 | 题目 ID |
| `user_answer` | `TEXT` | 是 | 用户答案 |
| `is_correct` | `BOOLEAN` | 否 | 是否答对 |
| `time_spent` | `INTEGER` | 是 | 作答耗时（秒）|
| `answered_at` | `BIGINT` | 否 | 作答时间戳（毫秒）|

**索引：**
```sql
-- 按用户查询加速
CREATE INDEX IF NOT EXISTS idx_records_user_id ON records (user_id);
-- 按题目查询加速
CREATE INDEX IF NOT EXISTS idx_records_question_id ON records (question_id);
```

#### `quiz_sessions` 表 - 未完成刷题会话表

存储用户未完成的刷题会话，支持**跨设备进度恢复**。用户在一个设备开始刷题，中途退出，在另一个设备打开可以继续。

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| `id` | `SERIAL PRIMARY KEY` | 否 | 自增主键 |
| `user_id` | `VARCHAR(100)` | 否 | 用户标识 |
| `quiz_title` | `VARCHAR(200)` | 是 | 刷题标题 |
| `question_ids` | `JSONB` | 否 | 题目 ID 数组，JSON 格式 |
| `current_index` | `INTEGER` | 否 | 当前索引（第几题）|
| `selected_answer` | `TEXT` | 是 | 当前题目用户已选答案 |
| `show_result` | `BOOLEAN` | 否 | 是否显示结果 |
| `correct_count` | `INTEGER` | 否 | 答对题数 |
| `created_at` | `BIGINT` | 否 | 创建时间戳（毫秒）|
| `updated_at` | `BIGINT` | 否 | 更新时间戳（毫秒）|

**索引：**
```sql
-- 按用户查询加速
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions (user_id);
```

#### `users` 表 - 用户表

存储注册用户信息，支持密码加密登录。

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| `id` | `SERIAL PRIMARY KEY` | 否 | 自增主键 |
| `username` | `VARCHAR(50) UNIQUE` | 否 | 用户名（唯一）|
| `password_hash` | `VARCHAR(255)` | 否 | bcrypt 加密后的密码哈希 |
| `email` | `VARCHAR(100)` | 是 | 邮箱地址 |
| `created_at` | `BIGINT` | 否 | 创建时间戳（毫秒）|
| `updated_at` | `BIGINT` | 否 | 更新时间戳（毫秒）|

**索引：**
```sql
-- 用户名唯一索引（加速登录查询）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);
```

### 实体关系图

```mermaid
erDiagram
    questions ||--o{ records : "被用户作答"
    users ||--o| quiz_sessions : "一个用户一个会话"

    questions {
        SERIAL id PK
        VARCHAR type
        TEXT content
        JSONB options
        TEXT answer
        TEXT explanation
        INTEGER difficulty
        JSONB tags
        JSONB exam
        JSONB images
        BIGINT created_at
        BIGINT updated_at
    }

    records {
        SERIAL id PK
        VARCHAR user_id
        INTEGER question_id
        TEXT user_answer
        BOOLEAN is_correct
        INTEGER time_spent
        BIGINT answered_at
    }

    quiz_sessions {
        SERIAL id PK
        VARCHAR user_id
        VARCHAR quiz_title
        JSONB question_ids
        INTEGER current_index
        TEXT selected_answer
        BOOLEAN show_result
        INTEGER correct_count
        BIGINT created_at
        BIGINT updated_at
    }
```

### Go 模型定义

```go
// Question 题目 (GORM model)
type Question struct {
    ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
    Type        string    `json:"type"` // single, multiple, judge
    Content     string    `json:"content"`
    Options     []string  `json:"options" gorm:"serializer:json"`
    Answer      string    `json:"answer"`
    Explanation string    `json:"explanation"`
    Difficulty  int       `json:"difficulty"`
    Tags        []string  `json:"tags" gorm:"serializer:json"`
    Exam        Exam      `json:"exam" gorm:"serializer:json"`
    Images      []string  `json:"images" gorm:"serializer:json"`
    CreatedAt   int64     `json:"createdAt"`
    UpdatedAt   int64     `json:"updatedAt"`
}

// Exam 考试归属信息
type Exam struct {
    Name    string `json:"name"`    // 考试名称，如 "2025 银行招聘"
    Year    int    `json:"year"`    // 年份
    Subject string `json:"subject"` // 科目，如 "行测"
    Part    string `json:"part"`    // 部分，如 "类比推理"
    Order   int    `json:"order"`   // 该部分内的题号
}

// AnswerRecord 答题记录 (GORM model)
type AnswerRecord struct {
    ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
    UserID      string `json:"userId"`
    QuestionID  int    `json:"questionId"`
    UserAnswer  string `json:"userAnswer"`
    IsCorrect   bool   `json:"isCorrect"`
    TimeSpent   int    `json:"timeSpent"`
    AnsweredAt  int64  `json:"answeredAt"`
}

// ExamInfo 考试摘要（用于列表展示）
type ExamInfo struct {
    Name    string `json:"name"`
    Year    int    `json:"year"`
    Subject string `json:"subject"`
    Part    string `json:"part"`
    Count   int    `json:"count"` // 题目数量
}

// QuizSession 未完成刷题会话 (GORM model)
type QuizSession struct {
    ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
    UserID         string    `json:"userId"`
    QuizTitle      string    `json:"quizTitle"`
    QuestionIDs    []int     `json:"questionIds" gorm:"serializer:json"`
    CurrentIndex   int       `json:"currentIndex"`
    SelectedAnswer string    `json:"selectedAnswer"`
    ShowResult     bool      `json:"showResult"`
    CorrectCount   int       `json:"correctCount"`
    CreatedAt      int64     `json:"createdAt"`
    UpdatedAt      int64     `json:"updatedAt"`
}

// User 用户 (GORM model)
type User struct {
    ID           int    `json:"id" gorm:"primaryKey;autoIncrement"`
    Username     string `json:"username" gorm:"uniqueIndex;size:50"`
    PasswordHash string `json:"-"` // 注意："-" 表示不返回给前端
    Email        string `json:"email"`
    CreatedAt    int64  `json:"createdAt"`
    UpdatedAt    int64  `json:"updatedAt"`
}
```

**设计要点：**
- GORM `serializer:json` 自动处理 JSON 数组/结构体的序列化/反序列化，不需要手动处理
- `ID` 使用 `int` 类型，和数据库 SERIAL 自增主键一致
- 使用 JSONB 存储 `options`/`tags`/`exam`/`images` 等数组/嵌套结构
- 避免了复杂的关联表设计，查询一次就能拿到所有数据，性能更好

## 用户认证系统

### 认证架构

My-Quiz 采用 **JWT (JSON Web Token)** 无状态认证方案：

```mermaid
sequenceDiagram
    participant F as 前端
    participant G as Gin 路由
    participant M as JWT Middleware
    participant A as AuthHandler
    participant H as 业务Handler
    participant DB as PostgreSQL

    Note over F,DB: 登录流程
    F->>G: POST /api/auth/login {username,password}
    G->>A: Login(c)
    A->>DB: SELECT * FROM users WHERE username = $1
    DB->>A: 返回用户记录
    A->>A: bcrypt 验证密码
    A->>A: 生成 JWT Token (7天有效期)
    A->>G: 200 OK + {token, user}
    G->>F: 返回 token

    Note over F,DB: 访问受保护接口
    F->>G: GET /api/questions<br>Header: Authorization: Bearer <token>
    G->>M: JWTAuth() 中间件
    M->>M: 解析并验证 JWT
    M->>M: 从 claims 中提取 userID
    M->>H: c.Set("userID", userID) + Next()
    H->>DB: 业务查询
    DB->>H: 返回数据
    H->>G: 200 OK + 业务数据
    G->>F: 返回结果
```

### JWT 中间件工作原理

**位置**：`server/middleware/jwt_auth.go`

**验证流程：**
1. 从请求头中提取 `Authorization` 字段
2. 检查格式是否为 `Bearer <token>`
3. 使用密钥解析 JWT token
4. 验证签名和有效期（默认 7 天）
5. 从 token 的 claims 中提取 `userID`
6. 将 `userID` 存入 Gin context，供后续 handler 使用
7. 调用 `c.Next()` 继续处理

**失败情况：**
- 没有 Authorization header → `401 Unauthorized`
- 格式错误（缺少 Bearer）→ `401 Unauthorized`
- token 无效或过期 → `401 Unauthorized`

### 密码安全

**加密算法**：bcrypt（自适应哈希算法）

**特点：**
- 自动加盐，不需要单独存储 salt
- 计算成本可配置，抵御彩虹表攻击
- 相同密码每次哈希结果不同

**代码示例：**
```go
// 注册时加密密码
hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

// 登录时验证密码
err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
```

### 路由保护机制

**所有业务接口都受 JWT 保护**，只有以下接口公开：
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /health` - 健康检查

**路由注册方式（main.go）：**
```go
// 公开接口（不需要认证）
api.POST("/auth/register", authHandler.Register)
api.POST("/auth/login", authHandler.Login)

// 需要 JWT 认证的接口组
authGroup := api.Group("/")
authGroup.Use(middleware.JWTAuth())
{
    authGroup.GET("/user/me", userHandler.GetMe)
    authGroup.PUT("/user/me", userHandler.UpdateMe)
    authGroup.GET("/questions", qHandler.GetQuestions)
    // ... 所有其他业务接口
}
```

⚠️ **重要注意事项**：
- 路由必须只在 `authGroup` 中注册一次
- 如果同时在 `api` 和 `authGroup` 中注册，`api` 的路由会优先匹配，导致中间件失效
- 这是 Gin 框架按注册顺序匹配路由的特性

### 认证接口响应格式

**注册/登录成功响应（201/200）：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": 1714000000000
  }
}
```

✅ **注意**：`token` 字段在响应最外层，**不是**在 `user` 对象内部！

---

## 异步任务池（async）

### 用途
处理「不影响主请求结果」的副作用，比如发邮件、写第三方日志。把它们从 HTTP 请求路径上移出去，但又不裸用 `go func(){}()` —— 后者并发不可控、panic 会拖死进程、队列堆积也看不见。

### 实现位置
- 代码：`server/async/task_pool.go`
- 入口：`async.Submit(fn func())` / `async.SubmitWithRetry(fn, maxRetry int)`
- 默认参数：`DefaultQueueSize = 100`、`DefaultWorkerNum = 5`，包 `init()` 自动启动，无需在 `main.go` 显式初始化

### 工作模型
```
caller → Submit(fn) → 100 容量的 chan func() → 5 个 worker goroutine 消费 → safeRun 包裹（recover panic）
```

- **背压**：队列满时 `Submit` 不阻塞调用方，直接 `default` 分支丢任务并打 `WARN` 日志（防止上游被慢任务拖垮）
- **panic 兜底**：`safeRun` 捕获所有 panic 并打栈，单个任务崩溃不会拖死 worker
- **可观测**：`async.QueueSize()` 返回当前队列长度，可接入监控
- **重试限制**：`SubmitWithRetry` 只在任务 **panic** 时重试，return error 不会触发；外部库如 SMTP 是返回 error 的，应该自己决定要不要捕获后 panic 来触发重试，或者改用更显式的重试逻辑

### 当前调用点
| 调用点 | 任务 | 说明 |
|--------|------|------|
| `handlers/auth.go` Register | `utils.SendVerificationEmail` | 注册成功后发验证邮件 |
| `handlers/auth.go` ResendVerificationEmail | `utils.SendVerificationEmail` | 用户主动重发验证邮件 |
| `handlers/auth.go` ForgotPassword | `utils.SendPasswordResetEmail` | 忘记密码发重置链接 |
| `handlers/user.go` UpdateMe | `utils.SendVerificationEmail` | 用户改邮箱后重置 `EmailVerified=false` 并发新地址的验证邮件 |

### 使用规约
1. **业务异步统一走 `async.Submit`**，不再写裸 `go func(){}()`。规约的目的是让所有后台任务都受同一份并发上限和 panic 兜底约束。
2. **不能把请求作用域的对象（`*gin.Context`、`http.Request`、未提交的 `*gorm.DB` 事务）传进 task** —— task 在另一个 goroutine 里执行，请求生命周期已经结束。需要的字段先拷贝出来再闭包捕获（参考 `auth.go` 的 `user.Email` / `token` 写法）。
3. **task 内必须自己处理错误**，错误不会回到调用方。当前约定是 `println` / `log.Printf` 打日志即可；将来如要重试或告警，在 task 内部实现。
4. **不要在 task 内做长事务或长循环**，会一直占着 worker 槽位。重活应该再分批 `Submit`。

### 容量调整
默认 5 worker / 100 队列适合"低频 + 无状态"任务（邮件发送场景一天数百到数千次足够）。如果接入更大量级的异步任务，需要：
1. 在 `main.go` 启动前显式调一次 `async.Init(queueSize, workerNum)` 覆盖默认值
2. 评估是否要把 panic-only 重试换成基于 error 的重试（改造 `SubmitWithRetry`）
3. 接入 `async.QueueSize()` 监控，避免持续打"task dropped"日志而无人察觉

---

## API 接口文档

### 认证相关（公开接口）

#### `POST /api/auth/register` - 用户注册

**请求体：**
```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com"
}
```

**响应（201 Created）：** `AuthResponse`（见上文格式）

**错误响应：**
- `400 Bad Request` - 参数缺失或无效
- `409 Conflict` - 用户名已存在

#### `POST /api/auth/login` - 用户登录

**请求体：**
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**响应（200 OK）：** `AuthResponse`

**错误响应：**
- `400 Bad Request` - 参数缺失
- `401 Unauthorized` - 用户名或密码错误

### 用户信息相关（受保护，需 Token）

#### `GET /api/user/me` - 获取当前用户信息

**请求头：** `Authorization: Bearer <token>`

**响应（200 OK）：** `User` 对象

#### `PUT /api/user/me` - 更新当前用户信息

**请求头：** `Authorization: Bearer <token>`

**请求体：**
```json
{
  "email": "new-email@example.com"
}
```

**响应（200 OK）：** 更新后的 `User` 对象

> 副作用：当请求邮箱与当前邮箱不一致时，服务端会把 `EmailVerified` 重置为 `false`、清掉旧的 `email_verifications` 记录、写一条新 token，并通过 `async.Submit` 异步给新邮箱发验证邮件。前端在收到 200 后应引导用户去新邮箱完成验证，否则下次登录会被 `403 Email not verified` 拦截。

### 题目相关

#### `GET /api/questions` - 获取题目列表

**查询参数（可选）：**
- `exam` - 按考试名称筛选
- `year` - 按年份筛选
- `subject` - 按科目筛选
- `type` - 按题型筛选
- `tag` - 按标签筛选

**响应：** `[]Question` 题目数组

#### `GET /api/questions/:id` - 获取单个题目

**响应：** `Question` 题目对象

#### `POST /api/questions` - 创建题目

**请求体：** `Question`（不需要 `id`/`createdAt`/`updatedAt`）

**响应：** 创建成功后的 `Question` 对象

#### `PUT /api/questions/:id` - 更新题目

**请求体：** `Question`

**响应：**
```json
{ "message": "updated" }
```

#### `DELETE /api/questions/:id` - 删除题目

**响应：**
```json
{ "message": "deleted" }
```

#### `GET /api/exams` - 获取考试列表（分组统计）

**响应：** `[]ExamInfo` 考试摘要数组，按名称排序

### 答题记录相关

#### `POST /api/records` - 创建答题记录

**请求体：** `AnswerRecord`（不需要 `id`/`answeredAt`，后端自动设置）

**响应：** 创建成功后的 `AnswerRecord` 对象

#### `GET /api/records/:userId` - 获取用户答题记录

**查询参数（可选）：**
- `questionId` - 只查询特定题目

**响应：** `[]AnswerRecord` 答题记录数组，按时间倒序

#### `GET /api/records/:userId/stats` - 获取用户统计信息

**响应：**
```json
{
  "total": 100,
  "correct": 70,
  "rate": 70.0
}
```

### 刷题会话相关（跨设备同步）

#### `GET /api/session/current` - 获取当前用户未完成刷题会话

**响应：** `QuizSession` 会话对象

- 如果存在未完成会话，返回 `200 OK` + 会话数据
- 如果没有未完成会话，返回 `404 Not Found` + `{"error": "no active session"}`

#### `POST /api/session` - 创建或更新刷题会话

**请求体：** `QuizSession`（不需要 `id`/`createdAt`/`updatedAt`，后端自动设置）

**响应：** 创建或更新后的 `QuizSession` 对象

#### `DELETE /api/session/current` - 删除当前未完成刷题会话

**响应：**
```json
{ "message": "deleted" }
```

## 常见业务问题

### 如何判断一道题目是否已经做过？

**当前实现方案：**
1. 前端存储 `userId`（存在 localStorage）
2. 前端加载时请求 `GET /api/records/:userId` 获取该用户所有答题记录
3. 前端缓存这些记录
4. 渲染题目时，检查 `records` 中是否存在 `questionId` 匹配：
   - 存在 → 题目已经做过
   - 不存在 → 题目未做

**如果只需要查询特定题目：**
```
GET /api/records/:userId?questionId=123
```
返回空数组 → 未做；返回非空 → 已做。

### 如何知道一道题目做过几次？

做过次数 = 返回数组长度。例如：
```
GET /api/records/abc123?questionId=45
```
返回数组长度为 `n`，就是做过 `n` 次。

### 如何知道一道题是否做对？

遍历 `records` 中该题的记录，检查 `isCorrect` 字段：
- `true` → 做对了
- `false` → 做错了

错题本就是筛选所有 `isCorrect = false` 的题目。

### 统计信息在哪里计算？

总题数/正确题数/正确率 → 后端 `GET /api/records/:userId/stats` 直接返回结果。

### 请求处理流程示例

```mermaid
sequenceDiagram
    participant F as 前端
    participant G as Gin 路由
    participant H as QuestionHandler
    participant DB as PostgreSQL

    F->>G: GET /api/questions?exam=bank-recruitment-2025
    G->>H: GetQuestions(c)
    H->>H: 解析查询参数，动态构建 SQL
    H->>DB: SELECT * FROM questions WHERE exam->>'name' = $1
    DB->>H: 返回结果行
    loop 逐行扫描
        H->>H: JSONB 反序列化 options/tags/exam
        H->>H: 填充 Question struct
    end
    H->>G: JSON 响应 []Question
    G->>F: 返回给前端
```

## 设计特点

### ✅ 优点

1. **简单直接** - 没有过度分层，没有依赖注入，没有复杂抽象，代码量少，容易理解
2. **灵活存储** - 使用 PostgreSQL JSONB 存储半结构化数据，添加新题型不需要改表结构
3**性能优秀** - 一次查询拿到所有数据，无需 join 联表
4. **易于部署** - Go 编译成单个二进制文件，Docker 容器部署简单
5. **支持多用户** - `user_id` 隔离数据，支持多设备同步

### ⚠️ 现有局限 & 改进方向

| 问题 | 影响 | 改进方案 | 优先级 |
|------|------|---------|--------|
| handler 直接操作数据库 | 代码重复，不好测试 | 分离 `repository` 数据访问层 | ⭐⭐⭐ |
| 没有分页支持 | 题目上千后一次返回太多数据 | `/api/questions` 增加 `limit`/`offset` 参数 | ⭐⭐ |
| 没有连接池配置 | 高并发下可能连接泄漏 | GORM 默认已有连接池，可按需调整参数 | ⭐ |
| 没有统一错误处理 | 每个 handler 重复写错误响应 | 封装统一错误处理工具函数 | ⭐ |
| 缺少单元测试 | 重构容易出问题 | 给核心逻辑增加单元测试 | ⭐⭐ |

✅ **已完成改进：**
- [x] ID 类型统一（Go `int` 匹配数据库 SERIAL）
- [x] 引入 GORM ORM，简化 CRUD 开发
- [x] 增加 `quiz_sessions` 表，支持未完成进度跨设备同步
- [x] 引入多端识别中间件 `middleware/client_info.go`，区分 web / iOS / Android 客户端
- [x] 邮件发送统一走 `async` 任务池（注册验证、重发验证、密码重置 3 处），裸 `go func()` 不再用于业务异步

### 演进方向（题目量超过 1000+ 后）

如果项目规模扩大，可以演进为更标准的四层架构：

```
server/
├── main.go
├── config/          # 配置（保持不变）
├── models/          # 数据模型（保持不变）
├── handlers/        # HTTP 层：只处理请求解析和响应（保持不变）
├── service/         # 新增：业务逻辑层
├── repository/      # 新增：数据访问层，封装所有 SQL 查询
└── pkg/
    └── database/    # 新增：数据库连接池配置
```

## 本地开发

```bash
cd server
go run main.go    # 启动服务，默认端口 8080
go build          # 编译
go test ./...     # 运行测试
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8080` | 服务端口 |
| `POSTGRES_URI` | `postgres://postgres:postgres@localhost:5432/my-quiz?sslmode=disable` | PostgreSQL 连接字符串 |
| `DB_NAME` | `my-quiz` | 数据库名称 |