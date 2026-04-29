// Package config 负责加载应用配置并初始化数据库连接。
//
// 从环境变量读取 PostgreSQL 连接信息，使用 GORM ORM 连接数据库，
// 并自动执行数据库迁移，创建表结构和必要索引。
package config

import (
	"encoding/json"
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
	if err := db.AutoMigrate(&models.Exam{}, &models.Question{}, &models.AnswerRecord{}, &models.QuizSession{}, &models.Upload{}, &models.User{}); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate: %w", err)
	}

	// 创建索引
	// 保留旧 JSONB 索引向后兼容（迁移完成后可删除）
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_questions_exam_name ON questions ((exam->>'name'));`)
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

	// 自动数据迁移：从 JSONB exam 迁移到独立 exams 表 + 外键
	// 只在存在数据需要迁移时执行（exam_id 为 NULL 但 exam JSONB 存在）
	var count int64
	db.Model(&models.Question{}).Where("exam_id IS NULL AND exam IS NOT NULL").Count(&count)
	if count > 0 {
		log.Printf("Starting data migration: %d questions need migration from JSONB to exams table", count)
		if err := migrateData(db); err != nil {
			log.Printf("Data migration failed: %v", err)
			return nil, fmt.Errorf("data migration: %w", err)
		}
		log.Println("Data migration completed successfully")
	}

	log.Println("Database connected and initialized")
	return db, nil
}

// migrateData 从旧 JSONB exam 格式迁移数据到独立 exams 表
func migrateData(db *gorm.DB) error {
	// 查询所有需要迁移的题目
	var questions []struct {
		ID        int
		ExamJSON  []byte  `gorm:"column:exam"`
		Order     int     `gorm:"column:(exam->>'order')"`
	}

	if err := db.Raw(`
		SELECT id, exam, (exam->>'order')::int as "order"
		FROM questions
		WHERE exam_id IS NULL AND exam IS NOT NULL
	`).Scan(&questions).Error; err != nil {
		return err
	}

	// 遍历每个题目，提取 exam 信息，去重插入 exams，更新 question.exam_id 和 exam_order
	for _, q := range questions {
		var examData struct {
			Name    string `json:"name"`
			Year    int    `json:"year"`
			Subject string `json:"subject"`
			Part    string `json:"part"`
			Order   int    `json:"order"`
		}
		if err := json.Unmarshal(q.ExamJSON, &examData); err != nil {
			log.Printf("Warning: failed to unmarshal exam JSON for question %d: %v, skipping", q.ID, err)
			continue
		}

		// 查找或创建 exam
		var exam models.Exam
		result := db.Where(models.Exam{
			Name:    examData.Name,
			Year:    examData.Year,
			Subject: examData.Subject,
			Part:    examData.Part,
		}).FirstOrCreate(&exam)

		if result.Error != nil {
			log.Printf("Warning: failed to find/create exam for question %d: %v, skipping", q.ID, result.Error)
			continue
		}

		// 更新 question
		order := examData.Order
		if q.Order > 0 {
			order = q.Order
		}
		db.Model(&models.Question{}).Where("id = ?", q.ID).Updates(map[string]interface{}{
			"exam_id":    exam.ID,
			"exam_order": order,
		})
	}

	return nil
}
