import type { FakeUser, User } from './types';

export type StorySlide = {
  id: string;
  image_url: string;
  created_at: string;
};

export type StoryBundle = {
  key: string;
  fakeUserId?: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isOwn: boolean;
  slides: StorySlide[];
};

const STORY_IMAGES = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3d4fd447?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623066007e?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a209e8?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=800&h=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1400&fit=crop&q=80',
];

export function buildStoryBundles(user: User | null, characters: FakeUser[]): StoryBundle[] {
  const bundles: StoryBundle[] = [];
  const now = new Date().toISOString();

  if (user && (user.post_count ?? 0) > 0) {
    bundles.push({
      key: 'me',
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      isOwn: true,
      slides: [
        {
          id: 'me-0',
          image_url: STORY_IMAGES[0],
          created_at: now,
        },
      ],
    });
  }

  characters.forEach((character, index) => {
    bundles.push({
      key: character.id,
      fakeUserId: character.id,
      username: character.username,
      displayName: character.display_name,
      avatarUrl: character.avatar_url,
      isOwn: false,
      slides: [
        {
          id: `${character.id}-0`,
          image_url: STORY_IMAGES[(index + 1) % STORY_IMAGES.length],
          created_at: now,
        },
      ],
    });
  });

  return bundles;
}

export function findBundleIndex(bundles: StoryBundle[], userId: string): number {
  const index = bundles.findIndex((b) => b.key === userId);
  return index >= 0 ? index : 0;
}
