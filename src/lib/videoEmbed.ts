/**
 * Normalize Vimeo / YouTube lesson URLs for iframe embedding.
 * Field name in curriculum JSON remains `vimeo_url` for backward compatibility.
 */
export function toVideoEmbedUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Vimeo — already embed
  if (trimmed.includes("player.vimeo.com")) return trimmed;

  // Raw numeric Vimeo ID
  if (/^\d+$/.test(trimmed)) {
    return `https://player.vimeo.com/video/${trimmed}?title=0&byline=0&portrait=0`;
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
  }

  // YouTube — already embed (keep query string for start time etc.)
  if (trimmed.includes("youtube.com/embed/")) return trimmed;

  const ytWatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
  );
  if (ytWatch) {
    return `https://www.youtube.com/embed/${ytWatch[1]}`;
  }

  const ytShort = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShort) {
    return `https://www.youtube.com/embed/${ytShort[1]}`;
  }

  return trimmed;
}
