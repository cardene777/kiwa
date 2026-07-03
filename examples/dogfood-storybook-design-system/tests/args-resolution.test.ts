import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';

let adapter: StorybookAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-design-system — args resolution (CSF3 merge semantics)', () => {
  it('T-DFSB-ARG-001 Button/Primary merges meta.args (label) + story.args (variant)', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Button', 'Primary');
    expect(resolved.args['label']).toBe('Click me');
    expect(resolved.args['variant']).toBe('primary');
  });

  it('T-DFSB-ARG-002 Button/Secondary overrides variant while inheriting label', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Button', 'Secondary');
    expect(resolved.args['label']).toBe('Click me');
    expect(resolved.args['variant']).toBe('secondary');
  });

  it('T-DFSB-ARG-003 Input/Prefilled inherits meta id + label and adds value', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Input', 'Prefilled');
    expect(resolved.args['id']).toBe('email');
    expect(resolved.args['type']).toBe('email');
    expect(resolved.args['value']).toBe('user@example.com');
  });

  it('T-DFSB-ARG-004 Card/Elevated adds variant + footer without dropping meta defaults', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Card', 'Elevated');
    expect(resolved.args['title']).toBe('Card title');
    expect(resolved.args['body']).toBe('Card body copy.');
    expect(resolved.args['variant']).toBe('elevated');
    expect(resolved.args['footer']).toBe('Optional footer');
  });

  it('T-DFSB-ARG-005 Modal/Closed flips open=false while keeping title + body', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Modal', 'Closed');
    expect(resolved.args['open']).toBe(false);
    expect(resolved.args['title']).toBe('Delete account');
  });

  it('T-DFSB-ARG-006 Dropdown/Default carries the 4-option array', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Dropdown', 'Default');
    expect(Array.isArray(resolved.args['options'])).toBe(true);
    expect((resolved.args['options'] as unknown[]).length).toBe(4);
  });

  it('T-DFSB-ARG-007 Tabs/UsageActive overrides activeId while keeping items list', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Tabs', 'UsageActive');
    expect(resolved.args['activeId']).toBe('usage');
    expect(Array.isArray(resolved.args['items'])).toBe(true);
    expect((resolved.args['items'] as unknown[]).length).toBe(3);
  });

  it('T-DFSB-ARG-008 Toast/Error overrides level + copy but keeps dismissible=true', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Toast', 'Error');
    expect(resolved.args['level']).toBe('error');
    expect(resolved.args['title']).toBe('Failed');
    expect(resolved.args['dismissible']).toBe(true);
  });

  it('T-DFSB-ARG-009 Table/Empty forces rows=[] and emptyMessage without touching columns', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Table', 'Empty');
    expect(Array.isArray(resolved.args['rows'])).toBe(true);
    expect((resolved.args['rows'] as unknown[]).length).toBe(0);
    expect(resolved.args['emptyMessage']).toBe('No orders yet');
    expect(Array.isArray(resolved.args['columns'])).toBe(true);
  });

  it('T-DFSB-ARG-010 Tooltip/Visible flips visible=true without dropping id / label / tip', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Tooltip', 'Visible');
    expect(resolved.args['visible']).toBe(true);
    expect(resolved.args['id']).toBe('help');
    expect(resolved.args['tip']).toBe('Click to open the help center');
  });

  it('T-DFSB-ARG-011 Badge/WithCount adds count while overriding label + variant', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Badge', 'WithCount');
    expect(resolved.args['label']).toBe('Errors');
    expect(resolved.args['variant']).toBe('danger');
    expect(resolved.args['count']).toBe(3);
  });

  it('T-DFSB-ARG-012 Avatar/Online overrides status + size but keeps name', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Avatar', 'Online');
    expect(resolved.args['status']).toBe('online');
    expect(resolved.args['size']).toBe('lg');
    expect(resolved.args['name']).toBe('Ada Lovelace');
  });

  it('T-DFSB-ARG-013 Icon/Decorative flips decorative=true while inheriting name + label', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Icon', 'Decorative');
    expect(resolved.args['decorative']).toBe(true);
    expect(resolved.args['name']).toBe('search');
    expect(resolved.args['label']).toBe('Search');
  });

  it('T-DFSB-ARG-014 non-existent story throws with a descriptive error', async () => {
    await expect(
      adapter.resolveArgs('DesignSystem/Button', 'DoesNotExist'),
    ).rejects.toThrow(/StoryRegistry — no entry/);
  });

  it('T-DFSB-ARG-015 trace records 1 resolveArgs op per successful call', async () => {
    await adapter.resolveArgs('DesignSystem/Button', 'Primary');
    await adapter.resolveArgs('DesignSystem/Card', 'Default');
    const resolveTraces = adapter.traces().filter((t) => t.op === 'resolveArgs');
    expect(resolveTraces.length).toBeGreaterThanOrEqual(2);
    expect(resolveTraces.every((t) => t.ok)).toBe(true);
  });
});
