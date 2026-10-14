import Image from "next/image";

/**
 * Official YouTube mark, sourced without modification from Google's
 * https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png
 *
 * Only use for controls linked to genuine YouTube content or playback.
 * Minimum rendered size here is 24 CSS px (above the audit's 20dp floor).
 */
export function YouTubeBrandIcon({ size = 24 }: { size?: 24 | 32 | 52 | 64 }) {
  return (
    <Image
      src="/youtube-brand-icon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="shrink-0 object-contain"
      unoptimized
    />
  );
}
