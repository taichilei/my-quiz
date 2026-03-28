# 项目架构

技术栈、目录结构、核心模块详解。

## 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 5.2 | 类型安全 |
| Vite | 5.0 | 构建工具 |

### UI 与样式

| 技术 | 用途 |
|------|------|
| Tailwind CSS | 原子化 CSS 框架 |
| PostCSS | CSS 后处理器 |

### 数据存储

| 技术 | 用途 |
|------|------|
| IndexedDB | 浏览器数据库（本地存储） |
| localforage | IndexedDB 封装库 |
| MongoDB | 后端数据库（服务器模式） |

### PWA

| 技术 | 用途 |
|------|------|
| Service Worker | 离线缓存 |
| Web App Manifest | 应用配置 |

## 目录结构

```
web/
├── src/
│   ├── components/           # React 组件
│   │   ├── App.tsx           # 主应用（路由/状态）
│   │   ├── QuizCard.tsx      # 刷题卡片
│   │   ├── QuestionList.tsx  # 题目列表
│   │   ├── QuestionForm.tsx  # 添加题目表单
│   │   └── ImportExport.tsx  # 导入导出组件
│   │
│   ├── types.ts              # TypeScript 类型定义
│   ├── db.ts                 # 数据库操作封装
│   ├── utils/                # 工具函数
│   │   └── import.ts         # 导入解析/验证
│   ├── data/                 # 初始数据
│   │   └── questions.ts      # 示例题目
│   ├── main.tsx              # 应用入口
│   └── index.css             # 全局样式
│
├── public/                   # 静态资源
│   ├── manifest.json         # PWA 配置
│   ├── sw.js                 # Service Worker
│   └── icons/                # 应用图标
│
├── index.html                # HTML 入口
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目配置
```

## 核心模块

### 1. types.ts - 类型定义

定义所有 TypeScript 类型：

```typescript
// 题目类型
export type QuestionType = 'single' | 'multiple' | 'judge';

// 题目
export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  answer: string | boolean;
  // ...
}

// 考试归属
export interface ExamRef {
  name: string;
  part: string;
  order: number;
  // ...
}
```

### 2. db.ts - 数据库操作

封装 IndexedDB 操作：

```typescript
// 获取所有题目
export async function getQuestions(): Promise<Question[]>

// 保存题目
export async function saveQuestion(question: Question): Promise<void>

// 导入题目（批量）
export async function importQuestions(questions: Question[]): Promise<void>

// 导出题目
export async function exportQuestions(): Promise<Question[]>

// 记录作答
export async function recordAnswer(id: string, answer: string | boolean, isCorrect: boolean): Promise<void>
```

### 3. components/ - UI 组件

#### App.tsx

主应用组件，负责：
- 页面路由（Tab 切换）
- 题目数据加载
- 全局布局

#### QuizCard.tsx

刷题卡片组件：
- 显示题目内容和选项
- 处理用户选择
- 显示答案解析
- 统计正确率

#### QuestionList.tsx

题目列表组件：
- 显示所有题目
- 支持删除操作
- 显示题目详情

#### QuestionForm.tsx

添加题目表单：
- 表单验证
- 支持所有题型
- 可选字段（难度、标签、考试信息）

#### ImportExport.tsx

导入导出组件：
- 文件选择
- JSON 解析
- 导出下载
- 清空数据

### 4. utils/import.ts - 导入工具

```typescript
// 验证题目格式
export function validateQuestion(q: unknown): q is Question

// 导入题库文件
export async function importQuestionBank(file: File): Promise<ImportResult>

// 导出为 JSON
export function exportQuestionsJson(questions: Question[], filename: string): void
```

## 数据流

### 初始化流程

```
App.tsx
  │
  ├── useEffect(() => loadQuestions())
  │     │
  │     ├── initQuestions()     // 首次加载示例数据
  │     └── getQuestions()      // 获取所有题目
  │
  └── setQuestions(data)        // 更新状态
```

### 刷题流程

```
QuizCard.tsx
  │
  ├── 用户点击选项
  │     │
  │     ├── handleSelect()      // 记录选择
  │     └── setShowResult()     // 显示结果
  │
  └── 下一题
        │
        └── setCurrentIndex()   // 更新索引
```

### 导入流程

```
ImportExport.tsx
  │
  ├── 用户选择文件
  │     │
  │     └── importQuestionBank(file)
  │           │
  │           ├── parseJsonFile()      // 解析 JSON
  │           ├── validateQuestion()   // 验证格式
  │           └── return { questions, errors }
  │
  └── importQuestions(questions)  // 存入数据库
```

## 构建与部署

### 开发模式

```bash
npm run dev
```

- 启动 Vite 开发服务器
- 热更新
- 访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

- TypeScript 类型检查
- Vite 打包
- 输出到 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 扩展指南

### 添加新题型

1. 更新 `types.ts`：
```typescript
export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill';
```

2. 更新 `QuizCard.tsx`：
```tsx
if (currentQuestion.type === 'fill') {
  // 填空题渲染逻辑
}
```

3. 更新 `QuestionForm.tsx`：
```tsx
<option value="fill">填空题</option>
```

### 添加新功能

1. 在 `src/components/` 创建新组件
2. 在 `App.tsx` 添加路由
3. 如需数据持久化，在 `db.ts` 添加方法

## 性能优化

### 当前优化

- 使用 `useMemo` 缓存计算结果
- IndexedDB 异步存储
- Service Worker 缓存静态资源

### 可选优化

- 虚拟列表（题目列表过长时）
- 分页加载
- Web Worker 处理大量数据

## MongoDB 配置与使用

### 配置文件

服务器 MongoDB 配置位于 `server/config/config.go`：

```go
package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	MongoURI string
	DBName   string
}

func Load() *Config {
	return &Config{
		MongoURI: "mongodb://localhost:27017",
		DBName:   "my-quiz",
	}
}

func (c *Config) Connect() (*mongo.Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(c.MongoURI))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// 检查连接
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	log.Println("Connected to MongoDB")
	return client.Database(c.DBName), nil
}
```

### 启动 MongoDB

使用提供的脚本启动 MongoDB Docker 容器：

```bash
# 在 server/scripts 目录下执行
./start-mongo.sh
```

启动脚本内容：

```bash
#!/bin/bash

# 启动 MongoDB 的 Docker 命令
echo "Starting MongoDB with Docker..."

docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo

echo "MongoDB started. Connection string: mongodb://admin:password@localhost:27017"
```

### 数据库结构

#### 集合（Collections）

1. **questions** - 存储题目数据
   - 字段：与 `Question` 接口对应
   - 索引：`_id` (默认), `exam.name`, `type`, `difficulty`

2. **answer_records** - 存储作答记录
   - 字段：`userId`, `questionId`, `userAnswer`, `isCorrect`, `timeSpent`, `answeredAt`
   - 索引：`userId`, `questionId`, `answeredAt`

### 连接字符串

- 开发环境：`mongodb://localhost:27017`
- Docker 环境：`mongodb://admin:password@localhost:27017`
- 远程 MongoDB：`mongodb://username:password@192.168.2.117:27017`

### 远程 MongoDB 配置（Docker 部署）

#### 前置步骤：配置 SSH 免密登录

**在本地机器上执行：**

1. **生成 SSH 密钥对**（如果还没有）
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   # 一路回车，使用默认路径 ~/.ssh/id_rsa
   ```

2. **复制公钥到远程机器**
   ```bash
   # 方法1：使用 ssh-copy-id（推荐）
   ssh-copy-id user@192.168.2.117
   
   # 方法2：手动复制（如果 ssh-copy-id 不可用）
   cat ~/.ssh/id_rsa.pub | ssh user@192.168.2.117 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
   ```

3. **测试免密登录**
   ```bash
   ssh user@192.168.2.117
   # 应该无需输入密码直接登录
   ```

4. **配置 SSH 别名（可选但推荐）**
   
   编辑本地 `~/.ssh/config` 文件，添加别名配置：
   ```bash
   nano ~/.ssh/config
   ```
   
   添加以下内容：
   ```
   Host mongo-server
       HostName 192.168.2.117
       User taichilei
       Port 22
       IdentityFile ~/.ssh/id_rsa
   ```
   
   保存后，就可以使用别名登录了：
   ```bash
   ssh mongo-server
   # 等同于 ssh taichilei@192.168.2.117
   ```
   
   其他常用别名示例：
   ```
   Host nas
       HostName 192.168.2.117
       User taichilei
       
   Host pi
       HostName 192.168.2.100
       User pi
       Port 2222
   ```

#### 方案一：在远程机器上直接部署 MongoDB Docker

1. **SSH 登录到远程机器**（如 192.168.2.117）
   ```bash
   ssh user@192.168.2.117
   ```

2. **在远程机器上启动 MongoDB Docker 容器**
   ```bash
   # 创建数据目录
   mkdir -p ~/mongodb/data
   
   # 启动 MongoDB 容器
   docker run -d \
     --name mongodb \
     -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=your_password \
     -v ~/mongodb/data:/data/db \
     --restart unless-stopped \
     mongo:latest
   ```

3. **配置防火墙**
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 27017/tcp
   
   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-port=27017/tcp
   sudo firewall-cmd --reload
   ```

4. **验证 MongoDB 运行状态**
   ```bash
   docker ps | grep mongodb
   docker logs mongodb
   ```

#### 方案二：使用 Docker Compose 部署

在远程机器上创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your_password
    volumes:
      - ./mongodb/data:/data/db
    command: mongod --bind_ip_all
```

启动命令：
```bash
docker-compose up -d
```

#### 客户端连接配置

1. **修改服务器配置**
   - 通过环境变量设置远程 MongoDB 连接字符串：
   ```bash
   # Linux/Mac
   export MONGO_URI="mongodb://admin:your_password@192.168.2.117:27017"
   
   # Windows
   set MONGO_URI=mongodb://admin:your_password@192.168.2.117:27017
   ```

2. **启动应用服务器**
   ```bash
   # 带环境变量启动
   MONGO_URI="mongodb://admin:your_password@192.168.2.117:27017" go run main.go
   ```

#### 网络设置

- 确保远程机器的防火墙允许 27017 端口的访问
- 验证局域网内网络连接正常：
  ```bash
  telnet 192.168.2.117 27017
  ```

### 故障排除

1. **MongoDB 连接失败**
   - 检查 MongoDB 服务是否运行
   - 验证连接字符串是否正确
   - 检查网络防火墙设置

2. **数据库初始化**
   - 首次启动时，MongoDB 会自动创建数据库和集合
   - 无需手动初始化操作

3. **数据迁移**
   - 从本地存储迁移到 MongoDB：使用导入导出功能
   - 定期备份数据库以防止数据丢失
