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
	"my-quiz/models"

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
	r.POST("/api/auth/login", authHandler.Login)
	r.GET("/api/user/me", middleware.JWTAuth(), userHandler.GetMe)

	reqBody := `{"username":"testuser","password":"123456","email":"test@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	// 手动标记邮箱为已验证（模拟用户点击验证链接）
	db.Model(&models.User{}).Where("username = ?", "testuser").Update("email_verified", true)

	// 登录获取 token
	loginReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	if loginW.Code != http.StatusOK {
		t.Fatalf("Expected login to succeed, got %d, body: %s", loginW.Code, loginW.Body.String())
	}

	var loginResp AuthResponse
	json.Unmarshal(loginW.Body.Bytes(), &loginResp)

	// 用返回的token获取用户信息
	req2, _ := http.NewRequest("GET", "/api/user/me", nil)
	req2.Header.Set("Authorization", "Bearer "+loginResp.Token)
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
	r.POST("/api/auth/login", authHandler.Login)
	r.PUT("/api/user/me", middleware.JWTAuth(), userHandler.UpdateMe)

	reqBody := `{"username":"updateuser","password":"123456","email":"update@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	// 手动标记邮箱为已验证
	db.Model(&models.User{}).Where("username = ?", "updateuser").Update("email_verified", true)

	// 登录获取 token
	loginReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	if loginW.Code != http.StatusOK {
		t.Fatalf("Expected login to succeed, got %d, body: %s", loginW.Code, loginW.Body.String())
	}

	var loginResp AuthResponse
	json.Unmarshal(loginW.Body.Bytes(), &loginResp)

	// 更新邮箱
	updateReqBody := `{"email":"updated@example.com"}`
	req2, _ := http.NewRequest("PUT", "/api/user/me", bytes.NewBufferString(updateReqBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Errorf("Expected status %d for UpdateMe, got %d, body: %s", http.StatusOK, w2.Code, w2.Body.String())
	}

	// 邮箱变更后：用户邮箱已更新、EmailVerified 重置为 false、生成了一条 EmailVerification 记录
	var updated models.User
	if err := db.Where("username = ?", "updateuser").First(&updated).Error; err != nil {
		t.Fatalf("Failed to load updated user: %v", err)
	}
	if updated.Email != "updated@example.com" {
		t.Errorf("Expected email updated@example.com, got %s", updated.Email)
	}
	if updated.EmailVerified {
		t.Errorf("Expected EmailVerified to be reset to false after email change")
	}

	var verifications []models.EmailVerification
	if err := db.Where("user_id = ?", updated.ID).Find(&verifications).Error; err != nil {
		t.Fatalf("Failed to query verifications: %v", err)
	}
	if len(verifications) != 1 {
		t.Errorf("Expected 1 EmailVerification record after email change, got %d", len(verifications))
	} else if verifications[0].Email != "updated@example.com" {
		t.Errorf("Expected verification token bound to new email, got %s", verifications[0].Email)
	}
}

// TestUpdateMe_EmailUnchanged 测试请求体邮箱与当前邮箱相同时不重发验证邮件
func TestUpdateMe_EmailUnchanged(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	authHandler := NewAuthHandler(db)
	userHandler := NewUserHandler(db)

	r := gin.Default()
	r.POST("/api/auth/register", authHandler.Register)
	r.POST("/api/auth/login", authHandler.Login)
	r.PUT("/api/user/me", middleware.JWTAuth(), userHandler.UpdateMe)

	reqBody := `{"username":"sameuser","password":"123456","email":"same@example.com"}`
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected registration to succeed, got %d", w.Code)
	}

	// 标记已验证 + 清掉注册时自动生成的验证记录，便于后续断言"没新增"
	db.Model(&models.User{}).Where("username = ?", "sameuser").Update("email_verified", true)
	db.Where("email = ?", "same@example.com").Delete(&models.EmailVerification{})

	loginReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBufferString(reqBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginW := httptest.NewRecorder()
	r.ServeHTTP(loginW, loginReq)

	var loginResp AuthResponse
	json.Unmarshal(loginW.Body.Bytes(), &loginResp)

	// 提交相同邮箱
	updateReqBody := `{"email":"same@example.com"}`
	req2, _ := http.NewRequest("PUT", "/api/user/me", bytes.NewBufferString(updateReqBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("Expected status %d for UpdateMe, got %d, body: %s", http.StatusOK, w2.Code, w2.Body.String())
	}

	// EmailVerified 不应被重置；不应新增 EmailVerification 记录
	var unchanged models.User
	if err := db.Where("username = ?", "sameuser").First(&unchanged).Error; err != nil {
		t.Fatalf("Failed to load user: %v", err)
	}
	if !unchanged.EmailVerified {
		t.Errorf("Expected EmailVerified to remain true when email is unchanged")
	}

	var count int64
	db.Model(&models.EmailVerification{}).Where("user_id = ?", unchanged.ID).Count(&count)
	if count != 0 {
		t.Errorf("Expected no EmailVerification rows when email unchanged, got %d", count)
	}
}
