export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
}

/** React Native Image does not render SVG; prefer PNG for DiceBear and fallbacks. */
export function resolveAvatarUri(uri?: string | null, name?: string): string {
  const trimmed = uri?.trim();
  if (trimmed) {
    return trimmed.includes('dicebear.com') && trimmed.includes('/svg?')
      ? trimmed.replace('/svg?', '/png?')
      : trimmed;
  }
  return dicebearUrl(name ?? 'default');
}
