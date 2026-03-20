# My-Quiz

开源刷题工具，帮助考研、考公、考编等各类考试人群高效复习。

## 项目简介

My-Quiz 是一个轻量级的刷题 Web 应用，旨在打破教育机构的信息差，让每个人都能方便地管理和练习题目。

**核心特点：**

- 开源免费
- 离线可用（PWA）
- 数据本地存储
- 支持导入导出
- 跨平台（iOS/Android/PC）

## 快速开始

### 在线使用

访问网站即可使用（待部署）。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/your-username/my-quiz.git

# 进入 web 目录
cd my-quiz/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 http://localhost:5173

## 文档

- [用户文档](./docs/user-guide/README.md) - 使用指南
- [开发者文档](./docs/developer-guide/README.md) - 开发指南
- [题目格式规范](./docs/question-schema.md) - JSON Schema 定义

## 项目结构

```
my-quiz/
├── web/                    # Web 应用
├── question-banks/         # 题库目录
├── docs/                   # 文档
└── scripts/                # 工具脚本
```

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | 前端框架 |
| Vite | 构建工具 |
| Tailwind CSS | 样式 |
| IndexedDB | 本地存储 |
| PWA | 离线支持 |

## 贡献

欢迎贡献代码、题库或文档！

- [贡献指南](./docs/developer-guide/contributing.md)
- [题库贡献](./question-banks/README.md)

## 开源协议

[MIT License](./LICENSE)

## 致谢

感谢所有贡献者！
