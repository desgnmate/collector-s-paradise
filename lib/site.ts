export const SITE_NAME = "Collector's Paradise";
export const SITE_URL = 'https://www.collectorsparadise.au';
export const CONTACT_EMAIL = 'hello@collectorsparadise.au';

export const SOCIAL_LINKS = {
  youtube: 'https://www.youtube.com/@collectorsparadise25',
  instagram: 'https://www.instagram.com/collectorsparadise25',
  tiktok: 'https://www.tiktok.com/@collectorsparadi',
} as const;

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}
