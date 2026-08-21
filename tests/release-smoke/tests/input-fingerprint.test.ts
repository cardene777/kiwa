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
  compareArtifactInputs: (
    args: {
      repoRoot: string;
      inputRels: string[];
      artifactAbs: string;
    },
    io?: { readFileSync?: typeof readFileSync },
  ) => FingerprintResult;
  computeInputFingerprint: (
    args: { repoRoot: string; inputRels: string[] },
    io?: { execFileSync?: (command: string, args: string[], options: Record<string, unknown>) => string },
  ) => string | null;
  readArtifactInputs: (artifactAbs: string) => ReadResult;
  recordArtifactInputs: (
    args: {
      repoRoot: string;
      inputRels: string[];
      artifactAbs: string;
      buildDirAbs?: string;
    },
    io?: {
      mkdirSync?: typeof mkdirSync;
      writeFileSync?: typeof writeFileSync;
    },
  ) => RecordResult;
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

const recorderModule = (await import(
  pathToFileURL(resolve(REPO_ROOT, 'scripts/record-artifact-inputs.mjs')).href
)) as {
  recordForPackage: (args: {
    kind: string;
    cwd: string;
    repoRoot: string;
  }) => { ok: true } | { ok: false; reason: string };
};
const { recordForPackage } = recorderModule;

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
  recordMutationInputs: (cwd: string, repoRoot: string) => { ok: true } | { ok: false; reason: string };
};

const SRC_REL = 'packages/demo/src';
const TESTS_REL = 'packages/demo/tests';
const ARTIFACT_REL = 'packages/demo/coverage/coverage-summary.json';
/** 実行が測る compile 済 copy。 入力がこれより新しければ記録しない。 */
const BUILD_REL = 'packages/demo/.vitest-dist';
const INPUTS = [SRC_REL, TESTS_REL];
/** fixture の基準時刻。 実行時刻に依らないよう固定する。 */
const COMMIT_EPOCH = 1_600_000_000;
/** 入力を compile した時刻。 記録が「測定に入ったか」 を見る基準。 */
const BUILD_EPOCH = COMMIT_EPOCH + 100;
/** 測定が終わって成果物が書かれた時刻。 compile より後になる。 */
const ARTIFACT_EPOCH = COMMIT_EPOCH + 200;

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

type Fixture = {
  root: string;
  srcFile: string;
  testFile: string;
  artifact: string;
  buildDir: string;
};

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
  // 実行は入力を compile してから測る。 build を入力より新しく置くのが
  // 「測定中に入力が変わっていない」 状態にあたる。
  const buildDir = join(root, BUILD_REL);
  mkdirSync(buildDir, { recursive: true });
  writeFileSync(join(buildDir, 'index.js'), 'export const value = 1;\n');
  // 実行の順序どおりに時刻を置く。 入力 → compile → 測定 → 成果物 の 3 段が
  // 別々の時刻を持たないと、どれを基準に見ているのかを test が区別できない。
  for (const path of [srcFile, testFile]) utimesSync(path, COMMIT_EPOCH, COMMIT_EPOCH);
  utimesSync(join(buildDir, 'index.js'), BUILD_EPOCH, BUILD_EPOCH);
  utimesSync(artifact, ARTIFACT_EPOCH, ARTIFACT_EPOCH);
  if (asRepo) {
    gitAt(root, COMMIT_EPOCH, 'init', '-q');
    gitAt(root, COMMIT_EPOCH, 'add', '-A');
    gitAt(root, COMMIT_EPOCH, 'commit', '-q', '-m', 'init');
  }
  return { root, srcFile, testFile, artifact, buildDir };
}

/** 入力を build より新しくする (= 測定中に編集された状態)。 */
function touchAfterBuild(path: string): void {
  const future = Date.now() / 1000 + 3600;
  utimesSync(path, future, future);
}

/**
 * 入力を compile と成果物の「あいだ」 に置く。
 *
 * 実行中の編集はここに落ちる。 成果物より古いので、成果物の時刻を基準に見ている
 * 実装はこれを見逃す。 compile を基準に見ている実装だけが捕まえられる。
 */
function touchDuringRun(path: string): void {
  utimesSync(path, BUILD_EPOCH + 50, BUILD_EPOCH + 50);
}

const digest = (root: string, inputRels = INPUTS) =>
  computeInputFingerprint({ repoRoot: root, inputRels });

const record = (root: string, artifact: string, inputRels = INPUTS) =>
  recordArtifactInputs({
    repoRoot: root,
    inputRels,
    artifactAbs: artifact,
    buildDirAbs: join(root, BUILD_REL),
  });

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

// sidecar は実行の「後」 に書かれる。 書いた時点の working tree が、成果物を測った
// 内容と同じとは限らない。 実行は入力を compile してから測るので、compile より新しい
// 入力は成果物に入っていない。
describe('記録 — 測定中に入力が変わった run は結び付けない', () => {
  it('T-FP-208 build より新しい入力があれば記録しない', () => {
    const { root, artifact, srcFile } = makeTree();
    touchAfterBuild(srcFile);
    const result = record(root, artifact);
    expect(result.ok, '測定に入っていない内容を成果物へ結び付けている').toBe(false);
    expect(result.ok === false && result.reason).toContain('changed after the build');
    expect(existsSync(sidecarPathFor(artifact)), 'sidecar を書いてしまっている').toBe(false);
  });

  it('T-FP-208b test 側の入力が build より新しくても記録しない', () => {
    const { root, artifact, testFile } = makeTree();
    touchAfterBuild(testFile);
    const result = record(root, artifact);
    expect(result.ok, 'src だけを見て tests を見ていない').toBe(false);
    expect(result.ok === false && result.reason).toContain('index.test.ts');
  });

  it('T-FP-208c ignore された file は build より新しくても記録を妨げない', () => {
    const { root, artifact, buildDir } = makeTree();
    // 成果物も build 自身も package の下にある。 これらを入力として数えると
    // どの実行も自分自身を無効にしてしまう。
    touchAfterBuild(artifact);
    touchAfterBuild(join(buildDir, 'index.js'));
    expect(record(root, artifact).ok, '追跡外の file で誤って拒否している').toBe(true);
  });

  it('T-FP-208d compile と成果物のあいだの編集も捕まえる', () => {
    const { root, artifact, srcFile } = makeTree();
    // 実行中の編集はここに落ちる。 成果物の時刻を基準にすると見逃す形。
    writeFileSync(srcFile, 'export const value = 2;\n');
    touchDuringRun(srcFile);
    const result = record(root, artifact);
    expect(result.ok, '成果物の時刻を基準にしていて compile を見ていない').toBe(false);
    expect(result.ok === false && result.reason).toContain('changed after the build');
  });

  it('T-FP-208e 消えた入力があっても後続の入力を見る', () => {
    const { root, artifact, srcFile, testFile } = makeTree();
    // commit 済 file を消すと git は列挙し続ける。 そこで走査を止めると、
    // その後ろにある変更を 1 件も見なくなる。
    rmSync(srcFile);
    touchAfterBuild(testFile);
    const result = record(root, artifact);
    expect(result.ok, '消えた入力で走査を打ち切っている').toBe(false);
    expect(result.ok === false && result.reason).toContain('index.test.ts');
  });

  it('T-FP-208f 参照先の無い symlink は fail-closed', () => {
    const { root, artifact } = makeTree();
    // lstat は通るが stat は通らない。 年齢を測れない入力を素通しすると、
    // 測定に入っていない内容を結び付けうる。
    symlinkSync(join(root, SRC_REL, 'gone.ts'), join(root, SRC_REL, 'dangling.ts'));
    const result = record(root, artifact);
    expect(result.ok, '年齢を測れない入力を素通ししている').toBe(false);
    expect(result.ok === false && result.reason).toContain('could not be read to compare');
  });

  it('T-FP-209 build が無ければ記録しない (fail-closed)', () => {
    const { root, artifact, buildDir } = makeTree();
    rmSync(buildDir, { recursive: true, force: true });
    const result = record(root, artifact);
    expect(result.ok, '測定した compile 済 copy が無いのに結び付けている').toBe(false);
    expect(result.ok === false && result.reason).toContain('could not be read');
  });

  it('T-FP-209b build が空なら記録しない', () => {
    const { root, artifact, buildDir } = makeTree();
    rmSync(join(buildDir, 'index.js'));
    const result = record(root, artifact);
    expect(result.ok, '中身の無い build を測定の証拠にしている').toBe(false);
    expect(result.ok === false && result.reason).toContain('holds no files');
  });

  it('T-FP-210 buildDirAbs を渡さなければ記録しない', () => {
    const { root, artifact } = makeTree();
    const result = recordArtifactInputs({ repoRoot: root, inputRels: INPUTS, artifactAbs: artifact });
    expect(result.ok, '検査する相手が無いまま sidecar を書いている').toBe(false);
    expect(result.ok === false && result.reason).toContain('no build directory');
    expect(existsSync(sidecarPathFor(artifact))).toBe(false);
  });
});

// 記録できないことは実行の失敗ではない。 呼出側 (`recordForPackage` は exit 0、
// `runPackageMutation` は warn して実行自身の exit code) はいずれも返り値を見る契約で、
// 例外はその両方を飛び越えて「`test:cov` が落ちた」 に化ける。
describe('記録 — 書けない時も返り値で返す', () => {
  const failing = (message: string) => () => {
    throw new Error(message);
  };

  it('T-FP-211 sidecar を書けなければ例外でなく ok:false', () => {
    const { root, artifact } = makeTree();
    let result: RecordResult | undefined;
    expect(() => {
      result = recordArtifactInputs(
        { repoRoot: root, inputRels: INPUTS, artifactAbs: artifact, buildDirAbs: join(root, BUILD_REL) },
        { writeFileSync: failing('ENOSPC: no space left on device') as typeof writeFileSync },
      );
    }, '書込失敗が例外として呼出側へ伝播している').not.toThrow();
    expect(result?.ok).toBe(false);
    expect(result?.ok === false && result.reason).toContain('ENOSPC');
  });

  it('T-FP-211b dir を作れなければ例外でなく ok:false', () => {
    const { root, artifact } = makeTree();
    let result: RecordResult | undefined;
    expect(() => {
      result = recordArtifactInputs(
        { repoRoot: root, inputRels: INPUTS, artifactAbs: artifact, buildDirAbs: join(root, BUILD_REL) },
        { mkdirSync: failing('EACCES: permission denied') as typeof mkdirSync },
      );
    }, 'dir 作成の失敗が例外として伝播している').not.toThrow();
    expect(result?.ok).toBe(false);
    expect(result?.ok === false && result.reason).toContain('EACCES');
  });

  it('T-FP-211c 書込失敗の後に sidecar が残らない', () => {
    const { root, artifact } = makeTree();
    recordArtifactInputs(
      { repoRoot: root, inputRels: INPUTS, artifactAbs: artifact, buildDirAbs: join(root, BUILD_REL) },
      { writeFileSync: failing('ENOSPC') as typeof writeFileSync },
    );
    expect(existsSync(sidecarPathFor(artifact)), '書けなかったのに sidecar がある').toBe(false);
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

  // CLI 自身は自分の file 位置から repo root を決めるので fixture では動かせない。
  // build を渡す配線そのものを持つのは `recordForPackage` で、両 kind がここを通る。
  it('T-FP-303 coverage は build を測定の基準として渡している', () => {
    const { root, artifact, srcFile } = makeTree();
    // compile と成果物のあいだに落ちる編集。 基準が build でなければ
    // (成果物の時刻や、そもそも渡していない場合) 記録は通り、
    // 測っていない内容が成果物に結び付く。
    writeFileSync(srcFile, 'export const value = 2;\n');
    touchDuringRun(srcFile);
    const result = recordForPackage({ kind: 'coverage', cwd: join(root, 'packages/demo'), repoRoot: root });
    expect(result.ok, '測定に入っていない内容を成果物へ結び付けている').toBe(false);
    expect(result.ok === false && result.reason).toContain('changed after the build');
    expect(existsSync(sidecarPathFor(artifact))).toBe(false);
  });

  it('T-FP-304 build が揃っていれば記録する', () => {
    const { root, artifact } = makeTree();
    const result = recordForPackage({ kind: 'coverage', cwd: join(root, 'packages/demo'), repoRoot: root });
    expect(result.ok, `記録できていない: ${result.ok === false ? result.reason : ''}`).toBe(true);
    expect(existsSync(sidecarPathFor(artifact))).toBe(true);
  });

  // mutation runner も同じ recorder を通す。 経路が分かれていると、build を
  // 渡す配線を片方だけ落としても誰も気付けない。
  it('T-FP-305 mutation も同じ配線を通る', () => {
    const { root } = makeTree();
    const pkg = join(root, 'packages/demo');
    mkdirSync(join(pkg, 'mutation-report'), { recursive: true });
    const report = join(pkg, 'mutation-report/mutation.json');
    writeFileSync(report, '{"files":{}}\n');
    const srcFile = join(root, SRC_REL, 'index.ts');
    writeFileSync(srcFile, 'export const value = 3;\n');
    touchDuringRun(srcFile);
    const result = recordForPackage({ kind: 'mutation', cwd: pkg, repoRoot: root });
    expect(result.ok, 'mutation 側だけ build を見ていない').toBe(false);
    expect(result.ok === false && result.reason).toContain('changed after the build');
    expect(existsSync(sidecarPathFor(report))).toBe(false);
  });

  // runner の入口は実 package の中でしか走らないので、どちらの成果物へ記録するかは
  // 呼出側の 1 語でしか決まらない。 その語を取り違えると coverage 側へ書き、
  // mutation の gate は sidecar を 1 度も持たない。
  it('T-FP-306 mutation runner は mutation の成果物へ記録する', () => {
    const { root, artifact } = makeTree();
    const pkg = join(root, 'packages/demo');
    mkdirSync(join(pkg, 'mutation-report'), { recursive: true });
    const report = join(pkg, 'mutation-report/mutation.json');
    writeFileSync(report, '{"files":{}}\n');
    utimesSync(report, ARTIFACT_EPOCH, ARTIFACT_EPOCH);
    const result = runner.recordMutationInputs(pkg, root);
    expect(result.ok, `記録できていない: ${result.ok === false ? result.reason : ''}`).toBe(true);
    expect(existsSync(sidecarPathFor(report)), 'mutation の成果物に sidecar が無い').toBe(true);
    expect(existsSync(sidecarPathFor(artifact)), 'coverage 側へ書いている').toBe(false);
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
    mkdirSync(join(root, 'packages/core/.vitest-dist'), { recursive: true });
    writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const v = 1;\n');
    writeFileSync(join(root, 'packages/core/tests/index.test.ts'), 'export const t = 1;\n');
    writeFileSync(join(root, 'packages/core/.vitest-dist/index.js'), 'export const v = 1;\n');
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
        buildDirAbs: join(root, 'packages/core/.vitest-dist'),
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
        buildDirAbs: join(root, 'packages/core/.vitest-dist'),
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

  it.each(cases)('T-FP-405 $gate は測定中に入力が変わった run を通さない', (spec) => {
    const { stderr } = runGate(spec.gate, (root, artifact) => {
      writeFileSync(artifact, spec.body);
      // compile の後に入力が変わった状態。 成果物はこの内容を測っていない。
      const input = join(root, 'packages/core/src/index.ts');
      writeFileSync(input, 'export const v = 2;\n');
      const future = Date.now() / 1000 + 3600;
      utimesSync(input, future, future);
      const recorded = recordArtifactInputs({
        repoRoot: root,
        inputRels: ['packages/core/src', 'packages/core/tests'],
        artifactAbs: artifact,
        buildDirAbs: join(root, 'packages/core/.vitest-dist'),
      });
      expect(recorded.ok, '測定に入っていない内容で sidecar を書いている').toBe(false);
      // 時刻だけ見れば fresh になる形に置き、時刻比較の側も試す。
      utimesSync(artifact, COMMIT_EPOCH + 86_400, COMMIT_EPOCH + 86_400);
    });
    // sidecar が無いので #2125 の時刻比較に落ち、dirty な入力で stale と判定される。
    expect(stderr, '測定していない内容の成果物を通している').toContain('predates the report inputs');
    expect(stderr).toContain(spec.command);
  });

  it.each(cases)('T-FP-404 $gate は読めない sidecar で落とす', (spec) => {
    const { stderr } = runGate(spec.gate, (root, artifact) => {
      writeFileSync(artifact, spec.body);
      recordArtifactInputs({
        repoRoot: root,
        inputRels: ['packages/core/src', 'packages/core/tests'],
        artifactAbs: artifact,
        buildDirAbs: join(root, 'packages/core/.vitest-dist'),
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
