import { NextRequest, NextResponse } from "next/server";
import { callAI, AIMessage } from "@/lib/ai";
import { buildTutorSystemPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

interface ChatRequestBody {
  notebookTitle: string;
  subTitle: string;
  notesContext: string;
  history: { role: "user" | "assistant"; content: string }[];
  message: string;
  imageDataUrl?: string; // "data:image/png;base64,...."
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const system = buildTutorSystemPrompt({
      notebookTitle: body.notebookTitle,
      subTitle: body.subTitle,
      notesContext: body.notesContext,
    });

    const messages: AIMessage[] = body.history.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    if (body.imageDataUrl) {
      const match = body.imageDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: body.message },
            { type: "image", mediaType: match[1], base64: match[2] },
          ],
        });
      } else {
        messages.push({ role: "user", content: body.message });
      }
    } else {
      messages.push({ role: "user", content: body.message });
    }

    const reply = await callAI({ system, messages, maxTokens: 1200 });

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("chat route error", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong talking to the AI tutor." },
      { status: 500 }
    );
  }
}
