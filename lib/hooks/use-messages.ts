"use client";
import { useCallback, useEffect, useState } from "react";
import { ChatMessage, Notebook, SavedVideo, SubNotebook, UploadedFile } from "@/lib/types";
import * as storage from "@/lib/storage";
import { uid } from "@/lib/utils";
import { buildChatContext, buildNotesContext } from "@/lib/context";

export function useMessages(subNotebookId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await storage.getMessages(subNotebookId);
    setMessages(all);
    setLoading(false);
  }, [subNotebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendMessage = useCallback(
    async (
      text: string,
      opts: {
        notebook: Notebook;
        sub: SubNotebook;
        files: UploadedFile[];
        videos?: SavedVideo[];
        imageDataUrl?: string;
      }
    ) => {
      if (!text.trim() && !opts.imageDataUrl) return;

      const userMsg: ChatMessage = {
        id: uid("msg"),
        subNotebookId,
        role: "user",
        content: text.trim() || "(sent an image)",
        kind: "chat",
        createdAt: Date.now(),
        imageDataUrl: opts.imageDataUrl,
      };
      await storage.addMessage(userMsg);
      const withUser = [...messages, userMsg];
      setMessages(withUser);
      setSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            notebookTitle: opts.notebook.title,
            subTitle: opts.sub.title,
            notesContext: buildNotesContext(opts.files, opts.videos ?? []),
            history: withUser.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
            message: userMsg.content,
            imageDataUrl: opts.imageDataUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Chat request failed");

        const assistantMsg: ChatMessage = {
          id: uid("msg"),
          subNotebookId,
          role: "assistant",
          content: data.reply,
          kind: "chat",
          createdAt: Date.now(),
        };
        await storage.addMessage(assistantMsg);
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: uid("msg"),
          subNotebookId,
          role: "assistant",
          content: `Sorry — I hit an error talking to the AI provider: ${err.message}. Check your API key in .env.local.`,
          kind: "chat",
          createdAt: Date.now(),
        };
        await storage.addMessage(errorMsg);
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setSending(false);
      }
    },
    [messages, subNotebookId]
  );

  const logSystemNote = useCallback(
    async (content: string, kind: ChatMessage["kind"]) => {
      const note: ChatMessage = {
        id: uid("msg"),
        subNotebookId,
        role: "assistant",
        content,
        kind,
        createdAt: Date.now(),
      };
      await storage.addMessage(note);
      setMessages((prev) => [...prev, note]);
    },
    [subNotebookId]
  );

  return { messages, loading, sending, sendMessage, logSystemNote, refresh };
}
