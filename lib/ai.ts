// ---------------------------------------------------------------------------
// AI provider abstraction — server-side only.
//
// Every API route calls `callAI(...)` and never touches a provider's API
// directly. Switch providers with one env var: AI_PROVIDER=gemini|anthropic|openai.
// Defaults to Gemini. No SDK dependency — plain fetch, so there's nothing
// extra to install.
// ---------------------------------------------------------------------------

export type AIContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; base64: string };

export interface AIMessage {
  role: "user" | "assistant";
  content: string | AIContentBlock[];
}

export interface CallAIOptions {
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  // When true, asks the provider's native JSON mode to constrain output
  // (supported by Gemini and OpenAI). Anthropic has no equivalent flag —
  // it relies on the prompt instruction alone, same as before.
  jsonMode?: boolean;
}

export async function callAI(opts: CallAIOptions): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "openai") {
    return callOpenAI(opts);
  }
  if (provider === "anthropic") {
    return callAnthropic(opts);
  }
  return callGemini(opts);
}

// ---------------------------------------------------------------------------
// Gemini (Google) — default provider
// ---------------------------------------------------------------------------

async function callGemini(opts: CallAIOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example) — get a key at https://aistudio.google.com/apikey."
    );
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Gemini uses "model" (not "assistant") for the AI's turns, and
  // inlineData/mimeType (not Anthropic/OpenAI's shape) for images.
  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts:
      typeof m.content === "string"
        ? [{ text: m.content }]
        : m.content.map((block) =>
            block.type === "text"
              ? { text: block.text }
              : { inlineData: { mimeType: block.mediaType, data: block.base64 } }
          ),
  }));

  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.6,
    maxOutputTokens: opts.maxTokens ?? 1500,
  };
  if (opts.jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents,
        generationConfig,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  const candidate = data.candidates?.[0];
  if (!candidate) {
    // Most commonly a safety block — surface something useful rather than
    // a blank reply.
    const blockReason = data.promptFeedback?.blockReason;
    throw new Error(
      blockReason
        ? `Gemini blocked this request (${blockReason}). Try rephrasing.`
        : "Gemini returned no response."
    );
  }

  const text = (candidate.content?.parts || [])
    .filter((p: any) => typeof p.text === "string")
    .map((p: any) => p.text)
    .join("\n");
  return text;
}

// ---------------------------------------------------------------------------
// Anthropic (Claude) — also supported, set AI_PROVIDER=anthropic
// ---------------------------------------------------------------------------

async function callAnthropic(opts: CallAIOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const messages = opts.messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.content.map((block) =>
            block.type === "text"
              ? { type: "text", text: block.text }
              : {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: block.mediaType,
                    data: block.base64,
                  },
                }
          ),
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1500,
      temperature: opts.temperature ?? 0.6,
      system: opts.system,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
  return text;
}

// ---------------------------------------------------------------------------
// OpenAI (GPT) — also supported, set AI_PROVIDER=openai
// ---------------------------------------------------------------------------

async function callOpenAI(opts: CallAIOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const messages = [
    { role: "system", content: opts.system },
    ...opts.messages.map((m) => ({
      role: m.role,
      content:
        typeof m.content === "string"
          ? m.content
          : m.content.map((block) =>
              block.type === "text"
                ? { type: "text", text: block.text }
                : {
                    type: "image_url",
                    image_url: {
                      url: `data:${block.mediaType};base64,${block.base64}`,
                    },
                  }
            ),
    })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1500,
      temperature: opts.temperature ?? 0.6,
      messages,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// JSON helper — the forensics/quiz prompts ask the model to return raw JSON.
// Models occasionally wrap it in ```json fences anyway; strip defensively.
// ---------------------------------------------------------------------------

export function parseJSONResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/^\uFEFF/, "")
    .replace(/```(?:json)?\s*/gi, "")
    .trim();

  const candidates = [cleaned, ...extractJSONValues(cleaned)];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Keep trying; models sometimes add prose before/after the JSON.
    }
  }

  throw new Error(
    "Could not parse AI response as JSON: " + cleaned.slice(0, 300)
  );
}

function extractJSONValues(text: string): string[] {
  const values: string[] = [];

  for (let start = 0; start < text.length; start++) {
    const first = text[start];
    if (first !== "{" && first !== "[") continue;

    const stack = [first === "{" ? "}" : "]"];
    let inString = false;
    let escaped = false;

    for (let i = start + 1; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        stack.push("}");
      } else if (char === "[") {
        stack.push("]");
      } else if (char === stack[stack.length - 1]) {
        stack.pop();

        if (stack.length === 0) {
          values.push(text.slice(start, i + 1));
          break;
        }
      }
    }
  }

  return values;
}
