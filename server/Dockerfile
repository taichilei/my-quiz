# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 上下文是项目根目录，复制 server 目录下的所有文件
COPY server/ ./

# 使用国内镜像加速下载
ENV GOPROXY=https://goproxy.cn,direct

# 下载依赖
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
ENV POSTGRES_URI=postgres://postgres:postgres@postgres:5432/my-quiz?sslmode=disable

CMD ["./my-quiz-server"]
