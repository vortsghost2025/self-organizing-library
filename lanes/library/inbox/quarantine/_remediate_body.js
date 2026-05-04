const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (entry.name.endsWith(".json") && entry.name !== "heartbeat-library.json") {
      results.push(full);
    }
  }
  return results;
}

const dir = ".";
let fixed = 0;
let skipped = 0;
let errors = 0;

for (const fp of walk(dir)) {
  try {
    const msg = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (msg.body && typeof msg.body === "object") {
      msg.body = JSON.stringify(msg.body);
      msg._remediation = {
        field: "body",
        action: "stringified_object",
        remediated_at: new Date().toISOString()
      };
      fs.writeFileSync(fp, JSON.stringify(msg, null, 2) + "\n");
      fixed++;
      console.log(`FIXED: ${fp}`);
    } else {
      skipped++;
    }
  } catch(e) {
    errors++;
    console.error(`ERROR: ${fp}: ${e.message}`);
  }
}
console.log(`\nbody fix: fixed=${fixed}, skipped=${skipped}, errors=${errors}`);
