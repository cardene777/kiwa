import { fireEvent } from '@kiwa-lab/component';
import type { StoryMeta } from '@kiwa-lab/component';
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
  PageContainerArgs,
  SectionRowArgs,
  SidebarShellArgs,
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
  buildPageContainer,
  buildSectionRow,
  buildSidebarShell,
  buildTable,
  buildTabs,
  buildToast,
  buildTooltip,
} from './design-system.js';

/**
 * 12 primitive + 3 layout + 5 interaction focus Storybook Meta + StoryObj。 v1.34-4
 * (Issue #1051) 新設。 v1.16-2 dogfood-storybook-design-system の shape を維持
 * しつつ、 (1) layout 3 個の meta 追加、 (2) 5 stories 特定を「interaction
 * focus」 として InteractionRunner にひも付ける、 の 2 差分を持つ。
 *
 * interaction focus 5 stories は play function 付きの story のうち user 操作
 * (click / type / assert) を @storybook/test 経由で回すことを前提にした story
 * subset。 完全に v1.16-2 の play function セットの subset なので、 mock 側は
 * play function として実行する。
 */

// ---- Button (2 stories, 1 interaction focus) ----

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
    Interactive: {
      args: {
        label: 'Interactive click',
        onClick: () => {
          /* recorded via handler-instrumentation */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('click the primary button', async () => {
          const btn = canvasElement.getByRole('button', {
            name: 'Interactive click',
          });
          fireEvent(btn, { type: 'click', target: btn });
        });
      },
    },
  },
};

// ---- Input (2 stories, 1 interaction focus) ----

export const inputMeta: StoryMeta<InputArgs> = {
  title: 'DesignSystem/Input',
  render: buildInput,
  args: {
    id: 'email',
    label: 'Email address',
    type: 'email',
  },
  stories: {
    Empty: {},
    Typing: {
      args: {
        value: '',
        onChange: () => {
          /* recorded */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('type into the input', async () => {
          const input = canvasElement.querySelector('input#email');
          if (!input) throw new Error('input/Typing play — input not found');
          input.value = 'user@example.com';
          fireEvent(input, {
            type: 'input',
            target: input,
            value: 'user@example.com',
          });
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
  stories: {
    Default: {},
    Elevated: {
      args: { variant: 'elevated', footer: 'Optional footer' },
    },
  },
};

// ---- Modal (2 stories, 1 interaction focus) ----

export const modalMeta: StoryMeta<ModalArgs> = {
  title: 'DesignSystem/Modal',
  render: buildModal,
  args: {
    title: 'Delete account',
    body: 'Are you sure?',
    open: true,
  },
  stories: {
    Open: {},
    Closable: {
      args: {
        onClose: () => {
          /* recorded */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('click the close button', async () => {
          const btn = canvasElement.getByRole('button', {
            name: 'Close',
          });
          fireEvent(btn, { type: 'click', target: btn });
        });
      },
    },
  },
};

// ---- Dropdown (2 stories, 1 interaction focus) ----

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
      { value: 'gb', label: 'United Kingdom' },
      { value: 'kr', label: 'South Korea' },
    ],
  },
  stories: {
    Default: {},
    Change: {
      args: {
        onChange: () => {
          /* recorded */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('change the selection', async () => {
          const select = canvasElement.querySelector('select#country');
          if (!select) throw new Error('dropdown/Change play — select not found');
          select.value = 'us';
          fireEvent(select, { type: 'change', target: select, value: 'us' });
        });
      },
    },
  },
};

// ---- Tabs (2 stories, 1 interaction focus) ----

export const tabsMeta: StoryMeta<TabsArgs> = {
  title: 'DesignSystem/Tabs',
  render: buildTabs,
  args: {
    activeId: 'overview',
    items: [
      { id: 'overview', label: 'Overview', panel: 'Overview content' },
      { id: 'usage', label: 'Usage', panel: 'Usage content' },
      { id: 'api', label: 'API', panel: 'API content' },
    ],
  },
  stories: {
    OverviewActive: {},
    Switch: {
      args: {
        onSelect: () => {
          /* recorded */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('activate usage tab', async () => {
          const tab = canvasElement.getByRole('tab', { name: 'Usage' });
          fireEvent(tab, { type: 'click', target: tab, value: 'usage' });
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
    id: 'notif',
    title: 'Saved',
    level: 'success',
    dismissible: true,
  },
  stories: {
    Success: {},
    Error: {
      args: { level: 'error', title: 'Failed' },
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
      { id: 'id', header: 'ID' },
      { id: 'customer', header: 'Customer' },
      { id: 'amount', header: 'Amount', align: 'right' },
    ],
    rows: [
      { id: '1001', customer: 'Ada Lovelace', amount: '$12.00' },
      { id: '1002', customer: 'Grace Hopper', amount: '$34.00' },
    ],
  },
  stories: {
    WithRows: {},
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
  stories: {
    Hidden: {},
    Visible: { args: { visible: true } },
  },
};

// ---- Badge ----

export const badgeMeta: StoryMeta<BadgeArgs> = {
  title: 'DesignSystem/Badge',
  render: buildBadge,
  args: { label: 'New', variant: 'info' },
  stories: {
    New: {},
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
  stories: {
    Initials: {},
    Online: { args: { status: 'online', size: 'lg' } },
  },
};

// ---- Icon ----

export const iconMeta: StoryMeta<IconArgs> = {
  title: 'DesignSystem/Icon',
  render: buildIcon,
  args: { name: 'search', label: 'Search' },
  stories: {
    Meaningful: {},
    Decorative: { args: { decorative: true } },
  },
};

// ---- Form (2 stories, 1 interaction focus) ----

export const formMeta: StoryMeta<FormArgs> = {
  title: 'DesignSystem/Form',
  render: buildForm,
  args: {
    title: 'Sign up',
    fields: [
      { id: 'name', label: 'Name', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
    ],
    submitLabel: 'Sign up',
  },
  stories: {
    Empty: {},
    Submit: {
      args: {
        fields: [
          { id: 'name', label: 'Name', value: 'Ada', required: true },
          {
            id: 'email',
            label: 'Email',
            type: 'email',
            value: 'ada@example.com',
            required: true,
          },
        ],
        onSubmit: () => {
          /* recorded */
        },
      },
      play: async ({ canvasElement, step }) => {
        await step('click submit', async () => {
          const btn = canvasElement.getByRole('button', { name: 'Sign up' });
          fireEvent(btn, { type: 'click', target: btn });
        });
      },
    },
  },
};

// ---- 3 layouts (v1.34-4 で新規) ----

export const pageContainerMeta: StoryMeta<PageContainerArgs> = {
  title: 'Layout/PageContainer',
  render: buildPageContainer,
  args: {
    heading: 'Welcome',
    subheading: 'A layout wrapper',
    bodyText: 'This is the main content region.',
  },
  stories: {
    Default: {},
    NoSubheading: { args: { heading: 'Welcome', bodyText: 'Body only.' } },
  },
};

export const sectionRowMeta: StoryMeta<SectionRowArgs> = {
  title: 'Layout/SectionRow',
  render: buildSectionRow,
  args: {
    heading: 'Features',
    columns: [
      { id: 'a', heading: 'Fast', body: 'Blazing fast performance.' },
      { id: 'b', heading: 'Safe', body: 'Verified by extensive tests.' },
      { id: 'c', heading: 'Simple', body: 'Ergonomic API surface.' },
    ],
  },
  stories: {
    ThreeColumn: {},
    TwoColumn: {
      args: {
        columns: [
          { id: 'a', heading: 'Fast', body: 'Blazing fast.' },
          { id: 'b', heading: 'Safe', body: 'Verified.' },
        ],
      },
    },
  },
};

export const sidebarShellMeta: StoryMeta<SidebarShellArgs> = {
  title: 'Layout/SidebarShell',
  render: buildSidebarShell,
  args: {
    navHeading: 'Docs',
    navItems: [
      { id: 'intro', label: 'Introduction', href: '/docs/intro', active: true },
      { id: 'setup', label: 'Setup', href: '/docs/setup' },
      { id: 'api', label: 'API', href: '/docs/api' },
    ],
    mainHeading: 'Introduction',
    mainBody: 'Welcome to the docs.',
  },
  stories: {
    IntroActive: {},
    SetupActive: {
      args: {
        navItems: [
          { id: 'intro', label: 'Introduction', href: '/docs/intro' },
          { id: 'setup', label: 'Setup', href: '/docs/setup', active: true },
          { id: 'api', label: 'API', href: '/docs/api' },
        ],
        mainHeading: 'Setup',
        mainBody: 'How to set up.',
      },
    },
  },
};

// ---- Aggregates ----

export const PRIMITIVE_METAS: ReadonlyArray<StoryMeta<Record<string, unknown>>> = [
  buttonMeta as unknown as StoryMeta<Record<string, unknown>>,
  inputMeta as unknown as StoryMeta<Record<string, unknown>>,
  cardMeta as unknown as StoryMeta<Record<string, unknown>>,
  modalMeta as unknown as StoryMeta<Record<string, unknown>>,
  dropdownMeta as unknown as StoryMeta<Record<string, unknown>>,
  tabsMeta as unknown as StoryMeta<Record<string, unknown>>,
  toastMeta as unknown as StoryMeta<Record<string, unknown>>,
  tableMeta as unknown as StoryMeta<Record<string, unknown>>,
  tooltipMeta as unknown as StoryMeta<Record<string, unknown>>,
  badgeMeta as unknown as StoryMeta<Record<string, unknown>>,
  avatarMeta as unknown as StoryMeta<Record<string, unknown>>,
  iconMeta as unknown as StoryMeta<Record<string, unknown>>,
];

export const LAYOUT_METAS: ReadonlyArray<StoryMeta<Record<string, unknown>>> = [
  pageContainerMeta as unknown as StoryMeta<Record<string, unknown>>,
  sectionRowMeta as unknown as StoryMeta<Record<string, unknown>>,
  sidebarShellMeta as unknown as StoryMeta<Record<string, unknown>>,
];

/** All metas — 12 primitive + 3 layout + form = 16 meta (Form is not in the 12 primitive count). */
export const ALL_METAS: ReadonlyArray<StoryMeta<Record<string, unknown>>> = [
  ...PRIMITIVE_METAS,
  formMeta as unknown as StoryMeta<Record<string, unknown>>,
  ...LAYOUT_METAS,
];

/**
 * The 5 interaction-focus stories. These are the play-carrying stories that
 * the InteractionRunner treats as first-class @storybook/test scenarios
 * (click / type / assert). The remaining play stories (Modal/Closable,
 * Dropdown/Change, Tabs/Switch etc.) are still run by the play adapter for
 * coverage, but the interaction runner v1.34-4 highlights these 5 as the
 * SaaS surface's canonical user actions.
 */
export const INTERACTION_FOCUS_STORIES: ReadonlyArray<{
  title: string;
  storyName: string;
}> = [
  { title: 'DesignSystem/Button', storyName: 'Interactive' },
  { title: 'DesignSystem/Input', storyName: 'Typing' },
  { title: 'DesignSystem/Modal', storyName: 'Closable' },
  { title: 'DesignSystem/Form', storyName: 'Submit' },
  { title: 'DesignSystem/Tabs', storyName: 'Switch' },
];

export function countStories(): number {
  let n = 0;
  for (const meta of ALL_METAS) {
    n += Object.keys(meta.stories ?? {}).length;
  }
  return n;
}

export function countPrimitiveStories(): number {
  let n = 0;
  for (const meta of PRIMITIVE_METAS) {
    n += Object.keys(meta.stories ?? {}).length;
  }
  return n;
}

export function countLayoutStories(): number {
  let n = 0;
  for (const meta of LAYOUT_METAS) {
    n += Object.keys(meta.stories ?? {}).length;
  }
  return n;
}

export function countPlayStories(): number {
  let n = 0;
  for (const meta of ALL_METAS) {
    for (const story of Object.values(meta.stories ?? {})) {
      if (story.play) n += 1;
    }
  }
  return n;
}
