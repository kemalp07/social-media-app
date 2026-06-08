-- User follows for fake characters (run in Neon SQL editor)
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fake_user_id UUID NOT NULL REFERENCES fake_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, fake_user_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_user_id ON follows(user_id);
