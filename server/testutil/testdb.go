package testutil

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"my-quiz/models"
)

var (
	once      sync.Once
	container testcontainers.Container
	dbConnStr string
)

// SetupTestDB 返回一个连接到测试 PostgreSQL 的 gorm.DB
// 所有测试共享一个容器实例，每个测试前会清理数据
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	once.Do(func() {
		ctx := context.Background()

		postgresContainer, err := tcpostgres.RunContainer(ctx,
			testcontainers.WithImage("postgres:16-alpine"),
			tcpostgres.WithDatabase("testdb"),
			tcpostgres.WithUsername("testuser"),
			tcpostgres.WithPassword("testpass"),
			testcontainers.WithWaitStrategy(
				wait.ForLog("database system is ready to accept connections").
					WithOccurrence(2).WithStartupTimeout(30*time.Second),
			),
		)
		if err != nil {
			t.Fatalf("Failed to start PostgreSQL container: %v. Is Docker daemon running?", err)
		}

		container = postgresContainer
		dbConnStr, err = postgresContainer.ConnectionString(ctx, "sslmode=disable")
		if err != nil {
			t.Fatalf("Failed to get connection string: %v", err)
		}
	})

	db, err := gorm.Open(postgres.Open(dbConnStr), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// AutoMigrate 只在首次连接时执行
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
		t.Fatalf("Failed to migrate database: %v", err)
	}

	cleanDB(db)

	return db
}

// cleanDB 清理所有表数据，保持表结构
func cleanDB(db *gorm.DB) {
	tables := []string{
		"records",
		"quiz_sessions",
		"questions",
		"exams",
		"uploads",
		"email_verifications",
		"password_resets",
		"users",
	}

	db.Exec("SET CONSTRAINTS ALL DEFERRED;")
	for _, table := range tables {
		db.Exec(fmt.Sprintf("TRUNCATE TABLE %s RESTART IDENTITY CASCADE;", table))
	}
}
