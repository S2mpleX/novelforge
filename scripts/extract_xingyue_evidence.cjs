const fs = require("fs");
const path = require("path");

const bundlePath = path.join(__dirname, "../docs/research/evidence/xingyue_index.js");
const code = fs.readFileSync(bundlePath, "utf-8");

console.log("Bundle byte length:", code.length);

// 1. 查找路由定义
const routeRegex = /path:\s*["']([^"']+)["']/g;
const routes = new Set();
let m;
while ((m = routeRegex.exec(code)) !== null) {
  if (m[1].length < 60 && !m[1].includes(" ")) {
    routes.add(m[1]);
  }
}

// 2. 查找包含关键功能的中文词条及上下文
const keywords = [
  "大纲", "细纲", "正文", "角色", "设定", "续写", "拆书", "世界观", 
  "脑洞", "提示词", "金手指", "词条", "工作流", "知识库", "力量体系",
  "润色", "改写", "扩写", "追问", "书名", "简介"
];

const featureOccurrences = {};
for (const kw of keywords) {
  const matches = (code.match(new RegExp(kw, "g")) || []).length;
  featureOccurrences[kw] = matches;
}

// 3. 提取部分含有特定业务上下文的片段（例如生成器菜单、工具项）
const menuSnippets = [];
const menuRegex = /\{[^}]*name:\s*["'][^"']+["'][^}]*\}/g;
let count = 0;
while ((m = menuRegex.exec(code)) !== null && count < 30) {
  if (m[0].includes("大纲") || m[0].includes("角色") || m[0].includes("写作") || m[0].includes("生成")) {
    menuSnippets.push(m[0]);
    count++;
  }
}

// 4. API 路径特征
const apiRegex = /["'](\/(?:api|v[0-9]|novel|ai|user|prompt)\/[a-zA-Z0-9_\-\/]+)["']/g;
const apis = new Set();
while ((m = apiRegex.exec(code)) !== null) {
  apis.add(m[1]);
}

const report = {
  routes: Array.from(routes),
  featureOccurrences,
  menuSnippets: menuSnippets.slice(0, 15),
  apiEndpoints: Array.from(apis).slice(0, 40)
};

fs.writeFileSync(
  path.join(__dirname, "../docs/research/evidence/xingyue_extracted.json"),
  JSON.stringify(report, null, 2),
  "utf-8"
);

console.log("Analysis completed. Summary:");
console.log("- Routes count:", routes.size);
console.log("- Features found:", featureOccurrences);
console.log("- API Endpoints count:", apis.size);
