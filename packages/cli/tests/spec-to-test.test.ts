import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runSpecToTest } from '../src/commands/spec-to-test.js';

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function mkTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-stt-'));
  dirs.push(dir);
  return dir;
}

describe('runSpecToTest (api layer)', () => {
  it('generates a vitest file with setupApiServer calls', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `# items spec\n\n- module: items\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-API-001 | GET happy | empty | GET /api/items | 200 | P0 | yes | live | /api/items |\n| T-API-002 | POST happy | empty | POST /api/items | 201 | P0 | yes | live | /api/items |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.module).toBe('items');
    expect(result.layer).toBe('api');
    expect(result.count).toBe(2);
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("import { setupApiServer");
    expect(content).toContain("'T-API-001 GET happy'");
    expect(content).toContain("'T-API-002 POST happy'");
    expect(content).toContain("env.request.get('/api/items')");
    expect(content).toContain("env.request.post('/api/items'");
  });
});

describe('runSpecToTest (ui layer)', () => {
  it('generates a vitest file with setupComponentEnv calls', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: counter\n- layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Component |\n|---|---|---|---|---|---|---|---|---|\n| T-UI-001 | initial | initial=3 | mount | shows 3 | P0 | yes | render | Counter |\n| T-UI-003 | + click | initial=0 | click + | shows 1 | P0 | yes | interaction | Counter |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.layer).toBe('ui');
    expect(result.count).toBe(2);
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("import { setupComponentEnv");
    expect(content).toContain("mode: 'render'");
    expect(content).toContain("mode: 'interaction'");
    expect(content).toContain("'T-UI-001 initial'");
  });
});

describe('runSpecToTest (data layer)', () => {
  it('generates queue + cron-aware vitest file', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: orders\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |\n|---|---|---|---|---|---|---|---|---|\n| T-DATA-001 | queue ok | empty | send | accepted | P0 | yes | mock | orders |\n| T-DATA-006 | cron fire | 100ms | advance 350 | 3 fires | P0 | yes | mock | cron |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.layer).toBe('data');
    expect(result.count).toBe(2);
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("createFakeClock");
    expect(content).toContain("setupQueueEnv");
    expect(content).toContain("'T-DATA-001 queue ok'");
    expect(content).toContain("'T-DATA-006 cron fire'");
  });
});

describe('runSpecToTest (cli layer)', () => {
  it('generates setupCliEnv-based vitest file', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: my-cli\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |\n|---|---|---|---|---|---|---|---|---|\n| T-CLI-001 | help ok | flag --help | run kiwa --help | exit 0 | P0 | yes | mock | help |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.layer).toBe('cli');
    expect(result.count).toBe(1);
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("setupCliEnv");
    expect(content).toContain("expectExitCode");
    expect(content).toContain("'T-CLI-001 help ok'");
  });
});

describe('runSpecToTest (errors)', () => {
  it('rejects when input does not exist', () => {
    expect(() =>
      runSpecToTest({ inPath: '/nope.md', outPath: '/tmp/out.ts', cwd: '/' }),
    ).toThrow(/not found/);
  });

  it('rejects unsupported layer', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(specPath, '- module: x\n- layer: e2e\n', 'utf8');
    expect(() =>
      runSpecToTest({ inPath: specPath, outPath: join(dir, 'o.ts'), cwd: dir }),
    ).toThrow(/unsupported layer/);
  });
});
