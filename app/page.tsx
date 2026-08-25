"use client";
import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useNotebooks } from "@/lib/hooks/use-notebooks";
import { NotebookCard } from "@/components/notebook-card";
import { NotebookDialog } from "@/components/notebook-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark, Wordmark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Notebook, NotebookColor } from "@/lib/types";
import { useEffect } from "react";
import * as storage from "@/lib/storage";

export default function DashboardPage() {
  const { notebooks, loading, createNotebook, renameNotebook, deleteNotebookById } =
    useNotebooks();
  const [subCounts, setSubCounts] = useState<Record<string, number>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Notebook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null);

  useEffect(() => {
    (async () => {
      const counts: Record<string, number> = {};
      for (const nb of notebooks) {
        const subs = await storage.getSubNotebooks(nb.id);
        counts[nb.id] = subs.length;
      }
      setSubCounts(counts);
    })();
  }, [notebooks]);

  return (
    <div className="min-h-screen bg-paper-texture">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <Wordmark />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Your Notebook
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold">Your notebooks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every notebook holds sub-notebooks — each one a scoped workspace with its own AI
            tutor, quizzes, and case files for the mistakes you make along the way.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : notebooks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No notebooks yet"
            description="Create your first notebook — one per subject. Physics, Chemistry, whatever you're studying — you'll fill it with sub-notebooks next."
            actionLabel="Create Your Notebook"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                subCount={subCounts[nb.id] ?? 0}
                onRename={() => setRenameTarget(nb)}
                onDelete={() => setDeleteTarget(nb)}
              />
            ))}
          </div>
        )}
      </main>

      <NotebookDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={(title, emoji, color) => createNotebook(title, emoji, color as NotebookColor)}
      />

      {renameTarget && (
        <NotebookDialog
          open={!!renameTarget}
          onOpenChange={(o) => !o && setRenameTarget(null)}
          mode="rename"
          initialTitle={renameTarget.title}
          initialEmoji={renameTarget.emoji}
          initialColor={renameTarget.color}
          onSubmit={(title) => renameNotebook(renameTarget.id, title)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This deletes the notebook and every sub-notebook inside it — chats, files, forensics cases, quizzes, and saved videos. This can't be undone."
        onConfirm={() => deleteTarget && deleteNotebookById(deleteTarget.id)}
      />
    </div>
  );
}
