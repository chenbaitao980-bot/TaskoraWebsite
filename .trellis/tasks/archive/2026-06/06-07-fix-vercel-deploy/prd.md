# Fix Vercel Deploy Error + Auto-Push Workflow

## Goal

修复 Vercel 构建失败（Starlight sidebar slug 找不到），并建立"改完代码自动推送到 Vercel"的工作流规范。

## What I already know

### 问题 1：Sidebar slug 报错
* 错误信息：`The slug "docs/getting-started" specified in the Starlight sidebar config does not exist`
* `astro.config.mjs` sidebar 中配置了 `slug: 'docs/getting-started'`
* 实际文件路径：`src/content/docs/docs/getting-started.md` ✅ 存在
* **根本原因**：`astro.config.mjs` 的 `locales` 配置使用了 `'zh-CN'` 作为 key，这让 Starlight 期望内容在 `src/content/docs/zh-CN/` 子目录下。但文件在根目录，导致 slug 无法匹配。
* **修复方案**：将 `locales` 的 key 从 `'zh-CN'` 改为 `root`（Starlight 的 root locale 约定），让根目录文件被识别为 zh-CN 内容。

### 问题 2：自动推送 Vercel
* Vercel 已通过 git push 触发 CI/CD（vercel.json 存在）
* "自动推送"最可能指：Claude Code 完成代码修改后，自动 `git add → commit → push`
* 可通过 Claude Code hooks（settings.json）或 git hooks 实现

## Open Questions

* 对于"自动推送"，你希望在什么时机触发？
  1. Claude Code 每次完成工具调用（写文件）后自动推送
  2. 手动执行某个命令（如 `/push`）时推送
  3. 每次 git commit 后自动 push（git post-commit hook）

## Requirements

* [x] 修复 `astro.config.mjs` locales 配置（`'zh-CN'` → `root`）
* [ ] 建立自动推送规范（待确认触发时机）

## Acceptance Criteria

* [ ] `npm run build` 本地构建通过，无 sidebar slug 错误
* [ ] Vercel 部署成功，所有页面可访问
* [ ] 自动推送规范到位（方案 TBD）

## Definition of Done

* Lint / typecheck / build green
* Vercel 部署日志无报错

## Out of Scope

* 内容文件的迁移（不移动到 zh-CN/ 子目录）
* iOS/macOS 平台支持

## Technical Notes

* `astro.config.mjs:22` — sidebar 配置
* `astro.config.mjs:16-18` — locales 配置（当前 bug 所在）
* Starlight root locale 文档：https://starlight.astro.build/guides/i18n/#use-a-root-locale
* 文件实际路径 `src/content/docs/docs/*.md`，slug = `docs/*`（相对于集合根）
