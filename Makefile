# My-Quiz 容器化部署 Makefile

.PHONY: help build up down restart logs clean test typecheck \
        db-up db-down db-logs db-reset server web dev

# 默认目标
help:
	@echo "My-Quiz 命令一览："
	@echo ""
	@echo "本机开发模式（推荐日常）："
	@echo "  make db-up      - 起依赖：PostgreSQL + MailHog"
	@echo "  make server     - 本机起 server（端口 8080，热改重启）"
	@echo "  make web        - 本机起 vite（端口 5173，热更新）"
	@echo "  make db-down    - 停依赖"
	@echo "  make db-logs    - 看 PG / MailHog 日志"
	@echo "  make db-reset   - 清空 PG 数据卷"
	@echo "  make dev        - 等价于 make db-up（提示下一步）"
	@echo ""
	@echo "全栈 docker 模式（类生产 / 演示）："
	@echo "  make build      - 构建 Docker 镜像"
	@echo "  make up         - 起全栈（PG + MailHog + server + web）"
	@echo "  make down       - 停全栈"
	@echo "  make restart    - 重启全栈"
	@echo "  make logs       - 看全栈日志"
	@echo "  make clean      - 清理容器、镜像、数据卷"
	@echo ""
	@echo "测试与质量："
	@echo "  make test       - 运行前端测试"
	@echo "  make typecheck  - 前端 TypeScript 类型检查"

# --- 本机开发模式 ---

db-up:
	docker compose up -d
	@echo ""
	@echo "依赖已起："
	@echo "  - PostgreSQL: localhost:5434"
	@echo "  - MailHog UI: http://localhost:8025"
	@echo ""
	@echo "下一步（在两个终端各跑一个）："
	@echo "  - 终端 A: make server"
	@echo "  - 终端 B: make web"

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres mailhog

db-reset:
	docker compose down -v
	@echo "数据卷已清空，下次 make db-up 时会建空库"

server:
	cd server && go run main.go

web:
	cd apps/web && npm run dev

# dev 只起依赖；前后端进程让用户在两个终端各自控制（日志不混、Ctrl-C 行为可预期）
dev: db-up

# --- 全栈 docker 模式 ---

# 构建 Docker 镜像
build:
	docker build -t my-quiz/web:latest -f apps/web/Dockerfile apps/web/
	docker build -t my-quiz/server:latest -f server/Dockerfile server/

# 启动全栈（包含 server + web，profile=full）
up:
	docker compose --profile full up -d
	@echo "全栈已启动:"
	@echo "  - Web UI: http://localhost:3000"
	@echo "  - API: http://localhost:8081"
	@echo "  - PostgreSQL: localhost:5434"
	@echo "  - MailHog UI: http://localhost:8025"

# 停止所有服务（含 profile=full 的 service）
down:
	docker compose --profile full down

# 重启全栈
restart:
	docker compose --profile full restart

# 查看日志
logs:
	docker compose --profile full logs -f

# 清理（含数据卷）
clean:
	docker compose --profile full down -v
	docker rmi my-quiz/web:latest my-quiz/server:latest 2>/dev/null || true

# --- 测试与质量 ---

test:
	cd apps/web && npm test

typecheck:
	cd apps/web && npm run typecheck
