#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = join(repositoryRoot, 'packages');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const write = process.argv.includes('--write');
const startMarker = '<!-- kiwa-docs:start -->';
const endMarker = '<!-- kiwa-docs:end -->';

function siteLibraries() {
  const entries = [];
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    // kiwa-test-go / kiwa-test-py / kiwa-test-rs are standalone native
    // projects, not the similarly named TypeScript adapter packages.
    if (category.name === 'native-languages') continue;
    const categoryPath = join(librariesRoot, category.name);
    for (const library of readdirSync(categoryPath, { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      const libraryPath = join(categoryPath, library.name);
      const required = ['index.md', 'quickstart.md', 'how-to.md', 'reference.md'];
      if (!required.every((file) => existsSync(join(libraryPath, file)))) continue;
      const packagePath = join(packagesRoot, library.name);
      if (!existsSync(join(packagePath, 'package.json'))) continue;
      const packageJson = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf8'));
      entries.push({
        category: category.name,
        directory: library.name,
        packagePath,
        packageName: packageJson.name,
        docsPath: libraryPath,
      });
    }
  }
  return entries.sort((a, b) => a.packageName.localeCompare(b.packageName));
}

function linksFor(entry, fromDirectory) {
  const sourceDirectory = relative(fromDirectory, entry.docsPath) || '.';
  const publicBase = `https://cardene777.github.io/kiwa/libraries/${entry.category}/${entry.directory}/`;
  return [
    `- [概要](${publicBase})`,
    `- [はじめる](${publicBase}quickstart)`,
    `- [使い方](${publicBase}how-to)`,
    `- [リファレンス](${publicBase}reference)`,
    '',
    `編集元は [docs/libraries/${entry.category}/${entry.directory}](${sourceDirectory}/) です。`,
  ].join('\n');
}

function managedSection(entry, fromDirectory) {
  return [
    startMarker,
    '## Documentation',
    '',
    '公開ドキュメントを正本として管理しています。',
    '',
    linksFor(entry, fromDirectory),
    endMarker,
  ].join('\n');
}

function replaceManagedSection(content, section) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start !== -1 && end !== -1 && end > start) {
    const withoutPreviousSection = `${content.slice(0, start)}${content.slice(end + endMarker.length)}`;
    return replaceManagedSection(withoutPreviousSection, section);
  }
  const licenseHeading = content.match(/^## License\b/m);
  if (licenseHeading?.index !== undefined) {
    const before = content.slice(0, licenseHeading.index).replace(/\s*$/, '');
    const after = content.slice(licenseHeading.index).replace(/^\s*/, '');
    return `${before}\n\n${section}\n\n${after}`;
  }
  return `${content.replace(/\s*$/, '')}\n\n${section}\n`;
}

function expectedDocsReadme(entry) {
  const directory = join(entry.packagePath, 'docs');
  return [
    `# ${entry.packageName} documentation`,
    '',
    managedSection(entry, directory),
    '',
  ].join('\n');
}

function withSingleFinalNewline(content) {
  return `${content.replace(/\s*$/, '')}\n`;
}

const errors = [];
for (const entry of siteLibraries()) {
  const readmePath = join(entry.packagePath, 'README.md');
  const docsReadmePath = join(entry.packagePath, 'docs', 'README.md');
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : `# ${entry.packageName}\n`;
  const updatedReadme = withSingleFinalNewline(replaceManagedSection(readme, managedSection(entry, entry.packagePath)));
  const docsReadme = existsSync(docsReadmePath) ? readFileSync(docsReadmePath, 'utf8') : '';
  const updatedDocsReadme = withSingleFinalNewline(docsReadme
    ? replaceManagedSection(docsReadme, managedSection(entry, join(entry.packagePath, 'docs')))
    : expectedDocsReadme(entry));

  if (write) {
    if (readme !== updatedReadme) writeFileSync(readmePath, updatedReadme);
    if (docsReadme !== updatedDocsReadme) {
      const docsDirectory = join(entry.packagePath, 'docs');
      if (!existsSync(docsDirectory)) {
        mkdirSync(docsDirectory, { recursive: true });
      }
      writeFileSync(docsReadmePath, updatedDocsReadme);
    }
  } else {
    if (readme !== updatedReadme) errors.push(`README link is out of date: ${entry.packageName}`);
    if (docsReadme !== updatedDocsReadme) errors.push(`docs README link is out of date: ${entry.packageName}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation links are synchronized for ${siteLibraries().length} packages.`);
}
