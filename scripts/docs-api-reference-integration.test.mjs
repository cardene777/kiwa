// sync-library-api-reference.mjs を実際に起動して、壊れた入力と細工された checkout で
// 書き込まずに非 0 で終わることを確かめる。
//
// 単体 test (docs-sync-safety.test.mjs / docs-api-page-guard.test.mjs) は guard 関数の
// 振る舞いを押さえるが、guard が script に配線されていなければ通ってしまう。
// doc-links 側は docs-sync-integration.test.mjs が同じ形で押さえており、
// api-reference 側はこれまで実 repo に対する実走 (exit 0 と冪等) だけで、
// 異常系を一度も通していなかった。
//
//   node --test scripts/docs-api-reference-integration.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptsDirectory, '..');
const START = '<!-- kiwa-public-api:start -->';
const END = '<!-- kiwa-public-api:end -->';
const HAND_WRITTEN = '## 手書き\n\nこの節は生成対象ではない。\n';
// program が repo の外の file を読んだ時の文言。`outside` だけで照合すると
// 別の理由で落ちた実行や、path に outside を含む dir 名まで一致する。
const COMPILER_READ_OUTSIDE = /the compiler read \d+ file\(s\) outside .*; refusing to generate/;

/** reference.md の初期内容。生成 script は marker の間だけを差し替える。 */
function referenceBody() {
  return `# reference\n\n${HAND_WRITTEN}`;
}

/** 型が 1 つだけの最小の公開面。契約の中身は本 test の対象ではない。 */
function minimalSource(name) {
  return [
    '/** 最小の公開面。 */',
    `export interface ${name}Options {`,
    '  /** 表示名。 */',
    '  label: string;',
    '}',
    '',
    `export function create${name}(options: ${name}Options): string {`,
    '  return options.label;',
    '}',
    '',
  ].join('\n');
}

/**
 * 生成 script が動く最小の checkout を組み立てる。script は自分の位置から
 * repositoryRoot を決めるので、fixture 側の scripts/ へ複製して起動する。
 *
 * node_modules は repo のものへ link する。api-reference 側は TypeScript を
 * 読み込み、program には typescript が持つ lib の宣言 file が必ず入る。
 * link しないと `import ts from 'typescript'` が解決できず、解決できたとしても
 * lib の実体が許可 root の外になって全 case が「repo の外を読んだ」 で落ちる。
 * link すると許可 root は repo の node_modules の実体になり、実 repo と同じ判定になる。
 */
function withFixture(body, packageNames = ['alpha']) {
  // 作成自体を try の中へ入れる。2 つ目の作成が失敗すると 1 つ目が残るため。
  let root;
  let outside;
  try {
    // /tmp は macOS で /private/tmp への symlink なので、canonical にしないと
    // root 判定が全て外れる。
    root = realpathSync(mkdtempSync(join(tmpdir(), 'docs-api-reference-')));
    // repo の外に置く細工用の領域。fixture root の内側に作ると「外」 にならない。
    // 名前に outside を含めない。stderr の照合が dir 名に引っかかると、
    // 別の理由で落ちた実行まで「境界を検出した」 と読めてしまう。
    outside = realpathSync(mkdtempSync(join(tmpdir(), 'docs-api-reference-external-')));

    mkdirSync(join(root, 'scripts'), { recursive: true });
    for (const file of [
      'docs-sync-safety.mjs',
      'docs-api-pages.mjs',
      'sync-library-api-reference.mjs',
    ]) {
      copyFileSync(join(scriptsDirectory, file), join(root, 'scripts', file));
    }
    symlinkSync(realpathSync(join(repositoryRoot, 'node_modules')), join(root, 'node_modules'), 'dir');

    const packages = {};
    for (const name of packageNames) {
      const packageDirectory = join(root, 'packages', name);
      mkdirSync(join(packageDirectory, 'src'), { recursive: true });
      writeFileSync(
        join(packageDirectory, 'package.json'),
        `${JSON.stringify({ name: `@kiwa-lab/${name}`, version: '0.0.0', type: 'module' }, null, 2)}\n`,
      );
      writeFileSync(join(packageDirectory, 'src', 'index.ts'), minimalSource(capitalize(name)));

      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', name);
      mkdirSync(docsDirectory, { recursive: true });
      const referencePath = join(docsDirectory, 'reference.md');
      writeFileSync(referencePath, referenceBody());

      packages[name] = { packageDirectory, docsDirectory, referencePath };
    }

    const first = packages[packageNames[0]];
    return body({
      root,
      outside,
      packages,
      packageDirectory: first.packageDirectory,
      docsDirectory: first.docsDirectory,
      referencePath: first.referencePath,
    });
  } finally {
    // 片方の削除が例外になっても、もう片方は消す。
    try {
      if (root !== undefined) rmSync(root, { recursive: true, force: true });
    } finally {
      if (outside !== undefined) rmSync(outside, { recursive: true, force: true });
    }
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** fixture の中で生成 script を起動する。 */
function runSync(root, { write = true } = {}) {
  return spawnSync(
    process.execPath,
    [join(root, 'scripts', 'sync-library-api-reference.mjs'), ...(write ? ['--write'] : [])],
    { encoding: 'utf8' },
  );
}

test('a healthy checkout is generated and exits 0', () => {
  withFixture(({ root, referencePath, docsDirectory }) => {
    const result = runSync(root);
    assert.equal(result.status, 0, result.stderr);

    const reference = readFileSync(referencePath, 'utf8');
    assert.equal((reference.match(/kiwa-public-api:start/g) ?? []).length, 1, 'exactly one managed block');
    assert.equal((reference.match(/kiwa-public-api:end/g) ?? []).length, 1);
    assert.match(reference, /この節は生成対象ではない/, 'the hand written section survives');
    // reference.md は目次で、宣言元ごとの件数と分割ページへの link を持つ。
    assert.match(reference, /\[index\.ts\]\(\.\/api\/index\)/, 'the split page is linked');

    // 記号そのものは分割ページ側にある。
    const unitPage = join(docsDirectory, 'api', 'index.md');
    assert.ok(existsSync(unitPage), 'the split page is written');
    assert.match(readFileSync(unitPage, 'utf8'), /createAlpha/, 'the public surface reaches the page');
  });
});

test('running twice leaves the reference identical', () => {
  withFixture(({ root, referencePath }) => {
    assert.equal(runSync(root).status, 0);
    const first = readFileSync(referencePath, 'utf8');
    assert.equal(runSync(root).status, 0);
    assert.equal(readFileSync(referencePath, 'utf8'), first);
  });
});

// 目印の壊れ方。以前はいずれも黙って「修復」 され、その過程で手書きの本文を
// 巻き込む余地があった。書かずに落ちることを確かめる。
const brokenShapes = [
  {
    name: 'only the end marker',
    body: () => `# reference\n\n${END}\n\n${HAND_WRITTEN}`,
    reason: /found 0 start marker and 1 end marker/,
  },
  {
    name: 'only the start marker',
    body: () => `# reference\n\n${START}\n\n${HAND_WRITTEN}`,
    reason: /found 1 start marker and 0 end marker/,
  },
  {
    name: 'duplicated markers',
    body: () => `# reference\n\n${START}\n${END}\n${START}\n${END}\n\n${HAND_WRITTEN}`,
    reason: /found 2 start marker and 2 end marker/,
  },
  {
    name: 'markers in the wrong order',
    body: () => `# reference\n\n${END}\n${START}\n\n${HAND_WRITTEN}`,
    reason: /the end marker appears before the start marker/,
  },
];

for (const shape of brokenShapes) {
  test(`a reference.md with ${shape.name} is rejected without being written`, () => {
    withFixture(({ root, referencePath }) => {
      const before = shape.body();
      writeFileSync(referencePath, before);

      const result = runSync(root);

      assert.notEqual(result.status, 0, 'the run must not report success');
      // 理由まで見ないと、別の原因で落ちた実行も「拒否できている」と読めてしまう。
      assert.match(result.stderr, shape.reason, 'the reason names the marker problem');
      assert.equal(readFileSync(referencePath, 'utf8'), before, 'the file is left untouched');
    });
  });
}

test('a reference.md that is a symlink out of the repository is refused', () => {
  withFixture(({ root, outside, referencePath }) => {
    const target = join(outside, 'stolen.md');
    const before = '# 外の file\n\nこの内容は変わってはいけない。\n';
    writeFileSync(target, before);
    rmSync(referencePath);
    symlinkSync(target, referencePath);

    const result = runSync(root);

    assert.notEqual(result.status, 0, 'the run must not report success');
    assert.match(result.stderr, /resolves to .* which is outside/, 'the reason names the boundary');
    assert.equal(readFileSync(target, 'utf8'), before, 'the link target is untouched');
  });
});

test('an import that leaves the repository is refused', () => {
  withFixture(({ root, outside, packageDirectory, referencePath }) => {
    const before = readFileSync(referencePath, 'utf8');
    // 解決に成功する必要がある。存在しない path だと module 解決の失敗として
    // 先に落ち、repo の外を読んだかどうかの判定まで到達しない。
    writeFileSync(
      join(outside, 'leaked.ts'),
      '/** 外にある宣言。 */\nexport interface Leaked {\n  secret: string;\n}\n',
    );
    writeFileSync(
      join(packageDirectory, 'src', 'index.ts'),
      `export type { Leaked } from '${join(outside, 'leaked.js')}';\n`,
    );

    const result = runSync(root);

    assert.notEqual(result.status, 0, 'the run must not report success');
    // guard 固有の文言で照合する。`outside` だけを見ると、module 解決に失敗した
    // 実行や、path に outside を含む dir 名まで一致してしまう。
    assert.match(result.stderr, COMPILER_READ_OUTSIDE, 'the compiler boundary guard fired');
    assert.doesNotMatch(
      result.stderr,
      /Module resolution failed/,
      'the import must resolve, otherwise the boundary guard is never reached',
    );
    assert.equal(readFileSync(referencePath, 'utf8'), before, 'the reference is left untouched');
  });
});

test('a declaration that only claims to live in node_modules is refused', () => {
  withFixture(({ root, outside, packageDirectory, referencePath }) => {
    const before = readFileSync(referencePath, 'utf8');
    // 実体は repo の外。名乗りの path にだけ node_modules を含める。
    // 文字列一致で先に除外していると、この形が検証を素通りする。
    const realDeclaration = join(outside, 'pretend.d.ts');
    writeFileSync(realDeclaration, '/** 外にある宣言。 */\nexport interface Pretend {\n  secret: string;\n}\n');

    const fakeStore = join(packageDirectory, 'node_modules', 'pretend');
    mkdirSync(fakeStore, { recursive: true });
    symlinkSync(realDeclaration, join(fakeStore, 'index.d.ts'));

    writeFileSync(
      join(packageDirectory, 'src', 'index.ts'),
      "export type { Pretend } from '../node_modules/pretend/index.js';\n",
    );

    const result = runSync(root);

    assert.notEqual(result.status, 0, 'the run must not report success');
    assert.match(result.stderr, COMPILER_READ_OUTSIDE, 'the compiler boundary guard fired');
    assert.equal(readFileSync(referencePath, 'utf8'), before, 'the reference is left untouched');
  });
});

test('a broken package later in the run leaves the earlier one untouched', () => {
  withFixture(
    ({ root, outside, packages }) => {
      // `collectTargets()` は `readdirSync` の順に処理する。順序は環境依存なので
      // 名前で「先」「後」 を決め打ちすると、逆順の環境では先頭側が未処理のまま
      // test が通ってしまう。実際の列挙順から決める。
      const category = join(root, 'docs', 'libraries', 'foundation');
      const order = readdirSync(category, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => packages[name] !== undefined);
      assert.ok(order.length >= 2, 'the fixture must enumerate at least two packages');

      const earlier = packages[order[0]];
      const later = packages[order[order.length - 1]];
      const earlierBefore = readFileSync(earlier.referencePath, 'utf8');

      const target = join(outside, 'stolen.md');
      const targetBefore = '# 外の file\n\nこの内容は変わってはいけない。\n';
      writeFileSync(target, targetBefore);
      rmSync(later.referencePath);
      symlinkSync(target, later.referencePath);

      const result = runSync(root);

      assert.notEqual(result.status, 0, 'the run must not report success');
      assert.match(result.stderr, /resolves to .* which is outside/, 'the write-path guard fired');
      assert.equal(
        readFileSync(earlier.referencePath, 'utf8'),
        earlierBefore,
        'the earlier package is not half-written',
      );
      assert.equal(readFileSync(target, 'utf8'), targetBefore, 'the link target is untouched');
    },
    ['alpha', 'omega'],
  );
});

test('the check-only run reports drift without writing', () => {
  withFixture(({ root, referencePath }) => {
    const before = readFileSync(referencePath, 'utf8');

    const result = runSync(root, { write: false });

    assert.notEqual(result.status, 0, 'drift is reported as a failure');
    // 差分の報告であることまで見る。別の理由で非 0 終了した実行と区別する。
    assert.match(result.stderr, /Generated API references are out of date/, 'drift is the reason');
    assert.equal(readFileSync(referencePath, 'utf8'), before, 'nothing is written without --write');
  });
});
