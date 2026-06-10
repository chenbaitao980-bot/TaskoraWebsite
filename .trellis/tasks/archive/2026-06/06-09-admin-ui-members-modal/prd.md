# admin 会员配置页 UI 优化 + 编辑弹框

## Goal

改善 `/admin/members` 页面的视觉质量和交互体验：消除多余留白、美化操作按钮、将编辑/添加表单改为 modal 弹框（不再滚动到页面下方的内联表单）。

## What I already know

* 文件：`src/pages/admin/members.astro`（单文件，含 HTML / TypeScript 脚本 / scoped CSS）
* 框架：Astro + Starlight（StarlightPage with `template: 'splash'`）
* 当前问题：
  - 截图显示表格右侧有大块留白（StarlightPage splash 模板自带上下 padding 和内容列限宽导致）
  - `.edit-btn/.delete-btn` 的 CSS 已写，但截图中看起来像朴素文字，疑似被 Starlight 全局 button 样式覆盖
  - 点击"编辑"调用 `showTypeForm(type)` → `scrollIntoView`，跳到页面下方内联表单；用户希望改为弹框
* Layout 文件：`src/pages/admin/layout.astro`（含侧边栏，admin-main 用 `flex: 1; padding: 0 1.5rem`）
* 三个可编辑实体：会员类型 / 折扣码 / 充值梯度，各自有独立的 showXForm / form-section

## Requirements

* R1：消除多余留白——内容区铺满 admin-main，不依赖 StarlightPage 的 splash 内容限宽
* R2：编辑/删除按钮视觉上更清晰——编辑按钮用蓝色调，删除按钮用红色带背景，hover 有明确反馈
* R3：点击"编辑"或"+ 添加"弹出 modal overlay，不再 scrollIntoView
* R4：modal 支持 ESC 关闭、点击蒙层关闭
* R5：modal 内的表单逻辑保持不变（saveType/saveDiscount/saveTier 功能不改）
* R6：删除操作改为 modal confirm（替换原生 `confirm()`），样式统一
* R7：页面整体 max-width 放大或去除限制，充分利用 admin-main 的可用宽度

## Acceptance Criteria

* [ ] 打开页面后表格紧贴内容区，无大面积空白
* [ ] 编辑按钮有蓝色边框/文字，删除按钮有红色样式，hover 有背景填充
* [ ] 点击"编辑"弹出居中半透明蒙层 modal，不会跳转页面位置
* [ ] 点击蒙层或按 ESC 关闭 modal
* [ ] 删除确认用 modal 而不是 browser confirm()
* [ ] 三个区域（会员类型/折扣码/充值梯度）均已改造

## Out of Scope

* 添加新字段或业务逻辑
* 移动端响应式的大幅重构（保持现有响应式逻辑即可）
* 操作日志区块的样式改造

## Technical Notes

* 三个 showXForm 函数（showTypeForm / showDiscountForm / showTierForm）需改为打开 modal
* 建议在 `<body>` 末尾注入一个通用 modal 容器，三个表单共用蒙层，切换内部内容
* Starlight StarlightPage splash 内容列宽可能通过 `.sl-content-wrapper` 或 `.hero` 等类控制，需用 `:global()` 覆盖
* 当前 `type-form-section` / `discount-form-section` / `tier-form-section` 的 hidden/show 逻辑需迁移到 modal 开/关
