import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

type InitModule = {
  InitConflictError: new (conflicts: string[]) => Error & { conflicts: string[] };
  runInit: (options: { force: boolean; cwd: string }) => {
    created: string[];
    updated: string[];
    warnings: string[];
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
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwa-init-'));
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
    expect(fs.existsSync(path.join(tempDir, 'tsconfig.json'))).toBe(true);
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toContain("from '@kiwa-test/core'");
    expect(readFile(tempDir, 'playwright.config.ts')).toContain('defineConfig');
    expect(readFile(tempDir, 'tsconfig.json')).toContain('"strict": true');
    expect(result.created).toEqual(
      expect.arrayContaining(['e2e/connect.spec.ts', 'playwright.config.ts', 'tsconfig.json']),
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
    expect(packageJson.devDependencies['@kiwa-test/core']).toBe('^0.1.0');
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
    expect(readFile(tempDir, 'e2e/connect.spec.ts')).toContain("from '@kiwa-test/core'");
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

  it('T-INIT-007 既存 scripts.test:e2e がある場合は保持する (上書きしない)', async () => {
    // Given
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      scripts: {
        'test:e2e': 'vitest run e2e',
      },
    });
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJson = readPackageJson(tempDir);

    // Then
    expect(packageJson.scripts['test:e2e']).toBe('vitest run e2e');
  });

  it('T-INIT-008 既存 devDependencies の version は保持する (上書きしない)', async () => {
    // Given
    seedPackageJson(tempDir, {
      name: 'host',
      version: '1.0.0',
      devDependencies: {
        '@playwright/test': '^1.48.0',
        viem: '^2.21.0',
      },
    });
    const { runInit } = await loadInitModule();

    // When
    runInit({ force: false, cwd: tempDir });
    const packageJson = readPackageJson(tempDir);

    // Then
    expect(packageJson.devDependencies['@playwright/test']).toBe('^1.48.0');
    expect(packageJson.devDependencies.viem).toBe('^2.21.0');
    expect(packageJson.devDependencies['@kiwa-test/core']).toBe('^0.1.0');
  });

  it('T-INIT-009 package.json が invalid JSON の場合は rollback して created file を残さない', async () => {
    // Given
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{ invalid json', 'utf8');
    const { runInit } = await loadInitModule();

    // When + Then
    expect(() => runInit({ force: false, cwd: tempDir })).toThrow();
    // template files should be removed by rollback
    expect(fs.existsSync(path.join(tempDir, 'e2e/connect.spec.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'tsconfig.json'))).toBe(false);
    // e2e dir should be removed if it was created by runInit
    expect(fs.existsSync(path.join(tempDir, 'e2e'))).toBe(false);
  });

  it('T-INIT-010 既存 tsconfig.json が strict=false の場合は warning を返し上書きしない', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(
      tempDir,
      'tsconfig.json',
      JSON.stringify(
        {
          compilerOptions: {
            strict: false,
            target: 'ES2020',
          },
        },
        null,
        2,
      ),
    );
    const { runInit } = await loadInitModule();

    const result = runInit({ force: false, cwd: tempDir });

    expect(result.warnings).toContain(
      'Existing tsconfig.json has "strict": false. kiwa init did not modify it.',
    );
    expect(readFile(tempDir, 'tsconfig.json')).toContain('"strict": false');
    expect(result.created).not.toContain('tsconfig.json');
  });

  it('T-INIT-011 --testDir 指定で spec を tests/dapp-e2e/ 配下に生成し playwright.config.ts も同 dir を指す', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    const result = runInit({ force: false, cwd: tempDir, testDir: 'tests/dapp-e2e' });

    expect(fs.existsSync(path.join(tempDir, 'tests/dapp-e2e/connect.spec.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'e2e/connect.spec.ts'))).toBe(false);
    expect(readFile(tempDir, 'playwright.config.ts')).toContain("testDir: './tests/dapp-e2e'");
    expect(result.created).toEqual(
      expect.arrayContaining(['tests/dapp-e2e/connect.spec.ts', 'playwright.config.ts']),
    );
  });

  it('T-INIT-012 --config-suffix 指定で playwright.kiwa.config.ts を生成し script は config 経由 playwright test を指す', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    runInit({
      force: false,
      cwd: tempDir,
      testDir: 'tests/kiwa',
      configSuffix: 'kiwa',
      scriptKey: 'test:kiwa',
    });

    expect(fs.existsSync(path.join(tempDir, 'playwright.kiwa.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'playwright.config.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'tests/kiwa/connect.spec.ts'))).toBe(true);

    const pkg = readPackageJson(tempDir);
    expect(pkg.scripts['test:kiwa']).toBe('playwright test --config=playwright.kiwa.config.ts');
    expect(pkg.scripts['test:e2e']).toBeUndefined();
  });

  it('T-INIT-013 --testDir に絶対 path / ../ を指定すると Error', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    expect(() => runInit({ force: false, cwd: tempDir, testDir: '/etc' })).toThrow(
      /relative path/,
    );
    expect(() => runInit({ force: false, cwd: tempDir, testDir: '../escape' })).toThrow(
      /relative path/,
    );
  });

  it('T-INIT-014 --config-suffix に [a-zA-Z0-9_-]+ 以外を指定すると Error', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    expect(() => runInit({ force: false, cwd: tempDir, configSuffix: 'bad/name' })).toThrow(
      /config-suffix/,
    );
  });

  it('T-INIT-015 --with-deploy 指定で tests/{prepare-env,global-setup,global-teardown,fixture}.ts を生成し FOUNDRY_PATH を埋め込む', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    const { runInit } = await loadInitModule();

    const result = runInit({
      force: false,
      cwd: tempDir,
      withDeploy: '../contract',
    });

    const generatedFiles = [
      'tests/prepare-env.ts',
      'tests/global-setup.ts',
      'tests/global-teardown.ts',
      'tests/fixture.ts',
    ];
    for (const file of generatedFiles) {
      expect(fs.existsSync(path.join(tempDir, file))).toBe(true);
      expect(result.created).toContain(file);
    }

    const prepareEnv = readFile(tempDir, 'tests/prepare-env.ts');
    expect(prepareEnv).toContain("const FOUNDRY_PATH = '../contract';");
    expect(prepareEnv).toContain("import { startAnvil, deployContract } from '@kiwa-test/core';");

    const fixture = readFile(tempDir, 'tests/fixture.ts');
    expect(fixture).toContain("import { dappE2eTest as baseTest } from '@kiwa-test/core';");
  });

  it('T-INIT-016 --with-deploy 既存 tests/prepare-env.ts と衝突したら InitConflictError', async () => {
    seedPackageJson(tempDir, { name: 'host', version: '1.0.0' });
    writeFile(tempDir, 'tests/prepare-env.ts', '// existing\n');
    const { InitConflictError, runInit } = await loadInitModule();

    let thrown: (Error & { conflicts: string[] }) | null = null;
    expect(() => {
      try {
        runInit({ force: false, cwd: tempDir, withDeploy: '../contract' });
      } catch (e) {
        thrown = e as Error & { conflicts: string[] };
        throw e;
      }
    }).toThrow(InitConflictError);
    expect(thrown?.conflicts).toContain('tests/prepare-env.ts');
  });
});
