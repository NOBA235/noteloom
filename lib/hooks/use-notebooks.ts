"use client";
import { useCallback, useEffect, useState } from "react";
import { Notebook, NotebookColor } from "@/lib/types";
import * as storage from "@/lib/storage";
import { uid } from "@/lib/utils";

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await storage.getNotebooks();
    setNotebooks(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNotebook = useCallback(
    async (title: string, emoji: string, color: NotebookColor) => {
      const now = Date.now();
      const notebook: Notebook = {
        id: uid("nb"),
        title: title.trim() || "Untitled Notebook",
        emoji,
        color,
        createdAt: now,
        updatedAt: now,
      };
      await storage.saveNotebook(notebook);
      await refresh();
      return notebook;
    },
    [refresh]
  );

  const renameNotebook = useCallback(
    async (id: string, title: string) => {
      const notebook = await storage.getNotebook(id);
      if (!notebook) return;
      await storage.saveNotebook({
        ...notebook,
        title: title.trim() || notebook.title,
        updatedAt: Date.now(),
      });
      await refresh();
    },
    [refresh]
  );

  const deleteNotebookById = useCallback(
    async (id: string) => {
      await storage.deleteNotebook(id);
      await refresh();
    },
    [refresh]
  );

  return { notebooks, loading, createNotebook, renameNotebook, deleteNotebookById, refresh };
}
