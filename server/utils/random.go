// Package utils 通用工具函数
//
// 包含随机字符串生成、加密等工具函数。
package utils

import (
	"crypto/rand"
	"encoding/base64"
	"math/big"
)

const (
	// 字母数字字符集
	letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

// RandomString 生成指定长度的随机字符串（加密安全）
func RandomString(length int) string {
	b := make([]byte, length)
	for i := range b {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letterBytes))))
		b[i] = letterBytes[num.Int64()]
	}
	return string(b)
}

// RandomToken 生成 32 位随机 token（base64 编码后 43 字符）
func RandomToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
