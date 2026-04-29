// Package models 定义所有 GORM 数据模型和表结构。
package models

import "time"

// Upload 用户上传的文件（PDF/图片等）
//
// 存储文件元数据，文件本身存在服务器文件系统。
type Upload struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      string    `json:"userId"`
	FileName    string    `json:"fileName"`    // 原始文件名
	FileSize    int64     `json:"fileSize"`    // 文件大小（字节）
	FileType    string    `json:"fileType"`    // pdf/image/other
	StoragePath string    `json:"-"`           // 存储路径（不返回给前端）
	Status      string    `json:"status"`      // pending/parsing/parsed/failed
	ParsedAt    *int64    `json:"parsedAt"`
	ErrorMsg    *string   `json:"errorMsg"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   int64     `json:"createdAt"`
	UpdatedAt   int64     `json:"updatedAt"`
}

// TableName 指定表名
func (Upload) TableName() string {
	return "uploads"
}

// NewUpload 创建新上传记录
func NewUpload(userID, fileName, fileType, storagePath string, fileSize int64) Upload {
	now := time.Now().UnixMilli()
	return Upload{
		UserID:      userID,
		FileName:    fileName,
		FileSize:    fileSize,
		FileType:    fileType,
		StoragePath: storagePath,
		Status:      "pending",
		Title:       fileName, // 默认标题等于文件名
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
