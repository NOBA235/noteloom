import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJSONResponse } from "@/lib/ai";
import {
  buildForensicsAnalyzePrompt,
  buildForensicsRevealPrompt,
} from "@/lib/prompts";

export const runtime = "nodejs";

interface AnalyzeBody {
  phase: "analyze";
  notebookTitle: string;
  subTitle: string;
  notesContext: string;
  chatContext: string;
  originalInput: string;
  imageDataUrl?: string;
}

interface RevealBody {
  phase: "reveal";
  notebookTitle: string;
  subTitle: string;
  notesContext: string;
  originalInput: string;
  misconceptionTitle: string;
  misconceptionDescription: string;
  correctPath: string[];
}

type Body = AnalyzeBody | RevealBody;

interface AnalyzeResult {
  needsMoreInfo: boolean;
  followUpQuestion: string;
  reasoningChain: string[];
  misconceptionTitle: string;
  misconceptionDescription: string;
  yourPath: string[];
  correctPath: string[];
  diagnosticQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    rationale: string;
  }[];
}

interface RevealResult {
  fullExplanation: string;
  keyTakeaway: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (body.phase === "analyze") {
      if (!body.originalInput || !body.originalInput.trim()) {
        return NextResponse.json(
          { error: "originalInput is required to analyze a mistake" },
          { status: 400 }
        );
      }

      const system = buildForensicsAnalyzePrompt({
        notebookTitle: body.notebookTitle,
        subTitle: body.subTitle,
        notesContext: body.notesContext,
        chatContext: body.chatContext,
      });

      const userContent: any[] = [
        { type: "text", text: `The student's submitted wrong work:\n"""\n${body.originalInput}\n"""` },
      ];

      if (body.imageDataUrl) {
        const match = body.imageDataUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
          userContent.push({ type: "image", mediaType: match[1], base64: match[2] });
        }
      }

      const raw = await callAI({
        system,
        messages: [{ role: "user", content: userContent }],
        maxTokens: 1800,
        temperature: 0.5,
        jsonMode: true,
      });

      const parsed = parseJSONResponse<AnalyzeResult>(raw);
      return NextResponse.json(parsed);
    }

    if (body.phase === "reveal") {
      const system = buildForensicsRevealPrompt({
        notebookTitle: body.notebookTitle,
        subTitle: body.subTitle,
        notesContext: body.notesContext,
        originalInput: body.originalInput,
        misconceptionTitle: body.misconceptionTitle,
        misconceptionDescription: body.misconceptionDescription,
        correctPath: body.correctPath,
      });

      const raw = await callAI({
        system,
        messages: [
          {
            role: "user",
            content:
              "The student has passed the diagnostic gate. Reveal the full explanation now, per your instructions.",
          },
        ],
        maxTokens: 1200,
        temperature: 0.5,
        jsonMode: true,
      });

      const parsed = parseJSONResponse<RevealResult>(raw);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "Unknown phase" }, { status: 400 });
  } catch (err: any) {
    console.error("forensics route error", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong running Misconception Forensics." },
      { status: 500 }
    );
  }
}
