// Package handlers 实现所有 HTTP API 处理函数。
//
// ExamHandler 处理考试相关的增删改查操作。
package handlers

import (
	"net/http"
	"strconv"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ExamHandler 处理考试相关的 HTTP 请求。
type ExamHandler struct {
	db *gorm.DB
}

// NewExamHandler 创建一个新的 ExamHandler。
func NewExamHandler(db *gorm.DB) *ExamHandler {
	return &ExamHandler{
		db: db,
	}
}

// ListExams 获取考试列表（带题目计数）
// GET /api/exams
func (h *ExamHandler) ListExams(c *gin.Context) {
	var exams []models.ExamInfo

	err := h.db.Raw(`
		SELECT e.id, e.name, e.year, e.subject, e.part, COUNT(q.id) as count
		FROM exams e
		LEFT JOIN questions q ON q.exam_id = e.id
		GROUP BY e.id
		ORDER BY e.name, e.year DESC
	`).Scan(&exams).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if exams == nil {
		exams = []models.ExamInfo{}
	}

	c.JSON(http.StatusOK, exams)
}

// GetExam 获取单个考试信息
// GET /api/exams/:id
func (h *ExamHandler) GetExam(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var exam models.Exam
	if err := h.db.First(&exam, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, exam)
}

// CreateExam 创建考试
// POST /api/exams
func (h *ExamHandler) CreateExam(c *gin.Context) {
	var exam models.Exam
	if err := c.ShouldBindJSON(&exam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now().UnixMilli()
	exam.CreatedAt = now
	exam.UpdatedAt = now

	// 检查是否已存在相同的考试
	var existing models.Exam
	result := h.db.Where(models.Exam{
		Name:    exam.Name,
		Year:    exam.Year,
		Subject: exam.Subject,
		Part:    exam.Part,
	}).First(&existing)

	if result.RowsAffected > 0 {
		// 已存在，返回冲突
		c.JSON(http.StatusConflict, gin.H{"error": "exam already exists with same name, year, subject and part", "existingId": existing.ID})
		return
	}

	if err := h.db.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, exam)
}

// UpdateExam 更新考试
// PUT /api/exams/:id
func (h *ExamHandler) UpdateExam(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input models.Exam
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exam models.Exam
	if err := h.db.First(&exam, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 更新字段
	exam.Name = input.Name
	exam.Year = input.Year
	exam.Subject = input.Subject
	exam.Part = input.Part
	exam.UpdatedAt = time.Now().UnixMilli()

	// 检查唯一性：是否有其他考试有相同的组合
	var existing models.Exam
	result := h.db.Where("name = ? AND year = ? AND subject = ? AND part = ? AND id != ?",
		input.Name, input.Year, input.Subject, input.Part, id).First(&existing)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "another exam already exists with same name, year, subject and part"})
		return
	}

	if err := h.db.Save(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, exam)
}

// DeleteExam 删除考试（级联删除所有关联题目，由数据库 ON DELETE CASCADE 处理）
// DELETE /api/exams/:id
func (h *ExamHandler) DeleteExam(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var exam models.Exam
	if err := h.db.First(&exam, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if err := h.db.Delete(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
