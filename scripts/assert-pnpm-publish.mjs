#!/usr/bin/env node
/**
 * Refuse to publish through `npm publish`.
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
      'Use pnpm, which rewrites the ranges to concrete versions:',
      '',
      '    pnpm publish --filter <package> --access public --no-git-checks',
      '',
      `(detected user agent: ${agent || '<empty>'})`,
      '',
    ].join('\n'),
  );
  process.exit(1);
}
