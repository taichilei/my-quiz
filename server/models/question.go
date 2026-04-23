package models

import "time"

// Question 题目
type Question struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // single, multiple, judge
	Content     string    `json:"content"`
	Options     []string  `json:"options"`
	Answer      string    `json:"answer"`
	Explanation string    `json:"explanation"`
	Difficulty  int       `json:"difficulty"`
	Tags        []string  `json:"tags"`
	Exam        Exam      `json:"exam"`
	Images      []string  `json:"images"`
	CreatedAt   int64     `json:"createdAt"`
	UpdatedAt   int64     `json:"updatedAt"`
}

// Exam 试卷信息
type Exam struct {
	Name    string `json:"name"`
	Year    int    `json:"year"`
	Subject string `json:"subject"`
	Part    string `json:"part"`
	Order   int    `json:"order"`
}

// AnswerRecord 答题记录
type AnswerRecord struct {
	ID          int    `json:"id"`
	UserID      string `json:"userId"`
	QuestionID  string `json:"questionId"`
	UserAnswer  string `json:"userAnswer"`
	IsCorrect   bool   `json:"isCorrect"`
	TimeSpent   int    `json:"timeSpent"`
	AnsweredAt  int64  `json:"answeredAt"`
}

// ExamInfo 试卷摘要
type ExamInfo struct {
	Name    string `json:"name"`
	Year    int    `json:"year"`
	Subject string `json:"subject"`
	Part    string `json:"part"`
	Count   int    `json:"count"`
}

// NewQuestion 创建新题目
func NewQuestion(q Question) Question {
	now := time.Now().UnixMilli()
	q.CreatedAt = now
	q.UpdatedAt = now
	return q
}
