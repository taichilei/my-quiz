// Package handlers 单元测试
//
// UserHandler 测试：获取/更新用户信息接口测试
package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"my-quiz/middleware"

	"github.com/gin-gonic/gin"
)

// TestGetMe_Success 测试带有效token获取用户信息
func TestGetMe_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	authHandler := NewAuthHandler(db)
	userHandler := NewUserHandler(db)

	// 先注册用户
	r := gin.Default()
	r.POST("/api/auth/register", authHandler.Register)
	r.GET("/api/user/me", middleware.JWTAuth(), userHandler.GetMe)

	reqBody := `{"username":"testuser","password":"123456"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	var registerResp AuthResponse
	json.Unmarshal(w.Body.Bytes(), &registerResp)

	// 用返回的token获取用户信息
	req2, _ := http.NewRequest("GET", "/api/user/me", nil)
	req2.Header.Set("Authorization", "Bearer "+registerResp.Token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Errorf("Expected status %d for GetMe with valid token, got %d, body: %s", http.StatusOK, w2.Code, w2.Body.String())
	}
}

// TestGetMe_NoToken 测试不带token访问受保护接口
func TestGetMe_NoToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewUserHandler(db)

	r := gin.Default()
	r.GET("/api/user/me", middleware.JWTAuth(), handler.GetMe)

	req, _ := http.NewRequest("GET", "/api/user/me", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for GetMe without token, got %d", http.StatusUnauthorized, w.Code)
	}
}

// TestGetMe_InvalidToken 测试带无效token
func TestGetMe_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewUserHandler(db)

	r := gin.Default()
	r.GET("/api/user/me", middleware.JWTAuth(), handler.GetMe)

	req, _ := http.NewRequest("GET", "/api/user/me", nil)
	req.Header.Set("Authorization", "Bearer invalid-token-here")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for GetMe with invalid token, got %d", http.StatusUnauthorized, w.Code)
	}
}

// TestUpdateMe_Success 测试正常更新用户邮箱
func TestUpdateMe_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	authHandler := NewAuthHandler(db)
	userHandler := NewUserHandler(db)

	// 先注册用户（使用独立的用户名避免测试冲突）
	r := gin.Default()
	r.POST("/api/auth/register", authHandler.Register)
	r.PUT("/api/user/me", middleware.JWTAuth(), userHandler.UpdateMe)

	reqBody := `{"username":"updateuser","password":"123456"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	var registerResp AuthResponse
	json.Unmarshal(w.Body.Bytes(), &registerResp)

	// 更新邮箱
	updateReqBody := `{"email":"updated@example.com"}`
	req2, _ := http.NewRequest("PUT", "/api/user/me", bytes.NewBufferString(updateReqBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+registerResp.Token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Errorf("Expected status %d for UpdateMe, got %d, body: %s", http.StatusOK, w2.Code, w2.Body.String())
	}
}
