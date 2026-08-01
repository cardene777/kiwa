#!/usr/bin/env node
/**
 * Refuse to publish through `npm publish`, or from outside the root `release`.
 *
 * ## Why not npm
 *
 * Every workspace package declares its siblings with the `workspace:*` protocol.
 * `pnpm publish` rewrites those ranges to concrete versions in the tarball it
 * uploads. `npm publish` does not: it ships `"@kiwa-lab/core": "workspace:*"`
 * verbatim, and any consumer running `npm install` fails with
 * EUNSUPPORTEDPROTOCOL before a single file is downloaded.
 *
 * That failure is invisible to the publisher — `npm publish` reports success —
 * so this guard runs as `prepublishOnly` and stops the upload instead.
 *
 * pnpm advertises itself in npm_config_user_agent; npm does not mention pnpm.
 *
 * ## Why only through the root `release`
 *
 * `tsup`'s `clean` is off in every package (#1741 / #1724), so `dist/` can hold
 * output that the current build no longer produces. Removing it is the job of
 * `scripts/clean-dist.mjs`, which runs at the head of the root `release`.
 *
 * `pnpm publish --filter <package>` skips that step entirely, and every package
 * declares `files: ["dist"]` — whatever is in `dist/` goes into the tarball. So
 * the guard also requires the marker that `release` sets. Publishing has one
 * entrance (#1750).
 */
const agent = process.env.npm_config_user_agent ?? '';

if (!agent.includes('pnpm')) {
  const pkg = process.env.npm_package_name ?? 'this package';
  process.stderr.write(
    [
      '',
      `Refusing to publish ${pkg} through npm.`,
      '',
      'This package depends on workspace siblings via the `workspace:*` protocol.',
      '`npm publish` uploads that protocol verbatim, producing a package that',
      'cannot be installed:',
      '',
      '    npm error code EUNSUPPORTEDPROTOCOL',
      '    npm error Unsupported URL Type "workspace:": workspace:*',
      '',
      'Use pnpm, which rewrites the ranges to concrete versions. Publish from',
      'the repository root so the stale-output cleanup runs first:',
      '',
      '    pnpm release',
      '',
      `(detected user agent: ${agent || '<empty>'})`,
      '',
    ].join('\n'),
  );
  process.exit(1);
}

if (process.env.KIWA_RELEASE !== '1') {
  const pkg = process.env.npm_package_name ?? 'this package';
  process.stderr.write(
    [
      '',
      `Refusing to publish ${pkg} outside the root release.`,
      '',
      '`tsup` runs without `clean`, so `dist/` can still hold output that the',
      'current build no longer produces (#1741 / #1724). `files: ["dist"]` puts',
      'whatever is there into the tarball.',
      '',
      '`scripts/clean-dist.mjs` removes it, and it only runs at the head of the',
      'root `release`. Publishing a single package directly skips it.',
      '',
      '    pnpm release',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
