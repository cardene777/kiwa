// check-docs-consistency.mjs を実際に起動して、対応が欠けた構成で非 0 で終わることを
// 確かめる。fixture の checkout を temp 領域に組み立て、script を子 process として動かす。
//
//   node --test scripts/check-docs-consistency.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));

/** 共有の分類定義 (docs/libraries.json)。検査 script が読む形を再現する。 */
function definitionSource(categories, exempt) {
  return `${JSON.stringify(
    {
      libraryCategories: categories,
      exemptDocuments: exempt,
      standaloneCategory: { slug: 'native-languages', text: 'ネイティブ言語' },
      documentKinds: [
        { slug: '', text: '概要' },
        { slug: 'quickstart', text: 'はじめる' },
        { slug: 'how-to', text: '使い方' },
        { slug: 'reference', text: 'リファレンス' },
      ],
      requiredPages: ['index.md', 'quickstart.md', 'how-to.md', 'reference.md'],
      packageScope: '@kiwa-lab',
    },
    null,
    2,
  )}\n`;
}

// 検査 script が存在を要求する特例文書。package を持たないが置き場所は決まっている。
// 実 `docs/libraries.json` の `exemptDocuments` と同じ 2 件にしてある。 go / rust も
// 置いていたが、 #1864 が両文書を消したので、 fixture だけが要求し続ける形になっていた。
const EXEMPT_LAYOUT = [
  { name: 'kiwa', category: 'foundation' },
  { name: 'python', category: 'native-languages' },
];

/** 特例文書を fixture に置く。`skip` に挙げた `分類/名前` は置かない。 */
function writeExemptDocuments(root, skip = new Set()) {
  for (const { name, category } of EXEMPT_LAYOUT) {
    if (skip.has(`${category}/${name}`)) continue;
    const directory = join(root, 'docs', 'libraries', category, name);
    mkdirSync(directory, { recursive: true });
    for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
      writeFileSync(join(directory, page), `# ${page}\n`);
    }
  }
}

/**
 * 検査 script が動く最小の checkout を組み立てる。
 *
 * `layout` は package ごとに「manifest / 文書 / sidebar 登録 / 文書テスト」の
 * どれを置くかを指定する。欠けた時に検査が落ちることを確かめるため、個別に外せる形にする。
 *
 * 特例文書は既定で置く。個別に外したい test は `layout` に同名の entry を書いて上書きする。
 */
function withFixture(layout, body) {
  // /tmp は macOS で /private/tmp への symlink なので、canonical にしないと
  // path の包含判定が全て外れる。
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'docs-consistency-')));
  try {
    mkdirSync(join(root, 'scripts'), { recursive: true });
    for (const file of ['docs-sync-safety.mjs', 'check-docs-consistency.mjs']) {
      copyFileSync(join(scriptsDirectory, file), join(root, 'scripts', file));
    }
    const sidebar = [];
    for (const entry of layout) {
      const { name, category = 'foundation', manifest = true, document = true } = entry;
      const { sidebarEntry = true, test = true } = entry;

      const { manifestName = `@kiwa-lab/${name}`, testName = `docs-library-${name}.test.ts` } = entry;
      const { pages = ['index.md', 'quickstart.md', 'how-to.md', 'reference.md'] } = entry;

      if (manifest) {
        const packageDirectory = join(root, 'packages', name);
        mkdirSync(packageDirectory, { recursive: true });
        writeFileSync(
          join(packageDirectory, 'package.json'),
          `${JSON.stringify({ name: manifestName, version: '0.0.0' }, null, 2)}\n`,
        );
        if (test) {
          const testDirectory = join(packageDirectory, 'tests');
          mkdirSync(testDirectory, { recursive: true });
          writeFileSync(join(testDirectory, testName), 'export {};\n');
        }
      }

      if (document) {
        const documentDirectory = join(root, 'docs', 'libraries', category, name);
        mkdirSync(documentDirectory, { recursive: true });
        for (const page of pages) {
          writeFileSync(join(documentDirectory, page), `# ${page}\n`);
        }
      }

      if (sidebarEntry) sidebar.push({ name, category });
    }

    const byCategory = new Map();
    for (const { name, category } of sidebar) {
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(name);
    }
    const categories = [...byCategory].map(([slug, packages]) => ({ text: slug, slug, packages }));

    // 定義から外すのは、layout が同じ分類の同じ名前を持つ場合だけ。名前だけで判定すると
    // `languages/python` を layout に置いた時に `native-languages/python` まで消える。
    const overridden = new Set(
      layout.map((item) => `${item.category ?? 'foundation'}/${item.name}`),
    );
    const exempt = EXEMPT_LAYOUT.filter(
      (entry) => !overridden.has(`${entry.category}/${entry.name}`),
    ).map(({ name, category }) => ({ name, category, label: name }));
    mkdirSync(join(root, 'docs'), { recursive: true });
    writeFileSync(join(root, 'docs', 'libraries.json'), definitionSource(categories, exempt));

    // packages/ が空だと readdirSync が落ちる。全 entry が manifest なしの構成でも動くよう作る。
    mkdirSync(join(root, 'packages'), { recursive: true });

    // layout が同じ分類の同じ名前を持つ場合は、そちらの置き方を優先する。
    writeExemptDocuments(root, overridden);

    return body({ root });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runCheck(root) {
  return spawnSync(process.execPath, [join(root, 'scripts', 'check-docs-consistency.mjs')], {
    encoding: 'utf8',
  });
}

test('a consistent layout passes', () => {
  withFixture([{ name: 'core' }, { name: 'auth', category: 'services' }], ({ root }) => {
    const result = runCheck(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /agree for 2 packages/);
  });
});

// package を足しただけで文書を書かなかった状態。生成 script は docs 側を起点に
// 走るので、この package を黙って無視して成功と報告していた。
test('a package without a library document fails and names it', () => {
  withFixture([{ name: 'core' }, { name: 'newcomer', document: false }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /newcomer/);
    assert.match(result.stderr, /no library document/);
  });
});

// package を消したのに文書が残った状態。古い契約とソースリンクが公開され続ける。
test('a document without a package fails and names it', () => {
  withFixture([{ name: 'core' }, { name: 'removed', manifest: false }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /removed/);
    assert.match(result.stderr, /has no package/);
  });
});

test('a package missing from the sidebar definition fails and names it', () => {
  withFixture([{ name: 'core' }, { name: 'hidden', sidebarEntry: false }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /hidden/);
    assert.match(result.stderr, /libraryCategories/);
  });
});

test('a package without a document test fails and names it', () => {
  withFixture([{ name: 'core' }, { name: 'untested', test: false }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /untested/);
    assert.match(result.stderr, /docs-library/);
  });
});

// sidebar の分類と実 directory がずれると、README と sidebar が別の URL を生成する。
test('a category mismatch between the sidebar and the directory fails', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    // 文書は services/ に置き、sidebar 定義は foundation のままにする。
    rmSync(join(root, 'docs', 'libraries', 'foundation', 'core'), { recursive: true, force: true });
    const moved = join(root, 'docs', 'libraries', 'services', 'core');
    mkdirSync(moved, { recursive: true });
    for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
      writeFileSync(join(moved, page), `# ${page}\n`);
    }
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /libraryCategories says foundation/);
    assert.match(result.stderr, /sits under services/);
  });
});

// standalone な native project は TypeScript の package を持たない。対応検査から
// 外していないと、正常な checkout が毎回落ちる。
test('the standalone native documents pass without a package', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    // fixture は native-languages の 3 文書を既定で置く。package も sidebar 定義も
    // 無いが、特例として通ることを確かめる。
    const result = runCheck(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

// 特例だからといって「無くてもよい」ではない。config.mts は分類ごとに固定の link を
// 書くため、文書が消えれば link が切れる。
test('a missing standalone native document fails', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    rmSync(join(root, 'docs', 'libraries', 'native-languages', 'python'), {
      recursive: true,
      force: true,
    });
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /native-languages\/python/);
    assert.match(result.stderr, /is missing/);
  });
});

// 同名の adapter package (languages/python) と standalone な native project
// (native-languages/python) は別物。名前だけで突き合わせると衝突する。
test('an adapter package and a native project may share a name', () => {
  withFixture([{ name: 'core' }, { name: 'python', category: 'languages' }], ({ root }) => {
    // fixture の layout に python があるため、特例側は自動では置かれない。手で置く。
    const nativeDirectory = join(root, 'docs', 'libraries', 'native-languages', 'python');
    mkdirSync(nativeDirectory, { recursive: true });
    for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
      writeFileSync(join(nativeDirectory, page), `# ${page}\n`);
    }
    const result = runCheck(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

// 全体をまとめて説明する入口は packages 側に実体を持たない。
test('the umbrella document is allowed to have no package', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    // fixture は foundation/kiwa を既定で置く。package も sidebar 定義も無いが通る。
    const result = runCheck(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

test('a missing umbrella document fails', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    rmSync(join(root, 'docs', 'libraries', 'foundation', 'kiwa'), { recursive: true, force: true });
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /foundation\/kiwa/);
    assert.match(result.stderr, /is missing/);
  });
});

// 必要なページが 1 つでも欠けると生成 script が対象から外す。directory の存在だけを
// 見ていると、reference.md を消しても検査が通ってしまう。
test('a document missing a required page fails and names the page', () => {
  withFixture(
    [{ name: 'core' }, { name: 'partial', pages: ['index.md', 'quickstart.md', 'how-to.md'] }],
    ({ root }) => {
      const result = runCheck(root);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /partial/);
      assert.match(result.stderr, /is missing reference\.md/);
    },
  );
});

// manifest を正本と呼ぶ以上、名前と directory 名が一致していることまで見る。
// ずれていると、文書と sidebar と test は directory 名で揃っているのに公開名だけが違う。
test('a manifest whose name does not match the directory fails', () => {
  withFixture([{ name: 'core' }, { name: 'renamed', manifestName: '@kiwa-lab/other' }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /renamed/);
    assert.match(result.stderr, /declares @kiwa-lab\/other/);
  });
});

// rename 後に残った古い名前の test が、新しい package の分として数えられないこと。
test('a document test named after another package does not count', () => {
  withFixture(
    [{ name: 'core' }, { name: 'newname', testName: 'docs-library-oldname.test.ts' }],
    ({ root }) => {
      const result = runCheck(root);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /newname/);
      assert.match(result.stderr, /docs-library-newname\.test\.ts/);
    },
  );
});

// 同じ名前の文書が 2 つの分類にあると、Map へ入れるだけでは最後の 1 件しか残らず、
// 余分な文書があっても最後の分類さえ合っていれば通る。
test('a library with documents in two categories fails and names both', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    const extra = join(root, 'docs', 'libraries', 'services', 'core');
    mkdirSync(extra, { recursive: true });
    for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
      writeFileSync(join(extra, page), `# ${page}\n`);
    }
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /has documents under both/);
  });
});

// sidebar の定義側で同じ package を 2 つの分類に置いた場合も、上書きした側だけが
// 残って余分な定義を見逃す。
test('a package listed under two categories in the definition fails', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    const definitionPath = join(root, 'docs', 'libraries.json');
    const definition = JSON.parse(readFileSync(definitionPath, 'utf8'));
    definition.libraryCategories.push({ text: 'services', slug: 'services', packages: ['core'] });
    writeFileSync(definitionPath, `${JSON.stringify(definition, null, 2)}\n`);
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /listed under both foundation and services/);
  });
});

// 特例の文書は package を持たないが置き場所は決まっている。移動しても通ると、
// 分類ごとに固定 link を書く sidebar と食い違う。
test('an exempt document that moved to another category fails', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    // 定義は foundation を期待しているのに、文書だけ services へ移した状態を作る。
    const from = join(root, 'docs', 'libraries', 'foundation', 'kiwa');
    const to = join(root, 'docs', 'libraries', 'services', 'kiwa');
    mkdirSync(to, { recursive: true });
    for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
      writeFileSync(join(to, page), `# ${page}\n`);
    }
    rmSync(from, { recursive: true, force: true });

    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    // 期待する場所に無いことと、移した先で package を持たないことの両方が出る。
    assert.match(result.stderr, /foundation\/kiwa/);
    assert.match(result.stderr, /is missing/);
    assert.match(result.stderr, /has no package/);
  });
});

// 分類の呼び名に記号が入っても壊れないこと。以前は config を文字列置換で読んでいたため、
// `text: 'AI: リアルタイム'` のような値で壊れていた。import する形にして制約が消えた。
test('a category label containing a colon is read correctly', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    const definitionPath = join(root, 'docs', 'libraries.json');
    const definition = JSON.parse(readFileSync(definitionPath, 'utf8'));
    definition.libraryCategories[0].text = 'AI: realtime';
    writeFileSync(definitionPath, `${JSON.stringify(definition, null, 2)}\n`);
    const result = runCheck(root);
    // 呼び名を変えただけで slug は変わらないので、対応検査は通る。
    assert.equal(result.status, 0, result.stderr);
  });
});

// 共有定義に載っているのに実 directory が無い場合。定義だけ足して文書を書き忘れた状態で、
// sidebar は link を出すが遷移先が無い。
test('a package in the definition without a directory fails', () => {
  withFixture([{ name: 'core' }, { name: 'ghost', document: false }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ghost/);
    assert.match(result.stderr, /no library document/);
  });
});

// 実 directory があるのに共有定義に無い場合。文書は存在するが sidebar から辿れない。
test('a directory without an entry in the definition fails', () => {
  withFixture([{ name: 'core' }, { name: 'orphan', sidebarEntry: false }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /orphan/);
    assert.match(result.stderr, /missing from libraryCategories/);
  });
});

// 共有定義そのものが読めない状態で、黙って空集合として通らないこと。
test('an unreadable definition fails instead of passing silently', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    writeFileSync(join(root, 'docs', 'libraries.json'), '{ "libraryCategories": [');
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
  });
});
