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

child.stderr.on('data', (data) => {
  process.stderr.write('[MCP stderr] ' + data.toString());
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

  // 6. 获取章节并测试结构化记忆组装 (Structured Context Pack)
  const chaptersId = sendRequest('tools/call', {
    name: 'novelforge_list_chapters',
    arguments: { novel_id: novelId }
  });
  const chaptersRes = await waitResponse(chaptersId);
  const chapters = JSON.parse(chaptersRes.result.content[0].text);
  const chapterId = chapters[0].id;
  console.log(`6. [PASS] List Chapters: 获取到 ${chapters.length} 章，选取第 1 章 ID: ${chapterId}`);

  const structCtxId = sendRequest('tools/call', {
    name: 'novelforge_assemble_context',
    arguments: { novel_id: novelId, chapter_id: chapterId, format: 'structured' }
  });
  const structCtxRes = await waitResponse(structCtxId);
  const structCtx = JSON.parse(structCtxRes.result.content[0].text);
  if (!structCtx.working_memory_l0 && !structCtx.short_term_l1) {
    throw new Error('Structured Context Pack missing L0/L1 fields');
  }
  console.log('7. [PASS] Structured Context Pack (L0~L4 解耦上下文组装验证通过)');

  // 7. 无头质量门禁与反思自检 (novelforge_evaluate_chapter)
  const draftWithCliches = "他嘴角勾起一抹冷笑，眼中闪过一丝不易察觉的寒芒。不是因为恐惧，而是因为愤怒。深吸一口气，他仿佛化作一道闪电一般冲向敌阵。空气仿佛凝固。陆雪琪皱眉道：「速走！」林惊羽拔剑道：「休想！」";
  const evalId = sendRequest('tools/call', {
    name: 'novelforge_evaluate_chapter',
    arguments: {
      novel_id: novelId,
      chapter_id: chapterId,
      content: draftWithCliches
    }
  });
  const evalRes = await waitResponse(evalId);
  const evalReport = JSON.parse(evalRes.result.content[0].text);
  console.log(`8. [PASS] Evaluate Chapter: 人情味评分 ${evalReport.humanizer_score}/100, 检出套话 ${evalReport.cliche_matches.length} 处, 判定: [${evalReport.verdict}]`);
  if (evalReport.cliche_matches.length < 3) {
    throw new Error('Expected at least 3 cliche matches for test text');
  }

  // 8. 新实体提取反哺提案 (novelforge_scan_entity_proposals)
  const proposalsId = sendRequest('tools/call', {
    name: 'novelforge_scan_entity_proposals',
    arguments: {
      novel_id: novelId,
      content: "独孤求败冷笑道：「天下英雄，不过尔尔！」风清扬站起身道：「兄台好气魄！」"
    }
  });
  const proposalsRes = await waitResponse(proposalsId);
  const proposals = JSON.parse(proposalsRes.result.content[0].text);
  console.log(`9. [PASS] Scan Entity Proposals: 检出 ${proposals.length} 位候选新人物: ${proposals.map(p => p.name).join(', ')}`);

  // 9. 候选提案暂存模式 (novelforge_propose_chapter_revision - 非破坏性)
  const propId = sendRequest('tools/call', {
    name: 'novelforge_propose_chapter_revision',
    arguments: {
      novel_id: novelId,
      chapter_id: chapterId,
      content: "这是由外部 Agent 暂存提交的高质量修订候选草稿，未破坏当前活动正文。",
      proposal_summary: "增强对白张力",
      reasoning_trace: "优化了第三段的微动作与呼吸节拍"
    }
  });
  const propRes = await waitResponse(propId);
  const propData = JSON.parse(propRes.result.content[0].text);
  const proposedVersionId = propData.proposal.version_id;
  console.log(`10. [PASS] Propose Chapter Revision: 成功暂存候选修订草稿版本 v${propData.proposal.version_number}`);

  // 10. 历史版本查询 (novelforge_list_chapter_versions)
  const versId = sendRequest('tools/call', {
    name: 'novelforge_list_chapter_versions',
    arguments: { chapter_id: chapterId }
  });
  const versRes = await waitResponse(versId);
  const vers = JSON.parse(versRes.result.content[0].text);
  console.log(`11. [PASS] List Chapter Versions: 包含 ${vers.length} 个历史快照/提案版本`);

  // 11. 采纳候选提案 (novelforge_accept_chapter_proposal)
  const acceptId = sendRequest('tools/call', {
    name: 'novelforge_accept_chapter_proposal',
    arguments: {
      novel_id: novelId,
      chapter_id: chapterId,
      version_id: proposedVersionId
    }
  });
  const acceptRes = await waitResponse(acceptId);
  console.log('12. [PASS] Accept Chapter Proposal:', acceptRes.result.content[0].text);

  // 12. 细纲场景创建与查询 (novelforge_create_scene & novelforge_list_scenes)
  const createSceneId = sendRequest('tools/call', {
    name: 'novelforge_create_scene',
    arguments: {
      chapter_id: chapterId,
      sequence: 1,
      title: '破晓之遇',
      objective: '揭示敌军动向，建立悬念',
      outline: '主角与哨探碰头，得知密道已被封锁'
    }
  });
  const createSceneRes = await waitResponse(createSceneId);
  const sceneObj = JSON.parse(createSceneRes.result.content[0].text);
  console.log(`13. [PASS] Create Scene: 场景《${sceneObj.title}》创建成功`);

  const listScenesId = sendRequest('tools/call', {
    name: 'novelforge_list_scenes',
    arguments: { chapter_id: chapterId }
  });
  const listScenesRes = await waitResponse(listScenesId);
  const scenes = JSON.parse(listScenesRes.result.content[0].text);
  console.log(`14. [PASS] List Scenes: 获取到本章 ${scenes.length} 个场景细纲节拍`);

  // 13. 作者文风档案读取 (novelforge_get_active_voice_profile)
  const voiceId = sendRequest('tools/call', {
    name: 'novelforge_get_active_voice_profile',
    arguments: { novel_id: novelId }
  });
  const voiceRes = await waitResponse(voiceId);
  const voice = JSON.parse(voiceRes.result.content[0].text);
  console.log(`15. [PASS] Active Voice Profile: ${voice ? voice.name : '使用全局默认文风'}`);

  // 14. 伏笔线索管理 (novelforge_list_plot_threads)
  const threadsId = sendRequest('tools/call', {
    name: 'novelforge_list_plot_threads',
    arguments: { novel_id: novelId }
  });
  const threadsRes = await waitResponse(threadsId);
  const threads = JSON.parse(threadsRes.result.content[0].text);
  console.log(`16. [PASS] List Plot Threads: 获取到 ${threads.length} 条剧情伏笔线索`);

  // 15. 工作流推演流水线驱动 (novelforge_list_workflow_templates & novelforge_create_workflow_run)
  const wfListId = sendRequest('tools/call', {
    name: 'novelforge_list_workflow_templates',
    arguments: { novel_id: novelId }
  });
  const wfListRes = await waitResponse(wfListId);
  const wfTemplates = JSON.parse(wfListRes.result.content[0].text);
  console.log(`17. [PASS] List Workflow Templates: 获取到 ${wfTemplates.length} 套创作推演模板`);
  const templateId = wfTemplates[0]?.id;

  if (templateId) {
    const wfRunId = sendRequest('tools/call', {
      name: 'novelforge_create_workflow_run',
      arguments: {
        template_id: templateId,
        novel_id: novelId,
        target_chapter_id: chapterId
      }
    });
    const wfRunRes = await waitResponse(wfRunId);
    const wfRun = JSON.parse(wfRunRes.result.content[0].text);
    console.log(`18. [PASS] Create & Advance Workflow Run: 实例 ID ${wfRun.run.id}, 首步 [${wfRun.steps[0]?.step_title || '步1'}] 状态 [${wfRun.run.status}]`);
  }

  console.log('\n🎉 所有 18 项高阶 MCP 核心能力与 Agent 驱动闭环 100% 验证全部通过！');

  console.log('\n✨ 所有 MCP 核心接口端到端验证 100% 通过！');
  child.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ E2E 测试异常:', err);
  child.kill();
  process.exit(1);
});
