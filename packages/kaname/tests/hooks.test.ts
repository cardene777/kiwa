/**
 * The hooks are what turn the rules from advice into refusal, so what is tested
 * here is the refusal itself: the exit status Claude Code reads, and the message
 * it hands back. A gate that passes when it should refuse is worse than no gate,
 * because the project believes it is guarded.
 *
 * Every hook runs under `/bin/bash`, which on macOS is bash 3.2. It is the
 * oldest shell these scripts will meet, so it is the one they are tested under.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const BASH = '/bin/bash';
const SH = '/bin/sh';
const HOOKS = resolve(process.cwd(), 'templates/claude/hooks');
const SPEC_GATE = join(HOOKS, 'spec-gate.sh');
const VERIFY_GATE = join(HOOKS, 'verify-gate.sh');

/** Modification times, far enough apart that no filesystem rounds them together. */
const EARLIER = 1_700_000_000;
const LATER = EARLIER + 3600;

const CRITERION_WITH_TARGET = [
  '## AC-001 — the refresh token is persisted before the response is sent',
  '',
  '- **Layer** — runtime',
  '- **Verify by** — `tests/session.test.ts`',
  '',
].join('\n');

const CRITERION_WITHOUT_TARGET = [
  '## AC-002 — the session expires after thirty minutes',
  '',
  '- **Layer** — runtime',
  '',
].join('\n');

let root: string;
let scratchBins: string[] = [];

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'kaname-hooks-'));
  scratchBins = [];
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  for (const bin of scratchBins) rmSync(bin, { recursive: true, force: true });
});

interface HookResult {
  status: number;
  stderr: string;
}

interface ToolCall {
  session_id: string;
  cwd: string;
  hook_event_name: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
}

function runHook(script: string, payload: ToolCall, env: Record<string, string> = {}): HookResult {
  const result = spawnSync(BASH, [script], {
    input: JSON.stringify(payload),
    encoding: 'utf-8',
    env: { PATH: process.env.PATH ?? '', CLAUDE_PROJECT_DIR: root, ...env },
  });
  return { status: result.status ?? -1, stderr: result.stderr ?? '' };
}

/**
 * The lines the refusal quotes back, which are the criteria it objected to. The
 * message goes on to show a well-formed criterion as an example, so reading the
 * whole of stderr would find every id in it whether or not it was at fault.
 */
function quotedOffenders(stderr: string): string[] {
  const [, offenders = ''] = stderr.split('\n\n');
  return offenders.split('\n').filter((line) => line.trim() !== '');
}

function write(target: string, body: string, mtime = EARLIER): string {
  const path = join(root, target);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body, 'utf-8');
  utimesSync(path, mtime, mtime);
  return path;
}

/** Where a tool actually lives, so a trimmed PATH can still reach it. */
function locate(tool: string): string {
  if (tool === 'node') return process.execPath;
  const found = spawnSync(SH, ['-c', `command -v ${tool}`], { encoding: 'utf-8' });
  return (found.stdout ?? '').trim();
}

/** What `command -v` finds for a tool on the given PATH, if anything. */
function visibleOn(path: string, tool: string): string {
  const found = spawnSync(SH, ['-c', `command -v ${tool}`], { env: { PATH: path }, encoding: 'utf-8' });
  return (found.stdout ?? '').trim();
}

/** A PATH holding exactly the named tools, and nothing else. */
function binWith(tools: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'kaname-bin-'));
  scratchBins.push(dir);
  for (const tool of tools) {
    const real = locate(tool);
    if (real !== '') symlinkSync(real, join(dir, tool));
  }
  return dir;
}

function writeCall(target: string, content: string): ToolCall {
  return {
    session_id: 'test',
    cwd: root,
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: join(root, target), content },
  };
}

function editCall(target: string, newString: string): ToolCall {
  return {
    session_id: 'test',
    cwd: root,
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: join(root, target), old_string: '', new_string: newString },
  };
}

function bashCall(command: string): ToolCall {
  return {
    session_id: 'test',
    cwd: root,
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  };
}

const SPEC = 'docs/spec/session/specRuntime.md';

describe('spec-gate refuses a criterion with no verification target', () => {
  it('T-HOOK-001 a criterion that names a target is allowed through', () => {
    expect(runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITH_TARGET)).status).toBe(0);
  });

  it('T-HOOK-002 a criterion with no target is blocked, and the refusal quotes it', () => {
    const result = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITHOUT_TARGET));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('AC-002');
    expect(result.stderr).toContain('names no verification target');
  });

  it('T-HOOK-003 a target that is present but empty is blocked', () => {
    const body = '## AC-003 — a thing\n\n- **Verify by** — ``\n';
    expect(runHook(SPEC_GATE, writeCall(SPEC, body)).status).toBe(2);
  });

  it('T-HOOK-004 a file outside the spec directory is not the gate’s business', () => {
    const call = writeCall('src/session.ts', CRITERION_WITHOUT_TARGET);
    expect(runHook(SPEC_GATE, call).status).toBe(0);
  });

  it('T-HOOK-005 the spec readme carries no criteria, so it is left alone', () => {
    expect(runHook(SPEC_GATE, writeCall('docs/spec/README.md', CRITERION_WITHOUT_TARGET)).status).toBe(0);
  });

  it('T-HOOK-006 a non-markdown file in the spec directory is left alone', () => {
    expect(runHook(SPEC_GATE, writeCall('docs/spec/session/notes.txt', CRITERION_WITHOUT_TARGET)).status).toBe(0);
  });

  it('T-HOOK-007 a prose heading is not a criterion and is not asked to name a target', () => {
    const body = '## Overview\n\nWhat this feature is for.\n';
    expect(runHook(SPEC_GATE, writeCall(SPEC, body)).status).toBe(0);
  });

  it('T-HOOK-008 the last criterion in a file is checked, not dropped with the tail', () => {
    const body = `${CRITERION_WITH_TARGET}\n${CRITERION_WITHOUT_TARGET}`;
    const result = runHook(SPEC_GATE, writeCall(SPEC, body));
    expect(result.status).toBe(2);
    expect(quotedOffenders(result.stderr)).toEqual([expect.stringContaining('AC-002')]);
  });

  it('T-HOOK-009 an edit that introduces a criterion must introduce its target with it', () => {
    expect(runHook(SPEC_GATE, editCall(SPEC, '## AC-004 — another thing\n')).status).toBe(2);
  });

  it('T-HOOK-010 an edit that only reworks prose is allowed', () => {
    expect(runHook(SPEC_GATE, editCall(SPEC, 'reworded a sentence in the notes')).status).toBe(0);
  });

  it('T-HOOK-011 an edit that blanks an existing target is blocked', () => {
    expect(runHook(SPEC_GATE, editCall(SPEC, '- **Verify by** — ``')).status).toBe(2);
  });

  it('T-HOOK-012 a tool other than Write or Edit is not inspected', () => {
    const call: ToolCall = { ...writeCall(SPEC, CRITERION_WITHOUT_TARGET), tool_name: 'Read' };
    expect(runHook(SPEC_GATE, call).status).toBe(0);
  });

  it('T-HOOK-013 the configured spec directory is the one that is watched', () => {
    write('kaname.config.json', '{"tracker":"none","specDir":"spec","lean":{"verify":"auto"}}');

    const watched = runHook(SPEC_GATE, writeCall('spec/session/specRuntime.md', CRITERION_WITHOUT_TARGET));
    const unwatched = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITHOUT_TARGET));

    expect(watched.status).toBe(2);
    expect(unwatched.status).toBe(0);
  });

  it('T-HOOK-014 the refusal names the file and points at the rule behind it', () => {
    const result = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITHOUT_TARGET));
    expect(result.stderr).toContain(SPEC);
    expect(result.stderr).toContain('.claude/rules/spec-layers.md');
  });

  it('T-HOOK-015 the project root falls back to the cwd the payload carries', () => {
    const result = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITHOUT_TARGET), {
      CLAUDE_PROJECT_DIR: '',
    });
    expect(result.status).toBe(2);
  });
});

describe('verify-gate refuses to make unverified work permanent', () => {
  function verified(line = '2026-01-01T00:00:00Z formal=passed runtime=passed human=reviewed'): void {
    write('.kaname/verified', `${line}\n`, LATER);
  }

  it('T-HOOK-030 a project with no spec directory is not gated', () => {
    expect(runHook(VERIFY_GATE, bashCall('git commit -m "chore: start"')).status).toBe(0);
  });

  it('T-HOOK-031 a spec directory holding only a readme is not gated', () => {
    write('docs/spec/README.md', 'how specs work here\n');
    expect(runHook(VERIFY_GATE, bashCall('git commit -m "docs"')).status).toBe(0);
  });

  it('T-HOOK-032 a commit is refused while nothing has verified the specification', () => {
    write(SPEC, CRITERION_WITH_TARGET);
    const result = runHook(VERIFY_GATE, bashCall('git commit -m "feat: session"'));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('nothing has verified docs/spec');
    expect(result.stderr).toContain('/verify');
  });

  it('T-HOOK-033 a commit passes when the record is newer than every specification', () => {
    write(SPEC, CRITERION_WITH_TARGET, EARLIER);
    verified();
    expect(runHook(VERIFY_GATE, bashCall('git commit -m "feat: session"')).status).toBe(0);
  });

  it('T-HOOK-034 a specification newer than the record refuses the commit', () => {
    verified();
    write(SPEC, CRITERION_WITH_TARGET, LATER + 3600);
    const result = runHook(VERIFY_GATE, bashCall('git commit -m "feat: session"'));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('changed after the last verification');
    expect(result.stderr).toContain(SPEC);
  });

  it('T-HOOK-035 the refusal quotes the record, so the reader sees what it established', () => {
    verified('2026-01-01T00:00:00Z formal=skipped runtime=passed human=none');
    write(SPEC, CRITERION_WITH_TARGET, LATER + 3600);
    const result = runHook(VERIFY_GATE, bashCall('git commit -m x'));
    expect(result.stderr).toContain('formal=skipped runtime=passed human=none');
  });

  it('T-HOOK-036 git push is gated exactly as git commit is', () => {
    write(SPEC, CRITERION_WITH_TARGET);
    expect(runHook(VERIFY_GATE, bashCall('git push origin main')).status).toBe(2);
  });

  it('T-HOOK-037 a commit buried in a chain of commands is still a commit', () => {
    write(SPEC, CRITERION_WITH_TARGET);
    expect(runHook(VERIFY_GATE, bashCall('pnpm test && git commit -m x')).status).toBe(2);
  });

  it.each([
    ['git status --porcelain'],
    ['git log --grep commit'],
    ['mygit commit'],
    ['gitlab push'],
    ['git-commit-helper'],
  ])('T-HOOK-038 %s is not a publishing command and passes through', (command) => {
    write(SPEC, CRITERION_WITH_TARGET);
    expect(runHook(VERIFY_GATE, bashCall(command)).status).toBe(0);
  });

  it('T-HOOK-039 editing the readme does not stale the record', () => {
    write(SPEC, CRITERION_WITH_TARGET, EARLIER);
    verified();
    write('docs/spec/README.md', 'reworded\n', LATER + 3600);
    expect(runHook(VERIFY_GATE, bashCall('git commit -m "docs"')).status).toBe(0);
  });

  it('T-HOOK-040 the configured spec directory is the one that is watched', () => {
    write('kaname.config.json', '{"tracker":"none","specDir":"spec","lean":{"verify":"auto"}}');
    write('spec/session/specRuntime.md', CRITERION_WITH_TARGET);
    expect(runHook(VERIFY_GATE, bashCall('git commit -m x')).status).toBe(2);
  });
});

describe('a gate that cannot read its input refuses rather than waves through', () => {
  it('T-HOOK-050 spec-gate falls back to node when jq is not installed', () => {
    const path = binWith(['awk', 'cat', 'find', 'head', 'node']);
    expect(visibleOn(path, 'jq')).toBe('');
    expect(visibleOn(path, 'node')).not.toBe('');

    const blocked = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITHOUT_TARGET), { PATH: path });
    const allowed = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITH_TARGET), { PATH: path });

    expect(blocked.status).toBe(2);
    expect(blocked.stderr).toContain('AC-002');
    expect(allowed.status).toBe(0);
  });

  it('T-HOOK-051 verify-gate falls back to node when jq is not installed', () => {
    const path = binWith(['awk', 'cat', 'find', 'head', 'node']);
    write(SPEC, CRITERION_WITH_TARGET);
    expect(runHook(VERIFY_GATE, bashCall('git commit -m x'), { PATH: path }).status).toBe(2);
  });

  it('T-HOOK-052 with neither jq nor node, spec-gate refuses a change it cannot check', () => {
    const path = binWith(['awk', 'cat', 'find', 'head']);
    expect(visibleOn(path, 'jq')).toBe('');
    expect(visibleOn(path, 'node')).toBe('');

    const result = runHook(SPEC_GATE, writeCall(SPEC, CRITERION_WITH_TARGET), { PATH: path });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('neither jq nor node');
  });

  it('T-HOOK-053 with neither jq nor node, verify-gate refuses the commit', () => {
    const path = binWith(['awk', 'cat', 'find', 'head']);
    const result = runHook(VERIFY_GATE, bashCall('git commit -m x'), { PATH: path });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('neither jq nor node');
  });
});
