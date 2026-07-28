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
    for (const file of ['docs-sync-safety.mjs', 'sync-library-doc-links.mjs']) {
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
