# admin file upload drag-and-drop

## Goal

将管理员界面的下载链接管理从"手动输入 URL"升级为"点击选择本地文件 / 拖拽上传文件"，文件上传后自动生成访问 URL 并保存。

## What I already know

* 当前 admin 界面有 4 个 URL 输入字段：Android APK 直链、小米应用商店链接、Windows ZIP 直链、Web 在线版 URL
* 技术栈：Astro v6.3.1（纯静态站点）+ Tailwind CSS v4 + TypeScript，无 React/Vue
* 数据层：Supabase（PostgreSQL），表 `download_links`，字段 `platform`（string）+ `url`（string）
* 认证：JWT token 存储于 `localStorage`（`taskora_admin_token`）
* 目前无任何文件上传基础设施（无 FormData、无 file input、无 Storage bucket）
* 凭证当前硬编码在客户端脚本中（Supabase URL + anon key）

## Assumptions (temporary)

* APK 和 Windows ZIP 适合文件上传；小米商店链接和 Web URL 是外部链接，仍保留 URL 输入
* 文件存储于 Supabase Storage
* 上传后自动将 public URL 写入 `download_links` 表

## Open Questions

* 文件应存储在哪里？Supabase Storage（已有 Supabase 账户）还是其他 CDN？

## Requirements (evolving)

* Android APK 和 Windows ZIP 字段支持：点击选择本地文件 + 拖拽上传
* 小米商店链接和 Web 在线版 URL 保持原有 URL 输入框
* 上传进度显示
* 上传成功后显示当前文件名或 URL

## Acceptance Criteria (evolving)

* [ ] 管理员可拖拽 APK/ZIP 文件到上传区域完成上传
* [ ] 管理员可点击上传区域打开文件选择器选择文件
* [ ] 上传期间显示进度条或加载状态
* [ ] 上传完成后 URL 自动保存到 Supabase `download_links` 表
* [ ] 小米链接和 Web URL 输入框保持不变

## Definition of Done

* Lint / typecheck 通过
* 在本地 dev server 验证完整上传流程
* 不引入新的硬编码凭证

## Out of Scope

* 文件版本历史
* 多文件批量上传
* 文件删除管理

## Technical Notes

* 主文件：`src/pages/admin.astro`
* Supabase 项目：`wlehkvsxftyxmxelcaps.supabase.co`
* Supabase Storage 需要先创建 bucket（需要 service_role key 或手动在 Dashboard 创建）
* 无现有 server endpoint，需评估是否需要 Astro API route 处理 multipart upload
