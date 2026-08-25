"use client";

// Builds the "AI memory" context strings sent to every API call — this is
// what keeps the tutor scoped strictly to one sub-notebook's uploaded notes
// and chat history instead of the whole app.

import { ChatMessage, SavedVideo, UploadedFile } from "./types";

const MAX_NOTES_CHARS = 12000; // keep prompts reasonably sized
const MAX_HISTORY_MESSAGES = 24;

export function buildNotesContext(files: UploadedFile[], videos: SavedVideo[] = []): string {
  const parts: string[] = [];

  parts.push(
    ...files.map((f) => {
      if (f.textContent && f.textContent.trim().length > 0) {
        return `### File: ${f.name}\n${f.textContent.trim()}`;
      }
      if (f.mimeType.startsWith("image/")) {
        return `### File: ${f.name}\n(An image was uploaded. Its visual content is not transcribed here — if it's relevant right now, treat it as "a photo the student uploaded named ${f.name}".)`;
      }
      return `### File: ${f.name}\n(Uploaded, but no text could be extracted from this file.)`;
    })
  );

  if (videos.length > 0) {
    const videoLines = videos
      .map((v) => `- "${v.title}"${v.channel ? ` (${v.channel})` : ""}${v.note ? ` — student's note: ${v.note}` : ""}`)
      .join("\n");
    parts.push(
      `### Saved YouTube videos in this sub-notebook\n${videoLines}\n(You haven't watched these — you only know their titles/notes above. Reference them by title if relevant, but don't claim to know their content in detail.)`
    );
  }

  if (parts.length === 0) return "";

  let combined = parts.join("\n\n");
  if (combined.length > MAX_NOTES_CHARS) {
    combined = combined.slice(0, MAX_NOTES_CHARS) + "\n\n...(truncated)";
  }
  return combined;
}

export function buildChatContext(messages: ChatMessage[]): string {
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  return recent
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");
}

export function toAnthropicHistory(messages: ChatMessage[]) {
  return messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
