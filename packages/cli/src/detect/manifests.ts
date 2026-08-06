/**
 * Read what a project depends on, without a TOML or go.mod parser.
 *
 * Detection only needs dependency names and, for Rust, the feature list on one
 * of them. Pulling in a full parser for that is more surface than the question
 * warrants, and both formats state dependencies in a shape a few lines of
 * regex handle: one entry per line, name first.
 *
 * The readers are deliberately incurious. Anything they cannot parse is absent
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
  const deps: Dependency[] = [];
  let inDeps = false;

  for (const raw of source.split('\n')) {
    const line = stripComment(raw, '#').trim();
    if (!line) continue;

    if (line.startsWith('[')) {
      // `[dependencies]`, `[dev-dependencies]`, `[build-dependencies]`, and the
      // target-specific `[target.'cfg(...)'.dependencies]`.
      inDeps = /^\[(?:[^\]]*\.)?(?:dev-|build-)?dependencies\]$/.test(line);
      continue;
    }
    if (!inDeps) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const name = line.slice(0, eq).trim().replace(/^["']|["']$/g, '');
    if (!name) continue;

    // `features = ["a", "b"]` on the same line. An entry spread over several
    // lines is not read; the corpus writes them inline and a missed feature
    // degrades to the weaker signal rather than to a wrong one.
    const rest = line.slice(eq + 1);
    const featureList = /features\s*=\s*\[([^\]]*)\]/.exec(rest);
    const features = featureList
      ? [...featureList[1]!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!)
      : [];

    deps.push({ name, features });
  }
  return deps;
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
