// Package config 负责加载应用配置并初始化数据库连接。
//
// 从环境变量读取 PostgreSQL 连接信息，使用 GORM ORM 连接数据库，
// 并自动执行数据库迁移，创建表结构和必要索引。
package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"my-quiz/models"
)

// Config 保存应用运行所需的配置项。
type Config struct {
	// PostgresURI PostgreSQL 数据库连接字符串
	PostgresURI string
}

func Load() *Config {
	// 优先从环境变量读取 PostgreSQL 连接字符串
	pgURI := os.Getenv("POSTGRES_URI")
	if pgURI == "" {
		// 默认使用本地 PostgreSQL
		pgURI = "postgres://postgres:postgres@localhost:5432/my-quiz?sslmode=disable"
	}

	return &Config{
		PostgresURI: pgURI,
	}
}

// Connect 使用 GORM 连接 PostgreSQL
func (c *Config) Connect() (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(c.PostgresURI), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL with GORM: %w", err)
	}

	log.Println("Connected to PostgreSQL with GORM")

	// AutoMigrate 创建/更新表结构
	if err := db.AutoMigrate(
		&models.Exam{},
		&models.Question{},
		&models.AnswerRecord{},
		&models.QuizSession{},
		&models.Upload{},
		&models.User{},
		&models.EmailVerification{},
		&models.PasswordReset{},
	); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate: %w", err)
	}

	// 创建索引
	// 新索引：独立 exams 表
	db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_composite_unique ON exams (name, year, subject, part);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams (subject);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_exams_year ON exams (year);`)
	// questions 新索引
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions (exam_id);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (type);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_records_user_id ON records (user_id);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_records_question_id ON records (question_id);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions (user_id);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads (user_id);`)

	log.Println("Database migrated and indexes created")
	log.Println("Database connected and initialized")
	return db, nil
}
