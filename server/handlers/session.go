package handlers

import (
	"errors"
	"net/http"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SessionHandler 处理未完成刷题会话相关的 HTTP 请求，用于跨设备进度同步。
type SessionHandler struct {
	db *gorm.DB
}

// NewSessionHandler 创建一个新的 SessionHandler。
func NewSessionHandler(db *gorm.DB) *SessionHandler {
	return &SessionHandler{
		db: db,
	}
}

// GetCurrent 获取当前用户未完成的刷题会话
// GET /api/session/current
func (h *SessionHandler) GetCurrent(c *gin.Context) {
	// 固定用户 ID 为 default-user（后续可扩展为从请求中获取）
	userID := "default-user"

	var session models.QuizSession
	err := h.db.Where("user_id = ?", userID).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "no active session"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, session)
}

// Upsert 创建或更新刷题会话
// POST /api/session
func (h *SessionHandler) Upsert(c *gin.Context) {
	userID := "default-user"

	var session models.QuizSession
	if err := c.ShouldBindJSON(&session); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now().UnixMilli()
	session.UserID = userID

	// 检查是否已存在会话
	var existing models.QuizSession
	err := h.db.Where("user_id = ?", userID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 新建
		session.CreatedAt = now
		session.UpdatedAt = now
		if err := h.db.Create(&session).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, session)
	} else if err == nil {
		// 更新现有会话
		existing.QuizTitle = session.QuizTitle
		existing.QuestionIDs = session.QuestionIDs
		existing.CurrentIndex = session.CurrentIndex
		existing.SelectedAnswer = session.SelectedAnswer
		existing.ShowResult = session.ShowResult
		existing.CorrectCount = session.CorrectCount
		existing.UpdatedAt = now
		if err := h.db.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, existing)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

// DeleteCurrent 删除当前用户未完成的刷题会话
// DELETE /api/session/current
func (h *SessionHandler) DeleteCurrent(c *gin.Context) {
	userID := "default-user"

	h.db.Where("user_id = ?", userID).Delete(&models.QuizSession{})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
