// Package utils 邮件发送工具
//
// 使用 SMTP 发送验证邮件。
package utils

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

// EmailConfig 邮件配置
type EmailConfig struct {
	Host     string // SMTP 服务器地址
	Port     string // SMTP 端口（通常 587 for TLS, 465 for SSL）
	Username string // 发件人邮箱
	Password string // 邮箱密码/授权码
	FromName string // 发件人名称
}

// LoadEmailConfig 从环境变量加载邮件配置
func LoadEmailConfig() EmailConfig {
	return EmailConfig{
		Host:     os.Getenv("SMTP_HOST"),
		Port:     os.Getenv("SMTP_PORT"),
		Username: os.Getenv("SMTP_USERNAME"),
		Password: os.Getenv("SMTP_PASSWORD"),
		FromName: getEnvOrDefault("SMTP_FROM_NAME", "MyQuiz"),
	}
}

// IsEmailConfigured 检查邮件配置是否完整
func (c EmailConfig) IsConfigured() bool {
	return c.Host != "" && c.Port != "" && c.Username != "" && c.Password != ""
}

// SendVerificationEmail 发送邮箱验证邮件
// to: 收件人邮箱
// username: 用户名
// verifyURL: 验证链接（完整 URL，包含 token）
func SendVerificationEmail(to, username, verifyURL string) error {
	config := LoadEmailConfig()
	if !config.IsConfigured() {
		return fmt.Errorf("SMTP not configured")
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>邮箱验证 - MyQuiz</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #4f46e5; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>欢迎加入 MyQuiz</h1>
        </div>
        <div class="content">
            <p>你好，%s，</p>
            <p>感谢注册 MyQuiz！请点击下方按钮验证你的邮箱：</p>
            <p style="text-align: center;"><a href="%s" class="button">验证邮箱</a></p>
            <p>如果按钮无法点击，请复制以下链接到浏览器打开：</p>
            <p style="word-break: break-all; color: #666;">%s</p>
            <p>链接有效期为 24 小时。</p>
            <p>如果你没有注册 MyQuiz，请忽略这封邮件。</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 MyQuiz. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, username, verifyURL, verifyURL)

	return sendEmail(config, to, "请验证你的邮箱 - MyQuiz", html)
}

// sendSSL 使用 SSL 连接发送邮件（端口 465）
func sendSSL(config EmailConfig, to, msg string) error {
	tlsConfig := &tls.Config{
		ServerName: config.Host,
	}

	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%s", config.Host, config.Port), tlsConfig)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, config.Host)
	if err != nil {
		return err
	}
	defer client.Quit()

	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
	if err = client.Auth(auth); err != nil {
		return err
	}

	if err = client.Mail(config.Username); err != nil {
		return err
	}

	if err = client.Rcpt(to); err != nil {
		return err
	}

	w, err := client.Data()
	if err != nil {
		return err
	}

	_, err = w.Write([]byte(msg))
	if err != nil {
		return err
	}

	return w.Close()
}

// SendPasswordResetEmail 发送密码重置邮件
func SendPasswordResetEmail(to, username, resetURL string) error {
	config := LoadEmailConfig()
	if !config.IsConfigured() {
		return fmt.Errorf("SMTP not configured")
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>密码重置 - MyQuiz</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #ef4444; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>密码重置</h1>
        </div>
        <div class="content">
            <p>你好，%s，</p>
            <p>你请求了密码重置，请点击下方按钮重置密码：</p>
            <p style="text-align: center;"><a href="%s" class="button">重置密码</a></p>
            <p>如果按钮无法点击，请复制以下链接到浏览器打开：</p>
            <p style="word-break: break-all; color: #666;">%s</p>
            <p><strong>链接有效期为 1 小时。</strong></p>
            <p>如果你没有请求密码重置，请忽略这封邮件。</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 MyQuiz. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, username, resetURL, resetURL)

	return sendEmail(config, to, "请重置你的密码 - MyQuiz", html)
}

// sendEmail 通用邮件发送函数（内部复用）
func sendEmail(config EmailConfig, to, subject, html string) error {
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", config.FromName, config.Username)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(html)

	// 使用 TLS 发送（端口 587）
	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
	err := smtp.SendMail(
		fmt.Sprintf("%s:%s", config.Host, config.Port),
		auth,
		config.Username,
		[]string{to},
		[]byte(msg.String()),
	)

	// 如果失败，尝试 SSL（端口 465）
	if err != nil && config.Port == "465" {
		return sendSSL(config, to, msg.String())
	}

	return err
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
