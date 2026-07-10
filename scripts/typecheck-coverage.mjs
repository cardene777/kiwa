#!/usr/bin/env node
/**
 * Which test files does *nothing* typecheck?
 *
 * A package's tests are often excluded from `typecheck` and still compiled by its
 * `test` script — `tsc -p tsconfig.vitest.json && vitest run` is the pattern most
 * of this repository uses, and those tests are checked. The gap is the tests that
 * neither script compiles: Playwright transpiles its specs with esbuild and never
 * looks at a type, so a broken spec runs until the line that breaks.
 *
 * Reads no tsconfig by hand. `extends` chains, `include` defaults and `exclude`
 * interact, and `exclude` beats `include`. Ask `tsc --showConfig` which files it
 * would take, once per config any script hands it.
 *
 * Exits 1 when a test file is compiled by nothing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const AREAS = ['packages', 'examples', 'tests', 'promo'];

const subdirs = (dir) => {
  try {
    return readdirSync(dir)
      .filter((e) => !e.startsWith('.') && e !== 'node_modules')
      .filter((e) => {
        try {
          return statSync(join(dir, e)).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
};

function findPackages(dir, depth = 1) {
  if (depth > 3) return [];
  const out = [];
  const manifest = join(dir, 'package.json');
  if (existsSync(manifest)) {
    const json = JSON.parse(readFileSync(manifest, 'utf-8'));
    if (json.scripts) out.push({ dir, scripts: json.scripts });
  }
  for (const e of subdirs(dir)) out.push(...findPackages(join(dir, e), depth + 1));
  return out;
}

function testFiles(dir) {
  const hits = [];
  const walk = (d, depth) => {
    if (depth > 4) return;
    let entries = [];
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.(test|spec)\.tsx?$/.test(e.name)) hits.push(p);
    }
  };
  walk(dir, 1);
  return hits;
}

/** Every tsconfig any script hands to `tsc`, plus the default when it names none. */
function tsconfigsUsed(scripts) {
  const configs = new Set();
  for (const script of Object.values(scripts)) {
    if (typeof script !== 'string') continue;
    for (const call of script.split(/&&|\|\||;/)) {
      if (!/\btsc\b/.test(call)) continue;
      if (/--showConfig/.test(call)) continue;
      const explicit = call.match(/-p\s+(\S+)/);
      configs.add(explicit ? explicit[1] : 'tsconfig.json');
    }
    // `vue-tsc` / `nuxt typecheck` compile whatever the framework config names.
    if (/vue-tsc|nuxt typecheck|astro check/.test(script)) configs.add('tsconfig.json');
  }
  return [...configs];
}

function resolvedFiles(dir, config) {
  try {
    const out = execFileSync('npx', ['tsc', '-p', config, '--showConfig'], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 32 * 1024 * 1024,
    });
    return JSON.parse(out).files ?? [];
  } catch {
    return null;
  }
}

const packages = AREAS.flatMap((a) => (existsSync(join(ROOT, a)) ? findPackages(join(ROOT, a)) : []));
const gaps = [];
let checked = 0;

for (const { dir, scripts } of packages.sort((a, b) => a.dir.localeCompare(b.dir))) {
  const tests = testFiles(dir);
  if (tests.length === 0) continue;
  checked += 1;

  const covered = new Set();
  for (const config of tsconfigsUsed(scripts)) {
    if (!existsSync(join(dir, config))) continue;
    const files = resolvedFiles(dir, config);
    if (files === null) continue;
    for (const f of files) covered.add(join(dir, f));
  }

  const uncovered = tests.filter((t) => !covered.has(t));
  if (uncovered.length > 0) {
    gaps.push({ dir: relative(ROOT, dir), uncovered, total: tests.length, scripts: Object.keys(scripts) });
  }
}

console.log(`packages with test files: ${checked}`);
console.log(`packages whose tests nothing compiles: ${gaps.length}\n`);

for (const g of gaps) {
  console.log(`  ${g.dir}   ${g.uncovered.length}/${g.total}`);
  for (const f of g.uncovered.slice(0, 3)) console.log(`      ${relative(join(ROOT, g.dir), f)}`);
  if (g.uncovered.length > 3) console.log(`      ... and ${g.uncovered.length - 3} more`);
}

process.exit(gaps.length === 0 ? 0 : 1);
