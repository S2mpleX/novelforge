const fs = require("fs");
const path = require("path");

const bundlePath = path.join(__dirname, "../docs/research/evidence/xingyue_index.js");
const code = fs.readFileSync(bundlePath, "utf-8");

// 查找包含 workflow 字段的对象结构或枚举
const regexWorkflow = /workflow[a-zA-Z0-9_]*\s*[:=]\s*\{[^}]{10,200}\}/g;
const wfMatches = [];
let m;
while ((m = regexWorkflow.exec(code)) !== null) {
  wfMatches.push(m[0]);
}

// 查找包含常用模型的字样 (如 deepseek, gpt-4, claude, kimi, qwen 等)
const modelRegex = /(deepseek[-a-zA-Z0-9_]*|claude[-a-zA-Z0-9_.]*|gpt-[0-9a-zA-Z_.-]*|kimi|moonshot|qwen[-a-zA-Z0-9_.]*|glm[-a-zA-Z0-9_.]*)/gi;
const models = new Set();
while ((m = modelRegex.exec(code)) !== null) {
  models.add(m[0].toLowerCase());
}

// 查找工作流相关字段名称 (如 inputs, outputs, nodes, edges, steps)
const wfTerms = ["nodes", "edges", "steps", "params", "variables", "template", "prompt_template"];
const foundTerms = {};
for (const term of wfTerms) {
  const count = (code.match(new RegExp(`["'\`]${term}["'\`]`, "g")) || []).length;
  foundTerms[term] = count;
}

const result = {
  models: Array.from(models),
  wfTerms: foundTerms,
  wfMatches: wfMatches.slice(0, 10)
};

fs.writeFileSync(
  path.join(__dirname, "../docs/research/evidence/xingyue_workflow_details.json"),
  JSON.stringify(result, null, 2),
  "utf-8"
);
console.log("Workflow details extracted:", result);
