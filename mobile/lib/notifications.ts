import { buildFollowerNotification } from '@/lib/localDb';

export function buildFollowNotification(count: number): string {
  if (count <= 0) return 'Yeni takipçilerin var';
  return buildFollowerNotification([], [], count);
}

export function enrichFollowNotification(content: string, totalCount?: number): string {
  if (!content.includes('seni takip etti')) {
    return content;
  }

  // Tier 1 / Tier 2 bildirimleri backend'den @username ile gelir
  if (content.startsWith('@')) {
    return content;
  }

  const singleMatch = content.match(/^(\d+)\s+kişi seni takip etti$/);
  if (singleMatch) {
    return buildFollowNotification(Number(singleMatch[1]));
  }

  const match = content.match(/(\d+)\s+kişi daha/);
  if (match) {
    const total = totalCount ?? Number(match[1]) + 1;
    return buildFollowNotification(total);
  }

  return content;
}
