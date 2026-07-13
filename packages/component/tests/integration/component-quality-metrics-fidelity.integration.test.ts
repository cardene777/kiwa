/**
 * integration test — `docs/concepts/test-taxonomy.md § integration` pattern。
 *
 * @kiwa-lab/component の createStoryRegistry (Storybook 8 mock) が返す canvas を
 * @kiwa-lab/quality-metrics の assertFidelity で 検証する cross-lib flow を real
 * import で検証する経路。 component 側 story render と quality-metrics 側 fidelity
 * primitive が single test file 内で組合せ動作することを保証する。
 *
 * mock 混ぜず real dependency で回す = integration 契約 (SSOT 前提思想)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createNode, createStoryRegistry } from '../../src/index.js';

interface ButtonArgs {
  label: string;
  disabled?: boolean;
}

describe('component × quality-metrics integration — story render × fidelity assert', () => {
  it('createStoryRegistry で 2 story を register + mount、 label で識別可能', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: (args: ButtonArgs) => createNode('button', { text: args.label }),
      stories: {
        Primary: { args: { label: 'Click me' } },
        Disabled: { args: { label: 'nope', disabled: true } },
      },
    });

    const primary = await registry.mount('Button', 'Primary');
    const disabled = await registry.mount('Button', 'Disabled');

    expect(primary.canvas.root.text).toBe('Click me');
    expect(disabled.canvas.root.text).toBe('nope');
  });

  it('assertFidelity で 2 story の label 出力を reference と 100% 一致検証', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: (args: ButtonArgs) => createNode('button', { text: args.label }),
      stories: {
        Primary: { args: { label: 'Click me' } },
        Disabled: { args: { label: 'nope', disabled: true } },
      },
    });

    /** Reference impl = story args から label を直接返す最小 mapper。 */
    const referenceRender = (args: ButtonArgs): string => args.label;

    const result = await assertFidelity({
      mockFn: async (story: 'Primary' | 'Disabled') => {
        const canvas = await registry.mount('Button', story);
        return canvas.canvas.root.text ?? '';
      },
      realFn: async (story: 'Primary' | 'Disabled') => {
        const args: ButtonArgs =
          story === 'Primary' ? { label: 'Click me' } : { label: 'nope', disabled: true };
        return referenceRender(args);
      },
      cases: [
        { name: 'Primary label', args: ['Primary'] as ['Primary'] },
        { name: 'Disabled label', args: ['Disabled'] as ['Disabled'] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('assertFidelity で label divergence 検出時 = failed > 0 (negative case)', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: (args: ButtonArgs) => createNode('button', { text: args.label }),
      stories: {
        Primary: { args: { label: 'Click me' } },
      },
    });

    // 意図的に reference を故意に mismatch させて fidelity primitive の検出機能を確認
    const result = await assertFidelity({
      mockFn: async () => {
        const canvas = await registry.mount('Button', 'Primary');
        return canvas.canvas.root.text ?? '';
      },
      realFn: async () => 'INTENTIONALLY-DIFFERENT',
      cases: [{ name: 'divergence 検出', args: [] as [] }],
    });
    expect(result.failed).toBe(1);
    expect(result.divergences.length).toBe(1);
    expect(result.divergences[0]?.reason).toBe('deepStrictEqual mismatch');
  });
});
