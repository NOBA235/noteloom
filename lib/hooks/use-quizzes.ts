"use client";
import { useCallback, useEffect, useState } from "react";
import { Notebook, Quiz, SavedVideo, SubNotebook, UploadedFile } from "@/lib/types";
import * as storage from "@/lib/storage";
import { uid } from "@/lib/utils";
import { buildNotesContext } from "@/lib/context";

export function useQuizzes(subNotebookId: string) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await storage.getQuizzes(subNotebookId);
    setQuizzes(all);
    setLoading(false);
  }, [subNotebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generateQuiz = useCallback(
    async (opts: {
      notebook: Notebook;
      sub: SubNotebook;
      files: UploadedFile[];
      videos?: SavedVideo[];
      chatContext: string;
    }) => {
      setGenerating(true);
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            notebookTitle: opts.notebook.title,
            subTitle: opts.sub.title,
            notesContext: buildNotesContext(opts.files, opts.videos ?? []),
            chatContext: opts.chatContext,
            questionCount: 5,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Quiz generation failed");

        const quiz: Quiz = {
          id: uid("quiz"),
          subNotebookId,
          title: data.title || "Quiz",
          createdAt: Date.now(),
          questions: (data.questions || []).map((q: any) => ({
            id: uid("qq"),
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })),
          studentAnswers: new Array((data.questions || []).length).fill(null),
          submitted: false,
        };
        await storage.saveQuiz(quiz);
        await refresh();
        return quiz;
      } finally {
        setGenerating(false);
      }
    },
    [subNotebookId, refresh]
  );

  const answerQuestion = useCallback(
    async (quizId: string, questionIndex: number, optionIndex: number) => {
      const all = await storage.getQuizzes(subNotebookId);
      const quiz = all.find((q) => q.id === quizId);
      if (!quiz || quiz.submitted) return;
      const updatedAnswers = [...quiz.studentAnswers];
      updatedAnswers[questionIndex] = optionIndex;
      await storage.saveQuiz({ ...quiz, studentAnswers: updatedAnswers });
      await refresh();
    },
    [subNotebookId, refresh]
  );

  const submitQuiz = useCallback(
    async (quizId: string) => {
      const all = await storage.getQuizzes(subNotebookId);
      const quiz = all.find((q) => q.id === quizId);
      if (!quiz) return;
      await storage.saveQuiz({ ...quiz, submitted: true });
      await refresh();
    },
    [subNotebookId, refresh]
  );

  return { quizzes, loading, generating, generateQuiz, answerQuestion, submitQuiz, refresh };
}
