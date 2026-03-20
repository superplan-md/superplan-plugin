const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const {
  REPO_ROOT,
  makeSandbox,
  parseCliJson,
} = require('./helpers.cjs');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += String(chunk);
    });

    child.stderr.on('data', chunk => {
      stderr += String(chunk);
    });

    child.on('error', reject);
    child.on('close', code => {
      resolve({ code, stdout, stderr });
    });
  });
}

test('install script installs superplan from a local source snapshot into a custom prefix', async () => {
  const sandbox = await makeSandbox('superplan-install-script-');
  const prefixDir = path.join(sandbox.root, 'prefix');

  await fs.mkdir(prefixDir, { recursive: true });

  const installResult = await runCommand('sh', [path.join(REPO_ROOT, 'scripts', 'install.sh')], {
    cwd: sandbox.cwd,
    env: {
      ...process.env,
      HOME: sandbox.home,
      SUPERPLAN_SOURCE_DIR: REPO_ROOT,
      SUPERPLAN_INSTALL_PREFIX: prefixDir,
    },
  });

  assert.equal(installResult.code, 0, installResult.stderr || installResult.stdout);
  assert.match(installResult.stdout, /Installed Superplan to/);

  const installMetadata = JSON.parse(await fs.readFile(
    path.join(sandbox.home, '.config', 'superplan', 'install.json'),
    'utf-8',
  ));
  assert.equal(installMetadata.install_method, 'local_source');
  assert.equal(installMetadata.install_prefix, prefixDir);
  assert.equal(installMetadata.install_bin, path.join(prefixDir, 'bin'));
  assert.equal(installMetadata.source_dir, REPO_ROOT);
  assert.equal(installMetadata.ref, 'dev');

  const cliResult = await runCommand(path.join(prefixDir, 'bin', 'superplan'), ['--version', '--json'], {
    cwd: sandbox.cwd,
    env: {
      ...process.env,
      HOME: sandbox.home,
    },
  });

  assert.equal(cliResult.code, 0, cliResult.stderr || cliResult.stdout);
  const payload = parseCliJson(cliResult);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.version, '0.1.0');
});
