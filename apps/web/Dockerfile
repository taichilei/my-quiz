# 阶段1: 构建
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY package-lock.json ./
RUN npm install --ignore-scripts

# 复制源代码（排除测试文件）
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# 删除测试文件
RUN find ./src -name "*.test.ts" -delete && \
    find ./src -name "*.test.tsx" -delete

# 构建
RUN npm run build

# 阶段2: 生产
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
