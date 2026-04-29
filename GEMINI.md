# GEMINI.md

## 项目概览
**My-Quiz** 是一款全面的开源刷题工具，旨在帮助用户备考各类考试（如考研、考公、考编等）。它采用了现代化的全栈架构，并通过 PWA（渐进式 Web 应用）技术侧重于离线可用性。

### 技术栈
- **前端**: React 18 (TypeScript), Vite 5, Tailwind CSS, Vitest。
- **后端**: Go (Gin Gonic), PostgreSQL (GORM)。
- **存储**: 前端使用浏览器本地存储（localStorage/IndexedDB）保存进度，后端使用 PostgreSQL 进行中心化数据管理。
- **部署**: Docker, Docker Compose, Makefile。

### 核心特性
- **离线优先**: 支持 PWA，加载后可在无网络环境下使用。
- **多端同步**: 通过后端 API 实现刷题进度的跨设备同步。
- **灵活的数据格式**: 支持多种题型（单选、多选、判断）及基于 JSON 的题库管理。
- **丰富的工具链**: 包含 OCR 提取和多种格式转换脚本（PDF/MD/DOC 转 JSON）。

---

## 构建与运行

### Docker 部署（推荐）
使用项目根目录下的 `Makefile` 进行快捷操作：
- **构建**: `make build`（同时构建前端和后端镜像）
- **运行**: `make up`（启动 PostgreSQL, 后端 API `:8080` 以及前端 `:3000`）
- **停止**: `make down`
- **查看日志**: `make logs`

### 本地开发
如果不使用 Docker，可以手动运行各项服务：

#### 前端 (`/web`)
```bash
cd web
npm install
npm run dev    # 启动开发服务器，访问地址 http://localhost:5173
npm run build  # 生产环境构建
npm run test   # 运行 Vitest 单元测试
```

#### 后端 (`/server`)
```bash
cd server
go mod download
go run main.go # 启动 API 服务器，默认端口 :8080
```
*注意：本地运行需要根据 `server/config/config.go` 中的配置启动 PostgreSQL 实例。*

---

## 目录结构
- `web/`: React 前端应用。
  - `src/api/`: REST API 客户端封装。
  - `src/components/`: UI 组件（刷题卡片、表单、统计等）。
  - `src/types.ts`: 全局 TypeScript 类型定义。
- `server/`: Go 后端应用。
  - `handlers/`: API 请求处理器。
  - `models/`: GORM 数据库模型。
- `database/`: 数据管理资源。
  - `quizzes/`: 各类考试的 JSON 题库文件。
  - `scripts/`: 用于题库导入、格式转换和 OCR 的 JS/MJS 脚本。
- `docs/`: 综合文档（PRD、架构设计、用户指南等）。
- `docs/roadmap.md`: 项目后续迭代的版本排期与优化计划。

---

## 开发规范

### 代码标准
- **前端**: 遵循 React 最佳实践；使用 Tailwind CSS 处理样式；在 `web/src/types.ts` 中维护严格的类型定义。
- **后端**: 采用标准的 Go 项目结构；使用 Gin 处理路由，GORM 处理数据库交互。
- **命名**: 使用具有描述性的变量名和组件名。

### 测试要求
- **前端**: 使用 Vitest 和 React Testing Library 为组件和工具函数编写单元测试。测试文件通常位于源码目录下的 `*.test.tsx`。
- **验证**: 导入题目数据前，务必对照 `docs/question-schema.md` 中的 Schema 进行格式验证。

### 贡献指南
- 新功能应在 `docs/` 目录中同步更新文档。
- 题库文件应放置在 `database/quizzes/` 目录下，并符合项目的 JSON 规范。
