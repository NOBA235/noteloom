"use client";
import { useCallback, useEffect, useState } from "react";
import { ForensicsCase, Notebook, SavedVideo, SubNotebook, UploadedFile } from "@/lib/types";
import * as storage from "@/lib/storage";
import { uid } from "@/lib/utils";
import { buildNotesContext } from "@/lib/context";

export function useForensics(subNotebookId: string) {
  const [cases, setCases] = useState<ForensicsCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [needsMoreInfoPrompt, setNeedsMoreInfoPrompt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await storage.getForensicsCases(subNotebookId);
    setCases(all);
    setLoading(false);
  }, [subNotebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const analyze = useCallback(
    async (
      input: string,
      imageDataUrl: string | undefined,
      opts: {
        notebook: Notebook;
        sub: SubNotebook;
        files: UploadedFile[];
        videos?: SavedVideo[];
        chatContext: string;
      }
    ) => {
      setAnalyzing(true);
      setNeedsMoreInfoPrompt(null);
      try {
        const res = await fetch("/api/forensics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phase: "analyze",
            notebookTitle: opts.notebook.title,
            subTitle: opts.sub.title,
            notesContext: buildNotesContext(opts.files, opts.videos ?? []),
            chatContext: opts.chatContext,
            originalInput: input,
            imageDataUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Forensics analysis failed");

        if (data.needsMoreInfo) {
          setNeedsMoreInfoPrompt(data.followUpQuestion || "Can you share the specific problem and the steps you took?");
          return null;
        }

        const kase: ForensicsCase = {
          id: uid("case"),
          subNotebookId,
          createdAt: Date.now(),
          status: "diagnosing",
          originalInput: input,
          reasoningChain: data.reasoningChain || [],
          misconceptionTitle: data.misconceptionTitle || "Misconception identified",
          misconceptionDescription: data.misconceptionDescription || "",
          yourPath: data.yourPath || [],
          correctPath: data.correctPath || [],
          diagnosticQuestions: (data.diagnosticQuestions || []).map((q: any) => ({
            id: uid("q"),
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            rationale: q.rationale,
          })),
          studentAnswers: new Array((data.diagnosticQuestions || []).length).fill(null),
        };
        await storage.saveForensicsCase(kase);
        await refresh();
        return kase;
      } finally {
        setAnalyzing(false);
      }
    },
    [subNotebookId, refresh]
  );

  const answerDiagnostic = useCallback(
    async (caseId: string, questionIndex: number, optionIndex: number) => {
      const all = await storage.getForensicsCases(subNotebookId);
      const kase = all.find((c) => c.id === caseId);
      if (!kase) return;
      if (kase.studentAnswers[questionIndex] !== null) return; // already answered
      const updatedAnswers = [...kase.studentAnswers];
      updatedAnswers[questionIndex] = optionIndex;
      const allAnswered = updatedAnswers.every((a) => a !== null);
      const updated: ForensicsCase = {
        ...kase,
        studentAnswers: updatedAnswers,
        status: allAnswered ? "repaired" : "diagnosing",
      };
      await storage.saveForensicsCase(updated);
      await refresh();
    },
    [subNotebookId, refresh]
  );

  const reveal = useCallback(
    async (
      caseId: string,
      opts: { notebook: Notebook; sub: SubNotebook; files: UploadedFile[]; videos?: SavedVideo[] }
    ) => {
      const all = await storage.getForensicsCases(subNotebookId);
      const kase = all.find((c) => c.id === caseId);
      if (!kase) return;
      setRevealingId(caseId);
      try {
        const res = await fetch("/api/forensics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phase: "reveal",
            notebookTitle: opts.notebook.title,
            subTitle: opts.sub.title,
            notesContext: buildNotesContext(opts.files, opts.videos ?? []),
            originalInput: kase.originalInput,
            misconceptionTitle: kase.misconceptionTitle,
            misconceptionDescription: kase.misconceptionDescription,
            correctPath: kase.correctPath,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reveal failed");

        const updated: ForensicsCase = {
          ...kase,
          status: "revealed",
          fullExplanation: data.fullExplanation,
          keyTakeaway: data.keyTakeaway,
        };
        await storage.saveForensicsCase(updated);
        await refresh();
      } finally {
        setRevealingId(null);
      }
    },
    [subNotebookId, refresh]
  );

  return {
    cases,
    loading,
    analyzing,
    revealingId,
    needsMoreInfoPrompt,
    analyze,
    answerDiagnostic,
    reveal,
    dismissNeedsMoreInfo: () => setNeedsMoreInfoPrompt(null),
    refresh,
  };
}
