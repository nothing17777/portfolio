const profileData = require('./profile-data.json');

const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function scoreSection(section, queryWords) {
  const haystack = `${section.title} ${section.tags.join(' ')} ${section.body}`.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (haystack.includes(word)) score += 1;
  }
  return score;
}

function retrieveContext(message) {
  const queryWords = message.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = profileData
    .map((section) => ({ section, score: scoreSection(section, queryWords) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 5);
  const chosen = top.length > 0 ? top : scored.slice(0, 3);

  return chosen.map(({ section }) => `### ${section.title}\n${section.body}`).join('\n\n');
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

  const context = retrieveContext(message);
  const systemPrompt = `You are a helpful assistant answering questions about Tim Zhang's portfolio, based ONLY on the context below. If the context doesn't cover the question, say you don't have that information rather than guessing.\n\n${context}`;

  try {
    const apiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    if (apiRes.status === 429) {
      res.status(200).json({ error: 'This assistant is rate-limited right now — please try again in a minute.' });
      return;
    }

    if (!apiRes.ok) {
      res.status(200).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
      return;
    }

    const data = await apiRes.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      res.status(200).json({ error: 'The assistant could not generate a reply. Please try again.' });
      return;
    }

    res.status(200).json({ reply });
  } catch (err) {
    res.status(200).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
  }
};
