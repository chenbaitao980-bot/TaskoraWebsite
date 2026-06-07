# admin file upload drag-and-drop

## Goal

将管理员界面的 Android APK 和 Windows ZIP 下载链接管理，从"手动输入 URL"改为"点击选择本地文件 / 拖拽上传"，文件存储于 Supabase Storage，上传后 URL 自动写入 `download_links` 表。小米商店链接和 Web URL 保留原有输入框。

## Requirements

* Android APK 字段：替换为拖拽 / 点击上传区域（accept=".apk"）
* Windows ZIP 字段：替换为拖拽 / 点击上传区域（accept=".zip"）
* 小米应用商店链接 / Web 在线版 URL：保留 URL 输入框，不变
* 文件上传到 Supabase Storage `downloads` bucket（public bucket）
* 固定文件名：`taskora-latest.apk` 和 `taskora-latest.zip`（每次上传覆盖，URL 不变）
* 上传后自动 PATCH `download_links` 表（复用现有 Pattern 4）
* 上传期间显示进度 / loading 状态，上传成功显示文件名
* 上传失败显示明确错误信息
* 完全遵守现有 spec：vanilla DOM + `<script>`，无 React/Vue，无状态库

## Acceptance Criteria

* [ ] 管理员可拖拽 APK 文件到 APK 上传区完成上传
* [ ] 管理员可点击 APK 上传区打开文件选择器（仅接受 .apk）
* [ ] 管理员可拖拽 ZIP 文件到 Windows ZIP 上传区完成上传
* [ ] 管理员可点击 ZIP 上传区打开文件选择器（仅接受 .zip）
* [ ] 上传期间区域显示 loading/进度状态，按钮不可用
* [ ] 上传成功后显示文件名（如 "taskora.apk · 已上传"）
* [ ] 上传失败显示错误信息
* [ ] 上传完成后 `download_links` 表对应 platform 的 url 已更新
* [ ] 小米链接和 Web URL 输入框功能完全不受影响
* [ ] "保存所有链接"按钮仍可保存小米 + Web 两个 URL 字段

## Definition of Done

* `astro check` / `astro build` 无报错
* 本地 dev server 验证完整上传流程（APK + ZIP）
* 不引入新的硬编码凭证（Storage bucket 为 public，public URL 无需密钥）

## Technical Approach

### Storage

* Supabase Storage bucket 名：`downloads`，设置为 **Public bucket**
* Public URL 格式：`${SUPABASE_URL}/storage/v1/object/public/downloads/taskora-latest.apk`
* RLS policy：`INSERT/UPDATE` 需要 `auth.role() = 'authenticated'`（用已有 admin JWT）

### Upload API（client-side，无需 API route）

```ts
// PUT 覆盖上传（upsert=true 避免已存在报错）
await fetch(
  `${SUPABASE_URL}/storage/v1/object/downloads/taskora-latest.apk`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true',       // 覆盖已存在文件
    },
    body: file,                 // File object from input/drop
  }
);
```

### UI 变更（admin.astro）

* APK 和 ZIP 的 `.link-card` 内容替换为 upload zone：
  * `<input type="file" hidden>` + 可点击的 drop zone div
  * dragover / drop 事件处理
  * 上传后显示文件名 + 成功状态
* 小米 / Web 的 `.link-card` 完全不变
* "保存所有链接"按钮：仅处理小米 + Web URL，APK/ZIP 字段各自独立上传

### 上传后写入 URL（复用 Pattern 4）

```ts
const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/downloads/taskora-latest.apk`;
await fetch(`${SUPABASE_URL}/rest/v1/download_links?platform=eq.android_apk`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}`, 'Prefer': 'return=minimal' },
  body: JSON.stringify({ url: publicUrl }),
});
```

## Decision (ADR-lite)

**Context**: 需要为管理员提供文件上传能力，同时维持 Astro 静态站 + vanilla DOM 架构。

**Decision**: 客户端直传 Supabase Storage（无 API route 中间层），固定文件名覆盖，public bucket。

**Consequences**: 实现最简，URL 稳定，下载页无需任何改动。存储限额 1GB 对应用包大小完全够用。无版本历史（已明确 Out of Scope）。

## Out of Scope

* 文件版本历史
* 多文件批量上传
* 文件删除管理
* macOS / Linux 包支持（结构上已兼容，后续可加）

## Technical Notes

* 主文件：`src/pages/admin.astro`
* Supabase 项目：`wlehkvsxftyxmxelcaps.supabase.co`
* **前置步骤**（需在 Supabase Dashboard 手动完成）：
  1. Storage → New bucket → 名称 `downloads`，勾选 Public
  2. Storage → Policies → 为 `downloads` bucket 添加 INSERT policy：`auth.role() = 'authenticated'`
* `x-upsert: true` header 是 Supabase Storage 覆盖上传的正确方式
* 上传文件名固定：APK → `taskora-latest.apk`，ZIP → `taskora-latest.zip`
