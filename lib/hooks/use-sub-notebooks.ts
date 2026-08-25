"use client";
import { useCallback, useEffect, useState } from "react";
import { SubNotebook } from "@/lib/types";
import * as storage from "@/lib/storage";
import { uid } from "@/lib/utils";

export function useSubNotebooks(notebookId: string | null) {
  const [subNotebooks, setSubNotebooks] = useState<SubNotebook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!notebookId) {
      setSubNotebooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const all = await storage.getSubNotebooks(notebookId);
    setSubNotebooks(all);
    setLoading(false);
  }, [notebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSubNotebook = useCallback(
    async (title: string) => {
      if (!notebookId) return;
      const now = Date.now();
      const sub: SubNotebook = {
        id: uid("sub"),
        notebookId,
        title: title.trim() || "Untitled Sub-notebook",
        createdAt: now,
        updatedAt: now,
      };
      await storage.saveSubNotebook(sub);
      await refresh();
      return sub;
    },
    [notebookId, refresh]
  );

  const renameSubNotebook = useCallback(
    async (id: string, title: string) => {
      const sub = await storage.getSubNotebook(id);
      if (!sub) return;
      await storage.saveSubNotebook({
        ...sub,
        title: title.trim() || sub.title,
        updatedAt: Date.now(),
      });
      await refresh();
    },
    [refresh]
  );

  const deleteSubNotebook = useCallback(
    async (id: string) => {
      await storage.deleteSubNotebook(id);
      await refresh();
    },
    [refresh]
  );

  return {
    subNotebooks,
    loading,
    createSubNotebook,
    renameSubNotebook,
    deleteSubNotebook,
    refresh,
  };
}
