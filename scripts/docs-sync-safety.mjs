// 生成 script が壊れた入力と細工された checkout に耐えるための共有 guard。
//
// 管理ブロックの marker は、個数と順序を検証してから置換する。検証しないと、
// end marker だけ残った README は実行のたびにブロックが 1 個ずつ増え、start
// marker だけの README は 2 回目の実行で既存の本文を失う。
//
// 読み書きする path は realpath へ直してから許可 root の内側かを確かめる。
// readFileSync も writeFileSync も symlink を追うので、checkout に link を 1 本
// 置くだけで repo の外の file を読み込み、あるいは上書きできる。
//
// 生成した Markdown へ埋め込む source text は、置き場所に合わせて escape する。
// docs site は HTML を有効にした VitePress なので、escape しない table cell は
// そのまま active markup として働く。

import { lstatSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

/** 生成を続けてはいけない、入力または checkout の異常。 */
export class DocsSyncError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DocsSyncError';
  }
}

/** haystack に現れる needle の個数。重なりは数えない。 */
export function countOccurrences(haystack, needle) {
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return count;
    count += 1;
    from = at + needle.length;
  }
}

/**
 * 管理ブロックの span を返す。marker が 1 つずつ正しい順序で並んでいれば
 * { start, end } を、どちらの marker も無ければ null を返す。それ以外は
 * DocsSyncError を投げ、壊れた file への書き込みを止める。
 */
export function findManagedBlock(content, { startMarker, endMarker, label }) {
  const starts = countOccurrences(content, startMarker);
  const ends = countOccurrences(content, endMarker);
  if (starts === 0 && ends === 0) return null;
  if (starts !== 1 || ends !== 1) {
    throw new DocsSyncError(
      `${label}: found ${starts} start marker and ${ends} end marker; expected either none ` +
        `or exactly one of each. Repair the managed block by hand before generating again.`,
    );
  }
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (end < start + startMarker.length) {
    throw new DocsSyncError(`${label}: the end marker appears before the start marker.`);
  }
  return { start, end: end + endMarker.length };
}

/**
 * 管理ブロックを 1 回だけ差し替える。ブロックが無い file は insert に委ねる。
 * 以前の実装は自分を再帰呼び出しして見つかった分だけブロックを剥がしていたので、
 * 壊れた file を黙って作り直し、その過程で手書きの本文を巻き込んでいた。
 */
export function replaceManagedBlock(content, { startMarker, endMarker, block, insert, label }) {
  const found = findManagedBlock(content, { startMarker, endMarker, label });
  if (!found) return insert(content, block);
  return `${content.slice(0, found.start)}${block}${content.slice(found.end)}`;
}

/** target が root そのものか、root の下にあるか。 */
export function insideRoot(root, target) {
  const rel = relative(root, target);
  if (rel === '') return true;
  if (isAbsolute(rel)) return false;
  // ..hidden のような、2 文字目までが偶然一致するだけの名前を弾かない。
  return rel !== '..' && !rel.startsWith(`..${sep}`);
}

function canonical(path, label) {
  try {
    return realpathSync(path);
  } catch (error) {
    throw new DocsSyncError(`${label}: cannot resolve ${path}: ${error.message}`);
  }
}

/** 読み込み元の canonical path。root の外へ出る symlink は拒否する。 */
export function resolveReadPath(path, root, label) {
  const real = canonical(path, label);
  if (!insideRoot(root, real)) {
    throw new DocsSyncError(`${label}: ${path} resolves to ${real}, which is outside ${root}.`);
  }
  return real;
}

/**
 * 書き込み先の canonical path。親 directory を realpath で確かめたうえで、
 * 許可 root の内側にあり、かつ target 自体が symlink でないことを要求する。
 * symlink を許すと、atomic rename は root の外の file を置き換えるか、link を
 * 黙って壊すかのどちらかになる。
 */
export function prepareWritePath(path, root, label) {
  const directory = canonical(dirname(path), label);
  if (!insideRoot(root, directory)) {
    throw new DocsSyncError(
      `${label}: the directory of ${path} resolves to ${directory}, which is outside ${root}.`,
    );
  }
  const target = join(directory, basename(path));
  let stats = null;
  try {
    stats = lstatSync(target);
  } catch {
    stats = null;
  }
  if (stats?.isSymbolicLink()) {
    throw new DocsSyncError(
      `${label}: ${target} is a symlink; refusing to write through it.`,
    );
  }
  if (stats && !stats.isFile()) {
    throw new DocsSyncError(`${label}: ${target} is not a regular file.`);
  }
  return target;
}

/**
 * 同じ directory へ一時 file を書いてから rename する。途中で落ちても、
 * 半分だけ書かれた file が次の実行で documentation として読み戻されない。
 */
export function writeFileAtomic(target, content) {
  const temporary = join(
    dirname(target),
    `.${basename(target)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );
  try {
    writeFileSync(temporary, content);
    renameSync(temporary, target);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

// table cell に入る text で意味を持つ文字。実体参照にすると、描画は元の文字の
// ままで、Markdown parser にも Vue compiler にも構文として見えなくなる。
//
// & は自分が書き出す実体参照と混ざらないよう最初に写す。HTML の山括弧、cell の
// 区切りである縦棒、inline Markdown の記号、Vue の波括弧をまとめて写す。
const MARKDOWN_ESCAPES = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['|', '&#124;'],
  ['`', '&#96;'],
  ['{', '&#123;'],
  ['}', '&#125;'],
  ['[', '&#91;'],
  [']', '&#93;'],
  ['*', '&#42;'],
  ['_', '&#95;'],
  ['\\', '&#92;'],
]);

/** text を Markdown 本文へそのまま置ける形に写す。1 文字ずつ見るので順序の罠がない。 */
export function escapeMarkdownText(text) {
  let escaped = '';
  for (const character of text) escaped += MARKDOWN_ESCAPES.get(character) ?? character;
  return escaped;
}

/**
 * 表のセルに入れる値。空白を畳んでから escape する。畳まないと、複数行の
 * 文字列連結や条件式が改行のところで表を切り、以降が本文として描画される。
 */
export function tableCell(text) {
  return escapeMarkdownText(text.replace(/\s+/g, ' ').trim());
}

/**
 * code block を開く backtick 列。中身に現れる最長の backtick 列より 1 つ長くする。
 * 固定長の fence は、閉じ fence を含む文字列 literal を書いた source で block を
 * 途中で閉じ、以降の宣言を本文として描画させる。
 */
export function fenceFor(code) {
  let longest = 0;
  for (const run of code.match(/`+/g) ?? []) longest = Math.max(longest, run.length);
  return '`'.repeat(Math.max(3, longest + 1));
}

// link の丸括弧は destination を途中で閉じる。空白と山括弧も同じく destination を
// 壊すので、percent encode して link の中に閉じ込める。
const URL_ESCAPES = new Map([
  ['(', '%28'],
  [')', '%29'],
  [' ', '%20'],
  ['<', '%3C'],
  ['>', '%3E'],
  ['"', '%22'],
]);

/** Markdown link の destination に置ける形へ写す。 */
export function linkUrl(url) {
  let encoded = '';
  for (const character of url) encoded += URL_ESCAPES.get(character) ?? character;
  return encoded;
}
