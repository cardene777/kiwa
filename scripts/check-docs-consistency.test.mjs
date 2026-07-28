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
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));

/** config.mts の分類定義。検査 script が読む形だけを再現する。 */
function configSource(categories) {
  const entries = categories
    .map(
      (category) =>
        `  {\n    text: '${category.text}',\n    slug: '${category.slug}',\n` +
        `    packages: [${category.packages.map((name) => `'${name}'`).join(', ')}],\n  },`,
    )
    .join('\n');
  return [
    "import { defineConfig } from 'vitepress';",
    '',
    'type LibraryCategory = {',
    '  text: string;',
    '  slug: string;',
    '  packages: string[];',
    '};',
    '',
    'const libraryCategories: LibraryCategory[] = [',
    entries,
    '];',
    '',
    'export default defineConfig({});',
    '',
  ].join('\n');
}

// 検査 script が存在を要求する特例文書。package を持たないが置き場所は決まっている。
const EXEMPT_LAYOUT = [
  { name: 'kiwa', category: 'foundation' },
  { name: 'go', category: 'native-languages' },
  { name: 'python', category: 'native-languages' },
  { name: 'rust', category: 'native-languages' },
];

/** 特例文書を fixture に置く。`skip` に挙げた名前は置かない。 */
function writeExemptDocuments(root, skip = new Set()) {
  for (const { name, category } of EXEMPT_LAYOUT) {
    if (skip.has(name)) continue;
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
    // 検査 script は TypeScript の parser を使う。fixture から解決できるよう、
    // repo の node_modules へ link を張る。
    symlinkSync(join(scriptsDirectory, '..', 'node_modules'), join(root, 'node_modules'));

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

    const configDirectory = join(root, 'docs', '.vitepress');
    mkdirSync(configDirectory, { recursive: true });
    writeFileSync(join(configDirectory, 'config.mts'), configSource(categories));

    // packages/ が空だと readdirSync が落ちる。全 entry が manifest なしの構成でも動くよう作る。
    mkdirSync(join(root, 'packages'), { recursive: true });

    // layout が同名を持つ場合は、そちらの置き方を優先する。
    writeExemptDocuments(root, new Set(layout.map((entry) => entry.name)));

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
    rmSync(join(root, 'docs', 'libraries', 'native-languages', 'go'), {
      recursive: true,
      force: true,
    });
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /native-languages\/go/);
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
test('a package listed under two categories in the sidebar fails', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    const configPath = join(root, 'docs', '.vitepress', 'config.mts');
    const source = readFileSync(configPath, 'utf8').replace(
      "    packages: ['core'],\n  },",
      "    packages: ['core'],\n  },\n  {\n    text: 'services',\n    slug: 'services',\n    packages: ['core'],\n  },",
    );
    writeFileSync(configPath, source);
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /listed under both foundation and services/);
  });
});

// 特例の文書は package を持たないが置き場所は決まっている。移動しても通ると、
// 分類ごとに固定 link を書く sidebar と食い違う。
test('an exempt document that moved to another category fails', () => {
  withFixture([{ name: 'core' }, { name: 'kiwa', manifest: false, sidebarEntry: false, category: 'services' }], ({ root }) => {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /foundation\/kiwa/);
    assert.match(result.stderr, /is missing/);
  });
});

// 値の中の記号で壊れない読み方であること。文字列を置換して JSON にする実装では
// `text: 'AI: リアルタイム'` のような値で壊れていた。
test('a category label containing a colon is read correctly', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    const configPath = join(root, 'docs', '.vitepress', 'config.mts');
    const source = readFileSync(configPath, 'utf8').replace(
      "text: 'foundation'",
      "text: 'AI: realtime'",
    );
    writeFileSync(configPath, source);
    const result = runCheck(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

// 定義の形が変わった時に黙って空集合として通ると、検査そのものが無力になる。
test('a config without the expected definition fails instead of passing silently', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    writeFileSync(
      join(root, 'docs', '.vitepress', 'config.mts'),
      "import { defineConfig } from 'vitepress';\nexport default defineConfig({});\n",
    );
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /could not find the libraryCategories array/);
  });
});
