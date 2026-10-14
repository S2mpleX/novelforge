const fs = require("fs");
const path = require("path");

const createCode = fs.readFileSync(path.join(__dirname, "../docs/research/evidence/xingyue_workflow_create.js"), "utf-8");
const execCode = fs.readFileSync(path.join(__dirname, "../docs/research/evidence/xingyue_workflow_execute.js"), "utf-8");
const listCode = fs.readFileSync(path.join(__dirname, "../docs/research/evidence/xingyue_workflow_list.js"), "utf-8");

// 提取中文提示词与交互文案
function extractChinesePhrases(code) {
  const matches = code.match(/[\u4e00-\u9fa5]{2,30}/g) || [];
  const freq = {};
  for (const m of matches) {
    freq[m] = (freq[m] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]);
}

console.log("=== CREATE CHUNK TOP PHRASES ===");
console.log(extractChinesePhrases(createCode).slice(0, 30));

console.log("=== EXECUTE CHUNK TOP PHRASES ===");
console.log(extractChinesePhrases(execCode).slice(0, 30));

console.log("=== LIST CHUNK TOP PHRASES ===");
console.log(extractChinesePhrases(listCode).slice(0, 30));
