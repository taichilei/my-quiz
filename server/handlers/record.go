package handlers

import (
	"context"
	"net/http"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type RecordHandler struct {
	collection *mongo.Collection
}

func NewRecordHandler(db *mongo.Database) *RecordHandler {
	return &RecordHandler{
		collection: db.Collection("records"),
	}
}

// CreateRecord 保存答题记录
func (h *RecordHandler) CreateRecord(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.AnswerRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record.AnsweredAt = time.Now().UnixMilli()

	result, err := h.collection.InsertOne(ctx, record)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	record.ID = result.InsertedID.(string)
	c.JSON(http.StatusCreated, record)
}

// GetRecords 获取用户答题记录
func (h *RecordHandler) GetRecords(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := c.Param("userId")

	filter := bson.M{"userId": userID}

	// 可选：按题目筛选
	if questionID := c.Query("questionId"); questionID != "" {
		filter["questionId"] = questionID
	}

	cursor, err := h.collection.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var records []models.AnswerRecord
	if err := cursor.All(ctx, &records); err != nil {
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := c.Param("userId")

	// 使用简单的统计查询
	filter := bson.M{"userId": userID}
	cursor, err := h.collection.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 计算统计
	total := len(results)
	correct := 0
	for _, r := range results {
		if r["isCorrect"] == true {
			correct++
		}
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
