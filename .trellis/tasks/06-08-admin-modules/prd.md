# 后台管理模块重构 + 会员配置模块

## Goal

将现有单体 admin.astro 重构为模块化后台管理，拆分支付配置与下载链接为独立模块，并新增会员类型配置模块（会员等级、充值金额、折扣、功能权限）。

## What I already know

- 当前 admin.astro 是 800 行单体文件，包含三个区块：下载链接、支付宝配置、订单管理
- 下载链接配置：Android APK/Xiaomi Store/Windows ZIP/Web URL，存储在 `download_links` 表
- 支付宝配置：AppID/Private Key/Public Key，存储在 `app_config` 表
- 订单管理：展示 `payment_orders` 表数据
- **VIP 配置全部硬编码**：
  - Flutter 客户端：`app_constants.dart` (line 50-58) 定义价格/限制
  - Edge Function：`create-order/index.ts` (line 11-14) 定义 plan config
  - 无服务端 API 读取 VIP 配置
- 当前 VIP 类型：free / vip_monthly(¥9.9) / vip_yearly(¥68)
- VIP 功能：AI分解、数据导出、无限项目/任务
- 白名单绕过：`574658218@qq.com`
- 技术栈：Astro 6.3 + Starlight 0.39 + Supabase + TypeScript
- 项目路径：E:\claude\project2\taskora-website

## Assumptions (temporary)

- 会员配置需要新建 Supabase 表
- 同时完成后台 UI + API 接口 + Flutter app 适配（完整闭环）

## Open Questions

（无）

## Requirements (evolving)

- 三个模块并行实现（不按顺序）
- 后台管理采用独立页面 + 固定左侧栏导航架构
- 支付配置模块（支付宝配置 + 订单管理）→ `/admin/payment`
- 下载链接配置模块 → `/admin/downloads`
- 会员类型配置模块（新增）→ `/admin/members`
  - 完整闭环：后台 UI + API 接口 + Flutter app 适配
  - 会员等级名称、价格、时长
  - 功能权限开关（AI分解、数据导出、项目/任务数量限制）
  - 折扣码/优惠券管理
  - 充值金额梯度（充多少送多少）
  - 自动续费开关
  - 到期策略：降级但保留数据（到期后降为免费用户，已创建的项目/任务保留，高级功能不可用）
  - 试用期配置
  - 邀请返利配置
- 操作日志：记录管理员对会员配置的修改（谁改了什么、时间）
- 删除保护：已有用户使用的会员类型不可删除

## Acceptance Criteria (evolving)

- [ ] 后台管理分为独立模块页面（固定左侧栏导航）
- [ ] 支付配置模块可管理支付宝配置和查看订单
- [ ] 下载链接模块可管理各平台下载链接
- [ ] 会员配置模块可管理会员类型/价格/折扣/功能
- [ ] 会员配置修改有操作日志记录
- [ ] 已有用户使用的会员类型不可删除
- [ ] API 接口供 Flutter app 读取会员配置
- [ ] Flutter app 从 API 读取会员配置（替换硬编码）

## Definition of Done

- 代码重构完成，无功能回归
- Lint / typecheck 通过
- Supabase 表结构设计合理

## Out of Scope

- 用户管理/用户列表功能
- WeChat Pay 等其他支付渠道

## Technical Notes

- 项目路径：E:\claude\project2\taskora-website
- 主要文件：src/pages/admin.astro
- 数据库：Supabase（download_links, app_config, payment_orders 表）
