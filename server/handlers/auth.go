// Package handlers 处理所有 HTTP 请求。
//
// AuthHandler 处理用户注册和登录认证。
package handlers

import (
	"net/http"
	"os"

	"golang.org/x/crypto/bcrypt"

	"my-quiz/async"
	"my-quiz/middleware"
	"my-quiz/models"
	"my-quiz/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthHandler 认证处理器（注册/登录）
type AuthHandler struct {
	db *gorm.DB
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// RegisterRequest 注册请求体（强制邮箱注册）
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6,max=50"`
	Email    string `json:"email" binding:"required,email,max=100"` // 必填，必须是有效邮箱格式
}

// LoginRequest 登录请求体
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// Register 用户注册
// @POST /api/auth/register
// @public 不需要认证
// 安全注意：密码在请求体中是明文，生产环境必须启用 HTTPS
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 安全：立即清除密码敏感信息，防止后续处理中意外泄露
	defer func() {
		req.Password = ""
	}()

	// 检查用户名是否已存在
	var existing models.User
	result := h.db.Where("username = ?", req.Username).First(&existing)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// bcrypt 哈希密码
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 创建用户（默认邮箱未验证）
	user := models.NewUser(req.Username, string(hash), req.Email)

	// 使用事务：创建用户 + 创建验证记录
	tx := h.db.Begin()
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 创建验证 token
	token := utils.RandomToken()
	verification := models.NewEmailVerification(user.ID, user.Email, token)
	if err := tx.Create(&verification).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create verification token"})
		return
	}

	tx.Commit()

	// 发送验证邮件（提交到 async 任务池，受 worker 数和队列容量约束）
	async.Submit(func() {
		baseURL := os.Getenv("APP_URL")
		if baseURL == "" {
			baseURL = "http://localhost:5173"
		}
		verifyURL := baseURL + "/verify-email?token=" + token

		if err := utils.SendVerificationEmail(user.Email, user.Username, verifyURL); err != nil {
			// 记录日志但不返回错误给用户
			println("Failed to send verification email:", err.Error())
		}
	})

	// 注册成功但返回提示需要验证邮箱（不自动登录）
	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please check your email to verify your account.",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// Login 用户登录
// @POST /api/auth/login
// @public 不需要认证
// 安全注意：密码在请求体中是明文，生产环境必须启用 HTTPS
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 安全：立即清除密码敏感信息，防止后续处理中意外泄露
	defer func() {
		req.Password = ""
	}()

	// 查找用户
	var user models.User
	result := h.db.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// 验证密码
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// 检查邮箱是否已验证
	if !user.EmailVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "Email not verified. Please check your inbox."})
		return
	}

	// 生成 JWT token
	token, err := middleware.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

// VerifyEmailRequest 邮箱验证请求
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// VerifyEmail 验证邮箱
// @POST /api/auth/verify-email
// @public 不需要认证
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找验证记录
	var verification models.EmailVerification
	result := h.db.Where("token = ?", req.Token).First(&verification)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid verification token"})
		return
	}

	// 检查是否过期
	if verification.IsExpired() {
		c.JSON(http.StatusGone, gin.H{"error": "Verification token expired"})
		return
	}

	// 更新用户邮箱验证状态
	if err := h.db.Model(&models.User{}).
		Where("id = ?", verification.UserID).
		Update("email_verified", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify email"})
		return
	}

	// 删除验证记录（已使用）
	h.db.Delete(&verification)

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

// ResendVerificationRequest 重发验证邮件请求
type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResendVerificationEmail 重发验证邮件
// @POST /api/auth/resend-verification
// @public 不需要认证
func (h *AuthHandler) ResendVerificationEmail(c *gin.Context) {
	var req ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找用户
	var user models.User
	result := h.db.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		// 不暴露用户是否存在，返回成功防止枚举
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a verification link has been sent"})
		return
	}

	// 检查是否已经验证
	if user.EmailVerified {
		c.JSON(http.StatusOK, gin.H{"message": "Email already verified"})
		return
	}

	// 删除旧的验证记录
	h.db.Where("user_id = ?", user.ID).Delete(&models.EmailVerification{})

	// 创建新的验证 token
	token := utils.RandomToken()
	verification := models.NewEmailVerification(user.ID, user.Email, token)
	if err := h.db.Create(&verification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create verification token"})
		return
	}

	// 提交到 async 任务池
	async.Submit(func() {
		baseURL := os.Getenv("APP_URL")
		if baseURL == "" {
			baseURL = "http://localhost:5173"
		}
		verifyURL := baseURL + "/verify-email?token=" + token

		if err := utils.SendVerificationEmail(user.Email, user.Username, verifyURL); err != nil {
			println("Failed to send verification email:", err.Error())
		}
	})

	c.JSON(http.StatusOK, gin.H{"message": "Verification email sent"})
}

// ========== 密码重置相关接口 ==========

// ForgotPasswordRequest 发送重置邮件请求
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPassword 发送密码重置邮件
// @POST /api/auth/forgot-password
// @public 不需要认证
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找用户
	var user models.User
	result := h.db.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		// 不暴露用户是否存在，返回成功防止枚举攻击
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent"})
		return
	}

	// 删除旧的重置记录
	h.db.Where("user_id = ?", user.ID).Delete(&models.PasswordReset{})

	// 创建新的重置 token
	token := utils.RandomToken()
	reset := models.NewPasswordReset(user.ID, user.Email, token)
	if err := h.db.Create(&reset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reset token"})
		return
	}

	// 提交到 async 任务池
	async.Submit(func() {
		baseURL := os.Getenv("APP_URL")
		if baseURL == "" {
			baseURL = "http://localhost:5173"
		}
		resetURL := baseURL + "/reset-password?token=" + token

		if err := utils.SendPasswordResetEmail(user.Email, user.Username, resetURL); err != nil {
			println("Failed to send password reset email:", err.Error())
		}
	})

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent"})
}

// ResetPasswordRequest 重置密码请求
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6,max=50"`
}

// ResetPassword 重置密码
// @POST /api/auth/reset-password
// @public 不需要认证
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 安全：立即清除密码敏感信息
	defer func() {
		req.NewPassword = ""
	}()

	// 查找重置记录
	var reset models.PasswordReset
	result := h.db.Where("token = ?", req.Token).First(&reset)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid reset token"})
		return
	}

	// 检查 token 是否有效（未使用且未过期）
	if !reset.IsValid() {
		c.JSON(http.StatusGone, gin.H{"error": "Reset token expired or already used"})
		return
	}

	// bcrypt 哈希新密码
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 使用事务：更新密码 + 标记 token 已使用
	tx := h.db.Begin()

	// 更新用户密码
	if err := tx.Model(&models.User{}).
		Where("id = ?", reset.UserID).
		Update("password", string(hash)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset password"})
		return
	}

	// 标记 token 已使用
	reset.MarkUsed()
	if err := tx.Save(&reset).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update token status"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
