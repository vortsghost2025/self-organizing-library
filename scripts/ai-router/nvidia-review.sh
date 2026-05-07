#!/usr/bin/env bash
model="${NVIDIA_MODEL:-nvidia/nemotron-3-super-120b-a12b}"
prompt="$*"

if [ -z "$prompt" ]; then
  echo "Usage: nvidia-review.sh 'your prompt here'"
  echo "Env: NVIDIA_MODEL (default: nvidia/nemotron-3-super-120b-a12b)"
  echo " NVIDIA_API_KEY (required)"
  exit 1
fi

if [ -z "$NVIDIA_API_KEY" ]; then
  NVIDIA_API_KEY=$(grep NVIDIA_API_KEY .env.local 2>/dev/null | cut -d= -f2- | tr -d '[:space:]')
  export NVIDIA_API_KEY
fi

if [ -z "$NVIDIA_API_KEY" ]; then
  echo "ERROR: NVIDIA_API_KEY not set and not found in .env.local" >&2
  exit 1
fi

node -e "
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: '${model}',
    messages: [
      {role: 'system', content: 'You are a strong code-review and reasoning assistant. Be thorough, identify bugs, architectural risks, and concrete fixes. Do not claim to have changed files.'},
      {role: 'user', content: process.argv[1]}
    ],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
    stream: true,
  });
  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
  process.stdout.write('\n');
}
main().catch(e => { console.error('NVIDIA NIM error:', e.message); process.exit(2); });
" "$prompt"
