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

---

# 刷题Web应用开发需求

## 项目概述

开发一个个人刷题Web应用，用户可以导入PDF中的题目，存储到本地数据库中，并在浏览器中进行刷题练习。应用主要在iPad的浏览器上使用，需要良好的触屏体验和移动端适配。

## 核心功能需求

1. **题目管理功能**
   - 支持手动添加题目（单选题、多选题、判断题、简答题等）
   - 支持题目分类/标签管理
   - 支持题目搜索和筛选
   - 支持题目批量导入（后续扩展PDF解析功能）

2. **刷题功能**
   - 随机刷题模式
   - 按分类/标签刷题
   - 错题本功能，自动记录做错的题目
   - 答题后显示正确答案和解析
   - 刷题进度记录

3. **数据存储**
   - 使用浏览器端数据库（IndexedDB）存储所有题目数据
   - 支持数据导出和备份功能
   - 支持数据导入恢复

4. **用户界面**
   - 适配iPad竖屏和横屏显示
   - 大按钮设计，适合触屏操作
   - 简洁清晰的题目展示
   - 支持夜间模式

## 技术栈要求

- 前端框架：React 18 + TypeScript
- 构建工具：Vite
- 样式方案：Tailwind CSS
- 本地存储：localForage (IndexedDB封装)
- 路由：React Router (如果需要多页面)

## 设计要求

- 界面简洁，专注于刷题体验
- 字体大小适中，适合长时间阅读
- 操作按钮足够大，方便iPad触屏点击
- 响应式设计，适配不同屏幕尺寸
- 加载速度快，操作流畅

## 项目结构

```
my-quiz/
├── src/
│   ├── components/       # React组件
│   ├── hooks/           # 自定义Hooks
│   ├── types/           # TypeScript类型定义
│   ├── utils/           # 工具函数
│   ├── db/              # 数据库操作
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 应用入口
├── public/              # 静态资源
├── index.html           # HTML模板
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript配置
├── vite.config.ts       # Vite配置
├── tailwind.config.js   # Tailwind配置
└── postcss.config.js    # PostCSS配置
```

## 开发优先级

1. 基础项目搭建和配置
2. 本地数据库设计和实现
3. 题目管理功能
4. 刷题核心界面
5. 错题本和进度记录
6. 数据导入导出功能
7. PDF题目解析功能（后续迭代）

## 注意事项

- 所有数据存储在用户本地浏览器中，不需要后端服务器
- 界面操作要符合iPad触屏使用习惯
- 代码要易于维护和扩展
- 确保在Safari浏览器上的兼容性
