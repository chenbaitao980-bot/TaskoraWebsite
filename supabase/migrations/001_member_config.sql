-- 001_member_config.sql
-- 会员配置模块数据库表结构

-- 会员类型表
CREATE TABLE IF NOT EXISTS member_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- 类型名称（例：月度 VIP）
  price NUMERIC(10,2) NOT NULL DEFAULT 0,     -- 价格（元）
  duration_days INTEGER NOT NULL DEFAULT 30,   -- 时长（天）
  
  -- 功能权限
  ai_decompose BOOLEAN NOT NULL DEFAULT true,  -- AI 分解
  data_export BOOLEAN NOT NULL DEFAULT true,   -- 数据导出
  max_projects INTEGER NOT NULL DEFAULT -1,    -- 最大项目数（-1 为无限制）
  max_tasks INTEGER NOT NULL DEFAULT -1,       -- 最大任务数（-1 为无限制）
  
  -- 其他配置
  auto_renew BOOLEAN NOT NULL DEFAULT false,   -- 支持自动续费
  trial_days INTEGER NOT NULL DEFAULT 0,       -- 试用期（天）
  referral_bonus INTEGER NOT NULL DEFAULT 0,   -- 邀请返利比例（0-100）
  
  -- 排序
  sort_order INTEGER NOT NULL DEFAULT 0,       -- 排序（越小越靠前）
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 折扣码表
CREATE TABLE IF NOT EXISTS member_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,                   -- 折扣码（大写）
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 100), -- 折扣比例（80 = 八折）
  type_id UUID REFERENCES member_types(id) ON DELETE SET NULL, -- 适用会员类型（NULL = 全部适用）
  active BOOLEAN NOT NULL DEFAULT true,        -- 是否启用
  used_count INTEGER NOT NULL DEFAULT 0,       -- 已使用次数
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 充值梯度表
CREATE TABLE IF NOT EXISTS member_recharge_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10,2) NOT NULL,               -- 充值金额（元）
  bonus NUMERIC(10,2) NOT NULL DEFAULT 0,      -- 赠送金额（元）
  sort_order INTEGER NOT NULL DEFAULT 0,       -- 排序（越小越靠前）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS member_config_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,                            -- 操作者邮箱
  action TEXT NOT NULL,                        -- 操作类型
  detail TEXT,                                 -- 操作详情
  payload JSONB,                               -- 操作前后的数据
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_member_discount_codes_code ON member_discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_member_discount_codes_active ON member_discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_member_config_logs_created_at ON member_config_logs(created_at DESC);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_member_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_member_types_updated_at
  BEFORE UPDATE ON member_types
  FOR EACH ROW
  EXECUTE FUNCTION update_member_config_updated_at();

CREATE TRIGGER trigger_member_discount_codes_updated_at
  BEFORE UPDATE ON member_discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_member_config_updated_at();

CREATE TRIGGER trigger_member_recharge_tiers_updated_at
  BEFORE UPDATE ON member_recharge_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_member_config_updated_at();

-- RLS 策略（仅管理员可访问）
ALTER TABLE member_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_recharge_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_config_logs ENABLE ROW LEVEL SECURITY;

-- 管理员策略（假设有 admin 角色）
CREATE POLICY "Admins can manage member types" ON member_types
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage discount codes" ON member_discount_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage recharge tiers" ON member_recharge_tiers
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view logs" ON member_config_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 读取策略（Flutter app 可读取会员配置）
CREATE POLICY "Anyone can read active member types" ON member_types
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read active discount codes" ON member_discount_codes
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can read recharge tiers" ON member_recharge_tiers
  FOR SELECT USING (true);
