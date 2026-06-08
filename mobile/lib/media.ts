import { API_URL } from './config';

/** Backend /uploads/... yollarını tam URL'ye çevirir. */
export function getImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return '';
  if (
    url.startsWith('http') ||
    url.startsWith('file://') ||
    url.startsWith('content://') ||
    url.startsWith('ph://')
  ) {
    return url;
  }
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
