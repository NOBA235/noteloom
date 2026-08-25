"use client";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileSearch,
  History,
  ImagePlus,
  Lock,
  LockOpen,
  Loader2,
  Search,
  Stamp,
  X,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ForensicsCase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ForensicsPanel({
  cases,
  analyzing,
  revealingId,
  needsMoreInfoPrompt,
  onAnalyze,
  onDismissNeedsMoreInfo,
  onAnswer,
  onReveal,
}: {
  cases: ForensicsCase[];
  analyzing: boolean;
  revealingId: string | null;
  needsMoreInfoPrompt: string | null;
  onAnalyze: (input: string, imageDataUrl?: string) => void;
  onDismissNeedsMoreInfo: () => void;
  onAnswer: (caseId: string, questionIndex: number, optionIndex: number) => void;
  onReveal: (caseId: string) => void;
}) {
  const [input, setInput] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [showEntry, setShowEntry] = useState(cases.length === 0);
  const [activeId, setActiveId] = useState<string | null>(cases[0]?.id ?? null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = showEntry ? null : cases.find((c) => c.id === activeId) ?? cases[0] ?? null;
  const older = cases.filter((c) => c.id !== active?.id);

  const submit = () => {
    if (!input.trim()) return;
    onAnalyze(input.trim(), imageDataUrl);
    setInput("");
    setImageDataUrl(undefined);
    setShowEntry(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileSearch className="h-5 w-5 text-brick" />
            Misconception Forensics
          </h3>
          <p className="text-sm text-muted-foreground">
            Submit a wrong solution. The tutor reconstructs how you got there, names the
            misconception, and makes you repair it before it reveals the answer.
          </p>
        </div>
        {cases.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowEntry(true)}>
            + New case
          </Button>
        )}
      </div>

      {needsMoreInfoPrompt && (
        <div className="flex items-start gap-3 rounded-lg border border-manila/50 bg-manila/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-manila" />
          <div className="flex-1">
            <p className="font-medium">The tutor needs a bit more to work with:</p>
            <p className="mt-0.5 text-muted-foreground">{needsMoreInfoPrompt}</p>
          </div>
          <button onClick={onDismissNeedsMoreInfo} aria-label="Dismiss">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {(showEntry || cases.length === 0) && (
        <Card className="space-y-3 p-5">
          <label className="text-sm font-medium">
            Paste your wrong solution, or describe what you got wrong
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`e.g. "For a ball thrown upward at 20 m/s, I said it takes 1s to reach the top because v = gt so t = v/g = 20/10... but the answer key says 2s"`}
            rows={5}
          />
          <div className="flex items-center justify-between">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setImageDataUrl(reader.result as string);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-3.5 w-3.5" /> Attach photo of your work
              </Button>
              {imageDataUrl && (
                <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs text-muted-foreground">
                  photo attached
                  <button onClick={() => setImageDataUrl(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <Button onClick={submit} disabled={!input.trim() || analyzing} variant="destructive">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {analyzing ? "Investigating…" : "Run Forensics"}
            </Button>
          </div>
        </Card>
      )}

      {active && <CaseFile caseData={active} revealing={revealingId === active.id} onAnswer={onAnswer} onReveal={onReveal} />}

      {older.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            {older.length} earlier case{older.length === 1 ? "" : "s"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", historyOpen && "rotate-180")} />
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-1.5">
              {older.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setActiveId(c.id);
                      setShowEntry(false);
                    }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-secondary/60"
                  >
                    {c.misconceptionTitle || "Untitled case"}
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

function CaseFile({
  caseData,
  revealing,
  onAnswer,
  onReveal,
}: {
  caseData: ForensicsCase;
  revealing: boolean;
  onAnswer: (caseId: string, questionIndex: number, optionIndex: number) => void;
  onReveal: (caseId: string) => void;
}) {
  const allAnswered = caseData.studentAnswers.every((a) => a !== null);
  const isRevealed = caseData.status === "revealed";

  return (
    <div className="animate-unseal overflow-hidden rounded-xl border-2 border-ink/10 bg-card">
      {/* Case header */}
      <div className="flex items-center justify-between border-b border-dashed border-border bg-secondary/40 px-5 py-3">
        <span className="font-mono text-xs tracking-widest text-muted-foreground">
          CASE FILE · {new Date(caseData.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider",
            isRevealed ? "bg-moss text-white" : "bg-brick text-white"
          )}
        >
          <Stamp className="h-3 w-3" />
          {isRevealed ? "CASE CLOSED" : "MISCONCEPTION IDENTIFIED"}
        </span>
      </div>

      <div className="space-y-6 p-5">
        {/* Step 1: reasoning reconstruction */}
        <section>
          <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How you got here
          </h4>
          <ol className="space-y-3 border-l-2 border-dashed border-thread/40 pl-4">
            {caseData.reasoningChain.map((step, i) => (
              <li key={i} className="relative animate-pin-drop text-sm leading-relaxed">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-thread bg-card" />
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Step 2: root misconception */}
        <section className="rounded-lg border border-brick/30 bg-brick/5 p-4">
          <h4 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-brick">
            Root misconception
          </h4>
          <p className="font-display text-base font-semibold">{caseData.misconceptionTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{caseData.misconceptionDescription}</p>
        </section>

        {/* Step 3: side-by-side */}
        <section>
          <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exhibit comparison
          </h4>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0 overflow-hidden rounded-lg border border-border">
            <div className="bg-brick/5 p-4">
              <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-brick">
                Exhibit A · Your thinking path
              </p>
              <ol className="space-y-2.5">
                {caseData.yourPath.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-0.5 font-mono text-xs text-brick/70">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div
              className="w-px bg-border"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, hsl(var(--thread)) 0, hsl(var(--thread)) 4px, transparent 4px, transparent 9px)",
              }}
            />
            <div className="bg-moss/5 p-4">
              <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-moss">
                Exhibit B · Correct conceptual path
              </p>
              <ol className="space-y-2.5">
                {caseData.correctPath.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-0.5 font-mono text-xs text-moss/70">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Step 4: diagnostic gate */}
        <section>
          <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Diagnostic repair — answer to unseal the full report
          </h4>
          <div className="space-y-4">
            {caseData.diagnosticQuestions.map((q, qi) => {
              const answered = caseData.studentAnswers[qi];
              return (
                <div key={q.id} className="rounded-lg border border-border p-3.5">
                  <p className="mb-2 text-sm font-medium">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isSelected = answered === oi;
                      const isCorrect = oi === q.correctIndex;
                      const showResult = answered !== null;
                      return (
                        <button
                          key={oi}
                          disabled={answered !== null}
                          onClick={() => onAnswer(caseData.id, qi, oi)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md border px-3 py-1.5 text-left text-sm transition-colors",
                            !showResult && "border-border hover:bg-secondary/60",
                            showResult && isCorrect && "border-moss bg-moss/10",
                            showResult && isSelected && !isCorrect && "border-brick bg-brick/10",
                            showResult && !isSelected && !isCorrect && "border-border opacity-50"
                          )}
                        >
                          {showResult ? (
                            isCorrect ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-moss" />
                            ) : isSelected ? (
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-brick" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                            )
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          )}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answered !== null && (
                    <p className="mt-2 pl-1 text-xs text-muted-foreground">{q.rationale}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 5: sealed / unsealed report */}
        <section>
          {!isRevealed ? (
            <div
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center",
                allAnswered ? "border-manila bg-manila/5" : "border-border bg-secondary/30"
              )}
            >
              {allAnswered ? (
                <LockOpen className="h-5 w-5 text-manila" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {allAnswered ? "Diagnostics complete — ready to unseal" : "Full report sealed"}
              </p>
              <p className="text-xs text-muted-foreground">
                {allAnswered
                  ? "You've worked through the repair questions above."
                  : "Answer every diagnostic question above to unlock the full explanation."}
              </p>
              {allAnswered && (
                <Button
                  variant="manila"
                  className="mt-1"
                  onClick={() => onReveal(caseData.id)}
                  disabled={revealing}
                >
                  {revealing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
                  {revealing ? "Unsealing…" : "Unseal full case report"}
                </Button>
              )}
            </div>
          ) : (
            <div className="animate-unseal rounded-lg border border-moss/30 bg-moss/5 p-4">
              <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-moss">
                Full case report
              </h4>
              <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-display dark:prose-invert">
                <ReactMarkdown>{caseData.fullExplanation || ""}</ReactMarkdown>
              </div>
              {caseData.keyTakeaway && (
                <div className="mt-3 rounded-md bg-moss/10 px-3 py-2 text-sm font-medium text-moss">
                  Key takeaway: {caseData.keyTakeaway}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
