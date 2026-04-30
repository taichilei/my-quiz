// Package models 邮箱验证 Token 模型
//
// 用于存储邮箱验证的 token 和过期时间。
package models

import "time"

// EmailVerification 邮箱验证记录
type EmailVerification struct {
	ID        int    `gorm:"primaryKey;autoIncrement"`
	UserID    int    `gorm:"index;not null"`               // 用户 ID
	Email     string `gorm:"size:100;not null"`            // 邮箱
	Token     string `gorm:"uniqueIndex;size:64;not null"` // 验证 token
	ExpiresAt int64  `gorm:"not null"`                     // 过期时间（毫秒时间戳）
	CreatedAt int64  `gorm:"not null"`                     // 创建时间
}

// NewEmailVerification 创建邮箱验证记录
// token 有效期 24 小时
func NewEmailVerification(userID int, email, token string) EmailVerification {
	now := time.Now().UnixMilli()
	return EmailVerification{
		UserID:    userID,
		Email:     email,
		Token:     token,
		ExpiresAt: now + 24*60*60*1000, // 24 小时后过期
		CreatedAt: now,
	}
}

// IsExpired 检查 token 是否已过期
func (ev EmailVerification) IsExpired() bool {
	return time.Now().UnixMilli() > ev.ExpiresAt
}

// TableName 指定数据库表名
func (EmailVerification) TableName() string {
	return "email_verifications"
}
