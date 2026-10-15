import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

// 确保 MinGW-w64 (GCC / dlltool / ld) 在任何终端执行环境下均优先加入 PATH
const mingwBin = 'E:\\tools\\winlibs_msvcrt\\mingw64\\bin';
const currentPath = process.env.PATH || '';
const newPath = currentPath.includes(mingwBin) ? currentPath : `${mingwBin};${currentPath}`;

const env = {
  ...process.env,
  PATH: newPath,
  WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: process.env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS || '--disable-gpu --disable-gpu-compositing',
};

let cmd = 'tauri';
let cmdArgs = process.argv.slice(2);

if (cmdArgs[0] === '--') {
  cmd = cmdArgs[1];
  cmdArgs = cmdArgs.slice(2);
}

const child = spawn(cmd, cmdArgs, {
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
