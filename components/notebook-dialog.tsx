"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NOTEBOOK_COLORS, NOTEBOOK_EMOJIS, NotebookColor } from "@/lib/types";

export function NotebookDialog({
  open,
  onOpenChange,
  initialTitle = "",
  initialEmoji = NOTEBOOK_EMOJIS[0],
  initialColor = "thread",
  mode,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
  initialEmoji?: string;
  initialColor?: NotebookColor;
  mode: "create" | "rename";
  onSubmit: (title: string, emoji: string, color: NotebookColor) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [color, setColor] = useState<NotebookColor>(initialColor);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setEmoji(initialEmoji);
      setColor(initialColor);
    }
  }, [open, initialTitle, initialEmoji, initialColor]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Your Notebook" : "Rename Notebook"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "A notebook is a subject — you'll add sub-notebooks like chapters inside it."
              : "Update the title, cover emoji, or spine color."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nb-title">Title</Label>
            <Input
              id="nb-title"
              placeholder="e.g. Physics Notebook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  onSubmit(title, emoji, color);
                  onOpenChange(false);
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cover</Label>
            <div className="flex flex-wrap gap-1.5">
              {NOTEBOOK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors",
                    emoji === e ? "border-thread bg-secondary" : "border-border hover:bg-secondary/60"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Spine color</Label>
            <div className="flex gap-2">
              {(Object.keys(NOTEBOOK_COLORS) as NotebookColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={NOTEBOOK_COLORS[c].label}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-card transition-all",
                    NOTEBOOK_COLORS[c].bg,
                    color === c ? "ring-2 ring-foreground scale-105" : "opacity-80 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              onSubmit(title, emoji, color);
              onOpenChange(false);
            }}
          >
            {mode === "create" ? "Create Notebook" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
