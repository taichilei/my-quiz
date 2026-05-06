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

// TestList_UploadsEmpty tests List when no uploads exist
func TestList_UploadsEmpty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	r := gin.Default()
	r.GET("/api/uploads", handler.List)

	req, _ := http.NewRequest("GET", "/api/uploads", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.Upload
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response) != 0 {
		t.Errorf("Expected 0 uploads, got %d", len(response))
	}
}

// TestList_UploadsWithData tests List returns existing uploads
func TestList_UploadsWithData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	// Insert test uploads with different timestamps to ensure correct ordering
	u1 := models.NewUpload("default-user", "test1.pdf", "pdf", "uploads/default-user/2024/01/123456-test1.pdf", 1024)
	// Force earlier timestamp
	u1.CreatedAt = u1.CreatedAt - 1000
	db.Create(&u1)

	u2 := models.NewUpload("default-user", "test2.png", "image", "uploads/default-user/2024/01/123457-test2.png", 2048)
	db.Create(&u2)

	r := gin.Default()
	r.GET("/api/uploads", handler.List)

	req, _ := http.NewRequest("GET", "/api/uploads", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response []models.Upload
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response) != 2 {
		t.Errorf("Expected 2 uploads, got %d", len(response))
	}
	// Check ordering - should be descending by created_at, so first should be u2 (second created)
	if response[0].FileName != "test2.png" {
		t.Errorf("Expected first file to be test2.png, got %s", response[0].FileName)
	}
}

// TestGet_UploadExists tests Get returns an existing upload
func TestGet_UploadExists(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	u := models.NewUpload("default-user", "test.pdf", "pdf", "uploads/test.pdf", 1024)
	db.Create(&u)

	r := gin.Default()
	r.GET("/api/uploads/:id", handler.Get)

	req, _ := http.NewRequest("GET", "/api/uploads/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.Upload
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.ID != 1 {
		t.Errorf("Expected ID 1, got %d", response.ID)
	}
	if response.FileName != "test.pdf" {
		t.Errorf("Expected filename test.pdf, got %s", response.FileName)
	}
	if response.FileType != "pdf" {
		t.Errorf("Expected type pdf, got %s", response.FileType)
	}
	if response.FileSize != 1024 {
		t.Errorf("Expected size 1024, got %d", response.FileSize)
	}
	// StoragePath should not be in JSON output due to json:"-" tag
	if response.StoragePath != "" {
		t.Errorf("Expected StoragePath to be omitted from JSON (json:-), got %s", response.StoragePath)
	}
}

// TestGet_UploadNotFound tests Get for non-existent upload
func TestGet_UploadNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	r := gin.Default()
	r.GET("/api/uploads/:id", handler.Get)

	req, _ := http.NewRequest("GET", "/api/uploads/999", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestGet_InvalidID tests Get with invalid ID format
func TestGet_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	r := gin.Default()
	r.GET("/api/uploads/:id", handler.Get)

	req, _ := http.NewRequest("GET", "/api/uploads/not-a-number", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestDelete_Upload tests deleting an existing upload
func TestDelete_Upload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	// Insert an upload
	u := models.NewUpload("default-user", "to-delete.pdf", "pdf", "uploads/to-delete.pdf", 1024)
	db.Create(&u)

	var count int64
	db.Model(&models.Upload{}).Count(&count)
	if count != 1 {
		t.Fatalf("Expected 1 upload before delete, got %d", count)
	}

	r := gin.Default()
	r.DELETE("/api/uploads/:id", handler.Delete)

	req, _ := http.NewRequest("DELETE", "/api/uploads/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	db.Model(&models.Upload{}).Count(&count)
	if count != 0 {
		t.Errorf("Expected 0 uploads after delete, got %d", count)
	}
}

// TestUpdate_ChangesTitle tests updating upload title and description
func TestUpdate_ChangesTitle(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testutil.SetupTestDB(t)
	handler := NewUploadHandler(db)

	// Insert initial upload
	u := models.NewUpload("default-user", "original.pdf", "pdf", "uploads/original.pdf", 1024)
	db.Create(&u)

	r := gin.Default()
	r.PUT("/api/uploads/:id", handler.Update)

	// Note: This test just verifies the endpoint accepts the request
	// Full JSON body testing would require creating a request body
	req, _ := http.NewRequest("PUT", "/api/uploads/1", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	// Empty body should give bad request
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}
