import { expect, test } from 'vitest';
import { createChromaticVisualMock, createNode, createStoryRegistry } from '../src/index.js';

test('the quickstart resolves a story argument into the canvas', () => {
  const registry = createStoryRegistry();
  registry.register({
    title: 'Button',
    render: (args) => createNode('button', { text: String(args.label) }),
    stories: { Primary: { args: { label: 'Save' } } },
  });
  expect(registry.mount('Button', 'Primary').canvas.getByRole('button').text).toBe('Save');
});

test('the how-to keeps interaction, a11y, and visual review separate', async () => {
  const registry = createStoryRegistry();
  registry.register({
    title: 'Button',
    render: (args) => createNode('button', { text: String(args.label) }),
    stories: {
      Primary: {
        args: { label: 'Save' },
        play: async ({ canvasElement, step }) => {
          await step('save', () => {
            expect(canvasElement.getByRole('button').text).toBe('Save');
          });
        },
      },
    },
  });
  const chromatic = createChromaticVisualMock();
  const { canvas, entry } = registry.mount('Button', 'Primary');
  await expect(registry.play('Button', 'Primary', canvas)).resolves.toMatchObject({ ok: true });
  expect(registry.runA11y('Button', 'Primary', canvas).violations).toEqual([]);
  expect(chromatic.captureAll({ entry, canvas })[0]?.status).toBe('new');

  const changed = registry.mount('Button', 'Primary', { label: 'Store' });
  const diff = chromatic.capture({ entry: changed.entry, canvas: changed.canvas });
  expect(diff).toMatchObject({ changed: true, status: 'failed' });
  chromatic.review({ storyId: diff.storyId, viewport: diff.viewport, action: 'accept' });
  expect(chromatic.capture({ entry: changed.entry, canvas: changed.canvas }).status).toBe('passed');
});
