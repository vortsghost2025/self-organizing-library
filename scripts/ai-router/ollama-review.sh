#!/usr/bin/env bash
model="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
prompt="$*"

if [ -z "$prompt" ]; then
  echo "Usage: ollama-review.sh 'your prompt here'"
  echo "Env: OLLAMA_MODEL (default: qwen2.5-coder:7b)"
  exit 1
fi

node -e "
const prompt = process.argv[1];
const body = JSON.stringify({
  model: '$model',
  messages: [
    {role:'system', content:'You are a local code-review assistant. Be concise. Identify bugs, risks, and concrete fixes. Do not claim to have changed files.'},
    {role:'user', content: prompt}
  ],
  stream: false
});
const req = require('http').request({hostname:'127.0.0.1',port:11434,path:'/v1/chat/completions',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{const j=JSON.parse(d);console.log(j.choices[0].message.content)}catch(e){console.error(d);process.exit(2)}});
});
req.on('error',e=>{console.error('Ollama call failed:',e.message);process.exit(2)});
req.write(body);req.end();
" "$prompt"
