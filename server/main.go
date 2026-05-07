// Package main My-Quiz 后端服务入口。
//
// 加载配置，连接数据库，启动 Gin HTTP 服务，注册所有 API 路由。
package main

import (
	"log"
	"os"

	"my-quiz/config"
	"my-quiz/handlers"
	"my-quiz/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 本地开发：若存在 .env 文件则加载（生产环境无该文件，静默忽略）
	_ = godotenv.Load()

	// 加载配置
	cfg := config.Load()

	// 连接数据库（GORM）
	db, err := cfg.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	log.Println("Database connected and initialized")

	// 创建 Gin 引擎
	r := gin.Default()

	// 配置 CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 多端信息解析中间件（全局生效）
	r.Use(middleware.ClientInfoMiddleware())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API 路由
	api := r.Group("/api")
	{
		// 认证接口（公开，不需要登录）
		authHandler := handlers.NewAuthHandler(db)
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/verify-email", authHandler.VerifyEmail)
		api.POST("/auth/resend-verification", authHandler.ResendVerificationEmail)
		api.POST("/auth/forgot-password", authHandler.ForgotPassword)
		api.POST("/auth/reset-password", authHandler.ResetPassword)

		// 需要 JWT 认证的接口
		authGroup := api.Group("/")
		authGroup.Use(middleware.JWTAuth())
		{
			// 调试接口：返回当前请求的客户端信息
			authGroup.GET("/debug/client-info", func(c *gin.Context) {
				client := middleware.GetClient(c)
				c.JSON(200, gin.H{
					"type":      client.Type,
					"version":   client.Version,
					"device_id": client.DeviceID,
					"platform":  client.Platform,
					"is_mobile": client.IsMobile,
				})
			})

			// 用户信息接口
			userHandler := handlers.NewUserHandler(db)
			authGroup.GET("/user/me", userHandler.GetMe)
			authGroup.PUT("/user/me", userHandler.UpdateMe)

			// 题目相关接口
			qHandler := handlers.NewQuestionHandler(db)
			authGroup.GET("/questions", qHandler.GetQuestions)
			authGroup.GET("/questions/:id", qHandler.GetQuestion)
			authGroup.POST("/questions", qHandler.CreateQuestion)
			authGroup.PUT("/questions/:id", qHandler.UpdateQuestion)
			authGroup.DELETE("/questions/:id", qHandler.DeleteQuestion)

			// 考试管理接口（独立 CRUD）
			eHandler := handlers.NewExamHandler(db)
			authGroup.GET("/exams", eHandler.ListExams)
			// qHandler.GetExams kept for backward compatibility on old clients, but route is handled by eHandler now
			authGroup.GET("/exams/:id", eHandler.GetExam)
			authGroup.POST("/exams", eHandler.CreateExam)
			authGroup.PUT("/exams/:id", eHandler.UpdateExam)
			authGroup.DELETE("/exams/:id", eHandler.DeleteExam)

			// 答题记录接口
			rHandler := handlers.NewRecordHandler(db)
			authGroup.POST("/records", rHandler.CreateRecord)
			authGroup.GET("/records/:userId", rHandler.GetRecords)
			authGroup.GET("/records/:userId/stats", rHandler.GetStats)

			// 未完成刷题会话接口（跨设备同步）
			sHandler := handlers.NewSessionHandler(db)
			authGroup.GET("/session/current", sHandler.GetCurrent)
			authGroup.POST("/session", sHandler.Upsert)
			authGroup.DELETE("/session/current", sHandler.DeleteCurrent)

			// 文件上传管理接口
			uHandler := handlers.NewUploadHandler(db)
			authGroup.GET("/uploads", uHandler.List)
			authGroup.GET("/uploads/:id", uHandler.Get)
			authGroup.GET("/uploads/:id/download", uHandler.Download)
			authGroup.POST("/uploads", uHandler.Upload)
			authGroup.PUT("/uploads/:id", uHandler.Update)
			authGroup.DELETE("/uploads/:id", uHandler.Delete)
		}
	}

	// 获取端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
