# 阶段1: 构建
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY web/package*.json ./
COPY web/package-lock.json ./
RUN npm install --ignore-scripts

# 复制源代码（排除测试文件）
COPY web/src ./src
COPY web/public ./public
COPY web/index.html ./
COPY web/vite.config.ts ./
COPY web/tailwind.config.js ./
COPY web/postcss.config.js ./
COPY web/tsconfig.json ./
COPY web/tsconfig.node.json ./

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
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
