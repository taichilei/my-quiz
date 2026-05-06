# 本地开发

环境搭建、运行调试、构建部署指南。

## 环境要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | >= 18.0 |
| npm | >= 9.0 |

### 检查版本

```bash
node -v
npm -v
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/taichilei/my-quiz.git
cd my-quiz
```

### 2. 安装依赖

```bash
cd web
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

浏览器打开 http://localhost:5173

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建结果 |

## 项目配置

### Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // 允许局域网访问
  }
})
```

### TypeScript 配置 (tsconfig.json)

- 严格模式
- React JSX 支持
- ES2020 目标

### Tailwind 配置 (tailwind.config.js)

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 调试技巧

### 浏览器开发者工具

1. 打开 Chrome DevTools (F12)
2. Sources 面板可以调试源码
3. Application → Storage → IndexedDB 查看数据

### 查看 IndexedDB 数据

```javascript
// 在浏览器控制台执行
import { getQuestions } from './db'
const questions = await getQuestions()
console.log(questions)
```

### 清除本地数据

```javascript
// 在浏览器控制台执行
import { clearQuestions } from './db'
await clearQuestions()
```

### 或者使用浏览器开发者工具：

1. Application → Storage → IndexedDB
2. 右键删除数据库

## 构建部署

### 生产构建

```bash
npm run build
```

构建输出到 `dist/` 目录：

```
dist/
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── index-xxx.css
│   └── index-xxx.js
└── icons/
    └── icon.svg
```

### 预览构建结果

```bash
npm run preview
```

### 部署选项

#### GitHub Pages

```bash
# 安装 gh-pages
npm install -D gh-pages

# package.json 添加
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# 部署
npm run deploy
```

#### Vercel

1. 连接 GitHub 仓库
2. 设置 Root Directory 为 `web`
3. 自动部署

#### Netlify

1. 连接 GitHub 仓库
2. Build command: `npm run build`
3. Publish directory: `web/dist`

#### 静态服务器

```bash
# 使用 serve
npm install -g serve
serve dist

# 或使用 nginx/apache
```

## 常见问题

### Q: npm install 失败？

尝试清除缓存：

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q: TypeScript 报错？

检查类型定义：

```bash
npx tsc --noEmit
```

### Q: 热更新不生效？

- 检查文件是否保存
- 重启开发服务器
- 清除浏览器缓存

### Q: IndexedDB 数据无法清除？

在浏览器控制台：

```javascript
indexedDB.deleteDatabase('my-quiz')
```

## IDE 配置

### VS Code 推荐扩展

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### 推荐设置 (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

## 测试

目前项目暂无自动化测试，计划添加：

- Vitest 单元测试
- Playwright E2E 测试

欢迎贡献！
