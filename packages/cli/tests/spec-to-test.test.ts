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

  it('T-STT-002 api mock mode generates mockHandlers + no app', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | mock | empty | GET /a | 200 | P0 | yes | mock | /a |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("mode: 'mock'");
    expect(content).toContain('mockHandlers: []');
  });

  it('T-STT-003 api hybrid mode generates both app + mockHandlers', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | hybrid | empty | GET /a | 200 | P0 | yes | hybrid | /a |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("mode: 'hybrid'");
  });

  it('T-STT-004 method extraction - PUT / DELETE / PATCH 全 method 認識', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-PUT | put | a | PUT /a | 200 | P0 | yes | live | /a |\n| T-DEL | del | a | DELETE /a | 204 | P0 | yes | live | /a |\n| T-PAT | pat | a | PATCH /a | 200 | P0 | yes | live | /a |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.request.put');
    expect(content).toContain("env.request.delete('/a')");
    expect(content).toContain('env.request.patch');
  });

  it('T-STT-005 method fallback when "When" lacks HTTP verb', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | no verb | a | call api | 200 | P0 | yes | live | /a |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.request.get');
  });

  it('T-STT-006 default route "/" when not specified', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-001 | no route | a | GET / | 200 | P0 | yes | live |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("env.request.get('/')");
  });

  it('T-STT-007 default mode "live" when mode is empty', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | nomode | a | GET /a | 200 | P0 | yes |  | /a |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("mode: 'live'");
  });

  it('T-STT-008 automation=manual / no skips case generation', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-YES | yes | a | GET /a | 200 | P0 | yes | live | /a |\n| T-MAN | manual | a | GET /b | 200 | P0 | manual | live | /b |\n| T-NO | no | a | GET /c | 200 | P0 | no | live | /c |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.count).toBe(1);
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('T-YES');
    expect(content).not.toContain('T-MAN');
    expect(content).not.toContain('T-NO');
  });

  it('T-STT-009 escape - single-quote in observation escaped', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | it's ok | a | GET /a | 200 | P0 | yes | live | /a |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("it\\'s ok");
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

  it('T-STT-011 ui default mode "render" when empty', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Component |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | nomode | a | b | c | P0 | yes |  | Counter |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("mode: 'render'");
  });

  it('T-STT-012 ui default component "Component" when empty', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-001 | nocomp | a | b | c | P0 | yes | render |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('Component');
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

  it('T-STT-014 data topic "cron" generates clock.nowMs branch', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | cron only | a | b | c | P0 | yes | mock | cron |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('clock.nowMs()');
    expect(content).not.toContain("env.client.size()");
  });

  it('T-STT-015 data topic non-cron generates env.client.size branch', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | queue only | a | b | c | P0 | yes | mock | orders |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.client.size()');
    expect(content).not.toContain('clock.nowMs()');
  });

  it('T-STT-016 data default mode "mock" when empty', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | nomode | a | b | c | P0 | yes |  | x |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("mode: 'mock'");
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

  it('T-STT-018 cli generated test includes expectExitCode with code 0', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: my-cli\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | ok | a | b | c | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toMatch(/expectExitCode\(result, 0/);
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

  it('T-STT-020 unsupported layer error lists api/ui/data/cli', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(specPath, '- module: x\n- layer: e2e\n', 'utf8');
    expect(() =>
      runSpecToTest({ inPath: specPath, outPath: join(dir, 'o.ts'), cwd: dir }),
    ).toThrow(/Supported: api, ui, data, cli/);
  });

  it('T-STT-021 spec-to-test error message prefix', () => {
    expect(() =>
      runSpecToTest({ inPath: '/__not_exists__.md', outPath: '/tmp/out.ts', cwd: '/' }),
    ).toThrow(/spec-to-test:/);
  });
});

describe('runSpecToTest (layer override)', () => {
  it('T-STT-022 opts.layer overrides spec.layer', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes | live |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir, layer: 'cli' });
    expect(result.layer).toBe('cli');
  });

  it('T-STT-023 opts.layer "API" upper-case normalize to "api"', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes | live |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir, layer: 'API' });
    expect(result.layer).toBe('api');
  });
});

describe('runSpecToTest (result counting)', () => {
  it('T-STT-024 count returns only automation=yes rows', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-Y1 | a | b | c | d | P0 | yes | live | /a |\n| T-Y2 | a | b | c | d | P0 | yes | live | /b |\n| T-M1 | a | b | c | d | P0 | manual | live | /c |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.count).toBe(2);
  });

  it('T-STT-025 outPath returned as resolved absolute path', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes | live |\n`,
      'utf8',
    );
    const out = 'sub/test.ts';
    const result = runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    expect(result.outPath).toBe(join(dir, 'sub', 'test.ts'));
  });
});
