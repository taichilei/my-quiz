// Package models 定义所有 GORM 数据模型和表结构。
//
// 包含题目、答题记录、未完成刷题会话、用户等核心业务实体定义。
package models

import "time"

// User 用户模型（用户注册登录认证）
type User struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Username  string    `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Password  string    `json:"-"      gorm:"size:255;not null"`  // json:"-" 永远不返回给前端，确保密码安全
	Email     *string   `json:"email"`                          // 邮箱，可选，可为空
	CreatedAt int64     `json:"createdAt"`
	UpdatedAt int64     `json:"updatedAt"`
}

// NewUser 创建新用户
func NewUser(username, passwordHash string, email *string) User {
	now := time.Now().UnixMilli()
	return User{
		Username:  username,
		Password:  passwordHash,
		Email:     email,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// TableName 指定数据库表名
func (User) TableName() string {
	return "users"
}
