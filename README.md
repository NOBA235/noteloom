# Noteloom

A hierarchical digital notebook system with an AI tutor living inside every sub-notebook — and its signature feature, **Misconception Forensics**: an error-autopsy tool that reconstructs *how* you got a problem wrong before it will tell you the right answer.

```
Notebook (e.g. "Physics")
 └─ Sub-notebook (e.g. "Chapter 1 - Kinematics")     ← the actual workspace
     ├─ Chat with a tutor scoped only to this sub-notebook
     ├─ Uploaded notes (PDF / image / text)
     ├─ AI-generated quiz
     └─ Misconception Forensics ("Case Files")
```

Built for a hackathon: **zero backend required**. Notebooks, chat, quizzes, and forensics cases live in `localStorage`; uploaded files live in `IndexedDB`. The only external calls are to your AI provider.

---

## 1. Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# "gemini" (default), "anthropic", or "openai" — switch providers with this one line
AI_PROVIDER=gemini

GEMINI_API_KEY=...          # free key: https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash

# only needed if you set AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# only needed if you set AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

```bash
npm run dev
```

Open **http://localhost:3000**. That's it — no database, no auth setup, no Supabase project to provision.

> First build/dev run needs internet access once to download the Google Fonts used in the design (Inter, Source Serif 4, IBM Plex Mono). If you're fully offline, swap `app/layout.tsx` to use system fonts.

---

## 2. How the pieces fit together

| Layer | Where | Notes |
|---|---|---|
| Notebooks / Sub-notebooks / Chat / Quizzes / Forensics cases | `lib/storage.ts` (`localStorage`) | Swap this one file for real API calls (e.g. Supabase) later — every function already returns a `Promise`, so no component changes needed. |
| Uploaded files | `lib/files-db.ts` (`IndexedDB` via `idb`) | Kept separate from localStorage since images/PDFs can be a few MB. |
| AI provider | `lib/ai.ts` | One `callAI()` function, no SDK — plain `fetch`. Defaults to Gemini 2.5 Flash; switch to Anthropic or OpenAI with `AI_PROVIDER`. |
| System prompts | `lib/prompts.ts` | Tutor prompt + the 3-phase Forensics prompts + quiz prompt. |
| "AI memory" scoping | `lib/context.ts` | Builds the notes/chat context string sent with every request, built *only* from that sub-notebook's files + messages. |
| API routes | `app/api/{chat,forensics,quiz}/route.ts` | Stateless — the client sends the scoped context each call. |

### Why localStorage instead of Supabase for the MVP
The brief allows either. For a hackathon demo you want to hand someone a link (or a zip) and have it working in under a minute — no Supabase project, schema, or RLS policies to set up first. The data layer is isolated behind `lib/storage.ts` and `lib/files-db.ts` specifically so swapping in Supabase later is a matter of reimplementing those two files, not rewriting the UI.

---

## 3. Misconception Forensics — how the gate actually works

This is the feature the app is built around, so it's enforced by the app logic, not just a prompt asking the model nicely:

1. **Analyze** (`POST /api/forensics`, `phase: "analyze"`) — the model reconstructs the reasoning chain, names the root misconception, builds the "Your Path" vs "Correct Path" comparison, and writes 2–3 diagnostic questions. The prompt explicitly forbids it from stating the final correct answer in this step, and the JSON schema it returns simply *has no field* for a full explanation yet — there's nothing to leak.
2. **Diagnose** — happens entirely client-side. The diagnostic questions' correct answers came back with the analysis, so answering is instant with feedback. The "Unseal full case report" button stays disabled (rendered as a locked stamp) until every question has an answer.
3. **Reveal** (`POST /api/forensics`, `phase: "reveal"`) — only ever called after the gate opens. This is a *separate* model call with its own prompt, so the full explanation genuinely doesn't exist anywhere in the client until this point.

Every case is saved per sub-notebook (`lib/hooks/use-forensics.ts`), and a short note gets logged into the chat history when a case is opened, so the tutor's ordinary chat also has continuity ("earlier you ran Forensics on a sign error in projectile motion...").

---

## 4. Saved videos

Each sub-notebook has a **Videos** tab for keeping YouTube resources next to the notes:

- Paste a link (any YouTube URL format, including `youtu.be` and Shorts) and it's saved with a thumbnail, pulled-in title/channel (via YouTube's public oEmbed endpoint — no API key needed), and an optional "why I saved this" note.
- Click a thumbnail to play it inline without leaving the workspace.
- A "Find videos on YouTube" button opens a search for the sub-notebook's own title, so discovery and saving are one click apart.
- Saved video titles (and notes) are included in the context sent to the tutor, quiz generator, and Forensics — so the AI can reference "the video you saved on X" — but it only ever sees the title/note, never the video's actual content, since nothing about YouTube videos gets transcribed.

This is implemented the same way as everything else: `lib/youtube.ts` (URL parsing + oEmbed), `lib/hooks/use-videos.ts`, `components/video-panel.tsx`, stored via `storage.ts` under its own localStorage key per sub-notebook.

---

## 5. What's simplified for MVP speed (be upfront about this at a hackathon demo)

- **Auth**: none. It's a single-user local app — add Supabase Auth + swap the storage layer for a real production version.
- **PDF text extraction** (`lib/pdf.ts`) is best-effort client-side (`pdfjs-dist`). Text-based PDFs extract fine; scanned/image-only PDFs won't produce text (the file still uploads, and the tutor is told plainly it couldn't read that one).
- **Diagnostic grading**: the client already has the correct answer indices from the analyze step (needed to show instant feedback without another round trip). Fine for a self-study tool; if this became a graded assessment product, grading should move server-side.
- **No streaming**: chat responses come back as a single completion, not token-by-token. Straightforward to add with `stream: true` on either provider if you want it.
- **No collaborative/multi-device sync**: everything is local to one browser. That's the tradeoff for the zero-backend setup above.

---

## 5. Project structure

```
app/
  page.tsx                                 Dashboard — notebooks grid
  notebook/[notebookId]/page.tsx           Sub-notebooks list
  notebook/[notebookId]/sub/[subId]/page.tsx   The workspace (Chat / Notes / Quiz / Forensics tabs)
  api/chat/route.ts
  api/forensics/route.ts
  api/quiz/route.ts
  globals.css                              Design tokens (light + dark)
components/
  ui/                                      Small shadcn-style primitives (button, dialog, tabs, ...)
  chat-panel.tsx
  forensics-panel.tsx                      The Case File board — the signature feature
  quiz-panel.tsx
  file-upload.tsx
  notebook-card.tsx / sub-notebook-card.tsx
lib/
  types.ts                                 Data model
  storage.ts                               localStorage persistence
  files-db.ts                              IndexedDB persistence for files
  ai.ts                                    Gemini / Anthropic / OpenAI switch
  prompts.ts                               All system prompts
  context.ts                               Builds the scoped "AI memory" context
  hooks/                                   One hook per data type
```

---

## 6. Design notes

The visual language leans into the name: **Noteloom** = notes + weaving threads together. The dashboard renders notebooks as spined covers; the tutor uses a thread-blue accent throughout; and Misconception Forensics is styled as an investigation **case file** — reasoning reconstructed on a pinned timeline, a two-column exhibit comparison (your path vs. the correct path), and a report that's visibly **sealed** until the diagnostic questions are answered, then **unseals** with a small flip animation.

Palette: ink navy, warm paper, thread blue (primary), manila gold (Forensics/evidence accent), brick red (misconception flag), moss green (correct/success). Type: Source Serif 4 for headings, Inter for UI, IBM Plex Mono for the case-file labels ("CASE FILE", "EXHIBIT A").
