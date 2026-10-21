const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function findBinary() {
  if (process.env.NOVELFORGE_MCP_BIN && fs.existsSync(process.env.NOVELFORGE_MCP_BIN)) {
    return process.env.NOVELFORGE_MCP_BIN;
  }
  const candidatePaths = [
    'E:\\tools\\novelforge_target\\x86_64-pc-windows-gnu\\release\\novelforge_mcp.exe',
    'E:\\tools\\novelforge_target\\x86_64-pc-windows-gnu\\debug\\novelforge_mcp.exe',
    path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'novelforge_mcp.exe'),
    path.join(__dirname, '..', 'src-tauri', 'target', 'debug', 'novelforge_mcp.exe'),
    path.join(__dirname, 'novelforge_mcp.exe'),
    'novelforge_mcp.exe'
  ];
  let best = null;
  let bestMtime = 0;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const mt = fs.statSync(p).mtimeMs;
      if (mt > bestMtime) {
        bestMtime = mt;
        best = p;
      }
    }
  }
  return best || 'E:\\tools\\novelforge_target\\x86_64-pc-windows-gnu\\release\\novelforge_mcp.exe';
}

const binaryPath = findBinary();

async function callTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString('utf-8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf-8'); });

    child.on('error', reject);

    const initReq = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', clientInfo: { name: 'antigravity-mcp-caller', version: '1.0' } }
    }) + '\n';

    const notifyReq = JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n';

    const toolReq = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }) + '\n';

    child.stdin.write(initReq);
    child.stdin.write(notifyReq);
    child.stdin.write(toolReq);
    child.stdin.end();

    child.on('close', (code) => {
      const lines = stdout.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        try {
          const res = JSON.parse(line);
          if (res.id === 2) {
            if (res.error) {
              return reject(new Error(JSON.stringify(res.error)));
            }
            if (res.result?.isError) {
              return reject(new Error(res.result.content[0].text));
            }
            return resolve(res.result?.content?.[0]?.text);
          }
        } catch (_) {}
      }
      reject(new Error(`No response found. code=${code}, stderr=${stderr}`));
    });
  });
}

// CLI usage: node scripts/mcp-call.cjs <toolName> '<argsJson>'
if (require.main === module) {
  const toolName = process.argv[2];
  const argsJson = process.argv[3] ? JSON.parse(process.argv[3]) : {};

  callTool(toolName, argsJson)
    .then(output => {
      console.log(output);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { callTool };
