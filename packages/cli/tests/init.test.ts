import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

type InitModule = {
  InitConflictError: new (conflicts: string[]) => Error & { conflicts: string[] };
  runInit: (options: { force: boolean; cwd: string }) => {
    created: string[];
    updated: string[];
  };
};

let tempDir = '';

function seedPackageJson(
  dir: string,
  content: Record<string, unknown>,
  indent: number | string = 2,
): void {
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    `${JSON.stringify(content, null, indent)}\n`,
    'utf8',
  );
}

function readPackageJson(dir: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as Record<
    string,
    any
  >;
}

function readFile(dir: string, relativePath: string): string {
  return fs.readFileSync(path.join(dir, relativePath), 'utf8');
}

function writeFile(dir: string, relativePath: string, content: string): void {
  fs.mkdirSync(path.dirname(path.join(dir, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(dir, relativePath), content, 'utf8');
}

async function loadInitModule(): Promise<InitModule> {
  return (await import('../src/commands/init.js')) as InitModule;
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dapp-e2e-init-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('runInit', () => {
  it('T-INIT-001 通常生成で e2e spec と playwright config を作成する', async () => {
    // Given
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    // When
    const result = runInit({ force: false, cwd: tempDir });

    // Then
    expect(fs.existsSync(path.join(tempDir, 'e2e', 'connect.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(true);
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toContain("from '@dapp-e2e/core'");
    expect(readFile(tempDir, 'playwright.config.ts')).toContain('defineConfig');
    expect(result.created).toEqual(
      expect.arrayContaining(['e2e/connect.spec.ts', 'playwright.config.ts']),
    );
  });

  it('T-INIT-002 package.json に scripts と devDependencies を merge 追加する', async () => {
    // Given
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      scripts: {
        build: 'echo build',
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    });
    const { runInit } = await loadInitModule();

    // When
    const result = runInit({ force: false, cwd: tempDir });
    const packageJson = readPackageJson(tempDir);

    // Then
    expect(packageJson.scripts['test:e2e']).toBe('playwright test');
    expect(packageJson.scripts.build).toBe('echo build');
    expect(packageJson.devDependencies['@dapp-e2e/core']).toBe('^0.1.0');
    expect(packageJson.devDependencies['@playwright/test']).toBe('^1.49.0');
    expect(packageJson.devDependencies.viem).toBe('^2');
    expect(packageJson.devDependencies.typescript).toBe('^5.0.0');
    expect(result.updated).toContain('package.json');
  });

  it('T-INIT-003 既存 spec と衝突した場合は force なしで InitConflictError を投げる', async () => {
    // Given
    const originalContent = '// existing spec\n';
    writeFile(tempDir, 'e2e/connect.spec.ts', originalContent);
    const { InitConflictError, runInit } = await loadInitModule();
    let thrownError: (Error & { conflicts: string[] }) | null = null;

    // When
    expect(() => {
      try {
        runInit({ force: false, cwd: tempDir });
      } catch (error) {
        thrownError = error as Error & { conflicts: string[] };
        throw error;
      }
    }).toThrow(InitConflictError);

    // Then
    expect(thrownError?.conflicts).toContain('e2e/connect.spec.ts');
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toBe(originalContent);
  });

  it('T-INIT-004 既存 file 衝突でも force=true なら template で上書きする', async () => {
    // Given
    writeFile(tempDir, 'e2e/connect.spec.ts', '// old\n');
    writeFile(tempDir, 'playwright.config.ts', '// old config\n');
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    // When
    expect(() => runInit({ force: true, cwd: tempDir })).not.toThrow();

    // Then
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toContain("from '@dapp-e2e/core'");
    expect(readFile(tempDir, 'playwright.config.ts')).toContain('defineConfig');
  });

  it('T-INIT-005 package.json 更新時に 2 space indent を維持する', async () => {
    // Given
    seedPackageJson(
      tempDir,
      {
        name: 'host',
        version: '1.0.0',
        scripts: {
          build: 'echo build',
        },
      },
      2,
    );
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJsonRaw = readFile(tempDir, 'package.json');

    // Then
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('  "'))).toBe(true);
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('\t'))).toBe(false);
  });

  it('T-INIT-006 package.json 更新時に tab indent を維持する', async () => {
    // Given
    seedPackageJson(
      tempDir,
      {
        name: 'host',
        version: '1.0.0',
        scripts: {
          build: 'echo build',
        },
      },
      '\t',
    );
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJsonRaw = readFile(tempDir, 'package.json');

    // Then
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('\t"'))).toBe(true);
    expect(packageJsonRaw.split('\n').some((line) => line.startsWith('  "'))).toBe(false);
  });
});
