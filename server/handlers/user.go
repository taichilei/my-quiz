// Package handlers 处理所有 HTTP 请求。
//
// UserHandler 处理当前登录用户信息查询和更新。
package handlers

import (
	"net/http"
	"time"

	"my-quiz/middleware"
	"my-quiz/models"

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
	Email string `json:"email"`
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

	// 更新邮箱
	if req.Email != "" {
		user.Email = &req.Email
	} else {
		user.Email = nil
	}

	user.UpdatedAt = time.Now().UnixMilli()
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}
