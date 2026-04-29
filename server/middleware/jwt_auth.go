// Package middleware 存放 Gin 中间件。
//
// 包含 JWT 认证中间件，用于保护需要登录的接口。
package middleware

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWT 自定义 claims，包含用户 ID
type Claims struct {
	UserID int `json:"userId"`
	jwt.RegisteredClaims
}

// JWTAuth 中间件，验证 JWT token
func JWTAuth() gin.HandlerFunc {
	// 从环境变量读取 JWT 密钥，如果没有则用默认
	jwtSecret := []byte(getJWTSecret())

	return func(c *gin.Context) {
		// 从 Authorization header 获取 token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header required"})
			return
		}

		// Bearer token 格式: "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid authorization format"})
			return
		}

		tokenStr := parts[1]

		// 解析并验证 token
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (any, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid or expired token"})
			return
		}

		// token 有效，把 userID 放到 context 中供后续 handler 使用
		c.Set("userID", claims.UserID)
		c.Next()
	}
}

// GenerateToken 生成 JWT token
func GenerateToken(userID int) (string, error) {
	jwtSecret := []byte(getJWTSecret())

	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 天过期
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// GetUserIDFromContext 从 Gin Context 中获取当前登录用户 ID
func GetUserIDFromContext(c *gin.Context) int {
	userID, exists := c.Get("userID")
	if !exists {
		return 0
	}
	return userID.(int)
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// 开发环境默认密钥，生产环境请通过环境变量设置
		secret = "my-quiz-dev-secret-key-change-in-production"
		log.Println("Warning: using default JWT secret, set JWT_SECRET environment variable in production")
	}
	return secret
}
