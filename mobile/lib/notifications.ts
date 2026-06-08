import { buildFollowerNotification } from '@/lib/localDb';

export function buildFollowNotification(count: number): string {
  if (count <= 0) return 'Yeni takipçilerin var';
  return buildFollowerNotification([], [], count);
}

export function enrichFollowNotification(content: string, totalCount?: number): string {
  if (!content.includes('seni takip etti')) {
    return content;
  }

  const match = content.match(/(\d+)\s+kişi daha/);
  const prefix = content.split(' ve ')[0]?.trim();

  if (prefix && prefix.includes(',')) {
    const names = prefix.split(',').map((n) => n.trim().replace(/^@/, ''));
    const tier3Count = match ? Number(match[1]) : 0;
    return buildFollowerNotification(names.slice(0, 1), names.slice(1, 2), tier3Count);
  }

  if (match) {
    const total = totalCount ?? Number(match[1]) + 1;
    return buildFollowNotification(total);
  }

  return content;
}
