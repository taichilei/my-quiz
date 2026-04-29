package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestClientInfoMiddleware_WithHeaders(t *testing.T) {
	r := gin.New()
	r.Use(ClientInfoMiddleware())

	r.GET("/test", func(c *gin.Context) {
		client := GetClient(c)
		c.JSON(http.StatusOK, client)
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Client-Type", "mobile")
	req.Header.Set("X-App-Version", "1.2.3")
	req.Header.Set("X-Device-Id", "test-device-123")
	req.Header.Set("X-Platform", "ios")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// 验证中间件正确设置了 Context
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = req
	ClientInfoMiddleware()(c)

	client := GetClient(c)
	assert.Equal(t, "mobile", client.Type)
	assert.Equal(t, "1.2.3", client.Version)
	assert.Equal(t, "test-device-123", client.DeviceID)
	assert.Equal(t, "ios", client.Platform)
	assert.True(t, client.IsMobile)
}

func TestClientInfoMiddleware_UAFallback(t *testing.T) {
	tests := []struct {
		name     string
		ua       string
		wantType string
		wantMobile bool
	}{
		{
			name:       "iPhone UA",
			ua:         "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
			wantType:   "mobile",
			wantMobile: true,
		},
		{
			name:       "Android UA",
			ua:         "Mozilla/5.0 (Linux; Android 10; SM-G973F)",
			wantType:   "mobile",
			wantMobile: true,
		},
		{
			name:       "Chrome Desktop UA",
			ua:         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			wantType:   "web",
			wantMobile: false,
		},
		{
			name:       "iPad UA",
			ua:         "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
			wantType:   "mobile",
			wantMobile: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, _ := gin.CreateTestContext(httptest.NewRecorder())
			c.Request, _ = http.NewRequest("GET", "/test", nil)
			c.Request.Header.Set("User-Agent", tt.ua)

			ClientInfoMiddleware()(c)
			client := GetClient(c)

			assert.Equal(t, tt.wantType, client.Type)
			assert.Equal(t, tt.wantMobile, client.IsMobile)
		})
	}
}

func TestVersionToCode(t *testing.T) {
	tests := []struct {
		version string
		want    int
	}{
		{"1.0.0", 10000},
		{"1.2.3", 10203},
		{"2.10.5", 21005},
		{"0.0.1", 1},
		{"invalid", 0},
		{"1.0", 0}, // 不足 3 段
	}

	for _, tt := range tests {
		t.Run(tt.version, func(t *testing.T) {
			assert.Equal(t, tt.want, VersionToCode(tt.version))
		})
	}
}

func TestVersionGreaterOrEqual(t *testing.T) {
	tests := []struct {
		v1   string
		v2   string
		want bool
	}{
		{"1.2.3", "1.2.3", true},
		{"1.2.4", "1.2.3", true},
		{"1.3.0", "1.2.3", true},
		{"2.0.0", "1.9.9", true},
		{"1.2.2", "1.2.3", false},
		{"1.1.9", "1.2.0", false},
		{"0.9.9", "1.0.0", false},
	}

	for _, tt := range tests {
		t.Run(tt.v1+"_vs_"+tt.v2, func(t *testing.T) {
			assert.Equal(t, tt.want, VersionGreaterOrEqual(tt.v1, tt.v2))
		})
	}
}

func TestVersionLessThan(t *testing.T) {
	assert.True(t, VersionLessThan("1.0.0", "2.0.0"))
	assert.False(t, VersionLessThan("2.0.0", "1.0.0"))
}

func TestGetClient_Default(t *testing.T) {
	// 没有经过中间件时返回默认值
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	client := GetClient(c)

	assert.Equal(t, "web", client.Type)
	assert.False(t, client.IsMobile)
}

func TestClientInfoMiddleware_MiniProgram(t *testing.T) {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request, _ = http.NewRequest("GET", "/test", nil)
	c.Request.Header.Set("X-Client-Type", "mini-program")

	ClientInfoMiddleware()(c)
	client := GetClient(c)

	assert.Equal(t, "mini-program", client.Type)
	assert.True(t, client.IsMobile)
}
