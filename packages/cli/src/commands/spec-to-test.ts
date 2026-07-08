import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const TC_REGEX = /\bT-[A-Z0-9]+-\d+\b/g;
const HEADER_KEYS = [
  'id',
  'observation',
  'given',
  'when',
  'then',
  'priority',
  'automation',
  'mode',
  'route',
  'component',
  'topic',
];

interface ParsedRow {
  id: string;
  observation: string;
  given: string;
  when: string;
  then: string;
  priority: string;
  automation: string;
  mode: string;
  route?: string;
  component?: string;
  topic?: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseMetaLine(line: string): [string, string] | null {
  const match = line.match(/^[-*]\s+([A-Za-z][\w-]*)\s*[::]\s*(.+)$/);
  if (!match) return null;
  return [normalize(match[1] ?? ''), (match[2] ?? '').trim()];
}

function findTable(lines: string[]): { headerIdx: number; rows: string[] } | null {
  for (let i = 0; i < lines.length - 1; i += 1) {
    const header = lines[i];
    const divider = lines[i + 1];
    if (header && divider && header.includes('|') && /^\s*\|?\s*[-:]+/.test(divider)) {
      const rows: string[] = [];
      for (let j = i + 2; j < lines.length; j += 1) {
        const row = lines[j];
        if (!row || !row.includes('|') || row.trim().length === 0) break;
        rows.push(row);
      }
      return { headerIdx: i, rows };
    }
  }
  return null;
}

function splitRow(row: string): string[] {
  const trimmed = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

export interface ParsedSpec {
  module: string;
  layer: string;
  cases: ParsedRow[];
}

export function parseSpec(markdown: string, opts: { module?: string; defaultLayer?: string } = {}): ParsedSpec {
  const lines = markdown.split(/\r?\n/);
  let module = opts.module ?? '';
  let layer = opts.defaultLayer ?? 'unit';

  for (const line of lines) {
    const meta = parseMetaLine(line);
    if (!meta) continue;
    const [key, value] = meta;
    if (key === 'module' && !opts.module) module = value;
    else if (key === 'layer') layer = normalize(value);
  }

  const tableInfo = findTable(lines);
  if (!tableInfo) return { module, layer, cases: [] };

  const headerRow = lines[tableInfo.headerIdx];
  if (!headerRow) return { module, layer, cases: [] };

  const headers = splitRow(headerRow).map(normalize);
  const indices: Partial<Record<string, number>> = {};
  for (const key of HEADER_KEYS) {
    const idx = headers.indexOf(key);
    if (idx >= 0) indices[key] = idx;
  }

  const cases: ParsedRow[] = [];
  for (const row of tableInfo.rows) {
    const cells = splitRow(row);
    const get = (key: string): string => {
      const idx = indices[key];
      if (idx === undefined) return '';
      return cells[idx] ?? '';
    };
    const id = get('id');
    if (!id || id.startsWith('-')) continue;
    const parsed: ParsedRow = {
      id,
      observation: get('observation'),
      given: get('given'),
      when: get('when'),
      then: get('then'),
      priority: get('priority'),
      automation: normalize(get('automation')),
      mode: normalize(get('mode')),
    };
    const route = get('route');
    const component = get('component');
    const topic = get('topic');
    if (route) parsed.route = route;
    if (component) parsed.component = component;
    if (topic) parsed.topic = topic;
    cases.push(parsed);
  }
  return { module, layer, cases };
}

function escape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function methodFromWhen(when: string, fallback: string): string {
  const upper = when.toUpperCase();
  if (upper.startsWith('GET ')) return 'GET';
  if (upper.startsWith('POST ')) return 'POST';
  if (upper.startsWith('PUT ')) return 'PUT';
  if (upper.startsWith('DELETE ')) return 'DELETE';
  if (upper.startsWith('PATCH ')) return 'PATCH';
  return fallback.toUpperCase();
}

function generateApiTest(spec: ParsedSpec): string {
  const lines: string[] = [];
  lines.push(`import { afterEach, describe, expect, it } from 'vitest';`);
  lines.push(`import { setupApiServer, type ApiTestEnv } from '@kiwa/api';`);
  lines.push('');
  lines.push('const envs: ApiTestEnv[] = [];');
  lines.push('');
  lines.push('afterEach(async () => {');
  lines.push('  while (envs.length > 0) {');
  lines.push('    const env = envs.pop();');
  lines.push('    if (env) await env.stop();');
  lines.push('  }');
  lines.push('});');
  lines.push('');
  lines.push(`describe('${escape(spec.module)} (api)', () => {`);
  for (const c of spec.cases) {
    if (c.automation !== 'yes') continue;
    const mode = c.mode || 'live';
    const route = c.route || '/';
    const method = methodFromWhen(c.when, 'get');
    lines.push(`  it('${escape(c.id)} ${escape(c.observation)}', async () => {`);
    if (mode === 'mock') {
      lines.push(`    // mode=mock: provide mockHandlers in the real test`);
      lines.push(`    const env = await setupApiServer({ mode: 'mock', mockHandlers: [] });`);
    } else if (mode === 'hybrid') {
      lines.push(`    // mode=hybrid: provide app + mockHandlers in the real test`);
      lines.push(`    const env = await setupApiServer({ mode: 'hybrid', app: { kind: 'fetch', handler: async () => new Response('TODO') }, mockHandlers: [] });`);
    } else {
      lines.push(`    // mode=live: provide a real fetch handler in the real test`);
      lines.push(`    const env = await setupApiServer({ mode: 'live', app: { kind: 'fetch', handler: async () => new Response('TODO') } });`);
    }
    lines.push('    envs.push(env);');
    const methodLower = method.toLowerCase();
    if (methodLower === 'get' || methodLower === 'delete') {
      lines.push(`    const res = await env.request.${methodLower}('${escape(route)}');`);
    } else {
      lines.push(`    const res = await env.request.${methodLower}('${escape(route)}', {/* body */});`);
    }
    lines.push(`    // Expected: ${escape(c.then)}`);
    lines.push(`    expect(res.status).toBeDefined();`);
    lines.push(`  });`);
    lines.push('');
  }
  lines.push('});');
  return lines.join('\n');
}

function generateUiTest(spec: ParsedSpec): string {
  const lines: string[] = [];
  lines.push(`/// <reference types="vitest/globals" />`);
  lines.push(`import { afterEach, describe, expect, it } from 'vitest';`);
  lines.push(`import { setupComponentEnv, type UiTestEnv } from '@kiwa/ui';`);
  lines.push('');
  lines.push('const envs: UiTestEnv[] = [];');
  lines.push('');
  lines.push('afterEach(async () => {');
  lines.push('  while (envs.length > 0) {');
  lines.push('    const env = envs.pop();');
  lines.push('    if (env) await env.stop();');
  lines.push('  }');
  lines.push('});');
  lines.push('');
  lines.push(`describe('${escape(spec.module)} (ui)', () => {`);
  for (const c of spec.cases) {
    if (c.automation !== 'yes') continue;
    const mode = c.mode || 'render';
    const component = c.component || 'Component';
    lines.push(`  it('${escape(c.id)} ${escape(c.observation)}', async () => {`);
    lines.push(`    // TODO: import { ${component} } from './${component.toLowerCase()}.js';`);
    lines.push(`    const env = await setupComponentEnv({ mode: '${mode}', ui: <div /> });`);
    lines.push('    envs.push(env);');
    lines.push(`    // Given: ${escape(c.given)}`);
    lines.push(`    // When: ${escape(c.when)}`);
    lines.push(`    // Then: ${escape(c.then)}`);
    lines.push(`    expect(env.kind).toBeDefined();`);
    lines.push(`  });`);
    lines.push('');
  }
  lines.push('});');
  return lines.join('\n');
}

function generateDataTest(spec: ParsedSpec): string {
  const lines: string[] = [];
  lines.push(`import { afterEach, describe, expect, it } from 'vitest';`);
  lines.push(`import { createFakeClock, setupQueueEnv, type QueueTestEnv } from '@kiwa/data';`);
  lines.push('');
  lines.push('const envs: QueueTestEnv[] = [];');
  lines.push('');
  lines.push('afterEach(async () => {');
  lines.push('  while (envs.length > 0) {');
  lines.push('    const env = envs.pop();');
  lines.push('    if (env) await env.stop();');
  lines.push('  }');
  lines.push('});');
  lines.push('');
  lines.push(`describe('${escape(spec.module)} (data)', () => {`);
  for (const c of spec.cases) {
    if (c.automation !== 'yes') continue;
    const topic = (c.topic || '').toLowerCase();
    lines.push(`  it('${escape(c.id)} ${escape(c.observation)}', async () => {`);
    if (topic === 'cron') {
      lines.push(`    const clock = createFakeClock();`);
      lines.push(`    // Given: ${escape(c.given)}`);
      lines.push(`    // When: ${escape(c.when)}`);
      lines.push(`    // Then: ${escape(c.then)}`);
      lines.push(`    expect(clock.nowMs()).toBeGreaterThanOrEqual(0);`);
    } else {
      lines.push(`    const env = await setupQueueEnv({ mode: '${c.mode || 'mock'}' });`);
      lines.push('    envs.push(env);');
      lines.push(`    // Given: ${escape(c.given)}`);
      lines.push(`    // When: ${escape(c.when)}`);
      lines.push(`    // Then: ${escape(c.then)}`);
      lines.push(`    expect(env.client.size()).toBeGreaterThanOrEqual(0);`);
    }
    lines.push(`  });`);
    lines.push('');
  }
  lines.push('});');
  return lines.join('\n');
}

function generateCliTest(spec: ParsedSpec): string {
  const lines: string[] = [];
  lines.push(`import { afterEach, describe, expect, it } from 'vitest';`);
  lines.push(`import { expectExitCode, setupCliEnv, type CliTestEnv } from '@kiwa/cli-test';`);
  lines.push('');
  lines.push('const envs: CliTestEnv[] = [];');
  lines.push('');
  lines.push('afterEach(async () => {');
  lines.push('  while (envs.length > 0) {');
  lines.push('    const env = envs.pop();');
  lines.push('    if (env) await env.stop();');
  lines.push('  }');
  lines.push('});');
  lines.push('');
  lines.push(`describe('${escape(spec.module)} (cli)', () => {`);
  for (const c of spec.cases) {
    if (c.automation !== 'yes') continue;
    lines.push(`  it('${escape(c.id)} ${escape(c.observation)}', async () => {`);
    lines.push(`    const env = await setupCliEnv();`);
    lines.push('    envs.push(env);');
    lines.push(`    // Given: ${escape(c.given)}`);
    lines.push(`    // When: ${escape(c.when)}`);
    lines.push(`    // Then: ${escape(c.then)}`);
    lines.push(`    const result = await env.runCli({ cmd: 'true' });`);
    lines.push(`    expectExitCode(result, 0, expect as unknown as Parameters<typeof expectExitCode>[2]);`);
    lines.push(`  });`);
    lines.push('');
  }
  lines.push('});');
  return lines.join('\n');
}

export interface SpecToTestOptions {
  inPath: string;
  outPath: string;
  cwd: string;
  layer?: string;
}

export function runSpecToTest(opts: SpecToTestOptions): { module: string; layer: string; count: number; outPath: string } {
  const inPath = resolve(opts.cwd, opts.inPath);
  const outPath = resolve(opts.cwd, opts.outPath);
  if (!existsSync(inPath)) {
    throw new Error(`spec-to-test: input not found: ${inPath}`);
  }
  const md = readFileSync(inPath, 'utf8');
  const parseOpts: Parameters<typeof parseSpec>[1] = {};
  if (opts.layer) parseOpts.defaultLayer = opts.layer;
  const spec = parseSpec(md, parseOpts);
  const layer = (opts.layer ?? spec.layer).toLowerCase();
  let body: string;
  if (layer === 'api') body = generateApiTest(spec);
  else if (layer === 'ui') body = generateUiTest(spec);
  else if (layer === 'data') body = generateDataTest(spec);
  else if (layer === 'cli') body = generateCliTest(spec);
  else throw new Error(`spec-to-test: unsupported layer "${layer}". Supported: api, ui, data, cli.`);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, body, 'utf8');
  const count = spec.cases.filter((c) => c.automation === 'yes').length;
  return { module: spec.module, layer, count, outPath };
}
