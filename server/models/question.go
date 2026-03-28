package models

import "time"

// Question 题目
type Question struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	Type        string    `json:"type" bson:"type"` // single, multiple, judge
	Content     string    `json:"content" bson:"content"`
	Options     []string  `json:"options" bson:"options"`
	Answer      string    `json:"answer" bson:"answer"`
	Explanation string    `json:"explanation" bson:"explanation,omitempty"`
	Difficulty  int       `json:"difficulty" bson:"difficulty"`
	Tags        []string  `json:"tags" bson:"tags,omitempty"`
	Exam        Exam      `json:"exam" bson:"exam,omitempty"`
	Images      []string  `json:"images" bson:"images,omitempty"`
	CreatedAt   int64     `json:"createdAt" bson:"createdAt"`
	UpdatedAt   int64     `json:"updatedAt" bson:"updatedAt"`
}

// Exam 试卷信息
type Exam struct {
	Name    string `json:"name" bson:"name"`
	Year    int    `json:"year" bson:"year"`
	Subject string `json:"subject" bson:"subject"`
	Part    string `json:"part" bson:"part,omitempty"`
	Order   int    `json:"order" bson:"order"`
}

// AnswerRecord 答题记录
type AnswerRecord struct {
	ID          string `json:"id" bson:"_id,omitempty"`
	UserID      string `json:"userId" bson:"userId"`
	QuestionID  string `json:"questionId" bson:"questionId"`
	UserAnswer  string `json:"userAnswer" bson:"userAnswer"`
	IsCorrect   bool   `json:"isCorrect" bson:"isCorrect"`
	TimeSpent   int    `json:"timeSpent" bson:"timeSpent,omitempty"`
	AnsweredAt  int64  `json:"answeredAt" bson:"answeredAt"`
}

// ExamInfo 试卷摘要
type ExamInfo struct {
	Name    string `json:"name" bson:"name"`
	Year    int    `json:"year" bson:"year"`
	Subject string `json:"subject" bson:"subject"`
	Part    string `json:"part" bson:"part"`
	Count   int    `json:"count" bson:"count"`
}

// NewQuestion 创建新题目
func NewQuestion(q Question) Question {
	now := time.Now().UnixMilli()
	q.CreatedAt = now
	q.UpdatedAt = now
	return q
}
