-- 003_vip_whitelist.sql
-- VIP 白名单豁免表

CREATE TABLE IF NOT EXISTS vip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_vip_whitelist_email ON vip_whitelist(email);

-- 自动更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_vip_whitelist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vip_whitelist_updated_at
  BEFORE UPDATE ON vip_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_vip_whitelist_updated_at();

-- RLS 策略
ALTER TABLE vip_whitelist ENABLE ROW LEVEL SECURITY;

-- 管理员有完全权限（user_metadata->>'role' = 'admin'）
CREATE POLICY "Admins can manage vip_whitelist" ON vip_whitelist
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Flutter 客户端（通过 email 匹配）只能查询自己的行
CREATE POLICY "Users can read own whitelist entry" ON vip_whitelist
  FOR SELECT USING (email = (auth.jwt() ->> 'email'));

-- 自动迁移：插入硬编码白名单邮箱
INSERT INTO vip_whitelist (email, note)
VALUES ('574658218@qq.com', '硬编码迁移')
ON CONFLICT (email) DO NOTHING;
