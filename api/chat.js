const profileData = require('./profile-data.json');

// meta-llama/llama-3.1-8b-instruct:free was retired from OpenRouter's free
// tier since this endpoint was first written. Free-tier models get rate
// limited hard (a handful of requests/min without account credit), so this
// tries a short list of free models in order and, if every one of them is
// down or rate-limited, falls back to returning the retrieved profile
// content directly rather than an error — the assistant should degrade to
// "less polished" before it degrades to "broken."
// Each entry is tried in order; a rate-limited (429), erroring, or
// nonexistent slug is simply skipped in favor of the next one (see the loop
// in the handler below), so it's safe to list more candidates than we've
// individually verified are live right now — OpenRouter adds/retires free
// slugs often enough that "confirmed working" goes stale fast. Check
// https://openrouter.ai/models?max_price=0 for the current free roster if
// this list needs pruning or refreshing later.
const MODELS = [
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
];
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini's OpenAI-compatible endpoint. Ordered cheapest/free-tier-friendly
// first: the *-lite and 2.5 models are free of charge on Gemini's free tier
// (see https://ai.google.dev/gemini-api/docs/pricing). NOTE: as of writing,
// this project's GEMINI_API_KEY gets 403 "project has been denied access"
// on every 3.x model and 404 "no longer available to new users" on every
// 2.x model — that's an account verification/billing issue on Google's
// side (confirmed via `GET /v1beta/models`, which lists these as existing),
// not a wrong model id. Left in place since it'll start working once the
// underlying Google AI Studio project is verified.
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
];

// NVIDIA NIM's OpenAI-compatible endpoint (build.nvidia.com). Its free tier
// grants a pool of API credits for hosted inference, no billing details
// required. These 5 were verified live against this account (many
// candidates are end-of-life or not entitled per-account — checked via
// `GET /v1/models` and a real chat completion, not just existence in a
// model list). Ordered smallest/cheapest first.
// Needs NVIDIA_NIM_API_KEY (from https://build.nvidia.com).
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'mistralai/mistral-nemotron',
  'moonshotai/kimi-k3',
  'minimaxai/minimax-m3',
  'nvidia/nemotron-3-nano-30b-a3b',
];

// Big Pickle is a separate provider (OpenCode Zen, not OpenRouter) with its
// own OpenAI-compatible endpoint and its own API key. It's currently free
// while OpenCode collects feedback on it, but "free" still requires signing
// up for an OpenCode Zen account and billing details to get an API key —
// see https://opencode.ai/docs/zen/. Tried last, and only if a key is set,
// since it needs OPENCODE_API_KEY in the environment (alongside
// OPENROUTER_API_KEY) to do anything.
const OPENCODE_ZEN_URL = 'https://opencode.ai/zen/v1/chat/completions';
const BIG_PICKLE_MODEL = 'big-pickle';

// Groq: also OpenAI-compatible, and its free tier allows far more
// requests/minute than OpenRouter's free models do, so it's tried before
// Big Pickle. Needs GROQ_API_KEY (get one at https://console.groq.com/keys —
// no billing details required for the free tier, unlike OpenCode Zen).
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function scoreSection(section, queryWords) {
  const haystack = `${section.title} ${section.tags.join(' ')} ${section.body}`.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (haystack.includes(word)) score += 1;
  }
  return score;
}

function retrieveSections(message) {
  const queryWords = message.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = profileData
    .map((section) => ({ section, score: scoreSection(section, queryWords) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 5);
  const chosen = top.length > 0 ? top : scored.slice(0, 3);
  return chosen.map((s) => s.section);
}

function contextBlock(sections) {
  return sections.map((section) => `### ${section.title}\n${section.body}`).join('\n\n');
}

// No-LLM fallback: hand back the retrieved section(s) themselves, lightly
// framed, so the visitor still gets a real answer instead of an error.
function extractiveReply(sections) {
  if (sections.length === 0) {
    return "I don't have specifics on that, but feel free to ask about Tim's projects, experience, or background.";
  }
  const top = sections.slice(0, 2);
  const body = top.map((s) => `**${s.title}**\n${s.body}`).join('\n\n');
  return `${body}\n\n_(The AI assistant is at capacity right now, so this is pulled straight from Tim's profile — ask again in a bit for a conversational answer.)_`;
}

async function callChatCompletions(url, apiKey, model, systemPrompt, message) {
  const apiRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    }),
  });

  if (!apiRes.ok) {
    return { ok: false, status: apiRes.status };
  }

  const data = await apiRes.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    return { ok: false, status: apiRes.status };
  }
  return { ok: true, reply };
}

function callModel(model, systemPrompt, message) {
  return callChatCompletions(OPENROUTER_URL, process.env.OPEN_ROUTER_API_KEY, model, systemPrompt, message);
}

function callBigPickle(systemPrompt, message) {
  return callChatCompletions(OPENCODE_ZEN_URL, process.env.OPENCODE_API_KEY, BIG_PICKLE_MODEL, systemPrompt, message);
}

function callGroq(systemPrompt, message) {
  return callChatCompletions(GROQ_URL, process.env.GROQ_API_KEY, GROQ_MODEL, systemPrompt, message);
}

function callGemini(model, systemPrompt, message) {
  return callChatCompletions(GEMINI_URL, process.env.GEMINI_API_KEY, model, systemPrompt, message);
}

function callNvidia(model, systemPrompt, message) {
  return callChatCompletions(NVIDIA_URL, process.env.NVIDIA_NIM_API_KEY, model, systemPrompt, message);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Missing "message" in request body' });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
    return;
  }

  const sections = retrieveSections(message);
  const systemPrompt = `You are a helpful assistant answering questions about Tim Zhang's portfolio, based ONLY on the context below. If the context doesn't cover the question, say you don't have that information rather than guessing.\n\n${contextBlock(sections)}`;

  for (const model of MODELS) {
    try {
      const result = await callModel(model, systemPrompt, message);
      if (result.ok) {
        res.status(200).json({ reply: result.reply });
        return;
      }
      // 429 (rate limited) or a bad/empty response: try the next model.
    } catch (err) {
      // Network error on this model: try the next one.
    }
  }

  // Every OpenRouter model failed — try Gemini next, then NVIDIA NIM, then
  // Groq (much roomier free-tier rate limits), then Big Pickle on OpenCode
  // Zen, each only if configured.
  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const result = await callGemini(model, systemPrompt, message);
        if (result.ok) {
          res.status(200).json({ reply: result.reply });
          return;
        }
      } catch (err) {
        // Try the next Gemini model.
      }
    }
  }

  if (process.env.NVIDIA_NIM_API_KEY) {
    for (const model of NVIDIA_MODELS) {
      try {
        const result = await callNvidia(model, systemPrompt, message);
        if (result.ok) {
          res.status(200).json({ reply: result.reply });
          return;
        }
      } catch (err) {
        // Try the next NVIDIA model.
      }
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const result = await callGroq(systemPrompt, message);
      if (result.ok) {
        res.status(200).json({ reply: result.reply });
        return;
      }
    } catch (err) {
      // Fall through to the next fallback.
    }
  }

  if (process.env.OPENCODE_API_KEY) {
    try {
      const result = await callBigPickle(systemPrompt, message);
      if (result.ok) {
        res.status(200).json({ reply: result.reply });
        return;
      }
    } catch (err) {
      // Fall through to the extractive reply below.
    }
  }

  // Every model failed or was rate-limited — answer from retrieval alone
  // instead of surfacing an error.
  res.status(200).json({ reply: extractiveReply(sections) });
};
