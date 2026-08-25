import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJSONResponse } from "@/lib/ai";
import { buildQuizPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

interface QuizRequestBody {
  notebookTitle: string;
  subTitle: string;
  notesContext: string;
  chatContext: string;
  questionCount?: number;
}

interface QuizResult {
  title: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuizRequestBody;

    const system = buildQuizPrompt({
      notebookTitle: body.notebookTitle,
      subTitle: body.subTitle,
      notesContext: body.notesContext,
      chatContext: body.chatContext,
      questionCount: body.questionCount ?? 5,
    });

    const raw = await callAI({
      system,
      messages: [
        {
          role: "user",
          content: "Generate the quiz now, per your instructions.",
        },
      ],
      maxTokens: 1800,
      temperature: 0.6,
      jsonMode: true,
    });

    const parsed = parseJSONResponse<QuizResult>(raw);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("quiz route error", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong generating the quiz." },
      { status: 500 }
    );
  }
}
