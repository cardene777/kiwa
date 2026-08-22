import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  loadJson,
  loadLayerTable,
  resolveLayers,
  resolveTestPaths,
  type LayerRecord,
} from '../src/detect/layers.js';
import { signalsFingerprint, type SignalTable } from '../src/detect/detect.js';
import { loadSignalTable } from '../src/detect/index.js';

// packages/cli/src/detect/layers.ts のうち tests/layers.test.ts が通っていない
// 「読めなかった」 経路と、 `.kiwa/stack.json` の壊れ方 4 種を走らせる behavior test。
//
// 記録の検証は「どの理由で捨てたか」 が warning 文言に出る設計なので、 検査は
// 文言と、 捨てた結果 (source が `all` に戻り層が全件になること) の両方を見る。
// 触るのは一時 dir 上の実 file だけで、 process も network も起こさない。

const SIGNALS = loadSignalTable() as SignalTable;
const TABLE = loadLayerTable();

const cleanups: (() => void)[] = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** 記録が読まれる時点より後の時刻。 これがないと全件 stale として捨てられる。 */
function fresh(): string {
  return new Date(Date.now() + 60_000).toISOString();
}

/** `.kiwa/stack.json` を持つ project。 `signals` は読み手と同じ table のもの。 */
function fixture(files: Record<string, string>, stack: Record<string, unknown>): string {
  const root = tempDir('kiwa-layers-edges-');
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  mkdirSync(join(root, '.kiwa'), { recursive: true });
  writeFileSync(
    join(root, '.kiwa', 'stack.json'),
    JSON.stringify({ signals: signalsFingerprint(SIGNALS), ...stack }, null, 2),
  );
  return root;
}

describe('loadJson が候補を読めなかったとき', () => {
  it('T-LJ-001 候補が dir なら「読めなかった」 として throw する', () => {
    // build の隣に置かれた copy を最優先で読む経路。 同名の dir があると
    // readFileSync が EISDIR で落ちる。 握って null を返すと「無かった」 と
    // 区別できず、 install 先の別 project の layers.json を拾いに行ってしまう。
    const root = tempDir('kiwa-loadjson-');
    mkdirSync(join(root, 'here'), { recursive: true });
    mkdirSync(join(root, 'broken.json'), { recursive: true });

    expect(() => loadJson('broken.json', join(root, 'here'))).toThrow(/could not be read/);
  });

  it('T-LJ-002 候補が JSON として壊れていれば throw する', () => {
    const root = tempDir('kiwa-loadjson-');
    mkdirSync(join(root, 'here'), { recursive: true });
    writeFileSync(join(root, 'broken.json'), '{ not json');

    expect(() => loadJson('broken.json', join(root, 'here'))).toThrow(/is not valid JSON/);
  });

  it('T-LJ-003 filesystem の頂上まで登っても見つからなければ null を返す', () => {
    // 親が自分自身になった時点で登るのをやめる。 止めないと 8 回まわる間ずっと
    // 同じ dir を見続ける (無害だが、 見つからなかったことを返せない)。
    expect(loadJson('kiwa-no-such-table-9f3a.json', '/')).toBeNull();
  });
});

describe('.kiwa/stack.json を捨てる理由', () => {
  it('T-LRV-001 読んだ manifest が 1 件も記録されていなければ捨てる', () => {
    // どの言語を見たのかが分からない記録では、 どの runtime も除外できない。
    // 空の一覧を「何も無かった」 と読むと全 runtime を落としてしまう。
    const root = fixture({ 'foundry.toml': '[profile.default]\n' }, {
      generated_at: fresh(),
      scanned: [],
      detected: [{ layer: 'nextjs-rsc', manifest: 'package.json' }],
    });

    const resolved = resolveLayers({ cwd: root });
    expect(resolved.warnings.join(' ')).toMatch(/does not record which manifests were read/);
    expect(resolved.source).toBe('all');
    expect(resolved.layers).toHaveLength(TABLE.length);
  });

  it('T-LRV-002 manifest 名か言語が欠けた entry があれば捨てる', () => {
    const root = fixture({ 'package.json': '{"dependencies":{"next":"15"}}' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'package.json' }],
      detected: [{ layer: 'nextjs-rsc', manifest: 'package.json' }],
    });

    const resolved = resolveLayers({ cwd: root });
    expect(resolved.warnings.join(' ')).toMatch(/missing its manifest or language/);
    expect(resolved.source).toBe('all');
  });

  it('T-LRV-003 hash を持つ entry の manifest が読めなければ捨てる', () => {
    // 記録された hash と突き合わせる相手が読めない状態。 「変わっていない」 とは
    // 言えないので、 hash 照合を飛ばして弱い mtime 比較に落とさず捨てる。
    const root = fixture({}, {
      generated_at: fresh(),
      scanned: [
        {
          manifest: 'package.json',
          language: 'typescript',
          content_sha256: 'a'.repeat(64),
        },
      ],
      detected: [{ layer: 'nextjs-rsc', manifest: 'package.json' }],
    });
    // 存在はするが読めない manifest (同名の dir)。
    mkdirSync(join(root, 'package.json'), { recursive: true });

    const resolved = resolveLayers({ cwd: root });
    expect(resolved.warnings.join(' ')).toMatch(/package\.json could not be read/);
    expect(resolved.source).toBe('all');
  });

  it('T-LRV-004 detected が list でなければ捨てる', () => {
    const root = fixture({ 'package.json': '{"dependencies":{"next":"15"}}' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'package.json', language: 'typescript' }],
      detected: 'nextjs-rsc',
    });

    const resolved = resolveLayers({ cwd: root });
    expect(resolved.warnings.join(' ')).toMatch(/detected list is not a list/);
    expect(resolved.source).toBe('all');
  });

  it('T-LRV-005 detected の entry に layer 名が無ければ捨てる', () => {
    // 層名の無い entry を黙って読み飛ばすと、 記録の残りだけで絞り込むことになる。
    // どの層が落ちたのかは記録から読めないので、 記録ごと捨てる。
    const root = fixture({ 'package.json': '{"dependencies":{"next":"15"}}' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'package.json', language: 'typescript' }],
      detected: [{ manifest: 'package.json' }],
    });

    const resolved = resolveLayers({ cwd: root });
    expect(resolved.warnings.join(' ')).toMatch(/missing its layer/);
    expect(resolved.source).toBe('all');
  });

  it('T-LRV-006 detected が無い記録は「1 件も当たらなかった」 として読む', () => {
    // `--detect` が層を 1 つも当てられなかった時に書かれる形。 捨てずに読み、
    // 読んだ言語 (typescript) の層だけを候補から外す。
    const root = fixture({ 'package.json': '{"name":"root"}' }, {
      generated_at: fresh(),
      scanned: [{ manifest: 'package.json', language: 'typescript' }],
    });

    const resolved = resolveLayers({ cwd: root });
    // 記録を捨てた時の warning (`ignoring` / `could not` 系) は出ない。 出るのは
    // 除外の内訳だけ。
    expect(resolved.warnings.join(' ')).not.toMatch(/could not|is not a list|missing its/);
    expect(resolved.source).toBe('detected');
    // 記録として読めているので全件には戻らず、 signal が名前を持つ層は落ちる。
    expect(resolved.layers.length).toBeLessThan(TABLE.length);
    expect(resolved.layers.map((l) => l.id)).not.toContain('nextjs-rsc');
  });
});

describe('resolveTestPaths の走査が dir を開けなかったとき', () => {
  function layerWith(outputs: Record<string, string[]>): LayerRecord {
    return {
      id: 'sample',
      spec_dir: null,
      spec_path: null,
      runtime: null,
      consumer_skill: 'kiwa-api',
      also_consumed_by: [],
      backing_package: null,
      backing_runtime_package: null,
      providers: [],
      targets: [],
      variants: [],
      selected_by: null,
      mode: null,
      test_outputs: outputs,
    };
  }

  it('T-TPX-010 途中の dir を listing できなければ 0 件として返す', () => {
    // 権限で開けない dir は「その先に一致は無い」 として扱う。 例外にすると
    // `kiwa layers --json` が project の別の場所の権限で丸ごと落ちる。
    const root = tempDir('kiwa-test-paths-edges-');
    const closed = join(root, 'test');
    mkdirSync(join(closed, 'integration'), { recursive: true });
    writeFileSync(join(closed, 'integration', 'orders.api.test.ts'), '');
    chmodSync(closed, 0o000);
    // 後片付けが read 権限を要るので、 削除より先に戻す。
    cleanups.push(() => chmodSync(closed, 0o755));

    const resolved = resolveTestPaths(
      layerWith({ 'kiwa-api': ['{example}/test/integration/{module}.api.test.ts'] }),
      { cwd: root, module: 'orders' },
    );

    // 探した pattern は返るが、 一致は 0 件。
    expect(resolved.patterns).toEqual(['test/integration/orders.api.test.ts']);
    expect(resolved.files).toEqual([]);
    expect(resolved.anchor).toBeNull();
  });

  it('T-TPX-011 project root 自身を指す宣言は 0 件として返す', () => {
    // `{example}/.` は「project root そのもの」。 走査すべき segment が 1 つも
    // 無いので、 root 配下の全 file を返してはいけない (test 一覧としては嘘になる)。
    const root = tempDir('kiwa-test-paths-edges-');
    writeFileSync(join(root, 'stray.test.ts'), '');

    const resolved = resolveTestPaths(layerWith({ 'kiwa-api': ['{example}/.'] }), { cwd: root });

    // 表示上の pattern は root 自身 (`.`)、 一致は 0 件。
    expect(resolved.patterns).toEqual(['.']);
    expect(resolved.files).toEqual([]);
    expect(resolved.anchor).toBeNull();
  });
});
