// docs の相対 link と site 絶対 link が解決するかを検査する。
//
// package を消した PR が索引の link を残す壊れ方を捕まえる (#1803 と #1873 が同じ形で
// 通過した)。生成物の同期を見る sync-library-doc-links.mjs とは別の関心なので module を
// 分け、生成 script と test の両方から同じ実装を呼ぶ。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

/**
 * fenced code block と inline code を落とす。
 *
 * TypeScript の index signature (`[k: string]: unknown;`) は reference-style link と
 * 同じ形をしているため、code を残すと API reference が丸ごと誤検出になる (実測で 7 件)。
 */
function stripCode(content) {
  return content
    .replace(/^([ \t]*)(```|~~~)[^\n]*\n[\s\S]*?\n[ \t]*\2[^\n]*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

/**
 * markdown と HTML の link destination を列挙する。
 *
 * 1 記法だけを見ると、別記法で書いた壊れた link がそのまま通る。実測で inline title 付き /
 * angle-bracket / reference-style / `<a href>` の 4 形が素通りしていた。
 */
function linkTargets(raw) {
  const content = stripCode(raw);
  const targets = [];
  // inline と image。`(<...>)` と末尾 title (`"..."`) を許す。
  for (const match of content.matchAll(/!?\[[^\]]*\]\(\s*<?([^)<>\s]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    targets.push(match[1]);
  }
  // reference 定義 (`[label]: ./path`)。
  for (const match of content.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s<>]+)>?/gm)) {
    targets.push(match[1]);
  }
  // 生 HTML の a タグ。VitePress は markdown 中の HTML をそのまま出す。
  for (const match of content.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    targets.push(match[1]);
  }
  return targets;
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

    // site 絶対 path は docs/ を根とする。相対 path は file の位置から解く。
    const absolute = decoded.startsWith('/')
      ? join(docsRoot, decoded)
      : join(fromDirectory, decoded);

    // 公開されるのは docs/ の中だけ。repo 内でも外に出た link は解決とみなさない。
    const fromDocs = relative(docsRoot, absolute);
    if (fromDocs === '..' || fromDocs.startsWith(`..${sep}`)) return false;

    if (decoded.endsWith('/')) return existsCaseExact(join(absolute, 'index.md'));
    if (existsCaseExact(`${absolute}.md`)) return true;
    if (existsCaseExact(join(absolute, 'index.md'))) return true;
    return existsCaseExact(absolute) && !isDirectory(absolute);
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
