"use client";
import { useCallback, useEffect, useState } from "react";
import { SavedVideo } from "@/lib/types";
import * as storage from "@/lib/storage";
import { uid } from "@/lib/utils";
import { extractYouTubeId, fetchYouTubeMeta } from "@/lib/youtube";

export function useVideos(subNotebookId: string) {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await storage.getVideos(subNotebookId);
    setVideos(all);
    setLoading(false);
  }, [subNotebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addVideo = useCallback(
    async (url: string, note?: string) => {
      setError(null);
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        setError("That doesn't look like a YouTube link. Paste a full video URL.");
        return null;
      }
      if (videos.some((v) => v.videoId === videoId)) {
        setError("Already saved in this sub-notebook.");
        return null;
      }

      setSaving(true);
      try {
        const meta = await fetchYouTubeMeta(videoId);
        const video: SavedVideo = {
          id: uid("vid"),
          subNotebookId,
          url: url.trim(),
          videoId,
          title: meta?.title || "Untitled video (edit title)",
          channel: meta?.channel,
          note: note?.trim() || undefined,
          createdAt: Date.now(),
        };
        await storage.saveVideo(video);
        await refresh();
        return video;
      } finally {
        setSaving(false);
      }
    },
    [subNotebookId, videos, refresh]
  );

  const renameVideo = useCallback(
    async (videoId: string, title: string) => {
      const video = videos.find((v) => v.id === videoId);
      if (!video) return;
      await storage.saveVideo({ ...video, title: title.trim() || video.title });
      await refresh();
    },
    [videos, refresh]
  );

  const removeVideo = useCallback(
    async (videoId: string) => {
      await storage.deleteVideo(subNotebookId, videoId);
      await refresh();
    },
    [subNotebookId, refresh]
  );

  return { videos, loading, saving, error, addVideo, renameVideo, removeVideo, clearError: () => setError(null) };
}
