"use client";
import { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, History, Loader2, Sparkles, XCircle } from "lucide-react";
import { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QuizPanel({
  quizzes,
  generating,
  onGenerate,
  onAnswer,
  onSubmit,
}: {
  quizzes: Quiz[];
  generating: boolean;
  onGenerate: () => void;
  onAnswer: (quizId: string, questionIndex: number, optionIndex: number) => void;
  onSubmit: (quizId: string) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(quizzes[0]?.id ?? null);

  const active = quizzes.find((q) => q.id === activeId) ?? quizzes[0] ?? null;
  const older = quizzes.filter((q) => q.id !== active?.id);

  const score = active
    ? active.questions.filter((q, i) => active.studentAnswers[i] === q.correctIndex).length
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Quiz yourself</h3>
          <p className="text-sm text-muted-foreground">
            {"Generated fresh from this sub-notebook's notes and conversation."}
          </p>
        </div>
        <Button onClick={onGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Writing questions…" : quizzes.length ? "Generate new quiz" : "Generate quiz"}
        </Button>
      </div>

      {!active && !generating && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center text-sm text-muted-foreground">
          No quiz yet — generate one to check your understanding.
        </div>
      )}

      {active && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-display text-base font-semibold">{active.title}</h4>
            {active.submitted && (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {score}/{active.questions.length} correct
              </span>
            )}
          </div>

          <div className="space-y-5">
            {active.questions.map((q, qi) => {
              const selected = active.studentAnswers[qi];
              return (
                <div key={q.id}>
                  <p className="mb-2 text-sm font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isSelected = selected === oi;
                      const isCorrect = oi === q.correctIndex;
                      const showResult = active.submitted;
                      return (
                        <button
                          key={oi}
                          disabled={active.submitted}
                          onClick={() => onAnswer(active.id, qi, oi)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            !showResult && isSelected && "border-thread bg-thread/5",
                            !showResult && !isSelected && "border-border hover:bg-secondary/60",
                            showResult && isCorrect && "border-moss bg-moss/10",
                            showResult && isSelected && !isCorrect && "border-brick bg-brick/10",
                            showResult && !isSelected && !isCorrect && "border-border opacity-60"
                          )}
                        >
                          {showResult ? (
                            isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-moss" />
                            ) : isSelected ? (
                              <XCircle className="h-4 w-4 shrink-0 text-brick" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                            )
                          ) : isSelected ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-thread" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          )}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {active.submitted && (
                    <p className="mt-1.5 pl-1 text-xs text-muted-foreground">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>

          {!active.submitted && (
            <Button
              className="mt-5 w-full"
              disabled={active.studentAnswers.some((a) => a === null)}
              onClick={() => onSubmit(active.id)}
            >
              Submit quiz
            </Button>
          )}
        </Card>
      )}

      {older.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            {older.length} earlier quiz{older.length === 1 ? "" : "zes"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", historyOpen && "rotate-180")} />
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-1.5">
              {older.map((q) => (
                <li key={q.id}>
                  <button
                    onClick={() => setActiveId(q.id)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-secondary/60"
                  >
                    {q.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
