import { describe, expect, it } from 'vitest';
import {
  buildButton,
  buildForm,
  buildInput,
  createStoryRegistry,
  type StoryMeta,
} from '../src/index.js';

describe('StoryRegistry — Storybook 8 API compatibility', () => {
  it('registers a meta + stories map and lists all entries', () => {
    const registry = createStoryRegistry();
    const meta: StoryMeta<{ label: string; disabled?: boolean }> = {
      title: 'Components/Button',
      render: buildButton,
      args: { label: 'default' },
      stories: {
        Primary: { args: { label: 'Primary' } },
        Disabled: { args: { label: 'Disabled', disabled: true } },
      },
    };
    registry.register(meta);
    const list = registry.list();
    expect(list).toHaveLength(2);
    expect(list.map((e) => e.storyName).sort()).toEqual(['Disabled', 'Primary']);
  });

  it('generates stable story id from title + name (SB URL param compat)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'UI/Buttons/Primary Button',
      render: buildButton,
      stories: {
        'Small Variant': { args: { label: 'small' } },
      },
    });
    const entry = registry.get('UI/Buttons/Primary Button', 'Small Variant');
    expect(entry.id).toBe('ui-buttons-primary-button--small-variant');
  });

  it('merges meta.args + story.args (story args override meta args)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      args: { label: 'default', variant: 'secondary' },
      stories: {
        Primary: { args: { variant: 'primary' } },
      },
    });
    const entry = registry.get('Button', 'Primary');
    expect(entry.args).toEqual({ label: 'default', variant: 'primary' });
  });
});

describe('StoryRegistry.mount + play', () => {
  it('mount renders the component with resolved args', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: {
        Primary: { args: { label: 'Click me' } },
      },
    });
    const { canvas } = registry.mount('Button', 'Primary');
    const btn = canvas.getByRole('button', { name: 'Click me' });
    expect(btn.tag).toBe('button');
    expect(btn.text).toBe('Click me');
  });

  it('mount respects overrideArgs (test-time args injection)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      args: { label: 'default' },
      stories: {
        Primary: {},
      },
    });
    const { canvas } = registry.mount('Button', 'Primary', { label: 'override' });
    expect(canvas.getByRole('button').text).toBe('override');
  });

  it('play function runs and records steps', async () => {
    const registry = createStoryRegistry();
    let clicked = 0;
    registry.register<{ label: string; onClick?: () => void }>({
      title: 'Button',
      render: (args) => buildButton({ ...args, onClick: () => clicked++ }),
      stories: {
        Interactive: {
          args: { label: 'ok' },
          play: async ({ canvasElement, step }) => {
            await step('click the button', async () => {
              const btn = canvasElement.getByRole('button', { name: 'ok' });
              btn.handlers['click']?.[0]?.({ type: 'click', target: btn });
            });
          },
        },
      },
    });
    const { canvas } = registry.mount('Button', 'Interactive');
    const result = await registry.play('Button', 'Interactive', canvas);
    expect(result.ok).toBe(true);
    expect(result.steps).toEqual([{ label: 'click the button', ok: true }]);
    expect(clicked).toBe(1);
  });

  it('play function failure records ok=false with error message', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: {
        Failing: {
          args: { label: 'x' },
          play: async ({ step }) => {
            await step('this fails', async () => {
              throw new Error('boom');
            });
          },
        },
      },
    });
    const { canvas } = registry.mount('Button', 'Failing');
    const result = await registry.play('Button', 'Failing', canvas);
    expect(result.ok).toBe(false);
    expect(result.steps[0]?.error).toBe('boom');
  });

  it('story without play returns empty steps + ok=true', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: {
        NoPlay: { args: { label: 'x' } },
      },
    });
    const { canvas } = registry.mount('Button', 'NoPlay');
    const result = await registry.play('Button', 'NoPlay', canvas);
    expect(result).toEqual({ steps: [], ok: true });
  });
});

describe('StoryRegistry — parameters (chromatic + a11y)', () => {
  it('merges meta.parameters + story.parameters (chromatic deep merge)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      parameters: { chromatic: { viewports: ['desktop'], diffThreshold: 0.01 } },
      stories: {
        MobileOnly: {
          args: { label: 'x' },
          parameters: { chromatic: { viewports: ['mobile'] } },
        },
      },
    });
    const entry = registry.get('Button', 'MobileOnly');
    expect(entry.parameters.chromatic?.viewports).toEqual(['mobile']);
    expect(entry.parameters.chromatic?.diffThreshold).toBe(0.01);
  });

  it('runA11y returns injected violations from parameters', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: buildButton,
      stories: {
        WithViolation: {
          args: { label: 'x' },
          parameters: {
            a11y: {
              injectViolations: [
                {
                  id: 'color-contrast',
                  impact: 'serious',
                  description: 'contrast too low',
                  nodes: [{ target: ['button'], html: '<button>x</button>' }],
                },
              ],
            },
          },
        },
      },
    });
    const { canvas } = registry.mount('Button', 'WithViolation');
    const { violations } = registry.runA11y('Button', 'WithViolation', canvas);
    expect(violations.some((v) => v.id === 'color-contrast')).toBe(true);
  });

  it('runA11y skipped when a11y.disable is true', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: (_args) => buildButton({ label: '' }), // empty label — normally a violation
      stories: {
        Skipped: {
          args: {},
          parameters: { a11y: { disable: true } },
        },
      },
    });
    const { canvas } = registry.mount('Button', 'Skipped');
    const { violations } = registry.runA11y('Button', 'Skipped', canvas);
    expect(violations).toEqual([]);
  });

  it('runA11y detects heuristic violations (empty button, unlabeled input)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () =>
        buildForm({
          title: 'x',
          fields: [{ id: 'name', label: 'Name' }],
        }),
      stories: {
        Valid: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'Valid');
    const { violations } = registry.runA11y('Form', 'Valid', canvas);
    // Form fixture uses label[for=id] pattern — should have no label violation
    expect(violations.some((v) => v.id === 'label')).toBe(false);
  });

  it('runA11y catches button without discernible text', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Button',
      render: () => buildButton({ label: '' }), // empty label
      stories: {
        Empty: { args: {} },
      },
    });
    const { canvas } = registry.mount('Button', 'Empty');
    const { violations } = registry.runA11y('Button', 'Empty', canvas);
    expect(violations.some((v) => v.id === 'button-name')).toBe(true);
  });
});

describe('StoryRegistry — error paths', () => {
  it('get throws on unknown story', () => {
    const registry = createStoryRegistry();
    expect(() => registry.get('Nope', 'Missing')).toThrow('no entry for');
  });

  it('mount throws on unknown story', () => {
    const registry = createStoryRegistry();
    expect(() => registry.mount('Nope', 'Missing')).toThrow('no entry for');
  });

  it('registering with an input fixture works end-to-end', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Input',
      render: buildInput,
      stories: {
        WithLabel: {
          args: { id: 'email', label: 'Email', type: 'email' },
        },
      },
    });
    const { canvas } = registry.mount('Input', 'WithLabel');
    expect(canvas.getByText('Email')).toBeDefined();
    expect(canvas.querySelector('input[type=email]')).toBeDefined();
  });
});
