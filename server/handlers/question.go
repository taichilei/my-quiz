// Package handlers 实现所有 HTTP API 处理函数.
//
// 每个资源（题目、记录、会话）对应一个 Handler，处理请求参数，调用数据库，返回 JSON 响应。
package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// QuestionHandler 处理题目相关的 HTTP 请求.
type QuestionHandler struct {
	db *gorm.DB
}

// NewQuestionHandler 创建一个新的 QuestionHandler.
func NewQuestionHandler(db *gorm.DB) *QuestionHandler {
	return &QuestionHandler{
		db: db,
	}
}

// GetQuestions 获取题目列表
// Supports filtering by exam, year, subject, type, tag
func (h *QuestionHandler) GetQuestions(c *gin.Context) {
	var questions []models.Question

	query := h.db.Preload("Exam").Model(&models.Question{})
	query = query.Joins("LEFT JOIN exams ON exams.id = questions.exam_id")

	// 可选参数：exam (name), year, subject, type, tag
	if examName := c.Query("exam"); examName != "" {
		query = query.Where("exams.name = ?", examName)
	}
	if year := c.Query("year"); year != "" {
		query = query.Where("exams.year = ?", year)
	}
	if subject := c.Query("subject"); subject != "" {
		query = query.Where("exams.subject = ?", subject)
	}
	if qtype := c.Query("type"); qtype != "" {
		query = query.Where("questions.type = ?", qtype)
	}
	if tag := c.Query("tag"); tag != "" {
		query = query.Where("? = ANY (jsonb_array_elements_text(questions.tags))", tag)
	}

	query = query.Order("exams.name, questions.exam_order ASC")

	if err := query.Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if questions == nil {
		questions = []models.Question{}
	}

	c.JSON(http.StatusOK, questions)
}

// GetQuestion 获取单道题目
func (h *QuestionHandler) GetQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var q models.Question
	if err := h.db.Preload("Exam").First(&q, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, q)
}

// CreateQuestion 创建题目
//
// If the request includes an embedded exam object, we automatically find or create
// the exam record and associate it with this question.
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	question = models.NewQuestion(question)

	// Handle embedded exam creation/upsert if provided
	if question.Exam != nil {
		exam := question.Exam
		var existing models.Exam
		result := h.db.Where(models.Exam{
			Name:    exam.Name,
			Year:    exam.Year,
			Subject: exam.Subject,
			Part:    exam.Part,
		}).FirstOrCreate(&existing)

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find or create exam: " + result.Error.Error()})
			return
		}

		question.ExamID = &existing.ID
		question.Exam = &existing
	}

	if err := h.db.Create(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with exam data for response
	h.db.Preload("Exam").First(&question, question.ID)

	c.JSON(http.StatusCreated, question)
}

// UpdateQuestion 更新题目
//
// If an embedded exam is provided, we update the exam association.
func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input models.Question
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var question models.Question
	if err := h.db.Preload("Exam").First(&question, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// Update basic fields
	question.Type = input.Type
	question.Content = input.Content
	question.Options = input.Options
	question.Answer = input.Answer
	question.Explanation = input.Explanation
	question.Difficulty = input.Difficulty
	question.Tags = input.Tags
	question.Images = input.Images
	question.UploadID = input.UploadID
	question.PageNumber = input.PageNumber
	question.ExamOrder = input.ExamOrder
	question.UpdatedAt = time.Now().UnixMilli()

	// Handle exam update if provided
	if input.Exam != nil {
		exam := input.Exam
		var existing models.Exam
		result := h.db.Where(models.Exam{
			Name:    exam.Name,
			Year:    exam.Year,
			Subject: exam.Subject,
			Part:    exam.Part,
		}).FirstOrCreate(&existing)

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find or create exam: " + result.Error.Error()})
			return
		}

		question.ExamID = &existing.ID
		question.Exam = &existing
	}

	if err := h.db.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// DeleteQuestion 删除题目
func (h *QuestionHandler) DeleteQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.db.Delete(&models.Question{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GetExams 获取试卷列表（分组统计）
// Deprecated: Use GET /api/exams handled by ExamHandler instead.
// This is kept for backward compatibility.
func (h *QuestionHandler) GetExams(c *gin.Context) {
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
