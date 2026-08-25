"use client";

// ---------------------------------------------------------------------------
// Local persistence layer for Noteloom.
//
// For hackathon-speed reasons Noteloom ships with zero backend: everything
// lives in the browser. Notebooks / sub-notebooks / chat / forensics cases /
// quizzes are stored in localStorage (small, structured, synchronous).
// Uploaded files live in IndexedDB (lib/files-db.ts) since they can be larger.
//
// Swap this module for real API calls (e.g. Supabase) later without touching
// any component — every function here already returns Promises.
// ---------------------------------------------------------------------------

import {
  ChatMessage,
  ForensicsCase,
  Notebook,
  Quiz,
  SavedVideo,
  SubNotebook,
} from "./types";

const KEYS = {
  notebooks: "noteloom_notebooks",
  subnotebooks: "noteloom_subnotebooks",
  messages: (subId: string) => `noteloom_messages_${subId}`,
  forensics: (subId: string) => `noteloom_forensics_${subId}`,
  quizzes: (subId: string) => `noteloom_quizzes_${subId}`,
  videos: (subId: string) => `noteloom_videos_${subId}`,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Notebooks
// ---------------------------------------------------------------------------

export async function getNotebooks(): Promise<Notebook[]> {
  return read<Notebook[]>(KEYS.notebooks, []).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

export async function getNotebook(id: string): Promise<Notebook | null> {
  const all = read<Notebook[]>(KEYS.notebooks, []);
  return all.find((n) => n.id === id) ?? null;
}

export async function saveNotebook(notebook: Notebook): Promise<void> {
  const all = read<Notebook[]>(KEYS.notebooks, []);
  const idx = all.findIndex((n) => n.id === notebook.id);
  if (idx >= 0) all[idx] = notebook;
  else all.push(notebook);
  write(KEYS.notebooks, all);
}

export async function deleteNotebook(id: string): Promise<void> {
  const all = read<Notebook[]>(KEYS.notebooks, []);
  write(
    KEYS.notebooks,
    all.filter((n) => n.id !== id)
  );
  // cascade delete sub-notebooks + their data
  const subs = read<SubNotebook[]>(KEYS.subnotebooks, []);
  const toRemove = subs.filter((s) => s.notebookId === id);
  write(
    KEYS.subnotebooks,
    subs.filter((s) => s.notebookId !== id)
  );
  toRemove.forEach((s) => {
    window.localStorage.removeItem(KEYS.messages(s.id));
    window.localStorage.removeItem(KEYS.forensics(s.id));
    window.localStorage.removeItem(KEYS.quizzes(s.id));
    window.localStorage.removeItem(KEYS.videos(s.id));
  });
}

// ---------------------------------------------------------------------------
// Sub-notebooks
// ---------------------------------------------------------------------------

export async function getSubNotebooks(
  notebookId: string
): Promise<SubNotebook[]> {
  return read<SubNotebook[]>(KEYS.subnotebooks, [])
    .filter((s) => s.notebookId === notebookId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSubNotebook(id: string): Promise<SubNotebook | null> {
  const all = read<SubNotebook[]>(KEYS.subnotebooks, []);
  return all.find((s) => s.id === id) ?? null;
}

export async function saveSubNotebook(sub: SubNotebook): Promise<void> {
  const all = read<SubNotebook[]>(KEYS.subnotebooks, []);
  const idx = all.findIndex((s) => s.id === sub.id);
  if (idx >= 0) all[idx] = sub;
  else all.push(sub);
  write(KEYS.subnotebooks, all);
}

export async function deleteSubNotebook(id: string): Promise<void> {
  const all = read<SubNotebook[]>(KEYS.subnotebooks, []);
  write(
    KEYS.subnotebooks,
    all.filter((s) => s.id !== id)
  );
  window.localStorage.removeItem(KEYS.messages(id));
  window.localStorage.removeItem(KEYS.forensics(id));
  window.localStorage.removeItem(KEYS.quizzes(id));
  window.localStorage.removeItem(KEYS.videos(id));
}

// ---------------------------------------------------------------------------
// Chat messages (the AI's "memory" of a sub-notebook)
// ---------------------------------------------------------------------------

export async function getMessages(subId: string): Promise<ChatMessage[]> {
  return read<ChatMessage[]>(KEYS.messages(subId), []).sort(
    (a, b) => a.createdAt - b.createdAt
  );
}

export async function addMessage(message: ChatMessage): Promise<void> {
  const all = read<ChatMessage[]>(KEYS.messages(message.subNotebookId), []);
  all.push(message);
  write(KEYS.messages(message.subNotebookId), all);
}

// ---------------------------------------------------------------------------
// Forensics cases
// ---------------------------------------------------------------------------

export async function getForensicsCases(
  subId: string
): Promise<ForensicsCase[]> {
  return read<ForensicsCase[]>(KEYS.forensics(subId), []).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function saveForensicsCase(kase: ForensicsCase): Promise<void> {
  const all = read<ForensicsCase[]>(KEYS.forensics(kase.subNotebookId), []);
  const idx = all.findIndex((c) => c.id === kase.id);
  if (idx >= 0) all[idx] = kase;
  else all.unshift(kase);
  write(KEYS.forensics(kase.subNotebookId), all);
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export async function getQuizzes(subId: string): Promise<Quiz[]> {
  return read<Quiz[]>(KEYS.quizzes(subId), []).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  const all = read<Quiz[]>(KEYS.quizzes(quiz.subNotebookId), []);
  const idx = all.findIndex((q) => q.id === quiz.id);
  if (idx >= 0) all[idx] = quiz;
  else all.unshift(quiz);
  write(KEYS.quizzes(quiz.subNotebookId), all);
}

// ---------------------------------------------------------------------------
// Saved YouTube videos
// ---------------------------------------------------------------------------

export async function getVideos(subId: string): Promise<SavedVideo[]> {
  return read<SavedVideo[]>(KEYS.videos(subId), []).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function saveVideo(video: SavedVideo): Promise<void> {
  const all = read<SavedVideo[]>(KEYS.videos(video.subNotebookId), []);
  const idx = all.findIndex((v) => v.id === video.id);
  if (idx >= 0) all[idx] = video;
  else all.unshift(video);
  write(KEYS.videos(video.subNotebookId), all);
}

export async function deleteVideo(subId: string, videoId: string): Promise<void> {
  const all = read<SavedVideo[]>(KEYS.videos(subId), []);
  write(
    KEYS.videos(subId),
    all.filter((v) => v.id !== videoId)
  );
}
