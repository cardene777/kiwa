// 生成した API 契約ページの削除経路を検査する。
//
// 生成のたびに、目次へ載らなくなったページを消す。消してよいものだけを消せているかは
// 実際に file を置いて確かめないと分からない。
//
// 実装は生成 script と共有している (scripts/docs-api-pages.mjs)。
// ここで写しを持つと、実物とずれた時に自分の写像を検証するだけになる。
//
//   node --test scripts/docs-api-page-guard.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DocsSyncError } from './docs-sync-safety.mjs';
import {
  deleteVerifiedPage,
  generatedApiPageMarker,
  isGeneratedApiPage,
  isGeneratedApiPageSource,
  prepareDeletePath,
  staleApiPages,
} from './docs-api-pages.mjs';

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
  writeFileSync(path, `---\ntitle: "x"\n---\n\n${generatedApiPageMarker}\n\n${body}\n`);
}

test('a generated page is recognised by its marker', () => {
  withFixture(({ apiDirectory }) => {
    const generated = join(apiDirectory, 'generated.md');
    const handwritten = join(apiDirectory, 'handwritten.md');
    writeGenerated(generated);
    writeFileSync(handwritten, '# 手で書いた説明\n');
    assert.equal(isGeneratedApiPage(generated), true);
    assert.equal(isGeneratedApiPage(handwritten), false);
    assert.equal(isGeneratedApiPage(join(apiDirectory, 'absent.md')), false);
  });
});

// 印は frontmatter の直後に置く。どこかに含まれるだけで生成物と見なすと、
// 手書きのページが説明や code block でこの文字列に触れただけで削除対象になる。
test('the marker only counts at the top of the body', () => {
  assert.equal(isGeneratedApiPageSource(`---\ntitle: "x"\n---\n\n${generatedApiPageMarker}\n\n本文\n`), true);
  assert.equal(isGeneratedApiPageSource(`${generatedApiPageMarker}\n\n本文\n`), true);
  // 説明文の中で印に触れただけ。
  assert.equal(
    isGeneratedApiPageSource(`# 手で書いた説明\n\n生成物には ${generatedApiPageMarker} が付きます。\n`),
    false,
  );
  // code block の中に印がある。
  assert.equal(
    isGeneratedApiPageSource('# 説明\n\n```md\n' + generatedApiPageMarker + '\n```\n'),
    false,
  );
});

test('a hand written page that mentions the marker is not collected', () => {
  withFixture(({ apiDirectory }) => {
    const handwritten = join(apiDirectory, 'about-generation.md');
    writeFileSync(handwritten, `# 生成の仕組み\n\n印は ${generatedApiPageMarker} です。\n`);
    const problems = [];
    assert.deepEqual(staleApiPages(apiDirectory, [], problems), []);
    assert.equal(existsSync(handwritten), true);
  });
});

// 親が同じまま対象 file だけを差し替えられると、親の照合では気付けない。
test('a replaced target file is detected before deleting', () => {
  withFixture(({ root, apiDirectory }) => {
    const path = join(apiDirectory, 'gone.md');
    writeGenerated(path);
    const verified = prepareDeletePath(path, root, 'gone.md');

    // 同じ名前へ別の file を rename する (inode が変わる)。
    const decoy = join(apiDirectory, '.decoy');
    writeFileSync(decoy, '手書きの内容\n');
    renameSync(decoy, path);

    const deleted = [];
    assert.throws(
      () => deleteVerifiedPage(verified, (target) => deleted.push(target)),
      /was replaced before deleting/,
    );
    assert.deepEqual(deleted, []);
    assert.equal(readFileSync(path, 'utf8'), '手書きの内容\n');
  });
});

test('a generated page that left the index is collected', () => {
  withFixture(({ apiDirectory }) => {
    writeGenerated(join(apiDirectory, 'gone.md'));
    writeGenerated(join(apiDirectory, 'kept.md'));
    const problems = [];
    const stale = staleApiPages(apiDirectory, ['kept.md'], problems);
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
    assert.deepEqual(staleApiPages(apiDirectory, [], problems), []);
    assert.equal(existsSync(handwritten), true);
  });
});

// 生成する名前と人が置いた file がぶつかった時は、黙って上書きせず知らせる。
test('a name collision with a hand written page is reported', () => {
  withFixture(({ apiDirectory }) => {
    writeFileSync(join(apiDirectory, 'engine.md'), '# 手で書いた説明\n');
    const problems = [];
    staleApiPages(apiDirectory, ['engine.md'], problems);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /生成物の印を持たない/);
  });
});

// ここが本題。実体まで辿る関数を削除に使うと、link ではなくその先の file が消える。
// 読む時は安全側に働く性質が、削除では危険側に働く。
test('a symlink is refused instead of deleting what it points to', () => {
  withFixture(({ root, apiDirectory }) => {
    const victim = join(root, 'keep', 'handwritten.md');
    writeFileSync(victim, '消えてはいけない内容\n');
    symlinkSync(victim, join(apiDirectory, 'orphan.md'));

    assert.throws(
      () => prepareDeletePath(join(apiDirectory, 'orphan.md'), root, 'orphan.md'),
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
    const verified = prepareDeletePath(path, root, 'gone.md');
    assert.equal(verified.path, path);
    assert.match(verified.directoryIdentity, /^\d+:\d+$/);
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

test('a page outside the repository is refused', () => {
  withFixture(({ root }) => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), 'api-page-outside-')));
    try {
      writeGenerated(join(outside, 'page.md'));
      assert.throws(
        () => prepareDeletePath(join(outside, 'page.md'), root, 'page.md'),
        /outside/,
      );
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

// 検証と削除の間に親 directory を差し替えられると、同じ名前の別の file を消すことになる。
// 書き込み側は同じ守り方をしている。
test('a replaced parent directory is detected before deleting', () => {
  withFixture(({ root, apiDirectory }) => {
    const path = join(apiDirectory, 'gone.md');
    writeGenerated(path);
    const verified = prepareDeletePath(path, root, 'gone.md');

    // 検証の後で api/ を別の directory に差し替える。
    const decoy = join(root, 'decoy');
    mkdirSync(decoy);
    writeFileSync(join(decoy, 'gone.md'), '別の file\n');
    renameSync(apiDirectory, join(root, 'moved'));
    renameSync(decoy, apiDirectory);

    const deleted = [];
    assert.throws(
      () => deleteVerifiedPage(verified, (target) => deleted.push(target)),
      (error) => {
        assert.ok(error instanceof DocsSyncError);
        assert.match(error.message, /was replaced before deleting/);
        return true;
      },
    );
    assert.deepEqual(deleted, [], '差し替え先の file には触れない');
    assert.equal(readFileSync(join(apiDirectory, 'gone.md'), 'utf8'), '別の file\n');
  });
});

test('an unchanged parent directory lets the delete through', () => {
  withFixture(({ root, apiDirectory }) => {
    const path = join(apiDirectory, 'gone.md');
    writeGenerated(path);
    const verified = prepareDeletePath(path, root, 'gone.md');
    const deleted = [];
    deleteVerifiedPage(verified, (target) => deleted.push(target));
    assert.deepEqual(deleted, [path]);
  });
});
