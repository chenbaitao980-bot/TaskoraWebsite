# admin file upload drag-and-drop

## Goal

将管理员界面的 Android APK 和 Windows ZIP 下载链接管理，从"手动输入 URL"改为"点击选择本地文件 / 拖拽上传"。文件直传 Cloudflare R2（通过 Worker 生成 presigned URL），上传后 R2 public URL 自动写入 `download_links` 表。小米商店链接和 Web URL 保留原有输入框。

## Requirements

* Android APK 字段：替换为拖拽 / 点击上传区域（accept=".apk"）
* Windows ZIP 字段：替换为拖拽 / 点击上传区域（accept=".zip"）
* 小米应用商店链接 / Web 在线版 URL：保留 URL 输入框，不变
* 文件上传到 Cloudflare R2 `taskora-downloads` bucket（public bucket）
* 固定文件名：`taskora-latest.apk` 和 `taskora-latest.zip`（每次上传覆盖，URL 不变）
* 上传后自动 PATCH `download_links` 表
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

### Architecture

```
浏览器 → Worker(GET presigned URL) → 浏览器直传 R2(PUT, 绕过Worker body限制) → 更新 download_links
```

* Worker 只返回 presigned URL（不传 body），不受 Cloudflare Workers 免费版 10 MB body 限制
* 浏览器用 presigned URL 直传 R2，支持任意大小文件（R2 限制 5 GB/文件）
* R2 bucket `taskora-downloads` 设为 Public，下载 URL 无需签名

### Storage

* Cloudflare R2 bucket 名：`taskora-downloads`，设置为 **Public bucket**
* Public URL 格式：`https://pub-{hash}.r2.dev/taskora-latest.apk`（bucket public 域名）
* 固定文件名：`taskora-latest.apk` 和 `taskora-latest.zip`（每次上传覆盖）

### Cloudflare Worker（`github-upload`）

改造为 presigned URL 生成器：

```ts
// Worker 代码 - 只返回 presigned PUT URL
const key = filename; // taskora-latest.apk 或 taskora-latest.zip
const expiresIn = 600; // 10 分钟

const url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`);
const date = new Date();
const dateStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '');

const stringToSign = `PUT\n\n\n${dateStr}\n/${env.R2_BUCKET_NAME}/${key}`;
const signature = await crypto.subtle.sign(
  'HMAC',
  await crypto.subtle.importKey('raw', new TextEncoder().encode(env.R2_SECRET_KEY), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']),
  new TextEncoder().encode(stringToSign)
);

const presignedUrl = `${url.pathname}?${url.searchParams}&Signature=${encodeURIComponent(btoa(String.fromCharCode(...new Uint8Array(signature))))}&Expires=${Math.floor(date.getTime() / 1000) + expiresIn}`;
```

Worker 环境变量：
* `R2_ACCOUNT_ID` — Cloudflare Account ID
* `R2_BUCKET_NAME` — R2 bucket 名（`taskora-downloads`）
* `R2_SECRET_KEY` — R2 API Token 的 Secret Key
* `GITHUB_TOKEN` — 保留（不再使用，可移除）

### Upload Flow（admin.astro）

```ts
// Step 1: 从 Worker 获取 presigned URL
const presignedRes = await fetch(
  `https://github-upload.chenbaitao980.workers.dev/?filename=taskora-latest.apk`
);
const { url: presignedUrl } = await presignedRes.json();

// Step 2: 浏览器直传 R2（PUT，无 body 限制）
await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: file,
});

// Step 3: 更新 download_links
const publicUrl = `https://pub-{hash}.r2.dev/taskora-latest.apk`;
await fetch(`${SUPABASE_URL}/rest/v1/download_links?platform=eq.android_apk`, {
  method: 'PATCH',
  headers: { ... },
  body: JSON.stringify({ url: publicUrl }),
});
```

### UI 变更（admin.astro）

* APK 和 ZIP 的 `.link-card` 内容替换为 upload zone：
  * `<input type="file" hidden>` + 可点击的 drop zone div
  * dragover / drop 事件处理
  * 上传后显示文件名 + 成功状态
* 小米 / Web 的 `.link-card` 完全不变
* "保存所有链接"按钮：仅处理小米 + Web URL，APK/ZIP 字段各自独立上传
* 移除 GitHub Token 配置区（不再需要）

## Decision (ADR-lite)

**Context**: 需要为管理员提供文件上传能力（100+ MB APK/ZIP），同时维持 Astro 静态站 + vanilla DOM 架构。Cloudflare Workers 免费版有 10 MB body 限制。

**Decision**: Worker 只生成 presigned URL，浏览器直传 R2。绕过 Worker body 限制，无需付费升级。

**Consequences**: 实现最简（Worker 几乎不改），URL 稳定，下载页无需改动。R2 免费 10 GB 存储 + 无出口费，完全够用。

## Out of Scope

* 文件版本历史
* 多文件批量上传
* 文件删除管理
* macOS / Linux 包支持（结构上已兼容，后续可加）

## Technical Notes

* 主文件：`src/pages/admin.astro`
* Worker 文件：Cloudflare Dashboard 在线编辑（`github-upload`）
* R2 bucket：`taskora-downloads`，Public 访问
* Supabase 项目：`wlehkvsxftyxmxelcaps.supabase.co`（仅用于 download_links 表）
* 上传文件名固定：APK → `taskora-latest.apk`，ZIP → `taskora-latest.zip`
* **前置步骤**（需在 Cloudflare Dashboard 手动完成）：
  1. R2 → Overview → Create bucket → 名称 `taskora-downloads`
  2. R2 → Settings → Enable public access via r2.dev（或绑定自定义域名）
  3. R2 → Manage R2 API Tokens → 创建 Token（Object Read & Write 权限）
  4. Workers → `github-upload` → Settings → Variables → 添加 `R2_ACCOUNT_ID`、`R2_BUCKET_NAME`、`R2_SECRET_KEY`
