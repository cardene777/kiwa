// Q1 = test taxonomy meta lint。
//
// SSOT = docs/concepts/test-taxonomy.md § dir 構成、 config = tests/release-smoke/test-taxonomy.config.json。
//
// 各 pkg が保持すべき test dir を宣言的に検査する。 現状 perf は fail 判定、 fidelity / skill /
// integration は warn only (phase 1)。 phase 2 で fail 化する予定。
//
// なぜ meta lint が要るか = 汎用大 tool の精度限界を認め domain-specific test を各 lib で書く方針
// (test-taxonomy.md 前提思想) を採ると、 各 lib で test 実装漏れが起き得る。 meta lint が dir 存在
// だけを chk して漏れを構造的に潰す役割。

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// Four levels: `tests/release-smoke/.vitest-dist/tests/` → repo root。
const ROOT = resolve(HERE, '..', '..', '..', '..');
const PACKAGES_DIR = join(ROOT, 'packages');
const CONFIG_PATH = join(ROOT, 'tests/release-smoke/test-taxonomy.config.json');

interface TaxonomyConfig {
  requirePerf: { exempt: string[] };
  requireFidelity: { mode: 'warn' | 'fail'; mockAdapterLibs: string[] };
  requireSkill: { mode: 'warn' | 'fail'; skillLibs: string[] };
  requireIntegration: { mode: 'warn' | 'fail'; integrationLibs: string[] };
}

function loadConfig(): TaxonomyConfig {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as TaxonomyConfig;
}

function listPackages(): string[] {
  return readdirSync(PACKAGES_DIR).filter((name) => {
    const pkgPath = join(PACKAGES_DIR, name);
    if (!statSync(pkgPath).isDirectory()) return false;
    return existsSync(join(pkgPath, 'package.json'));
  });
}

/** dir が存在し、 かつ 1 件以上の suffix マッチ file を含むか。 .ts と .tsx 両方を許容する。 */
function hasDirWithPattern(pkg: string, dir: string, baseSuffix: string): boolean {
  const dirPath = join(PACKAGES_DIR, pkg, 'tests', dir);
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return false;
  return dirContainsSuffix(dirPath, baseSuffix);
}

function dirContainsSuffix(dirPath: string, baseSuffix: string): boolean {
  const candidateSuffixes = [baseSuffix, `${baseSuffix}x`];
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const entryPath = join(dirPath, entry);
    const stat = statSync(entryPath);
    if (stat.isFile() && candidateSuffixes.some((suffix) => entry.endsWith(suffix))) return true;
    if (stat.isDirectory() && dirContainsSuffix(entryPath, baseSuffix)) return true;
  }
  return false;
}

const config = loadConfig();
const packages = listPackages();

describe('Q1 test taxonomy meta lint', () => {
  describe('perf test (全 lib 必須、 fail on missing)', () => {
    const target = packages.filter((pkg) => !config.requirePerf.exempt.includes(pkg));

    it.each(target)('%s に tests/perf/*.perf.ts が存在する', (pkg) => {
      const has = hasDirWithPattern(pkg, 'perf', '.perf.ts');
      if (!has) {
        throw new Error(
          `perf test missing for pkg "${pkg}". Add tests/perf/*.perf.ts, or add "${pkg}" to test-taxonomy.config.json requirePerf.exempt with justification.`,
        );
      }
      expect(has).toBe(true);
    });
  });

  describe('fidelity test (mock 提供 lib のみ、 phase 2 = fail)', () => {
    const target = config.requireFidelity.mockAdapterLibs.filter((pkg) => packages.includes(pkg));

    it.each(target)('%s に tests/fidelity/*.fidelity.test.ts が存在する', (pkg) => {
      const has = hasDirWithPattern(pkg, 'fidelity', '.fidelity.test.ts');
      if (!has) {
        throw new Error(
          `fidelity test missing for pkg "${pkg}". Add tests/fidelity/*.fidelity.test.ts, or remove "${pkg}" from test-taxonomy.config.json requireFidelity.mockAdapterLibs with justification.`,
        );
      }
      expect(has).toBe(true);
    });
  });

  describe('skill test (skill 実装 lib のみ、 phase 1 warn only)', () => {
    const target = config.requireSkill.skillLibs.filter((pkg) => packages.includes(pkg));

    it.each(target)('%s に tests/skill/*.skill.test.ts が存在する (warn)', (pkg) => {
      const has = hasDirWithPattern(pkg, 'skill', '.skill.test.ts');
      if (!has) {
        console.warn(
          `[test-taxonomy][warn] skill test missing for pkg "${pkg}". Add tests/skill/*.skill.test.ts after @kiwa-lab/skill-test (Q4) is available.`,
        );
      }
      expect(true).toBe(true);
    });
  });

  describe('integration test (依存 lib のみ、 phase 1 warn only)', () => {
    const target = config.requireIntegration.integrationLibs.filter((pkg) => packages.includes(pkg));

    it.each(target)('%s に tests/integration/*.integration.test.ts が存在する (warn)', (pkg) => {
      const has = hasDirWithPattern(pkg, 'integration', '.integration.test.ts');
      if (!has) {
        console.warn(
          `[test-taxonomy][warn] integration test missing for pkg "${pkg}". Add tests/integration/*.integration.test.ts (dir/file 命名統一)。`,
        );
      }
      expect(true).toBe(true);
    });
  });
});
