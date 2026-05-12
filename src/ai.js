import Anthropic from '@anthropic-ai/sdk';
import { spawnSync } from 'child_process';

let _client;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const SYSTEM_PROMPT = `You are an expert git commit message writer following the Conventional Commits specification.

Format: <type>(<optional scope>): <short description>

Types: feat, fix, docs, style, refactor, perf, test, chore, ci, revert, build
Breaking changes: append ! after type or scope — e.g. feat!: or feat(api)!:

Rules:
- First line max 72 characters
- Imperative mood: "add feature" not "added feature" or "adds feature"
- Lowercase, no trailing period
- Be specific: mention WHAT changed, not just "update" or "fix"
- Scope should be a noun describing the section of code (e.g. auth, api, ui, db)`;

const MODEL_ALIASES = {
  haiku:  'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-6',
  opus:   'claude-opus-4-7',
};

export async function generateSuggestions(diff, opts = {}) {
  const {
    count   = 3,
    emoji   = false,
    lang    = 'en',
    type    = null,
    model   = 'claude-haiku-4-5',
    history = [],
  } = opts;

  const extras = [];
  if (type)          extras.push(`- You MUST use commit type: ${type}`);
  if (emoji)         extras.push('- Prefix the description with a relevant gitmoji');
  if (lang !== 'en') extras.push(`- Write the description in ${lang} language`);

  const historySection = history.length
    ? `\nRecent commits in this repo (match their style):\n${history.map(h => `• ${h}`).join('\n')}`
    : '';

  const extraSection = extras.length ? `\nConstraints:\n${extras.join('\n')}` : '';
  const template     = Array.from({ length: count }, (_, i) => `${i + 1}. <message>`).join('\n');

  const userPrompt =
    `Generate exactly ${count} commit message suggestion${count > 1 ? 's' : ''} for this staged diff.` +
    extraSection + historySection +
    `\n\nRespond with ONLY a numbered list — no intro, no explanation:\n${template}` +
    `\n\nMake each suggestion meaningfully different (vary type, scope, or wording).\n\n<diff>\n${diff.slice(0, 14000)}\n</diff>`;

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const raw = hasApiKey
    ? await generateWithSDK(userPrompt, MODEL_ALIASES[model] || model)
    : generateWithCLI(`${SYSTEM_PROMPT}\n\n${userPrompt}`);

  return parseSuggestions(raw, count);
}

// ── Direct Anthropic API (requires ANTHROPIC_API_KEY) ─────────────────────

async function generateWithSDK(prompt, model) {
  const response = await getClient().messages.create({
    model,
    max_tokens: 512,
    system: [
      {
        type:          'text',
        text:          SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content.find(b => b.type === 'text')?.text ?? '';
}

// ── Claude Code CLI (requires claude CLI, no API key needed) ──────────────

function generateWithCLI(prompt) {
  const result = spawnSync('claude', ['-p', prompt], {
    encoding:  'utf-8',
    maxBuffer: 2 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      'No ANTHROPIC_API_KEY found and claude CLI is not available.\n' +
      '  Option 1: Set ANTHROPIC_API_KEY (console.anthropic.com)\n' +
      '  Option 2: Install Claude Code (claude.ai/code)',
    );
  }

  return result.stdout;
}

// ── Parser ────────────────────────────────────────────────────────────────

function parseSuggestions(text, expected) {
  const suggestions = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\d+[.)]\s+(.+)$/);
    if (m) suggestions.push(m[1].trim());
  }
  if (!suggestions.length) {
    return text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, expected);
  }
  return suggestions.slice(0, expected);
}
