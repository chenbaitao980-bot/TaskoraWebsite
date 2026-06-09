# Research: Flutter VIP Hardcoded

- **Query**: 在 smart_assistant 项目中查找硬编码的 VIP 配置（app_constants、services 下 vip/member/subscription/plan 相关文件）
- **Scope**: internal
- **Date**: 2026-06-09

## Findings

### Hardcoded VIP Pricing (app_constants.dart lines 54–64)

File: `lib/core/constants/app_constants.dart`

```dart
// VIP 定价默认值（分，用于订单创建）
// 注意：这些值现在从 API 动态获取，这里仅作为后备
static const int vipMonthlyPriceCents = 990;
static const int vipYearlyPriceCents = 6800;
static const String vipMonthlyPriceDisplay = '¥9.9/月';
static const String vipYearlyPriceDisplay = '¥68/年';

// 会员类型 ID 映射（用于从 API 响应匹配旧的 plan 值）
// 实际 ID 从数据库获取，这里仅作为 fallback
static const String vipMonthlyTypeId = 'vip_monthly';
static const String vipYearlyTypeId = 'vip_yearly';
```

### Hardcoded Whitelist (subscription_service.dart line 17)

File: `lib/services/subscription_service.dart`

```dart
static const _vipWhitelist = {'574658218@qq.com'};
```

This email bypasses all subscription checks and is always treated as VIP.

### Hardcoded Supabase Credentials

- `lib/core/constants/app_constants.dart:7–9`:
  ```dart
  static const String supabaseUrl = 'https://wlehkvsxftyxmxelcaps.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_Nz2Ro_4jBthvDwjeQ8m-ww_tT0wYgcF';
  ```

### Hardcoded API Keys

- `lib/core/constants/app_constants.dart:12–14`:
  ```dart
  static const String deepseekApiUrl = 'https://api.deepseek.com/v1/chat/completions';
  static const String deepseekApiKey = 'sk-1923fb07640b45b8a0ab564192810321';
  ```

### VIP Feature Flags (subscription_service.dart lines 108–139)

File: `lib/services/subscription_service.dart`

```dart
bool canUseAiDecompose() {
  if (!isVip) return false;
  final config = currentMemberConfig;
  if (config == null) return true;  // 默认允许 VIP 使用
  return config.aiDecompose;
}

bool canExportData() {
  if (!isVip) return false;
  final config = currentMemberConfig;
  if (config == null) return true;
  return config.dataExport;
}

Future<bool> canCreateProject(int currentActiveCount) async {
  if (isVip) {
    final config = currentMemberConfig;
    if (config == null) return true;
    if (config.maxProjects == -1) return true;
    return currentActiveCount < config.maxProjects;
  }
  return currentActiveCount < AppConstants.freeMaxProjects;  // hardcoded: 3
}

Future<bool> canCreateTask(int currentTaskCountInProject) async {
  if (isVip) {
    final config = currentMemberConfig;
    if (config == null) return true;
    if (config.maxTasks == -1) return true;
    return currentTaskCountInProject < config.maxTasks;
  }
  return currentTaskCountInProject < AppConstants.freeMaxTasksPerProject;  // hardcoded: 50
}
```

### Free Tier Limits (app_constants.dart lines 51–52)

```dart
static const int freeMaxProjects = 3;
static const int freeMaxTasksPerProject = 50;
```

### Hardcoded Plan Values in VIP Page UI

File: `lib/presentation/pages/profile/vip_page.dart`

```dart
// Line 18
SubscriptionPlan _selectedPlan = SubscriptionPlan.vipYearly;

// Lines 169–170 — price display hardcoded via AppConstants
price: AppConstants.vipMonthlyPriceDisplay,   // '¥9.9/月'
price: AppConstants.vipYearlyPriceDisplay,    // '¥68/年'

// Line 192 — pay button hardcoded
_selectedPlan == SubscriptionPlan.vipMonthly ? '¥9.9' : '¥68';
```

### VIP Benefits Hardcoded in UI

File: `lib/presentation/pages/profile/vip_page.dart` lines 118–123:

```dart
final benefits = [
  ('AI智能拆分', 'AI自动将复杂任务拆解为子任务树', Icons.auto_awesome),
  ('数据导出', '导出任务数据为Excel文件', Icons.download),
  ('无限项目', '不限制项目数量（免费版最多3个）', Icons.folder_open),
  ('无限任务', '每个项目不限任务数（免费版最多50个）', Icons.task_alt),
];
```

### VIP Badge Widget (hardcoded colors)

File: `lib/presentation/widgets/vip_badge.dart`

```dart
gradient: LinearGradient(colors: [Color(0xFFFFAB00), Color(0xFFFF6D00)]),
```
The VIP badge color scheme `#FFAB00 → #FF6D00` is hardcoded.

### SubscriptionPlan Enum (user_subscription.dart lines 1–29)

```dart
enum SubscriptionPlan {
  free,
  vipMonthly,   // value: 'vip_monthly'
  vipYearly,    // value: 'vip_yearly'
}
```
Only two paid tiers. No support for arbitrary plan IDs from database.

### WxPusher Hardcoded (app_constants.dart lines 67–68)

```dart
static const String wxpusherAppToken = 'AT_jdaZaaj5CLY9HY4LUJwGTxoLskK5XIa3';
static const int wxpusherAppId = 128230;
```

## VIP Data Flow (UI → Service Layer)

```
VipPage (UI)
  └─> PaymentService.createOrder(plan)
        └─> Supabase.functions.invoke('create-order', {plan})  // Edge Function
  └─> PaymentService.pollOrderStatus(outTradeNo)
        └─> Supabase.functions.invoke('order-status', {out_trade_no})  // Edge Function
  └─> SubscriptionService.refresh()
        └─> Supabase.from('user_subscriptions').select().eq('user_id', userId)  // PostgREST

SubscriptionService.isVip
  └─> checks _vipWhitelist email bypass
  └─> checks _cached.isVip (from user_subscriptions row)

SubscriptionService.currentMemberConfig
  └─> MemberConfigService.instance.getMemberTypeByPlan(plan)
        └─> matches against _memberTypes loaded from Edge Function 'member-config'

MemberConfigService.refresh()
  └─> Supabase.functions.invoke('member-config', GET)
        └─> returns { member_types, discount_codes, recharge_tiers }

AiDecomposeSection (task detail)
  └─> SubscriptionService.instance.canUseAiDecompose()
        └─> checks isVip + config.aiDecompose flag
  └─> TaskDecompositionService.decompose()  // calls DeepSeek API directly
```

### Files with VIP/Member Hardcoded Values

| File | Hardcoded Values |
|---|---|
| `lib/core/constants/app_constants.dart` | Prices (¥9.9/¥68), plan IDs, free limits (3/50), API keys, Supabase URL/key, WxPusher token |
| `lib/services/subscription_service.dart:17` | VIP whitelist email |
| `lib/services/member_config_service.dart` | Cache duration (5 min) — no hardcoded config values (fetches from API) |
| `lib/presentation/pages/profile/vip_page.dart` | Plan selector titles, prices, payment button text, benefits list |
| `lib/presentation/widgets/vip_badge.dart` | Gold gradient colors |
| `lib/presentation/widgets/upgrade_dialog.dart` | No hardcoded values (navigates to VipPage) |

## Caveats / Not Found

- **No `app_constants.dart`-like file** was found with a different name — this is the primary constants file.
- **`lib/services/` files matching keywords**: only `member_config_service.dart` and `subscription_service.dart` matched; no files matched `vip` or `plan` by filename.
- **`vip_types`, `vip_config`** table names used in Flutter code? Not found — Flutter uses `MemberTypeConfig` (in-memory from API), not hardcoded table names.
- The Edge Functions (`member-config`, `create-order`, `order-status`) called by Flutter are **not present** in the repo's `supabase/functions/` directory.
- Free tier limits (3 projects, 50 tasks/project) are hardcoded in `app_constants.dart` and used as fallback when `currentMemberConfig` is null.
