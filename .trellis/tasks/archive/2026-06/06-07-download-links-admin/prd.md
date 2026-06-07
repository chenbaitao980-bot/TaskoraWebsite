# 下载链接管理后台 + 修复下载页面

## Goal

当前网站下载页面 (`/download/`) 的所有链接均为占位符 `href="#"`，点击无反应。
需要：① 让链接可正常跳转；② 建立管理员后台，让管理员无需改代码即可更新各平台下载 URL。

## Requirements

* 下载页 (`/download/`) 启动时从 Supabase `download_links` 表动态读取 URL，替换原来的 `href="#"` 占位符
* Supabase 表结构：`download_links(platform TEXT PRIMARY KEY, url TEXT, enabled BOOLEAN)`
* 初始平台值：`android_apk`、`android_xiaomi`、`windows_zip`、`web`
* `/admin/login` 页面：邮箱 + 密码登录，使用 Supabase Auth；账号 `chenbaitao980@gmail.com`
* `/admin` 页面：登录鉴权保护（未登录自动跳转 `/admin/login`），可编辑 4 个平台 URL 并保存
* 保存后页面立即显示新值（无需刷新）
* 管理员登出按钮

## Acceptance Criteria

* [ ] 点击 Android APK 下载按钮能跳转到真实链接（非 `#`）
* [ ] 点击小米应用商店能跳转到对应链接
* [ ] 点击 Windows ZIP 下载按钮能跳转到真实链接
* [ ] 点击 Web 在线版按钮能打开在线版网址
* [ ] 访问 `/admin` 未登录时自动跳转 `/admin/login`
* [ ] 用邮箱密码登录成功后进入 `/admin` 管理页
* [ ] 在 `/admin` 修改某平台 URL 并保存，下载页重新加载后反映新值
* [ ] `npm run build` 无报错

## Definition of Done

* 所有 Acceptance Criteria 通过
* dark mode 下 admin/login 页面样式正常
* build 通过（Vercel CI 绿）
* 无 `any` 类型，DOM 操作有类型断言

## Technical Approach

* **Supabase 表**：在 Supabase 控制台手动建 `download_links` 表，初始插入 4 行数据
* **下载页**：`src/pages/download.astro` 的 `<script>` 块里，页面 load 时 fetch Supabase REST API 读取链接，动态更新各按钮 `href`
* **登录页**：`src/pages/admin-login.astro`，调用 Supabase Auth `signInWithPassword`，成功后跳转 `/admin`
* **管理页**：`src/pages/admin.astro`，页面 load 时检查 Supabase Auth session（无 session 跳转登录），读取当前 4 条链接并渲染可编辑 input，保存时 PATCH Supabase REST API
* Supabase URL/key 与 feedback.astro 相同：`https://wlehkvsxftyxmxelcaps.supabase.co`

## Decision (ADR-lite)

**Context**: 纯静态 Astro 网站，无服务端。  
**Decision**: 客户端 JS + Supabase REST API（与现有 feedback.astro 模式一致）。  
**Consequences**: 需配置 Supabase RLS 策略允许匿名读取 `download_links`，认证写入需 auth token。

## Out of Scope

* 版本号 / 文件大小 / 发布日期字段管理（仍写死在代码里）
* iOS/macOS 平台启用
* 多用户管理员权限
* Supabase 离线兜底链接（暂不做）

## Technical Notes

* 关键文件：`src/pages/download.astro`（修改）、`src/pages/admin-login.astro`（新增）、`src/pages/admin.astro`（新增）
* Supabase anon key：已在 `src/pages/feedback.astro` 中硬编码，可直接复用
* Supabase Auth 方法：`@supabase/supabase-js` 或直接调用 Auth REST API（与现有模式保持一致，无需新增 npm 依赖）
* Supabase Auth REST：`POST /auth/v1/token?grant_type=password`，返回 `access_token`
* RLS 策略：`download_links` 表需开启 `SELECT` 对 anon，`UPDATE` 对 authenticated
