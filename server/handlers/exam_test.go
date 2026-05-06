// Package handlers 单元测试 - Exam CRUD
//
// 使用 testcontainers + PostgreSQL 进行测试
package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"my-quiz/models"
	"my-quiz/testutil"

	"github.com/gin-gonic/gin"
)

// setupExamTestDB creates a test database with Exam migration
func setupExamTestDB(t *testing.T) *gin.Engine {
	t.Helper()
	db := testutil.SetupTestDB(t)

	r := gin.Default()
	handler := NewExamHandler(db)
	api := r.Group("/api")
	{
		api.GET("/exams", handler.ListExams)
		api.GET("/exams/:id", handler.GetExam)
		api.POST("/exams", handler.CreateExam)
		api.PUT("/exams/:id", handler.UpdateExam)
		api.DELETE("/exams/:id", handler.DeleteExam)
	}

	return r
}

// TestListExams_Empty tests listing exams when empty
func TestListExams_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := setupExamTestDB(t)

	req, _ := http.NewRequest("GET", "/api/exams", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.ExamInfo
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if len(response) != 0 {
		t.Errorf("Expected 0 exams, got %d", len(response))
	}
}

// TestListExams_WithData tests listing exams with counts
func TestListExams_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)

	// Create exams
	exam1 := models.Exam{Name: "Exam 1", Year: 2021, Subject: "Math"}
	db.Create(&exam1)
	exam2 := models.Exam{Name: "Exam 2", Year: 2022, Subject: "Physics"}
	db.Create(&exam2)

	// Add questions to exam1
	db.Create(&models.Question{
		ExamID:    &exam1.ID,
		Exam:      &exam1,
		ExamOrder: 1,
		Type:      "single",
		Content:   "Q1",
	})
	db.Create(&models.Question{
		ExamID:    &exam1.ID,
		Exam:      &exam1,
		ExamOrder: 2,
		Type:      "single",
		Content:   "Q2",
	})

	r := gin.Default()
	handler := NewExamHandler(db)
	r.GET("/api/exams", handler.ListExams)

	req, _ := http.NewRequest("GET", "/api/exams", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.ExamInfo
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if len(response) != 2 {
		t.Errorf("Expected 2 exams, got %d", len(response))
	}

	// Find exam1 and check count
	var exam1Info models.ExamInfo
	for _, e := range response {
		if e.ID == exam1.ID {
			exam1Info = e
			break
		}
	}
	if exam1Info.Count != 2 {
		t.Errorf("Expected 2 questions for exam1, got %d", exam1Info.Count)
	}
}

// TestGetExam_Exists tests getting an existing exam
func TestGetExam_Exists(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)

	exam := models.Exam{Name: "Test Exam", Year: 2021, Subject: "Test", Part: "Objective"}
	db.Create(&exam)

	r := gin.Default()
	handler := NewExamHandler(db)
	r.GET("/api/exams/:id", handler.GetExam)

	req, _ := http.NewRequest("GET", "/api/exams/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.Exam
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if response.Name != "Test Exam" {
		t.Errorf("Expected name 'Test Exam', got '%s'", response.Name)
	}
	if response.Year != 2021 {
		t.Errorf("Expected year 2021, got %d", response.Year)
	}
}

// TestGetExam_NotFound tests getting non-existent exam
func TestGetExam_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := setupExamTestDB(t)

	req, _ := http.NewRequest("GET", "/api/exams/999", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestGetExam_InvalidID tests invalid ID format
func TestGetExam_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := setupExamTestDB(t)

	req, _ := http.NewRequest("GET", "/api/exams/not-a-number", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestCreateExam_Success tests creating a new exam successfully
func TestCreateExam_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := setupExamTestDB(t)

	body := map[string]interface{}{
		"name":    "New Exam",
		"year":    2023,
		"subject": "Computer Science",
		"part":    "Multiple Choice",
	}
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "/api/exams", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
		t.Logf("Response: %s", w.Body.String())
	}

	var response models.Exam
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if response.Name != "New Exam" {
		t.Errorf("Expected name 'New Exam', got '%s'", response.Name)
	}
}

// TestCreateExam_Duplicate tests creating duplicate exam
func TestCreateExam_Duplicate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)

	// Create first
	db.Create(&models.Exam{Name: "Duplicate", Year: 2021, Subject: "Test", Part: "A"})

	r := gin.Default()
	handler := NewExamHandler(db)
	r.POST("/api/exams", handler.CreateExam)

	// Try to create duplicate
	body := map[string]interface{}{
		"name":    "Duplicate",
		"year":    2021,
		"subject": "Test",
		"part":    "A",
	}
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "/api/exams", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	// Should return conflict
	if w.Code != http.StatusConflict {
		t.Errorf("Expected status %d (conflict) for duplicate, got %d", http.StatusConflict, w.Code)
	}
}

// TestUpdateExam_Success tests updating an exam successfully
func TestUpdateExam_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)

	exam := models.Exam{Name: "Original", Year: 2021, Subject: "Original"}
	db.Create(&exam)

	r := gin.Default()
	handler := NewExamHandler(db)
	r.PUT("/api/exams/:id", handler.UpdateExam)

	// Update
	body := map[string]interface{}{
		"name":    "Updated",
		"year":    2022,
		"subject": "Updated",
		"part":    "Updated Part",
	}
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("PUT", "/api/exams/1", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
		t.Logf("Response: %s", w.Body.String())
	}

	// Verify update
	var updated models.Exam
	db.First(&updated, 1)
	if updated.Name != "Updated" {
		t.Errorf("Expected updated name 'Updated', got '%s'", updated.Name)
	}
	if updated.Year != 2022 {
		t.Errorf("Expected updated year 2022, got %d", updated.Year)
	}
}

// TestUpdateExam_DuplicateAfterUpdate tests update creates duplicate
func TestUpdateExam_DuplicateAfterUpdate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)

	// Create two exams
	exam1 := models.Exam{Name: "Exam A", Year: 2021, Subject: "A"}
	db.Create(&exam1)
	exam2 := models.Exam{Name: "Exam B", Year: 2021, Subject: "B"}
	db.Create(&exam2)

	r := gin.Default()
	handler := NewExamHandler(db)
	r.PUT("/api/exams/:id", handler.UpdateExam)

	// Try to update exam 2 to match exam 1's unique key
	body := map[string]interface{}{
		"name":    "Exam A",
		"year":    2021,
		"subject": "A",
	}
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("PUT", "/api/exams/"+string(rune(exam2.ID+'0')), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("Expected conflict for duplicate after update, got %d", w.Code)
	}
}

// TestDeleteExam_Success tests deleting an exam
func TestDeleteExam_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)

	exam := models.Exam{Name: "To Delete", Year: 2021, Subject: "Test"}
	db.Create(&exam)

	// Verify exists
	var count int64
	db.Model(&models.Exam{}).Count(&count)
	if count != 1 {
		t.Fatalf("Expected 1 exam before delete, got %d", count)
	}

	r := gin.Default()
	handler := NewExamHandler(db)
	r.DELETE("/api/exams/:id", handler.DeleteExam)

	req, _ := http.NewRequest("DELETE", "/api/exams/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Verify deleted
	db.Model(&models.Exam{}).Count(&count)
	if count != 0 {
		t.Errorf("Expected 0 exams after delete, got %d", count)
	}
}

// TestDeleteExam_NotFound tests deleting non-existent exam
func TestDeleteExam_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := setupExamTestDB(t)

	req, _ := http.NewRequest("DELETE", "/api/exams/999", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}
