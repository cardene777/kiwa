/**
 * Whether a script is being run rather than imported.
 *
 * Compare resolved paths, not URL strings. The form this replaces —
 * `import.meta.url === ` + "`file://${process.argv[1]}`" — fails in two cases,
 * and both end the same way: the guard does not fire, the script exits 0 having
 * done nothing, and a gate that never ran reads as a gate that passed.
 *
 *   encoding  a directory with a space gives `…/kiwa review/…` on one side and
 *             `…/kiwa%20review/…` on the other
 *   symlink   reaching the script through a link gives the link path on one
 *             side and the real path on the other. macOS resolves `/tmp` to
 *             `/private/tmp`, so this is the ordinary case, not the exotic one
 *
 * `rebuild-plugin-metadata.mjs` hit this first (a `--check` run that exited 0
 * without checking) and fixed it locally; #1955 hit it again in the mutation
 * runners. This module is that fix, in one place.
 *
 * A path that cannot be resolved answers "not the file being run", because a
 * broken invocation must not run a gate's side effects. It says so on stderr
 * first: silence is the property this whole module exists to remove, and
 * "resolved to nothing" is exactly the state that looked like success before.
 *
 * @param {string | undefined} argv1 `process.argv[1]` from the calling script.
 * @param {string} metaUrl `import.meta.url` from the calling script.
 * @param {(message: string) => void} [warn] where the unresolvable case reports.
 * @returns {boolean} true when the two name the same file.
 */
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMainModule(argv1, metaUrl, warn = (message) => process.stderr.write(message)) {
  if (!argv1) return false;
  try {
    return realpathSync(fileURLToPath(metaUrl)) === realpathSync(argv1);
  } catch (error) {
    warn(
      `is-main-module: cannot resolve ${argv1} or ${metaUrl} (${error.message}); ` +
        'treating this as an import, so nothing will run.\n',
    );
    return false;
  }
}
