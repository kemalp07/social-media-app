export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (secs < 60) return 'şimdi';
  if (mins < 60) return `${mins} dk`;
  if (hours < 24) return `${hours} sa`;
  if (days < 7) return `${days} g`;
  if (weeks < 4) return `${weeks} hf`;
  if (months < 12) return `${months} ay`;
  return `${Math.floor(months / 12)} yıl`;
}
