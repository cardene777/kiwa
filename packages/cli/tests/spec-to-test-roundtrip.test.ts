// Round-trip verifier: spec.md → kiwa spec-to-test → generated test → AST sanity check.
// We do not actually invoke vitest on the generated file (it would require fixtures + components
// that the user has to supply). Instead we ensure the generated file is syntactically valid
// TypeScript and that every TC ID from the spec appears verbatim inside an `it('T-XXX-NNN ...')` call.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as ts from 'typescript';
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
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-stt-rt-'));
  dirs.push(dir);
  return dir;
}

function assertParses(code: string, fileName: string): void {
  const isTsx = fileName.endsWith('.tsx');
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const errors = (sourceFile as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics ?? [];
  expect(errors, () =>
    errors
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      .join('\n'),
  ).toHaveLength(0);
}

function assertAllIdsPresent(code: string, ids: string[]): void {
  for (const id of ids) {
    expect(code.includes(`'${id}`)).toBe(true);
  }
}

const API_SPEC = `- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | GET happy | empty | GET /api/items | 200 | P0 | yes | live | /api/items |
| T-API-002 | POST happy | empty | POST /api/items | 201 | P0 | yes | live | /api/items |
| T-API-003 | DELETE happy | one | DELETE /api/items | 204 | P1 | yes | mock | /api/items |
`;

const UI_SPEC = `- module: counter
- layer: ui

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Component |
|---|---|---|---|---|---|---|---|---|
| T-UI-001 | render initial | initial=3 | mount | shows 3 | P0 | yes | render | Counter |
| T-UI-002 | interaction click | initial=0 | click + | shows 1 | P0 | yes | interaction | Counter |
| T-UI-003 | snapshot markup | initial=7 | mount | markup OK | P1 | yes | snapshot | Counter |
`;

const DATA_SPEC = `- module: orders
- layer: data

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |
|---|---|---|---|---|---|---|---|---|
| T-DATA-001 | queue ok | empty | send | accepted | P0 | yes | mock | orders |
| T-DATA-002 | cron fire | 100ms | advance 350 | 3 fires | P0 | yes | mock | cron |
`;

const CLI_SPEC = `- module: my-cli
- layer: cli

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |
|---|---|---|---|---|---|---|---|---|
| T-CLI-001 | help ok | --help | run kiwa --help | exit 0 | P0 | yes | mock | help |
| T-CLI-002 | unknown | unknown | run kiwa nope | exit non-zero | P1 | yes | mock | help |
`;

describe('runSpecToTest round-trip (parse + ID coverage)', () => {
  it('api layer: generated file parses and covers all TC IDs', () => {
    const dir = mkTmp();
    const inPath = join(dir, 'spec.md');
    const outPath = join(dir, 'out.ts');
    writeFileSync(inPath, API_SPEC, 'utf8');
    const result = runSpecToTest({ inPath, outPath, cwd: dir });
    expect(result.layer).toBe('api');
    expect(result.count).toBe(3);
    const code = readFileSync(outPath, 'utf8');
    assertParses(code, outPath);
    assertAllIdsPresent(code, ['T-API-001', 'T-API-002', 'T-API-003']);
    expect(code).toContain("env.request.get");
    expect(code).toContain("env.request.post");
    expect(code).toContain("env.request.delete");
  });

  it('ui layer: generated tsx file parses and covers all TC IDs', () => {
    const dir = mkTmp();
    const inPath = join(dir, 'spec.md');
    const outPath = join(dir, 'out.tsx');
    writeFileSync(inPath, UI_SPEC, 'utf8');
    const result = runSpecToTest({ inPath, outPath, cwd: dir });
    expect(result.layer).toBe('ui');
    expect(result.count).toBe(3);
    const code = readFileSync(outPath, 'utf8');
    assertParses(code, outPath);
    assertAllIdsPresent(code, ['T-UI-001', 'T-UI-002', 'T-UI-003']);
    expect(code).toContain("mode: 'render'");
    expect(code).toContain("mode: 'interaction'");
    expect(code).toContain("mode: 'snapshot'");
  });

  it('data layer: generated file parses, uses createFakeClock for cron topic', () => {
    const dir = mkTmp();
    const inPath = join(dir, 'spec.md');
    const outPath = join(dir, 'out.ts');
    writeFileSync(inPath, DATA_SPEC, 'utf8');
    const result = runSpecToTest({ inPath, outPath, cwd: dir });
    expect(result.layer).toBe('data');
    expect(result.count).toBe(2);
    const code = readFileSync(outPath, 'utf8');
    assertParses(code, outPath);
    assertAllIdsPresent(code, ['T-DATA-001', 'T-DATA-002']);
    expect(code).toContain('createFakeClock');
    expect(code).toContain('setupQueueEnv');
  });

  it('cli layer: generated file parses and references expectExitCode', () => {
    const dir = mkTmp();
    const inPath = join(dir, 'spec.md');
    const outPath = join(dir, 'out.ts');
    writeFileSync(inPath, CLI_SPEC, 'utf8');
    const result = runSpecToTest({ inPath, outPath, cwd: dir });
    expect(result.layer).toBe('cli');
    expect(result.count).toBe(2);
    const code = readFileSync(outPath, 'utf8');
    assertParses(code, outPath);
    assertAllIdsPresent(code, ['T-CLI-001', 'T-CLI-002']);
    expect(code).toContain('expectExitCode');
  });
});
