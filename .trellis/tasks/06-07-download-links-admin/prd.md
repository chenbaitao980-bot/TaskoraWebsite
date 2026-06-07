# 下载链接管理 + 修复下载页面

## Goal

当前网站下载页面 (`/download/`) 的所有链接均为占位符 `href="#"`，点击无反应。
需要：① 让链接可正常跳转；② 让管理员（非开发者）能在不修改代码的情况下随时更新下载链接和网页链接。

## What I already know

* 网站技术栈：Astro 6.3 + Starlight（静态生成）+ Vercel 部署
* 下载页面：`src/pages/download.astro`，4 个平台卡片，链接全部是 `href="#"`
* 已有 Supabase 连接（用于反馈表单），可复用
* 无独立后端，无 CMS，无管理后台
* 管理员身份是陈柏涛（本项目唯一开发者）

## Assumptions (temporary)

* "管理者" = 项目唯一管理者（陈柏涛），不需要多人协作后台
* 下载链接指向：APK 文件直链 / 应用商店页面 / Web 在线版 URL
* 网页链接指向：外部网页（如小米应用商店、应用宝等）

## Open Questions

* Q1: 管理员更新链接的方式偏好？（Supabase 表格编辑 vs 代码 config 文件 vs 独立后台页面）

## Requirements (evolving)

* 修复下载页面所有 `href="#"` 链接，使其可正常跳转
* 管理员可以在不重新部署的情况下（或以最简单方式）更新链接

## Acceptance Criteria (evolving)

* [ ] 点击 Android APK 下载按钮能跳转到真实链接
* [ ] 点击小米应用商店能打开应用商店页面
* [ ] 点击 Windows 下载按钮能跳转到真实链接
* [ ] 点击 Web 在线版按钮能打开在线版网址
* [ ] 管理员能在 X 分钟内更新任意链接

## Definition of Done

* 所有平台下载链接可正常跳转
* 管理员有明确的链接更新流程（文档或界面）
* Lint / typecheck / build 通过
* Vercel 部署成功

## Out of Scope (explicit)

* iOS/macOS 平台（文档标注为"敬请期待"，暂不启用）
* 多用户权限管理
* 下载统计/分析

## Technical Notes

* 关键文件：`src/pages/download.astro`
* Supabase 已在 `feedback.astro` 中使用，URL 和 anon key 已硬编码
* 部署：git push → GitHub Actions → Vercel 自动部署
* 可选方案 A：修改代码直接硬编码链接（最简单，需每次重新部署）
* 可选方案 B：Supabase 表存储链接，页面客户端动态读取（无需重新部署即可更新）
* 可选方案 C：`links.json` 配置文件（构建时读取，更新需重新部署）
