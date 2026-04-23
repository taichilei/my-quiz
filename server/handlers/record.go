package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
)

type RecordHandler struct {
	db *sql.DB
}

func NewRecordHandler(db *sql.DB) *RecordHandler {
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

	var recordID int
	err := h.db.QueryRow(`
		INSERT INTO records (user_id, question_id, user_answer, is_correct, time_spent, answered_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`,
		record.UserID,
		record.QuestionID,
		record.UserAnswer,
		record.IsCorrect,
		record.TimeSpent,
		record.AnsweredAt,
	).Scan(&recordID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	record.ID = recordID
	c.JSON(http.StatusCreated, record)
}

// GetRecords 获取用户答题记录
func (h *RecordHandler) GetRecords(c *gin.Context) {
	userID := c.Param("userId")

	query := "SELECT id, user_id, question_id, user_answer, is_correct, time_spent, answered_at FROM records WHERE user_id = $1"
	var args []interface{}
	args = append(args, userID)

	if questionID := c.Query("questionId"); questionID != "" {
		query += " AND question_id = $2"
		args = append(args, questionID)
	}

	query += " ORDER BY answered_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var records []models.AnswerRecord
	for rows.Next() {
		var r models.AnswerRecord
		err := rows.Scan(
			&r.ID,
			&r.UserID,
			&r.QuestionID,
			&r.UserAnswer,
			&r.IsCorrect,
			&r.TimeSpent,
			&r.AnsweredAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		records = append(records, r)
	}

	if records == nil {
		records = []models.AnswerRecord{}
	}

	c.JSON(http.StatusOK, records)
}

// GetStats 获取用户答题统计
func (h *RecordHandler) GetStats(c *gin.Context) {
	userID := c.Param("userId")

	var total, correct int
	err := h.db.QueryRow(`
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN is_correct THEN 1 END) as correct
		FROM records WHERE user_id = $1
	`, userID).Scan(&total, &correct)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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
