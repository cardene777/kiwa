import type {
  McpTool,
  ToolCallContent,
  ToolHandler,
  ToolInputSchema,
} from './types.js';

/**
 * Registered tool = definition + handler。 server 内で name をキーに保持する。
 */
export interface RegisteredTool {
  tool: McpTool;
  handler: ToolHandler;
}

/**
 * Tool registry — MCP server が保持する tool 一覧の SSOT。 register / unregister /
 * list / get / validateInput の 5 op を提供する。 順序保持は Map の insertion
 * order で担保、 real MCP と同じく tools/list の順序は register 順。
 */
export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  /**
   * register a tool。 同 name の既存 tool は上書きする (real MCP でも
   * tools/list_changed notification 後の再登録は上書き相当)。
   */
  register(tool: McpTool, handler: ToolHandler): void {
    if (!tool.name || tool.name.trim() === '') {
      throw new Error('tool.name must be a non-empty string');
    }
    this.tools.set(tool.name, { tool, handler });
  }

  /** unregister a tool by name。 存在しない場合は false を返す。 */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /** register 順で全 tool の definition を返す。 */
  list(): McpTool[] {
    return Array.from(this.tools.values()).map((r) => r.tool);
  }

  /** 1 tool を name で lookup、 存在しない場合は undefined。 */
  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /** 登録 tool 数。 */
  get size(): number {
    return this.tools.size;
  }
}

/**
 * ToolInputSchema に対して input value を validate する。 real MCP は
 * Draft 7 の full JSONSchema を許容するが、 kiwa mock は type + properties +
 * required + items + enum + description の 5 種のみ検証する (types.ts
 * のコメント SSOT)。 それ以外の schema keyword は「always valid」 扱い。
 *
 * 返り値 = validation error list。 empty なら valid。
 */
export function validateSchema(schema: ToolInputSchema, value: unknown, path = ''): string[] {
  const errors: string[] = [];
  const location = path || '(root)';

  // type check
  const actualType = getJsonType(value);
  if (schema.type === 'integer') {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push(`${location}: expected integer, got ${actualType}`);
      return errors;
    }
  } else if (schema.type !== actualType) {
    errors.push(`${location}: expected ${schema.type}, got ${actualType}`);
    return errors;
  }

  // enum check (primitive value のみ有効)
  if (schema.enum !== undefined) {
    if (!schema.enum.some((v) => v === value)) {
      errors.push(`${location}: value not in enum ${JSON.stringify(schema.enum)}`);
    }
  }

  // object の properties + required
  if (schema.type === 'object' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in obj)) {
          errors.push(`${location}: missing required property "${key}"`);
        }
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const nested = validateSchema(propSchema, obj[key], path ? `${path}.${key}` : key);
          errors.push(...nested);
        }
      }
    }
  }

  // array の items
  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      const nested = validateSchema(schema.items as ToolInputSchema, item, `${path}[${index}]`);
      errors.push(...nested);
    });
  }

  return errors;
}

/** JSONSchema 的 type name を返す (kiwa mock 対応 range のみ)。 */
function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'number' || t === 'string' || t === 'boolean' || t === 'object') return t;
  return t;
}

/** shortcut — text content 1 block だけの result を組み立てる。 handler 実装補助。 */
export function textContent(text: string): ToolCallContent {
  return { type: 'text', text };
}
