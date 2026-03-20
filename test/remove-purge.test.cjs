const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  loadDistModule,
  makeSandbox,
  pathExists,
  withSandboxEnv,
  writeFile,
} = require('./helpers.cjs');

test('remove deletes local superplan state including .superplan changes', async () => {
  const sandbox = await makeSandbox('superplan-remove-local-');

  await writeFile(path.join(sandbox.cwd, '.superplan', 'config.toml'), 'version = "0.1"\n');
  await writeFile(path.join(sandbox.cwd, '.superplan', 'changes', 'demo', 'tasks', 'T-001.md'), '# task\n');
  await writeFile(path.join(sandbox.cwd, '.claude', 'skills', 'using-superplan', 'SKILL.md'), '# using-superplan\n');
  await writeFile(path.join(sandbox.cwd, '.claude', 'skills', 'execute-task-graph', 'SKILL.md'), '# execute-task-graph\n');
  await writeFile(path.join(sandbox.cwd, '.claude', 'skills', 'custom-skill', 'SKILL.md'), '# custom\n');

  const { remove } = loadDistModule('cli/commands/remove.js', {
    select: async () => 'local',
    confirm: async () => true,
  });

  const result = await withSandboxEnv(sandbox, async () => remove({}));

  assert.equal(result.ok, true);
  assert.equal(result.data.scope, 'local');
  assert.equal(result.data.mode, 'remove');
  assert.equal(await pathExists(path.join(sandbox.cwd, '.superplan')), false);
  assert.equal(await pathExists(path.join(sandbox.cwd, '.claude', 'skills', 'using-superplan')), false);
  assert.equal(await pathExists(path.join(sandbox.cwd, '.claude', 'skills', 'execute-task-graph')), false);
  assert.equal(await pathExists(path.join(sandbox.cwd, '.claude', 'skills', 'custom-skill', 'SKILL.md')), true);
  assert.equal(await pathExists(path.join(sandbox.cwd, '.superplan', 'changes')), false);
});

test('purge deletes local superplan state and .superplan changes directory', async () => {
  const sandbox = await makeSandbox('superplan-purge-local-');

  await writeFile(path.join(sandbox.cwd, '.superplan', 'config.toml'), 'version = "0.1"\n');
  await writeFile(path.join(sandbox.cwd, '.superplan', 'changes', 'demo', 'tasks', 'T-001.md'), '# task\n');

  const { purge } = loadDistModule('cli/commands/remove.js', {
    select: async () => 'local',
    confirm: async () => true,
  });

  const result = await withSandboxEnv(sandbox, async () => purge({}));

  assert.equal(result.ok, true);
  assert.equal(result.data.scope, 'local');
  assert.equal(result.data.mode, 'purge');
  assert.equal(await pathExists(path.join(sandbox.cwd, '.superplan')), false);
  assert.equal(await pathExists(path.join(sandbox.cwd, '.superplan', 'changes')), false);
});

test('remove deletes the recorded global overlay install when removing machine-level state', async () => {
  const sandbox = await makeSandbox('superplan-remove-global-overlay-');
  const overlayInstallPath = path.join(sandbox.home, '.local', 'share', 'superplan', 'overlay', 'overlay-bin');

  await writeFile(path.join(sandbox.home, '.config', 'superplan', 'install.json'), JSON.stringify({
    install_method: 'remote_repo',
    repo_url: 'https://github.com/example/superplan.git',
    ref: 'dev',
    overlay: {
      install_method: 'copied_prebuilt',
      install_path: overlayInstallPath,
      executable_path: overlayInstallPath,
    },
  }, null, 2));
  await writeFile(overlayInstallPath, '#!/bin/sh\nexit 0\n');
  await writeFile(path.join(sandbox.home, '.config', 'superplan', 'config.toml'), 'version = "0.1"\n');

  const { remove } = loadDistModule('cli/commands/remove.js', {
    select: async () => 'global',
    confirm: async () => true,
  });

  const result = await withSandboxEnv(sandbox, async () => remove({}));

  assert.equal(result.ok, true);
  assert.equal(result.data.scope, 'global');
  assert.equal(await pathExists(overlayInstallPath), false);
  assert.equal(await pathExists(path.join(sandbox.home, '.config', 'superplan')), false);
});
