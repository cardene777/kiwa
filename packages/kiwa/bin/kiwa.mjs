#!/usr/bin/env node
/**
 * Thin entry point for `npx kiwa`.
 *
 * Every command lives in @kiwa-lab/cli. This package exists so that the short,
 * unscoped `kiwa` name resolves to the same binary, letting users type
 * `npx kiwa init` instead of `npx @kiwa-lab/cli init`.
 *
 * @kiwa-lab/cli declares no `exports` map, so its internal path is reachable
 * through the legacy resolution rules. Resolving explicitly (rather than
 * importing the bare specifier) keeps the delegation obvious at the call site.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let cliEntry;
try {
  cliEntry = require.resolve('@kiwa-lab/cli/dist/index.js');
} catch (cause) {
  const message =
    'kiwa could not locate @kiwa-lab/cli. Reinstall the package, or install ' +
    '@kiwa-lab/cli directly and run it as `kiwa`.';
  throw new Error(message, { cause });
}

await import(cliEntry);
