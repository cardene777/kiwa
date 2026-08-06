/**
 * Read what a project depends on, without a TOML or go.mod parser.
 *
 * Detection needs dependency names and, for Rust, the feature list on one of
 * them. A full parser is more surface than that warrants — but "a few lines of
 * regex" was too little. Review found three real forms the first version got
 * wrong: `[dev-dependencies.kiwa-test-rs]` as its own table, features spread
 * over several lines, and `// indirect` entries in `go.mod`. Each one either
 * lost the framework feature or invented a dependency the project does not use.
 *
 * So the Cargo side reads sections rather than lines and tracks brace depth,
 * which covers the forms above. What it still does not cover, deliberately:
 * `workspace = true` inheritance (the feature lives in another file), and
 * `Cargo.toml` workspace members (`scan` does not read them). Both make
 * detection report less, never something wrong.
 *
 * The readers are incurious by design. Anything they cannot parse is absent
 * rather than an error — a malformed manifest should make `--detect` report
 * nothing, not abort the command a user ran for a different reason.
 */

/** A dependency as the manifest states it. */
export interface Dependency {
  name: string;
  /** Cargo features, when the entry carries them. Empty for every other format. */
  features: string[];
}

/**
 * Strip comments so a commented-out dependency is not read as a real one.
 *
 * `go.mod` and `Cargo.toml` both use `//` or `#` to the end of a line, and both
 * corpora contain commented-out entries: the polyglot examples carry a
 * `// Use the in-repo kiwa-test-go module during development` note directly
 * above the require block.
 */
function stripComment(line: string, marker: string): string {
  const at = line.indexOf(marker);
  return at === -1 ? line : line.slice(0, at);
}

/**
 * Cargo dependencies, from every `[dependencies]`-like table.
 *
 * `[dev-dependencies]` matters as much as `[dependencies]` here: `kiwa-test-rs`
 * is a dev dependency, and it is the entry that says which layer the project is
 * actually testing.
 */
export function readCargoToml(source: string): Dependency[] {
  const deps = new Map<string, Dependency>();

  /** Merge, because one dependency can appear inline and as its own table. */
  const record = (name: string, features: string[]): void => {
    const existing = deps.get(name);
    if (existing) existing.features.push(...features.filter((f) => !existing.features.includes(f)));
    else deps.set(name, { name, features: [...features] });
  };

  const featuresIn = (text: string): string[] => {
    const list = /features\s*=\s*\[([^\]]*)\]/s.exec(text);
    return list ? [...list[1]!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!) : [];
  };

  // Sections, not lines. An entry can span several lines
  // (`axum = {\n  features = [...]\n}`) and a dependency can be its own table
  // (`[dev-dependencies.kiwa-test-rs]`), and neither survives reading one line
  // at a time — which is how the framework feature went missing.
  const lines = source.split('\n').map((l) => stripComment(l, '#'));
  let header: string | null = null;
  let body: string[] = [];

  const flush = (): void => {
    if (header === null) return;

    // `[dev-dependencies.kiwa-test-rs]` — the table *is* the dependency.
    const own = /^\[(?:[^\]]*\.)?(?:dev-|build-)?dependencies\.([^\].]+)\]$/.exec(header);
    if (own) {
      record(own[1]!.replace(/^["']|["']$/g, ''), featuresIn(body.join('\n')));
      header = null;
      body = [];
      return;
    }

    if (/^\[(?:[^\]]*\.)?(?:dev-|build-)?dependencies\]$/.test(header)) {
      // Entries inside the table, each possibly spanning lines.
      const text = body.join('\n');
      const entry = /^\s*([A-Za-z0-9_.-]+|"[^"]+"|'[^']+')\s*=\s*/gm;
      const starts: { name: string; from: number }[] = [];
      for (const m of text.matchAll(entry)) {
        // Only a `name =` at brace depth zero starts an entry. Inside braces it
        // is a field of the entry already open — `version` and `features` both
        // match the same shape, and counting them as entries split one
        // dependency into three.
        let depth = 0;
        for (const ch of text.slice(0, m.index!)) {
          if (ch === '{' || ch === '[') depth += 1;
          else if (ch === '}' || ch === ']') depth -= 1;
        }
        if (depth !== 0) continue;
        starts.push({ name: m[1]!.replace(/^["']|["']$/g, ''), from: m.index! + m[0].length });
      }
      for (let i = 0; i < starts.length; i += 1) {
        const value = text.slice(starts[i]!.from, starts[i + 1]?.from ?? text.length);
        record(starts[i]!.name, featuresIn(value));
      }
    }

    header = null;
    body = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      flush();
      header = trimmed;
      continue;
    }
    if (header !== null) body.push(line);
  }
  flush();

  return [...deps.values()];
}

/**
 * Module paths from `go.mod`, from both the block and single-line forms.
 *
 * `replace` directives are skipped. The polyglot examples all point
 * `kiwa-test-go` at the in-repo copy, and reading the replacement target would
 * report a filesystem path as a dependency.
 */
export function readGoMod(source: string): Dependency[] {
  const deps: Dependency[] = [];
  let inRequireBlock = false;

  for (const raw of source.split('\n')) {
    // `// indirect` marks a dependency the module graph pulled in, not one the
    // project imports. `go-gin-poc` carries 29 of them against 2 direct ones,
    // and a project that uses echo can hold gin transitively — detecting the
    // framework it does not use.
    //
    // The marker has to be read before comments are stripped, since stripping
    // is what removes it.
    if (/\/\/\s*indirect\s*$/.test(raw)) continue;

    const line = stripComment(raw, '//').trim();
    if (!line) continue;

    // This guard is currently redundant, and the comment says so rather than
    // claiming otherwise. Only `require (` opens a block and only `require `
    // prefixes a single line, so `replace` and `exclude` fall through to
    // `body === null` on both paths. Mutation confirms it: removing the line
    // changes no assertion, in either the single-line or the block form.
    //
    // It stays as a statement of intent — the reader should not have to derive
    // "replacements are not dependencies" from the absence of a branch — and it
    // holds if the block detection is ever widened to `(`-suffixed directives
    // in general.
    if (line.startsWith('replace') || line.startsWith('exclude')) continue;
    if (line === 'require (') {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line === ')') {
      inRequireBlock = false;
      continue;
    }

    const body = inRequireBlock ? line : line.startsWith('require ') ? line.slice(8) : null;
    if (body === null) continue;

    const name = body.split(/\s+/)[0];
    if (name && name.includes('/')) deps.push({ name, features: [] });
  }
  return deps;
}

/** npm dependencies across every field a project can declare them in. */
export function readPackageJson(source: string): Dependency[] {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(source) as Record<string, unknown>;
  } catch {
    return [];
  }
  const names = new Set<string>();
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const block = parsed[field];
    if (block && typeof block === 'object') {
      for (const name of Object.keys(block as Record<string, string>)) names.add(name);
    }
  }
  return [...names].map((name) => ({ name, features: [] }));
}
