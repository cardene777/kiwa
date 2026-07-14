import { describe, expect, it } from 'vitest';
import { McpServer, textContent, validateSchema } from '../../src/index.js';

describe('mcp fidelity — McpServer + validateSchema contract', () => {
  it('T-FID-D-001 protocolVersion default', () => {
    const server = new McpServer();
    expect(server.protocolVersion).toMatch(/\d+/);
  });

  it('T-FID-D-002 validateSchema で type mismatch 検知', () => {
    const errors = validateSchema({ type: 'string' }, 42);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('T-FID-D-003 validateSchema で valid input pass', () => {
    const errors = validateSchema({ type: 'string' }, 'hello');
    expect(errors).toEqual([]);
  });

  it('T-FID-D-004 validateSchema object type check', () => {
    const errors = validateSchema(
      { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      { name: 'kiwa' },
    );
    expect(errors).toEqual([]);
  });

  it('T-FID-D-005 textContent で { type: text, text } shape', () => {
    const result = textContent('hello');
    expect(result.type).toBe('text');
    expect((result as { type: 'text'; text: string }).text).toBe('hello');
  });
});
