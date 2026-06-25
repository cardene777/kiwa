import type { SpecCase, SpecDoc, TestLayer, TestMode } from './types.js';

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
];

const VALID_LAYERS: ReadonlySet<TestLayer> = new Set<TestLayer>([
  'contract',
  'unit',
  'integration',
  'e2e',
  'api',
  'ui',
  'data',
  'cli',
]);

const VALID_MODES: ReadonlySet<TestMode> = new Set<TestMode>(['mock', 'live', 'hybrid']);

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
        if (!row || !row.includes('|')) break;
        if (row.trim().length === 0) break;
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

function isValidLayer(value: string): value is TestLayer {
  return (VALID_LAYERS as ReadonlySet<string>).has(value);
}

function isValidMode(value: string): value is TestMode {
  return (VALID_MODES as ReadonlySet<string>).has(value);
}

export interface ParseOptions {
  module?: string;
  defaultLayer?: TestLayer;
}

export function parseSpec(markdown: string, opts: ParseOptions = {}): SpecDoc {
  const lines = markdown.split(/\r?\n/);
  const warnings: string[] = [];
  let module = opts.module ?? '';
  let layer: TestLayer = opts.defaultLayer ?? 'unit';

  for (const line of lines) {
    const meta = parseMetaLine(line);
    if (!meta) continue;
    const [key, value] = meta;
    if (key === 'module' && !opts.module) {
      module = value;
    } else if (key === 'layer') {
      const lower = normalize(value);
      if (isValidLayer(lower)) {
        layer = lower;
      } else {
        warnings.push(`unknown layer "${value}"`);
      }
    }
  }

  const tableInfo = findTable(lines);
  const cases: SpecCase[] = [];
  if (!tableInfo) {
    warnings.push('no test case table found');
    return { module, layer, cases, raw: markdown, warnings };
  }

  const headerRow = lines[tableInfo.headerIdx];
  if (!headerRow) {
    warnings.push('header row missing');
    return { module, layer, cases, raw: markdown, warnings };
  }
  const headers = splitRow(headerRow).map(normalize);
  const indices: Partial<Record<string, number>> = {};
  for (const key of HEADER_KEYS) {
    const idx = headers.indexOf(key);
    if (idx >= 0) indices[key] = idx;
  }

  const requiredMissing = ['id', 'observation', 'given', 'when', 'then'].filter(
    (key) => indices[key] === undefined,
  );
  if (requiredMissing.length > 0) {
    warnings.push(`required columns missing: ${requiredMissing.join(', ')}`);
    return { module, layer, cases, raw: markdown, warnings };
  }

  for (const row of tableInfo.rows) {
    const cells = splitRow(row);
    const get = (key: string): string => {
      const idx = indices[key];
      if (idx === undefined) return '';
      return cells[idx] ?? '';
    };

    const id = get('id');
    if (!id || id.startsWith('-')) continue;

    const priorityRaw = get('priority').toUpperCase();
    const priority: SpecCase['priority'] =
      priorityRaw === 'P0' || priorityRaw === 'P1' || priorityRaw === 'P2' || priorityRaw === 'P3'
        ? priorityRaw
        : 'P2';

    const automationRaw = normalize(get('automation'));
    const automation: SpecCase['automation'] =
      automationRaw === 'yes' || automationRaw === 'manual' ? automationRaw : 'no';

    const modeRaw = normalize(get('mode'));
    const route = get('route');
    const notes = get('notes');

    const baseCase: SpecCase = {
      id,
      observation: get('observation'),
      given: get('given'),
      when: get('when'),
      then: get('then'),
      priority,
      automation,
    };

    if (isValidMode(modeRaw)) {
      baseCase.mode = modeRaw;
    } else if (modeRaw) {
      warnings.push(`row ${id}: unknown mode "${modeRaw}"`);
    }
    if (route) baseCase.route = route;
    if (notes) baseCase.notes = notes;

    cases.push(baseCase);
  }

  return { module, layer, cases, raw: markdown, warnings };
}
