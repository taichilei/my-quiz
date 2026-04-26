// Package main My-Quiz 后端服务入口。
//
// 加载配置，连接数据库，启动 Gin HTTP 服务，注册所有 API 路由。
package main

import (
	"log"
	"os"

	"my-quiz/config"
	"my-quiz/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
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

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API 路由
	api := r.Group("/api")
	{
		// 题目相关接口
		qHandler := handlers.NewQuestionHandler(db)
		api.GET("/questions", qHandler.GetQuestions)
		api.GET("/questions/:id", qHandler.GetQuestion)
		api.POST("/questions", qHandler.CreateQuestion)
		api.PUT("/questions/:id", qHandler.UpdateQuestion)
		api.DELETE("/questions/:id", qHandler.DeleteQuestion)
		api.GET("/exams", qHandler.GetExams) // backward compatibility

		// 考试管理接口（独立 CRUD）
		eHandler := handlers.NewExamHandler(db)
		api.GET("/exams", eHandler.ListExams)
		api.GET("/exams/:id", eHandler.GetExam)
		api.POST("/exams", eHandler.CreateExam)
		api.PUT("/exams/:id", eHandler.UpdateExam)
		api.DELETE("/exams/:id", eHandler.DeleteExam)

		// 答题记录接口
		rHandler := handlers.NewRecordHandler(db)
		api.POST("/records", rHandler.CreateRecord)
		api.GET("/records/:userId", rHandler.GetRecords)
		api.GET("/records/:userId/stats", rHandler.GetStats)

		// 未完成刷题会话接口（跨设备同步）
		sHandler := handlers.NewSessionHandler(db)
		api.GET("/session/current", sHandler.GetCurrent)
		api.POST("/session", sHandler.Upsert)
		api.DELETE("/session/current", sHandler.DeleteCurrent)

		// 文件上传管理接口
		uHandler := handlers.NewUploadHandler(db)
		api.GET("/uploads", uHandler.List)
		api.GET("/uploads/:id", uHandler.Get)
		api.GET("/uploads/:id/download", uHandler.Download)
		api.POST("/uploads", uHandler.Upload)
		api.PUT("/uploads/:id", uHandler.Update)
		api.DELETE("/uploads/:id", uHandler.Delete)
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
