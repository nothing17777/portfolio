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
  'liquid/lfm-2.5-2.6b:free',
  'deepseek/deepseek-chat-v3.1:free',
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'microsoft/phi-3-mini-128k-instruct:free',
];
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Big Pickle is a separate provider (OpenCode Zen, not OpenRouter) with its
// own OpenAI-compatible endpoint and its own API key. It's currently free
// while OpenCode collects feedback on it, but "free" still requires signing
// up for an OpenCode Zen account and billing details to get an API key —
// see https://opencode.ai/docs/zen/. Tried last, and only if a key is set,
// since it needs OPENCODE_API_KEY in the environment (alongside
// OPENROUTER_API_KEY) to do anything.
const OPENCODE_ZEN_URL = 'https://opencode.ai/zen/v1/chat/completions';
const BIG_PICKLE_MODEL = 'big-pickle';

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
  return callChatCompletions(OPENROUTER_URL, process.env.OPENROUTER_API_KEY, model, systemPrompt, message);
}

function callBigPickle(systemPrompt, message) {
  return callChatCompletions(OPENCODE_ZEN_URL, process.env.OPENCODE_API_KEY, BIG_PICKLE_MODEL, systemPrompt, message);
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

  // Every OpenRouter model failed — try Big Pickle on OpenCode Zen as a last
  // resort, but only if it's actually configured.
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
