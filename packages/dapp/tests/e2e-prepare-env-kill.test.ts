import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// killAnvilFromPidFile の kill 経路 (matchesPidEntry → killPidWithWait →
// waitForPidExit → sleepSync) は「pid file に載った pid が生きていて、 かつ ps が
// anvil を返す」 時にしか通らない。 既存 test は実 node process の pid を使うため
// ps が node を返して必ず skip 側に落ちていた。
//
// 本 test は外部依存 2 つ (ps 実行 = node:child_process.execFileSync / signal 送出 =
// process.kill) だけを差し替えて、 実 process を 1 つも触らずに kill 経路を通す。
// pid file の読み書きは実 file (tmpdir) をそのまま使う。
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  spawn: vi.fn(),
}));

async function loadEnvModule() {
  return await import('../src/e2e-prepare-env.js');
}
async function loadCp() {
  return await import('node:child_process');
}

/** ps -o lstart= -o comm= の 1 行出力を組み立てる (lstart は空白を含む固定書式)。 */
function psOutput(startedAt: Date, command: string): string {
  const lstart = startedAt.toUTCString().replace(/,/g, '');
  return `${lstart} ${command}\n`;
}

const FAKE_PID = 424242;

describe('killAnvilFromPidFile kill 経路 (mocked ps + process.kill)', () => {
  let tmp: string;
  let pidFile: string;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'kiwa-pidkill-'));
    pidFile = join(tmp, 'anvil.pid');
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReset();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('T-EPE-201 alive な anvil pid に SIGTERM を送り、 即 exit すれば SIGKILL を送らない', async () => {
    const startedAt = new Date('2026-08-20T10:00:00Z');
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(startedAt, '/usr/local/bin/anvil'),
    );
    // port / startedAt / command を全て持つ entry = parsePidEntryLine の全 field 経路と
    // matchesPidEntry の command 一致 + startedAt 近接一致を同時に通す
    writeFileSync(
      pidFile,
      `${JSON.stringify({
        pid: FAKE_PID,
        port: 8545,
        startedAt: startedAt.toISOString(),
        command: '/usr/local/bin/anvil',
      })}\n`,
      'utf8',
    );

    // signal 0 = 生存確認。 SIGTERM 送出後は「既に居ない」 を返して即 exit を再現する
    let sigtermSent = false;
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) {
        if (sigtermSent) throw new Error('ESRCH');
        return true;
      }
      if (signal === 'SIGTERM') sigtermSent = true;
      return true;
    }) as unknown as typeof process.kill);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
    // waitForPidExit が「消えた」 を返したので昇格は起きない
    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGKILL');
    // ps は entry の pid に対して呼ばれる
    expect((cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      'ps',
      ['-o', 'lstart=', '-o', 'comm=', '-p', String(FAKE_PID)],
      expect.objectContaining({ encoding: 'utf8' }),
    ]);
  });

  it('T-EPE-202 SIGTERM 無反応なら timeout 後に SIGKILL へ昇格する', async () => {
    const startedAt = new Date('2026-08-20T10:00:00Z');
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(startedAt, 'anvil'),
    );
    writeFileSync(
      pidFile,
      `${JSON.stringify({ pid: FAKE_PID, startedAt: startedAt.toISOString() })}\n`,
      'utf8',
    );

    // SIGTERM では死なず、 SIGKILL で初めて消える process を再現する。
    // SIGTERM 側の waitForPidExit は deadline まで sleepSync で polling して false を返す。
    let killed = false;
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) {
        if (killed) throw new Error('ESRCH');
        return true;
      }
      if (signal === 'SIGKILL') killed = true;
      return true;
    }) as unknown as typeof process.kill);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
    expect(killSpy).toHaveBeenCalledWith(FAKE_PID, 'SIGKILL');
    // polling は SIGTERM 待ちで複数回走る (即 return なら 1 回で終わる)
    const aliveProbes = killSpy.mock.calls.filter((call) => call[1] === 0);
    expect(aliveProbes.length).toBeGreaterThan(2);
  }, 20_000);

  it('T-EPE-202b SIGKILL の送出自体が失敗しても例外を投げずに打ち切る', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(new Date('2026-08-20T10:00:00Z'), 'anvil'),
    );
    writeFileSync(pidFile, `${JSON.stringify({ pid: FAKE_PID, command: 'anvil' })}\n`, 'utf8');

    // SIGTERM は通るが消えず、 昇格した SIGKILL の送出で権限エラーになる状況。
    // 呼出元 (prepare-env / teardown) を巻き込まないよう握り潰す契約
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) return true;
      if (signal === 'SIGKILL') throw new Error('EPERM');
      return true;
    }) as unknown as typeof process.kill);

    const env = await loadEnvModule();
    expect(() => env.killAnvilFromPidFile(pidFile)).not.toThrow();

    expect(killSpy).toHaveBeenCalledWith(FAKE_PID, 'SIGKILL');
    // SIGKILL が届かなかったので、 その後の消滅待ちには入らない
    const probesAfterKill = killSpy.mock.calls
      .slice(killSpy.mock.calls.findIndex((call) => call[1] === 'SIGKILL'))
      .filter((call) => call[1] === 0);
    expect(probesAfterKill).toHaveLength(0);
  }, 20_000);

  it('T-EPE-203 startedAt を持たない entry は command 一致だけで kill 対象になる', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(new Date('2026-08-20T10:00:00Z'), 'anvil'),
    );
    writeFileSync(pidFile, `${JSON.stringify({ pid: FAKE_PID, command: 'anvil' })}\n`, 'utf8');

    let sigtermSent = false;
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) {
        if (sigtermSent) throw new Error('ESRCH');
        return true;
      }
      if (signal === 'SIGTERM') sigtermSent = true;
      return true;
    }) as unknown as typeof process.kill);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
  });

  it('T-EPE-204 entry.command が実 command と食い違えば kill せず warn して skip する', async () => {
    const cp = await loadCp();
    // ps は anvil を返すが、 pid file に記録された command は別物 = pid 再利用の疑い
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(new Date('2026-08-20T10:00:00Z'), 'anvil'),
    );
    writeFileSync(
      pidFile,
      `${JSON.stringify({ pid: FAKE_PID, command: '/opt/other/anvil-fork' })}\n`,
      'utf8',
    );

    const killSpy = vi.spyOn(process, 'kill').mockImplementation((() => true) as never);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`stale or hijacked, skipping kill for pid ${FAKE_PID}`),
    );
  });

  it('T-EPE-205 startedAt が解析不能なら kill せず skip する', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(new Date('2026-08-20T10:00:00Z'), 'anvil'),
    );
    writeFileSync(
      pidFile,
      `${JSON.stringify({ pid: FAKE_PID, startedAt: 'not-a-date' })}\n`,
      'utf8',
    );

    const killSpy = vi.spyOn(process, 'kill').mockImplementation((() => true) as never);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('stale or hijacked'));
  });

  it('T-EPE-206 startedAt が 1 秒以上ずれていれば pid 再利用とみなし skip する', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(new Date('2026-08-20T10:00:00Z'), 'anvil'),
    );
    writeFileSync(
      pidFile,
      `${JSON.stringify({ pid: FAKE_PID, startedAt: '2026-08-20T10:05:00Z' })}\n`,
      'utf8',
    );

    const killSpy = vi.spyOn(process, 'kill').mockImplementation((() => true) as never);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
  });

  it('T-EPE-207 ps が失敗したら process の素性を確認できないため kill しない', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('ps exit 1');
    });
    writeFileSync(pidFile, `${JSON.stringify({ pid: FAKE_PID, command: 'anvil' })}\n`, 'utf8');

    const killSpy = vi.spyOn(process, 'kill').mockImplementation((() => true) as never);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('stale or hijacked'));
  });

  it('T-EPE-208 ps 出力が空行だけなら詳細なしとみなし kill しない', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('   \n\n');
    writeFileSync(pidFile, `${JSON.stringify({ pid: FAKE_PID, command: 'anvil' })}\n`, 'utf8');

    const killSpy = vi.spyOn(process, 'kill').mockImplementation((() => true) as never);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
  });

  it('T-EPE-209 SIGTERM 送出自体が失敗したら SIGKILL に進まず打ち切る', async () => {
    const cp = await loadCp();
    (cp.execFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      psOutput(new Date('2026-08-20T10:00:00Z'), 'anvil'),
    );
    writeFileSync(pidFile, `${JSON.stringify({ pid: FAKE_PID, command: 'anvil' })}\n`, 'utf8');

    // 生存確認は通るが SIGTERM の送出で権限エラーになる状況
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(((
      _pid: number,
      signal?: unknown,
    ) => {
      if (signal === 0) return true;
      throw new Error('EPERM');
    }) as unknown as typeof process.kill);

    const env = await loadEnvModule();
    env.killAnvilFromPidFile(pidFile);

    expect(killSpy).toHaveBeenCalledWith(FAKE_PID, 'SIGTERM');
    expect(killSpy).not.toHaveBeenCalledWith(FAKE_PID, 'SIGKILL');
  });
});
