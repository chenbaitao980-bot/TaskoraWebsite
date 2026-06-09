# 后台管理UI美化 + 中文乱码修复

## Goal

taskora-website/admin 页面 UI 整体美化，包括去掉 emoji 图标、统一设计语言、优化表单、表格样式、按钮、响应式适配。

## What I already know

- 当前 admin 页面使用 StarlightPage + 自定义 CSS，无外部 UI 组件库
- 4 个页面：index.astro（导航卡片）/ downloads.astro / payment.astro / members.astro（1018行）
- 共用的布局：layout.astro（固定左侧栏）
- 有深色模式（data-theme='dark'）
- 已存在 spec: `.trellis/spec/frontend/component-guidelines.md` / `quality-guidelines.md` / `integration-patterns.md`
- ui-ux-pro-max 规范可用

## Assumptions (temporary)

- 不使用外部图标库，用 inline SVG 替换 emoji
- 统一 section-title 的图标风格（SVG icon + text）
- 保留现有功能，只改样式

## Open Questions

（无）

## Requirements (evolving)

1. **去掉所有 emoji** — section-title 中的 👥 💳 📋 🎫 💰 📝 替换为 inline SVG 图标
2. **统一 section-title 图标样式** — `.section-icon` class，统一颜色和尺寸
3. **表单美化** — input focus 环、textarea 等宽字体（密码框用等宽字体）、按钮交互态（hover/press）
4. **表格美化** — 圆角表头、hover 行、边框分隔、table-layout: separate
5. **深色模式适配** — 补充 input/textarea/cancel-btn 的深色 border
6. **响应式** — 表格横向滚动、按钮全宽、flex-wrap
7. **layout.astro 添加 section-icon 全局样式** — 供所有子页面共享

## Acceptance Criteria (evolving)

- [ ] 4 个 admin 页面无 emoji
- [ ] section-icon SVG 显示正常（accent 色，18×18）
- [ ] 表单 input focus 有 accent-color 环
- [ ] 表格 hover 行高亮、圆角表头
- [ ] 深色模式下 input border 可见
- [ ] 移动端表格可横向滚动，按钮全宽
- [ ] astro build 通过（无 ERROR）

## Definition of Done

- astro build 无 ERROR
- Chrome 检查 4 个 admin 页面
- 切换深色/浅色模式，样式正常

## Out of Scope (explicit)

- 不改动 JS 业务逻辑
- 不改动 Starlight 主题变量
- 不加新图标（用 Lucide/Heroicons 风格 inline SVG）

## Technical Notes

- 项目：E:\claude\project2\taskora-website
- 页面：src/pages/admin/members.astro / payment.astro / downloads.astro / layout.astro
- icon SVG 参考 Lucide/Heroicons 风格（stroke 2px，stroke-linecap round）
