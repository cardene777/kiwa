import { appendChild, createNode } from '@kiwa-test/component';
import type {
  ButtonArgs,
  CardArgs,
  ComponentRender,
  FormField,
  InputArgs,
  MockEvent,
  MockNode,
  ModalArgs,
} from '@kiwa-test/component';
import {
  buildButton as buildButtonFixture,
  buildCard as buildCardFixture,
  buildForm as buildFormFixture,
  buildInput as buildInputFixture,
  buildModal as buildModalFixture,
} from '@kiwa-test/component';

/**
 * dogfood-storybook-8-mdx-app の 12 primitive + 3 layout renderer 群。 v1.34-4
 * (Issue #1051) で新設。 v1.16-2 の dogfood-storybook-design-system と同 shape
 * の primitive 12 個に、 layout 3 個 (PageContainer / SectionRow / SidebarShell)
 * を追加。 全 15 は framework agnostic な `(args) => MockNode` shape に統一。
 *
 * MDX docs で 12 primitive を preview block として mount するのに使う。
 * layout 3 個は「component を組み合わせた画面構造」 example を MDX で示す
 * 用途 — SaaS の real layout composition が MDX の説明として成立する事を
 * 示す minimal set。
 */

// ---- 12 primitives (v1.16-2 と同 shape) ----

export const buildButton = buildButtonFixture;
export type { ButtonArgs };

export const buildInput = buildInputFixture;
export type { InputArgs };

export const buildCard = buildCardFixture;
export type { CardArgs };

export const buildModal = buildModalFixture;
export type { ModalArgs };

// ---- Dropdown ----

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownArgs {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange?: (event: MockEvent) => void;
}

export const buildDropdown: ComponentRender<DropdownArgs> = (args) => {
  const wrapper = createNode('div', { attrs: { class: 'dropdown' } });
  const label = createNode('label', {
    attrs: { for: args.id, class: 'dropdown-label' },
    text: args.label,
  });
  const select = createNode('select', {
    attrs: {
      id: args.id,
      name: args.id,
      class: 'dropdown-select',
    },
    value: args.value,
    ...(args.onChange ? { on: { change: args.onChange } } : {}),
  });
  for (const option of args.options) {
    const optAttrs: Record<string, string> = { value: option.value };
    if (option.disabled) optAttrs['disabled'] = 'true';
    if (option.value === args.value) optAttrs['selected'] = 'true';
    const opt = createNode('option', {
      attrs: optAttrs,
      text: option.label,
    });
    appendChild(select, opt);
  }
  appendChild(wrapper, label);
  appendChild(wrapper, select);
  return wrapper;
};

// ---- Tabs ----

export interface TabItem {
  id: string;
  label: string;
  panel: string;
  disabled?: boolean;
}

export interface TabsArgs {
  activeId: string;
  items: TabItem[];
  onSelect?: (event: MockEvent) => void;
}

export const buildTabs: ComponentRender<TabsArgs> = (args) => {
  const wrapper = createNode('div', {
    attrs: { class: 'tabs', role: 'presentation' },
  });
  const tablist = createNode('div', {
    attrs: { role: 'tablist', class: 'tabs-list' },
  });
  for (const item of args.items) {
    const isActive = item.id === args.activeId;
    const attrs: Record<string, string> = {
      role: 'tab',
      id: `tab-${item.id}`,
      class: `tab ${isActive ? 'tab-active' : 'tab-inactive'}`,
      'aria-selected': isActive ? 'true' : 'false',
      'aria-controls': `panel-${item.id}`,
      type: 'button',
    };
    if (item.disabled) {
      attrs['disabled'] = 'true';
      attrs['aria-disabled'] = 'true';
    }
    const tab = createNode('button', {
      attrs,
      text: item.label,
      ...(args.onSelect && !item.disabled
        ? {
            on: {
              click: (event: MockEvent) => {
                args.onSelect?.({ ...event, value: item.id });
              },
            },
          }
        : {}),
    });
    appendChild(tablist, tab);
  }
  appendChild(wrapper, tablist);
  return wrapper;
};

// ---- Toast ----

export interface ToastArgs {
  id: string;
  title: string;
  body?: string;
  level: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: (event: MockEvent) => void;
}

export const buildToast: ComponentRender<ToastArgs> = (args) => {
  const wrapper = createNode('div', {
    attrs: {
      role: 'status',
      class: `toast toast-${args.level}`,
      id: `toast-${args.id}`,
      'aria-live': args.level === 'error' ? 'assertive' : 'polite',
    },
  });
  const heading = createNode('strong', {
    attrs: { class: 'toast-title' },
    text: args.title,
  });
  appendChild(wrapper, heading);
  if (args.body) {
    const body = createNode('p', {
      attrs: { class: 'toast-body' },
      text: args.body,
    });
    appendChild(wrapper, body);
  }
  if (args.dismissible) {
    const closeBtn = createNode('button', {
      attrs: {
        type: 'button',
        class: 'toast-close',
        'aria-label': 'Dismiss notification',
      },
      text: 'x',
      ...(args.onDismiss ? { on: { click: args.onDismiss } } : {}),
    });
    appendChild(wrapper, closeBtn);
  }
  return wrapper;
};

// ---- Table ----

export interface TableColumn {
  id: string;
  header: string;
  align?: 'left' | 'right' | 'center';
}

export interface TableArgs {
  caption?: string;
  columns: TableColumn[];
  rows: Array<Record<string, string>>;
  emptyMessage?: string;
}

export const buildTable: ComponentRender<TableArgs> = (args) => {
  const table = createNode('table', { attrs: { class: 'table' } });
  if (args.caption) {
    const caption = createNode('caption', {
      attrs: { class: 'table-caption' },
      text: args.caption,
    });
    appendChild(table, caption);
  }
  const thead = createNode('thead', { attrs: { class: 'table-head' } });
  const headRow = createNode('tr', { attrs: { class: 'table-row-head' } });
  for (const col of args.columns) {
    const attrs: Record<string, string> = {
      scope: 'col',
      class: `table-cell table-head-cell col-${col.id}`,
    };
    if (col.align) attrs['data-align'] = col.align;
    const th = createNode('th', {
      attrs,
      text: col.header,
    });
    appendChild(headRow, th);
  }
  appendChild(thead, headRow);
  appendChild(table, thead);
  const tbody = createNode('tbody', { attrs: { class: 'table-body' } });
  if (args.rows.length === 0) {
    const emptyRow = createNode('tr', { attrs: { class: 'table-row-empty' } });
    const cell = createNode('td', {
      attrs: {
        class: 'table-cell table-cell-empty',
        colspan: String(args.columns.length),
      },
      text: args.emptyMessage ?? 'No records',
    });
    appendChild(emptyRow, cell);
    appendChild(tbody, emptyRow);
  } else {
    for (const row of args.rows) {
      const tr = createNode('tr', { attrs: { class: 'table-row' } });
      for (const col of args.columns) {
        const attrs: Record<string, string> = {
          class: `table-cell col-${col.id}`,
        };
        if (col.align) attrs['data-align'] = col.align;
        const td = createNode('td', {
          attrs,
          text: row[col.id] ?? '',
        });
        appendChild(tr, td);
      }
      appendChild(tbody, tr);
    }
  }
  appendChild(table, tbody);
  return table;
};

// ---- Tooltip ----

export interface TooltipArgs {
  id: string;
  label: string;
  tip: string;
  visible: boolean;
}

export const buildTooltip: ComponentRender<TooltipArgs> = (args) => {
  const wrapper = createNode('span', { attrs: { class: 'tooltip-wrapper' } });
  const anchor = createNode('button', {
    attrs: {
      type: 'button',
      class: 'tooltip-anchor',
      'aria-describedby': `tooltip-${args.id}`,
    },
    text: args.label,
  });
  const tooltipAttrs: Record<string, string> = {
    role: 'tooltip',
    id: `tooltip-${args.id}`,
    class: `tooltip ${args.visible ? 'tooltip-visible' : 'tooltip-hidden'}`,
  };
  if (!args.visible) tooltipAttrs['hidden'] = 'true';
  const tip = createNode('span', {
    attrs: tooltipAttrs,
    text: args.tip,
  });
  appendChild(wrapper, anchor);
  appendChild(wrapper, tip);
  return wrapper;
};

// ---- Badge ----

export interface BadgeArgs {
  label: string;
  variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  count?: number;
}

export const buildBadge: ComponentRender<BadgeArgs> = (args) => {
  const attrs: Record<string, string> = {
    role: 'status',
    class: `badge badge-${args.variant}`,
    'aria-label':
      args.count !== undefined ? `${args.label} ${args.count}` : args.label,
  };
  const text =
    args.count !== undefined ? `${args.label} ${args.count}` : args.label;
  return createNode('span', {
    attrs,
    text,
  });
};

// ---- Avatar ----

export interface AvatarArgs {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

export const buildAvatar: ComponentRender<AvatarArgs> = (args) => {
  const size = args.size ?? 'md';
  const wrapperAttrs: Record<string, string> = {
    class: `avatar avatar-${size}`,
    'aria-label': args.name,
    role: 'img',
  };
  if (args.status) wrapperAttrs['data-status'] = args.status;
  const wrapper = createNode('span', { attrs: wrapperAttrs });
  if (args.imageUrl) {
    const img = createNode('img', {
      attrs: {
        src: args.imageUrl,
        alt: args.name,
        class: 'avatar-image',
      },
    });
    appendChild(wrapper, img);
  } else {
    const initials = extractInitials(args.name);
    const fallback = createNode('span', {
      attrs: {
        class: 'avatar-initials',
        'aria-hidden': 'true',
      },
      text: initials,
    });
    appendChild(wrapper, fallback);
  }
  return wrapper;
};

function extractInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    const first = parts[0] ?? '';
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

// ---- Icon ----

export interface IconArgs {
  name: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  decorative?: boolean;
}

export const buildIcon: ComponentRender<IconArgs> = (args) => {
  const size = args.size ?? 'md';
  const attrs: Record<string, string> = {
    class: `icon icon-${args.name} icon-${size}`,
    'data-icon': args.name,
    focusable: 'false',
  };
  if (args.decorative) {
    attrs['aria-hidden'] = 'true';
  } else {
    attrs['role'] = 'img';
    attrs['aria-label'] = args.label;
  }
  const svg = createNode('svg', { attrs });
  const useNode = createNode('use', {
    attrs: { href: `#icon-${args.name}` },
  });
  appendChild(svg, useNode);
  return svg;
};

// ---- Form ----

export interface FormArgs {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: (data: Record<string, string>) => void;
}

export const buildForm = buildFormFixture as ComponentRender<FormArgs>;

// ---- 3 layouts (v1.34-4 で新規、 MDX docs で「component を組み合わせた画面」 example に使う) ----

// PageContainer — 上部 header + 下部 main の 2 段 layout。

export interface PageContainerArgs {
  heading: string;
  subheading?: string;
  bodyText: string;
}

export const buildPageContainer: ComponentRender<PageContainerArgs> = (args) => {
  const wrapper = createNode('div', {
    attrs: { class: 'page-container', role: 'main' },
  });
  const header = createNode('header', {
    attrs: { class: 'page-container-header' },
  });
  const heading = createNode('h1', {
    attrs: { class: 'page-container-heading' },
    text: args.heading,
  });
  appendChild(header, heading);
  if (args.subheading) {
    const subheading = createNode('p', {
      attrs: { class: 'page-container-subheading' },
      text: args.subheading,
    });
    appendChild(header, subheading);
  }
  appendChild(wrapper, header);
  const main = createNode('section', {
    attrs: { class: 'page-container-body' },
    text: args.bodyText,
  });
  appendChild(wrapper, main);
  return wrapper;
};

// SectionRow — 2 or 3 column の並列 layout。

export interface SectionColumn {
  id: string;
  heading: string;
  body: string;
}

export interface SectionRowArgs {
  heading: string;
  columns: SectionColumn[];
}

export const buildSectionRow: ComponentRender<SectionRowArgs> = (args) => {
  const wrapper = createNode('section', {
    attrs: { class: 'section-row', 'aria-labelledby': 'section-row-heading' },
  });
  const heading = createNode('h2', {
    attrs: { id: 'section-row-heading', class: 'section-row-heading' },
    text: args.heading,
  });
  appendChild(wrapper, heading);
  const row = createNode('div', {
    attrs: { class: `section-row-columns section-row-columns-${args.columns.length}` },
  });
  for (const col of args.columns) {
    const column = createNode('article', {
      attrs: {
        class: 'section-row-column',
        id: `section-row-column-${col.id}`,
      },
    });
    const colHeading = createNode('h3', {
      attrs: { class: 'section-row-column-heading' },
      text: col.heading,
    });
    const colBody = createNode('p', {
      attrs: { class: 'section-row-column-body' },
      text: col.body,
    });
    appendChild(column, colHeading);
    appendChild(column, colBody);
    appendChild(row, column);
  }
  appendChild(wrapper, row);
  return wrapper;
};

// SidebarShell — nav + main の左右 2 段 layout。

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}

export interface SidebarShellArgs {
  navHeading: string;
  navItems: SidebarNavItem[];
  mainHeading: string;
  mainBody: string;
}

export const buildSidebarShell: ComponentRender<SidebarShellArgs> = (args) => {
  const wrapper = createNode('div', {
    attrs: { class: 'sidebar-shell' },
  });
  const nav = createNode('nav', {
    attrs: { class: 'sidebar-shell-nav', 'aria-label': args.navHeading },
  });
  const navHeading = createNode('h2', {
    attrs: { class: 'sidebar-shell-nav-heading' },
    text: args.navHeading,
  });
  appendChild(nav, navHeading);
  const list = createNode('ul', {
    attrs: { class: 'sidebar-shell-nav-list', role: 'list' },
  });
  for (const item of args.navItems) {
    const listItem = createNode('li', {
      attrs: {
        class: `sidebar-shell-nav-item ${item.active ? 'sidebar-shell-nav-item-active' : ''}`,
      },
    });
    const linkAttrs: Record<string, string> = {
      class: 'sidebar-shell-nav-link',
      href: item.href,
    };
    if (item.active) linkAttrs['aria-current'] = 'page';
    const link = createNode('a', {
      attrs: linkAttrs,
      text: item.label,
    });
    appendChild(listItem, link);
    appendChild(list, listItem);
  }
  appendChild(nav, list);
  appendChild(wrapper, nav);
  const main = createNode('main', {
    attrs: { class: 'sidebar-shell-main' },
  });
  const mainHeading = createNode('h1', {
    attrs: { class: 'sidebar-shell-main-heading' },
    text: args.mainHeading,
  });
  const mainBody = createNode('p', {
    attrs: { class: 'sidebar-shell-main-body' },
    text: args.mainBody,
  });
  appendChild(main, mainHeading);
  appendChild(main, mainBody);
  appendChild(wrapper, main);
  return wrapper;
};

export type { MockNode };
