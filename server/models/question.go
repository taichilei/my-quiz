// Package models 定义所有 GORM 数据模型和表结构。
//
// 包含题目、答题记录、未完成刷题会话等核心业务实体定义。
package models

import "time"

// Exam 考试信息（独立表 GORM model）
type Exam struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name"`
	Year        int       `json:"year"`
	Subject     string    `json:"subject"`
	Part        string    `json:"part"`
	CreatedAt   int64     `json:"createdAt"`
	UpdatedAt   int64     `json:"updatedAt"`
}

// Question 题目 (GORM model)
type Question struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Type        string    `json:"type"` // single, multiple, judge
	Content     string    `json:"content"`
	Options     []string  `json:"options" gorm:"serializer:json"`
	Answer      string    `json:"answer"`
	Explanation string    `json:"explanation"`
	Difficulty  int       `json:"difficulty"`
	Tags        []string  `json:"tags" gorm:"serializer:json"`
	ExamID      *int      `json:"examId" gorm:"index"` // 外键关联到 exams
	Exam        *Exam     `json:"exam,omitempty" gorm:"foreignKey:ExamID;OnDelete:CASCADE"`
	ExamOrder   int       `json:"examOrder"` // 题目在考试中的序号（原 Exam.Order 移到这里）
	Images      []string  `json:"images" gorm:"serializer:json"`
	UploadID    *int      `json:"uploadId" gorm:"index"` // 来源文件ID
	PageNumber  *int      `json:"pageNumber"`            // 来自原文件第几页
	CreatedAt   int64     `json:"createdAt"`
	UpdatedAt   int64     `json:"updatedAt"`
}

// AnswerRecord 答题记录 (GORM model)
type AnswerRecord struct {
	ID          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      string `json:"userId"`
	QuestionID  int    `json:"questionId"`
	UserAnswer  string `json:"userAnswer"`
	IsCorrect   bool   `json:"isCorrect"`
	TimeSpent   int    `json:"timeSpent"`
	AnsweredAt  int64  `json:"answeredAt"`
}

// QuizSession 未完成刷题会话（用于跨设备恢复进度）
type QuizSession struct {
	ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID         string    `json:"userId"`
	QuizTitle      string    `json:"quizTitle"`
	QuestionIDs    []int     `json:"questionIds" gorm:"serializer:json"`
	CurrentIndex   int       `json:"currentIndex"`
	SelectedAnswer string    `json:"selectedAnswer"`
	ShowResult     bool      `json:"showResult"`
	CorrectCount   int       `json:"correctCount"`
	CreatedAt      int64     `json:"createdAt"`
	UpdatedAt      int64     `json:"updatedAt"`
}

// ExamInfo 试卷摘要
type ExamInfo struct {
	ID      int    `json:"id"`
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

// TableName 指定表名
func (Exam) TableName() string {
	return "exams"
}

// TableName 指定表名
func (Question) TableName() string {
	return "questions"
}

// TableName 指定表名
func (AnswerRecord) TableName() string {
	return "records"
}

// TableName 指定表名
func (QuizSession) TableName() string {
	return "quiz_sessions"
}
