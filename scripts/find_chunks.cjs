const fs = require("fs");
const path = require("path");

const bundlePath = path.join(__dirname, "../docs/research/evidence/xingyue_index.js");
const code = fs.readFileSync(bundlePath, "utf-8");

const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
const dynImports = [];
let m;
while ((m = dynamicImportRegex.exec(code)) !== null) {
  dynImports.push(m[1]);
}

console.log("Dynamic imports list:\n", dynImports);
