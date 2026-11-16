import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const SYSTEM_PROMPT = `You are JARVIS, a concise, capable personal AI assistant in a local-first GUI inspired by OpenJarvis.
Be helpful, clear, and action-oriented. When relevant, suggest concrete next steps.
If you cannot perform a real-world action (no tools/device access), say so briefly and offer what you can do.`;

function getConfig() {
  const apiKey = process.env.JARVIS_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseURL = (process.env.JARVIS_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.JARVIS_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { apiKey, baseURL, model };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : [];
    const clean = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (clean.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const { apiKey, baseURL, model } = getConfig();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "No AI backend configured",
          hint: "Set JARVIS_API_KEY (or OPENAI_API_KEY), and optionally JARVIS_BASE_URL and JARVIS_MODEL, then restart the dev server.",
        },
        { status: 501 }
      );
    }

    const payload = {
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
      temperature: 0.4,
    };

    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || `Backend error (${res.status})`;
      return NextResponse.json({ error: String(msg) }, { status: 502 });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim?.() || "";
    if (!reply) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 502 });
    }

    return NextResponse.json({ reply, source: "backend", model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
