import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';
import { ALL_DOCS } from '../src/mdx/docs.js';

let adapter: StorybookMdxAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS, ALL_DOCS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — args resolution (CSF3 merge semantics)', () => {
  it('T-DFSMDX-ARG-001 Button/Primary merges label + variant', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Button', 'Primary');
    expect(resolved.args['label']).toBe('Click me');
    expect(resolved.args['variant']).toBe('primary');
  });

  it('T-DFSMDX-ARG-002 Input/Typing inherits meta id + label', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Input', 'Typing');
    expect(resolved.args['id']).toBe('email');
    expect(resolved.args['label']).toBe('Email address');
    expect(resolved.args['type']).toBe('email');
  });

  it('T-DFSMDX-ARG-003 Card/Elevated adds variant + footer without dropping meta', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Card', 'Elevated');
    expect(resolved.args['title']).toBe('Card title');
    expect(resolved.args['variant']).toBe('elevated');
    expect(resolved.args['footer']).toBe('Optional footer');
  });

  it('T-DFSMDX-ARG-004 Modal/Closable inherits title + body but adds onClose', async () => {
    const resolved = await adapter.resolveArgs('DesignSystem/Modal', 'Closable');
    expect(resolved.args['title']).toBe('Delete account');
    expect(resolved.args['open']).toBe(true);
    expect(typeof resolved.args['onClose']).toBe('function');
  });

  it('T-DFSMDX-ARG-005 Layout/PageContainer default keeps all meta args', async () => {
    const resolved = await adapter.resolveArgs('Layout/PageContainer', 'Default');
    expect(resolved.args['heading']).toBe('Welcome');
    expect(resolved.args['subheading']).toBe('A layout wrapper');
    expect(resolved.args['bodyText']).toBe('This is the main content region.');
  });

  it('T-DFSMDX-ARG-006 Layout/SectionRow ThreeColumn keeps 3 columns', async () => {
    const resolved = await adapter.resolveArgs('Layout/SectionRow', 'ThreeColumn');
    expect((resolved.args['columns'] as unknown[]).length).toBe(3);
  });

  it('T-DFSMDX-ARG-007 Layout/SectionRow TwoColumn overrides to 2 columns', async () => {
    const resolved = await adapter.resolveArgs('Layout/SectionRow', 'TwoColumn');
    expect((resolved.args['columns'] as unknown[]).length).toBe(2);
    expect(resolved.args['heading']).toBe('Features'); // inherited
  });

  it('T-DFSMDX-ARG-008 Layout/SidebarShell SetupActive overrides both nav + main', async () => {
    const resolved = await adapter.resolveArgs('Layout/SidebarShell', 'SetupActive');
    expect(resolved.args['mainHeading']).toBe('Setup');
    const navItems = resolved.args['navItems'] as Array<{ active?: boolean; id: string }>;
    const active = navItems.find((n) => n.active);
    expect(active?.id).toBe('setup');
  });

  it('T-DFSMDX-ARG-009 non-existent story throws with a descriptive error', async () => {
    await expect(
      adapter.resolveArgs('DesignSystem/Button', 'DoesNotExist'),
    ).rejects.toThrow(/StoryRegistry — no entry/);
  });

  it('T-DFSMDX-ARG-010 trace records 1 resolveArgs op per call', async () => {
    await adapter.resolveArgs('DesignSystem/Button', 'Primary');
    await adapter.resolveArgs('DesignSystem/Card', 'Default');
    const resolveTraces = adapter.traces().filter((t) => t.op === 'resolveArgs');
    expect(resolveTraces.length).toBeGreaterThanOrEqual(2);
    expect(resolveTraces.every((t) => t.ok)).toBe(true);
  });
});
