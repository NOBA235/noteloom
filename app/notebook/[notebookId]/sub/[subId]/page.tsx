"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileSearch, FileText, MessageSquare, Sparkles, Youtube } from "lucide-react";
import { Notebook, SubNotebook } from "@/lib/types";
import * as storage from "@/lib/storage";
import { buildChatContext } from "@/lib/context";
import { useMessages } from "@/lib/hooks/use-messages";
import { useFiles } from "@/lib/hooks/use-files";
import { useForensics } from "@/lib/hooks/use-forensics";
import { useQuizzes } from "@/lib/hooks/use-quizzes";
import { useVideos } from "@/lib/hooks/use-videos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/chat-panel";
import { FileUpload } from "@/components/file-upload";
import { ForensicsPanel } from "@/components/forensics-panel";
import { QuizPanel } from "@/components/quiz-panel";
import { VideoPanel } from "@/components/video-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark, Wordmark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function SubNotebookPage() {
  const params = useParams<{ notebookId: string; subId: string }>();
  const router = useRouter();
  const { notebookId, subId } = params;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sub, setSub] = useState<SubNotebook | null | undefined>(undefined);
  const [tab, setTab] = useState("chat");

  const { messages, sending, sendMessage, logSystemNote } = useMessages(subId);
  const { files, uploading, uploadFile, removeFile } = useFiles(subId);
  const forensics = useForensics(subId);
  const quiz = useQuizzes(subId);
  const videos = useVideos(subId);

  useEffect(() => {
    (async () => {
      const nb = await storage.getNotebook(notebookId);
      const s = await storage.getSubNotebook(subId);
      setNotebook(nb);
      setSub(s);
    })();
  }, [notebookId, subId]);

  if (sub === null) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-muted-foreground">{"This sub-notebook doesn't exist anymore."}</p>
        <Button className="mt-4" onClick={() => router.push(`/notebook/${notebookId}`)}>
          Back to notebook
        </Button>
      </div>
    );
  }

  const ready = notebook && sub;

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

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link
          href={`/notebook/${notebookId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {notebook ? notebook.title : "Back"}
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold">{sub?.title ?? "Loading…"}</h1>
          <p className="text-sm text-muted-foreground">
            Everything here — chat, notes, quizzes, case files, and saved videos — is scoped to
            this sub-notebook only.
          </p>
        </div>

        {ready && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="chat">
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </TabsTrigger>
              <TabsTrigger value="files">
                <FileText className="h-3.5 w-3.5" /> Notes
              </TabsTrigger>
              <TabsTrigger value="quiz">
                <Sparkles className="h-3.5 w-3.5" /> Quiz
              </TabsTrigger>
              <TabsTrigger value="forensics">
                <FileSearch className="h-3.5 w-3.5" /> Forensics
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Youtube className="h-3.5 w-3.5" /> Videos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="h-[65vh]">
              <ChatPanel
                messages={messages}
                sending={sending}
                notesCount={files.length}
                onSend={(text, imageDataUrl) =>
                  sendMessage(text, {
                    notebook: notebook!,
                    sub: sub!,
                    files,
                    videos: videos.videos,
                    imageDataUrl,
                  })
                }
                onSuggestForensics={() => setTab("forensics")}
              />
            </TabsContent>

            <TabsContent value="files">
              <div className="mx-auto max-w-xl">
                <FileUpload
                  files={files}
                  uploading={uploading}
                  onUpload={uploadFile}
                  onRemove={removeFile}
                />
              </div>
            </TabsContent>

            <TabsContent value="quiz">
              <div className="mx-auto max-w-2xl">
                <QuizPanel
                  quizzes={quiz.quizzes}
                  generating={quiz.generating}
                  onGenerate={() =>
                    quiz.generateQuiz({
                      notebook: notebook!,
                      sub: sub!,
                      files,
                      videos: videos.videos,
                      chatContext: buildChatContext(messages),
                    })
                  }
                  onAnswer={quiz.answerQuestion}
                  onSubmit={quiz.submitQuiz}
                />
              </div>
            </TabsContent>

            <TabsContent value="forensics">
              <div className="mx-auto max-w-3xl">
                <ForensicsPanel
                  cases={forensics.cases}
                  analyzing={forensics.analyzing}
                  revealingId={forensics.revealingId}
                  needsMoreInfoPrompt={forensics.needsMoreInfoPrompt}
                  onDismissNeedsMoreInfo={forensics.dismissNeedsMoreInfo}
                  onAnalyze={async (input, imageDataUrl) => {
                    const kase = await forensics.analyze(input, imageDataUrl, {
                      notebook: notebook!,
                      sub: sub!,
                      files,
                      videos: videos.videos,
                      chatContext: buildChatContext(messages),
                    });
                    if (kase) {
                      logSystemNote(
                        `Ran Misconception Forensics: **${kase.misconceptionTitle}**. Working through the diagnostic repair questions now.`,
                        "forensics-note"
                      );
                    }
                  }}
                  onAnswer={forensics.answerDiagnostic}
                  onReveal={(caseId) =>
                    forensics.reveal(caseId, {
                      notebook: notebook!,
                      sub: sub!,
                      files,
                      videos: videos.videos,
                    })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="mx-auto max-w-4xl">
                <VideoPanel
                  subTitle={sub?.title ?? ""}
                  videos={videos.videos}
                  saving={videos.saving}
                  error={videos.error}
                  onAdd={videos.addVideo}
                  onRename={videos.renameVideo}
                  onRemove={videos.removeVideo}
                  onClearError={videos.clearError}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
