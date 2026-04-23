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

	// 连接数据库
	db, err := cfg.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	// 创建表结构（如果不存在）
	if err := cfg.CreateTables(db); err != nil {
		log.Fatalf("Failed to create tables: %v", err)
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
		api.GET("/exams", qHandler.GetExams)

		// 答题记录接口
		rHandler := handlers.NewRecordHandler(db)
		api.POST("/records", rHandler.CreateRecord)
		api.GET("/records/:userId", rHandler.GetRecords)
		api.GET("/records/:userId/stats", rHandler.GetStats)
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
