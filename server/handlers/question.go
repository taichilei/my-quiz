package handlers

import (
	"context"
	"net/http"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type QuestionHandler struct {
	collection *mongo.Collection
}

func NewQuestionHandler(db *mongo.Database) *QuestionHandler {
	return &QuestionHandler{
		collection: db.Collection("questions"),
	}
}

// GetQuestions 获取题目列表
func (h *QuestionHandler) GetQuestions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 可选参数：exam, year, subject, type, tag
	filter := bson.M{}

	if exam := c.Query("exam"); exam != "" {
		filter["exam.name"] = exam
	}
	if year := c.Query("year"); year != "" {
		filter["exam.year"] = year
	}
	if subject := c.Query("subject"); subject != "" {
		filter["exam.subject"] = subject
	}
	if qtype := c.Query("type"); qtype != "" {
		filter["type"] = qtype
	}
	if tag := c.Query("tag"); tag != "" {
		filter["tags"] = tag
	}

	cursor, err := h.collection.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var questions []models.Question
	if err := cursor.All(ctx, &questions); err != nil {
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	err = h.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&question)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, question)
}

// CreateQuestion 创建题目
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	question = models.NewQuestion(question)

	result, err := h.collection.InsertOne(ctx, question)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	question.ID = result.InsertedID.(primitive.ObjectID).Hex()
	c.JSON(http.StatusCreated, question)
}

// UpdateQuestion 更新题目
func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
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

	_, err = h.collection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": question},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// DeleteQuestion 删除题目
func (h *QuestionHandler) DeleteQuestion(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	_, err = h.collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GetExams 获取试卷列表
func (h *QuestionHandler) GetExams(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{"$group", bson.D{
			{"_id", bson.D{
				{"name", "$exam.name"},
				{"year", "$exam.year"},
				{"subject", "$exam.subject"},
				{"part", "$exam.part"},
			}},
			{"count", bson.D{{"$sum", 1}}},
		}}},
	}

	cursor, err := h.collection.Aggregate(ctx, pipeline)
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

	var exams []models.ExamInfo
	for _, r := range results {
		id := r["_id"].(bson.D)
		exam := models.ExamInfo{
			Name:    getDocValue(id, "name"),
			Year:    int(getDocValueFloat(id, "year")),
			Subject: getDocValue(id, "subject"),
			Part:    getDocValue(id, "part"),
			Count:   int(r["count"].(int32)),
		}
		exams = append(exams, exam)
	}

	if exams == nil {
		exams = []models.ExamInfo{}
	}

	c.JSON(http.StatusOK, exams)
}

func getDocValue(d bson.D, key string) string {
	for _, elem := range d {
		if elem.Key == key {
			if v, ok := elem.Value.(string); ok {
				return v
			}
		}
	}
	return ""
}

func getDocValueFloat(d bson.D, key string) float64 {
	for _, elem := range d {
		if elem.Key == key {
			if v, ok := elem.Value.(int32); ok {
				return float64(v)
			}
		}
	}
	return 0
}
