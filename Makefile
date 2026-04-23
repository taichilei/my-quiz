# My-Quiz 容器化部署 Makefile

.PHONY: help build up down restart logs clean test dev

# 默认目标
help:
	@echo "My-Quiz 部署命令:"
	@echo "  make build    - 构建 Docker 镜像"
	@echo "  make up       - 启动所有服务"
	@echo "  make down     - 停止所有服务"
	@echo "  make restart  - 重启所有服务"
	@echo "  make logs     - 查看服务日志"
	@echo "  make clean    - 清理容器和镜像"
	@echo "  make test     - 运行前端测试"
	@echo "  make dev      - 本地开发模式"

# 构建 Docker 镜像
build:
	docker build -t my-quiz/web:latest -f web/Dockerfile web/
	docker build -t my-quiz/server:latest -f server/Dockerfile server/

# 启动所有服务（使用 docker-compose）
up:
	docker-compose up -d
	@echo "服务已启动:"
	@echo "  - Web UI: http://localhost:3000"
	@echo "  - API: http://localhost:8080"
	@echo "  - PostgreSQL: localhost:5432"

# 停止所有服务
down:
	docker-compose down

# 重启所有服务
restart:
	docker-compose restart

# 查看日志
logs:
	docker-compose logs -f

# 清理
clean:
	docker-compose down -v
	docker rmi my-quiz/web:latest my-quiz/server:latest 2>/dev/null || true

# 运行测试
test:
	cd web && npm test

# 本地开发（需要先安装依赖）
dev:
	@echo "启动本地开发..."
	@echo "前端: cd web && npm run dev"
	@echo "后端: cd server && go run main.go"
