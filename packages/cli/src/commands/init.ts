import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATES = [
  { source: 'connect.spec.ts.tpl', dest: 'e2e/connect.spec.ts' },
  { source: 'playwright.config.ts.tpl', dest: 'playwright.config.ts' },
] as const;

const DEV_DEPENDENCIES = {
  '@dapp-e2e/core': '^0.1.0',
  '@playwright/test': '^1.49.0',
  viem: '^2',
} as const;

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
}

export interface InitResult {
  created: string[];
  updated: string[];
}

export function runInit(options: InitOptions): InitResult {
  const conflicts: string[] = [];

  for (const template of TEMPLATES) {
    const target = path.join(options.cwd, template.dest);
    if (fs.existsSync(target)) {
      conflicts.push(template.dest);
    }
  }

  if (conflicts.length > 0 && !options.force) {
    throw new InitConflictError(conflicts);
  }

  const created: string[] = [];

  for (const template of TEMPLATES) {
    const source = resolveTemplatePath(template.source);
    const destination = path.join(options.cwd, template.dest);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, fs.readFileSync(source, 'utf8'), 'utf8');
    created.push(template.dest);
  }

  const updated: string[] = [];
  const packageJsonPath = path.join(options.cwd, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    const indent = detectIndent(raw);
    const packageJson = JSON.parse(raw) as Record<string, unknown>;

    const scripts = (packageJson.scripts ?? {}) as Record<string, string>;
    scripts['test:e2e'] = 'playwright test';
    packageJson.scripts = scripts;

    const devDependencies = (packageJson.devDependencies ?? {}) as Record<string, string>;
    for (const [name, version] of Object.entries(DEV_DEPENDENCIES)) {
      devDependencies[name] = version;
    }
    packageJson.devDependencies = devDependencies;

    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, indent)}\n`, 'utf8');
    updated.push('package.json');
  }

  return { created, updated };
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
