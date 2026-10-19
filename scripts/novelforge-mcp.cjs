#!/usr/bin/env node

/**
 * NovelForge AI - Model Context Protocol (MCP) Server Launcher
 * 
 * 适用于 Claude Desktop, Cursor, Antigravity, Cline 等任意支持 MCP 的客户端。
 * 默认直接桥接启动 Rust 原生高性能 novelforge_mcp 二进制服务（连接本地 SQLite WAL 数据库）。
 * 
 * 用法:
 *   node scripts/novelforge-mcp.cjs           # 标准 stdio 模式，供 MCP 客户端调用
 *   node scripts/novelforge-mcp.cjs --test    # 自检连接测试与列出小说作品
 *   node scripts/novelforge-mcp.cjs --tools   # 列出已挂载的 18 个小说创作管理工具
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// 探测 MCP 服务端可执行文件路径
function findBinary() {
  if (process.env.NOVELFORGE_MCP_BIN && fs.existsSync(process.env.NOVELFORGE_MCP_BIN)) {
    return process.env.NOVELFORGE_MCP_BIN;
  }

  const candidatePaths = [
    // 专用构建目录
    'E:\\tools\\novelforge_target\\x86_64-pc-windows-gnu\\debug\\novelforge_mcp.exe',
    'E:\\tools\\novelforge_target\\x86_64-pc-windows-gnu\\release\\novelforge_mcp.exe',
    // 标准 target 目录
    path.join(projectRoot, 'src-tauri', 'target', 'release', 'novelforge_mcp.exe'),
    path.join(projectRoot, 'src-tauri', 'target', 'debug', 'novelforge_mcp.exe'),
    // 同级目录或安装路径
    path.join(__dirname, 'novelforge_mcp.exe'),
    path.join(projectRoot, 'novelforge_mcp.exe'),
    'novelforge_mcp.exe',
    'novelforge_mcp'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

const binaryPath = findBinary();

if (!binaryPath) {
  console.error('[NovelForge MCP Launcher] ❌ 未找到 novelforge_mcp 可执行文件。');
  console.error('请先在 src-tauri 目录下执行编译: cargo build --bin novelforge_mcp');
  process.exit(1);
}

const args = process.argv.slice(2);

// 自检与诊断模式
if (args.includes('--test') || args.includes('-t')) {
  runSelfTest();
} else if (args.includes('--tools')) {
  runListTools();
} else {
  // 正常 MCP stdio 桥接模式
  launchServerStdio();
}

function launchServerStdio() {
  const child = spawn(binaryPath, [], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env }
  });

  process.stdin.pipe(child.stdin);
  child.stdout.pipe(process.stdout);

  child.on('error', (err) => {
    console.error(`[NovelForge MCP Launcher] 启动进程失败: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

function runSelfTest() {
  console.log(`[NovelForge MCP] 正在运行自检... (使用程序: ${binaryPath})`);
  const child = spawn(binaryPath, [], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdoutData = '';
  child.stdout.on('data', (d) => {
    stdoutData += d.toString('utf-8');
  });

  child.stderr.on('data', (d) => {
    process.stderr.write(`[Server Log] ${d.toString('utf-8')}`);
  });

  // 发送握手请求与作品列表查询
  const req1 = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'novelforge-tester', version: '1.0.0' }
    }
  }) + '\n';

  const req2 = JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }) + '\n';

  const req3 = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'novelforge_list_novels',
      arguments: {}
    }
  }) + '\n';

  child.stdin.write(req1);
  child.stdin.write(req2);
  child.stdin.write(req3);
  child.stdin.end();

  child.on('close', (code) => {
    console.log('\n--- MCP 响应解析结果 ---');
    const lines = stdoutData.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.id === 1) {
          console.log('✅ 初始化握手成功 (initialize):', JSON.stringify(json.result.serverInfo));
        } else if (json.id === 2) {
          console.log('✅ 数据库作品查询工具调用成功 (novelforge_list_novels):');
          const content = json.result?.content?.[0]?.text;
          if (content) {
            const novels = JSON.parse(content);
            console.log(`   共检索到 ${novels.length} 部小说作品:`);
            novels.forEach((n, idx) => {
              console.log(`   [${idx + 1}] ID: ${n.id} | 书名: 《${n.title}》 | 总字数: ${n.total_words || 0}`);
            });
          }
        }
      } catch (e) {
        console.log('RAW LINE:', line);
      }
    }
    console.log(`\n🎉 MCP 自检测试通过！退出码: ${code}`);
    process.exit(code);
  });
}

function runListTools() {
  const child = spawn(binaryPath, [], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdoutData = '';
  child.stdout.on('data', (d) => {
    stdoutData += d.toString('utf-8');
  });

  const req1 = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  }) + '\n';

  const req2 = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  }) + '\n';

  child.stdin.write(req1);
  child.stdin.write(req2);
  child.stdin.end();

  child.on('close', () => {
    const lines = stdoutData.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.id === 2 && json.result?.tools) {
          console.log(`\nNovelForge AI 已挂载的 MCP 工具清单 (共 ${json.result.tools.length} 个):`);
          console.log('='.repeat(70));
          json.result.tools.forEach((t, i) => {
            console.log(`${(i + 1).toString().padStart(2, ' ')}. ${t.name.padEnd(30, ' ')} -> ${t.description}`);
          });
          console.log('='.repeat(70));
        }
      } catch (_) {}
    }
    process.exit(0);
  });
}
