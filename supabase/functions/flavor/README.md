# AI Flavour — `flavor` edge function

The **🤖 AI FLAVOUR** button on Page VII (Keyword Workshop) sends the current
build to this Supabase Edge Function, which asks a **free** LLM to rewrite the
mechanical description into vivid, rules-consistent prose. The API key lives in a
Supabase secret and never touches the browser.

Until you complete the steps below the button just shows *"AI flavour unavailable
yet"* and the built-in **✨ Flavour Quiz** keeps working — nothing is broken.

---

## What you need to do (one-time, ~10 min)

### 1 · Get a free API key

Pick **one** provider:

| Provider | Where | Free tier | Secret name |
|----------|-------|-----------|-------------|
| **Google Gemini** (default) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Generous, no card | `GEMINI_API_KEY` |
| **Groq** (very fast) | [console.groq.com/keys](https://console.groq.com/keys) | Generous, no card | `GROQ_API_KEY` |

Create an account there and copy the key. *(I can't create the account or handle
the key for you — that part is yours.)*

### 2 · Install the Supabase CLI & log in

```bash
brew install supabase/tap/supabase      # macOS
supabase login                          # opens browser to authorise
```

(Prefer no CLI? See **Dashboard route** below.)

### 3 · Deploy the function & set the secret

Run from the repo root:

```bash
supabase link --project-ref lijzuwwhktgywytbmutf

# Gemini (default):
supabase secrets set GEMINI_API_KEY=your_key_here

# …or Groq instead:
# supabase secrets set AI_PROVIDER=groq GROQ_API_KEY=your_key_here

supabase functions deploy flavor
```

That's it. Reload Page VII and hit **🤖 AI FLAVOUR**.

### Optional tuning

```bash
supabase secrets set AI_MODEL=gemini-2.0-flash        # or gemini-1.5-flash
supabase secrets set AI_MODEL=llama-3.3-70b-versatile # for Groq
```

---

## Dashboard route (no CLI)

1. In the Supabase dashboard → **Edge Functions** → **Deploy a new function**,
   name it `flavor`, and paste the contents of `index.ts`.
2. → **Project Settings → Edge Functions → Secrets**, add `GEMINI_API_KEY`
   (and `AI_PROVIDER=groq` + `GROQ_API_KEY` if using Groq).

---

## Test it directly

```bash
curl -s -X POST \
  'https://lijzuwwhktgywytbmutf.supabase.co/functions/v1/flavor' \
  -H "Authorization: Bearer <anon-key-from-ctg-sync.js>" \
  -H 'content-type: application/json' \
  -d '{"mechanical":"As an Action, you strike and harm with Fire, targeting a target at medium range.","keywords":"Action, Medium Projectile, Damaging, Fire","name":"Ember Comet"}'
# → {"text":"A comet of fire tears from your palm..."}
```

## How the rules stay intact

The client sends the **deterministic mechanical description as ground truth**.
The system prompt (in `index.ts`) forbids the model from changing any element,
target, effect, or number — it may only reflavour. So the prose reads naturally
while the mechanics can't drift.
