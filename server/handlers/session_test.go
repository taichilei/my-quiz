package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
)

// TestGetCurrent_NoSession tests GetCurrent when no session exists
func TestGetCurrent_NoSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewSessionHandler(db)

	r := gin.Default()
	r.GET("/api/session/current", handler.GetCurrent)

	req, _ := http.NewRequest("GET", "/api/session/current", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestGetCurrent_WithSession tests GetCurrent returns existing session
func TestGetCurrent_WithSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewSessionHandler(db)

	// Insert a session
	session := models.QuizSession{
		UserID:         "default-user",
		QuizTitle:      "Test Quiz",
		QuestionIDs:    []int{1, 2, 3, 4, 5},
		CurrentIndex:   2,
		CorrectCount:   1,
		SelectedAnswer: "A",
		ShowResult:     false,
	}
	db.Create(&session)

	r := gin.Default()
	r.GET("/api/session/current", handler.GetCurrent)

	req, _ := http.NewRequest("GET", "/api/session/current", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.QuizSession
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.UserID != "default-user" {
		t.Errorf("Expected userID default-user, got %s", response.UserID)
	}
	if response.QuizTitle != "Test Quiz" {
		t.Errorf("Expected title 'Test Quiz', got '%s'", response.QuizTitle)
	}
	if response.CurrentIndex != 2 {
		t.Errorf("Expected current index 2, got %d", response.CurrentIndex)
	}
	if response.CorrectCount != 1 {
		t.Errorf("Expected correct count 1, got %d", response.CorrectCount)
	}
}

// TestDeleteCurrent tests deleting current session
func TestDeleteCurrent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewSessionHandler(db)

	// Insert a session
	session := models.QuizSession{
		UserID:      "default-user",
		QuizTitle:   "To be deleted",
		QuestionIDs: []int{1, 2, 3},
	}
	db.Create(&session)

	// Verify it exists
	var count int64
	db.Model(&models.QuizSession{}).Where("user_id = ?", "default-user").Count(&count)
	if count != 1 {
		t.Fatalf("Expected 1 session before delete, got %d", count)
	}

	r := gin.Default()
	r.DELETE("/api/session/current", handler.DeleteCurrent)

	req, _ := http.NewRequest("DELETE", "/api/session/current", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Verify it's deleted
	db.Model(&models.QuizSession{}).Where("user_id = ?", "default-user").Count(&count)
	if count != 0 {
		t.Errorf("Expected 0 sessions after delete, got %d", count)
	}
}

// TestUpsert tests creating or updating a session returns bad request for empty body
func TestUpsert_EmptyBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewSessionHandler(db)

	r := gin.Default()
	r.POST("/api/session", handler.Upsert)

	req, _ := http.NewRequest("POST", "/api/session", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	// Empty body should give bad request
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}
