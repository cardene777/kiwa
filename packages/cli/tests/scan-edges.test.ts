import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { scan } from '../src/detect/scan.js';

// packages/cli/src/detect/scan.ts の「読めなかった」 経路と、 workspace 宣言の
// 未検証な書き方 (glob なし / 存在しない基点 / file だった基点 / 否定 glob /
// package.json の workspaces field) を走らせる behavior test。
//
// scan は「読めないものは無かったことにする」 設計なので、 検査は例外ではなく
// 「戻り値に何が入り、 何が入らないか」 で見る。 落ちて欲しくない入力で落ちない
// ことが分かる形にしてある。 実 file だけを触り、 process も network も起こさない。

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

/** file と dir を並べた一時 project。 値が `null` の entry は空 dir として作る。 */
function fixture(files: Record<string, string | null>): string {
  const dir = tempDir('kiwa-scan-edges-');
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    if (body === null) {
      mkdirSync(full, { recursive: true });
      continue;
    }
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, 'utf-8');
  }
  return dir;
}

describe('scan は読めなかった manifest を無かったことにする', () => {
  it('T-SCAN-001 package.json が dir なら entry を作らず、 workspace 解決も止めない', () => {
    // `package.json` という名前の dir は存在する。 存在確認だけで読みに行くと
    // EISDIR で scan 全体が落ちる。 落ちずに「読めた manifest は 0 件」 を返し、
    // pnpm-workspace.yaml 側の member はそのまま読めることを見る。
    const dir = fixture({
      'package.json': null,
      'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    const paths = scan(dir).map((m) => m.path);
    expect(paths).not.toContain('package.json');
    expect(paths).toContain(join('apps', 'web', 'package.json'));
  });

  it('T-SCAN-002 pnpm-workspace.yaml が dir でも package.json の workspaces は読む', () => {
    // workspace 宣言は 2 つの file から集める。 片方が読めない時にもう片方まで
    // 捨てると、 monorepo の member が丸ごと見えなくなる。
    const dir = fixture({
      'pnpm-workspace.yaml': null,
      'package.json': JSON.stringify({ name: 'root', workspaces: ['apps/*'] }),
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    const paths = scan(dir).map((m) => m.path);
    expect(paths).toContain('package.json');
    expect(paths).toContain(join('apps', 'web', 'package.json'));
  });

  it('T-SCAN-003 package.json が JSON として壊れていても workspace 解決で落ちない', () => {
    // 壊れた manifest は「依存 0 件」 として読める (readPackageJson が握る) が、
    // workspaces field を読む側は JSON.parse を直に呼ぶ。 そこで落とすと、
    // 壊れた root 1 つで scan 全体が例外になる。
    const dir = fixture({
      'package.json': '{ not json',
      'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    const found = scan(dir);
    expect(found.find((m) => m.path === 'package.json')?.deps).toEqual([]);
    expect(found.map((m) => m.path)).toContain(join('apps', 'web', 'package.json'));
  });
});

describe('workspace pattern の glob 以外の書き方', () => {
  it('T-SCAN-010 `*` を含まない pattern は dir 名そのものとして扱う', () => {
    // `- apps/web` は 1 つの member を名指しする正規の書き方。 glob として
    // 扱うと 1 件も展開されず、 その member の依存が読まれない。
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "apps/web"\n  - "apps/absent"\n',
      'package.json': '{"name":"root"}',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    const paths = scan(dir).map((m) => m.path);
    expect(paths).toContain(join('apps', 'web', 'package.json'));
    // 名指しされた dir が無い場合は静かに 0 件 (存在しない member は失敗ではない)。
    expect(paths).toHaveLength(2);
  });

  it('T-SCAN-011 glob の基点が存在しない pattern は何も足さない', () => {
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n',
      'package.json': '{"name":"root"}',
    });

    expect(scan(dir).map((m) => m.path)).toEqual(['package.json']);
  });

  it('T-SCAN-012 glob の基点が file なら listing の失敗を握って scan は続く', () => {
    // `packages` が file の project は実在する (生成物の置き場等)。 readdirSync が
    // ENOTDIR で落ちるので、 握らないと他の member まで読めなくなる。
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n  - "apps/*"\n',
      'package.json': '{"name":"root"}',
      packages: 'this is a file, not a directory\n',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    const paths = scan(dir).map((m) => m.path);
    expect(paths).toContain(join('apps', 'web', 'package.json'));
    expect(paths).toHaveLength(2);
  });

  it('T-SCAN-013 否定 pattern が glob なら前段が足した member をまとめて外す', () => {
    // `!pkgs/*` は「pkgs 配下は全部除外」。 前段の `pkgs/*` が 1 件ずつ足した dir を
    // prefix で消す経路で、 完全一致だけを見ると 1 件も外れず、 除外したはずの
    // member の依存を読んでしまう。
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "pkgs/*"\n  - "apps/*"\n  - "!pkgs/*"\n',
      'package.json': '{"name":"root"}',
      'pkgs/skip/package.json': '{"dependencies":{"a":"1"}}',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    // 先に否定 pattern 抜きの同形を測る。 これが無いと `not.toContain` は
    // 「そもそも候補に挙がっていない」 場合にも通り、 除外が効いた証拠にならない。
    const control = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - "pkgs/*"\n  - "apps/*"\n',
      'package.json': '{"name":"root"}',
      'pkgs/skip/package.json': '{"dependencies":{"a":"1"}}',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });
    expect(
      scan(control).map((m) => m.path),
      '否定 pattern が無ければ pkgs/skip は候補に挙がる',
    ).toContain(join('pkgs', 'skip', 'package.json'));

    const paths = scan(dir).map((m) => m.path);
    expect(paths).toContain(join('apps', 'web', 'package.json'));
    expect(paths, '否定 pattern が前段の候補を消す').not.toContain(
      join('pkgs', 'skip', 'package.json'),
    );
  });

  it('T-SCAN-015 root の外を指す member は絶対 path のまま報告する', () => {
    // `- ../shared` は root の外に出る member。 root からの相対として綴ると
    // `../` を含む path になり、 記録の照合が root 起点で開けなくなる。
    const outer = tempDir('kiwa-scan-outer-');
    const root = join(outer, 'project');
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, 'package.json'), '{"name":"root"}');
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "../shared"\n');
    mkdirSync(join(outer, 'shared'), { recursive: true });
    writeFileSync(join(outer, 'shared', 'package.json'), '{"dependencies":{"next":"15"}}');

    const paths = scan(root).map((m) => m.path);
    expect(paths).toContain('package.json');
    expect(paths).toContain(join(outer, 'shared', 'package.json'));
  });

  it('T-SCAN-014 inline list の行末コメントは pattern に混ざらない', () => {
    // `packages: [apps/*] # note` の `#` 以降を落とさないと、 `note` を含む
    // pattern として読んで member が 1 件も当たらない。
    const dir = fixture({
      'pnpm-workspace.yaml': 'packages: [apps/*] # keep the web app only\n',
      'package.json': '{"name":"root"}',
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    expect(scan(dir).map((m) => m.path)).toContain(join('apps', 'web', 'package.json'));
  });
});

describe('package.json の workspaces field', () => {
  it('T-SCAN-020 配列形 (npm / yarn) の workspaces を member として読む', () => {
    const dir = fixture({
      'package.json': JSON.stringify({ name: 'root', workspaces: ['apps/*'] }),
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    expect(scan(dir).map((m) => m.path)).toContain(join('apps', 'web', 'package.json'));
  });

  it('T-SCAN-021 object 形 ({ packages: [...] }) の workspaces も読む', () => {
    // yarn の nohoist 付き宣言はこの形になる。 配列だけを見ると member が
    // 1 件も読まれず、 monorepo が単一 project として検出される。
    const dir = fixture({
      'package.json': JSON.stringify({ name: 'root', workspaces: { packages: ['libs/*'] } }),
      'libs/util/package.json': '{"dependencies":{"next":"15"}}',
    });

    expect(scan(dir).map((m) => m.path)).toContain(join('libs', 'util', 'package.json'));
  });

  it('T-SCAN-022 workspaces が文字列 1 つなら member は増えない', () => {
    // 配列でも object でもない値は宣言として読めない。 例外にせず 0 件で返す。
    const dir = fixture({
      'package.json': JSON.stringify({ name: 'root', workspaces: 'apps/*' }),
      'apps/web/package.json': '{"dependencies":{"next":"15"}}',
    });

    expect(scan(dir).map((m) => m.path)).toEqual(['package.json']);
  });
});
