export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  tier_level: string;
  total_likes_received: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  like_count: number;
  comment_count: number;
  quality_score: number;
  content_type: string | null;
  is_viral: boolean;
  created_at: string;
  users?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  is_own?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  is_template: boolean;
  created_at: string;
  username?: string;
  avatar_url?: string;
  fake_users?: {
    username: string;
    display_name: string;
    avatar_seed: string;
    tier: number;
  };
}

export interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_fake_user_id?: string;
  post_id?: string;
}

export interface Conversation {
  id: string;
  fake_user_id: string;
  last_message: string | null;
  last_message_at: string;
  started_by: string;
  fake_username?: string;
  fake_avatar_url?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface FakeUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  personality_type?: string;
  interests?: string[];
  is_verified?: boolean;
  follower_count?: number;
  tier: number;
}
