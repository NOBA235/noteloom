"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Search, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const MISTAKE_HINTS = ["got this wrong", "got it wrong", "i got this question wrong", "wrong answer", "marked wrong"];

export function ChatPanel({
  messages,
  sending,
  onSend,
  onSuggestForensics,
  notesCount,
}: {
  messages: ChatMessage[];
  sending: boolean;
  onSend: (text: string, imageDataUrl?: string) => void;
  onSuggestForensics: () => void;
  notesCount: number;
}) {
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const showForensicsHint =
    lastUserMessage &&
    MISTAKE_HINTS.some((h) => lastUserMessage.content.toLowerCase().includes(h)) &&
    messages[messages.length - 1]?.id === lastUserMessage.id;

  const handleSend = () => {
    if (!text.trim() && !imageDataUrl) return;
    onSend(text.trim(), imageDataUrl);
    setText("");
    setImageDataUrl(undefined);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        Scoped to this sub-notebook only — {notesCount} file{notesCount === 1 ? "" : "s"} in memory,
        plus everything said here.
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Sparkles className="mb-3 h-6 w-6 text-thread" />
            <p className="text-sm">Ask anything about this sub-notebook to get started.</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <Avatar tone={m.role === "user" ? "manila" : "thread"}>
              {m.role === "user" ? "You" : "AI"}
            </Avatar>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-thread text-primary-foreground"
                  : "border border-border bg-card"
              )}
            >
              {m.imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imageDataUrl}
                  alt="attachment"
                  className="mb-2 max-h-48 rounded-lg border border-border/50 object-cover"
                />
              )}
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:font-display dark:prose-invert">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <Avatar tone="thread">AI</Avatar>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-thread [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-thread [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-thread" />
            </div>
          </div>
        )}
      </div>

      {showForensicsHint && (
        <button
          onClick={onSuggestForensics}
          className="mb-3 flex items-center justify-between rounded-lg border border-manila/50 bg-manila/10 px-3 py-2.5 text-left text-sm transition-colors hover:bg-manila/20"
        >
          <span>
            Sounds like something went wrong on a problem — want to run{" "}
            <strong>Misconception Forensics</strong> on it?
          </span>
          <span className="ml-2 shrink-0 text-manila underline underline-offset-2">Open</span>
        </button>
      )}

      <div className="space-y-2">
        {imageDataUrl && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="attached" className="h-16 rounded-lg border border-border" />
            <button
              onClick={() => setImageDataUrl(undefined)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
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
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask your tutor about this sub-notebook…"
            className="min-h-[44px] flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" className="shrink-0" onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
