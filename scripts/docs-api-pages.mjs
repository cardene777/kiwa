// 生成した API 契約ページの印と、その削除経路。
//
// 生成 script (sync-library-api-reference.mjs) と test の両方がここを使う。
// test 側に同じ実装を写すと、実物とずれた時に自分の写像を検証するだけになる。
//
// 副作用を持たない。読む側が評価しても何も起きない。

import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { DocsSyncError, insideRoot } from './docs-sync-safety.mjs';

/**
 * 生成物であることの印。
 *
 * 人が置いた file と区別するために要る。名前や場所では区別できない。
 * 検索の索引から本文を落とす判定にも使う。
 */
export const generatedApiPageMarker = '<!-- kiwa-generated-api-page -->';

/**
 * その file が生成物か。
 *
 * 印は frontmatter の直後に置く。file のどこかに含まれるだけで生成物と見なすと、
 * 手書きのページが説明や code block でこの文字列に触れただけで削除対象になる。
 * 位置まで含めて判定する。
 *
 * 読めない file は生成物でないものとして扱う。消さない側に倒す。
 */
export function isGeneratedApiPage(path) {
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    return false;
  }
  return isGeneratedApiPageSource(source);
}

/** 中身が生成物の形をしているか。印の位置まで見る。 */
export function isGeneratedApiPageSource(source) {
  const withoutFrontmatter = source.startsWith('---\n')
    ? source.slice(source.indexOf('\n---\n', 4) + '\n---\n'.length)
    : source;
  return withoutFrontmatter.trimStart().startsWith(generatedApiPageMarker);
}

/**
 * 目次に載らなくなった生成ページ。
 *
 * 宣言元の file が消えると、そこから作ったページだけが残る。目次から辿れないまま
 * 公開され続けるので、生成のたびに拾って消す。
 *
 * 消すのは印を持つ file だけにする。印が無ければ人が置いたものとして扱い、
 * 生成する名前とぶつかっていれば `problems` に積んで呼び出し側に止めさせる。
 * 黙って消すと、手で書いた説明が次の生成で失われる。
 */
export function staleApiPages(apiDirectory, expectedNames, problems) {
  if (!existsSync(apiDirectory)) return [];
  const expected = new Set(expectedNames);
  const stale = [];
  for (const file of readdirSync(apiDirectory)) {
    if (!file.endsWith('.md')) continue;
    const path = join(apiDirectory, file);
    const generated = isGeneratedApiPage(path);
    if (expected.has(file)) {
      if (!generated) {
        problems.push(`${path} は生成物の印を持たないため上書きしない (名前が衝突している)`);
      }
      continue;
    }
    if (generated) stale.push(path);
  }
  return stale;
}

/** directory の実体。辿れない場合は判断できないので止める。 */
function canonicalDirectory(path, label) {
  try {
    return realpathSync(path);
  } catch (error) {
    throw new DocsSyncError(`${label}: cannot resolve ${path}: ${error.message}`);
  }
}

/** directory の同一性。名前ではなく実体で比べるために dev と inode を見る。 */
function directoryIdentity(path, label) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats || !stats.isDirectory()) {
    throw new DocsSyncError(`${label}: ${path} is not a directory.`);
  }
  return `${stats.dev}:${stats.ino}`;
}

/**
 * 削除してよい path を確かめる。
 *
 * 実体まで辿る関数 (`resolveReadPath`) を削除に使うと、link ではなくその先の file を
 * 消してしまう。読む時は「repo の外を読まない」保証になる性質が、削除では逆に働く。
 * 書き込み側と同じく、対象そのものが link でないことを確かめる。
 *
 * 検証した時点の親 directory の実体も返す。検証と削除の間に親を差し替えられると、
 * 別の場所を消すことになるため、消す側がこれと突き合わせる。
 */
export function prepareDeletePath(path, root, label) {
  const directory = canonicalDirectory(dirname(path), label);
  if (!insideRoot(root, directory)) {
    throw new DocsSyncError(
      `${label}: the directory of ${path} resolves to ${directory}, which is outside ${root}.`,
    );
  }
  const target = join(directory, basename(path));
  const stats = lstatSync(target, { throwIfNoEntry: false });
  if (!stats) return null;
  if (stats.isSymbolicLink()) {
    throw new DocsSyncError(`${label}: ${target} is a symlink; refusing to delete through it.`);
  }
  if (!stats.isFile()) {
    throw new DocsSyncError(`${label}: ${target} is not a regular file.`);
  }
  return {
    path: target,
    directoryIdentity: directoryIdentity(directory, label),
    // 対象そのものの実体も控える。親が変わらないまま中身だけ差し替えられると、
    // 親の照合では気付けない。
    fileIdentity: `${stats.dev}:${stats.ino}`,
    label,
  };
}

/**
 * 検証済みのページを消す。
 *
 * 消す直前に親 directory の実体を見直す。検証から削除までの間に親を別の directory へ
 * 差し替えられると、同じ名前の別の file を消すことになる。書き込み側は同じ守り方を
 * している (`writeFileAtomic` が前後で dev:ino を照合する)。
 *
 * これで窓は狭まるが閉じ切ってはいない。path を渡す API は「解決してから開く」ので、
 * 解決と削除の間は原理的に残る。checkout を他の process が書き換えられない前提が要る。
 */
export function deleteVerifiedPage(verified, unlink) {
  const directory = dirname(verified.path);
  if (directoryIdentity(directory, verified.label) !== verified.directoryIdentity) {
    throw new DocsSyncError(`${verified.label}: ${directory} was replaced before deleting.`);
  }
  // 対象そのものも見直す。親が同じまま中身を差し替えられると、別の file を消す。
  const stats = lstatSync(verified.path, { throwIfNoEntry: false });
  if (!stats) return;
  if (`${stats.dev}:${stats.ino}` !== verified.fileIdentity) {
    throw new DocsSyncError(`${verified.label}: ${verified.path} was replaced before deleting.`);
  }
  unlink(verified.path);
}
