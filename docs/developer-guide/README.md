# 开发者指南

面向贡献者的开发文档。

## 目录

| 文档 | 说明 |
|------|------|
| [项目架构](./architecture.md) | 技术栈、目录结构、核心模块 |
| [本地开发](./getting-started.md) | 环境搭建、运行调试、构建部署 |
| [题目格式规范](../question-schema.md) | JSON Schema 定义、字段说明 |
| [贡献指南](./contributing.md) | 如何贡献代码/题库 |

## 技术栈概览

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS |
| 存储 | IndexedDB (localforage) |
| PWA | Service Worker + Web App Manifest |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/my-quiz.git
cd my-quiz/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 http://localhost:5173

## 项目结构

```
my-quiz/
├── web/                        # Web 应用
│   ├── src/
│   │   ├── components/         # React 组件
│   │   ├── types.ts            # TypeScript 类型定义
│   │   ├── db.ts               # 数据库操作
│   │   ├── utils/              # 工具函数
│   │   └── App.tsx             # 主应用
│   ├── public/                 # 静态资源
│   └── index.html
│
├── question-banks/             # 题库目录
│   ├── README.md               # 题库贡献指南
│   └── jiangsu-institution/    # 江苏事业编题库
│       ├── metadata.json
│       ├── questions.json
│       └── images/
│
├── docs/                       # 文档
│   ├── user-guide/             # 用户文档
│   ├── developer-guide/        # 开发者文档
│   ├── question-schema.md      # 题目格式规范
│   └── industry-research.md    # 行业调研
│
└── scripts/                    # 工具脚本
```

## 核心概念

### 数据流

```
用户操作 → React 组件 → db.ts → IndexedDB
         ↓
    localforage 封装
```

### 题目数据结构

```typescript
interface Question {
  id: string;
  type: 'single' | 'multiple' | 'judge';
  content: string;
  options?: string[];
  answer: string | boolean;
  exam?: ExamRef;
  explanation?: string;
  difficulty?: 1 | 2 | 3;
  tags?: string[];
  createdAt: number;
}
```

详细说明：[题目格式规范](../question-schema.md)

## 贡献方式

- **贡献代码**：修复 Bug、添加功能
- **贡献题库**：整理并提交题库 JSON 文件
- **完善文档**：改进文档、翻译

详细说明：[贡献指南](./contributing.md)

## 相关链接

- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [localforage 文档](https://localforage.github.io/localForage/)
