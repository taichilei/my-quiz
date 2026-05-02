# 移动端（iOS / Android）页面与功能设计

> 状态：**草案 v0.2.1**（补充横屏适配）
>
> 适用工程：`apps/native/`（Expo Router + React Native 0.81 + React 19）。
>
> 与 Web 端共享同一套后端 API（`server/`）。

---

## 0. 关键决策（已确认）

| 决策点 | 结论 |
|---|---|
| 平台优先级 | **iOS 先发**，Android 留待 v1.x（RN 写法默认双端兼容，不需要额外工作） |
| MVP 范围 | **只做"刷题"一个核心闭环**，题库 / 我的 / 错题本均为后期扩展 |
| Tab 数量 | 保留 3 个：**刷题 / 题库 / 我的**（错题本作为子页面归入"我的"） |
| 题目 CRUD | 不上 RN，全部留在 Web 端 |
| 状态管理 | **zustand**（轻量全局状态库，对新手最友好） |
| 密码重置 | MVP 走"邮件含链接 → 浏览器打开网页 → 用户复制 token 回 App 输入"；v2 再做 deep link |
| 跨端复用 | **MVP 阶段复制粘贴**（`apps/native/types.ts` 加同步注释指向 Web 源文件）；v2 直接跳到 **OpenAPI codegen**（Go 后端 swag 注解 → 前端 `openapi-typescript` 自动生成 TS 类型），跳过 workspaces 中间形态 |
| **横屏适配** | ✅ **已实现**，分栏布局优化长题干阅读体验 |

---

## 1. 现状盘点

| 模块 | 现状 |
|---|---|
| 工程脚手架 | ✅ Expo Router、TS、Jest、ESLint、Prettier、theme.ts 已就绪 |
| `QuizCard.tsx` | ✅ 单选 / 多选 / 判断三种题型，含进度条、解析、「我不会」、**横屏分栏** |
| Tab 路由 | ⚠️ 只有 `index`（mock 题驱动 QuizCard）+ `explore`（Expo 默认模板，未改造） |
| API client | ❌ 完全未实现，没有任何 `fetch` |
| 登录态 / JWT | ❌ 未实现 |
| 跨设备 Session 恢复 | ❌ 未实现 |
| 错题本 / 统计 | ❌ 后期再做 |
| 文件上传、批量导入 | ❌ 不做（永久裁掉，留 Web） |

---

## 2. 设计原则

1. **后端零分叉**：移动端与 Web 共用一套 API；端差异通过 `X-Client-Type: mobile` / `X-Platform: ios|android` / `X-App-Version` / `X-Device-Id` 在 `ClientInfoMiddleware` 区分。
2. **MVP 极简**：只做"刷题闭环"。多余按钮、设置项一律延后。
3. **跨端代码复用**：类型 + API 常量抽到 `packages/shared/`，Web 改一处，RN 跟着变。
4. **离线友好**：JWT 用 `expo-secure-store`；刷题进度本地双写（AsyncStorage + 后端）。
5. **单一状态源**：用 zustand 维护全局刷题状态；`QuizCard` 只通过 props + 回调通信。
6. **原生体验优先**：`expo-haptics` 触觉反馈、`FlatList` 替代 `ScrollView.map`、native stack 路由。
7. **横竖屏自适应**：`QuizCard` 自动检测方向，横屏时左右分栏提升长题干阅读体验。

---

## 3. 信息架构与导航

底部 Tab Bar（**3 个**，默认进入「刷题」）：

```
┌─────────────────────────────────────────────┐
│  📝 刷题        📚 题库        👤 我的    │
└─────────────────────────────────────────────┘
```

| Tab | 路由路径 | MVP | 备注 |
|---|---|:-:|---|
| 刷题 | `app/(tabs)/index.tsx` | ✅ | 唯一在 MVP 实现的 Tab |
| 题库 | `app/(tabs)/library.tsx` | 🔜 v2 | 浏览/筛选题目，只读 |
| 我的 | `app/(tabs)/profile.tsx` | 🔜 v2 | 账号、统计、错题本、设置 |

未登录态：所有 Tab 拦截到登录页（modal stack）。

---

## 4. 页面清单

> 标 ✅ 的是 MVP 必做；🔜 是 v2 计划。

### 4.1 Auth Stack（MVP ✅）

#### 4.1.1 登录页 `app/auth/login.tsx` ✅
- 输入：用户名 / 邮箱 + 密码
- API：`POST /api/auth/login`
- 成功：JWT 存 `expo-secure-store`，跳 Tab root
- 错误：邮箱未验证 → 引导跳「重发验证码」

#### 4.1.2 注册页 `app/auth/register.tsx` ✅
- 输入：用户名、邮箱（必填）、密码、确认密码
- API：`POST /api/auth/register` → 自动跳验证码页
- 校验：用户名 3-50 字符、密码 ≥ 8 位、邮箱格式

#### 4.1.3 邮箱验证页 `app/auth/verify-email.tsx` ✅
- 6 位 OTP 风格验证码
- API：`POST /api/auth/verify-email` / `POST /api/auth/resend-verification`
- 60 秒重发倒计时

#### 4.1.4 忘记密码 / 重置密码 ✅
- `app/auth/forgot.tsx`：输邮箱 → `POST /api/auth/forgot-password`
- 邮件中给一段 token + 链接（链接打开网页提示"复制下方 token 回 App 粘贴"）
- `app/auth/reset.tsx`：粘贴 token + 新密码 → `POST /api/auth/reset-password`
- v2 升级 deep link：邮件链接直接唤起 App 自动填入 token

---

### 4.2 刷题 Tab（MVP 核心 ✅）

#### 4.2.1 刷题首页 `app/(tabs)/index.tsx` ✅
两种状态切换：

**A. 未开始刷题（空状态）**
- 顶部：考试选择按钮（点击进入 4.2.2）
- 中部快捷入口：「随机刷一组」「继续上次进度」（仅当后端 `/api/session/current` 有未完成会话时显示）
- 底部：今日刷题统计（已答 X 题 / 正确率 Y%）

**B. 刷题进行中**
- 复用现有 `components/QuizCard.tsx`（支持横屏分栏）
- 答题后自动调 `recordApi.create()` + `sessionApi.upsert()`
- 全部答完 → 弹结果页（4.2.3）
- 右上角「⋯」菜单：暂停退出 / 跳到指定题号 / 结束本次刷题

**进入流程**：
1. App 启动 → 拉 `/api/session/current`
2. 若有未完成 → 弹 `ContinueQuizModal`：「继续」/「重新开始」
3. 否则进入空状态页

#### 4.2.2 考试选择页 `app/quiz/select-exam.tsx` ✅
- 列表：所有 exam 按年份分组
- 每条：考试名 / 年份 / 科目 / 题目数 / 已答数
- 点击 → 选模式（全部 / 仅未答）→ 返回首页启动会话
- ※ MVP 不做"仅错题"模式（错题本 v2 才实现）

#### 4.2.3 完成弹窗 `components/native/QuizFinishModal.tsx` ✅
- 答对 X / 总 Y、正确率、用时
- 操作：「再刷一遍」/「返回」

---

### 4.3 题库 Tab 🔜 v2

- 题库列表 `app/(tabs)/library.tsx`：搜索 + 筛选 + 分页列表
- 题目详情 `app/question/detail.tsx`：展示题干+选项（只读，不能答）
- 横屏时同样分栏：题干左，解析右

---

### 4.4 我的 Tab 🔜 v2

- 个人中心 `app/(tabs)/profile.tsx`：账号信息 + 统计卡片
- 错题本子页 `app/profile/wrong.tsx`：列出 `isCorrect=false` 的题，可"错题刷一遍"
- 修改资料 / 修改密码 / 关于 / 版本号 / 退出登录

---

## 5. 横屏适配（已实现 ✅）

### 5.1 适配范围
- **Web 端**：响应式布局，自动检测横竖屏
- **移动端**：`orientation: default`，允许用户自由旋转

### 5.2 布局策略
| 模式 | 布局方式 |
|---|---|
| **竖屏**（默认） | 题干在上，选项在下，垂直流式布局 |
| **横屏** | 左右分栏，左侧题干 + 图片，右侧选项 + 操作按钮 |

### 5.3 实现细节
- **Web 端**：`useOrientation()` hook 监听 `window.innerWidth/innerHeight`，`landscape` 时切换 flex 布局方向
- **移动端**：`useWindowDimensions()` 响应式获取宽高，`width > height` 时启用分栏
- **图片约束**：横屏时图片最大高度从 `300px` 降至 `150/200px`，避免挤压选项
- **分割线**：左右两列间加 hairline 分割，视觉上区分题干/选项区域

### 5.4 用户提示
横屏模式下，在题型标签前显示「横屏模式」小 badge，告知用户当前布局已优化。
