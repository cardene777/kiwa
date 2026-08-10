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
  linkSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LINK_FAILURE,
  classifyDocumentLinks,
  deadDocumentLinks,
  unsupportedLinkSyntax,
} from './docs-link-check.mjs';

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

/**
 * 生成先の宣言を受け付ける root (`docs/api`) を作って返す。
 *
 * checker は任意の場所の `.gitignore` を信じない = 宣言できるのは generator が
 * 書き出す root だけ。生成物判定の test はここに fixture を置く。
 */
function generatedRoot(root) {
  const directory = join(root, 'docs', 'api');
  mkdirSync(directory, { recursive: true });
  return directory;
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
  ['angle-bracket', '[x](<./gone/>)'],
  ['img の src', '<img src="./gone.png" alt="x">'],
  ['引用符なしの img src', '<img src=./gone.png alt="x">'],
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

// 属性名の境界が緩いと、link ではない属性値を dead link として報告し、正当な docs を
// 止める。`data-src` は `src` ではない。
test('a data-src attribute is not treated as a link', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    mkdirSync(join(root, 'docs', 'public', 'images'), { recursive: true });
    writeFileSync(join(root, 'docs', 'public', 'images', 'ok.png'), 'png');
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(
      indexPath,
      '# sample\n\n<img data-src="./gone.png" src="/images/ok.png" alt="x">\n',
    );

    assert.equal(runSync(root).status, 0);
  });
});

// 引用符の中の `>` は tag の終端ではない。終端とみなすと、後続の src を読まずに
// 走査が止まり、実在する dead link を見逃す。
test('a quoted attribute containing > does not hide the src that follows', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(indexPath, '# sample\n\n<img alt="a>b" src="./gone.png">\n');

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, '後続の src は読まれる');
    assert.match(result.stderr, /gone/);
  });
});

// 解析範囲を絞った代償を機械で見える形にする。未対応の記法が書かれたら、検査できない
// ことを報告して止める。黙って素通りさせない。
//
// 未対応の形を列挙せず、extractor が消費できなかった link 形を残余で拾う。列挙すると
// 書き方が 1 つ増えるたびに穴が開く (title の空白位置違いと引用区間を跨ぐ `<a>` が
// 実測で両方とも漏れた)。
for (const [label, markdown] of [
  ['title 付き inline link (二重引用)', '[x](./real "題")'],
  ['title 付き inline link (単引用)', "[x](./real '題')"],
  ['title 付き inline link (括弧)', '[x](./real (題))'],
  ['開き括弧の後に空白がある title 付き', '[x]( ./real "題")'],
  ['reference 定義', '[x]: ./real'],
  ['reference 定義 (title 付き)', '[x]: ./real "題"'],
  ['生 HTML の a タグ', '<a href="./real">x</a>'],
  ['生 HTML の a タグ (引用符なし)', '<a href=./real>x</a>'],
  ['生 HTML の a タグ (属性値に > を含む)', '<a title="a>b" href=./real>x</a>'],
  // VitePress は markdown 中の Vue 記法を解釈し、いずれも `<a href="...">` に render
  // する。destination が式なので静的には解けず、素通りすると `index.md` の無い dir への
  // 404 が全 test 通過で main に入る。
  ['Vue の :href 短縮形', `<a :href="'./real'">x</a>`],
  ['Vue の v-bind:href', `<a v-bind:href="'./real'">x</a>`],
  ['Vue の :href (属性順が逆)', '<a class="k" :href="url">x</a>'],
  ['component の is', '<component is="a" href="./real">x</component>'],
  ['component の :is', '<component :is="tag" href="./real">x</component>'],
  // 属性名が実行時に決まる形。href になりうるので解析できない。
  ['Vue の dynamic argument', `<a :[attr]="'./real'">x</a>`],
  // 属性値の中に `>` があっても tag の終端を取り違えず、後続の bound href に届く。
  ['引用属性の > より後ろの bound href', `<a title="a>b" :href="'./real'">x</a>`],
]) {
  test(`${label} is reported as unsupported syntax`, () => {
    withFixture(({ root, readmePath }) => {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
      writeFileSync(join(docsDirectory, 'real.md'), '# real\n');
      // 解決先は実在する。落ちる理由が「解決しない」 ではなく「解析できない」 こと。
      writeFileSync(join(docsDirectory, 'index.md'), `# sample\n\n${markdown}\n`);

      const result = spawnSync(
        process.execPath,
        [join(root, 'scripts', 'sync-library-doc-links.mjs')],
        { encoding: 'utf8' },
      );
      assert.notEqual(result.status, 0, `${label} は未対応として報告される`);
      assert.match(result.stderr, /unsupported link syntax/);
    });
  });
}

// 同じ 1 件を 2 つの理由で報告しない。素の `<a href>` は「生 HTML の a タグ」 が
// 覆っており、Vue 判定でも拾うと stderr に同じ file が 2 行出る。
test('a plain anchor is reported once, not by two rules', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    writeFileSync(join(docsDirectory, 'real.md'), '# real\n');
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n<a href="./real">x</a>\n');

    const found = unsupportedLinkSyntax({
      repositoryRoot: root,
      scanRoot: join(root, 'docs', 'libraries'),
    });
    assert.equal(found.length, 1, found.join('\n'));
    assert.match(found[0], /生 HTML の a タグ/);
  });
});

// 属性値の中の `:href=` は属性ではない。属性名だけを拾う形にすると値の中を除外
// できず、空白を境界にしても防げない (`title="see :href=y"` で実測、誤検知した)。
// 値を引用区間ごと食う形にして初めて外れる。
for (const [label, markdown] of [
  ['引用符の直後に密着', '<a title=":href=x" href="./real">y</a>'],
  ['値の中に空白を挟む', '<a title="see :href=y" href="./real">z</a>'],
]) {
  test(`a colon-prefixed string inside an attribute value is not a binding (${label})`, () => {
    withFixture(({ root, readmePath }) => {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
      writeFileSync(join(docsDirectory, 'real.md'), '# real\n');
      writeFileSync(join(docsDirectory, 'index.md'), `# sample\n\n${markdown}\n`);

      const found = unsupportedLinkSyntax({
        repositoryRoot: root,
        scanRoot: join(root, 'docs', 'libraries'),
      });
      // 「生 HTML の a タグ」 だけが出る。Vue 判定は反応しない。
      assert.equal(found.length, 1, found.join('\n'));
      assert.match(found[0], /生 HTML の a タグ/);
    });
  });
}

// `component` の属性値に `:is=` を含む形。a タグと違い「生 HTML の a タグ」 判定が
// 無いので、誤検知すると報告が 0 件から 1 件に変わる。
test('a colon-prefixed string inside a component attribute value is not a binding', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    writeFileSync(join(docsDirectory, 'real.md'), '# real\n');
    writeFileSync(
      join(docsDirectory, 'index.md'),
      '# sample\n\n<component alt="see :is=b" href="./real">z</component>\n',
    );

    const found = unsupportedLinkSyntax({
      repositoryRoot: root,
      scanRoot: join(root, 'docs', 'libraries'),
    });
    assert.deepEqual(found, [], found.join('\n'));
  });
});

// 逆向き。正当な記述を未対応と誤判定すると、書けるはずの docs が書けなくなる。
for (const [label, markdown] of [
  ['素の inline link', '[x](./real)'],
  ['括弧の内側に空白がある inline link', '[x]( ./real )'],
  ['angle-bracket destination', '[x](<./real>)'],
  ['reference 風の普通の文', '[note]: this is ordinary prose'],
  ['a で始まる別 tag', '<abbr title="x">y</abbr>'],
  ['href を持たない a タグ', '<a name="anchor"></a>'],
  // 属性名を部分一致で見ると data-href を href として拾い、link ではない属性値で
  // 正当な docs を止める。
  ['a タグの data-href', '<a data-href="./x">y</a>'],
  ['img の data-href', '<img data-href="./x" src="/images/ok.png" alt="x">'],
  // `is` を含む別の属性名。属性名の前に空白を要求しないと巻き込む。
  ['img の data-island', '<img data-island="a" src="/images/ok.png" alt="x">'],
  // 本文に `:href` という語が出るだけの文。tag の中にないものは対象外。
  ['本文中の :href という語', 'CSS の :href 疑似クラスについて'],
]) {
  test(`${label} is not reported as unsupported syntax`, () => {
    withFixture(({ root, readmePath }) => {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      mkdirSync(join(root, 'docs', 'public', 'images'), { recursive: true });
      writeFileSync(join(root, 'docs', 'public', 'images', 'ok.png'), 'png');
      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
      writeFileSync(join(docsDirectory, 'real.md'), '# real\n');
      writeFileSync(join(docsDirectory, 'index.md'), `# sample\n\n${markdown}\n`);

      const result = runSync(root);
      assert.equal(result.status, 0, result.stderr);
    });
  });
}

// 括弧の内側の空白は CommonMark で正当なので、destination は取れていなければならない。
// 「未対応と報告しない」 だけでは、黙って検査を飛ばす形と区別が付かない。
test('a link with spaces inside the parentheses is still resolved', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(indexPath, '# sample\n\n[x]( ./gone )\n');

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, '壊れていれば dead として報告される');
    assert.match(result.stderr, /dead link/);
  });
});

// 未対応記法の検出も code block の中を見ない。見ると API reference が丸ごと落ちる。
test('unsupported syntax inside a code fence is ignored', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(
      indexPath,
      ['# sample', '', '```html', '<a href="./x">y</a>', '```', '', '```ts', 'type R = {', '  [k: string]: unknown;', '};', '```', ''].join('\n'),
    );

    assert.equal(runSync(root).status, 0);
  });
});

// 実 checkout に未対応記法が無いことを標準 sweep で確かめる。現れたら検査を広げるか
// 記法を直すかを選ぶ。
test('the real docs/libraries tree uses no unsupported link syntax', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const found = unsupportedLinkSyntax({
    repositoryRoot,
    scanRoot: join(repositoryRoot, 'docs', 'libraries'),
  });
  assert.deepEqual(found, [], found.join('\n'));
});

// CommonMark では 4 space 字下げの ``` は fence ではない。開始とみなすと、後続の
// 本物の fence と対にされて間の正当な link が消える (dead link を見逃す向きの壊れ方)。
test('an indented pseudo fence does not swallow links that follow it', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const indexPath = join(root, 'docs', 'libraries', 'foundation', 'sample', 'index.md');
    writeFileSync(
      indexPath,
      ['# sample', '', '    ```', '', '[消えた](./gone/)', '', '```ts', 'const a = 1;', '```', ''].join('\n'),
    );

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, '字下げ ``` の後ろの dead link は報告される');
    assert.match(result.stderr, /gone/);
  });
});

// repo 内の symlink (docs/public/images) は実在の構成なので通す。repo の外を指す
// symlink は readdirSync と statSync が追ってしまうため、実体を見て落とす。
test('a symlink pointing outside the repository does not resolve', () => {
  withFixture(({ root, readmePath }) => {
    const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-link-outside-')));
    try {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      writeFileSync(join(outsideDirectory, 'victim.md'), '# victim\n');

      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
      symlinkSync(outsideDirectory, join(docsDirectory, 'outside'));
      writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[外](./outside/victim)\n');

      const result = spawnSync(
        process.execPath,
        [join(root, 'scripts', 'sync-library-doc-links.mjs')],
        { encoding: 'utf8' },
      );
      assert.notEqual(result.status, 0, 'repo 外への symlink は解決しない');
      assert.match(result.stderr, /victim/);
    } finally {
      rmSync(outsideDirectory, { recursive: true, force: true });
    }
  });
});

// repo 内を指す symlink は通す。落とすと docs/public/images 経由の参照が全て
// 偽陽性になる。
test('a symlink that stays inside the repository resolves', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);

    const assets = join(root, 'assets');
    mkdirSync(assets, { recursive: true });
    writeFileSync(join(assets, 'note.md'), '# note\n');

    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    symlinkSync(assets, join(docsDirectory, 'linked'));
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[中](./linked/note)\n');

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

    // VitePress は docs/public/ の中身を site root へ出す。docs/ 直下だけを見ると
    // 画像への site 絶対 link が全て偽陽性になる。
    mkdirSync(join(root, 'docs', 'public', 'images'), { recursive: true });
    writeFileSync(join(root, 'docs', 'public', 'images', 'x.png'), 'png');
    writeFileSync(indexPath, '# sample\n\n<img src="/images/x.png" alt="x">\n');
    assert.equal(runSync(root).status, 0, 'public/ 経由の site 絶対 link は通る');

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

// `docs/libraries` の外はまだ `pnpm docs:links` の走査範囲に入っていない (#1877)。
// 範囲を広げるには「GitHub 前提の doc か公開 site 前提か」 の境界を決める必要があり、
// それを待つ間も **参照先が repo のどこにも無い link** だけは再発させない。
//
// 分類は checker 側が返す (`LINK_FAILURE`)。ここで `existsSync` を使って判定し直すと、
// checker が持つ大文字小文字の厳密判定と repo 境界がその再判定で失われる (実測で
// case 違いの link が「解決する」 と誤判定され、test が見逃した)。
//
// 生成物 (`docs/api/{typescript,solidity}/`) は checker が `.gitignore` を引いて
// `generated` に分ける。ここで target 名を列挙して除外すると、判定材料が実態ではなく
// 人が書いた一覧になり、生成先が増減するたびに手で直すことになる。
test('no link in docs points at a path that exists nowhere in the repository', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const docsRoot = join(repositoryRoot, 'docs');

  const missing = classifyDocumentLinks({ repositoryRoot, docsRoot, scanRoot: docsRoot })
    .filter(({ reason }) => reason === LINK_FAILURE.MISSING)
    .map(({ file, target }) => `${file} -> ${target}`);

  assert.deepEqual(missing, [], missing.join('\n'));
});

// 生成物への link は `generated` に分類され、`missing` には現れない。分類が消えると
// 上の test が 4 件の生成物 link で落ちるため、両方向を 1 つの test で押さえる。
test('links to generated api output are classified as generated', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const docsRoot = join(repositoryRoot, 'docs');

  const generated = classifyDocumentLinks({ repositoryRoot, docsRoot, scanRoot: docsRoot })
    .filter(({ reason }) => reason === LINK_FAILURE.GENERATED)
    .map(({ file, target }) => `${file} -> ${target}`);

  // 実 repo の `docs/api/.gitignore` が持つ 2 entry から 4 件出る。
  assert.deepEqual(generated.sort(), [
    'docs/api/README.md -> ./solidity/',
    'docs/api/README.md -> ./typescript/',
    'docs/api/index.md -> ./solidity/dogfood-foundry-dapp/',
    'docs/api/index.md -> ./typescript/',
  ]);
});

// 生成先かどうかと、実在するかは別。宣言があっても実体があれば通常どおり解決する
// (生成済みの checkout で検査した時に落とさない)。
test('a declared generated directory that actually exists still resolves', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = generatedRoot(root);
    writeFileSync(join(docsDirectory, '.gitignore'), 'built/\n');
    mkdirSync(join(docsDirectory, 'built'), { recursive: true });
    writeFileSync(join(docsDirectory, 'built', 'index.md'), '# built\n');
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[生成済み](./built/)\n');

    const failures = classifyDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs'),
    });
    assert.deepEqual(failures, [], JSON.stringify(failures));
  });
});

// 判定材料は directory の宣言だけ。広い ignore 規則で全ての破れが生成物に化けると、
// `.gitignore` に 1 行足すだけで検査が空洞化する (実測で再現した)。
// link は各規則が「もし採用されたら」 一致する形にする。規則と無関係な link だと
// 判定に届かず、条件を外す変異を素通りさせる (実測で 2 件が捕まらなかった)。
for (const [label, gitignore, target] of [
  ['すべてを無視する規則', '*\n', './gone.md'],
  ['docs 全体を無視する規則', 'docs/\n', './gone.md'],
  ['glob を含む dir 規則', 'gen-*/\n', './gen-out/page'],
  ['file を指す規則', 'gone.md\n', './gone.md'],
  ['否定の規則', '!gone/\n', './gone/page'],
]) {
  test(`a broken link is still missing with ${label}`, () => {
    withFixture(({ root, readmePath }) => {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      const docsDirectory = generatedRoot(root);
      writeFileSync(join(docsDirectory, '.gitignore'), gitignore);
      writeFileSync(join(docsDirectory, 'index.md'), `# sample\n\n[消えた](${target})\n`);

      const failures = classifyDocumentLinks({
        repositoryRoot: root,
        docsRoot: join(root, 'docs'),
        scanRoot: join(root, 'docs'),
      });
      assert.equal(failures.length, 1, JSON.stringify(failures));
      assert.equal(failures[0].reason, LINK_FAILURE.MISSING);
    });
  });
}

// directory 宣言に対する file link は生成物ではない。`built/` は directory だけを
// 指すので、`./built.md` が解決しないのは通常の破れ。
test('a file link is not covered by a directory declaration', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = generatedRoot(root);
    writeFileSync(join(docsDirectory, '.gitignore'), 'built/\n');
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[明示 file](./built.md)\n');

    const failures = classifyDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs'),
    });
    assert.equal(failures.length, 1, JSON.stringify(failures));
    assert.equal(failures[0].reason, LINK_FAILURE.MISSING);
  });
});

// symlink の `.gitignore` は読まない。docs の外に置いた file から生成先を宣言でき、
// 任意の dead link を生成物として隠せる (実測で再現した)。
test('a symlinked gitignore does not declare generated directories', () => {
  withFixture(({ root, readmePath }) => {
    const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-link-outside-')));
    try {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      writeFileSync(join(outsideDirectory, 'evil-gitignore'), 'gone/\n');

      // trusted root に置く。docs/libraries に置くと isTrusted で先に落ち、
      // 目的の guard (symlink の .gitignore 拒否) に届かない。
      const docsDirectory = generatedRoot(root);
      symlinkSync(join(outsideDirectory, 'evil-gitignore'), join(docsDirectory, '.gitignore'));
      writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[消えた](./gone/page)\n');

      const failures = classifyDocumentLinks({
        repositoryRoot: root,
        docsRoot: join(root, 'docs'),
        scanRoot: join(root, 'docs'),
      });
      assert.equal(failures.length, 1, JSON.stringify(failures));
      assert.equal(failures[0].reason, LINK_FAILURE.MISSING);
    } finally {
      rmSync(outsideDirectory, { recursive: true, force: true });
    }
  });
});

// 宣言先が docs/ の外へ出る形は採らない。symlink で外へ向けると、docs の外の path を
// 指す link が生成物として通る (実測で再現した)。
test('a generated declaration pointing outside docs is not honored', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    mkdirSync(join(root, 'secret'), { recursive: true });
    writeFileSync(join(root, 'secret', 'page.md'), '# secret\n');

    // trusted root に置く。docs/libraries に置くと isTrusted で先に落ち、
    // 目的の guard (宣言先の docs 境界) に届かない。
    const docsDirectory = generatedRoot(root);
    symlinkSync(join(root, 'secret'), join(docsDirectory, 'built'));
    writeFileSync(join(docsDirectory, '.gitignore'), 'built/\n');
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[外](./built/gone)\n');

    const failures = classifyDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs'),
    });
    assert.equal(failures.length, 1, JSON.stringify(failures));
    assert.equal(failures[0].reason, LINK_FAILURE.MISSING);
  });
});

// 境界の検証は「解決できる範囲まで実体で確かめる」 形でないと守れない。full path に
// `realpathSync` を 1 度呼ぶだけだと、生成前は失敗が正常なので字面に倒す退路が要り、
// その退路を使って 4 形が素通りする (いずれも実測で再現した)。
for (const [label, build] of [
  [
    '親 symlink が docs の外を指す',
    ({ docsDirectory, outsideDirectory }) => {
      symlinkSync(outsideDirectory, join(docsDirectory, 'wrap'));
      writeFileSync(join(docsDirectory, '.gitignore'), 'wrap/built/\n');
      return './wrap/built/page';
    },
  ],
  [
    'dangling symlink が外を指す',
    ({ docsDirectory, outsideDirectory }) => {
      symlinkSync(join(outsideDirectory, 'nope'), join(docsDirectory, 'built'));
      writeFileSync(join(docsDirectory, '.gitignore'), 'built/\n');
      return './built/page';
    },
  ],
  [
    '循環 symlink',
    ({ docsDirectory }) => {
      symlinkSync(join(docsDirectory, 'loop'), join(docsDirectory, 'loop'));
      writeFileSync(join(docsDirectory, '.gitignore'), 'loop/\n');
      return './loop/page';
    },
  ],
  [
    'hardlink の .gitignore',
    ({ docsDirectory, outsideDirectory }) => {
      writeFileSync(join(outsideDirectory, 'evil'), 'gone/\n');
      linkSync(join(outsideDirectory, 'evil'), join(docsDirectory, '.gitignore'));
      return './gone/page';
    },
  ],
]) {
  test(`a declaration reached through ${label} is not honored`, () => {
    withFixture(({ root, readmePath }) => {
      const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-link-outside-')));
      try {
        writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
        const docsDirectory = generatedRoot(root);
        const target = build({ docsDirectory, outsideDirectory });
        writeFileSync(join(docsDirectory, 'index.md'), `# sample\n\n[link](${target})\n`);

        const failures = classifyDocumentLinks({
          repositoryRoot: root,
          docsRoot: join(root, 'docs'),
          scanRoot: join(root, 'docs'),
        });
        assert.equal(failures.length, 1, JSON.stringify(failures));
        assert.equal(failures[0].reason, LINK_FAILURE.MISSING);
      } finally {
        rmSync(outsideDirectory, { recursive: true, force: true });
      }
    });
  });
}

// 宣言した directory の配下も生成物として扱う。typedoc は tree を丸ごと作るため、
// `docs/api/typescript/index.html` のような深い link も同じ扱いになる。
test('a path under a declared generated directory is generated', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = generatedRoot(root);
    writeFileSync(join(docsDirectory, '.gitignore'), 'built/\n');
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[深い先](./built/nested/page)\n');

    const failures = classifyDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs'),
    });
    assert.equal(failures.length, 1, JSON.stringify(failures));
    assert.equal(failures[0].reason, LINK_FAILURE.GENERATED);
  });
});

// `docs/` の外を相対 link で指すと、公開 site で必ず 404 になる。VitePress は
// `../examples/foo/README.md` を `./../examples/foo/README` に書き換えて出力するが、
// 公開先は docs/ を root とするため `examples/` は存在しない (`ignoreDeadLinks: true`
// のため build も警告を出さない)。GitHub の絶対 URL なら公開 site からも GitHub からも
// 開ける。
test('no link in docs escapes the published tree with a relative path', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const docsRoot = join(repositoryRoot, 'docs');

  const escaping = classifyDocumentLinks({ repositoryRoot, docsRoot, scanRoot: docsRoot })
    .filter(({ reason }) => reason === LINK_FAILURE.OUTSIDE_DOCS)
    .map(({ file, target }) => `${file} -> ${target}`);

  assert.deepEqual(escaping, [], escaping.join('\n'));
});

// dir を指す link は VitePress が `<dir>/index.md` に解決する。`index.md` を持たない
// dir を指すと公開後 404 になる (`docs/announcements/` の各 version dir が該当した)。
// dir が実在することと link が解決することは別で、前者だけ見ると気付けない。
test('no link in docs points at a directory without an index', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const docsRoot = join(repositoryRoot, 'docs');

  const indexless = classifyDocumentLinks({ repositoryRoot, docsRoot, scanRoot: docsRoot })
    .filter(({ reason }) => reason === LINK_FAILURE.DIRECTORY_WITHOUT_INDEX)
    .map(({ file, target }) => `${file} -> ${target}`);

  assert.deepEqual(indexless, [], indexless.join('\n'));
});

// 絶対 URL に置き換えた参照先が repo に実在すること。相対 link と違って checker は
// 外部 URL を検査しないため、置き換えた先が消えても気付けない。自 repo を指す URL に
// 限り、path に解いて実体を確かめる。
test('github blob urls in docs point at paths that exist', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const docsRoot = join(repositoryRoot, 'docs');
  const pattern = /https:\/\/github\.com\/cardene777\/kiwa\/(blob|tree)\/main\/([^)\s"'<>]+)/g;
  const broken = [];

  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      const content = readFileSync(entryPath, 'utf8');
      for (const [, kind, rawPath] of content.matchAll(pattern)) {
        let decoded = rawPath.split(/[#?]/)[0];
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          // 壊れた escape はそのまま照合する。
        }
        const absolute = join(repositoryRoot, decoded);
        const label = `${relative(repositoryRoot, entryPath)} -> ${kind}/main/${rawPath}`;
        if (!existsSync(absolute)) {
          broken.push(`${label} (参照先が無い)`);
          continue;
        }
        // dir は tree、file は blob。取り違えると GitHub 側で redirect になる。
        if (statSync(absolute).isDirectory() !== (kind === 'tree')) {
          broken.push(`${label} (blob と tree の取り違え)`);
        }
      }
    }
  };

  walk(docsRoot);
  assert.deepEqual(broken, [], broken.join('\n'));
});

// 報告の並びは code unit 順に固定する。`localeCompare` は ICU の照合順に従うため、
// 大文字を含む path で並びが変わり、環境によっても揺れる。stderr の diff を読む側が
// 実行ごとに違う順序を見ることになる。
test('dead links are reported in code unit order', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    // 大文字と小文字が混じる file 名でないと 2 つの並べ方が同じ結果になる。
    for (const name of ['Zeta.md', 'alpha.md', 'Beta.md']) {
      writeFileSync(join(docsDirectory, name), `# ${name}\n\n[x](./gone-${name})\n`);
    }

    const dead = deadDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs', 'libraries'),
    });

    assert.deepEqual(dead, [...dead].sort(), 'code unit 順であること');
    assert.notDeepEqual(
      [...dead].sort(),
      [...dead].sort((a, b) => a.localeCompare(b)),
      'fixture が 2 つの並べ方を区別できていること',
    );
  });
});

// 並べ替えの key は報告文字列そのものでないといけない。区切りを変えた key
// (`file + ' ' + target`) は、空白を含む file 名で報告順と逆転する。
test('the sort key matches the reported line even for file names with spaces', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    // `a.md` の target は `-` より後ろの文字で始める必要がある。`./x` のように
    // `.` で始めると 2 つの key が同じ順序を返し、test が識別力を失う。
    writeFileSync(join(docsDirectory, 'a.md'), '# a\n\n[x](zzz)\n');
    writeFileSync(join(docsDirectory, 'a.md b.md'), '# b\n\n[y](./gone)\n');

    const dead = deadDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs', 'libraries'),
    });

    assert.deepEqual(dead, [...dead].sort(), '報告順と code unit 順が一致すること');

    // 旧 key を再現し、この fixture が 2 つの並べ方を区別できることを示す。
    const byOldKey = [...dead].sort((left, right) => {
      const key = (line) => line.replace(/^dead link: /, '').replace(' -> ', ' ');
      return key(left) < key(right) ? -1 : key(left) > key(right) ? 1 : 0;
    });
    assert.notDeepEqual(byOldKey, [...dead].sort(), 'fixture が旧 key と新 key を区別できていること');
  });
});

// 解析できない記法が現れると、その link は解決の検査自体を受けない。上の test は
// 「checker が読めた link」 しか見ないので、読めない記法が増えると黙って覆う範囲が
// 狭まる。docs 全体で未対応記法を 0 に保ち、増えた時に気付けるようにする。
test('no file in docs uses link syntax the checker cannot parse', () => {
  const repositoryRoot = join(scriptsDirectory, '..');
  const found = unsupportedLinkSyntax({
    repositoryRoot,
    scanRoot: join(repositoryRoot, 'docs'),
  });
  assert.deepEqual(found, [], found.join('\n'));
});

// 生成 script の走査範囲が `docs/` 全体であること。`docs/libraries` に絞っていると、
// その外の破れが gate を通り抜ける。統合 test は既に `docs/` 全体を見ているので、
// 範囲を揃えないと同じ検査が 2 経路で食い違う。
test('the generator scans the whole docs tree, not just libraries', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    // `docs/libraries` の外に破れを置く。絞った範囲では検出されない位置。
    const outsideLibraries = join(root, 'docs', 'guides');
    mkdirSync(outsideLibraries, { recursive: true });
    writeFileSync(join(outsideLibraries, 'index.md'), '# guides\n\n[消えた](./gone.md)\n');

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'sync-library-doc-links.mjs')],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0, 'libraries の外の破れも止める');
    assert.match(result.stderr, /docs\/guides\/index\.md -> \.\/gone\.md/);
  });
});

// 生成先の宣言を受け付けるのは generator が書き出す root だけ。任意の場所を信じると、
// `.gitignore` に 1 行足して該当 dir を参照するだけで本物の欠損 link を隠せる
// (実測で再現した)。
test('a generated declaration outside the trusted root is not honored', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    // `docs/api` の外に宣言を置く。
    const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
    writeFileSync(join(docsDirectory, '.gitignore'), 'gone/\n');
    writeFileSync(join(docsDirectory, 'index.md'), '# sample\n\n[本物の欠損](./gone/page)\n');

    const failures = classifyDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs'),
    });
    assert.equal(failures.length, 1, JSON.stringify(failures));
    assert.equal(failures[0].reason, LINK_FAILURE.MISSING);
  });
});

// symlink の `.md` は読まない。docs に repo 外を指す symlink を置くだけで、その中身の
// link destination が dead link の報告として stderr に出る (実測で再現した)。
test('a symlinked markdown source is not read', () => {
  withFixture(({ root, readmePath }) => {
    const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-link-outside-')));
    try {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      writeFileSync(
        join(outsideDirectory, 'secret.md'),
        '# secret\n\n[漏洩](/leaked-target-name)\n',
      );

      const docsDirectory = join(root, 'docs', 'libraries', 'foundation', 'sample');
      symlinkSync(join(outsideDirectory, 'secret.md'), join(docsDirectory, 'external.md'));

      // 中身は読まないので、外部 file の link destination は報告に出ない。
      const dead = deadDocumentLinks({
        repositoryRoot: root,
        docsRoot: join(root, 'docs'),
        scanRoot: join(root, 'docs'),
      });
      assert.deepEqual(dead, [], dead.join('\n'));

      // ただし読まなかったことは黙らない。検査できない file として報告する。
      const found = unsupportedLinkSyntax({
        repositoryRoot: root,
        scanRoot: join(root, 'docs'),
      });
      assert.equal(found.length, 1, found.join('\n'));
      assert.match(found[0], /symlink の markdown/);
      assert.doesNotMatch(found[0], /leaked-target-name/, '中身は報告に出さない');
    } finally {
      rmSync(outsideDirectory, { recursive: true, force: true });
    }
  });
});

// repo の外を指す symlink directory へは降りないので、配下の markdown が 1 件も
// 検査されない。黙って通すと、その配下だけで壊れる link が gate を通る。
test('a symlinked source directory pointing outside the repo is reported as unchecked', () => {
  withFixture(({ root, readmePath }) => {
    const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'docs-link-outside-')));
    try {
      writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
      writeFileSync(join(outsideDirectory, 'page.md'), '# page\n\n[壊れた](./gone)\n');
      symlinkSync(outsideDirectory, join(root, 'docs', 'alias'));

      const found = unsupportedLinkSyntax({
        repositoryRoot: root,
        scanRoot: join(root, 'docs'),
      });
      assert.equal(found.length, 1, found.join('\n'));
      assert.match(found[0], /symlink の directory/);
    } finally {
      rmSync(outsideDirectory, { recursive: true, force: true });
    }
  });
});

// repo の中に留まる symlink directory は報告しない。`docs/public/images` のように
// 実運用で使われており、実体側が同じ repo にあるので検査から漏れない。
test('a symlinked source directory inside the repo is not reported', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const real = join(root, 'docs', 'real');
    mkdirSync(real, { recursive: true });
    writeFileSync(join(real, 'page.md'), '# page\n\n[隣](./sibling)\n');
    writeFileSync(join(real, 'sibling.md'), '# sibling\n');
    symlinkSync(real, join(root, 'docs', 'alias'));

    const found = unsupportedLinkSyntax({
      repositoryRoot: root,
      scanRoot: join(root, 'docs'),
    });
    assert.deepEqual(found, [], found.join('\n'));
  });
});

// `.vitepress` は VitePress の作業領域で source markdown を持たない。降りると
// build 出力を走査することになり、生成済み checkout かどうかで cost が変わる。
test('the vitepress work directory is not walked', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    // build 出力に見立てた壊れた link。降りれば検出され、降りなければ検出されない。
    const distDirectory = join(root, 'docs', '.vitepress', 'dist');
    mkdirSync(distDirectory, { recursive: true });
    writeFileSync(join(distDirectory, 'page.md'), '# dist\n\n[壊れた](./gone.md)\n');

    const dead = deadDocumentLinks({
      repositoryRoot: root,
      docsRoot: join(root, 'docs'),
      scanRoot: join(root, 'docs'),
    });
    assert.deepEqual(dead, [], dead.join('\n'));
  });
});

// 生成物は build すれば在るので、生成 script を止めない。止めると checkout 直後は
// 常に落ちる gate になる (実測で `docs/` 全体へ広げた時に 4 件で止まった)。
test('generated targets do not stop the generator', () => {
  withFixture(({ root, readmePath }) => {
    writeFileSync(readmePath, `# @kiwa-lab/sample\n\n${HAND_WRITTEN}`);
    const apiDirectory = join(root, 'docs', 'api');
    mkdirSync(apiDirectory, { recursive: true });
    writeFileSync(join(apiDirectory, '.gitignore'), 'typescript/\n');
    writeFileSync(join(apiDirectory, 'index.md'), '# api\n\n[生成物](./typescript/)\n');

    const result = runSync(root);
    assert.equal(result.status, 0, result.stderr);
  });
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
