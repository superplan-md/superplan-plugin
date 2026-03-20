const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  loadDistModule,
  makeSandbox,
  withSandboxEnv,
  writeFile,
} = require('./helpers.cjs');

test('doctor reports when overlay is enabled but no launchable companion is installed', async () => {
  const sandbox = await makeSandbox('superplan-doctor-overlay-');

  await writeFile(path.join(sandbox.home, '.config', 'superplan', 'config.toml'), `version = "0.1"

[overlay]
enabled = true
`);
  await writeFile(path.join(sandbox.home, '.config', 'superplan', 'skills', 'using-superplan', 'SKILL.md'), '# using-superplan\n');

  const { doctor } = loadDistModule('cli/commands/doctor.js');
  const result = await withSandboxEnv(sandbox, async () => doctor([]));

  assert.equal(result.ok, true);
  assert.equal(result.data.valid, false);
  assert.equal(result.data.issues.some(issue => issue.code === 'OVERLAY_COMPANION_UNAVAILABLE'), true);
});
