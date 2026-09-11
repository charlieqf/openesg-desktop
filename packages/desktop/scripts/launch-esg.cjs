// Local development launcher. Stable file-backed stdio avoids Windows EPIPE on terminal detach.
const { spawn } = require('node:child_process');
const { mkdirSync, openSync, closeSync } = require('node:fs');
const { resolve, join } = require('node:path');
const directory = resolve(__dirname, '..');
const runtime = resolve(directory, '../../.esg-prototype-runtime');
mkdirSync(runtime, { recursive: true });
const log = openSync(join(runtime, 'launcher.log'), 'a');
const child = spawn(require('electron'), [directory], {
  cwd: directory,
  env: { ...process.env, OPENCODE_ESG_PROTOTYPE_ROOT: runtime, OPENCODE_SIDECAR_V2: '0' },
  detached: true,
  // The user is explicitly reviewing an interactive desktop window.
  windowsHide: false,
  stdio: ['ignore', log, log],
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.unref();
closeSync(log);
console.log(`OpenESG desktop validation launched: pid ${child.pid}. Logs: ${runtime}`);
