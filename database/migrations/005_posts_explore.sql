-- Keşfet: yüksek kalite skorlu kullanıcı postları
ALTER TABLE posts ADD COLUMN IF NOT EXISTS on_explore BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS explore_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_posts_explore
  ON posts (explore_at DESC NULLS LAST)
  WHERE on_explore = TRUE;
