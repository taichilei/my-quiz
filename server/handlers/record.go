package handlers

import (
	"net/http"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RecordHandler 处理答题记录相关的 HTTP 请求。
type RecordHandler struct {
	db *gorm.DB
}

// NewRecordHandler 创建一个新的 RecordHandler。
func NewRecordHandler(db *gorm.DB) *RecordHandler {
	return &RecordHandler{
		db: db,
	}
}

// CreateRecord 保存答题记录
func (h *RecordHandler) CreateRecord(c *gin.Context) {
	var record models.AnswerRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record.AnsweredAt = time.Now().UnixMilli()

	if err := h.db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// GetRecords 获取用户答题记录
func (h *RecordHandler) GetRecords(c *gin.Context) {
	userID := c.Param("userId")

	var records []models.AnswerRecord
	query := h.db.Where("user_id = ?", userID)

	if questionID := c.Query("questionId"); questionID != "" {
		query = query.Where("question_id = ?", questionID)
	}

	if err := query.Order("answered_at DESC").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if records == nil {
		records = []models.AnswerRecord{}
	}

	c.JSON(http.StatusOK, records)
}

// GetStats 获取用户答题统计
func (h *RecordHandler) GetStats(c *gin.Context) {
	userID := c.Param("userId")

	var total int64
	var correct int64

	h.db.Model(&models.AnswerRecord{}).Where("user_id = ?", userID).Count(&total)
	h.db.Model(&models.AnswerRecord{}).Where("user_id = ? AND is_correct = ?", userID, true).Count(&correct)

	rate := 0.0
	if total > 0 {
		rate = float64(correct) / float64(total) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"total":   total,
		"correct": correct,
		"rate":    rate,
	})
}
