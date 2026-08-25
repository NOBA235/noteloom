"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, NotebookPen, Plus } from "lucide-react";
import { Notebook, SubNotebook } from "@/lib/types";
import * as storage from "@/lib/storage";
import { useSubNotebooks } from "@/lib/hooks/use-sub-notebooks";
import { SubNotebookCard } from "@/components/sub-notebook-card";
import { SimpleTitleDialog } from "@/components/simple-title-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark, Wordmark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotebookPage() {
  const params = useParams<{ notebookId: string }>();
  const router = useRouter();
  const notebookId = params.notebookId;

  const [notebook, setNotebook] = useState<Notebook | null | undefined>(undefined);
  const { subNotebooks, loading, createSubNotebook, renameSubNotebook, deleteSubNotebook } =
    useSubNotebooks(notebookId);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SubNotebook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubNotebook | null>(null);

  useEffect(() => {
    (async () => {
      const nb = await storage.getNotebook(notebookId);
      setNotebook(nb);
    })();
  }, [notebookId]);

  useEffect(() => {
    (async () => {
      const counts: Record<string, number> = {};
      for (const sub of subNotebooks) {
        const msgs = await storage.getMessages(sub.id);
        counts[sub.id] = msgs.length;
      }
      setMessageCounts(counts);
    })();
  }, [subNotebooks]);

  if (notebook === null) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-muted-foreground">{"This notebook doesn't exist anymore."}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-texture">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={24} />
            <Wordmark className="text-base" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All notebooks
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{notebook?.emoji ?? "📘"}</span>
            <div>
              <h1 className="font-display text-2xl font-semibold">
                {notebook?.title ?? "Loading…"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sub-notebooks are scoped workspaces — chapters, topics, or units.
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Sub-notebook
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : subNotebooks.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No sub-notebooks yet"
            description={`Add your first sub-notebook — e.g. "Chapter 1 - Kinematics" — to open its chat, uploads, quizzes, and Misconception Forensics.`}
            actionLabel="New Sub-notebook"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subNotebooks.map((sub) => (
              <SubNotebookCard
                key={sub.id}
                sub={sub}
                notebookId={notebookId}
                messageCount={messageCounts[sub.id] ?? 0}
                onRename={() => setRenameTarget(sub)}
                onDelete={() => setDeleteTarget(sub)}
              />
            ))}
          </div>
        )}
      </main>

      <SimpleTitleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        dialogTitle="New Sub-notebook"
        dialogDescription={`This becomes a scoped workspace inside "${notebook?.title}" — its own AI tutor, uploads, quizzes, and case files.`}
        label="Title"
        placeholder="e.g. Chapter 1 - Kinematics"
        submitLabel="Create"
        onSubmit={(title) => createSubNotebook(title)}
      />

      {renameTarget && (
        <SimpleTitleDialog
          open={!!renameTarget}
          onOpenChange={(o) => !o && setRenameTarget(null)}
          dialogTitle="Rename Sub-notebook"
          dialogDescription="Update the title."
          label="Title"
          placeholder="e.g. Chapter 1 - Kinematics"
          initialValue={renameTarget.title}
          submitLabel="Save"
          onSubmit={(title) => renameSubNotebook(renameTarget.id, title)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This deletes its chat history, uploaded files, forensics cases, quizzes, and saved videos. This can't be undone."
        onConfirm={() => deleteTarget && deleteSubNotebook(deleteTarget.id)}
      />
    </div>
  );
}
