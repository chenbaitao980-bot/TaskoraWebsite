-- 002_support_tables.sql
-- 支持表：应用配置、下载链接、支付订单、用户订阅

-- 应用配置表（key-value，用于支付宝等配置）
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 下载链接表
CREATE TABLE IF NOT EXISTS download_links (
  platform TEXT PRIMARY KEY,                       -- 平台标识（android_apk / windows_zip / android_xiaomi / web）
  url TEXT NOT NULL,                               -- 下载链接
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  out_trade_no TEXT NOT NULL UNIQUE,               -- 商户订单号
  user_id TEXT,                                    -- 用户 ID
  plan TEXT NOT NULL,                              -- 会员类型标识
  amount NUMERIC(10,2) NOT NULL,                   -- 金额（元）
  status TEXT NOT NULL DEFAULT 'pending',          -- 状态（pending / paid / closed）
  paid_at TIMESTAMPTZ,                             -- 支付时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户订阅关系表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,                    -- 用户 ID
  plan TEXT NOT NULL DEFAULT 'free',               -- 会员类型标识（兼容旧字段）
  member_type_id UUID REFERENCES member_types(id) ON DELETE SET NULL, -- 会员类型 ID（便于统计）
  status TEXT NOT NULL DEFAULT 'active',           -- 状态（active / expired / cancelled）
  expires_at TIMESTAMPTZ,                          -- 到期时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_support_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 补全 member_types 表（由 001_member_config.sql 创建，此处补 plan 列）
-- plan 列用于与 user_subscriptions.plan 匹配，以及 Edge Function 动态配置
ALTER TABLE member_types ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT '';

CREATE TRIGGER trigger_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tables_updated_at();

CREATE TRIGGER trigger_download_links_updated_at
  BEFORE UPDATE ON download_links
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tables_updated_at();

CREATE TRIGGER trigger_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tables_updated_at();

CREATE TRIGGER trigger_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tables_updated_at();

-- RLS 策略
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 管理员策略
CREATE POLICY "Admins can manage app_config" ON app_config
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage download_links" ON download_links
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage payment_orders" ON payment_orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage user_subscriptions" ON user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 公开读取策略
CREATE POLICY "Anyone can read app_config" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read download_links" ON download_links
  FOR SELECT USING (true);

CREATE POLICY "Users can read own payment_orders" ON payment_orders
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);
