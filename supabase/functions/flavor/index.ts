// ─────────────────────────────────────────────────────────────────────────
// CTG · Supabase Edge Function: "flavor"
// ─────────────────────────────────────────────────────────────────────────
// Rewrites a Keyword-Workshop ability's MECHANICAL description into vivid,
// rules-consistent flavour prose using a free LLM. The API key lives in a
// Supabase secret and never reaches the browser.
//
// Deploy:   supabase functions deploy flavor
// Secrets:  supabase secrets set GEMINI_API_KEY=...     (default provider)
//     or:   supabase secrets set AI_PROVIDER=groq GROQ_API_KEY=...
// Optional: supabase secrets set AI_MODEL=gemini-2.0-flash
//
// See supabase/functions/flavor/README.md for the full walkthrough.
// ─────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a flavour writer for "Call to Gallahad", a pulpy, anime-inflected action-fantasy tabletop RPG.
Rewrite an ability's MECHANICAL description into 1–2 sentences of vivid, grammatical flavour text — WITHOUT changing what it mechanically does.

Strict rules:
- Never contradict the mechanics. Do not add, remove, or change elements, targets, ranges, damage, durations, conditions, or effects.
- Only reference the element/domain and effects present in the provided keywords. Never introduce a different element (e.g. never mention ice for a fire ability).
- 1–2 sentences, present tense, second person ("you"). Vivid but not overwrought.
- No numbers, dice, stats, or game jargon (no "AP", "d6", "Action", "range", "roll", "check").
- Output ONLY the flavour prose — no preamble, no quotation marks, no markdown.`;

interface Body { mechanical?: string; keywords?: string; name?: string; hints?: string }

// Provider base URLs — overridable for proxies/self-hosting/testing.
// Defaults are the real endpoints, so leaving these unset changes nothing.
const GEMINI_BASE = Deno.env.get("AI_GEMINI_BASE") || "https://generativelanguage.googleapis.com";
const GROQ_BASE = Deno.env.get("AI_GROQ_BASE") || "https://api.groq.com/openai/v1";

function cors(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  };
}

async function callGemini(prompt: string, key: string, model: string): Promise<string> {
  const url = `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 220 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const j = await res.json();
  const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!t) throw new Error("gemini: empty response");
  return String(t).trim();
}

async function callGroq(prompt: string, key: string, model: string): Promise<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      max_tokens: 220,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const j = await res.json();
  const t = j?.choices?.[0]?.message?.content;
  if (!t) throw new Error("groq: empty response");
  return String(t).trim();
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "*";
  const headers = { ...cors(origin), "content-type": "application/json" };

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });
  }

  try {
    const body: Body = await req.json().catch(() => ({}));
    const mechanical = (body.mechanical || "").slice(0, 1200);
    const keywords = (body.keywords || "").slice(0, 600);
    const name = (body.name || "").slice(0, 120);
    const hints = (body.hints || "").slice(0, 400);
    if (!mechanical && !keywords) {
      return new Response(JSON.stringify({ error: "nothing to flavour" }), { status: 400, headers });
    }

    const prompt =
      (name ? `Ability name: ${name}\n` : "") +
      `Keywords: ${keywords || "(none)"}\n` +
      `Mechanical description (ground truth — never change it): ${mechanical || "(none)"}\n` +
      (hints ? `Player's flavour hints: ${hints}\n` : "") +
      `\nWrite the flavour text now.`;

    const provider = (Deno.env.get("AI_PROVIDER") || "gemini").toLowerCase();
    let text: string;
    if (provider === "groq") {
      const key = Deno.env.get("GROQ_API_KEY");
      if (!key) throw new Error("GROQ_API_KEY is not set");
      text = await callGroq(prompt, key, Deno.env.get("AI_MODEL") || "llama-3.3-70b-versatile");
    } else {
      const key = Deno.env.get("GEMINI_API_KEY");
      if (!key) throw new Error("GEMINI_API_KEY is not set");
      text = await callGemini(prompt, key, Deno.env.get("AI_MODEL") || "gemini-2.0-flash");
    }

    // tidy: drop any wrapping quotes / markdown the model may add
    text = text.replace(/^[\s"'`*]+|[\s"'`*]+$/g, "");
    return new Response(JSON.stringify({ text }), { headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
});
