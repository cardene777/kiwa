// sync-library-doc-links.mjs を実際に起動して、壊れた入力と細工された checkout で
// 書き込まずに非 0 で終わることを確かめる。
//
// 単体 test (docs-sync-safety.test.mjs) は guard 関数の振る舞いを押さえるが、
// guard が script に配線されていなければ通ってしまう。ここでは fixture の checkout を
// 組み立てて script を子 process として起動し、exit code と file の中身の両方を見る。
//
//   node --test scripts/docs-sync-integration.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deadDocumentLinks } from './docs-link-check.mjs';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const START = '<!-- kiwa-docs:start -->';
const END = '<!-- kiwa-docs:end -->';
const HAND_WRITTEN = '## 手書き\n\nこの節は生成対象ではない。\n';

/**
 * 生成 script が動く最小の checkout を組み立てる。script は自分の位置から
 * repositoryRoot を決めるので、fixture 側の scripts/ へ複製して起動する。
 */
function withFixture(body, packageNames = ['sample']) {
  // /tmp は macOS で /private/tmp への symlink なので、canonical にしないと
  // root 判定が全て外れる。
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'docs-sync-integration-')));
  try {
    mkdirSync(join(root, 'scripts'), { recursive: true });
    for (const file of ['docs-sync-safety.mjs', 'docs-link-check.mjs', 'sync-library-doc-links.mjs']) {
      copyFileSync(join(scriptsDirectory, file), join(root, 'scripts', file));
    }

    const packages = {};
    for (const name of packageNames) {
      const packageDirectory = join(root, 'packages', name);
      mkdirSync(packageDirectory, { recursive: true });
      writeFileSync(
        join(packageDirectory, 'package.json'),
        `${JSON.stringify({ name: `@kiwa-lab/${name}`, version: '0.0.0' }, null, 2)}\n`,
      );

      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', name);
      mkdirSync(docsDirectory, { recursive: true });
      for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
        writeFileSync(join(docsDirectory, page), `# ${page}\n`);
      }

      packages[name] = { packageDirectory, readmePath: join(packageDirectory, 'README.md') };
    }

    const first = packages[packageNames[0]];
    return body({
      root,
      packages,
      packageDirectory: first.packageDirectory,
      readmePath: first.readmePath,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** fixture の中で生成 script を起動する。--write を渡すので、通れば file が変わる。 */
function runSync(root) {
  return spawnSync(process.execPath, [join(root, 'scripts', 'sync-library-doc-links.mjs'), '--write'], {
    encoding: 'utf8',
  });
}

test('a healthy checkout is synchronized and exits 0', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const result = runSync(root);
    assert.equal(result.status, 0, result.stderr);
    const readme = readFileSync(readmePath, 'utf8');
    assert.match(readme, /kiwa-docs:start/);
    assert.match(readme, /kiwa-docs:end/);
    assert.match(readme, /この節は生成対象ではない/, 'the hand written section survives');
  });
});

// 生成済みの README をもう一度通しても内容が動かないこと。ブロックが 1 回の実行で
// 1 個ずつ増える壊れ方は、ここが動くかどうかで表に出る。
test('running twice leaves the file identical', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    assert.equal(runSync(root).status, 0);
    const first = readFileSync(readmePath, 'utf8');
    assert.equal(runSync(root).status, 0);
    assert.equal(readFileSync(readmePath, 'utf8'), first);
    assert.equal((first.match(/kiwa-docs:start/g) ?? []).length, 1, 'exactly one managed block');
  });
});

// Issue が挙げた 3 つの壊れ方。いずれも以前は黙って「修復」され、その過程で
// 手書きの本文を巻き込んでいた。
const brokenShapes = [
  {
    name: 'only the end marker',
    // 実行のたびにブロックが 1 個ずつ増えていた形。
    content: `# @kiwa-lab/sample\n\n${HAND_WRITTEN}\n${END}\n`,
    expected: /0 start marker and 1 end marker/,
  },
  {
    name: 'only the start marker',
    // 2 回目の実行で start marker 以降の本文を丸ごと失っていた形。
    content: `# @kiwa-lab/sample\n\n${START}\n\n${HAND_WRITTEN}`,
    expected: /1 start marker and 0 end marker/,
  },
  {
    name: 'duplicated markers',
    // 正規 marker より前の stray marker との間にある本文が消えていた形。
    content: `${START}\nstray\n${END}\n\n${HAND_WRITTEN}\n${START}\nreal\n${END}\n`,
    expected: /2 start marker and 2 end marker/,
  },
];

for (const shape of brokenShapes) {
  test(`a README with ${shape.name} is rejected without being written`, () => {
    withFixture(({ root, readmePath }) => {
      writeFileSync(readmePath, shape.content);
      const result = runSync(root);
      assert.notEqual(result.status, 0, 'the script must not report success');
      assert.match(result.stderr, shape.expected);
      assert.equal(readFileSync(readmePath, 'utf8'), shape.content, 'the file is untouched');
    });
  });
}

test('a README whose markers are in the wrong order is rejected without being written', () => {
  withFixture(({ root, readmePath }) => {
    const content = `${END}\n${HAND_WRITTEN}\n${START}\n`;
    writeFileSync(readmePath, content);
    const result = runSync(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /before the start marker/);
    assert.equal(readFileSync(readmePath, 'utf8'), content);
  });
});

// 検証と書き込みを package ごとに交互に行うと、後ろの package が壊れていた時に
// 前の package だけ更新された生成物が残る。全件の検証を通ってから書く。
test('a broken package later in the run leaves the earlier ones untouched', () => {
  withFixture(
    ({ root, packages }) => {
      const healthy = packages['aaa-first'];
      const broken = packages['zzz-last'];
      const healthyBefore = `# @kiwa-lab/aaa-first\n\n${HAND_WRITTEN}`;
      writeFileSync(healthy.readmePath, healthyBefore);
      // 走査は package 名の順に進むので、壊すのは後ろ側。
      writeFileSync(broken.readmePath, `# @kiwa-lab/zzz-last\n\n${HAND_WRITTEN}\n${END}\n`);

      const result = runSync(root);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /0 start marker and 1 end marker/);
      assert.equal(
        readFileSync(healthy.readmePath, 'utf8'),
        healthyBefore,
        'the healthy package was not written',
      );
      assert.equal(existsSync(join(healthy.packageDirectory, 'docs', 'README.md')), false);
    },
    ['aaa-first', 'zzz-last'],
  );
});

// 壊れた目印だけでなく、書き込み先の検証も第 1 段で行う。write loop に残すと
// 後ろの package が link だった時に先行 package だけ更新された状態で止まる。
test('a symlinked target later in the run leaves the earlier ones untouched', () => {
  withFixture(
    ({ root, packages }) => {
      const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-sync-outside-')));
      try {
        const healthy = packages['aaa-first'];
        const broken = packages['zzz-last'];
        const healthyBefore = `# @kiwa-lab/aaa-first\n\n${HAND_WRITTEN}`;
        writeFileSync(healthy.readmePath, healthyBefore);

        const outside = join(outsideDirectory, 'victim.md');
        writeFileSync(outside, 'original');
        symlinkSync(outside, broken.readmePath);

        const result = runSync(root);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /symlink|outside/);
        assert.equal(readFileSync(outside, 'utf8'), 'original', 'the file outside is intact');
        assert.equal(
          readFileSync(healthy.readmePath, 'utf8'),
          healthyBefore,
          'the healthy package was not written',
        );
      } finally {
        rmSync(outsideDirectory, { recursive: true, force: true });
      }
    },
    ['aaa-first', 'zzz-last'],
  );
});

// 既定が書き込みだと、生成物を commit し忘れても手元の build が黙って修復するので、
// repo の内容と公開される内容が分岐する。名前に `:write` が付くものだけが更新する。
test('the default run reports drift without writing, and --write updates', () => {
  withFixture(({ root, readmePath }) => {
    const before = `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`;
    writeFileSync(readmePath, before);

    const checked = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(checked.status, 0, 'drift must be reported');
    assert.match(checked.stderr, /out of date/);
    assert.equal(readFileSync(readmePath, 'utf8'), before, 'the file was not written');

    const written = runSync(root);
    assert.equal(written.status, 0, written.stderr);
    assert.match(readFileSync(readmePath, 'utf8'), /kiwa-docs:start/);

    // 書いた後は検査が通る。
    const rechecked = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.equal(rechecked.status, 0, rechecked.stderr);
  });
});

// package を消す PR が索引の link を残す壊れ方。managed block の外は手書きなので、
// 生成の同期だけを見ていると通ってしまう (#1803 と #1873 が同じ形で通った)。
test('an index link to a directory that does not exist is reported', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    assert.equal(runSync(root).status, 0, 'the fixture starts clean');

    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(indexPath, '# sample\n\n消した package は [gone](./gone/) を参照。\n');

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, 'a dead link must be reported');
    assert.match(result.stderr, /dead link: docs\/libraries\/foundation\/sample\/index\.md -> \.\/gone\//);
  });
});

// 解決規則は VitePress に合わせる。拡張子なしの link と directory link の両方が
// 通らないと、既存 docs の大半が偽の dead link になる。
test('links resolve through <path>.md and <path>/index.md', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);

    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    mkdirSync(join(docsDirectory, 'nested'), { recursive: true });
    writeFileSync(join(docsDirectory, 'nested', 'index.md'), '# nested\n');
    writeFileSync(
      join(docsDirectory, 'index.md'),
      '# sample\n\n[拡張子なし](./quickstart) と [directory](./nested/) を辿る。\n',
    );

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs'), '--write'],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
  });
});

// 1 記法だけを見ていると、別記法で書いた壊れた link がそのまま通る。実測で 4 形が
// 素通りしていた (title 付き / angle-bracket / reference 定義 / 生 HTML の a タグ)。
for (const [label, markdown] of [
  ['title 付き inline', '[x](./gone/ "題")'],
  ['angle-bracket', '[x](<./gone/>)'],
  ['reference 定義', '[x]: ./gone/'],
  ['生 HTML の a タグ', '<a href="./gone/">x</a>'],
  ['image', '![x](./gone.png)'],
]) {
  test(`a dead link written as ${label} is reported`, () => {
    withFixture(({ root, readmePath }) => {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
      writeFileSync(indexPath, `# sample\n\n${markdown}\n`);

      const result = spawnSync(
        process.execPath,
        [join(root, 'scripts', 'sync-library-doc-links.mjs')],
        { encoding: 'utf8' },
      );
      assert.notEqual(result.status, 0, `${label} must be reported`);
      assert.match(result.stderr, /dead link/);
    });
  });
}

// code block の中の type 注釈は link ではない。落とさないと API reference が
// 丸ごと誤検出になる (`[k: string]: unknown;` が reference 定義と同じ形)。
test('type annotations inside code fences are not links', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(
      indexPath,
      '# sample\n\n```ts\ntype R = {\n  [k: string]: unknown;\n};\n```\n\n`[k: string]: unknown;` も同じ。\n',
    );

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs'), '--write'],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
  });
});

// site 絶対 path は docs/ を根に解く。相対 link だけを見ていると、同じ壊れ方が
// 別記法で通る (実測で docs/libraries に 1 件現存していた)。
test('a site absolute link is resolved against docs/', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');

    writeFileSync(indexPath, '# sample\n\n[生きている](/libraries/foundation/sample/)\n');
    assert.equal(runSync(root).status, 0, '実在する site 絶対 link は通る');

    writeFileSync(indexPath, '# sample\n\n[消えた](/libraries/foundation/gone/)\n');
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, '壊れた site 絶対 link は報告される');
    assert.match(result.stderr, /libraries\/foundation\/gone/);
  });
});

// macOS の APFS は既定で case-insensitive なので、existsSync は大小文字違いを通す。
// 公開先は case-sensitive なため、手元で通って公開後に 404 になる。
test('a link whose case does not match the real file is reported', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(indexPath, '# sample\n\n[大文字](./Quickstart)\n');

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, 'case 違いは報告される');
    assert.match(result.stderr, /Quickstart/);
  });
});

// directory が在るだけでは解決しない。index.md が無い directory への link は
// 公開後 404 になる。
test('a directory without index.md is reported', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    mkdirSync(join(docsDirectory, 'empty'), { recursive: true });
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[空](./empty/)\n');

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, 'index.md の無い directory は報告される');
    assert.match(result.stderr, /empty/);
  });
});

// docs/ の外へ出る link は公開されない。percent encode した `..` で境界を越える形も
// 同じ経路で塞ぐ。
test('a link that escapes docs/ is reported even when the target exists', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    // 上り 4 段で repo root に出る。実在する file を指すので、境界検査が無ければ通る。
    const escape = '%2e%2e/%2e%2e/%2e%2e/%2e%2e/packages/sample/package.json';
    assert.equal(
      existsSync(join(root, 'packages', 'sample', 'package.json')),
      true,
      '境界検査だけが落とす形にするため、target は実在していること',
    );
    writeFileSync(indexPath, `# sample\n\n[外](${escape})\n`);

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, 'docs/ の外は実在しても報告される');
    assert.match(result.stderr, /dead link/);
  });
});

// 検査が実 checkout を走査しなければ、fixture が全て通っても main は壊れたまま入る。
// docs:gen:test は pnpm test に含まれるので、ここに置くと標準 sweep で走る。
test('the real docs/libraries tree has no dead links', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const dead = deadDocumentLinks({
    repositoryRoot,
    docsRoot: join(repositoryRoot, 'docs'),
    scanRoot: join(repositoryRoot, 'docs', 'libraries'),
  });
  assert.deepEqual(dead, [], dead.join('\n'));
});

// 切れた link がある間は 1 file も書かない。生成物の同期だけ先に進むと、
// 壊れた索引を抱えたまま README が更新され、破れが表に出るのが遅れる。
test('a dead link stops --write before anything is generated', () => {
  withFixture(({ root, readmePath }) => {
    const before = `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`;
    writeFileSync(readmePath, before);

    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(indexPath, '# sample\n\n[gone](./gone/)\n');

    const result = runSync(root);
    assert.notEqual(result.status, 0, 'a dead link must stop the write');
    assert.equal(readFileSync(readmePath, 'utf8'), before, 'the README was not written');
  });
});

// 細工された checkout。writeFileSync は link を追うので、guard が無ければ
// 生成 script は repo の外の file を書き換える。
test('a README that is a symlink out of the repository is refused', () => {
  withFixture(({ root, packageDirectory, readmePath }) => {
    const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-sync-outside-')));
    try {
      const outside = join(outsideDirectory, 'victim.md');
      writeFileSync(outside, 'original');
      symlinkSync(outside, readmePath);

      const result = runSync(root);
      assert.notEqual(result.status, 0, 'the script must not report success');
      assert.match(result.stderr, /symlink|outside/);
      assert.equal(readFileSync(outside, 'utf8'), 'original', 'the file outside the repo is intact');
      assert.equal(packageDirectory.startsWith(root), true);
    } finally {
      rmSync(outsideDirectory, { recursive: true, force: true });
    }
  });
});

// 書き込み先の directory 自体が外を指す場合。atomic rename は link の先の
// directory へ file を作ってしまう。
test('a docs directory that is a symlink out of the repository is refused', () => {
  withFixture(({ root, packageDirectory, readmePath }) => {
    const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-sync-outside-')));
    try {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n`);
      symlinkSync(outsideDirectory, join(packageDirectory, 'docs'));

      const result = runSync(root);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /outside/);
      assert.equal(
        existsSync(join(outsideDirectory, 'README.md')),
        false,
        'nothing was written outside the repository',
      );
    } finally {
      rmSync(outsideDirectory, { recursive: true, force: true });
    }
  });
});
