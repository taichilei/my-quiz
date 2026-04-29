// Package handlers 单元测试
//
// AuthHandler 测试：注册和登录接口测试
package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// TestRegister_Success 测试正常注册
func TestRegister_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)

	reqBody := `{"username":"testuser","password":"123456","email":"test@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d, body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var response AuthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.Token == "" {
		t.Error("Expected non-empty token")
	}

	if response.User.Username != "testuser" {
		t.Errorf("Expected username 'testuser', got '%s'", response.User.Username)
	}
}

// TestRegister_DuplicateUsername 测试用户名重复注册
func TestRegister_DuplicateUsername(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)

	// 第一次注册
	reqBody1 := `{"username":"testuser","password":"123456"}`
	req1, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("Expected first registration to succeed, got %d", w1.Code)
	}

	// 第二次重复注册
	reqBody2 := `{"username":"testuser","password":"123456"}`
	req2, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusConflict {
		t.Errorf("Expected status %d for duplicate username, got %d", http.StatusConflict, w2.Code)
	}
}

// TestRegister_InvalidRequest 测试请求参数不合法
func TestRegister_InvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)

	// 缺少必填字段
	reqBody := `{"username":"testuser"}` // 缺少 password
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for invalid request, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestLogin_Success 测试正常登录
func TestLogin_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)
	r.POST("/api/auth/login", handler.Login)

	// 先注册
	reqBody := `{"username":"testuser","password":"123456"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	// 再登录
	loginReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody))
	loginReq.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, loginReq)

	if w2.Code != http.StatusOK {
		t.Errorf("Expected login to succeed with status %d, got %d, body: %s", http.StatusOK, w2.Code, w2.Body.String())
	}

	var response AuthResponse
	err := json.Unmarshal(w2.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.Token == "" {
		t.Error("Expected non-empty token in login response")
	}
}

// TestLogin_WrongPassword 测试密码错误
func TestLogin_WrongPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)
	r.POST("/api/auth/login", handler.Login)

	// 先注册
	reqBody1 := `{"username":"testuser","password":"123456"}`
	req1, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	// 用错误密码登录
	reqBody2 := `{"username":"testuser","password":"wrongpassword"}`
	req2, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for wrong password, got %d", http.StatusUnauthorized, w2.Code)
	}
}

// TestLogin_UserNotFound 测试用户不存在
func TestLogin_UserNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/login", handler.Login)

	// 使用不存在的用户登录
	reqBody := `{"username":"nonexistent","password":"123456"}`
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for non-existent user, got %d", http.StatusUnauthorized, w.Code)
	}
}
