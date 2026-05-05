# My-Quiz 文档

开源刷题工具，帮助考研、考公、考编等各类考试人群高效复习。

## 文档导航

### 用户文档

面向使用者，无需编程基础。

| 文档 | 说明 |
|------|------|
| [快速开始](./user-guide/README.md) | 5 分钟上手 |
| [使用指南](./user-guide/usage.md) | 刷题、题库管理 |
| [导入导出](./user-guide/import-export.md) | 题库导入、数据备份 |
| [PWA 安装](./user-guide/pwa.md) | 添加到主屏幕，离线使用 |

### 开发者文档

面向贡献者，需要一定编程基础。

| 文档 | 说明 |
|------|------|
| [开发指南](./developer-guide/README.md) | 开发者入门 |
| [项目架构](./developer-guide/architecture.md) | 技术栈、目录结构 |
| [后端架构](./developer-guide/backend-architecture.md) | Go + Gin + GORM + PostgreSQL |
| [本地开发](./developer-guide/getting-started.md) | 环境搭建、运行调试 |
| [测试指南](./developer-guide/测试指南.md) | 前后端测试约定 |
| [题目格式规范](./question-schema.md) | JSON Schema 定义 |
| [贡献指南](../CONTRIBUTING.md) | 如何贡献代码/题库 |
| [项目全景与命令](../CLAUDE.md) | 一份文档看懂所有目录与命令 |

### 参考资料

| 文档 | 说明 |
|------|------|
| [行业调研报告](./industry-research.md) | 主流题目数据格式分析 |

## 项目特色

- **开源免费**：打破教育机构信息差
- **多端覆盖**：Web（PWA 离线）+ 原生 iOS / Android + Go 后端 API
- **多设备同步**：登录后题库、答题进度、错题本跨设备同步（v1.x 起）
- **批量导入**：支持 JSON 题库批量导入与上传文件解析
