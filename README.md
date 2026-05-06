# My-Quiz

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Web: React 18](https://img.shields.io/badge/Web-React_18-61DAFB?logo=react&logoColor=white)](./apps/web)
[![Native: Expo](https://img.shields.io/badge/Native-Expo-000020?logo=expo&logoColor=white)](./apps/native)
[![Server: Go](https://img.shields.io/badge/Server-Go-00ADD8?logo=go&logoColor=white)](./server)

一个**多端通用刷题应用**，目标是帮助考研、考公、考编、银行、国企等各类备考人群高效刷题，并尝试通过开源题库降低信息差。

> 中文文档 ｜ English docs welcome via PR

## ✨ 特性

- 🌐 **三端共后端**：Web（PWA 离线）+ iOS/Android（Expo）+ Go RESTful API，一份后端服务多端
- 🔄 **跨设备进度同步**：换设备打开自动恢复上次刷题进度
- 📚 **批量导入**：JSON 题库、PDF/图片上传解析
- 📊 **错题本与统计**：自动记录答题历史、错题集中刷
- 🌙 **PWA + 深色模式**：网页离线可用，可"添加到主屏幕"当原生 App 用
- 🔐 **完整账号体系**：JWT + 邮箱验证 + 密码重置

## 🛠 技术栈

| 端 | 技术 |
|---|---|
| Web | React 18 · TypeScript 5 · Vite · Tailwind CSS · Vitest · vite-plugin-pwa |
| Native | React 19 · React Native 0.81 · Expo Router · zustand · expo-secure-store |
| Server | Go · Gin · GORM · PostgreSQL 16 · JWT · bcrypt |
| 部署 | Docker Compose（PostgreSQL + server + web） |

## 🚀 快速开始

### 方式一：Docker 一键启动（推荐）

```bash
git clone https://github.com/taichilei/my-quiz.git
cd my-quiz
make build
make up
```

启动后访问：

- Web UI：<http://localhost:3000>
- API：<http://localhost:8081>
- PostgreSQL：localhost:5434（用户/密码 `postgres/postgres`，**生产请务必修改**）

### 方式二：本地开发

需要 Node.js ≥ 18、Go ≥ 1.21、Docker（仅用于跑 PostgreSQL）。

```bash
# 1. 启动数据库
docker compose up -d postgres

# 2. 启动后端（端口 8080）
cd server && go run main.go

# 3. 启动 Web（端口 5173）
cd apps/web && npm install && npm run dev

# 4. （可选）启动原生端
cd apps/native && npm install && npx expo start
```

更多命令见 [CLAUDE.md](./CLAUDE.md) 的"常用命令"。

## 📁 仓库结构

```
my-quiz/
├── apps/
│   ├── web/        # React + Vite Web 应用
│   └── native/     # React Native + Expo 工程（独立 npm）
├── server/         # Go + Gin + PostgreSQL 后端
├── docs/           # PRD、用户/开发者文档、API 测试用例
├── tools/postman/  # Postman 测试集合
├── docker-compose.yml
└── Makefile
```

> ⚠️ `docs/user-guide/` 和部分 `docs/developer-guide/` 文档仍停留在 v0.x（纯前端 IndexedDB）时代，未及时跟进 v1.x（前后端分离）。如有出入以 [CLAUDE.md](./CLAUDE.md) 为准。欢迎 PR 修订。

## 🤝 参与贡献

欢迎 Issue、PR、题库贡献。提交前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)：

- 主开发分支是 **`dev`**（不是 `main`），PR 请合到 `dev`
- Commit 遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- PR 前请按改动涉及的端跑 lint / test / typecheck

> **维护节奏**：本项目目前为个人维护，best-effort 响应 Issue/PR，不承诺 SLA。如急需修复请在 Issue 中说明。

## 📝 协议

本项目采用 **[GNU AGPL-3.0](./LICENSE)** 协议开源。

**简单说：**
- ✅ 你可以自由使用、修改、再发布
- ⚠️ **如果你修改后部署成网络服务（含 SaaS）供他人使用**，你也必须按 AGPL-3.0 开放源代码
- ⚠️ 任何衍生作品必须保持 AGPL-3.0 协议（强 copyleft）

需要商业授权（不受 AGPL 约束）请通过 Issue 联系作者讨论。

## 📮 联系方式

- 一般问题：开 [Issue](../../issues)
- 其他事宜：qilei.dai@qq.com

---

> 题库内容版权归原出题方所有，本项目仅提供刷题工具。贡献题库前请确认有合规来源。
