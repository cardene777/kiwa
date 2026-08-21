// 保存済み成果物が現在の実装より古い時に gate が落ちることを固定する (Issue #2125)。
//
// `gate:coverage` と `gate:mutation` はどちらも前回の実行が置いた file を読む。
// 生成側を呼ぶ配線が無いので、再計測を忘れると gate は消えた code について ✅ を返す。
// #2124 でその差が出た = `core` は保存値 83.33 に対し再計測が 81.37 で、
// gate は古い方を読んで通した。
//
// 落ちた時の直し方は 1 つで、出力に出る command を実行して測り直す。
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';
import {
  checkArtifactFreshness,
  implementationChangedAt,
  newestMtimeMs,
  parseDirtyPaths,
  staleMessage,
} from '../../../scripts/lib/artifact-freshness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

const SRC_REL = 'packages/demo/src';
const ARTIFACT_REL = 'packages/demo/coverage/coverage-summary.json';

const created: string[] = [];
afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

/** 秒単位の epoch を渡して mtime を固定する。 */
function setMtime(path: string, epochSeconds: number): void {
  utimesSync(path, epochSeconds, epochSeconds);
}

type Fixture = { root: string; srcFile: string; artifact: string };

/**
 * `src/` と成果物を持つ木を作る。 `git` を渡すと実 repository にする。
 *
 * 実 repository にするのは commit 時刻を見る経路を通すため。 mock で済ませると
 * 「git が何を返すか」 の想定を検査することになり、実際の porcelain 出力とずれても
 * 気付けない。
 */
/** commit 時刻を固定して git を呼ぶ。 時刻を実行時刻に任せると境界を組めない。 */
function gitAt(root: string, epochSeconds: number, ...args: string[]): string {
  const stamp = `${epochSeconds} +0000`;
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      GIT_AUTHOR_DATE: stamp,
      GIT_COMMITTER_DATE: stamp,
    },
  });
}

/** fixture の基準時刻。 実行時刻に依らないよう固定値にする。 */
const COMMIT_EPOCH = 1_600_000_000;

function makeTree({ asRepo }: { asRepo: boolean }): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-freshness-'));
  created.push(root);
  mkdirSync(join(root, SRC_REL), { recursive: true });
  mkdirSync(dirname(join(root, ARTIFACT_REL)), { recursive: true });
  const srcFile = join(root, SRC_REL, 'index.ts');
  writeFileSync(srcFile, 'export const value = 1;\n');
  const artifact = join(root, ARTIFACT_REL);
  writeFileSync(artifact, '{"total":{}}\n');
  if (asRepo) {
    gitAt(root, COMMIT_EPOCH, 'init', '-q');
    gitAt(root, COMMIT_EPOCH, 'add', '-A');
    gitAt(root, COMMIT_EPOCH, 'commit', '-q', '-m', 'init');
  }
  return { root, srcFile, artifact };
}

function freshness(root: string) {
  return checkArtifactFreshness({ repoRoot: root, srcRel: SRC_REL, artifactRel: ARTIFACT_REL });
}

describe('鮮度判定 — 成果物と実装の前後', () => {
  it('T-FRESH-001 実装が成果物より後に変わっていれば stale', () => {
    const { root, srcFile, artifact } = makeTree({ asRepo: false });
    setMtime(artifact, 1_000_000);
    setMtime(srcFile, 2_000_000);
    const result = freshness(root);
    expect(result.state).toBe('stale');
    expect(result.source).toBe('mtime');
  });

  it('T-FRESH-002 成果物が後に作られていれば fresh', () => {
    const { root, srcFile, artifact } = makeTree({ asRepo: false });
    setMtime(srcFile, 1_000_000);
    setMtime(artifact, 2_000_000);
    expect(freshness(root).state).toBe('fresh');
  });

  it('T-FRESH-003 成果物が無ければ missing (呼出側の既存扱いを変えない)', () => {
    const { root, artifact } = makeTree({ asRepo: false });
    rmSync(artifact);
    const result = freshness(root);
    expect(result.state).toBe('missing');
    // stale と取り違えると、未計測の package に再計測を促す message が出る。
    expect(result.artifactAt).toBeUndefined();
  });

  it('T-FRESH-004 同時刻は fresh に倒す (順序を決められないため)', () => {
    const { root, srcFile, artifact } = makeTree({ asRepo: false });
    setMtime(srcFile, 1_500_000);
    setMtime(artifact, 1_500_000);
    expect(freshness(root).state).toBe('fresh');
  });

  it('T-FRESH-005 成果物が 1 秒でも古ければ stale (境界の反対側)', () => {
    const { root, srcFile, artifact } = makeTree({ asRepo: false });
    setMtime(srcFile, 1_500_001);
    setMtime(artifact, 1_500_000);
    expect(freshness(root).state).toBe('stale');
  });

  it('T-FRESH-006 src/ が無い package の成果物は stale にしない', () => {
    const { root } = makeTree({ asRepo: false });
    rmSync(join(root, SRC_REL), { recursive: true, force: true });
    const result = freshness(root);
    expect(result.state).toBe('fresh');
    expect(result.source).toBe('absent');
  });
});

describe('鮮度判定 — mtime ではなく内容が変わった時刻を見る', () => {
  it('T-FRESH-101 内容が変わっていなければ mtime が新しくても fresh', () => {
    const { root, srcFile, artifact } = makeTree({ asRepo: true });
    // checkout が file を書き直した状況。 内容は commit のまま、mtime だけ未来。
    setMtime(artifact, COMMIT_EPOCH + 60);
    setMtime(srcFile, COMMIT_EPOCH + 3600);
    const result = freshness(root);
    expect(result.state, 'mtime だけ動いた file で stale にしている').toBe('fresh');
    expect(result.source).toBe('git');
  });

  it('T-FRESH-102 commit されていない編集は mtime で見て stale にする', () => {
    const { root, srcFile, artifact } = makeTree({ asRepo: true });
    setMtime(artifact, COMMIT_EPOCH + 60);
    // 内容を変える = git status が dirty として返す。
    writeFileSync(srcFile, 'export const value = 2;\n');
    setMtime(srcFile, COMMIT_EPOCH + 3600);
    const result = freshness(root);
    expect(result.state, 'commit していない編集を見落としている').toBe('stale');
    expect(result.source).toBe('git');
  });

  it('T-FRESH-103 commit そのものが成果物より後なら stale', () => {
    const { root, artifact, srcFile } = makeTree({ asRepo: true });
    // 成果物を作った後に src を commit した状況。
    setMtime(artifact, COMMIT_EPOCH + 60);
    writeFileSync(srcFile, 'export const value = 3;\n');
    gitAt(root, COMMIT_EPOCH + 3600, 'add', '-A');
    gitAt(root, COMMIT_EPOCH + 3600, 'commit', '-q', '-m', 'change');
    // commit 済なので mtime ではなく commit 時刻で判定される。
    setMtime(srcFile, COMMIT_EPOCH);
    const result = freshness(root);
    expect(result.state).toBe('stale');
    expect(result.source).toBe('git');
  });

  it('T-FRESH-104 git の外なら mtime 走査に落ちる', () => {
    const { root, srcFile } = makeTree({ asRepo: false });
    setMtime(srcFile, 2_000_000);
    const changed = implementationChangedAt({ repoRoot: root, srcRel: SRC_REL });
    expect(changed.source).toBe('mtime');
    expect(changed.at).toBe(2_000_000_000);
  });
});

describe('鮮度判定 — 判定できない時は fail-closed', () => {
  it('T-FRESH-201 src/ を走査できなければ unknown', () => {
    const { root } = makeTree({ asRepo: false });
    const result = checkArtifactFreshness(
      { repoRoot: root, srcRel: SRC_REL, artifactRel: ARTIFACT_REL },
      {
        // git は答えず、走査も失敗する状況。
        execFileSync: () => {
          throw new Error('no git');
        },
        readdirSync: () => {
          throw new Error('permission denied');
        },
      },
    );
    expect(result.state, '判定できない時に fresh へ倒している').toBe('unknown');
  });

  it('T-FRESH-202 走査が途中で失敗したら部分的な答えを返さない', () => {
    const { root } = makeTree({ asRepo: false });
    expect(
      newestMtimeMs(join(root, SRC_REL), {
        readdirSync: () => {
          throw new Error('permission denied');
        },
      }),
      '部分的な最大値は真の値より小さく、fresh 側に倒れる',
    ).toBeNull();
  });
});

describe('鮮度判定 — 落ちた時に何をすればよいか出る', () => {
  it('T-FRESH-301 stale の message に再計測 command が入る', () => {
    const message = staleMessage({
      pkg: '@kiwa-lab/core',
      artifactRel: 'packages/core/coverage/coverage-summary.json',
      regenerateCommand: 'pnpm -F @kiwa-lab/core test:cov',
      result: { state: 'stale', artifactAt: 1_000_000_000, changedAt: 2_000_000_000, source: 'git' },
    });
    expect(message).toContain('pnpm -F @kiwa-lab/core test:cov');
    expect(message).toContain('packages/core/coverage/coverage-summary.json');
  });

  it('T-FRESH-302 unknown の message にも再計測 command が入る', () => {
    const message = staleMessage({
      pkg: '@kiwa-lab/core',
      artifactRel: 'packages/core/mutation-report/mutation.json',
      regenerateCommand: 'pnpm -F @kiwa-lab/core test:mutation',
      result: { state: 'unknown', reason: 'cannot determine when packages/core/src last changed' },
    });
    expect(message).toContain('pnpm -F @kiwa-lab/core test:mutation');
    expect(message).toContain('cannot determine');
  });
});

describe('鮮度判定 — 実 gate が古い成果物で落ちる', () => {
  const cases = [
    {
      gate: 'scripts/check-coverage-gates.mjs',
      artifactRel: 'coverage/coverage-summary.json',
      body: '{"total":{"lines":{"pct":100},"branches":{"pct":100},"functions":{"pct":100},"statements":{"pct":100}}}\n',
      command: 'pnpm -F @kiwa-lab/core test:cov',
    },
    {
      gate: 'scripts/check-mutation-gates.mjs',
      artifactRel: 'mutation-report/mutation.json',
      body: '{"files":{}}\n',
      command: 'pnpm -F @kiwa-lab/core test:mutation',
    },
  ] as const;

  /**
   * `packages/core` だけを持つ木を作って gate を走らせる。
   *
   * 他の package は成果物が無いので当然落ちるが、見たいのは exit code ではなく
   * **core について stale の message が出るか**。 gate は `KIWA_GATE_ROOT` で
   * 対象 repo を差し替えられる。
   */
  function runGate(gate: string, prepare: (root: string) => void) {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-gate-'));
    created.push(root);
    mkdirSync(join(root, 'packages/core/src'), { recursive: true });
    writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const v = 1;\n');
    prepare(root);
    const run = spawnSync(process.execPath, [resolve(REPO_ROOT, gate)], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, KIWA_GATE_ROOT: root },
    });
    return { root, stdout: run.stdout ?? '', stderr: run.stderr ?? '', status: run.status };
  }

  it.each(cases)('T-FRESH-401 $gate は古い成果物を stale として落とす', (spec) => {
    const { stderr, stdout, status } = runGate(spec.gate, (root) => {
      const artifact = join(root, 'packages/core', spec.artifactRel);
      mkdirSync(dirname(artifact), { recursive: true });
      writeFileSync(artifact, spec.body);
      setMtime(artifact, 1_000_000);
      setMtime(join(root, 'packages/core/src/index.ts'), 2_000_000);
    });
    expect(status, 'stale なのに exit 0 で通している').not.toBe(0);
    expect(stderr).toContain('@kiwa-lab/core');
    expect(stderr, '再計測 command が出力に無い').toContain(spec.command);
    expect(stderr).toContain('predates the implementation');
    expect(stdout).toContain('stale report');
  });

  it.each(cases)('T-FRESH-402 $gate は新しい成果物を stale にしない', (spec) => {
    const { stderr } = runGate(spec.gate, (root) => {
      const artifact = join(root, 'packages/core', spec.artifactRel);
      mkdirSync(dirname(artifact), { recursive: true });
      writeFileSync(artifact, spec.body);
      setMtime(join(root, 'packages/core/src/index.ts'), 1_000_000);
      setMtime(artifact, 2_000_000);
    });
    // core 以外は成果物が無いので落ちる。 見るのは core が stale 扱いされないこと。
    expect(stderr).not.toContain('predates the implementation');
  });

  it.each(cases)('T-FRESH-403 $gate は成果物が無い package の扱いを変えない', (spec) => {
    const { stderr } = runGate(spec.gate, () => {
      // core の成果物を作らない。
    });
    expect(stderr).toContain('@kiwa-lab/core');
    expect(stderr, '未計測を stale と取り違えている').not.toContain('predates the implementation');
    // 既存の message (探した path を名指しする形) が残っていること。
    expect(stderr).toContain(spec.artifactRel);
  });
});

describe('鮮度判定 — porcelain の読み方', () => {
  // 実装当初は `git status --porcelain` の出力を trim してから 3 文字落としていた。
  // 未 staged の変更は 1 列目が空白なので、trim が先頭の空白を食って path が
  // 3 文字短くなり、stat に失敗して dirty 0 件 = fresh に倒れていた。
  // ここはその形の回帰検査。
  it('T-FRESH-501 未 staged の変更 (1 列目が空白) の path を正しく取り出す', () => {
    expect(parseDirtyPaths(' M packages/demo/src/index.ts\0')).toStrictEqual([
      'packages/demo/src/index.ts',
    ]);
  });

  it('T-FRESH-502 staged の変更も取り出す', () => {
    expect(parseDirtyPaths('M  a/b.ts\0A  a/c.ts\0')).toStrictEqual(['a/b.ts', 'a/c.ts']);
  });

  it('T-FRESH-503 rename は移動先だけを取り、元 path の欄を読み飛ばす', () => {
    // -z の rename は「状態列付きの移動先」 の次に「状態列なしの移動元」 が並ぶ。
    expect(parseDirtyPaths('R  a/new.ts\0a/old.ts\0 M a/other.ts\0')).toStrictEqual([
      'a/new.ts',
      'a/other.ts',
    ]);
  });

  it('T-FRESH-504 空の出力は dirty 0 件', () => {
    expect(parseDirtyPaths('')).toStrictEqual([]);
  });

  it('T-FRESH-505 空白を含む path も欠けずに取れる', () => {
    // -z は quote しないので、空白入りの path がそのまま 1 entry で来る。
    expect(parseDirtyPaths(' M a/my dir/x.ts\0')).toStrictEqual(['a/my dir/x.ts']);
  });
});
