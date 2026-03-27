const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { applyAutoFix } = require('../dist/cli/graph-autofix');

describe('graph auto-fix', () => {
  it('adds backticks around Change ID value when missing', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'superplan-test-'));
    const testFile = path.join(tmpDir, 'tasks.md');
    
    const content = `# Task Graph

## Graph Metadata
- Change ID: my-change
- Title: Test

## Graph Layout

- \`T-001\` Task one
  - depends_on_all: []
  - depends_on_any: []
`;

    await fs.writeFile(testFile, content);
    const result = await applyAutoFix(testFile);
    
    assert.ok(result.fixed);
    assert.ok(result.content.includes('- Change ID: `my-change`'));
    assert.ok(result.changes.some(c => c.includes('backticks')));
    
    await fs.rm(tmpDir, { recursive: true });
  });

  it('normalizes whitespace in task entries', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'superplan-test-'));
    const testFile = path.join(tmpDir, 'tasks.md');
    
    const content = `# Task Graph

## Graph Metadata
- Change ID: \`test\`

## Graph Layout

- \`T-001\`   Task with extra spaces  
  - depends_on_all: []
`;

    await fs.writeFile(testFile, content);
    const result = await applyAutoFix(testFile);
    
    assert.ok(result.fixed);
    assert.ok(result.changes.length > 0);
    assert.ok(result.content.includes('- `T-001` Task with extra spaces'));
    
    await fs.rm(tmpDir, { recursive: true });
  });

  it('preserves content when no fixes are needed', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'superplan-test-'));
    const testFile = path.join(tmpDir, 'tasks.md');
    
    const content = `# Task Graph

## Graph Metadata
- Change ID: \`test\`

## Graph Layout

- \`T-001\` Task one
  - depends_on_all: []
`;

    await fs.writeFile(testFile, content);
    const result = await applyAutoFix(testFile);
    
    assert.ok(!result.fixed);
    assert.strictEqual(result.changes.length, 0);
    
    await fs.rm(tmpDir, { recursive: true });
  });

  it('is idempotent - running twice produces same result', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'superplan-test-'));
    const testFile = path.join(tmpDir, 'tasks.md');
    
    const content = `# Task Graph

## Graph Metadata
- Change ID: test-change

## Graph Layout

- \`T-001\` Task
  - depends_on_all: []
`;

    await fs.writeFile(testFile, content);
    
    const firstFix = await applyAutoFix(testFile);
    assert.ok(firstFix.fixed);
    
    const secondFix = await applyAutoFix(testFile);
    assert.ok(!secondFix.fixed);
    assert.strictEqual(secondFix.changes.length, 0);
    
    await fs.rm(tmpDir, { recursive: true });
  });
});
