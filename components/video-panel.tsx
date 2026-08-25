"use client";
import { useState } from "react";
import {
  ExternalLink,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Youtube,
} from "lucide-react";
import { SavedVideo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { embedUrl, searchUrl, thumbnailUrl, watchUrl } from "@/lib/youtube";

export function VideoPanel({
  subTitle,
  videos,
  saving,
  error,
  onAdd,
  onRename,
  onRemove,
  onClearError,
}: {
  subTitle: string;
  videos: SavedVideo[];
  saving: boolean;
  error: string | null;
  onAdd: (url: string, note?: string) => void;
  onRename: (id: string, title: string) => void;
  onRemove: (id: string) => void;
  onClearError: () => void;
}) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(videos.length === 0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const submit = () => {
    if (!url.trim()) return;
    onAdd(url.trim(), note.trim() || undefined);
    setUrl("");
    setNote("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Youtube className="h-5 w-5 text-brick" />
            Saved videos
          </h3>
          <p className="text-sm text-muted-foreground">
            Keep topic videos next to your notes — the tutor sees their titles for context, but
            not their content.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={searchUrl(subTitle)} target="_blank" rel="noreferrer">
              <Search className="h-3.5 w-3.5" /> Find videos on YouTube
            </a>
          </Button>
          {videos.length > 0 && (
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" /> Save a video
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="space-y-3 p-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">YouTube URL</label>
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) onClearError();
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <p className="text-xs text-brick">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {"Why you're saving it "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Great visual walkthrough of projectile motion"
              rows={2}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={!url.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving…" : "Save video"}
            </Button>
          </div>
        </Card>
      )}

      {videos.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center text-sm text-muted-foreground">
          {`No videos saved yet — paste a link above or search YouTube for "${subTitle}".`}
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="relative aspect-video bg-ink/5">
                {playingId === v.id ? (
                  <iframe
                    src={`${embedUrl(v.videoId)}?autoplay=1`}
                    title={v.title}
                    className="h-full w-full"
                    allow="accelerate-compute; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    onClick={() => setPlayingId(v.id)}
                    className="group relative h-full w-full"
                    aria-label={`Play ${v.title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl(v.videoId)}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/35">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    </span>
                  </button>
                )}
              </div>

              <div className="p-3.5">
                {editingId === v.id ? (
                  <div className="flex gap-1.5">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRename(v.id, editTitle);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        onRename(v.id, editTitle);
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{v.title}</p>
                    <button
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(v.id);
                        setEditTitle(v.title);
                      }}
                      aria-label="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {v.channel && <p className="mt-0.5 text-xs text-muted-foreground">{v.channel}</p>}
                {v.note && (
                  <p className="mt-1.5 text-xs italic text-muted-foreground">{`"${v.note}"`}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <a
                    href={watchUrl(v.videoId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-thread hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open on YouTube
                  </a>
                  <button
                    onClick={() => onRemove(v.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
