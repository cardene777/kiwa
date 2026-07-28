// check-docs-consistency.mjs を実際に起動して、対応が欠けた構成で非 0 で終わることを
// 確かめる。fixture の checkout を temp 領域に組み立て、script を子 process として動かす。
//
//   node --test scripts/check-docs-consistency.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
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

/**
 * 検査 script が動く最小の checkout を組み立てる。
 *
 * `layout` は package ごとに「manifest / 文書 / sidebar 登録 / 文書テスト」の
 * どれを置くかを指定する。欠けた時に検査が落ちることを確かめるため、個別に外せる形にする。
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

      if (manifest) {
        const packageDirectory = join(root, 'packages', name);
        mkdirSync(packageDirectory, { recursive: true });
        writeFileSync(
          join(packageDirectory, 'package.json'),
          `${JSON.stringify({ name: `@kiwa-lab/${name}`, version: '0.0.0' }, null, 2)}\n`,
        );
        if (test) {
          const testDirectory = join(packageDirectory, 'tests');
          mkdirSync(testDirectory, { recursive: true });
          writeFileSync(join(testDirectory, `docs-library-${name}.test.ts`), 'export {};\n');
        }
      }

      if (document) {
        const documentDirectory = join(root, 'docs', 'libraries', category, name);
        mkdirSync(documentDirectory, { recursive: true });
        for (const page of ['index.md', 'quickstart.md', 'how-to.md', 'reference.md']) {
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
test('the standalone native category is left out of the comparison', () => {
  withFixture([{ name: 'core' }], ({ root }) => {
    const nativeDirectory = join(root, 'docs', 'libraries', 'native-languages', 'go');
    mkdirSync(nativeDirectory, { recursive: true });
    writeFileSync(join(nativeDirectory, 'index.md'), '# go\n');
    const result = runCheck(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

// 全体をまとめて説明する入口は packages 側に実体を持たない。
test('the umbrella document is allowed to have no package', () => {
  withFixture([{ name: 'core' }, { name: 'kiwa', manifest: false, sidebarEntry: false }], ({ root }) => {
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
