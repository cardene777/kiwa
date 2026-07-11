import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { killAnvilFromPidFile, writePidEntry } from '../src/e2e-prepare-env.js';

describe('writePidEntry', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'kiwa-pid-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('T-EPE-001 pid のみの entry を append する', () => {
    const file = join(tmp, 'nested', 'anvil.pid');
    writePidEntry(file, { pid: 12345 });

    expect(existsSync(file)).toBe(true);
    const line = readFileSync(file, 'utf8').trim();
    expect(JSON.parse(line)).toEqual({ pid: 12345 });
  });

  it('T-EPE-002 pid + port + startedAt + command の完全 entry を append する', () => {
    const file = join(tmp, 'anvil.pid');
    writePidEntry(file, {
      pid: 999,
      port: 8545,
      startedAt: '2026-07-11T00:00:00Z',
      command: '/opt/anvil',
    });

    const line = readFileSync(file, 'utf8').trim();
    const parsed = JSON.parse(line);
    expect(parsed.pid).toBe(999);
    expect(parsed.port).toBe(8545);
    expect(parsed.startedAt).toBe('2026-07-11T00:00:00Z');
    expect(parsed.command).toBe('/opt/anvil');
  });

  it('T-EPE-003 複数回 append で全 entry が改行区切りで保持される', () => {
    const file = join(tmp, 'anvil.pid');
    writePidEntry(file, { pid: 1 });
    writePidEntry(file, { pid: 2 });
    writePidEntry(file, { pid: 3 });

    const lines = readFileSync(file, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines.map((l) => JSON.parse(l).pid)).toEqual([1, 2, 3]);
  });
});

describe('killAnvilFromPidFile', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'kiwa-pid-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('T-EPE-101 pid file が存在しない場合は no-op', () => {
    expect(() => killAnvilFromPidFile(join(tmp, 'missing.pid'))).not.toThrow();
  });

  it('T-EPE-102 dead pid の entry は skip して file を削除する', () => {
    const file = join(tmp, 'anvil.pid');
    // 明らかに存在しない pid (2^31-1) を書いておく
    writePidEntry(file, { pid: 2147483646 });
    expect(existsSync(file)).toBe(true);

    killAnvilFromPidFile(file);

    // dead pid なので kill 対象なく、 file は cleanup される
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-103 legacy 純 pid (JSON でない数字行) と invalid line 混在も安全に処理する', () => {
    const file = join(tmp, 'anvil.pid');
    // legacy raw pid + invalid line + JSON entry
    writeFileSync(
      file,
      ['2147483645', 'not-a-json', JSON.stringify({ pid: 2147483644 }), ''].join('\n'),
      'utf8',
    );

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-104 JSON object で pid field が欠落した entry は無視する', () => {
    const file = join(tmp, 'anvil.pid');
    writeFileSync(
      file,
      [JSON.stringify({ port: 8545 }), JSON.stringify({ pid: 0 }), JSON.stringify({ pid: -1 })].join(
        '\n',
      ),
      'utf8',
    );

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-105 raw number が invalid (0 / 負) の legacy 行は無視する', () => {
    const file = join(tmp, 'anvil.pid');
    writeFileSync(file, ['0', '-5', 'abc'].join('\n'), 'utf8');

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-106 alive process (現在の node process) は anvil でないため kill を skip する', () => {
    const file = join(tmp, 'anvil.pid');
    // vitest 実行中の node process pid — anvil でないので matchesPidEntry で kill skip される
    writePidEntry(file, { pid: process.pid, command: 'anvil' });

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-107 startedAt 付き entry で stale なら skip し unlink する', () => {
    const file = join(tmp, 'anvil.pid');
    // node process pid + 明らかに古い startedAt — matchesPidEntry で command 不一致 or 差異検知
    writePidEntry(file, {
      pid: process.pid,
      command: 'anvil',
      startedAt: '1970-01-01T00:00:00Z',
    });

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-108 command 不整合 (期待 nonexistent-cmd) は matchesPidEntry で false 判定', () => {
    const file = join(tmp, 'anvil.pid');
    writePidEntry(file, { pid: process.pid, command: 'nonexistent-cmd-xyz' });

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-109 startedAt が invalid string でも throw しない', () => {
    const file = join(tmp, 'anvil.pid');
    writePidEntry(file, {
      pid: process.pid,
      command: 'anvil',
      startedAt: 'not-a-date',
    });

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
    expect(existsSync(file)).toBe(false);
  });

  it('T-EPE-110 pid file が壊れていて readFileSync が throw しても [] を返す (defensively catch)', () => {
    // dir を pid file として指定 (readFileSync が throw する)
    const file = join(tmp, 'dir-as-file');
    // dir を作って pid file として渡す
    // existsSync は true になり、 readFileSync は EISDIR で throw
    // 内部の readPidEntriesFromFile try/catch でカバー
    // ただし unlinkSync も dir に対しては ENOENT ではないので try/catch でカバー
    // Node の rmdirSync ではなく unlinkSync なので EISDIR / EPERM を吐く可能性
    // 影響はなく、 skip される
    const { mkdirSync } = require('node:fs') as typeof import('node:fs');
    mkdirSync(file);

    expect(() => killAnvilFromPidFile(file)).not.toThrow();
  });
});
