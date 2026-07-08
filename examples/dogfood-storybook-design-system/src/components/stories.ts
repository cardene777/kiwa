import { fireEvent } from '@kiwa/component';
import type { StoryMeta } from '@kiwa/component';
import type {
  AvatarArgs,
  BadgeArgs,
  ButtonArgs,
  CardArgs,
  DropdownArgs,
  FormArgs,
  IconArgs,
  InputArgs,
  ModalArgs,
  TableArgs,
  TabsArgs,
  ToastArgs,
  TooltipArgs,
} from './design-system.js';
import {
  buildAvatar,
  buildBadge,
  buildButton,
  buildCard,
  buildDropdown,
  buildForm,
  buildIcon,
  buildInput,
  buildModal,
  buildTable,
  buildTabs,
  buildToast,
  buildTooltip,
} from './design-system.js';

/**
 * 12 コンポーネントの Storybook Meta + StoryObj 定義。 各 meta は 2-3 story を
 * 持ち、 少なくとも 1 story は play function で interaction を実行する
 * (fidelity 実測に必要な最小 story 群)。
 *
 * meta.title は 'DesignSystem/<Component>' で統一、 chromatic viewport は
 * mobile / desktop の 2 種を default、 a11y は default enable。 story 単位で
 * 特殊な parameters (disable / injectViolations 等) を持たせて、 mock が
 * 3 統合 (Storybook + Playwright CT + Chromatic) の semantic を全 cover
 * している事を fidelity 測定で証明する。
 *
 * play function 内で `fireEvent(node, {type, target})` を使うのは real
 * Storybook 8 の `userEvent.click(node)` 相当。 実 story 側は default では
 * event handler を wire しない (Storybook UI 上は Actions addon が capture)
 * ので play は「event を発火する」 を証明する用途、 handler 側の副作用は
 * mock adapter が instrumentHandlers で invocation 数として計測する。
 */

// ---- Button ----

export const buttonMeta: StoryMeta<ButtonArgs> = {
  title: 'DesignSystem/Button',
  render: buildButton,
  args: { label: 'Click me' },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    Primary: {
      args: { variant: 'primary' },
    },
    Secondary: {
      args: { variant: 'secondary' },
    },
    Interactive: {
      args: {
        label: 'Interactive click',
        // action-style spy — the Storybook 8 Actions addon injects an
        // equivalent when the arg is declared as an `action(...)`. Wiring it
        // in the story keeps the interaction observable in mock mode.
        onClick: () => {
          /* recorded via the handler-instrumentation counter */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('click the primary button', async () => {
          const btn = canvasElement.getByRole('button', {
            name: 'Interactive click',
          });
          fireEvent(btn, { type: 'click', target: btn });
          const clickHandlers = btn.handlers['click'] ?? [];
          if (clickHandlers.length === 0) {
            throw new Error('button/Interactive play — click handler not wired');
          }
        });
      },
    },
  },
};

// ---- Input ----

export const inputMeta: StoryMeta<InputArgs> = {
  title: 'DesignSystem/Input',
  render: buildInput,
  args: { id: 'email', label: 'Email', type: 'email' },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    Empty: {},
    Prefilled: {
      args: { value: 'user@example.com' },
    },
    Typing: {
      args: {
        id: 'email-typing',
        label: 'Email typing',
        value: '',
        onChange: () => {
          /* recorded via the handler-instrumentation counter */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('type into the input', async () => {
          const input = canvasElement.querySelector('input#email-typing');
          if (!input) throw new Error('input/Typing play — input not found');
          input.value = 'inline@example.com';
          fireEvent(input, {
            type: 'input',
            target: input,
            value: 'inline@example.com',
          });
          if (input.value !== 'inline@example.com') {
            throw new Error('input/Typing play — value not applied post-handler');
          }
        });
      },
    },
  },
};

// ---- Card ----

export const cardMeta: StoryMeta<CardArgs> = {
  title: 'DesignSystem/Card',
  render: buildCard,
  args: { title: 'Card title', body: 'Card body copy.' },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    Default: {},
    Elevated: {
      args: { variant: 'elevated', footer: 'Optional footer' },
    },
  },
};

// ---- Modal ----

export const modalMeta: StoryMeta<ModalArgs> = {
  title: 'DesignSystem/Modal',
  render: buildModal,
  args: {
    open: true,
    title: 'Delete account',
    body: 'This action cannot be undone.',
  },
  parameters: {
    chromatic: { viewports: ['desktop'] },
  },
  stories: {
    Open: {},
    Closed: {
      args: { open: false },
    },
    Closable: {
      args: {
        open: true,
        title: 'Closable modal',
        body: 'Click x to close.',
        onClose: () => {
          /* recorded via the handler-instrumentation counter */
        },
      },
      play: async ({ canvasElement, step, args }) => {
        await step('click the close button', async () => {
          const closeBtn = canvasElement.getByRole('button', { name: 'Close' });
          fireEvent(closeBtn, {
            type: 'click',
            target: closeBtn,
          });
        });
        // args reference — accessed via `args.title` proves resolved args are
        // available in the play context (registry test invariant).
        if (typeof args?.title !== 'string') {
          throw new Error('modal/Closable play — expected resolved args.title');
        }
      },
    },
  },
};

// ---- Dropdown ----

export const dropdownMeta: StoryMeta<DropdownArgs> = {
  title: 'DesignSystem/Dropdown',
  render: buildDropdown,
  args: {
    id: 'country',
    label: 'Country',
    value: 'jp',
    options: [
      { value: 'jp', label: 'Japan' },
      { value: 'us', label: 'United States' },
      { value: 'de', label: 'Germany' },
      { value: 'br', label: 'Brazil', disabled: true },
    ],
  },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    Default: {},
    Change: {
      args: {
        id: 'country-change',
        onChange: () => {
          /* recorded via the handler-instrumentation counter */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('change the selection', async () => {
          const select = canvasElement.querySelector('select#country-change');
          if (!select) throw new Error('dropdown/Change play — select not found');
          select.value = 'us';
          fireEvent(select, {
            type: 'change',
            target: select,
            value: 'us',
          });
        });
      },
    },
  },
};

// ---- Tabs ----

export const tabsMeta: StoryMeta<TabsArgs> = {
  title: 'DesignSystem/Tabs',
  render: buildTabs,
  args: {
    activeId: 'overview',
    items: [
      { id: 'overview', label: 'Overview', panel: 'Overview panel copy.' },
      { id: 'usage', label: 'Usage', panel: 'Usage panel copy.' },
      {
        id: 'billing',
        label: 'Billing',
        panel: 'Billing panel copy.',
        disabled: true,
      },
    ],
  },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    OverviewActive: {},
    UsageActive: {
      args: { activeId: 'usage' },
    },
    Switch: {
      args: {
        activeId: 'overview',
        onSelect: () => {
          /* recorded via the handler-instrumentation counter */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('activate usage tab', async () => {
          const tab = canvasElement.getByRole('tab', { name: 'Usage' });
          fireEvent(tab, { type: 'click', target: tab });
        });
      },
    },
  },
};

// ---- Toast ----

export const toastMeta: StoryMeta<ToastArgs> = {
  title: 'DesignSystem/Toast',
  render: buildToast,
  args: {
    id: 't-1',
    title: 'Saved',
    body: 'Your changes have been saved.',
    level: 'success',
    dismissible: true,
  },
  parameters: {
    chromatic: { viewports: ['mobile'] },
  },
  stories: {
    Success: {},
    Error: {
      args: { level: 'error', title: 'Failed', body: 'Save failed.' },
    },
    Dismiss: {
      args: {
        id: 't-dismiss',
        title: 'Dismissible',
        onDismiss: () => {
          /* recorded via the handler-instrumentation counter */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('dismiss the toast', async () => {
          const closeBtn = canvasElement.getByRole('button', {
            name: 'Dismiss notification',
          });
          fireEvent(closeBtn, {
            type: 'click',
            target: closeBtn,
          });
        });
      },
    },
  },
};

// ---- Table ----

export const tableMeta: StoryMeta<TableArgs> = {
  title: 'DesignSystem/Table',
  render: buildTable,
  args: {
    caption: 'Recent orders',
    columns: [
      { id: 'id', header: 'ID', align: 'left' },
      { id: 'name', header: 'Customer', align: 'left' },
      { id: 'total', header: 'Total', align: 'right' },
    ],
    rows: [
      { id: '1001', name: 'Alice', total: '$42.00' },
      { id: '1002', name: 'Bob', total: '$18.50' },
    ],
  },
  parameters: {
    chromatic: { viewports: ['desktop'] },
  },
  stories: {
    Populated: {},
    Empty: {
      args: { rows: [], emptyMessage: 'No orders yet' },
    },
  },
};

// ---- Tooltip ----

export const tooltipMeta: StoryMeta<TooltipArgs> = {
  title: 'DesignSystem/Tooltip',
  render: buildTooltip,
  args: {
    id: 'help',
    label: 'Help',
    tip: 'Click to open the help center',
    visible: false,
  },
  parameters: {
    chromatic: { viewports: ['desktop'] },
  },
  stories: {
    Hidden: {},
    Visible: {
      args: { visible: true },
    },
  },
};

// ---- Badge ----

export const badgeMeta: StoryMeta<BadgeArgs> = {
  title: 'DesignSystem/Badge',
  render: buildBadge,
  args: { label: 'New', variant: 'info' },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    Info: {},
    Warning: {
      args: { label: 'Warning', variant: 'warning' },
    },
    WithCount: {
      args: { label: 'Errors', variant: 'danger', count: 3 },
    },
  },
};

// ---- Avatar ----

export const avatarMeta: StoryMeta<AvatarArgs> = {
  title: 'DesignSystem/Avatar',
  render: buildAvatar,
  args: { name: 'Ada Lovelace' },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
  },
  stories: {
    Initials: {},
    WithImage: {
      args: { imageUrl: 'https://example.com/ada.png' },
    },
    Online: {
      args: { status: 'online', size: 'lg' },
    },
  },
};

// ---- Icon ----

export const iconMeta: StoryMeta<IconArgs> = {
  title: 'DesignSystem/Icon',
  render: buildIcon,
  args: { name: 'search', label: 'Search' },
  parameters: {
    chromatic: { viewports: ['mobile'] },
  },
  stories: {
    Meaningful: {},
    Decorative: {
      args: { decorative: true },
    },
  },
};

// ---- Form (Input group primitive) ----
// form も 12 の一つ枠として扱う場合の meta。 dogfood では 12 primitive を
// 「Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table /
// Tooltip / Badge / Avatar / Icon」 に絞り、 form は additional として持つ。

export const formMeta: StoryMeta<FormArgs> = {
  title: 'DesignSystem/Form',
  render: buildForm,
  args: {
    title: 'Signup',
    fields: [
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'name', label: 'Name', required: true },
    ],
  },
  parameters: {
    chromatic: { viewports: ['desktop'] },
  },
  stories: {
    Default: {},
    Submit: {
      args: {
        title: 'Signup submit',
        fields: [
          {
            id: 'email',
            label: 'Email',
            type: 'email',
            value: 'user@example.com',
            required: true,
          },
        ],
        // buildForm always wires an internal click handler on the submit
        // button (which cross-references field values before optionally
        // firing onSubmit), so a play-side fireEvent produces a handler
        // invocation without the story needing to pass onSubmit.
      },
      play: async ({ canvasElement, step }) => {
        await step('click submit', async () => {
          const submit = canvasElement.getByRole('button', { name: 'Submit' });
          fireEvent(submit, {
            type: 'click',
            target: submit,
          });
        });
      },
    },
  },
};

/**
 * 12 primitive meta 一覧。 registry への一括登録に使う。 Form は 13 番目の
 * additional meta として扱い、 12 primitive の release gate 対象からは除外
 * (Storybook 8 dogfood の scope は「12 designsystem primitive」 が SSOT)。
 *
 * ここで `StoryMeta<Record<string, unknown>>[]` に width する事で、 registry の
 * register(meta) が受ける汎化型と合致し、 test / flow 側で `as unknown` cast
 * を避けられる。 個別 args 型 (ButtonArgs / IconArgs 等) は meta 定義側で保持
 * されているので、 使う側 (Storybook UI や real Storybook loader) の型安全は
 * 保たれる。
 */
export const DESIGN_SYSTEM_METAS: ReadonlyArray<StoryMeta<Record<string, unknown>>> = [
  buttonMeta,
  inputMeta,
  cardMeta,
  modalMeta,
  dropdownMeta,
  tabsMeta,
  toastMeta,
  tableMeta,
  tooltipMeta,
  badgeMeta,
  avatarMeta,
  iconMeta,
] as unknown as ReadonlyArray<StoryMeta<Record<string, unknown>>>;

/** Additional (non-primitive) metas — Form is kept separate for the same
 * reason: it composes primitives (Input + Button) and lives outside the 12
 * design-system primitive scope but still contributes stories the play +
 * a11y harnesses exercise. */
export const ADDITIONAL_METAS: ReadonlyArray<StoryMeta<Record<string, unknown>>> = [
  formMeta,
] as unknown as ReadonlyArray<StoryMeta<Record<string, unknown>>>;

/** Full meta list registered by the harness (12 primitives + Form). Tests
 * that assert on the 12-primitive AC (registration / a11y) filter by title
 * prefix; play + fidelity harness use the full list. */
export const ALL_METAS: ReadonlyArray<StoryMeta<Record<string, unknown>>> = [
  ...DESIGN_SYSTEM_METAS,
  ...ADDITIONAL_METAS,
];

/** ALL_METAS のうち play function を持つ story 数 (registry test で assert)。 */
export function countPlayStories(): number {
  let n = 0;
  for (const meta of ALL_METAS) {
    for (const story of Object.values(meta.stories)) {
      if (story.play) n += 1;
    }
  }
  return n;
}

/** ALL_METAS (12 primitive + Form) の総 story 数 (assert に使う定数)。 */
export function countStories(): number {
  let n = 0;
  for (const meta of ALL_METAS) {
    n += Object.keys(meta.stories).length;
  }
  return n;
}

/** DESIGN_SYSTEM_METAS (12 primitive only) の総 story 数。 */
export function countPrimitiveStories(): number {
  let n = 0;
  for (const meta of DESIGN_SYSTEM_METAS) {
    n += Object.keys(meta.stories).length;
  }
  return n;
}
