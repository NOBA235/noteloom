// ---------------------------------------------------------------------------
// Noteloom data model
// Mirrors the spec: Notebook -> SubNotebook -> (Messages, Files, Forensics, Quizzes)
// ---------------------------------------------------------------------------

export type ID = string;

export interface Notebook {
  id: ID;
  title: string;
  emoji: string;
  color: NotebookColor;
  createdAt: number;
  updatedAt: number;
}

export type NotebookColor = "thread" | "manila" | "brick" | "moss";

export interface SubNotebook {
  id: ID;
  notebookId: ID;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type MessageRole = "user" | "assistant";
export type MessageKind = "chat" | "forensics-note" | "quiz-note";

export interface ChatMessage {
  id: ID;
  subNotebookId: ID;
  role: MessageRole;
  content: string;
  kind: MessageKind;
  createdAt: number;
  imageDataUrl?: string; // optional attached image (e.g. photo of wrong work)
}

export interface UploadedFile {
  id: ID;
  subNotebookId: ID;
  name: string;
  mimeType: string;
  size: number;
  textContent?: string; // extracted text (txt/md/pdf)
  dataUrl?: string; // base64 data url, used for images
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Saved YouTube videos — study resources students attach to a sub-notebook.
// ---------------------------------------------------------------------------

export interface SavedVideo {
  id: ID;
  subNotebookId: ID;
  url: string;
  videoId: string;
  title: string;
  channel?: string;
  note?: string; // student's own "why I saved this" note
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Misconception Forensics
// ---------------------------------------------------------------------------

export type ForensicsStatus =
  | "analyzing"
  | "diagnosing"
  | "repaired"
  | "revealed";

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  rationale: string; // shown as feedback after the student answers
}

export interface ForensicsCase {
  id: ID;
  subNotebookId: ID;
  createdAt: number;
  status: ForensicsStatus;

  // Student's submitted evidence
  originalInput: string;
  attachedImageName?: string;

  // Step (a) reasoning reconstruction
  reasoningChain: string[];

  // Step (b) root misconception
  misconceptionTitle: string;
  misconceptionDescription: string;

  // Step (c) side-by-side paths
  yourPath: string[];
  correctPath: string[];

  // Step (d) diagnostic gate
  diagnosticQuestions: DiagnosticQuestion[];
  studentAnswers: (number | null)[];

  // Unlocked only after the gate is passed
  fullExplanation?: string;
  keyTakeaway?: string;
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: ID;
  subNotebookId: ID;
  title: string;
  createdAt: number;
  questions: QuizQuestion[];
  studentAnswers: (number | null)[];
  submitted: boolean;
}

export const NOTEBOOK_COLORS: Record<
  NotebookColor,
  { bg: string; ring: string; label: string }
> = {
  thread: { bg: "bg-thread", ring: "ring-thread", label: "Thread Blue" },
  manila: { bg: "bg-manila", ring: "ring-manila", label: "Manila Gold" },
  brick: { bg: "bg-brick", ring: "ring-brick", label: "Brick Red" },
  moss: { bg: "bg-moss", ring: "ring-moss", label: "Moss Green" },
};

export const NOTEBOOK_EMOJIS = ["📘", "📗", "📙", "📕", "📔", "📓", "🧪", "🔭", "📐", "🧬"];
