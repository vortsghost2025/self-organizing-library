#!/usr/bin/env bash
model="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
ollama_host="${OLLAMA_HOST:-100.95.40.99:11434}"
ollama_host="${ollama_host#http://}"
ollama_host="${ollama_host#https://}"
local_host="127.0.0.1:11434"
prompt="$*"

if [ -z "$prompt" ]; then
  echo "Usage: ollama-review.sh 'your prompt here'"
  echo "Env: OLLAMA_MODEL (default: qwen2.5-coder:7b)"
echo " OLLAMA_HOST (default: 100.95.40.99:11434, fallback: 127.0.0.1:11434)"
  exit 1
fi

hostname="${ollama_host%%:*}"
port="${ollama_host##*:}"

node -e "
const prompt = process.argv[1];
const hostname = process.argv[2];
const port = parseInt(process.argv[3], 10);
const model = process.argv[4];
const body = JSON.stringify({
  model: model,
  messages: [
    {role:'system', content:'You are a local code-review assistant. Be concise. Identify bugs, risks, and concrete fixes. Do not claim to have changed files.'},
    {role:'user', content: prompt}
  ],
  stream: false
});
const tryHost = (h, p) => new Promise((resolve, reject) => {
  const req = require('http').request({hostname:h, port:p, path:'/v1/chat/completions', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{const j=JSON.parse(d);resolve(j.choices[0].message.content)}catch(e){reject(new Error(d))}});
  });
  req.on('error',e=>reject(e));
  req.setTimeout(120000,()=>{req.destroy();reject(new Error('timeout'))});
  req.write(body);req.end();
});
tryHost(hostname, port)
  .then(r=>{console.log(r);process.exit(0)})
 .catch(e1=>{
 if(hostname!=='127.0.0.1'){
 console.error('VPS Ollama failed ('+e1.message+'), trying local Windows Ollama...');
 tryHost('127.0.0.1',11434)
        .then(r=>{console.log(r);process.exit(0)})
        .catch(e2=>{console.error('Local Ollama also failed:',e2.message);process.exit(2)});
    } else {
      console.error('Ollama call failed:',e1.message);process.exit(2);
    }
  });
" "$prompt" "$hostname" "$port" "$model"
