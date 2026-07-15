export type OperationType = 'query' | 'mutation' | 'subscription';

export interface SelectionField {
  name: string;
  alias?: string;
  arguments: Record<string, string | number | boolean | null>;
  selections: SelectionField[];
}

export interface ParsedOperation {
  type: OperationType;
  name?: string;
  variableDefs: string[];
  selections: SelectionField[];
}

/**
 * 最小 GraphQL parser。 operation type (query/mutation/subscription) + name + selection set
 * + 引数を抜き出す。 fragment / directive / inline union は非対応 (mock 用途では十分)。
 */
export function parseGraphQLOperation(source: string): ParsedOperation {
  const trimmed = source.trim();
  const opMatch = trimmed.match(/^(query|mutation|subscription)?\s*([A-Za-z_][\w]*)?\s*(\([^)]*\))?\s*\{/);
  const type = (opMatch?.[1] as OperationType | undefined) ?? 'query';
  const name = opMatch?.[2];
  const varDefsRaw = opMatch?.[3] ?? '';
  const variableDefs = Array.from(varDefsRaw.matchAll(/\$([A-Za-z_][\w]*)/g)).map((m) => m[1]!);

  const bodyStart = trimmed.indexOf('{');
  const body = trimmed.slice(bodyStart);
  const selections = parseSelectionSet(body).selections;

  const result: ParsedOperation = { type, variableDefs, selections };
  if (name !== undefined) result.name = name;
  return result;
}

function parseSelectionSet(source: string): { selections: SelectionField[]; consumed: number } {
  const selections: SelectionField[] = [];
  let i = 0;
  if (source[i] !== '{') throw new Error('expected {');
  i += 1;
  while (i < source.length) {
    while (i < source.length && /\s|,/.test(source[i]!)) i += 1;
    if (source[i] === '}') return { selections, consumed: i + 1 };
    const { field, consumed } = parseField(source.slice(i));
    selections.push(field);
    i += consumed;
  }
  throw new Error('unterminated selection set');
}

function parseField(source: string): { field: SelectionField; consumed: number } {
  let i = 0;
  const nameMatch = source.slice(i).match(/^([A-Za-z_][\w]*)(\s*:\s*([A-Za-z_][\w]*))?/);
  if (!nameMatch) throw new Error(`unexpected token at position 0 near "${source.slice(0, 20)}"`);
  const alias = nameMatch[3] ? nameMatch[1]! : undefined;
  const name = nameMatch[3] ?? nameMatch[1]!;
  i += nameMatch[0].length;

  while (i < source.length && /\s/.test(source[i]!)) i += 1;

  const args: Record<string, string | number | boolean | null> = {};
  if (source[i] === '(') {
    const argsEnd = source.indexOf(')', i);
    if (argsEnd < 0) throw new Error('unterminated arguments');
    const argsBody = source.slice(i + 1, argsEnd);
    for (const pair of argsBody.split(',')) {
      const [k, v] = pair.split(':').map((s) => s.trim());
      if (!k || v === undefined) continue;
      args[k] = coerceArg(v);
    }
    i = argsEnd + 1;
    while (i < source.length && /\s/.test(source[i]!)) i += 1;
  }

  let selections: SelectionField[] = [];
  if (source[i] === '{') {
    const nested = parseSelectionSet(source.slice(i));
    selections = nested.selections;
    i += nested.consumed;
  }

  const field: SelectionField = { name, arguments: args, selections };
  if (alias !== undefined) field.alias = alias;
  return { field, consumed: i };
}

function coerceArg(raw: string): string | number | boolean | null {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw.startsWith('$')) return raw;
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  const n = Number(raw);
  if (!Number.isNaN(n)) return n;
  return raw;
}
