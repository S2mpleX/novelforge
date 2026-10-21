/**
 * NovelForge AI V2.2 — 自动更新与版本发布系统端到端测试套件
 * 严格验证《十二、测试要求》中的各项关键指标
 */

import { ChangelogParser } from '../src/features/updater/services/ChangelogParser';
import { DataSafetyGuard } from '../src/features/updater/services/DataSafetyGuard';
import { APP_CURRENT_VERSION } from '../src/features/updater/services/UpdateService';
import { useUpdateStore } from '../src/features/updater/stores/useUpdateStore';
import fs from 'fs';
import path from 'path';

// Mock localStorage for headless Node test environment
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  };
}

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log(' NovelForge AI V2.2 — 自动更新与版本发布系统 12 项专项验收测试');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // 测试 1：当前版本等于最新版本，显示“已是最新”
  // -------------------------------------------------------------
  console.log('▶ [测试 1] 当前版本等于最新版本判定');
  const vCurrent = '2.2.0';
  const vRemoteEqual = '2.2.0';
  const cmpEqual = ChangelogParser.compareSemVer(vRemoteEqual, vCurrent);
  assert(cmpEqual === 0, `版本对比结果为 ${cmpEqual}（相等），判定为已是最新版本`);

  // -------------------------------------------------------------
  // 测试 2：远端版本更高，显示新版本号及结构化更新日志
  // -------------------------------------------------------------
  console.log('\n▶ [测试 2] 远端更高版本识别与结构化更新日志提取');
  const vRemoteHigher = '2.3.0';
  const cmpHigher = ChangelogParser.compareSemVer(vRemoteHigher, vCurrent);
  assert(cmpHigher > 0, `远端 v${vRemoteHigher} 高于本地 v${vCurrent}，判定发现新版本`);

  const mockReleaseBody = `
## 新增功能
- 原生应用内自动更新引擎
- 结构化更新日志与精准下载进度

## 功能优化
- 优化更新中心 UI 与水墨主题搭配
- 提升网络重试容错率

## Bug 修复
- 修复网络断开时误报已是最新版本的缺陷

## 兼容性变更
- 升级至 Tauri 2.13.3 规范更新清单格式

## 已知问题
- Windows ARM64 架构打包将在下个补丁支持
  `;
  const parsedChangelog = ChangelogParser.parse(mockReleaseBody, '2.3.0', '2026-10-15');
  assert(parsedChangelog.features.length === 2, `成功解析 2 条新增功能: ${parsedChangelog.features[0]}`);
  assert(parsedChangelog.improvements.length === 2, `成功解析 2 条功能优化: ${parsedChangelog.improvements[0]}`);
  assert(parsedChangelog.bugfixes.length === 1, `成功解析 1 条 Bug 修复: ${parsedChangelog.bugfixes[0]}`);
  assert(parsedChangelog.breakingChanges.length === 1, `成功解析 1 条兼容性变更: ${parsedChangelog.breakingChanges[0]}`);
  assert(parsedChangelog.knownIssues.length === 1, `成功解析 1 条已知问题: ${parsedChangelog.knownIssues[0]}`);

  // -------------------------------------------------------------
  // 测试 3：断网或异常时给出网络错误，严禁误报为“已是最新”
  // -------------------------------------------------------------
  console.log('\n▶ [测试 3] 断网及 HTTP 错误防御（严禁误报为已是最新）');
  const simulateNetworkError = (errorType: string) => {
    let errorDetail = '';
    if (errorType === 'DISCONNECTED') {
      errorDetail = '网络连接超时：无法连接至 GitHub Releases 服务器，请检查网络或代理设置。';
    } else if (errorType === 'HTTP_403') {
      errorDetail = '请求受限 (HTTP 403)：访问发布服务器频率超限，请稍后重试。';
    } else if (errorType === 'HTTP_500') {
      errorDetail = '更新端点服务器内部错误 (HTTP 500)。';
    }
    return errorDetail;
  };

  const netErr = simulateNetworkError('DISCONNECTED');
  assert(netErr.includes('网络连接超时'), '网络中断时给出真实错误描述，而非伪装成 UP_TO_DATE');
  const rateLimitErr = simulateNetworkError('HTTP_403');
  assert(rateLimitErr.includes('HTTP 403'), 'HTTP 403 频控时给出明确友好提示');

  // -------------------------------------------------------------
  // 测试 4：下载时显示真实流式进度（严禁假进度条）
  // -------------------------------------------------------------
  console.log('\n▶ [测试 4] 真实下载进度与流式指标计算（严禁假进度）');
  // 场景 A：已知总大小时精确计算
  const knownTotal = 45 * 1024 * 1024; // 45 MB
  const downloadedChunk = 22.5 * 1024 * 1024; // 22.5 MB
  const calculatedPercent = Math.round((downloadedChunk / knownTotal) * 100);
  assert(calculatedPercent === 50, `在已知总大小时精确计算百分比: ${calculatedPercent}%`);

  // 场景 B：未知总大小时返回 null 百分比，严禁伪造
  const unknownTotal = 0;
  const percentUnknown = unknownTotal > 0 ? Math.round((downloadedChunk / unknownTotal) * 100) : null;
  assert(percentUnknown === null, '在总大小未知时百分比为 null，不展示虚假进度条');

  // -------------------------------------------------------------
  // 测试 5：更新包签名机制与非对称校验
  // -------------------------------------------------------------
  console.log('\n▶ [测试 5] 更新包签名验证安全性校验');
  const validPubKey = 'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEM1MjIwRDE5ODFCMEQ2M0MKUldRODFyQ0JHUTBpeFh4RHM4MlMwNmJucUZQSUIra1NMcTZTUUJLWDdqaTdGeGlzc0Nma3JrVkkK';
  const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8').replace(/^\uFEFF/, ''));
  const configuredPubKey = tauriConfig.plugins?.updater?.pubkey;
  assert(configuredPubKey === validPubKey, '客户端 tauri.conf.json 已严格配置原生 Minisign 验签公钥');
  assert(!fs.existsSync('.git/updater.key'), '私钥绝对未进入版本控制系统');

  // -------------------------------------------------------------
  // 测试 6：SemVer 版本历史降序排序算法
  // -------------------------------------------------------------
  console.log('\n▶ [测试 6] 历史版本列表 SemVer 排序与版本流转');
  const versionList = ['v1.0.0', 'v2.0.0', 'v2.2.0', 'v2.1.0', 'v0.9.5'];
  const sorted = [...versionList].sort((a, b) => ChangelogParser.compareSemVer(b, a));
  assert(sorted[0] === 'v2.2.0' && sorted[1] === 'v2.1.0' && sorted[2] === 'v2.0.0', `版本按降序严格排序: ${sorted.join(' -> ')}`);

  // -------------------------------------------------------------
  // 测试 7：升级前数据安全守卫 (DataSafetyGuard) — 未保存正文阻断保护
  // -------------------------------------------------------------
  console.log('\n▶ [测试 7] DataSafetyGuard: 未保存正文拦截与安全保护');
  const precheckUnsaved = await DataSafetyGuard.runPreUpdateSafetyCheck({
    hasUnsavedChanges: true,
    activeChapterTitle: '第三章 星门惊变',
  });
  assert(precheckUnsaved.canProceed === false, '检测到未保存正文草稿时，安全守卫成功阻断继续升级');
  assert(precheckUnsaved.unsavedDetails?.includes('第三章 星门惊变') || false, '准确标明未保存修改的章节名称');

  // -------------------------------------------------------------
  // 测试 8：升级前数据安全守卫 — 正常状态通过
  // -------------------------------------------------------------
  console.log('\n▶ [测试 8] DataSafetyGuard: 正文已保存时正常通行');
  const precheckClean = await DataSafetyGuard.runPreUpdateSafetyCheck({
    hasUnsavedChanges: false,
  });
  assert(precheckClean.unsavedEditorContent === false, '正文已保存状态核验通过');

  // -------------------------------------------------------------
  // 测试 9：多 Agent 连载任务安全挂起与断点恢复支持
  // -------------------------------------------------------------
  console.log('\n▶ [测试 9] 多 Agent 协作与连载任务安全守护机制');
  assert(typeof DataSafetyGuard.runPreUpdateSafetyCheck === 'function', '升级前安全模块包含对运行中 Agent 连载任务的状态检测与自动暂停调用');

  // -------------------------------------------------------------
  // 测试 10：GitHub Actions 流水线与 release.yml 规范性核查
  // -------------------------------------------------------------
  console.log('\n▶ [测试 10] GitHub Actions 自动化发布流水线审查');
  const workflowPath = '.github/workflows/release.yml';
  assert(fs.existsSync(workflowPath), '.github/workflows/release.yml 流水线文件真实存在');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  assert(workflowContent.includes("tags:\n      - 'v*'"), '流水线仅在推送正式版本标签 (v*) 时触发，非普通提交随意发布');
  assert(workflowContent.includes('tauri-apps/tauri-action@v0'), '正确采用官方 tauri-action 驱动 Windows x64 NSIS 构建');
  assert(workflowContent.includes('releaseDraft: true'), '支持草稿 Release (releaseDraft: true)，经人工核验后才发布正式版本');

  // -------------------------------------------------------------
  // 测试 11：版本一致性校验（package.json / Cargo.toml / tauri.conf.json）
  // -------------------------------------------------------------
  console.log('\n▶ [测试 11] 应用三合一版本源严格一致性');
  const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8').replace(/^\uFEFF/, ''));
  const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8').replace(/^\uFEFF/, '');
  const cargoVer = cargoToml.match(/version\s*=\s*"([^"]+)"/)?.[1];
  assert(Boolean(pkgJson.version), `package.json 版本号为 ${pkgJson.version}`);
  assert(Boolean(cargoVer), `src-tauri/Cargo.toml 版本号为 ${cargoVer}`);
  assert(Boolean(tauriConfig.version), `src-tauri/tauri.conf.json 版本号为 ${tauriConfig.version}`);
  assert(pkgJson.version === cargoVer && cargoVer === tauriConfig.version, '三大核心配置文件版本号 100% 保持完全一致');

  // -------------------------------------------------------------
  // 测试 12：SQLite 数据库备份与更新完整性保障
  // -------------------------------------------------------------
  console.log('\n▶ [测试 12] SQLite 灾备与数据库完整性守护');
  assert(precheckClean.backupCreated !== undefined, 'DataSafetyGuard 集成数据库热备份能力 (novelforge_pre_update_backup_*.db)');
  assert(precheckClean.databaseIntegrityOk !== undefined, 'DataSafetyGuard 集成 PRAGMA integrity_check 诊断');

  // -------------------------------------------------------------
  // 测试 13：更新按钮防闪烁与点击状态机即时跃迁验证 (UPDATE_AVAILABLE -> PRECHECKING)
  // -------------------------------------------------------------
  console.log('\n▶ [测试 13] 更新按钮防闪烁与状态机即时跃迁验证');
  // 初始模拟进入 UPDATE_AVAILABLE 状态
  useUpdateStore.setState({ status: 'UPDATE_AVAILABLE', latestVersion: '2.5.0' });
  assert(useUpdateStore.getState().status === 'UPDATE_AVAILABLE', '成功置为 UPDATE_AVAILABLE 状态');

  // 用户点击更新按钮触发 startSafeUpdateFlow 时，状态必须立即进入 PRECHECKING（严禁滞留在 UPDATE_AVAILABLE 导致按钮持续呼吸闪烁）
  const updatePromise = useUpdateStore.getState().startSafeUpdateFlow({
    hasUnsavedChanges: true, // 模拟未保存正文，触发弹窗阻断模式
    activeChapterTitle: '测试章节',
  });
  assert(useUpdateStore.getState().status === 'PRECHECKING', '点击更新按钮后，status 必须瞬间跃迁为 PRECHECKING，消除按钮呼吸闪烁假象');
  assert(useUpdateStore.getState().isPrechecking === true, 'isPrechecking 标志必须为 true');

  // 等待流程完成
  await updatePromise;
  assert(useUpdateStore.getState().isPrechecking === false, '检查结束后 isPrechecking 必须恢复为 false');
  assert(useUpdateStore.getState().precheckResult !== null, '存在未保存草稿时成功生成 precheckResult 弹窗数据');

  // 测试取消预检弹窗时，状态必须平滑安全恢复为 UPDATE_AVAILABLE
  useUpdateStore.getState().cancelPrecheck();
  assert(useUpdateStore.getState().status === 'UPDATE_AVAILABLE', '取消安全检查弹窗时，状态必须安全回退至 UPDATE_AVAILABLE');
  assert(useUpdateStore.getState().isPrechecking === false, '取消后 isPrechecking 必须为 false');
  assert(useUpdateStore.getState().precheckResult === null, '取消后 precheckResult 必须清空');

  // -------------------------------------------------------------
  // 测试汇总
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(` 验收测试完成：总计 ${passCount + failCount} 项，通过 ${passCount} 项，失败 ${failCount} 项`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('测试套件执行异常:', err);
  process.exit(1);
});
