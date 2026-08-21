// 成果物が「いつ」 ではなく「どの内容について」 測られたかで鮮度を決める (Issue #2135)。
//
// #2125 は時刻を比べる。 その比較には 2 つの歪みが残っていた。
//
//   squash merge  作業と測定は branch で行われ、commit には merge 時刻が刻まれる。
//                 成果物が自分を作った入力を predate しているように見える
//   古い内容へ戻す  commit 時刻が過去へ動くので、別の内容について測った成果物が
//                 「新しい」 と判定される
//
// どちらも時刻では塞げない。 入力の指紋を成果物の隣に記録して突き合わせる。
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

// helper は repo root 起点で読む。 相対 import は `.vitest-dist/` へ compile した側で
// 1 階層ずれる (`repo-root.ts` が同じ理由で存在する)。
type FingerprintResult = { state: 'match' | 'mismatch' | 'absent' | 'unusable'; reason?: string };
type RecordResult = { ok: true; fingerprint: string } | { ok: false; reason: string };
type ReadResult =
  | { state: 'absent' }
  | { state: 'unreadable'; reason: string }
  | { state: 'ok'; fingerprint: string; artifactFingerprint: string; inputs: string[] };

const fingerprint = (await import(
  pathToFileURL(resolve(REPO_ROOT, 'scripts/lib/input-fingerprint.mjs')).href
)) as {
  compareArtifactInputs: (args: {
    repoRoot: string;
    inputRels: string[];
    artifactAbs: string;
  }) => FingerprintResult;
  computeInputFingerprint: (
    args: { repoRoot: string; inputRels: string[] },
    io?: { execFileSync?: (command: string, args: string[], options: Record<string, unknown>) => string },
  ) => string | null;
  readArtifactInputs: (artifactAbs: string) => ReadResult;
  recordArtifactInputs: (args: {
    repoRoot: string;
    inputRels: string[];
    artifactAbs: string;
  }) => RecordResult;
  sidecarPathFor: (artifactAbs: string) => string;
  SIDECAR_SCHEMA_VERSION: number;
};
const {
  compareArtifactInputs,
  computeInputFingerprint,
  readArtifactInputs,
  recordArtifactInputs,
  sidecarPathFor,
  SIDECAR_SCHEMA_VERSION,
} = fingerprint;

const runner = (await import(
  pathToFileURL(resolve(REPO_ROOT, 'scripts/package-mutation.mjs')).href
)) as {
  runPackageMutation: (args: {
    cwd: string;
    rm: (path: string) => void;
    run: (command: string, args: string[], cwd: string) => number;
    warn?: (message: string) => void;
    dirProblem?: string | null;
    setupProblems?: () => string[];
    record?: () => RecordResult;
  }) => number;
};

const SRC_REL = 'packages/demo/src';
const TESTS_REL = 'packages/demo/tests';
const ARTIFACT_REL = 'packages/demo/coverage/coverage-summary.json';
const INPUTS = [SRC_REL, TESTS_REL];
/** fixture の基準時刻。 実行時刻に依らないよう固定する。 */
const COMMIT_EPOCH = 1_600_000_000;

const created: string[] = [];
afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

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

type Fixture = { root: string; srcFile: string; testFile: string; artifact: string };

function makeTree({ asRepo = true }: { asRepo?: boolean } = {}): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-fingerprint-'));
  created.push(root);
  mkdirSync(join(root, SRC_REL), { recursive: true });
  mkdirSync(join(root, TESTS_REL), { recursive: true });
  mkdirSync(dirname(join(root, ARTIFACT_REL)), { recursive: true });
  const srcFile = join(root, SRC_REL, 'index.ts');
  const testFile = join(root, TESTS_REL, 'index.test.ts');
  writeFileSync(srcFile, 'export const value = 1;\n');
  writeFileSync(testFile, 'export const covered = true;\n');
  const artifact = join(root, ARTIFACT_REL);
  writeFileSync(artifact, '{"total":{}}\n');
  if (asRepo) {
    gitAt(root, COMMIT_EPOCH, 'init', '-q');
    gitAt(root, COMMIT_EPOCH, 'add', '-A');
    gitAt(root, COMMIT_EPOCH, 'commit', '-q', '-m', 'init');
  }
  return { root, srcFile, testFile, artifact };
}

const digest = (root: string, inputRels = INPUTS) =>
  computeInputFingerprint({ repoRoot: root, inputRels });

const record = (root: string, artifact: string, inputRels = INPUTS) =>
  recordArtifactInputs({ repoRoot: root, inputRels, artifactAbs: artifact });

const compare = (root: string, artifact: string, inputRels = INPUTS) =>
  compareArtifactInputs({ repoRoot: root, inputRels, artifactAbs: artifact });

describe('指紋 — 何が入ると変わるか', () => {
  it('T-FP-001 同じ内容なら何度計算しても同じ', () => {
    const { root } = makeTree();
    const first = digest(root);
    expect(first, 'git から指紋を計算できていない').not.toBeNull();
    expect(digest(root)).toBe(first);
  });

  it('T-FP-002 commit 済 file の内容が変われば変わる', () => {
    const { root, srcFile } = makeTree();
    const before = digest(root);
    writeFileSync(srcFile, 'export const value = 2;\n');
    expect(digest(root)).not.toBe(before);
  });

  it('T-FP-003 commit しても内容が同じなら同じ', () => {
    const { root, srcFile } = makeTree();
    writeFileSync(srcFile, 'export const value = 2;\n');
    const dirtyDigest = digest(root);
    gitAt(root, COMMIT_EPOCH + 3600, 'add', '-A');
    gitAt(root, COMMIT_EPOCH + 3600, 'commit', '-q', '-m', 'change');
    // 同じ内容が dirty から commit 済へ移っただけ。 中身が変わらない以上、
    // 指紋も変わってはいけない (変わると commit のたびに全成果物が無効になる)。
    expect(digest(root)).toBe(dirtyDigest);
  });

  it('T-FP-004 untracked file を足せば変わる', () => {
    const { root } = makeTree();
    const before = digest(root);
    writeFileSync(join(root, SRC_REL, 'added.ts'), 'export const added = 1;\n');
    expect(digest(root), 'untracked file が指紋に入っていない').not.toBe(before);
  });

  it('T-FP-005 untracked dir の中身が変わっても変わる', () => {
    const { root } = makeTree();
    mkdirSync(join(root, SRC_REL, 'fresh'), { recursive: true });
    writeFileSync(join(root, SRC_REL, 'fresh/a.ts'), 'export const a = 1;\n');
    const before = digest(root);
    // porcelain の既定は新規 dir を 1 entry に畳む。 畳んだままだと中身の変化が見えない。
    writeFileSync(join(root, SRC_REL, 'fresh/a.ts'), 'export const a = 2;\n');
    expect(digest(root), 'untracked dir の中身を見ていない').not.toBe(before);
  });

  it('T-FP-006 file を消せば変わる', () => {
    const { root, testFile } = makeTree();
    const before = digest(root);
    rmSync(testFile);
    const after = digest(root);
    // null は「計算できなかった」 であって「変わった」 ではない。 区別せずに
    // not.toBe だけ見ると、消えた file で計算が壊れる形を「検知した」 と読んでしまう。
    expect(after, '削除で指紋の計算が壊れている').toEqual(expect.any(String));
    expect(after).not.toBe(before);
  });

  it('T-FP-007 入力の集合が変われば変わる', () => {
    const { root } = makeTree();
    expect(digest(root, [SRC_REL])).not.toBe(digest(root, INPUTS));
  });

  it('T-FP-008 入力の順序は指紋を変えない', () => {
    const { root } = makeTree();
    expect(digest(root, [TESTS_REL, SRC_REL])).toBe(digest(root, [SRC_REL, TESTS_REL]));
  });

  it('T-FP-010 file 一覧が同じでも入力 path が違えば変わる', () => {
    const { root } = makeTree();
    // 実在しない入力を足しても列挙結果は同じ。 入力集合そのものを digest に
    // 入れていないと、この 2 つが同じ指紋になる。
    expect(digest(root, [SRC_REL, TESTS_REL, 'packages/demo/absent'])).not.toBe(digest(root));
  });

  it('T-FP-011 内容が同じでも path が変われば変わる', () => {
    const { root } = makeTree();
    const before = digest(root);
    gitAt(root, COMMIT_EPOCH, 'mv', `${SRC_REL}/index.ts`, `${SRC_REL}/renamed.ts`);
    // 中身は 1 byte も変わっていない。 path を digest に入れていないと同じになる。
    expect(digest(root), 'rename を見ていない').not.toBe(before);
  });

  it('T-FP-012 hash の数が path の数と合わなければ null', () => {
    const { root } = makeTree();
    // git が想定より少ない行を返す形。 部分的な対応で digest を作ると、
    // どの file の hash がどの path のものか分からないまま値が出る。
    const short = (command: string, args: string[], options: Record<string, unknown>) => {
      const real = execFileSync(command, args as string[], options as never) as unknown as string;
      if (args[0] === 'hash-object') return real.split('\n').slice(1).join('\n');
      return real;
    };
    expect(
      computeInputFingerprint({ repoRoot: root, inputRels: INPUTS }, { execFileSync: short }),
      '足りない hash で digest を作っている',
    ).toBeNull();
  });

  it('T-FP-013 改行を含む file 名でも内容を指紋に含める', () => {
    const { root } = makeTree();
    const unusual = join(root, SRC_REL, 'line\nbreak.ts');
    writeFileSync(unusual, 'export const lineBreak = 1;\n');
    const before = digest(root);
    expect(before, '改行を path separator と誤認して指紋計算を諦めている').toEqual(expect.any(String));
    writeFileSync(unusual, 'export const lineBreak = 2;\n');
    expect(digest(root), '改行入り file の内容を見ていない').not.toBe(before);
  });

  it('T-FP-014 dangling symlink の link target が変われば変わる', () => {
    const { root } = makeTree();
    const link = join(root, SRC_REL, 'generated-types');
    symlinkSync('missing-v1.d.ts', link);
    const before = digest(root);
    expect(before, 'dangling symlink を存在しない file として捨てている').toEqual(expect.any(String));
    rmSync(link);
    symlinkSync('missing-v2.d.ts', link);
    expect(digest(root), 'symlink 自体の内容を見ていない').not.toBe(before);
  });

  it('T-FP-015 path が区切りを真似ても別の入力は別の指紋になる', () => {
    // digest の本文は `path<TAB>hash` を改行で並べた形。 path を escape しないと、
    // TAB と改行を名前に含む 1 file が「2 file 分の行」 を丸ごと真似られる。
    //
    //   file 2 個 :  packages/demo/src/a.ts<TAB>Ha
    //                packages/demo/src/b.ts<TAB>Hb
    //   file 1 個 :  packages/demo/src/a.ts<TAB>Ha<LF>packages/demo/src/b.ts<TAB>Hb
    //
    // 中身が同じなら Hb も同じなので、escape が無い実装では 2 つが同じ digest になる。
    // path に `/` は入れられないので、真似たい行の残りを dir 名として掘る。
    const two = makeTree();
    const contentA = 'export const a = 1;\n';
    const contentB = 'export const b = 2;\n';
    rmSync(join(two.root, SRC_REL, 'index.ts'));
    writeFileSync(join(two.root, SRC_REL, 'a.ts'), contentA);
    writeFileSync(join(two.root, SRC_REL, 'b.ts'), contentB);
    const twoDigest = digest(two.root);
    expect(twoDigest, '2 file の指紋を計算できていない').toEqual(expect.any(String));

    const hashOfA = execFileSync('git', ['hash-object', '--', `${SRC_REL}/a.ts`], {
      cwd: two.root,
      encoding: 'utf8',
    }).trim();

    const one = makeTree();
    rmSync(join(one.root, SRC_REL, 'index.ts'));
    // `packages/demo/src/` + `a.ts<TAB>Ha<LF>packages` + `/demo/src/b.ts`
    // を繋ぐと、真似たい 2 行がそのまま 1 つの path になる。
    const forged = join(one.root, SRC_REL, `a.ts\t${hashOfA}\npackages`, 'demo', 'src');
    mkdirSync(forged, { recursive: true });
    writeFileSync(join(forged, 'b.ts'), contentB);
    const oneDigest = digest(one.root);
    expect(oneDigest, '境界を真似た名前で指紋を計算できていない').toEqual(expect.any(String));

    expect(oneDigest, 'path を escape していないため 2 つの入力が同じ指紋になる').not.toBe(
      twoDigest,
    );
  });

  it('T-FP-009 git の外では null を返す (呼出側が時刻比較へ落ちる)', () => {
    const { root } = makeTree({ asRepo: false });
    expect(digest(root), 'git 不在で指紋を捏造している').toBeNull();
  });
});

describe('指紋 — 時刻では塞げない 2 つの形', () => {
  it('T-FP-101 成果物が入力の commit より古くても、内容が同じなら match', () => {
    // squash merge の形。 測定は branch で終わっており、commit だけが後から刻まれる。
    const { root, artifact } = makeTree();
    record(root, artifact);
    utimesSync(artifact, COMMIT_EPOCH - 3600, COMMIT_EPOCH - 3600);
    gitAt(root, COMMIT_EPOCH + 86_400, 'commit', '-q', '--allow-empty', '-m', 'squash merge');
    expect(compare(root, artifact).state, '時刻の歪みで stale にしている').toBe('match');
  });

  it('T-FP-102 成果物が入力の commit より新しくても、内容が違えば mismatch', () => {
    // 古い内容へ戻した形。 commit 時刻は過去へ動き、成果物の mtime は動かない。
    const { root, artifact, srcFile } = makeTree();
    record(root, artifact);
    utimesSync(artifact, COMMIT_EPOCH + 86_400, COMMIT_EPOCH + 86_400);
    writeFileSync(srcFile, 'export const value = 999;\n');
    const result = compare(root, artifact);
    expect(result.state, '別の内容について測った成果物を使い回している').toBe('mismatch');
    expect(result.reason).toContain('changed');
  });

  it('T-FP-103 記録した入力集合と gate が読む集合が違えば mismatch', () => {
    const { root, artifact } = makeTree();
    record(root, artifact, [SRC_REL]);
    const result = compare(root, artifact, INPUTS);
    expect(result.state, '少ない入力で取った指紋を広い gate が受け入れている').toBe('mismatch');
    expect(result.reason).toContain('differ from the inputs this gate reads');
  });

  it('T-FP-104 sidecar を残して成果物だけ差し替えれば mismatch', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    writeFileSync(artifact, '{"total":{"lines":{"pct":100}}}\n');
    const result = compare(root, artifact);
    expect(result.state, '別 run の成果物を sidecar と組み替えている').toBe('mismatch');
    expect(result.reason).toContain('artefact differs');
  });
});

describe('sidecar — 読めない時の倒し方', () => {
  it('T-FP-201 sidecar が無ければ absent (呼出側が時刻比較へ落ちる)', () => {
    const { root, artifact } = makeTree();
    expect(compare(root, artifact).state).toBe('absent');
  });

  it('T-FP-202 新しい schema_version は unusable (fail-closed)', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    const path = sidecarPathFor(artifact);
    const raw = readFileSync(path, 'utf8');
    writeFileSync(path, raw.replace(/schema_version: \d+/, `schema_version: ${SIDECAR_SCHEMA_VERSION + 1}`));
    const result = compare(root, artifact);
    expect(result.state, '読めない形式を fresh 側に倒している').toBe('unusable');
    expect(result.reason).toContain(`schema_version ${SIDECAR_SCHEMA_VERSION + 1}`);
  });

  it('T-FP-202b 古い schema_version も unusable (算法が違う digest を比べない)', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    const path = sidecarPathFor(artifact);
    const raw = readFileSync(path, 'utf8');
    writeFileSync(path, raw.replace(/schema_version: \d+/, 'schema_version: 0'));
    const result = compare(root, artifact);
    // 別の算法で作った digest を比べると「入力が変わった」 と誤報する。
    // 変わったのは算法なので、探しに行く先が違う。
    expect(result.state).toBe('unusable');
    expect(result.reason).toContain('digest algorithm');
  });

  it('T-FP-203 schema_version が無ければ unusable', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    const path = sidecarPathFor(artifact);
    writeFileSync(path, 'fingerprint: abc\ninputs: x\n');
    const result = compare(root, artifact);
    expect(result.state).toBe('unusable');
    // 「version 行が無い」 と「version が 0 と書いてある」 は直しに行く先が違う。
    // `Number(null)` は 0 になるので、理由まで見ないと 2 つが同じ扱いに潰れる。
    expect(result.reason, 'version 行の欠落を version 0 と混同している').toContain(
      'no usable schema_version',
    );
  });

  it('T-FP-204 fingerprint 欄が欠ければ unusable', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    const path = sidecarPathFor(artifact);
    writeFileSync(path, `schema_version: ${SIDECAR_SCHEMA_VERSION}\ninputs: ${INPUTS.join(',')}\n`);
    expect(compare(root, artifact).state).toBe('unusable');
  });

  it('T-FP-204b artifact_fingerprint 欄が欠ければ unusable', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    const path = sidecarPathFor(artifact);
    const raw = readFileSync(path, 'utf8');
    writeFileSync(path, raw.replace(/^artifact_fingerprint:.*\n/m, ''));
    expect(compare(root, artifact).state).toBe('unusable');
  });

  it('T-FP-207 成果物を読めない時は unusable (fresh へ倒さない)', () => {
    const { root, artifact } = makeTree();
    record(root, artifact);
    const sidecar = sidecarPathFor(artifact);
    const result = compareArtifactInputs(
      { repoRoot: root, inputRels: INPUTS, artifactAbs: artifact },
      {
        // sidecar は読めるが成果物は読めない状況。 権限や I/O 障害で起きる。
        readFileSync: ((path: string, encoding?: unknown) => {
          if (path === artifact) throw new Error('EACCES');
          return readFileSync(path, encoding as never);
        }) as never,
      },
    );
    expect(result.state, '成果物を読めないのに match にしている').toBe('unusable');
    expect(result.reason).toContain('artefact could not be read');
    expect(existsSync(sidecar)).toBe(true);
  });

  it('T-FP-205 記録した内容を読み戻せる', () => {
    const { root, artifact } = makeTree();
    const written = record(root, artifact);
    expect(written.ok).toBe(true);
    const read = readArtifactInputs(artifact);
    expect(read.state).toBe('ok');
    if (read.state !== 'ok') return;
    expect(read.fingerprint).toBe(written.ok ? written.fingerprint : '');
    expect(read.artifactFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(read.inputs).toStrictEqual([...INPUTS].sort());
  });

  it('T-FP-206 git の外では記録しない', () => {
    const { root, artifact } = makeTree({ asRepo: false });
    const result = record(root, artifact);
    expect(result.ok, '指紋を計算できないのに sidecar を書いている').toBe(false);
    expect(existsSync(sidecarPathFor(artifact))).toBe(false);
  });
});

describe('記録 script — 成果物が無ければ書かない', () => {
  const recorder = resolve(REPO_ROOT, 'scripts/record-artifact-inputs.mjs');

  it('T-FP-301 成果物が無い状態では sidecar を作らない', () => {
    const { root, artifact } = makeTree();
    rmSync(artifact);
    const run = spawnSync(process.execPath, [recorder, 'coverage'], {
      cwd: join(root, 'packages/demo'),
      encoding: 'utf8',
    });
    // 測定が失敗した後に記録すると、前の run の成果物と今の内容が組になる。
    expect(existsSync(sidecarPathFor(artifact))).toBe(false);
    expect(run.status, '記録できないことを測定失敗として扱っている').toBe(0);
    expect(run.stderr).toContain('nothing to record');
  });

  it('T-FP-302 知らない種別は記録しない', () => {
    const { root } = makeTree();
    const run = spawnSync(process.execPath, [recorder, 'bogus'], {
      cwd: join(root, 'packages/demo'),
      encoding: 'utf8',
    });
    expect(run.stderr).toContain('unknown kind');
    expect(run.status).toBe(0);
  });
});

describe('実 gate — 内容で判定する', () => {
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
      // 閾値を通る中身にする。 空だと分母 0 で MSI 0 になり、鮮度と別の理由で落ちる。
      body: '{"files":{"a.js":{"mutants":[{"status":"Killed"},{"status":"Killed"}]}}}\n',
      command: 'pnpm -F @kiwa-lab/core test:mutation',
    },
  ] as const;

  /** `packages/core` だけを持つ実 repository を作り、gate を走らせる。 */
  function runGate(gate: string, prepare: (root: string, artifact: string) => void) {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-fp-gate-'));
    created.push(root);
    mkdirSync(join(root, 'packages/core/src'), { recursive: true });
    mkdirSync(join(root, 'packages/core/tests'), { recursive: true });
    writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const v = 1;\n');
    writeFileSync(join(root, 'packages/core/tests/index.test.ts'), 'export const t = 1;\n');
    gitAt(root, COMMIT_EPOCH, 'init', '-q');
    gitAt(root, COMMIT_EPOCH, 'add', '-A');
    gitAt(root, COMMIT_EPOCH, 'commit', '-q', '-m', 'init');
    const artifact = join(root, 'packages/core', gateArtifact(gate));
    mkdirSync(dirname(artifact), { recursive: true });
    prepare(root, artifact);
    const run = spawnSync(process.execPath, [resolve(REPO_ROOT, gate)], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, KIWA_GATE_ROOT: root },
    });
    return { root, artifact, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
  }

  function gateArtifact(gate: string): string {
    const hit = cases.find((entry) => entry.gate === gate);
    if (!hit) throw new Error(`unknown gate ${gate}`);
    return hit.artifactRel;
  }

  it.each(cases)('T-FP-401 $gate は内容が一致すれば時刻に関わらず通す', (spec) => {
    const { stderr } = runGate(spec.gate, (root, artifact) => {
      writeFileSync(artifact, spec.body);
      recordArtifactInputs({
        repoRoot: root,
        inputRels: ['packages/core/src', 'packages/core/tests'],
        artifactAbs: artifact,
      });
      // 時刻だけ見れば stale になる形に置く。
      utimesSync(artifact, COMMIT_EPOCH - 86_400, COMMIT_EPOCH - 86_400);
    });
    // 他 package は成果物が無いので落ちる。 見るのは core が鮮度で落とされないこと。
    expect(stderr, '内容が一致しているのに時刻で落としている').not.toContain('predates the report inputs');
    expect(stderr).not.toContain('was measured against different content');
  });

  it.each(cases)('T-FP-402 $gate は内容が違えば時刻に関わらず落とす', (spec) => {
    const { stderr } = runGate(spec.gate, (root, artifact) => {
      writeFileSync(artifact, spec.body);
      recordArtifactInputs({
        repoRoot: root,
        inputRels: ['packages/core/src', 'packages/core/tests'],
        artifactAbs: artifact,
      });
      writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const v = 2;\n');
      // 時刻だけ見れば fresh になる形に置く。
      utimesSync(artifact, COMMIT_EPOCH + 86_400, COMMIT_EPOCH + 86_400);
    });
    expect(stderr).toContain('was measured against different content');
    expect(stderr, '再計測 command が出ていない').toContain(spec.command);
  });

  it.each(cases)('T-FP-403 $gate は sidecar が無ければ時刻比較に落ちる', (spec) => {
    const { stderr } = runGate(spec.gate, (root, artifact) => {
      writeFileSync(artifact, spec.body);
      // sidecar を作らず、時刻だけ stale にする。
      utimesSync(artifact, COMMIT_EPOCH - 86_400, COMMIT_EPOCH - 86_400);
    });
    expect(stderr, '#2125 の時刻比較に落ちていない').toContain('predates the report inputs');
    expect(stderr).toContain(spec.command);
  });

  it.each(cases)('T-FP-404 $gate は読めない sidecar で落とす', (spec) => {
    const { stderr } = runGate(spec.gate, (root, artifact) => {
      writeFileSync(artifact, spec.body);
      recordArtifactInputs({
        repoRoot: root,
        inputRels: ['packages/core/src', 'packages/core/tests'],
        artifactAbs: artifact,
      });
      const path = sidecarPathFor(artifact);
      writeFileSync(path, readFileSync(path, 'utf8').replace(/schema_version: \d+/, 'schema_version: 99'));
    });
    expect(stderr).toContain('cannot tell whether');
    expect(stderr).toContain(spec.command);
  });
});

describe('mutation runner — 失敗した run では記録しない', () => {
  /** stryker の exit code を差し替えて `runPackageMutation` を回す。 */
  function drive(strykerStatus: number) {
    const recorded: number[] = [];
    const code = runner.runPackageMutation({
      cwd: '/tmp/does-not-matter',
      rm: () => {},
      run: (command: string) => (command === 'stryker' ? strykerStatus : 0),
      warn: () => {},
      dirProblem: null,
      setupProblems: () => [],
      record: () => {
        recorded.push(1);
        return { ok: true, fingerprint: 'x' };
      },
    });
    return { code, recordCalls: recorded.length };
  }

  it('T-FP-501 stryker が失敗したら sidecar を書かない', () => {
    const { code, recordCalls } = drive(1);
    expect(code).toBe(1);
    // 失敗した run の後に記録すると、前の run が残した report と今の内容が組になる。
    expect(recordCalls, '失敗した run で指紋を記録している').toBe(0);
  });

  it('T-FP-502 stryker が成功したら sidecar を書く', () => {
    const { code, recordCalls } = drive(0);
    expect(code).toBe(0);
    expect(recordCalls).toBe(1);
  });

  it('T-FP-503 記録に失敗しても run は成功のまま', () => {
    const warnings: string[] = [];
    const code = runner.runPackageMutation({
      cwd: '/tmp/does-not-matter',
      rm: () => {},
      run: () => 0,
      warn: (message: string) => warnings.push(message),
      dirProblem: null,
      setupProblems: () => [],
      record: () => ({ ok: false, reason: 'git could not describe the inputs' }),
    });
    // 記録できないことは測定の失敗ではない。 gate は時刻比較に落ちる。
    expect(code).toBe(0);
    expect(warnings.join('')).toContain('could not record the input fingerprint');
  });
});
