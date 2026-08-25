"use client";

// Small helpers for the "save a YouTube video to this sub-notebook" feature.
// No API key needed: we parse the video ID ourselves and use YouTube's public
// oEmbed endpoint (no auth required) to fetch the title/channel when possible.

const ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  for (const pattern of ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  // Allow pasting a bare 11-character video ID too.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function embedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function searchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export interface YouTubeMeta {
  title: string;
  channel?: string;
}

// Best-effort: YouTube's oEmbed endpoint is public and CORS-enabled for
// browser fetches. If it's ever blocked (offline demo, flaky network,
// corporate proxy), we fail soft and let the student type a title instead.
export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl(videoId))}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title as string, channel: data.author_name as string };
  } catch {
    return null;
  }
}
