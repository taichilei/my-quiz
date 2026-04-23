package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
)

type QuestionHandler struct {
	db *sql.DB
}

func NewQuestionHandler(db *sql.DB) *QuestionHandler {
	return &QuestionHandler{
		db: db,
	}
}

// GetQuestions 获取题目列表
func (h *QuestionHandler) GetQuestions(c *gin.Context) {
	// 构建查询
	query := "SELECT id, type, content, options, answer, explanation, difficulty, tags, exam, images, created_at, updated_at FROM questions WHERE 1=1"
	var args []interface{}
	paramIndex := 1

	// 可选参数：exam, year, subject, type, tag
	if exam := c.Query("exam"); exam != "" {
		query += " AND (exam->>'name') = $" + strconv.Itoa(paramIndex)
		args = append(args, exam)
		paramIndex++
	}
	if year := c.Query("year"); year != "" {
		query += " AND (exam->>'year') = $" + strconv.Itoa(paramIndex)
		args = append(args, year)
		paramIndex++
	}
	if subject := c.Query("subject"); subject != "" {
		query += " AND (exam->>'subject') = $" + strconv.Itoa(paramIndex)
		args = append(args, subject)
		paramIndex++
	}
	if qtype := c.Query("type"); qtype != "" {
		query += " AND type = $" + strconv.Itoa(paramIndex)
		args = append(args, qtype)
		paramIndex++
	}
	if tag := c.Query("tag"); tag != "" {
		query += " AND $" + strconv.Itoa(paramIndex) + " = ANY (SELECT jsonb_array_elements_text(tags))"
		args = append(args, tag)
		paramIndex++
	}

	query += " ORDER BY (exam->>'name'), (exam->>'order') ASC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		var optionsJSON, tagsJSON, examJSON, imagesJSON []byte

		err := rows.Scan(
			&q.ID,
			&q.Type,
			&q.Content,
			&optionsJSON,
			&q.Answer,
			&q.Explanation,
			&q.Difficulty,
			&tagsJSON,
			&examJSON,
			&imagesJSON,
			&q.CreatedAt,
			&q.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if len(optionsJSON) > 0 {
			json.Unmarshal(optionsJSON, &q.Options)
		}
		if len(tagsJSON) > 0 {
			json.Unmarshal(tagsJSON, &q.Tags)
		}
		if len(examJSON) > 0 {
			json.Unmarshal(examJSON, &q.Exam)
		}
		if len(imagesJSON) > 0 {
			json.Unmarshal(imagesJSON, &q.Images)
		}

		questions = append(questions, q)
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
	var optionsJSON, tagsJSON, examJSON, imagesJSON []byte

	err = h.db.QueryRow(`
		SELECT id, type, content, options, answer, explanation, difficulty, tags, exam, images, created_at, updated_at
		FROM questions WHERE id = $1
	`, id).Scan(
		&q.ID,
		&q.Type,
		&q.Content,
		&optionsJSON,
		&q.Answer,
		&q.Explanation,
		&q.Difficulty,
		&tagsJSON,
		&examJSON,
		&imagesJSON,
		&q.CreatedAt,
		&q.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(optionsJSON) > 0 {
		json.Unmarshal(optionsJSON, &q.Options)
	}
	if len(tagsJSON) > 0 {
		json.Unmarshal(tagsJSON, &q.Tags)
	}
	if len(examJSON) > 0 {
		json.Unmarshal(examJSON, &q.Exam)
	}
	if len(imagesJSON) > 0 {
		json.Unmarshal(imagesJSON, &q.Images)
	}

	c.JSON(http.StatusOK, q)
}

// CreateQuestion 创建题目
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	question = models.NewQuestion(question)

	// 序列化 JSON 字段
	optionsJSON, _ := json.Marshal(question.Options)
	tagsJSON, _ := json.Marshal(question.Tags)
	examJSON, _ := json.Marshal(question.Exam)
	imagesJSON, _ := json.Marshal(question.Images)

	var questionID int
	err := h.db.QueryRow(`
		INSERT INTO questions (type, content, options, answer, explanation, difficulty, tags, exam, images, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`,
		question.Type,
		question.Content,
		optionsJSON,
		question.Answer,
		question.Explanation,
		question.Difficulty,
		tagsJSON,
		examJSON,
		imagesJSON,
		question.CreatedAt,
		question.UpdatedAt,
	).Scan(&questionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	question.ID = strconv.Itoa(questionID)
	c.JSON(http.StatusCreated, question)
}

// UpdateQuestion 更新题目
func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	question.UpdatedAt = time.Now().UnixMilli()

	optionsJSON, _ := json.Marshal(question.Options)
	tagsJSON, _ := json.Marshal(question.Tags)
	examJSON, _ := json.Marshal(question.Exam)
	imagesJSON, _ := json.Marshal(question.Images)

	_, err = h.db.Exec(`
		UPDATE questions
		SET type = $1, content = $2, options = $3, answer = $4, explanation = $5,
			difficulty = $6, tags = $7, exam = $8, images = $9, updated_at = $10
		WHERE id = $11
	`,
		question.Type,
		question.Content,
		optionsJSON,
		question.Answer,
		question.Explanation,
		question.Difficulty,
		tagsJSON,
		examJSON,
		imagesJSON,
		question.UpdatedAt,
		id,
	)

	if err != nil {
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

	_, err = h.db.Exec("DELETE FROM questions WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GetExams 获取试卷列表（分组统计）
func (h *QuestionHandler) GetExams(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT
			exam->>'name' as name,
			CAST(exam->>'year' AS INTEGER) as year,
			exam->>'subject' as subject,
			exam->>'part' as part,
			COUNT(*) as count
		FROM questions
		WHERE exam IS NOT NULL AND (exam->>'name') IS NOT NULL
		GROUP BY exam->>'name', CAST(exam->>'year' AS INTEGER), exam->>'subject', exam->>'part'
		ORDER BY name, year DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var exams []models.ExamInfo
	for rows.Next() {
		var e models.ExamInfo
		err := rows.Scan(&e.Name, &e.Year, &e.Subject, &e.Part, &e.Count)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		exams = append(exams, e)
	}

	if exams == nil {
		exams = []models.ExamInfo{}
	}

	c.JSON(http.StatusOK, exams)
}
