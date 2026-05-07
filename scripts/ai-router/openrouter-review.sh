#!/usr/bin/env bash
model="${OPENROUTER_MODEL:-nvidia/nemotron-3-super-120b-a12b:free}"
prompt="$*"

if [ -z "$prompt" ]; then
  echo "Usage: openrouter-review.sh 'your prompt here'"
  echo "Env: OPENROUTER_MODEL (default: nvidia/nemotron-3-super-120b-a12b:free)"
  echo " OPENROUTER_API_KEY (required)"
  echo ""
  echo "Free models (no credits needed):"
  echo " nvidia/nemotron-3-super-120b-a12b:free - strong reasoning, 256K ctx (DEFAULT)"
  echo " nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free - reasoning-focused, 256K ctx"
  echo " qwen/qwen3-coder:free - coding specialist, 262K ctx"
  echo " meta-llama/llama-3.3-70b-instruct:free - strong generalist, 65K ctx"
  echo " nousresearch/hermes-3-llama-3.1-405b:free - largest free, 131K ctx"
  echo ""
  echo "Paid models (require credits):"
  echo " anthropic/claude-sonnet-4 - balanced reasoning + speed"
  echo " anthropic/claude-opus-4 - strongest reasoning"
  echo " openai/gpt-4.1 - strong general purpose"
  exit 1
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
  OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env.local 2>/dev/null | cut -d= -f2- | tr -d '[:space:]')
  export OPENROUTER_API_KEY
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "ERROR: OPENROUTER_API_KEY not set and not found in .env.local" >&2
  exit 1
fi

node -e "
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://deliberateensemble.works',
    'X-Title': 'Deliberate Ensemble AI Router',
  },
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: '${model}',
    messages: [
      {role: 'system', content: 'You are a senior code reviewer and architect. Be thorough, identify bugs, security risks, architectural issues, and provide concrete fixes. Prioritize actionable feedback over fluff.'},
      {role: 'user', content: process.argv[1]}
    ],
    temperature: 0.2,
    max_tokens: 2048,
    stream: true,
  });
  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
  process.stdout.write('\n');
}
main().catch(e => { console.error('OpenRouter error:', e.message); process.exit(2); });
" "$prompt"
