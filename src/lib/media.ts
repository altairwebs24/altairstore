/**
 * Store media served from the public "images" storage bucket.
 * Each entry mirrors the `{ url }` shape used across the site.
 */
const SUPABASE_URL =
  import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'] || '';

export function publicImageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/images/${path}`;
}

const media = (file: string) => ({ url: publicImageUrl(`media/${file}`) });

export const logo = media('logo.png');
export const watchBlackDial = media('watch-black-dial.jpg');
export const watchGreenDial = media('watch-green-dial.jpg');
export const watchWhiteDial = media('watch-white-dial.png');
export const boxSkeleton = media('box-skeleton.png');
export const boxSkeletonDesk = media('box-skeleton-desk.png');
export const boxSilverSlim = media('box-silver-slim.png');
export const film01 = media('film-01.mp4');
export const film02 = media('film-02.mp4');
export const film03 = media('film-03.mp4');
