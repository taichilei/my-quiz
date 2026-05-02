// Package handlers 处理所有 HTTP 请求。
//
// UserHandler 处理当前登录用户信息查询和更新。
package handlers

import (
	"net/http"
	"os"
	"time"

	"my-quiz/async"
	"my-quiz/middleware"
	"my-quiz/models"
	"my-quiz/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserHandler 用户信息处理器
type UserHandler struct {
	db *gorm.DB
}

// NewUserHandler 创建用户信息处理器
func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// UpdateProfileRequest 更新个人信息请求
type UpdateProfileRequest struct {
	Email string `json:"email" binding:"omitempty,email,max=100"`
}

// GetMe 获取当前登录用户信息
// @GET /api/user/me
// @private 需要 JWT 认证
func (h *UserHandler) GetMe(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)

	var user models.User
	if err := h.db.Select("id, username, email, created_at, updated_at").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateMe 更新当前登录用户信息（目前只支持更新邮箱）
// @PUT /api/user/me
// @private 需要 JWT 认证
func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 邮箱是否真的变了，决定后面要不要触发重新验证流程
	emailChanged := req.Email != "" && req.Email != user.Email
	if emailChanged {
		user.Email = req.Email
		user.EmailVerified = false
	}

	user.UpdatedAt = time.Now().UnixMilli()
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 邮箱变了就重发验证邮件：清掉旧 token、新建一条、异步投递
	if emailChanged {
		h.db.Where("user_id = ?", user.ID).Delete(&models.EmailVerification{})

		token := utils.RandomToken()
		verification := models.NewEmailVerification(user.ID, user.Email, token)
		if err := h.db.Create(&verification).Error; err != nil {
			// token 创建失败不影响响应：用户邮箱已经更新成功，前端可引导走"重发验证邮件"
			println("Failed to create verification token after email change:", err.Error())
		} else {
			email := user.Email
			username := user.Username
			async.Submit(func() {
				baseURL := os.Getenv("APP_URL")
				if baseURL == "" {
					baseURL = "http://localhost:5173"
				}
				verifyURL := baseURL + "/verify-email?token=" + token

				if err := utils.SendVerificationEmail(email, username, verifyURL); err != nil {
					println("Failed to send verification email after email change:", err.Error())
				}
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}
