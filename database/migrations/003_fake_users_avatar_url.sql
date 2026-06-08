-- Backfill DiceBear PNG avatars for existing fake users (run in Neon SQL editor)
UPDATE fake_users
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/png?seed=' || username
WHERE avatar_url IS NULL OR avatar_url = '';
