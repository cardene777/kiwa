/**
 * Read what a project depends on.
 *
 * Detection needs dependency names, and `package.json` is the only manifest a
 * dependency can be read from — the two Solidity entries in
 * `docs/stack-signals.json` establish the language by their presence alone.
 *
 * The reader is incurious by design. Anything it cannot parse is absent rather
 * than an error — a malformed manifest should make `--detect` report nothing,
 * not abort the command a user ran for a different reason.
 */

/** A dependency as the manifest states it. */
export interface Dependency {
  name: string;
  /** Reserved for manifests that carry a feature list. Empty for npm. */
  features: string[];
  /**
   * The entry inherits from the workspace, so its feature list lives in another
   * file this reader does not open. The dependency is present; what it selects
   * is unknown, and callers must not fill that in with a default.
   */
  unresolved?: true;
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
