// docs の相対 link と site 絶対 link が解決するかを検査する。
//
// package を消した PR が索引の link を残す壊れ方を捕まえる (#1803 と #1873 が同じ形で
// 通過した)。生成物の同期を見る sync-library-doc-links.mjs とは別の関心なので module を
// 分け、生成 script と test の両方から同じ実装を呼ぶ。
import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

/**
 * fenced code block と inline code を落とす。
 *
 * TypeScript の index signature (`[k: string]: unknown;`) は reference-style link と
 * 同じ形をしているため、code を残すと API reference が丸ごと誤検出になる (実測で 7 件)。
 *
 * 行単位の状態機械で追う。正規表現で開始行と終了行を対にすると、CommonMark では
 * fence ではない 4 space 字下げの ``` を開始とみなし、後続の本物の fence と対にして
 * 間の正当な link を消す (実測で dead link 1 件が消えた)。fence とみなすのは字下げ
 * 3 space までで、閉じるのは同種かつ同じ長さ以上の行に限る。
 */
function stripCode(content) {
  const lines = content.split('\n');
  const stripped = [];
  let fence = null;

  for (const line of lines) {
    if (fence) {
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      stripped.push('');
      continue;
    }
    const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    // backtick fence の info string に backtick は置けない (CommonMark)。
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      fence = { char: open[1][0], length: open[1].length };
      stripped.push('');
      continue;
    }
    stripped.push(line);
  }

  // 閉じない fence は文書末まで code として扱う (CommonMark と同じ)。
  return stripped.join('\n').replace(/`[^`\n]*`/g, '');
}

// inline と image。angle-bracket destination と、3 形の title (`"..."` / `'...'` /
// `(...)`) を許す。title 記法を 1 形しか見ないと、別記法で書いた壊れた link が通る。
const INLINE_LINK =
  /!?\[[^\]]*\]\(\s*(?:<([^>\n]*)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
// reference 定義 (`[label]: ./path`)。字下げは 3 space まで。
const REFERENCE_LINK = /^ {0,3}\[[^\]]+\]:\s*<?([^\s<>]+)>?/gm;
// 生 HTML。VitePress は markdown 中の HTML をそのまま出すため、引用符なしの属性値も届く。
const HTML_ATTRIBUTE =
  /<(?:a|img)\b[^>]*?\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

/**
 * markdown と HTML の link destination を列挙する。
 *
 * 1 記法だけを見ると、別記法で書いた壊れた link がそのまま通る。実測で title 付き
 * inline (3 形) / angle-bracket / reference 定義 / 生 HTML の a と img が素通りしていた。
 */
function linkTargets(raw) {
  const content = stripCode(raw);
  const targets = [];
  for (const match of content.matchAll(INLINE_LINK)) targets.push(match[1] ?? match[2]);
  for (const match of content.matchAll(REFERENCE_LINK)) targets.push(match[1]);
  for (const match of content.matchAll(HTML_ATTRIBUTE)) {
    targets.push(match[1] ?? match[2] ?? match[3]);
  }
  return targets.filter(Boolean);
}

/** scheme 付き (http: / mailto:) と protocol-relative は repo の外なので見ない。 */
function isExternal(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');
}

/**
 * 大文字小文字を区別して実体を確かめる。
 *
 * macOS の APFS は既定で case-insensitive なので `existsSync` は `Quickstart.md` を
 * `quickstart.md` として通す (実測)。公開先の filesystem は case-sensitive なため、
 * 手元で通って公開後に 404 になる。segment ごとに親の一覧と完全一致を見る。
 *
 * repositoryRoot の外に出た path は探索せず false を返すので、境界検査を兼ねる。
 */
function makeExistsCaseExact(repositoryRoot) {
  // 同じ directory を link の数だけ読み直さない。
  const listings = new Map();
  const namesOf = (directory) => {
    let names = listings.get(directory);
    if (names) return names;
    try {
      names = new Set(readdirSync(directory));
    } catch {
      names = new Set();
    }
    listings.set(directory, names);
    return names;
  };

  return (absolutePath) => {
    const rel = relative(repositoryRoot, absolutePath);
    if (rel === '') return true;
    if (rel === '..' || rel.startsWith(`..${sep}`)) return false;
    let current = repositoryRoot;
    for (const segment of rel.split(sep)) {
      if (!namesOf(current).has(segment)) return false;
      current = join(current, segment);
      // readdirSync と statSync は symlink を追うため、docs 内の symlink が repo の外を
      // 指していると外部の実在 file が有効扱いになる。段ごとに実体を確かめる。
      // docs/public/images のような repo 内の symlink は通す (実際に使われている)。
      try {
        if (!lstatSync(current).isSymbolicLink()) continue;
        const real = relative(repositoryRoot, realpathSync(current));
        if (real === '..' || real.startsWith(`..${sep}`)) return false;
      } catch {
        return false;
      }
    }
    return true;
  };
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * docs/libraries 配下の link を検査し、解決しないものを列挙する。
 *
 * 解決規則は VitePress に合わせる。末尾 slash と directory は `index.md` を要求し、
 * 拡張子なしは `<path>.md` を見る。directory が在るだけでは解決とみなさない
 * (`index.md` の無い directory への link は公開後 404 になる)。
 *
 * @param {{repositoryRoot: string, docsRoot: string, scanRoot: string}} roots
 * @returns {string[]} 解決しない link の説明行。空配列なら破れ無し。
 */
export function deadDocumentLinks({ repositoryRoot, docsRoot, scanRoot }) {
  const existsCaseExact = makeExistsCaseExact(repositoryRoot);
  const dead = [];

  const resolves = (fromDirectory, target) => {
    const [pathPart] = target.split(/[#?]/);
    // 同一 file 内の anchor だけの link。anchor の実在検証は別の関心。
    if (!pathPart) return true;

    // 生成側は directory 名を percent encode して埋めるので、戻してから実体を見る。
    let decoded = pathPart;
    try {
      decoded = decodeURIComponent(pathPart);
    } catch {
      // 壊れた escape は生の文字列で照合する。解決できなければ dead になる。
    }

    // site 絶対 path は docs/ を根とする。VitePress は docs/public/ の中身を site root へ
    // 出すため、docs/ 直下で解決しない時は public/ も見る (画像がここに置かれている)。
    // 相対 path は file の位置から解く。
    const candidates = decoded.startsWith('/')
      ? [join(docsRoot, decoded), join(docsRoot, 'public', decoded)]
      : [join(fromDirectory, decoded)];

    for (const absolute of candidates) {
      // 公開されるのは docs/ の中だけ。repo 内でも外に出た link は解決とみなさない。
      const fromDocs = relative(docsRoot, absolute);
      if (fromDocs === '..' || fromDocs.startsWith(`..${sep}`)) continue;

      if (decoded.endsWith('/')) {
        if (existsCaseExact(join(absolute, 'index.md'))) return true;
        continue;
      }
      if (existsCaseExact(`${absolute}.md`)) return true;
      if (existsCaseExact(join(absolute, 'index.md'))) return true;
      if (existsCaseExact(absolute) && !isDirectory(absolute)) return true;
    }
    return false;
  };

  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      const content = readFileSync(entryPath, 'utf8');
      for (const target of linkTargets(content)) {
        if (isExternal(target)) continue;
        if (resolves(dirname(entryPath), target)) continue;
        dead.push(`dead link: ${relative(repositoryRoot, entryPath)} -> ${target}`);
      }
    }
  };

  walk(scanRoot);
  return dead.sort();
}
