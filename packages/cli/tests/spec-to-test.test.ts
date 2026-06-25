import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseSpec, runSpecToTest } from '../src/commands/spec-to-test.js';

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

describe('parseSpec direct (boundary coverage)', () => {
  it('T-STT-PARSE-001 TC_REGEX exact boundary - "T-A-001" matches', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-A-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases[0]?.id).toBe('T-A-001');
  });

  it('T-STT-PARSE-002 TC_REGEX requires multi-character prefix - "T-AB-001" valid', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-AB-001 | a | b | c | d | P0 | yes |\n| T-ABC-999 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.map((c) => c.id)).toEqual(['T-AB-001', 'T-ABC-999']);
  });

  it('T-STT-PARSE-003 parseMetaLine - "- module: items" extracted with hyphen prefix', () => {
    const out = parseSpec(
      `- module: items\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.module).toBe('items');
  });

  it('T-STT-PARSE-004 parseMetaLine - "* module: items" with asterisk prefix', () => {
    const out = parseSpec(
      `* module: items\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.module).toBe('items');
  });

  it('T-STT-PARSE-005 parseMetaLine - whitespace BEFORE colon required ("- key: v")', () => {
    const out = parseSpec(
      `-module: items\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.module).toBe('');
  });

  it('T-STT-PARSE-006 parseMetaLine - full-width colon (":") accepted', () => {
    const out = parseSpec(
      `- module: items\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.module).toBe('items');
  });

  it('T-STT-PARSE-007 parseMetaLine - value trim applied', () => {
    const out = parseSpec(
      `- module:    items   \n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.module).toBe('items');
  });

  it('T-STT-PARSE-008 findTable - divider with leading "|" accepted', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
  });

  it('T-STT-PARSE-009 findTable - divider without leading "|" still accepted', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n---|---|---|---|---|---|---\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
  });

  it('T-STT-PARSE-010 findTable - colon divider ":-:" accepted', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
  });

  it('T-STT-PARSE-011 findTable - header without "|" not detected as table', () => {
    const out = parseSpec(
      `ID Observation Given\n---|---|---\n| T-001 | a | b |\n`,
    );
    expect(out.cases.length).toBe(0);
  });

  it('T-STT-PARSE-012 findTable - rows break on empty line', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n\n| T-002 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
  });

  it('T-STT-PARSE-013 findTable - rows break on row without "|"', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\nplain text\n| T-002 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
  });

  it('T-STT-PARSE-014 splitRow - leading and trailing "|" stripped', () => {
    const out = parseSpec(
      `|ID|Observation|Given|When|Then|Priority|Automation|\n|---|---|---|---|---|---|---|\n|T-001|a|b|c|d|P0|yes|\n`,
    );
    expect(out.cases[0]?.id).toBe('T-001');
    expect(out.cases[0]?.given).toBe('b');
  });

  it('T-STT-PARSE-015 cells - whitespace trimmed', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n|   T-001  |  a  |  b  |  c  |  d  |  P0  |  yes  |\n`,
    );
    expect(out.cases[0]?.id).toBe('T-001');
    expect(out.cases[0]?.given).toBe('b');
  });

  it('T-STT-PARSE-016 id with "-" prefix - skipped', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| -divider | a | b | c | d | P0 | yes |\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
    expect(out.cases[0]?.id).toBe('T-001');
  });

  it('T-STT-PARSE-017 empty id - skipped', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n|  | a | b | c | d | P0 | yes |\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.cases.length).toBe(1);
  });

  it('T-STT-PARSE-018 opts.module overrides meta module', () => {
    const out = parseSpec(
      `- module: meta-x\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      { module: 'opts-x' },
    );
    expect(out.module).toBe('opts-x');
  });

  it('T-STT-PARSE-019 opts.defaultLayer overrides meta layer absence', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      { defaultLayer: 'ui' },
    );
    expect(out.layer).toBe('ui');
  });

  it('T-STT-PARSE-020 no opts module - empty string default', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.module).toBe('');
  });

  it('T-STT-PARSE-021 no opts defaultLayer - "unit" default', () => {
    const out = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.layer).toBe('unit');
  });

  it('T-STT-PARSE-022 layer meta normalized to lowercase', () => {
    const out = parseSpec(
      `- layer: UI\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
    );
    expect(out.layer).toBe('ui');
  });

  it('T-STT-PARSE-023 HEADER_KEYS - "given" / "then" recognized', () => {
    const out = parseSpec(
      `| ID | Given | Then | Automation |\n|---|---|---|---|\n| T-001 | g-val | t-val | yes |\n`,
    );
    expect(out.cases[0]?.given).toBe('g-val');
    expect(out.cases[0]?.then).toBe('t-val');
  });

  it('T-STT-PARSE-024 HEADER_KEYS - "priority" / "component" recognized', () => {
    const out = parseSpec(
      `| ID | Priority | Component |\n|---|---|---|\n| T-001 | P3 | MyComp |\n`,
    );
    expect(out.cases[0]?.priority).toBe('P3');
    expect(out.cases[0]?.component).toBe('MyComp');
  });

  it('T-STT-PARSE-025 mode normalize to lowercase', () => {
    const out = parseSpec(
      `| ID | Mode |\n|---|---|\n| T-001 | LIVE |\n`,
    );
    expect(out.cases[0]?.mode).toBe('live');
  });

  it('T-STT-PARSE-026 automation normalize to lowercase', () => {
    const out = parseSpec(
      `| ID | Automation |\n|---|---|\n| T-001 | YES |\n`,
    );
    expect(out.cases[0]?.automation).toBe('yes');
  });

  it('T-STT-PARSE-027 route present in HEADER_KEYS', () => {
    const out = parseSpec(
      `| ID | Route |\n|---|---|\n| T-001 | /api/x |\n`,
    );
    expect(out.cases[0]?.route).toBe('/api/x');
  });

  it('T-STT-PARSE-028 topic recognized', () => {
    const out = parseSpec(
      `| ID | Topic |\n|---|---|\n| T-001 | cron |\n`,
    );
    expect(out.cases[0]?.topic).toBe('cron');
  });

  it('T-STT-PARSE-029 missing column returns empty string', () => {
    const out = parseSpec(
      `| ID |\n|---|\n| T-001 |\n`,
    );
    expect(out.cases[0]?.given).toBe('');
    expect(out.cases[0]?.observation).toBe('');
  });

  it('T-STT-PARSE-030 no table returns empty cases', () => {
    const out = parseSpec(`- module: x\n- layer: api\n`);
    expect(out.cases).toEqual([]);
    expect(out.module).toBe('x');
    expect(out.layer).toBe('api');
  });
});

describe('runSpecToTest method extraction (boundary)', () => {
  it('T-STT-METHOD-001 PUT uppercase', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|\n| T-001 | PUT /x | P0 | yes | live | /x |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.request.put');
  });

  it('T-STT-METHOD-002 DELETE - uses .delete', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|\n| T-001 | DELETE /x | P0 | yes | live | /x |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("env.request.delete('/x')");
  });

  it('T-STT-METHOD-003 PATCH lowercase usage', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|\n| T-001 | PATCH /x | P0 | yes | live | /x |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.request.patch');
  });

  it('T-STT-METHOD-004 method case insensitive - "Put /x" detected', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|\n| T-001 | Put /x | P0 | yes | live | /x |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.request.put');
  });

  it('T-STT-METHOD-005 method starts with verb + space required - "GETx" -> default', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|\n| T-001 | GETx /x | P0 | yes | live | /x |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('env.request.get');
  });
});

describe('runSpecToTest body shape (boundary - generated strings)', () => {
  it('T-STT-BODY-001 generated file starts with "import { afterEach, ..."', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content.startsWith("import { afterEach, describe, expect, it } from 'vitest';")).toBe(true);
  });

  it('T-STT-BODY-002 api - "ApiTestEnv" type import', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("import { setupApiServer, type ApiTestEnv } from '@kiwa-test/api';");
  });

  it('T-STT-BODY-003 ui - "UiTestEnv" type import', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("import { setupComponentEnv, type UiTestEnv } from '@kiwa-test/ui';");
  });

  it('T-STT-BODY-004 ui includes reference types directive', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('/// <reference types="vitest/globals" />');
  });

  it('T-STT-BODY-005 cli - "CliTestEnv" type import', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("import { expectExitCode, setupCliEnv, type CliTestEnv } from '@kiwa-test/cli-test';");
  });

  it('T-STT-BODY-006 data - "QueueTestEnv" type import', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("import { createFakeClock, setupQueueEnv, type QueueTestEnv } from '@kiwa-test/data';");
  });

  it('T-STT-BODY-007 describe block uses module name', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: my-mod\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("describe('my-mod (api)'");
  });

  it('T-STT-BODY-008 cli describe block ends with "(cli)"', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: my-cli\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("describe('my-cli (cli)'");
  });

  it('T-STT-BODY-009 data describe block ends with "(data)"', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: orders\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("describe('orders (data)'");
  });

  it('T-STT-BODY-010 ui describe block ends with "(ui)"', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: counter\n- layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("describe('counter (ui)'");
  });

  it('T-STT-BODY-011 cli test includes "const env = await setupCliEnv()"', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('const env = await setupCliEnv()');
  });

  it('T-STT-BODY-012 cli test includes "cmd: \'true\'" run', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("env.runCli({ cmd: 'true' })");
  });

  it('T-STT-BODY-013 afterEach block present (env cleanup)', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P0 | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('afterEach(async () => {');
    expect(content).toContain('while (envs.length > 0)');
    expect(content).toContain('await env.stop();');
  });

  it('T-STT-BODY-014 api - mode hybrid generates app with handler', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Mode | Route | Automation |\n|---|---|---|---|---|\n| T-001 | GET /x | hybrid | /x | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("mode: 'hybrid'");
    expect(content).toContain("kind: 'fetch'");
  });

  it('T-STT-BODY-015 ui - component default "Component" usage', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: ui\n\n| ID | Observation | Mode | Automation |\n|---|---|---|---|\n| T-001 | a | render | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.tsx');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("// TODO: import { Component } from './component.js';");
  });

  it('T-STT-BODY-016 data cron - clock.nowMs assertion', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: data\n\n| ID | Observation | Mode | Topic | Automation |\n|---|---|---|---|---|\n| T-001 | a | mock | cron | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('expect(clock.nowMs()).toBeGreaterThanOrEqual(0)');
  });

  it('T-STT-BODY-017 data queue - env.client.size assertion', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: data\n\n| ID | Observation | Mode | Topic | Automation |\n|---|---|---|---|---|\n| T-001 | a | mock | orders | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('expect(env.client.size()).toBeGreaterThanOrEqual(0)');
  });

  it('T-STT-BODY-018 api - expect res.status defined', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Mode | Route | Automation |\n|---|---|---|---|---|\n| T-001 | GET /x | live | /x | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain('expect(res.status).toBeDefined();');
  });

  it('T-STT-BODY-019 api - GET method uses literal string only (no body)', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Mode | Route | Automation |\n|---|---|---|---|---|\n| T-001 | GET /x | live | /x | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("env.request.get('/x');");
  });

  it('T-STT-BODY-020 api - POST method uses body placeholder', () => {
    const dir = mkTmp();
    const specPath = join(dir, 'spec.md');
    writeFileSync(
      specPath,
      `- module: x\n- layer: api\n\n| ID | When | Mode | Route | Automation |\n|---|---|---|---|---|\n| T-001 | POST /x | live | /x | yes |\n`,
      'utf8',
    );
    const out = join(dir, 'test.ts');
    runSpecToTest({ inPath: specPath, outPath: out, cwd: dir });
    const content = readFileSync(out, 'utf8');
    expect(content).toContain("env.request.post('/x', {/* body */});");
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
