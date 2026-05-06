package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"my-quiz/models"
	"my-quiz/testutil"

	"github.com/gin-gonic/gin"
)

// TestGetStats_Empty tests GetStats when no records exist
func TestGetStats_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewRecordHandler(db)

	r := gin.Default()
	r.GET("/api/records/:userId/stats", handler.GetStats)

	req, _ := http.NewRequest("GET", "/api/records/default-user/stats", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["total"].(float64) != 0 {
		t.Errorf("Expected 0 total answered, got %v", response["total"])
	}
	if response["correct"].(float64) != 0 {
		t.Errorf("Expected 0 correct, got %v", response["correct"])
	}
}

// TestGetStats_WithRecords tests GetStats with existing records
func TestGetStats_WithRecords(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewRecordHandler(db)

	// Insert test data: 2 records, 1 correct, 1 incorrect
	db.Create(&models.AnswerRecord{
		UserID:     "default-user",
		QuestionID: 1,
		UserAnswer: "A",
		IsCorrect:  true,
		TimeSpent:  10,
		AnsweredAt: 1234567890,
	})
	db.Create(&models.AnswerRecord{
		UserID:     "default-user",
		QuestionID: 2,
		UserAnswer: "B",
		IsCorrect:  false,
		TimeSpent:  15,
		AnsweredAt: 1234567891,
	})

	r := gin.Default()
	r.GET("/api/records/:userId/stats", handler.GetStats)

	req, _ := http.NewRequest("GET", "/api/records/default-user/stats", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["total"].(float64) != 2 {
		t.Errorf("Expected 2 total answered, got %v", response["total"])
	}
	if response["correct"].(float64) != 1 {
		t.Errorf("Expected 1 correct, got %v", response["correct"])
	}
	// rate should be 50%
	if response["rate"].(float64) != 50.0 {
		t.Errorf("Expected accuracy 50.0, got %.1f", response["rate"].(float64))
	}
}

// TestGetRecords_Empty tests GetRecords when no records exist
func TestGetRecords_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewRecordHandler(db)

	r := gin.Default()
	r.GET("/api/records/:userId", handler.GetRecords)

	req, _ := http.NewRequest("GET", "/api/records/default-user", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.AnswerRecord
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response) != 0 {
		t.Errorf("Expected 0 records, got %d", len(response))
	}
}

// TestCreateRecord tests creating a new record
func TestCreateRecord(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewRecordHandler(db)

	r := gin.Default()
	r.POST("/api/records", handler.CreateRecord)

	// Empty body should give bad request
	req, _ := http.NewRequest("POST", "/api/records", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetStats_DifferentUser tests stats are isolated by user ID
func TestGetStats_DifferentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewRecordHandler(db)

	// Records for user A
	db.Create(&models.AnswerRecord{
		UserID:     "user-a",
		QuestionID: 1,
		IsCorrect:  true,
	})
	db.Create(&models.AnswerRecord{
		UserID:     "user-a",
		QuestionID: 2,
		IsCorrect:  true,
	})

	// One record for user B
	db.Create(&models.AnswerRecord{
		UserID:     "user-b",
		QuestionID: 1,
		IsCorrect:  false,
	})

	r := gin.Default()
	r.GET("/api/records/:userId/stats", handler.GetStats)

	// Check user-a stats
	req, _ := http.NewRequest("GET", "/api/records/user-a/stats", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["total"].(float64) != 2 {
		t.Errorf("Expected 2 total for user-a, got %v", response["total"])
	}
	if response["correct"].(float64) != 2 {
		t.Errorf("Expected 2 correct for user-a, got %v", response["correct"])
	}
}
