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

	"my-quiz/models"

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

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["message"] == nil {
		t.Error("Expected message in response")
	}

	// 验证用户创建成功，且邮箱未验证
	var user models.User
	db.Where("username = ?", "testuser").First(&user)
	if user.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got '%s'", user.Email)
	}
	if user.EmailVerified {
		t.Error("Expected email should not be verified after registration")
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
	reqBody1 := `{"username":"testuser","password":"123456","email":"test@example.com"}`
	req1, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("Expected first registration to succeed, got %d", w1.Code)
	}

	// 第二次重复注册
	reqBody2 := `{"username":"testuser","password":"123456","email":"test@example.com"}`
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
	reqBody := `{"username":"testuser","password":"123456","email":"test@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	// 手动标记邮箱已验证（模拟用户点击验证链接）
	db.Model(&models.User{}).Where("username = ?", "testuser").Update("email_verified", true)

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

// TestLogin_UnverifiedEmail 测试未验证邮箱不能登录
func TestLogin_UnverifiedEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)
	r.POST("/api/auth/login", handler.Login)

	// 先注册
	reqBody := `{"username":"testuser","password":"123456","email":"test@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	// 尝试登录（邮箱未验证）
	loginReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody))
	loginReq.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, loginReq)

	if w2.Code != http.StatusForbidden {
		t.Errorf("Expected status %d for unverified email, got %d", http.StatusForbidden, w2.Code)
	}
}

// TestVerifyEmail_Success 测试邮箱验证成功
func TestVerifyEmail_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", handler.Register)
	r.POST("/api/auth/verify-email", handler.VerifyEmail)

	// 先注册
	reqBody := `{"username":"testuser","password":"123456","email":"test@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// 获取验证 token
	var verification models.EmailVerification
	db.Where("email = ?", "test@example.com").First(&verification)
	if verification.Token == "" {
		t.Fatal("Expected verification token to be created")
	}

	// 验证邮箱
	verifyReqBody := `{"token":"` + verification.Token + `"}`
	verifyReq, _ := http.NewRequest("POST", "/api/auth/verify-email", bytes.NewBufferString(verifyReqBody))
	verifyReq.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, verifyReq)

	if w2.Code != http.StatusOK {
		t.Errorf("Expected status %d for successful verification, got %d, body: %s", http.StatusOK, w2.Code, w2.Body.String())
	}

	// 检查用户是否已验证
	var user models.User
	db.Where("username = ?", "testuser").First(&user)
	if !user.EmailVerified {
		t.Error("Expected email to be verified")
	}
}
