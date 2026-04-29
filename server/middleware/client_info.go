// Package middleware 存放 Gin 中间件。
//
// ClientInfoMiddleware 统一解析客户端多端信息，全链路透传给业务 Handler。
package middleware

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// ClientInfo 客户端信息，包含端类型、版本、设备标识等
type ClientInfo struct {
	Type     string // web / mobile / mini-program
	Version  string // 语义化版本号如 1.0.0
	DeviceID string // 设备唯一标识
	Platform string // ios / android / h5 / pc
	IsMobile bool   // 是否移动端（快速判断用）
}

// ClientInfoMiddleware 统一解析客户端信息中间件
// 使用方式：r.Use(middleware.ClientInfoMiddleware())
func ClientInfoMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		client := ClientInfo{
			Type:     strings.ToLower(c.GetHeader("X-Client-Type")),
			Version:  strings.TrimSpace(c.GetHeader("X-App-Version")),
			DeviceID: strings.TrimSpace(c.GetHeader("X-Device-Id")),
			Platform: strings.ToLower(c.GetHeader("X-Platform")),
		}

		// 兼容兜底：如果没传 Header，从 User-Agent 推断
		if client.Type == "" {
			ua := strings.ToLower(c.GetHeader("User-Agent"))
			if isMobileUA(ua) {
				client.Type = "mobile"
				client.IsMobile = true
			} else {
				client.Type = "web"
				client.IsMobile = false
			}
		} else {
			client.IsMobile = client.Type == "mobile" || client.Type == "mini-program"
		}

		// 存入 Gin Context，所有 Handler 都能拿到
		c.Set("client", client)
		c.Next()
	}
}

// GetClient 从 Context 获取客户端信息
func GetClient(c *gin.Context) ClientInfo {
	client, exists := c.Get("client")
	if !exists {
		return ClientInfo{Type: "web", IsMobile: false}
	}
	return client.(ClientInfo)
}

// VersionToCode 版本号转数值，方便比较：1.2.3 -> 10203
func VersionToCode(version string) int {
	parts := strings.Split(version, ".")
	if len(parts) < 3 {
		return 0
	}

	major, _ := strconv.Atoi(parts[0])
	minor, _ := strconv.Atoi(parts[1])
	patch, _ := strconv.Atoi(parts[2])

	return major*10000 + minor*100 + patch
}

// VersionGreaterOrEqual 判断 v1 是否 >= v2
func VersionGreaterOrEqual(v1, v2 string) bool {
	code1 := VersionToCode(v1)
	code2 := VersionToCode(v2)
	return code1 >= code2
}

// VersionLessThan 判断 v1 是否 < v2
func VersionLessThan(v1, v2 string) bool {
	return !VersionGreaterOrEqual(v1, v2)
}

// isMobileUA 从 User-Agent 判断是否为移动端
func isMobileUA(ua string) bool {
	mobileKeywords := []string{
		"mobile", "android", "iphone", "ipad", "ipod",
		"webos", "blackberry", "windows phone", "silk/",
		"kindle", "opera mini", "iemobile",
	}

	for _, kw := range mobileKeywords {
		if strings.Contains(ua, kw) {
			return true
		}
	}
	return false
}
