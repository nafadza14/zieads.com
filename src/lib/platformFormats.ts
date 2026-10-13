/*
  Real on-screen formats for each social platform.
  Shared by the Composer preview and the Calendar feed grid so both
  show posts in the exact shape the platform renders them.
*/

export type PlatformId = 'instagram' | 'tiktok' | 'linkedin' | 'facebook' | 'x' | 'youtube';

export type FormatLayout =
  | 'ig-feed'
  | 'ig-reel'
  | 'tiktok'
  | 'linkedin'
  | 'facebook'
  | 'x'
  | 'youtube';

export interface PlatformFormat {
  id: string;
  /** Short name used in the switcher, e.g. "Feed 4:5". */
  label: string;
  /** Long name used in the caption, e.g. "Instagram feed". */
  name: string;
  /** Ratio label, e.g. "4:5". */
  ratio: string;
  /** Width divided by height. */
  aspect: number;
  width: number;
  height: number;
  layout: FormatLayout;
  /** True when the media fills the whole card (Reels, TikTok). */
  fullBleed?: boolean;
}

const f = (
  id: string,
  label: string,
  name: string,
  ratio: string,
  width: number,
  height: number,
  layout: FormatLayout,
  fullBleed = false,
): PlatformFormat => ({ id, label, name, ratio, width, height, aspect: width / height, layout, fullBleed });

export const PLATFORM_FORMATS: Record<PlatformId, PlatformFormat[]> = {
  instagram: [
    f('ig-feed', 'Feed 4:5', 'Instagram feed', '4:5', 1080, 1350, 'ig-feed'),
    f('ig-square', 'Square 1:1', 'Instagram square', '1:1', 1080, 1080, 'ig-feed'),
    f('ig-reel', 'Reel 9:16', 'Instagram Reel', '9:16', 1080, 1920, 'ig-reel', true),
  ],
  tiktok: [f('tiktok', 'Video 9:16', 'TikTok', '9:16', 1080, 1920, 'tiktok', true)],
  linkedin: [f('linkedin', 'Landscape 1.91:1', 'LinkedIn post', '1.91:1', 1200, 627, 'linkedin')],
  facebook: [
    f('fb-landscape', 'Landscape', 'Facebook post', '1.91:1', 1200, 630, 'facebook'),
    f('fb-portrait', 'Portrait', 'Facebook post', '4:5', 1080, 1350, 'facebook'),
  ],
  x: [f('x', 'Image 16:9', 'X post', '16:9', 1600, 900, 'x')],
  youtube: [f('youtube', 'Video 16:9', 'YouTube video', '16:9', 1280, 720, 'youtube')],
};

/** Profile grid tile shapes (the grid on a profile page, not the post itself). */
export const PROFILE_GRID: Record<'instagram' | 'tiktok', { ratio: string; aspect: number; columns: number; label: string }> = {
  instagram: { ratio: '3:4', aspect: 3 / 4, columns: 3, label: 'Instagram profile grid, 3:4 tiles' },
  tiktok: { ratio: '9:16', aspect: 9 / 16, columns: 3, label: 'TikTok profile grid, 9:16 tiles' },
};

export const isVideoMime = (mime?: string, url?: string) =>
  (!!mime && mime.startsWith('video/')) || (!!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url));

export const formatsFor = (platform?: string): PlatformFormat[] =>
  PLATFORM_FORMATS[(platform as PlatformId) || 'instagram'] || PLATFORM_FORMATS.instagram;

/** Pick the right default: video goes to the vertical format where one exists. */
export const defaultFormatFor = (platform: string | undefined, hasVideo: boolean): PlatformFormat => {
  const list = formatsFor(platform);
  if (hasVideo) {
    const vertical = list.find((x) => x.fullBleed);
    if (vertical) return vertical;
  }
  return list[0];
};

/** "4:5 · 1080 x 1350" style label for placeholders. */
export const sizeLabel = (fmt: PlatformFormat) => `${fmt.ratio} · ${fmt.width} x ${fmt.height}`;

/** "Instagram feed, 4:5 (1080 x 1350)" style caption. */
export const formatCaption = (fmt: PlatformFormat) => `${fmt.name}, ${fmt.ratio} (${fmt.width} x ${fmt.height})`;
