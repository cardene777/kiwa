import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface TemplateSpec {
  source: string;
  dest: string;
}

const TSCONFIG_TEMPLATE: TemplateSpec = { source: 'tsconfig.json.tpl', dest: 'tsconfig.json' };

const DEV_DEPENDENCIES = {
  '@kiwa-test/core': '^0.1.0',
  '@playwright/test': '^1.49.0',
  viem: '^2',
} as const;

const WITH_DEPLOY_TEMPLATES: ReadonlyArray<{ source: string; dest: string }> = [
  { source: 'with-deploy/prepare-env.ts.tpl', dest: 'tests/prepare-env.ts' },
  { source: 'with-deploy/global-setup.ts.tpl', dest: 'tests/global-setup.ts' },
  { source: 'with-deploy/global-teardown.ts.tpl', dest: 'tests/global-teardown.ts' },
  { source: 'with-deploy/fixture.ts.tpl', dest: 'tests/fixture.ts' },
];

export class InitConflictError extends Error {
  conflicts: string[];

  constructor(conflicts: string[]) {
    super(`Conflicting files: ${conflicts.join(', ')}. Use --force to overwrite.`);
    this.name = 'InitConflictError';
    this.conflicts = conflicts;
  }
}

export interface InitOptions {
  force: boolean;
  cwd: string;
  testDir?: string;
  configSuffix?: string;
  scriptKey?: string;
  withDeploy?: string;
}

export interface InitResult {
  created: string[];
  updated: string[];
  warnings: string[];
}

export function runInit(options: InitOptions): InitResult {
  const testDir = normalizeTestDir(options.testDir);
  const configFileName = resolveConfigFileName(options.configSuffix);
  const scriptKey = options.scriptKey ?? 'test:e2e';

  const templates: TemplateSpec[] = [
    { source: 'connect.spec.ts.tpl', dest: path.posix.join(testDir, 'connect.spec.ts') },
    { source: 'playwright.config.ts.tpl', dest: configFileName },
  ];

  const conflicts: string[] = [];

  for (const template of templates) {
    const target = path.join(options.cwd, template.dest);
    if (fs.existsSync(target)) {
      conflicts.push(template.dest);
    }
  }

  if (options.withDeploy !== undefined) {
    for (const template of WITH_DEPLOY_TEMPLATES) {
      const target = path.join(options.cwd, template.dest);
      if (fs.existsSync(target)) {
        conflicts.push(template.dest);
      }
    }
  }

  if (conflicts.length > 0 && !options.force) {
    throw new InitConflictError(conflicts);
  }

  const created: string[] = [];
  const createdDirs: string[] = [];
  const warnings: string[] = [];

  try {
    for (const template of templates) {
      const source = resolveTemplatePath(template.source);
      const destination = path.join(options.cwd, template.dest);
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        createdDirs.push(destDir);
      }
      let content = fs.readFileSync(source, 'utf8');
      if (template.source === 'playwright.config.ts.tpl') {
        content = applyConfigTemplate(content, testDir);
      }
      fs.writeFileSync(destination, content, 'utf8');
      created.push(template.dest);
    }

    if (options.withDeploy !== undefined) {
      const foundryRel = normalizeFoundryRelPath(options.withDeploy);
      for (const template of WITH_DEPLOY_TEMPLATES) {
        const source = resolveTemplatePath(template.source);
        const destination = path.join(options.cwd, template.dest);
        const destDir = path.dirname(destination);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
          createdDirs.push(destDir);
        }
        let content = fs.readFileSync(source, 'utf8');
        content = content.replace(/\{\{FOUNDRY_PATH\}\}/g, foundryRel);
        fs.writeFileSync(destination, content, 'utf8');
        created.push(template.dest);
      }
    }
  } catch (error) {
    rollback(options.cwd, created, createdDirs);
    throw error;
  }

  const updated: string[] = [];
  const packageJsonPath = path.join(options.cwd, 'package.json');
  const tsconfigPath = path.join(options.cwd, TSCONFIG_TEMPLATE.dest);

  if (fs.existsSync(packageJsonPath)) {
    try {
      const raw = fs.readFileSync(packageJsonPath, 'utf8');
      const indent = detectIndent(raw);
      const packageJson = JSON.parse(raw) as Record<string, unknown>;

      const scripts = (packageJson.scripts ?? {}) as Record<string, string>;
      let modified = false;
      if (scripts[scriptKey] === undefined) {
        scripts[scriptKey] =
          configFileName === 'playwright.config.ts'
            ? 'playwright test'
            : `playwright test --config=${configFileName}`;
        modified = true;
      }
      packageJson.scripts = scripts;

      const devDependencies = (packageJson.devDependencies ?? {}) as Record<string, string>;
      for (const [name, version] of Object.entries(DEV_DEPENDENCIES)) {
        if (devDependencies[name] === undefined) {
          devDependencies[name] = version;
          modified = true;
        }
      }
      packageJson.devDependencies = devDependencies;

      if (modified) {
        fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, indent)}\n`, 'utf8');
        updated.push('package.json');
      }
    } catch (error) {
      rollback(options.cwd, created, createdDirs);
      throw error;
    }
  }

  if (fs.existsSync(tsconfigPath)) {
    const strict = detectTsconfigStrict(tsconfigPath);
    if (strict === false) {
      warnings.push(
        'Existing tsconfig.json has "strict": false. kiwa init did not modify it.',
      );
    }
  } else {
    try {
      const source = resolveTemplatePath(TSCONFIG_TEMPLATE.source);
      fs.writeFileSync(tsconfigPath, fs.readFileSync(source, 'utf8'), 'utf8');
      created.push(TSCONFIG_TEMPLATE.dest);
    } catch (error) {
      rollback(options.cwd, created, createdDirs);
      throw error;
    }
  }

  return { created, updated, warnings };
}

function normalizeTestDir(value: string | undefined): string {
  if (value === undefined || value === '') {
    return 'e2e';
  }
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  if (normalized === '' || normalized.startsWith('/') || normalized.includes('..')) {
    throw new Error(
      `kiwa init: --testDir must be a relative path inside the project, got "${value}"`,
    );
  }
  return normalized;
}

function resolveConfigFileName(suffix: string | undefined): string {
  if (suffix === undefined || suffix === '') {
    return 'playwright.config.ts';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(suffix)) {
    throw new Error(
      `kiwa init: --config-suffix must match [a-zA-Z0-9_-]+, got "${suffix}"`,
    );
  }
  return `playwright.${suffix}.config.ts`;
}

function applyConfigTemplate(content: string, testDir: string): string {
  return content.replace(/testDir:\s*'[^']+'/, `testDir: '${toPosix(testDir).replace(/^\.\//, './')}'`)
    .replace(/testDir:\s*"[^"]+"/, `testDir: "${toPosix(testDir).replace(/^\.\//, './')}"`)
    .replace(/testDir:\s*'\.\/e2e'/, `testDir: '${prefixWithDot(testDir)}'`);
}

function prefixWithDot(p: string): string {
  if (p.startsWith('./') || p.startsWith('/')) return p;
  return `./${p}`;
}

function toPosix(p: string): string {
  return prefixWithDot(p.replace(/\\/g, '/'));
}

function normalizeFoundryRelPath(value: string): string {
  if (value === '' || value === undefined) {
    throw new Error('kiwa init: --with-deploy requires a foundry project path');
  }
  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '');
  if (path.isAbsolute(normalized)) {
    throw new Error(
      `kiwa init: --with-deploy must be a relative path, got absolute "${value}"`,
    );
  }
  return normalized;
}

function rollback(cwd: string, created: string[], createdDirs: string[]): void {
  for (const relativePath of created) {
    const target = path.join(cwd, relativePath);
    if (fs.existsSync(target)) {
      try {
        fs.unlinkSync(target);
      } catch {
        // best-effort rollback; ignore errors so original throw surfaces
      }
    }
  }
  const sortedDirs = [...createdDirs].sort((a, b) => b.length - a.length);
  for (const dir of sortedDirs) {
    try {
      fs.rmdirSync(dir);
    } catch {
      // dir was not empty or already removed; ignore
    }
  }
}

function detectIndent(raw: string): number | string {
  const lines = raw.split('\n');

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    const tabMatch = line.match(/^(\t+)/);
    if (tabMatch?.[1]) {
      return '\t';
    }

    const spaceMatch = line.match(/^( +)/);
    if (spaceMatch?.[1]) {
      return spaceMatch[1].length;
    }
  }

  return 2;
}

function resolveTemplatePath(source: string): string {
  const candidates = [
    fileURLToPath(new URL(`../templates/${source}`, import.meta.url)),
    fileURLToPath(new URL(`./templates/${source}`, import.meta.url)),
    fileURLToPath(new URL(`../../../src/templates/${source}`, import.meta.url)),
    fileURLToPath(new URL(`../src/templates/${source}`, import.meta.url)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Template not found: ${source}`);
}

function detectTsconfigStrict(tsconfigPath: string): boolean | undefined {
  try {
    const raw = fs.readFileSync(tsconfigPath, 'utf8');
    const sanitized = stripJsonComments(raw);
    const parsed = JSON.parse(sanitized) as {
      compilerOptions?: { strict?: unknown };
    };
    if (!parsed.compilerOptions || !('strict' in parsed.compilerOptions)) {
      return undefined;
    }
    if (parsed.compilerOptions.strict === true) {
      return true;
    }
    if (parsed.compilerOptions.strict === false) {
      return false;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function stripJsonComments(raw: string): string {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}
