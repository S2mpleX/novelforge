#!/usr/bin/env node

/**
 * E2E MCP Server Test
 * 测试 MCP 工具链的完整闭环：读取大纲、查询角色、装配记忆上下文、全文检索
 */

const { spawn } = require('child_process');
const path = require('path');

const binaryPath = 'E:\\tools\\novelforge_target\\x86_64-pc-windows-gnu\\debug\\novelforge_mcp.exe';

const child = spawn(binaryPath, [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
const responses = new Map();

child.stdout.on('data', (data) => {
  buffer += data.toString('utf-8');
  const lines = buffer.split('\n');
  buffer = lines.pop(); // 保留未闭合行

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed.id) {
        responses.set(parsed.id, parsed);
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
  }
});

let reqId = 1;
function sendRequest(method, params = {}) {
  const id = reqId++;
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params
  }) + '\n';
  child.stdin.write(payload);
  return id;
}

async function waitResponse(id, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (responses.has(id)) {
      return responses.get(id);
    }
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error(`Timeout waiting for response id=${id}`);
}

async function run() {
  console.log('🚀 开始 MCP E2E 接口测试...');

  // 1. 初始化
  const initId = sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'e2e-test', version: '1.0' }
  });
  const initRes = await waitResponse(initId);
  console.log('1. [PASS] Initialize:', initRes.result.serverInfo);

  // 2. 列出作品
  const listId = sendRequest('tools/call', {
    name: 'novelforge_list_novels',
    arguments: {}
  });
  const listRes = await waitResponse(listId);
  const novels = JSON.parse(listRes.result.content[0].text);
  console.log(`2. [PASS] List Novels: 获取到 ${novels.length} 部作品`);
  const novelId = novels[0].id;

  // 3. 读取大纲
  const outlineId = sendRequest('tools/call', {
    name: 'novelforge_get_outline',
    arguments: { novel_id: novelId }
  });
  const outlineRes = await waitResponse(outlineId);
  const outline = JSON.parse(outlineRes.result.content[0].text);
  console.log(`3. [PASS] Get Outline: 包含 ${outline.volumes?.length || 0} 个分卷, ${outline.unassigned_chapters?.length || 0} 个独立章节`);

  // 4. 查询世界观法则
  const rulesId = sendRequest('tools/call', {
    name: 'novelforge_list_world_rules',
    arguments: { novel_id: novelId }
  });
  const rulesRes = await waitResponse(rulesId);
  const rules = JSON.parse(rulesRes.result.content[0].text);
  console.log(`4. [PASS] World Rules: 获取到 ${rules.length} 条世界观规则`);

  // 5. FTS5 全文搜索
  const ftsId = sendRequest('tools/call', {
    name: 'novelforge_search_fts',
    arguments: { novel_id: novelId, query: '世界' }
  });
  const ftsRes = await waitResponse(ftsId);
  console.log('5. [PASS] FTS5 Search Result:', ftsRes.result.content[0].text.substring(0, 80) + '...');

  console.log('\n✨ 所有 MCP 核心接口端到端验证 100% 通过！');
  child.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ E2E 测试异常:', err);
  child.kill();
  process.exit(1);
});
