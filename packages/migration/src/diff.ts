export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary?: boolean;
  unique?: boolean;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface Schema {
  tables: SchemaTable[];
}

export interface ColumnDiff {
  table: string;
  column: string;
  change: 'added' | 'removed' | 'type_changed' | 'nullable_changed';
  before?: SchemaColumn;
  after?: SchemaColumn;
}

export interface SchemaDiff {
  addedTables: string[];
  removedTables: string[];
  columnDiffs: ColumnDiff[];
}

/**
 * prev / next schema の diff を計算。 実 provider (Prisma introspect / Drizzle
 * schema push / Kysely migration generate) が返す diff の抽象 shape。
 */
export function diffSchema(prev: Schema, next: Schema): SchemaDiff {
  const prevTables = new Map(prev.tables.map((t) => [t.name, t]));
  const nextTables = new Map(next.tables.map((t) => [t.name, t]));
  const addedTables: string[] = [];
  const removedTables: string[] = [];
  const columnDiffs: ColumnDiff[] = [];

  for (const [name] of nextTables) {
    if (!prevTables.has(name)) addedTables.push(name);
  }
  for (const [name] of prevTables) {
    if (!nextTables.has(name)) removedTables.push(name);
  }

  for (const [tableName, nextTable] of nextTables) {
    const prevTable = prevTables.get(tableName);
    if (!prevTable) continue;
    const prevCols = new Map(prevTable.columns.map((c) => [c.name, c]));
    const nextCols = new Map(nextTable.columns.map((c) => [c.name, c]));
    for (const [colName, nextCol] of nextCols) {
      const prevCol = prevCols.get(colName);
      if (!prevCol) {
        columnDiffs.push({ table: tableName, column: colName, change: 'added', after: nextCol });
        continue;
      }
      if (prevCol.type !== nextCol.type) {
        columnDiffs.push({ table: tableName, column: colName, change: 'type_changed', before: prevCol, after: nextCol });
      }
      if (prevCol.nullable !== nextCol.nullable) {
        columnDiffs.push({ table: tableName, column: colName, change: 'nullable_changed', before: prevCol, after: nextCol });
      }
    }
    for (const [colName, prevCol] of prevCols) {
      if (!nextCols.has(colName)) {
        columnDiffs.push({ table: tableName, column: colName, change: 'removed', before: prevCol });
      }
    }
  }
  return { addedTables, removedTables, columnDiffs };
}
