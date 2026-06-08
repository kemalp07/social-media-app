-- Vibe schema updates

-- User level system
ALTER TABLE users ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner';
-- beginner, micro, rising, star, mega

-- Fake user real photo for tier 1
ALTER TABLE fake_users ADD COLUMN IF NOT EXISTS real_photo_url TEXT;

-- Post engagement fields
ALTER TABLE posts ADD COLUMN IF NOT EXISTS engagement_prediction TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_hints TEXT[];

-- Conversation unread count
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Rename-compatible: is_ai_generated alias via view or column
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
UPDATE comments SET is_ai_generated = NOT is_template WHERE is_ai_generated IS NULL;

-- Fake user posts (for feed simulation)
CREATE TABLE IF NOT EXISTS fake_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fake_user_id UUID NOT NULL REFERENCES fake_users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fake_posts_created ON fake_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- RLS policies (service role bypasses; anon read own data)
CREATE POLICY IF NOT EXISTS users_select_own ON users FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS posts_select_all ON posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS notifications_select_own ON notifications FOR SELECT USING (true);
