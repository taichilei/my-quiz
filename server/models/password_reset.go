// Package models 密码重置 Token 模型
//
// 用于存储密码重置的 token 和过期时间。
// 设计模式与 EmailVerification 一致，保证代码风格统一。
package models

import "time"

// PasswordReset 密码重置记录
type PasswordReset struct {
	ID        int    `gorm:"primaryKey;autoIncrement"`
	UserID    int    `gorm:"index;not null"`               // 用户 ID
	Email     string `gorm:"size:100;not null"`            // 邮箱
	Token     string `gorm:"uniqueIndex;size:64;not null"` // 重置 token
	Used      bool   `gorm:"default:false"`                // 是否已使用
	ExpiresAt int64  `gorm:"not null"`                     // 过期时间（毫秒时间戳）
	CreatedAt int64  `gorm:"not null"`                     // 创建时间
}

// NewPasswordReset 创建密码重置记录
// token 有效期 1 小时（安全起见，比邮箱验证短）
func NewPasswordReset(userID int, email, token string) PasswordReset {
	now := time.Now().UnixMilli()
	return PasswordReset{
		UserID:    userID,
		Email:     email,
		Token:     token,
		Used:      false,
		ExpiresAt: now + 60*60*1000, // 1 小时后过期
		CreatedAt: now,
	}
}

// IsValid 检查 token 是否有效（未过期且未使用）
func (pr PasswordReset) IsValid() bool {
	return !pr.Used && time.Now().UnixMilli() <= pr.ExpiresAt
}

// MarkUsed 标记为已使用
func (pr *PasswordReset) MarkUsed() {
	pr.Used = true
}

// TableName 指定数据库表名
func (PasswordReset) TableName() string {
	return "password_resets"
}
