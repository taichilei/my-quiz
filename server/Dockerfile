# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 复制源代码和 go.mod
COPY server/ ./

# 直接获取所有依赖（会自动创建 go.sum）
RUN go mod tidy && go mod download

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -o /my-quiz-server

# 运行阶段
FROM alpine:latest

WORKDIR /app

# 安装 CA 证书（用于 HTTPS）
RUN apk --no-cache add ca-certificates

# 复制构建产物
COPY --from=builder /my-quiz-server .

# 暴露端口
EXPOSE 8080

# 环境变量
ENV PORT=8080
ENV MONGO_URI=mongodb://mongo:27017

CMD ["./my-quiz-server"]
