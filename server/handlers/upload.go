// Package handlers 实现所有 HTTP API 处理函数。
package handlers

import (
	"errors"
	"fmt"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"my-quiz/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UploadHandler 处理文件上传相关的 HTTP 请求。
type UploadHandler struct {
	db *gorm.DB
}

// NewUploadHandler 创建一个新的 UploadHandler。
func NewUploadHandler(db *gorm.DB) *UploadHandler {
	return &UploadHandler{
		db: db,
	}
}

// List 获取用户上传文件列表
// GET /api/uploads
func (h *UploadHandler) List(c *gin.Context) {
	// 固定用户 ID
	userID := "default-user"

	var uploads []models.Upload
	err := h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&uploads).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if uploads == nil {
		uploads = []models.Upload{}
	}

	c.JSON(http.StatusOK, uploads)
}

// Get 获取单个文件信息
// GET /api/uploads/:id
func (h *UploadHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := "default-user"
	var upload models.Upload
	err = h.db.Where("id = ? AND user_id = ?", id, userID).First(&upload).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, upload)
}

// Upload 上传文件
// POST /api/uploads
func (h *UploadHandler) Upload(c *gin.Context) {
	userID := "default-user"

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	// 确定文件类型
	fileType := "other"
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	switch ext {
	case ".pdf":
		fileType = "pdf"
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		fileType = "image"
	case ".doc", ".docx":
		fileType = "word"
	}

	// 创建存储目录：uploads/{userID}/{YYYY}/{MM}/
	now := time.Now()
	dirPath := filepath.Join("uploads", userID, fmt.Sprintf("%04d", now.Year()), fmt.Sprintf("%02d", now.Month()))
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory: " + err.Error()})
		return
	}

	// 生成存储路径：timestamp-originalname
	safeName := strings.ReplaceAll(fileHeader.Filename, " ", "-")
	safeName = strings.ReplaceAll(safeName, "/", "-")
	storagePath := filepath.Join(dirPath, fmt.Sprintf("%d-%s", now.Unix(), safeName))

	// 保存文件到服务器
	if err := c.SaveUploadedFile(fileHeader, storagePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file: " + err.Error()})
		return
	}

	// 创建数据库记录
	upload := models.NewUpload(userID, fileHeader.Filename, fileType, storagePath, fileHeader.Size)
	if err := h.db.Create(&upload).Error; err != nil {
		// 清理已经保存的文件
		os.Remove(storagePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create record: " + err.Error()})
		return
	}

	log.Printf("File uploaded: %s -> %s", fileHeader.Filename, storagePath)
	c.JSON(http.StatusCreated, upload)
}

// Download 下载原文件
// GET /api/uploads/:id/download
func (h *UploadHandler) Download(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := "default-user"
	var upload models.Upload
	err = h.db.Where("id = ? AND user_id = ?", id, userID).First(&upload).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 检查文件是否存在
	if _, err := os.Stat(upload.StoragePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found on disk"})
		return
	}

	// 根据扩展名猜测 Content-Type
	contentType := mime.TypeByExtension(filepath.Ext(upload.FileName))
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// 设置下载头
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, upload.FileName))
	c.Header("Content-Type", contentType)

	// 发送文件
	c.File(upload.StoragePath)
}

// Update 更新文件信息（标题、描述）
// PUT /api/uploads/:id
func (h *UploadHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := "default-user"
	var upload models.Upload
	err = h.db.Where("id = ? AND user_id = ?", id, userID).First(&upload).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	upload.Title = req.Title
	upload.Description = req.Description
	upload.UpdatedAt = time.Now().UnixMilli()

	if err := h.db.Save(&upload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, upload)
}

// Delete 删除文件
// DELETE /api/uploads/:id?deleteQuestions=true|false
func (h *UploadHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	deleteQuestions, _ := strconv.ParseBool(c.DefaultQuery("deleteQuestions", "false"))

	userID := "default-user"
	var upload models.Upload
	err = h.db.Where("id = ? AND user_id = ?", id, userID).First(&upload).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 开启事务
	tx := h.db.Begin()

	// 如果需要，删除所有关联题目
	if deleteQuestions {
		result := tx.Where("upload_id = ?", id).Delete(&models.Question{})
		if result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete questions: " + result.Error.Error()})
			return
		}
		log.Printf("Deleted %d questions for upload %d", result.RowsAffected, id)
	}

	// 删除数据库记录
	if err := tx.Delete(&upload).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete record: " + err.Error()})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed: " + err.Error()})
		return
	}

	// 删除磁盘上的文件（异步，不影响响应）
	go func(path string) {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			log.Printf("Warning: failed to remove file %s: %v", path, err)
		}
	}(upload.StoragePath)

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
