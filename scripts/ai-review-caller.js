#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

function loadEnv() {
  try {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (_) {}
}

loadEnv();

const SYSTEM_PROMPT = 'You are a code-review and reasoning assistant. Be thorough, identify bugs, architectural risks, and concrete fixes. Do not claim to have changed files.';

async function callLocal(prompt, opts = {}) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
  const timeout = opts.timeout || 60000;

  const url = `${baseUrl}/v1/chat/completions`;
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    stream: false,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Ollama ${resp.status}: ${text.slice(0, 500)}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}

async function callStrong(prompt, opts = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set (check .env.local)');
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b';
  const timeout = opts.timeout || 30000;

  const url = `${baseUrl}/chat/completions`;
  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: opts.max_tokens || 1024,
    stream: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`NIM ${resp.status}: ${text.slice(0, 500)}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenrouter(prompt, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set (check .env.local)');
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';
  const fallbackModel = process.env.OPENROUTER_MODEL_FALLBACK || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
  const timeout = opts.timeout || 30000;

  const url = `${baseUrl}/chat/completions`;

  for (const m of [model, fallbackModel]) {
    const body = {
      model: m,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: opts.max_tokens || 1024,
      stream: false,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 404 && m === model) {
          continue;
        }
        throw new Error(`OpenRouter ${resp.status}: ${text.slice(0, 500)}`);
      }
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('OpenRouter: primary and fallback models both failed');
}

const TIER_CALLERS = {
  local: callLocal,
  strong: callStrong,
  openrouter: callOpenrouter,
};

async function callTier(tier, prompt, opts = {}) {
  const caller = TIER_CALLERS[tier];
  if (!caller) throw new Error(`Unknown tier '${tier}'. Valid: ${Object.keys(TIER_CALLERS).join(', ')}`);
  return caller(prompt, opts);
}

const UNCERTAINTY_RE = /(uncertain|not sure|may need|i think|possibly|might be|could not determine|unable to|insufficient|recommend.*(stronger|higher)|escalate)/i;

async function autoEscalate(prompt, opts = {}) {
  const order = opts.order || ['local', 'strong', 'openrouter'];
  const results = [];

  for (const tier of order) {
    try {
      const response = await callTier(tier, prompt, opts);
      const uncertain = UNCERTAINTY_RE.test(response);
      results.push({ tier, response, uncertain });

      if (!uncertain) return { final_tier: tier, response, results };
      if (opts.onEscalate) opts.onEscalate(tier, response);
    } catch (err) {
      results.push({ tier, response: null, error: err.message, uncertain: true });
    }
  }

  return { final_tier: 'final', response: results.find(r => r.response)?.response || '', results };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const tier = args[0];
  const prompt = args.slice(1).join(' ');

  if (!tier || !prompt) {
    console.log('Usage: node ai-review-caller.js <tier|auto> "prompt"');
    console.log('  Tiers: local, strong, openrouter, auto');
    process.exit(0);
  }

  if (tier === 'auto') {
    autoEscalate(prompt, {
      onEscalate: (t) => process.stderr.write(`[escalate] ${t} uncertain, trying next...\n`),
    }).then(result => {
      if (result.final_tier === 'final') {
        console.log('[final] All automated tiers uncertain. Review manually.');
        for (const r of result.results) {
          if (r.response) console.log(`\n[${r.tier}] (uncertain):\n${r.response.slice(0, 500)}`);
        }
      } else {
        console.log(result.response);
      }
    }).catch(e => { console.error(`FATAL: ${e.message}`); process.exit(1); });
  } else {
    callTier(tier, prompt)
      .then(r => console.log(r))
      .catch(e => { console.error(`ERROR: ${e.message}`); process.exit(1); });
  }
}

module.exports = { callTier, autoEscalate, callLocal, callStrong, callOpenrouter, loadEnv };
