// Package handlers 单元测试
//
// 使用 SQLite 内存数据库进行测试，不需要外部 PostgreSQL 依赖。
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB 创建一个新的 SQLite 内存数据库实例用于测试
// 每个测试获得独立的数据库，避免测试之间数据干扰
func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	// Use unique in-memory database for each test
	dbName := fmt.Sprintf("file:test-%p?mode=memory&cache=shared", t)
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// 自动迁移所有表结构
	err = db.AutoMigrate(
		&models.Question{},
		&models.AnswerRecord{},
		&models.QuizSession{},
		&models.Upload{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// TestGetQuestions_EmptyDB tests GetQuestions when database is empty
func TestGetQuestions_EmptyDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	r := gin.Default()
	r.GET("/api/questions", handler.GetQuestions)

	req, _ := http.NewRequest("GET", "/api/questions", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.Question
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response) != 0 {
		t.Errorf("Expected 0 questions, got %d", len(response))
	}
}

// TestGetQuestions_WithData tests GetQuestions returns existing questions
func TestGetQuestions_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	// Insert test data
	q1 := models.Question{
		Type:    "single",
		Content: "Test question 1",
		Options: []string{"A", "B", "C", "D"},
		Answer:  "A",
		Exam: models.Exam{
			Name:    "Test Exam",
			Year:    2021,
			Subject: "Test",
		},
		Difficulty: 1,
	}
	db.Create(&q1)

	q2 := models.Question{
		Type:    "multiple",
		Content: "Test question 2",
		Options: []string{"X", "Y", "Z"},
		Answer:  "XY",
		Exam: models.Exam{
			Name:    "Another Exam",
			Year:    2022,
			Subject: "Another",
		},
		Difficulty: 2,
	}
	db.Create(&q2)

	r := gin.Default()
	r.GET("/api/questions", handler.GetQuestions)

	req, _ := http.NewRequest("GET", "/api/questions", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.Question
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response) != 2 {
		t.Errorf("Expected 2 questions, got %d", len(response))
	}
}

// TestGetQuestions_ByExam filters questions by exam name
func TestGetQuestions_ByExam(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	// Insert test data with different exams
	q1 := models.Question{
		Type:    "single",
		Content: "Question in Test Exam",
		Options: []string{"A", "B"},
		Answer:  "A",
		Exam: models.Exam{
			Name: "Test Exam",
		},
	}
	db.Create(&q1)

	q2 := models.Question{
		Type:    "single",
		Content: "Question in Another Exam",
		Options: []string{"A", "B"},
		Answer:  "A",
		Exam: models.Exam{
			Name: "Another Exam",
		},
	}
	db.Create(&q2)

	r := gin.Default()
	r.GET("/api/questions", handler.GetQuestions)

	req, _ := http.NewRequest("GET", "/api/questions?exam=Test Exam", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.Question
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response) != 1 {
		t.Errorf("Expected 1 question, got %d", len(response))
	}
	if response[0].Exam.Name != "Test Exam" {
		t.Errorf("Expected exam name 'Test Exam', got '%s'", response[0].Exam.Name)
	}
}

// TestGetQuestion_Exists tests getting an existing question
func TestGetQuestion_Exists(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	q := models.Question{
		Type:    "single",
		Content: "Test question",
		Options: []string{"A", "B", "C", "D"},
		Answer:  "B",
		Exam: models.Exam{
			Name: "Test",
		},
	}
	db.Create(&q)

	r := gin.Default()
	r.GET("/api/questions/:id", handler.GetQuestion)

	req, _ := http.NewRequest("GET", "/api/questions/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.Question
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.ID != 1 {
		t.Errorf("Expected ID 1, got %d", response.ID)
	}
	if response.Content != "Test question" {
		t.Errorf("Expected content 'Test question', got '%s'", response.Content)
	}
}

// TestGetQuestion_NotFound tests getting a non-existent question
func TestGetQuestion_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	r := gin.Default()
	r.GET("/api/questions/:id", handler.GetQuestion)

	req, _ := http.NewRequest("GET", "/api/questions/999", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestGetQuestions_InvalidID tests getting with invalid ID format
func TestGetQuestion_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	r := gin.Default()
	r.GET("/api/questions/:id", handler.GetQuestion)

	req, _ := http.NewRequest("GET", "/api/questions/not-a-number", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetExams tests getting all distinct exams
func TestGetExams(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	// Insert questions with different exams
	db.Create(&models.Question{
		Type:    "single",
		Content: "Q1",
		Exam: models.Exam{Name: "Exam A", Year: 2021, Subject: "Math"},
	})
	db.Create(&models.Question{
		Type:    "single",
		Content: "Q2",
		Exam: models.Exam{Name: "Exam A", Year: 2021, Subject: "Math"}, // Same exam
	})
	db.Create(&models.Question{
		Type:    "single",
		Content: "Q3",
		Exam: models.Exam{Name: "Exam B", Year: 2022, Subject: "Physics"},
	})

	r := gin.Default()
	r.GET("/api/exams", handler.GetExams)

	req, _ := http.NewRequest("GET", "/api/exams", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Response should be a list of exams, even if we can't easily unmarshal the exact type,
	// we just check it's valid JSON and not empty
	var response []interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Should have 2 distinct exams
	if len(response) != 2 {
		t.Errorf("Expected 2 distinct exams, got %d", len(response))
	}
}

// TestCreateQuestion tests creating a new question
func TestCreateQuestion(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	r := gin.Default()
	r.POST("/api/questions", handler.CreateQuestion)

	// Note: This test just verifies the endpoint works and returns error for bad JSON
	// Full testing would require sending valid JSON
	req, _ := http.NewRequest("POST", "/api/questions", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	// Should get bad request for empty body
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestDeleteQuestion tests deleting an existing question
func TestDeleteQuestion(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewQuestionHandler(db)

	// Insert a question
	q := models.Question{
		Type:    "single",
		Content: "To be deleted",
		Options: []string{"A", "B"},
		Answer:  "A",
	}
	db.Create(&q)

	// Verify it exists
	var count int64
	db.Model(&models.Question{}).Count(&count)
	if count != 1 {
		t.Fatalf("Expected 1 question before delete, got %d", count)
	}

	r := gin.Default()
	r.DELETE("/api/questions/:id", handler.DeleteQuestion)

	req, _ := http.NewRequest("DELETE", "/api/questions/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Verify it's deleted
	db.Model(&models.Question{}).Count(&count)
	if count != 0 {
		t.Errorf("Expected 0 questions after delete, got %d", count)
	}
}
