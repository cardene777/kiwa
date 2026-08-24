// `scripts/test-all.mjs --jobs N` runs targets side by side (#2215).
//
// The sweep was serial because many `test` scripts rebuild the workspace
// packages they depend on, so two at once rewrite the same `dist`. That cause
// is gone: the parallel path builds once up front and sets
// `KIWA_DEPS_PREBUILT=1`, which makes `scripts/build-deps.mjs` a no-op in every
// child. What remains is two groups that contend on a machine-wide resource —
// the Docker daemon and Chromium — and each gets a lane that stays serial.
//
// The integration checks run the real script against a fixture workspace built
// in a temporary directory, not against this repository: a sweep of this
// repository takes the better part of an hour, and a test that cannot afford to
// run the thing it is testing ends up asserting on the source text instead.
// The fixture names three of its packages `packages/e2e`, `packages/ui` and
// `examples/full-stack-poc` so the real `CHROMIUM_LANE` applies to it unchanged.
import { execFile } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/test-all.mjs');

/** One workspace target, as `discoverPackages` returns it. */
type Target = { dir: string; name: string };
type Lanes = { free: Target[]; docker: Target[]; chromium: Target[]; missing: string[] };

// Declared here rather than imported: the script is JavaScript, and the shape
// this test relies on is worth stating where the test can be read.
const {
  CHROMIUM_LANE,
  discoverPackages,
  laneMembership,
  limitConcurrency,
  parseProjectList,
  pool,
  validateJobs,
} = (await import(pathToFileURL(SCRIPT).href)) as {
    CHROMIUM_LANE: readonly string[];
    discoverPackages: (projects: unknown, root: string) => Target[];
    laneMembership: (
      packages: Target[],
      root: string,
      opts?: { roster?: Target[]; dependsOn?: (dir: string) => boolean },
    ) => Lanes;
    limitConcurrency: <R>(limit: number) => (task: () => Promise<R>) => Promise<R>;
    parseProjectList: (text: string) => unknown;
    pool: <T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>) => Promise<R[]>;
    validateJobs: (raw: string) => number;
};

/** One `pnpm test` in the fixture, as its own script recorded it. */
type Trace = { name: string; phase: 'start' | 'end'; at: number; prebuilt: string };

/** The fixture members of one lane, by the name they record. */
const laneOf = (names: readonly string[]) => (trace: Trace[]) => trace.filter((e) => names.includes(e.name));

function readTrace(file: string): Trace[] {
  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Trace);
}

/** The highest number of fixture packages that were running at the same moment. */
function peakConcurrency(trace: Trace[]): number {
  const events = [...trace].sort((a, b) => a.at - b.at || (a.phase === 'end' ? -1 : 1));
  let live = 0;
  let peak = 0;
  for (const event of events) {
    live += event.phase === 'start' ? 1 : -1;
    peak = Math.max(peak, live);
  }
  return peak;
}

/** Whether any two of `names` were running at the same time. */
function overlapped(trace: Trace[], names: string[]): boolean {
  const spans = names.map((name) => {
    const start = trace.find((t) => t.name === name && t.phase === 'start');
    const end = trace.find((t) => t.name === name && t.phase === 'end');
    // A missing span would make every comparison below vacuously false, so the
    // lane would read as serial precisely when the target never ran.
    if (!start || !end) throw new Error(`${name} has no recorded span`);
    return { from: start.at, to: end.at };
  });
  for (const [i, a] of spans.entries()) {
    for (const b of spans.slice(i + 1)) {
      if (a.from < b.to && b.from < a.to) return true;
    }
  }
  return false;
}

/** The `green: N red: N dirty: N not run: N` line, which is the whole verdict. */
function verdictLine(stdout: string): string {
  return stdout.split('\n').find((line) => line.startsWith('green:')) ?? '(no verdict line)';
}

const FREE = ['packages/free-a', 'packages/free-b', 'packages/free-c', 'packages/free-d'];
const CHROMIUM = ['packages/e2e', 'packages/ui', 'examples/full-stack-poc'];
// Five, against `--jobs 4` and twelve targets in total. If the lane were dropped
// these five would be spread over three waves of four, so two of them would land
// in the same wave and overlap — the check then fails by counting, not by luck.
const DOCKER = [
  'packages/orm',
  'examples/orm-prisma-mysql-poc',
  'examples/orm-prisma-postgres-poc',
  'examples/orm-drizzle-mysql-poc',
  'examples/orm-drizzle-postgres-poc',
];

/** workspace の全 target (`pnpm ls` を 1 度だけ引く)。 */
let targetsCache: Target[] | null = null;
async function workspaceTargets(): Promise<Target[]> {
  if (targetsCache) return targetsCache;
  const { stdout } = await execFileAsync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], {
    cwd: REPO_ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  targetsCache = discoverPackages(parseProjectList(stdout), REPO_ROOT);
  return targetsCache;
}

/**
 * root の `test` を `&&` 区切りの phase に切り分ける。
 *
 * 直列 phase は `pnpm --workspace-concurrency=1 -F a -F b test` の形。 名前が
 * script のどこかに現れるかだけを見ると、`--workspace-concurrency=1` を外して
 * 並列に戻す変更を見逃す。
 */
function rootTestPhases(): { raw: string; serial: boolean; targets: string[] }[] {
  const script =
    (JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> })
      .scripts?.test ?? '';
  return script
    .split('&&')
    .map((raw) => raw.trim())
    .filter((raw) => /\bpnpm\b/.test(raw) && / test\b|test'?$/.test(raw))
    .map((raw) => ({
      raw,
      serial: /--workspace-concurrency=1\b/.test(raw),
      targets: [...raw.matchAll(/-F\s+(\S+)/g)].map((m) => m[1] ?? ''),
    }));
}

/** root の `test` が直列に回している target の package 名。 */
function rootTestSerialTargets(): string[] {
  return rootTestPhases()
    .filter((phase) => phase.serial)
    .flatMap((phase) => phase.targets);
}

const roots: string[] = [];

/**
 * A workspace whose every `test` records when it ran and what it inherited.
 *
 * `dirtyIn` names a package whose test also writes a file into the workspace,
 * which is what the sweep calls dirty.
 */
function makeWorkspace(dirtyIn?: string): { root: string; trace: string } {
  const root = mkdtempSync(join(tmpdir(), 'test-all-jobs-'));
  roots.push(root);
  // Outside the workspace on purpose: a file the tests append to *inside* it is
  // a change to the tree, and the sweep would report all nine packages dirty for
  // doing what this fixture asked them to do.
  const outside = mkdtempSync(join(tmpdir(), 'test-all-trace-'));
  roots.push(outside);
  const trace = join(outside, 'trace.jsonl');

  mkdirSync(join(root, 'scripts/lib'), { recursive: true });
  cpSync(SCRIPT, join(root, 'scripts/test-all.mjs'));
  cpSync(resolve(REPO_ROOT, 'scripts/lib/is-main-module.mjs'), join(root, 'scripts/lib/is-main-module.mjs'));

  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n  - "examples/*"\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-root', private: true }));

  for (const rel of [...FREE, ...CHROMIUM, ...DOCKER]) {
    const dir = join(root, rel);
    mkdirSync(dir, { recursive: true });
    // Each test sleeps, so two that overlap are visible in the trace. Without
    // the sleep every span is a point and "ran at the same time" cannot be told
    // from "ran back to back".
    const body = [
      `const fs = require('node:fs');`,
      `const rec = (phase) => fs.appendFileSync(${JSON.stringify(trace)}, JSON.stringify({`,
      `  name: ${JSON.stringify(rel)}, phase, at: Date.now(),`,
      `  prebuilt: process.env.KIWA_DEPS_PREBUILT ?? '' }) + '\\n');`,
      `rec('start');`,
      rel === dirtyIn ? `fs.writeFileSync(${JSON.stringify(join(root, 'leaked.txt'))}, 'x');` : '',
      `const until = Date.now() + 400; while (Date.now() < until) {}`,
      `rec('end');`,
    ].join('\n');
    writeFileSync(join(dir, 'run.cjs'), body);
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify(
        {
          name: `fixture-${rel.replace(/\W/g, '-')}`,
          version: '0.0.0',
          private: true,
          // Only the docker lane declares it; the lane is read from here.
          devDependencies: DOCKER.includes(rel) ? { testcontainers: '^10.0.0' } : {},
          scripts: { build: 'node -e 0', test: 'node run.cjs' },
        },
        null,
        2,
      ),
    );
  }

  return { root, trace };
}

/**
 * The sweep, as the shell would see it: both streams and the exit code.
 *
 * `KIWA_DEPS_PREBUILT` is removed from what the fixture inherits. These checks
 * are about what the script sets, and the variable is already set in two of the
 * places this file runs: the root `test` script exports it, and a sweep run with
 * `--jobs N` passes it to every child — including this package. Inheriting it
 * would make the `--jobs 1` fixture see `1` and the check would fail for a
 * reason that has nothing to do with the script (measured: the check passed
 * alone and failed inside `node scripts/test-all.mjs --jobs 4`).
 */
async function sweep(root: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const env = { ...process.env };
  delete env.KIWA_DEPS_PREBUILT;
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, ['scripts/test-all.mjs', ...args], {
      cwd: root,
      env,
      maxBuffer: 32 * 1024 * 1024,
    });
    return { code: 0, stdout, stderr };
  } catch (err) {
    const e = err as { code?: number; stdout?: string; stderr?: string };
    return { code: e.code ?? -1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe('--jobs の引数検証', () => {
  it('T-PAR-001 正の整数だけを受ける', () => {
    expect(validateJobs('1')).toBe(1);
    expect(validateJobs('8')).toBe(8);
    for (const bad of ['0', '-1', '1.5', 'abc', '', ' ', 'Infinity']) {
      expect(() => validateJobs(bad), `--jobs ${bad} は拒否されるはず`).toThrow(/positive integer/);
    }
  });

  it('T-PAR-002 不正な --jobs は exit 4 で止まり、赤 (exit 1) と混ざらない', async () => {
    const { root } = makeWorkspace();
    for (const bad of ['0', '-2', 'abc']) {
      const run = await sweep(root, ['--jobs', bad]);
      expect(run.code, `--jobs ${bad}`).toBe(4);
    }
    // 使い方の誤りは stack を出さない = 読む相手に伝わるのは flag の話だけ。
    // 先に「何か書かれている」 ことを見る。 空文字は not.toContain を素通りする
    // ので、それだけだと何も確かめていない検査になる。
    const one = await sweep(root, ['--jobs', '0']);
    expect(one.stderr).toContain('--jobs takes a positive integer');
    expect(one.stderr).not.toContain('at main');
  }, 120_000);
});

describe('lane の割り当て', () => {
  it('T-PAR-003 chromium lane の 3 件が実在する (rename で lane が空になっていない)', async () => {
    const packages = await workspaceTargets();
    expect(packages.length, 'workspace の target を 1 件も拾えていない (検査が空振り)').toBeGreaterThan(0);

    const lanes = laneMembership(packages, REPO_ROOT);
    expect(lanes.missing).toEqual([]);
    expect(lanes.chromium.map((p: Target) => relative(REPO_ROOT, p.dir)).sort()).toEqual([...CHROMIUM_LANE].sort());
  }, 120_000);

  it('T-PAR-003b root の test script が直列にする target は sweep でも直列 lane に入る', async () => {
    // lane を手書きの一覧で持つ以上、実測 SSOT からずれていないことを別に固定する。
    // 突き合わせ先は `docs/quality/test-parallelism.md` の文章ではなく root の
    // `test` script = 実際に毎回走っている設定そのもの。
    const serial = rootTestSerialTargets();
    expect(serial.length, 'root の test script に直列 phase が 1 つも無い (検査が空振り)').toBeGreaterThan(0);

    const packages = await workspaceTargets();
    const lanes = laneMembership(packages, REPO_ROOT);
    const inLane = new Set([...lanes.docker, ...lanes.chromium].map((p: Target) => p.name));
    for (const name of serial) {
      expect(inLane.has(name), `${name} を root は直列にしているのに sweep は free lane で回す`).toBe(true);
    }
  }, 120_000);

  it('T-PAR-003c playwright test を走らせる target は直列にしない', async () => {
    // 「test command が playwright test を含む」 は docker lane の宣言のように
    // 読める signal だが、判定に使うと 17 件を直列に落とす。 root の test script は
    // その 17 件を並列 phase で回している (group 1 = 共有 port の問題で、port を
    // 一意にして解決済) ので、直列にすると実測と矛盾する。 `--jobs N` は root の
    // `--workspace-concurrency` = core 数より必ず薄いため、lane が root の直列
    // phase より広くなる必要はない。
    //
    // 並列 phase を `-F` で数えてはいけない (r2 の指摘)。 root の並列 phase は
    // `--filter='!x'` の除外形で書かれていて `-F` を 1 つも持たないので、
    // そちらから引くと集合が空になり、何を壊しても通る検査になる。
    const packages = await workspaceTargets();
    const direct = packages.filter((pkg: Target) => {
      const manifest = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf-8')) as {
        scripts?: { test?: string };
      };
      return manifest.scripts?.test?.includes('playwright test') === true;
    });
    expect(direct.length, 'playwright test を走らせる target が 1 件も無い (検査が空振り)').toBeGreaterThan(0);

    const serial = new Set(rootTestSerialTargets());
    const free = new Set(laneMembership(packages, REPO_ROOT).free.map((p: Target) => p.dir));
    for (const pkg of direct) {
      expect(serial.has(pkg.name), `${pkg.name} を root は直列にしている (前提が変わった)`).toBe(false);
      expect(free.has(pkg.dir), `${pkg.name} を root は並列で回すのに sweep が直列 lane に落とす`).toBe(true);
    }
  }, 120_000);

  it('T-PAR-004 testcontainers に依存する target は 1 件残らず docker lane に入る', async () => {
    const packages = await workspaceTargets();
    const declares = packages.filter((pkg: Target) => {
      const manifest = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf-8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      return Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).some(
        (name) => name === 'testcontainers' || name.startsWith('@testcontainers/'),
      );
    });
    expect(declares.length, 'testcontainers を使う target が 1 件も無い (検査が空振り)').toBeGreaterThan(0);

    const lanes = laneMembership(packages, REPO_ROOT);
    const inLane = new Set(lanes.docker.map((p: Target) => p.dir));
    // chromium lane に居る target は docker lane より先に取られるので除く。
    const chromium = new Set(lanes.chromium.map((p: Target) => p.dir));
    for (const pkg of declares) {
      if (chromium.has(pkg.dir)) continue;
      expect(inLane.has(pkg.dir), `${relative(REPO_ROOT, pkg.dir)} が docker lane から漏れている`).toBe(true);
    }
  }, 120_000);

  it('T-PAR-005 --only で絞っても lane 名の検査は workspace 全体を見る', () => {
    const all = [
      { dir: join(REPO_ROOT, 'packages/e2e'), name: 'e2e' },
      { dir: join(REPO_ROOT, 'packages/ui'), name: 'ui' },
      { dir: join(REPO_ROOT, 'examples/full-stack-poc'), name: 'poc' },
      { dir: join(REPO_ROOT, 'packages/lean'), name: 'lean' },
    ];
    const selected = all.filter((p: Target) => p.name === 'lean');
    const lanes = laneMembership(selected, REPO_ROOT, { roster: all, dependsOn: () => false });
    expect(lanes.missing, '--only で chromium lane が消えると全ての絞り込み実行が止まる').toEqual([]);
    expect(lanes.free.map((p: Target) => p.name)).toEqual(['lean']);

    // roster から本当に消えた時だけ止まる。
    const renamed = laneMembership(selected, REPO_ROOT, { roster: selected, dependsOn: () => false });
    expect(renamed.missing).toEqual([...CHROMIUM_LANE]);
  });
});

describe('worker pool', () => {
  it('T-PAR-006 limit を超えて同時に走らせない', async () => {
    let live = 0;
    let peak = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);
    await pool(items, 3, async () => {
      live += 1;
      peak = Math.max(peak, live);
      await new Promise((r) => setTimeout(r, 5));
      live -= 1;
    });
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak, '1 件ずつしか走っていない = 並列していない').toBeGreaterThan(1);
  });

  it('T-PAR-007 結果は終わった順ではなく items の順で返る', async () => {
    const items = [40, 5, 30, 1];
    const got = await pool(items, 4, async (ms: number) => {
      await new Promise((r) => setTimeout(r, ms));
      return ms;
    });
    expect(got).toEqual(items);
  });

  it('T-PAR-008 items が limit より少なくても全件走る', async () => {
    const seen: number[] = [];
    await pool([1, 2], 8, async (n: number) => {
      seen.push(n);
    });
    expect(seen.sort()).toEqual([1, 2]);
  });

  it('T-PAR-009 独立した producer 間でも合計の limit を超えない', async () => {
    let live = 0;
    let peak = 0;
    const withSlot = limitConcurrency(3);
    const run = () =>
      withSlot(async () => {
        live += 1;
        peak = Math.max(peak, live);
        await new Promise((r) => setTimeout(r, 5));
        live -= 1;
      });

    await Promise.all([
      Promise.all(Array.from({ length: 8 }, run)),
      Promise.all(Array.from({ length: 8 }, run)),
      Promise.all(Array.from({ length: 8 }, run)),
    ]);
    expect(peak).toBe(3);
  });
});

describe('fixture workspace で実際に並列に回す', () => {
  let root: string;
  let trace: string;
  let serial: { code: number; stdout: string; stderr: string };
  let serialTrace: Trace[];
  let parallel: { code: number; stdout: string; stderr: string };
  let parallelTrace: Trace[];

  beforeAll(async () => {
    ({ root, trace } = makeWorkspace());
    await execFileAsync('git', ['init', '-q', '.'], { cwd: root });

    serial = await sweep(root, ['--jobs', '1']);
    serialTrace = readTrace(trace);
    rmSync(trace);

    parallel = await sweep(root, ['--jobs', '4']);
    parallelTrace = readTrace(trace);
  }, 300_000);

  it('T-PAR-010 --jobs 1 と --jobs 4 の verdict が一致する', () => {
    expect(verdictLine(serial.stdout)).toBe(verdictLine(parallel.stdout));
    expect(verdictLine(serial.stdout)).toContain(`green: ${FREE.length + CHROMIUM.length + DOCKER.length}`);
    expect(serial.code).toBe(0);
    expect(parallel.code).toBe(0);
  });

  it('T-PAR-011 全 target が両方の経路で 1 度ずつ走る', () => {
    const ran = (t: Trace[]) => t.filter((e) => e.phase === 'end').map((e) => e.name).sort();
    const expected = [...FREE, ...CHROMIUM, ...DOCKER].sort();
    expect(ran(serialTrace)).toEqual(expected);
    expect(ran(parallelTrace)).toEqual(expected);
  });

  it('T-PAR-012 並列時だけ KIWA_DEPS_PREBUILT=1 が全 target に渡る', () => {
    expect(parallelTrace.length, 'trace が空 (検査が空振り)').toBeGreaterThan(0);
    for (const event of parallelTrace) {
      expect(event.prebuilt, `${event.name} が prebuilt flag を受け取っていない`).toBe('1');
    }
    // 既定の直列経路は何も変わっていない。
    for (const event of serialTrace) expect(event.prebuilt).toBe('');
  });

  it('T-PAR-013 free lane は実際に同時に走る', () => {
    // lane 全体ではなく free lane だけを見る。 全体だと docker lane と chromium
    // lane が並走するだけで 2 を超えるので、free lane を 1 件ずつに戻しても
    // 気付けない (変異 M10 で実測)。
    const free = laneOf(FREE);
    expect(peakConcurrency(free(parallelTrace))).toBeGreaterThan(1);
    expect(peakConcurrency(free(parallelTrace))).toBeLessThanOrEqual(4);
    expect(peakConcurrency(parallelTrace), 'lane を足しても --jobs の全体上限を超えない').toBeLessThanOrEqual(4);
    expect(peakConcurrency(serialTrace), '直列経路が並列に走っている').toBe(1);
  });

  it('T-PAR-014 chromium lane は並列時も重ならない', () => {
    expect(overlapped(parallelTrace, CHROMIUM)).toBe(false);
  });

  it('T-PAR-015 docker lane は並列時も重ならない', () => {
    expect(overlapped(parallelTrace, DOCKER)).toBe(false);
  });

  it('T-PAR-016 並列は直列より速い', () => {
    const span = (t: Trace[]) => Math.max(...t.map((e) => e.at)) - Math.min(...t.map((e) => e.at));
    expect(span(parallelTrace)).toBeLessThan(span(serialTrace));
  });
});

describe('汚した時の報告', () => {
  it('T-PAR-020 並列時は帰属せずに報告し、exit 1 は変わらない', async () => {
    const { root, trace } = makeWorkspace('packages/free-a');
    await execFileAsync('git', ['init', '-q', '.'], { cwd: root });

    const serial = await sweep(root, ['--jobs', '1']);
    expect(serial.code, '汚した target があるのに緑になっている').toBe(1);
    // 直列は犯人を名指しする。
    expect(serial.stdout).toContain('packages/free-a');
    expect(serial.stdout).toContain('leaked.txt');
    rmSync(join(root, 'leaked.txt'));
    rmSync(trace);

    const parallel = await sweep(root, ['--jobs', '4']);
    expect(parallel.code, '並列だと汚れを見逃している').toBe(1);
    expect(parallel.stdout).toContain('leaked.txt');
    // 名指しできないことを黙って落とさず、次の一手まで書く。
    expect(parallel.stdout).toContain('--jobs 1');
    expect(parallel.stdout).toMatch(/which one wrote these/);
  }, 300_000);
});
