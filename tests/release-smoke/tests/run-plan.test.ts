// How many packages to run at once is a question about the machine (#2227).
//
// Counting cores gets it wrong often enough to matter: on the 12-core machine
// this was written on, `--jobs 4` made every target 3-4× slower because swap
// was at 95%. So the number is chosen from measurements, and these checks pin
// which measurement wins and what happens when one cannot be taken.
//
// The decision is a pure function of a snapshot. Taking the snapshot is thin
// I/O tested separately with recorded output, because a check that runs
// `vm_stat` and asserts on the result would assert on whatever the machine
// happened to be doing.
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const MODULE = resolve(REPO_ROOT, 'scripts/lib/run-plan.mjs');

type Snapshot = {
  cores: number | null;
  reclaimableGb: number | null;
  swapRatio: number | null;
  load1: number | null;
  dockerUp: boolean | null;
  freeLaneSeconds: number | null;
  serialLaneSeconds: number | null;
  serialWorkSeconds: number | null;
};

const {
  PER_TARGET_GB,
  caps,
  measure,
  planJobs,
  readLaneSeconds,
  readReclaimableGb,
  readSwapRatio,
} = (await import(pathToFileURL(MODULE).href)) as {
  PER_TARGET_GB: number;
  caps: (s: Partial<Snapshot>) => { name: string; jobs: number; why: string }[];
  measure: (o: { repoRoot: string; serialLaneGroups?: string[][] }, io?: unknown) => Snapshot;
  planJobs: (s: Partial<Snapshot>) => { jobs: number; reason: string; binding: string };
  readLaneSeconds: (
    repoRoot: string,
    serialLaneGroups: string[][],
  ) => {
    freeLaneSeconds: number | null;
    serialLaneSeconds: number | null;
    serialWorkSeconds: number | null;
  };
  readReclaimableGb: (io?: unknown) => number | null;
  readSwapRatio: (io?: unknown) => number | null;
};

/** A machine with room to spare, as the baseline every case varies from. */
const IDLE: Snapshot = {
  cores: 12,
  reclaimableGb: 32,
  swapRatio: 0.05,
  load1: 1,
  dockerUp: true,
  freeLaneSeconds: 900,
  serialLaneSeconds: 150,
  serialWorkSeconds: 250,
};

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

describe('並列度をどの測定値で決めるか (#2227)', () => {
  it('T-RP-001 空いている機械では 1 より大きい', () => {
    const { jobs } = planJobs(IDLE);
    expect(jobs, '余裕がある機械でも 1 に落としている').toBeGreaterThan(1);
  });

  it('T-RP-002 swap がほぼ満杯なら 1 に落とす', () => {
    const strained = planJobs({ ...IDLE, swapRatio: 0.95 });
    expect(strained.jobs).toBe(1);
    expect(strained.binding, 'swap 以外が上限として報告されている').toBe('swap');
    expect(strained.reason).toContain('95%');

    // 中程度では 1 まで落とさない = 「swap を見ている」 が「常に 1」 ではない。
    const middling = planJobs({ ...IDLE, swapRatio: 0.6 });
    expect(middling.jobs, 'swap 60% で 1 まで落としている').toBeGreaterThan(1);
    expect(middling.jobs, 'swap 60% を無視している').toBeLessThanOrEqual(planJobs(IDLE).jobs);
  });

  it('T-RP-003 load が高いとその分だけ下げる', () => {
    const busy = planJobs({ ...IDLE, load1: 10 });
    expect(busy.jobs).toBeLessThan(planJobs(IDLE).jobs);
    expect(busy.binding).toBe('load');

    // コアを使い切っている機械では 1。
    expect(planJobs({ ...IDLE, load1: 24 }).jobs).toBe(1);
  });

  it('T-RP-004 メモリ余力が上限を決める', () => {
    // 3GB / 1.5GB = 2 件。
    const tight = planJobs({ ...IDLE, reclaimableGb: PER_TARGET_GB * 2 });
    expect(tight.jobs).toBe(2);
    expect(tight.binding).toBe('memory');
  });

  it('T-RP-005 直列車線の床を超える値を返さない', () => {
    // 直列車線自身も 1 slot を使う。free 300 秒 + 直列 150 秒を 150 秒の床まで
    // 縮めるには 3 slots が要る。
    const bounded = planJobs({
      ...IDLE,
      freeLaneSeconds: 300,
      serialLaneSeconds: 150,
      serialWorkSeconds: 150,
    });
    expect(bounded.jobs).toBe(3);
    expect(bounded.binding).toBe('floor');

    // 独立した直列車線は合算して床にしない。最長を床、両方を総仕事量にする。
    expect(planJobs({ ...IDLE, freeLaneSeconds: 300, serialWorkSeconds: 250 }).jobs).toBe(4);
  });

  it('T-RP-006 測れなかった値は 1 に倒す (余裕があることにしない)', () => {
    const unknowns: (keyof Snapshot)[] = ['cores', 'reclaimableGb', 'swapRatio', 'load1'];
    for (const key of unknowns) {
      const plan = planJobs({ ...IDLE, [key]: null });
      expect(plan.jobs, `${key} を測れないのに 1 より大きい値を返している`).toBe(1);
      expect(plan.reason, `${key} を測れなかったことが理由に出ていない`).toContain('測れなかった');
    }
  });

  it('T-RP-007 床だけは測れなくても 1 に倒さない', () => {
    // 床は「これ以上上げても無駄」 を表すだけで、危険を表さない。
    // ここを 1 に倒すと、過去の sweep log が無い repo で常に逐次になる。
    const plan = planJobs({
      ...IDLE,
      freeLaneSeconds: null,
      serialLaneSeconds: null,
      serialWorkSeconds: null,
    });
    expect(plan.jobs).toBeGreaterThan(1);
    expect(caps({ ...IDLE, freeLaneSeconds: null }).map((c) => c.name)).not.toContain('floor');
  });

  it('T-RP-008 docker が落ちていることを理由に書く (値は変えない)', () => {
    const down = planJobs({ ...IDLE, dockerUp: false });
    expect(down.jobs, 'docker の可否で並列度を変えている').toBe(planJobs(IDLE).jobs);
    expect(down.reason).toContain('docker');
  });

  it('T-RP-009 理由には上限とそれ以外の両方が出る', () => {
    const { reason } = planJobs({ ...IDLE, swapRatio: 0.95 });
    for (const name of ['cores', 'memory', 'load', 'floor']) {
      expect(reason, `${name} が理由に出ていない`).toContain(name);
    }
  });
});

describe('測定 (#2227)', () => {
  it('T-RP-010 vm_stat と swapusage を実際の出力形式から読む', () => {
    const vmStat = [
      'Mach Virtual Memory Statistics: (page size of 16384 bytes)',
      'Pages free:                                    15164.',
      'Pages active:                                 900000.',
      'Pages inactive:                               811496.',
      'Pages speculative:                              1173.',
      '',
    ].join('\n');
    const gb = readReclaimableGb({ execFileSync: () => vmStat });
    expect(gb, 'free + inactive + speculative を足せていない').toBeCloseTo(12.62, 1);

    const ratio = readSwapRatio({
      execFileSync: () => 'total = 22528.00M  used = 21325.38M  free = 1202.62M  (encrypted)\n',
    });
    expect(ratio).toBeCloseTo(0.947, 2);

    // swap を積んでいない機械は「満杯」 ではない。
    expect(readSwapRatio({ execFileSync: () => 'total = 0.00M  used = 0.00M  free = 0.00M\n' })).toBe(0);

    // 答えない command は null = 上の判定で 1 に倒れる。
    expect(readReclaimableGb({ execFileSync: () => { throw new Error('no such command'); } })).toBeNull();
    expect(readSwapRatio({ execFileSync: () => { throw new Error('no such command'); } })).toBeNull();
    expect(readReclaimableGb({ execFileSync: () => 'unexpected output' })).toBeNull();
  });

  it('T-RP-011 途中で止まった sweep log を測定として読まない', () => {
    const root = mkdtempSync(join(tmpdir(), 'run-plan-'));
    roots.push(root);
    const dir = join(root, '.context/scratch/sweep');
    mkdirSync(dir, { recursive: true });

    const lines = Array.from(
      { length: 20 },
      (_, i) => `[ ${i + 1}/166] ok    examples/demo-${i}  5.0s`,
    ).join('\n');

    // verdict 行が無い = 殺された run。 79/166 で止まった実 log は 12 秒の
    // 「直列車線」 を返し、機械が許す 12 倍の並列度を通してしまう。
    const older = join(dir, 'jobs-1.log');
    const newer = join(dir, 'jobs-4.log');
    writeFileSync(older, `${lines}\ngreen: 20   red: 0   dirty: 0   not run: 0\n`);
    writeFileSync(newer, `${lines}\n`);
    utimesSync(older, new Date(1_000), new Date(1_000));
    utimesSync(newer, new Date(2_000), new Date(2_000));
    expect(readLaneSeconds(root, []).freeLaneSeconds, '最新の途中 log を測定として読んでいる').toBeNull();

    // 最新 log に verdict 行があれば読む。filename の昇順ではなく mtime で選ぶ。
    writeFileSync(newer, `${lines}\ngreen: 20   red: 0   dirty: 0   not run: 0\n`);
    utimesSync(newer, new Date(3_000), new Date(3_000));
    expect(readLaneSeconds(root, []).freeLaneSeconds).toBeCloseTo(100, 0);

    // 独立した直列車線は別々に数え、最長車線と全直列仕事量を返す。
    const withSerial = readLaneSeconds(root, [
      ['examples/demo-0', 'examples/demo-1'],
      ['examples/demo-2'],
    ]);
    expect(withSerial.serialLaneSeconds).toBeCloseTo(10, 0);
    expect(withSerial.serialWorkSeconds).toBeCloseTo(15, 0);
    expect(withSerial.freeLaneSeconds).toBeCloseTo(85, 0);
  });

  it('T-RP-012 実機で測って計画が返る', () => {
    const snapshot = measure({ repoRoot: REPO_ROOT, serialLaneGroups: [['packages/orm']] });
    expect(snapshot.cores, 'コア数を測れていない').toBeGreaterThan(0);
    const plan = planJobs(snapshot);
    expect(plan.jobs, '1 未満を返している').toBeGreaterThanOrEqual(1);
    expect(plan.reason.length, '理由が空').toBeGreaterThan(10);
  }, 60_000);
});
