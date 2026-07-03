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
  buildInput as buildInputFixture,
  buildModal as buildModalFixture,
} from '@kiwa-test/component';

/**
 * dogfood-storybook-design-system の 12 コンポーネント renderer 群。 5 primitive
 * (Button / Input / Card / Modal + Form-inspired input group) は
 * `@kiwa-test/component` の fixture を再利用、 残り 7 primitive (Dropdown /
 * Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon) は本 file で新規実装
 * する。 全 12 は framework agnostic な `(args) => MockNode` shape に統一され、
 * Storybook 8 StoryObj の render callback として使える。
 *
 * v1.16-2 (Issue #764) 新設。 SaaS design system の頻出 12 primitive を選定、
 * Storybook + play function + a11y + Chromatic の全経路を回せる範囲を確保する。
 */

// ---- Button ----
// primitive は @kiwa-test/component の fixture をそのまま再利用する。 dogfood は
// story 定義 (variant × state 組合せ) を追加する層。
export const buildButton = buildButtonFixture;
export type { ButtonArgs };

// ---- Input ----
export const buildInput = buildInputFixture;
export type { InputArgs };

// ---- Card ----
export const buildCard = buildCardFixture;
export type { CardArgs };

// ---- Modal ----
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

/**
 * Dropdown — label + native select tag + option list。 mock harness は
 * change event で onChange を発火し、 選択された value を event.value に載せる。
 * disabled option は `disabled=true` 属性で表現。
 */
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

/**
 * Tabs — tablist role + tab buttons + tabpanel。 active tab は
 * `aria-selected=true`、 非 active は `aria-selected=false`、 panel は
 * `hidden` 属性で非表示にする。 tab click で onSelect が発火する。
 */
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
  for (const item of args.items) {
    const isActive = item.id === args.activeId;
    const panelAttrs: Record<string, string> = {
      role: 'tabpanel',
      id: `panel-${item.id}`,
      class: `tab-panel ${isActive ? 'tab-panel-active' : ''}`,
      'aria-labelledby': `tab-${item.id}`,
    };
    if (!isActive) panelAttrs['hidden'] = 'true';
    const panel = createNode('div', {
      attrs: panelAttrs,
      text: item.panel,
    });
    appendChild(wrapper, panel);
  }
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

/**
 * Toast — role=status で screen reader 通知、 level 別 class で色分け。
 * dismissible=true なら「x」 close button を出し、 click で onDismiss 発火。
 */
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

/**
 * Table — caption + thead + tbody の SaaS 標準表。 rows 0 件時は
 * empty-state cell を colspan で 1 行だけ表示する。 align は column 単位。
 */
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

/**
 * Tooltip — anchor button + `role=tooltip` 補足 span。 visible=false なら
 * `hidden` を付けて aria から隠す、 visible=true なら
 * `aria-describedby=<tooltip-id>` で anchor と紐付ける。
 */
export const buildTooltip: ComponentRender<TooltipArgs> = (args) => {
  const wrapper = createNode('span', { attrs: { class: 'tooltip-wrapper' } });
  const anchorAttrs: Record<string, string> = {
    type: 'button',
    class: 'tooltip-anchor',
    'aria-describedby': `tooltip-${args.id}`,
  };
  const anchor = createNode('button', {
    attrs: anchorAttrs,
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

/**
 * Badge — role=status で aria live に載る短い label。 count 指定時は
 * label と count を空白区切りで並べる (「Errors 3」 等)。
 */
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

/**
 * Avatar — imageUrl 有無で img or 頭文字 fallback を出しわける。 status は
 * `data-status` に反映して presence indicator と紐付ける。 size は class で
 * 表現、 default は 'md'。
 */
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
  if (args.status) {
    const dot = createNode('span', {
      attrs: {
        class: `avatar-status avatar-status-${args.status}`,
        'aria-hidden': 'true',
      },
    });
    appendChild(wrapper, dot);
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

/**
 * Icon — inline svg placeholder で「name」 と glyph を関連付ける。
 * decorative=true (装飾のみ) なら `aria-hidden=true` + role なし、
 * decorative=false (情報を持つ) なら `role=img` + `aria-label=<label>`。
 */
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
  // svg 本体ではなく symbol-use ref を表現 (framework 側は本物の svg に置換)。
  const svg = createNode('svg', { attrs });
  const useNode = createNode('use', {
    attrs: { href: `#icon-${args.name}` },
  });
  appendChild(svg, useNode);
  return svg;
};

// ---- Form (Input-group、 5 fixture の 5 番目) ----

export interface FormArgs {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: (data: Record<string, string>) => void;
}

/**
 * Form — @kiwa-test/component の buildForm と同 semantic を dogfood 側で
 * 再定義 (form + submit + validation)。 story の args を型で縛る用途、
 * fixture との実装差はない。
 */
export const buildForm: ComponentRender<FormArgs> = (args) => {
  const form = createNode('form', {
    attrs: { class: 'form', role: 'form' },
  });
  const heading = createNode('h2', {
    attrs: { class: 'form-title' },
    text: args.title,
  });
  appendChild(form, heading);

  const fieldValues = new Map<string, string>();
  for (const field of args.fields) {
    fieldValues.set(field.id, field.value ?? '');
    const wrapper = buildInputFixture({
      id: field.id,
      label: field.label,
      ...(field.type !== undefined ? { type: field.type } : {}),
      ...(field.required !== undefined ? { required: field.required } : {}),
      value: field.value ?? '',
      onChange: (event: MockEvent) => {
        if (event.value !== undefined) {
          fieldValues.set(field.id, event.value);
        }
      },
    });
    appendChild(form, wrapper);
  }
  const submit = createNode('button', {
    attrs: {
      type: 'submit',
      class: 'form-submit btn btn-primary',
    },
    text: args.submitLabel ?? 'Submit',
    on: {
      click: () => {
        for (const field of args.fields) {
          if (field.required && !fieldValues.get(field.id)) {
            return;
          }
        }
        args.onSubmit?.(Object.fromEntries(fieldValues));
      },
    },
  });
  appendChild(form, submit);
  return form;
};

export type { MockNode };
