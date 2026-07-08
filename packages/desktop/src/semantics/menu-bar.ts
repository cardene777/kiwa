import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Menu-bar axis (v0.2) — build + item + click + destroy の 4 step 遷移。
 * macOS NSMenu + Windows WM_MENU + Linux GTK menubar の 3 target を uniform 扱い。
 */
export type MenuBarState = 'idle' | 'built' | 'item-appended' | 'item-clicked' | 'destroyed';

export interface MenuBarItem {
  id: string;
  label: string;
  accelerator: string | null;
}

export interface MenuBarSession {
  target: DesktopTarget;
  menuId: string;
  state: MenuBarState;
  items: MenuBarItem[];
  clickCount: number;
  destroyed: boolean;
  history: AxisStep<MenuBarState>[];
}

function emit(
  session: MenuBarSession,
  neutralEvent:
    | 'menu-bar.built'
    | 'menu-bar.item_appended'
    | 'menu-bar.item_clicked'
    | 'menu-bar.destroyed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<MenuBarState> {
  const step: AxisStep<MenuBarState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { menuId: session.menuId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function buildMenuBar(input: { target: DesktopTarget; menuId: string }): MenuBarSession {
  if (input.menuId.length === 0) throw new Error('buildMenuBar: menuId must not be empty');
  const session: MenuBarSession = {
    target: input.target,
    menuId: input.menuId,
    state: 'built',
    items: [],
    clickCount: 0,
    destroyed: false,
    history: [],
  };
  emit(session, 'menu-bar.built', { target: input.target });
  return session;
}

export function appendMenuBarItem(
  session: MenuBarSession,
  item: MenuBarItem,
): AxisStep<MenuBarState> {
  if (session.destroyed) throw new Error('appendMenuBarItem: menu destroyed');
  if (item.id.length === 0) throw new Error('appendMenuBarItem: id must not be empty');
  if (item.label.length === 0) throw new Error('appendMenuBarItem: label must not be empty');
  if (session.items.some((existing) => existing.id === item.id)) {
    throw new Error(`appendMenuBarItem: duplicate id ${item.id}`);
  }
  session.items.push(item);
  session.state = 'item-appended';
  return emit(session, 'menu-bar.item_appended', {
    itemId: item.id,
    label: item.label,
    accelerator: item.accelerator ?? '',
    itemCount: session.items.length,
  });
}

export function clickMenuBarItem(
  session: MenuBarSession,
  itemId: string,
): AxisStep<MenuBarState> {
  if (session.destroyed) throw new Error('clickMenuBarItem: menu destroyed');
  if (!session.items.some((item) => item.id === itemId)) {
    throw new Error(`clickMenuBarItem: item ${itemId} not found`);
  }
  session.clickCount += 1;
  session.state = 'item-clicked';
  return emit(session, 'menu-bar.item_clicked', {
    itemId,
    clickCount: session.clickCount,
  });
}

export function destroyMenuBar(session: MenuBarSession): AxisStep<MenuBarState> {
  if (session.destroyed) throw new Error('destroyMenuBar: already destroyed');
  session.destroyed = true;
  session.state = 'destroyed';
  return emit(session, 'menu-bar.destroyed', {
    itemCount: session.items.length,
    clickCount: session.clickCount,
  });
}
