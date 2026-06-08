-- Vibe App - Initial Schema
-- Run in Neon PostgreSQL SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Real users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    tier_level VARCHAR(20) DEFAULT 'free', -- free | premium
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    total_likes_received INTEGER DEFAULT 0,
    fcm_token TEXT,
    daily_posts_used INTEGER DEFAULT 0,
    daily_dms_used INTEGER DEFAULT 0,
    last_daily_reset DATE DEFAULT CURRENT_DATE
);

-- Fake users (bots)
CREATE TABLE fake_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50),
    avatar_seed VARCHAR(50) NOT NULL,
    tier SMALLINT NOT NULL CHECK (tier IN (1, 2, 3)),
    is_open BOOLEAN DEFAULT FALSE,
    personality_type VARCHAR(50),
    interests TEXT[],
    bio TEXT,
    follower_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fake_users_tier ON fake_users(tier);
CREATE INDEX idx_fake_users_tier_open ON fake_users(tier, is_open);

-- Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    quality_score DECIMAL(3,1) DEFAULT 5.0,
    content_type VARCHAR(30), -- selfie, food, landscape, sport, other
    keywords TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_viral BOOLEAN DEFAULT FALSE,
    location VARCHAR(100),
    target_like_count INTEGER DEFAULT 0,
    likes_delivered INTEGER DEFAULT 0,
    follower_gain INTEGER DEFAULT 0
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Scheduled likes (drip delivery)
CREATE TABLE scheduled_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    fake_user_id UUID NOT NULL REFERENCES fake_users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_likes_pending ON scheduled_likes(scheduled_at) WHERE delivered = FALSE;

-- Likes (delivered)
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    fake_user_id UUID NOT NULL REFERENCES fake_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, fake_user_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    fake_user_id UUID NOT NULL REFERENCES fake_users(id),
    content TEXT NOT NULL,
    is_template BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- Comment templates pool
CREATE TABLE comment_templates (
    id SERIAL PRIMARY KEY,
    category VARCHAR(30) NOT NULL, -- general, selfie, food, landscape, sport
    content TEXT NOT NULL
);

-- Conversations (DM)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    real_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fake_user_id UUID NOT NULL REFERENCES fake_users(id),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    started_by VARCHAR(10) NOT NULL CHECK (started_by IN ('user', 'ai')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(real_user_id, fake_user_id)
);

CREATE INDEX idx_conversations_user ON conversations(real_user_id, last_message_at DESC);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- like, comment, dm, follow, mention, milestone, viral
    from_fake_user_id UUID REFERENCES fake_users(id),
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- Milestones
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- followers_100, likes_1k, sponsor_offer, etc.
    reached_at TIMESTAMPTZ DEFAULT NOW(),
    reward TEXT,
    UNIQUE(user_id, type)
);

-- Passive follower growth tracking
CREATE TABLE follower_growth_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL, -- passive, post_quality, viral
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium viral boost usage
CREATE TABLE viral_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (basic - service role bypasses)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
