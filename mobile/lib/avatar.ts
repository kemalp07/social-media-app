export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
}

/** React Native Image does not render SVG; DiceBear avatars always use PNG + username seed. */
export function resolveAvatarUri(uri?: string | null, name?: string): string {
  const seed = (name?.trim() || 'default').toLowerCase();
  const trimmed = uri?.trim();

  if (trimmed && !trimmed.includes('dicebear.com')) {
    return trimmed;
  }

  return dicebearUrl(seed);
}
