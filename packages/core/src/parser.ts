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

/** The columns a table must carry to be the case table. */
const REQUIRED_KEYS = ['id', 'observation', 'given', 'when', 'then'];

/**
 * Header labels that name the same column.
 *
 * The spec format is not one format. `/kiwa-design` writes the per-layer tables
 * (`api` / `ui` / `data` / `cli`) with the English headers this parser was
 * built for, and the general 9-column table — everything `contract` and `e2e`
 * use — with Japanese ones. Both are declared in its SKILL.md, and its column
 * order is fixed by its own SSOT because Layer 2 skills read by index.
 *
 * Measured before this map existed: all 9 specs under `tests/spec/` use the
 * Japanese header and none uses the English one, so `parseSpec` returned zero
 * cases for every real spec with `required columns missing`. The coverage
 * analyser then reported no gaps, which reads exactly like full coverage
 * (#1897).
 *
 * `入力値` (the input column) has no counterpart here: the English table folds
 * it into `When`, while the Japanese one splits the same ground into `操作手順`
 * (the steps) and `入力値` (the values). Mapping both onto `when` would make
 * whichever comes last win silently, so the steps column keeps the slot and the
 * values column is left out rather than guessed at. `テストレベル` is likewise
 * unmapped — the layer comes from the `- layer:` meta line, not from a column.
 */
const HEADER_ALIASES: Record<string, string> = {
  テストid: 'id',
  テスト観点: 'observation',
  観点: 'observation',
  前提条件: 'given',
  操作手順: 'when',
  期待結果: 'then',
  優先度: 'priority',
  自動化: 'automation',
};

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

/**
 * A header cell reduced to its column key.
 *
 * Inner whitespace goes too, so `テスト ID` and `テストID` are the same column.
 * The label is written by hand in a markdown table and the space is a typographic
 * choice, not part of the name.
 */
function headerKey(cell: string): string {
  const flat = normalize(cell).replace(/\s+/g, '');
  return HEADER_ALIASES[flat] ?? flat;
}

/** The column positions a header row provides, keyed by canonical name. */
function headerIndices(headerRow: string): Partial<Record<string, number>> {
  const headers = splitRow(headerRow).map(headerKey);
  const indices: Partial<Record<string, number>> = {};
  for (const key of HEADER_KEYS) {
    const idx = headers.indexOf(key);
    if (idx >= 0) indices[key] = idx;
  }
  return indices;
}

/** The required columns a header row is missing. */
function missingRequired(indices: Partial<Record<string, number>>): string[] {
  return REQUIRED_KEYS.filter((key) => indices[key] === undefined);
}

function parseMetaLine(line: string): [string, string] | null {
  const match = line.match(/^[-*]\s+([A-Za-z][\w-]*)\s*[::]\s*(.+)$/);
  if (!match) return null;
  return [normalize(match[1] ?? ''), (match[2] ?? '').trim()];
}

/** Every markdown table in the document, in order. */
function findTables(lines: string[]): { headerIdx: number; rows: string[] }[] {
  const tables: { headerIdx: number; rows: string[] }[] = [];
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
      tables.push({ headerIdx: i, rows });
      i += rows.length + 1; // Skip the rows just consumed; they are not headers.
    }
  }
  return tables;
}

/**
 * The tables that hold the cases, with each one's column positions.
 *
 * Chosen by their columns rather than by position, and **all of them** rather
 * than the first. Two properties of a real spec break the older reading:
 *
 * - Other tables come first. `test-spec-mint-nft.ja.md` opens with a
 *   `symbol | kind` listing of the contract's functions, so taking the first
 *   table reported the case columns as missing on a document that has them.
 * - The cases are split per 観点, as `/kiwa-design` instructs. `mint-nft` holds
 *   32 cases across 10 tables, and reading one table finds 4 of them.
 *
 * Both were measured on the same file (#1897). Indices are computed per table
 * because each carries its own header, and nothing requires two groups to order
 * their columns the same way.
 */
function caseTables(
  lines: string[],
): { rows: string[]; indices: Partial<Record<string, number>> }[] {
  const found: { rows: string[]; indices: Partial<Record<string, number>> }[] = [];
  for (const table of findTables(lines)) {
    const headerRow = lines[table.headerIdx];
    if (!headerRow) continue;
    const indices = headerIndices(headerRow);
    if (missingRequired(indices).length === 0) found.push({ rows: table.rows, indices });
  }
  return found;
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

  const tables = caseTables(lines);
  const cases: SpecCase[] = [];
  if (!tables.length) {
    // 「表が 1 つも無い」 と「表はあるが case 表ではない」 を分ける。 後者は
    // どの column が足りないかまで言えるので、 書き手が直せる形で返す。
    const all = findTables(lines);
    if (!all.length) {
      warnings.push('no test case table found');
      return { module, layer, cases, raw: markdown, warnings };
    }
    const headerRow = lines[all[0]!.headerIdx];
    if (!headerRow) {
      warnings.push('header row missing');
      return { module, layer, cases, raw: markdown, warnings };
    }
    warnings.push(
      `required columns missing: ${missingRequired(headerIndices(headerRow)).join(', ')}`,
    );
    return { module, layer, cases, raw: markdown, warnings };
  }

  for (const { rows, indices } of tables) {
  for (const row of rows) {
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
  }

  return { module, layer, cases, raw: markdown, warnings };
}
