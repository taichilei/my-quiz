package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type Config struct {
	PostgresURI string
	DBName      string
}

func Load() *Config {
	// 优先从环境变量读取 PostgreSQL 连接字符串
	pgURI := os.Getenv("POSTGRES_URI")
	if pgURI == "" {
		// 默认使用本地 PostgreSQL
		pgURI = "postgres://postgres:postgres@localhost:5432/my-quiz?sslmode=disable"
	}

	// 优先从环境变量读取数据库名称
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "my-quiz"
	}

	return &Config{
		PostgresURI: pgURI,
		DBName:      dbName,
	}
}

func (c *Config) Connect() (*sql.DB, error) {
	db, err := sql.Open("postgres", c.PostgresURI)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %v", err)
	}

	// 检查连接
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %v", err)
	}

	log.Println("Connected to PostgreSQL")
	return db, nil
}

// CreateTables 创建数据库表（如果不存在）
func (c *Config) CreateTables(db *sql.DB) error {
	// 创建 questions 表
	createQuestions := `
	CREATE TABLE IF NOT EXISTS questions (
		id SERIAL PRIMARY KEY,
		type VARCHAR(20) NOT NULL,
		content TEXT NOT NULL,
		options JSONB,
		answer TEXT NOT NULL,
		explanation TEXT,
		difficulty INTEGER,
		tags JSONB,
		exam JSONB,
		images JSONB,
		created_at BIGINT NOT NULL,
		updated_at BIGINT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_questions_exam_name ON questions ((exam->>'name'));
	CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (type);
	`

	_, err := db.Exec(createQuestions)
	if err != nil {
		return fmt.Errorf("failed to create questions table: %v", err)
	}

	// 创建 records 表
	createRecords := `
	CREATE TABLE IF NOT EXISTS records (
		id SERIAL PRIMARY KEY,
		user_id VARCHAR(100) NOT NULL,
		question_id VARCHAR(100) NOT NULL,
		user_answer TEXT,
		is_correct BOOLEAN NOT NULL,
		time_spent INTEGER,
		answered_at BIGINT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_records_user_id ON records (user_id);
	CREATE INDEX IF NOT EXISTS idx_records_question_id ON records (question_id);
	`

	_, err = db.Exec(createRecords)
	if err != nil {
		return fmt.Errorf("failed to create records table: %v", err)
	}

	log.Println("Database tables initialized")
	return nil
}
