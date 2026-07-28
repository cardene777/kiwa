// 分割ページの削除経路を検査する。
//
// 生成のたびに、目次へ載らなくなったページを消す。消してよいものだけを消せているかは
// 実際に file を置いて確かめないと分からない。
//
//   node --test scripts/docs-api-page-guard.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  lstatSync,
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
import { basename, dirname, join } from 'node:path';

import { DocsSyncError, insideRoot } from './docs-sync-safety.mjs';

const GENERATED_MARKER = '<!-- kiwa-generated-api-page -->';

// 検査対象の 2 関数は生成 script の内部にある。script 自体は TypeScript の program を
// 組み立てるため単体で import できない。振る舞いの契約をここに写して固定する。
// 写しが実物とずれると検査にならないので、script 側の実装と同じ形であることを
// 末尾の test で確かめる。

/** 目次に載らなくなった生成ページ。印を持つものだけを対象にする。 */
function staleUnitPages(apiDirectory, pages, problems) {
  if (!existsSync(apiDirectory)) return [];
  const expected = new Set(pages.map((page) => basename(page.path)));
  const stale = [];
  for (const file of readdirSync(apiDirectory).sort()) {
    if (!file.endsWith('.md')) continue;
    const path = join(apiDirectory, file);
    let generated = false;
    try {
      generated = readFileSync(path, 'utf8').includes(GENERATED_MARKER);
    } catch {
      generated = false;
    }
    if (expected.has(file)) {
      if (!generated) problems.push(`${path} は生成物の印を持たないため上書きしない`);
      continue;
    }
    if (generated) stale.push(path);
  }
  return stale;
}

/** 削除してよい path。link そのものを消すのであって、その先を消さない。 */
function prepareDeletePath(path, root, label) {
  let directory;
  try {
    directory = realpathSync(dirname(path));
  } catch (error) {
    throw new DocsSyncError(`${label}: cannot resolve ${dirname(path)}: ${error.message}`);
  }
  if (!insideRoot(root, directory)) {
    throw new DocsSyncError(`${label}: the directory of ${path} resolves outside ${root}.`);
  }
  const target = join(directory, basename(path));
  const stats = lstatSync(target, { throwIfNoEntry: false });
  if (!stats) return null;
  if (stats.isSymbolicLink()) {
    throw new DocsSyncError(`${label}: ${target} is a symlink; refusing to delete through it.`);
  }
  if (!stats.isFile()) throw new DocsSyncError(`${label}: ${target} is not a regular file.`);
  return target;
}

function withFixture(body) {
  // /tmp は macOS で /private/tmp への symlink なので、canonical にしないと
  // path の包含判定が全て外れる。
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'api-page-guard-')));
  try {
    mkdirSync(join(root, 'api'), { recursive: true });
    mkdirSync(join(root, 'keep'), { recursive: true });
    return body({ root, apiDirectory: join(root, 'api') });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** 生成ページを置く。 */
function writeGenerated(path, body = '本文') {
  writeFileSync(path, `---\ntitle: "x"\n---\n\n${GENERATED_MARKER}\n\n${body}\n`);
}

test('a generated page that left the index is collected', () => {
  withFixture(({ apiDirectory }) => {
    writeGenerated(join(apiDirectory, 'gone.md'));
    writeGenerated(join(apiDirectory, 'kept.md'));
    const problems = [];
    const stale = staleUnitPages(apiDirectory, [{ path: join(apiDirectory, 'kept.md') }], problems);
    assert.deepEqual(stale, [join(apiDirectory, 'gone.md')]);
    assert.deepEqual(problems, []);
  });
});

// 人が置いた file を巻き込むと、手で書いた説明が次の生成で失われる。
test('a hand written page without the marker is never collected', () => {
  withFixture(({ apiDirectory }) => {
    const handwritten = join(apiDirectory, 'overview.md');
    writeFileSync(handwritten, '# 手で書いた説明\n');
    const problems = [];
    const stale = staleUnitPages(apiDirectory, [], problems);
    assert.deepEqual(stale, []);
    assert.equal(existsSync(handwritten), true);
  });
});

// 生成する名前と人が置いた file がぶつかった時は、黙って上書きせず知らせる。
test('a name collision with a hand written page is reported', () => {
  withFixture(({ apiDirectory }) => {
    const path = join(apiDirectory, 'engine.md');
    writeFileSync(path, '# 手で書いた説明\n');
    const problems = [];
    staleUnitPages(apiDirectory, [{ path }], problems);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /生成物の印を持たない/);
  });
});

// ここが本題。`resolveReadPath` は実体まで辿るので、削除に使うと link ではなく
// その先の file が消える。読む時は安全側に働く性質が、削除では危険側に働く。
test('a symlink is refused instead of deleting what it points to', () => {
  withFixture(({ root, apiDirectory }) => {
    const victim = join(root, 'keep', 'handwritten.md');
    writeFileSync(victim, '消えてはいけない内容\n');
    const link = join(apiDirectory, 'orphan.md');
    symlinkSync(victim, link);

    assert.throws(
      () => prepareDeletePath(link, root, 'orphan.md'),
      (error) => {
        assert.ok(error instanceof DocsSyncError);
        assert.match(error.message, /symlink/);
        return true;
      },
    );
    assert.equal(readFileSync(victim, 'utf8'), '消えてはいけない内容\n');
  });
});

test('an ordinary generated page passes the delete guard', () => {
  withFixture(({ root, apiDirectory }) => {
    const path = join(apiDirectory, 'gone.md');
    writeGenerated(path);
    assert.equal(prepareDeletePath(path, root, 'gone.md'), path);
  });
});

test('a directory in place of a page is refused', () => {
  withFixture(({ root, apiDirectory }) => {
    const path = join(apiDirectory, 'gone.md');
    mkdirSync(path);
    assert.throws(() => prepareDeletePath(path, root, 'gone.md'), /not a regular file/);
  });
});

test('a missing page yields nothing to delete', () => {
  withFixture(({ root, apiDirectory }) => {
    assert.equal(prepareDeletePath(join(apiDirectory, 'absent.md'), root, 'absent.md'), null);
  });
});

// 生成 script 側の実装がこの写しとずれると、検査の意味が無くなる。
test('the generator uses the same marker and guards', () => {
  const source = readFileSync(join(dirname(new URL(import.meta.url).pathname), 'sync-library-api-reference.mjs'), 'utf8');
  assert.match(source, /const generatedMarker = '<!-- kiwa-generated-api-page -->'/);
  assert.match(source, /function prepareDeletePath\(/);
  assert.match(source, /refusing to delete through it/);
  // 削除は検証済みの path をそのまま消す。ここで解決し直すと link の先を消す。
  assert.match(source, /for \(const path of obsolete\) \{\s*\n\s*rmSync\(path, \{ force: true \}\)/);
  assert.equal(source.includes('rmSync(resolveReadPath('), false);
});
