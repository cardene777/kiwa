import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.51 navigation axis — React Navigation / Expo Router を統一。
 * stack push + tab switch + modal open + deep link navigate。
 */
export type NavigationState = 'idle' | 'stack-pushed' | 'tab-switched' | 'modal-opened' | 'deep-linked';

export interface NavigationSession {
  target: MobileTarget;
  navigatorId: string;
  state: NavigationState;
  stackHistory: string[];
  activeTab: string | null;
  activeModals: string[];
  history: AxisStep<NavigationState>[];
}

function emit(
  session: NavigationSession,
  neutralEvent:
    | 'navigation.stack_pushed'
    | 'navigation.tab_switched'
    | 'navigation.modal_opened'
    | 'navigation.deep_link_navigated',
  metadata: Record<string, string | number | boolean>,
): AxisStep<NavigationState> {
  const step: AxisStep<NavigationState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { navigatorId: session.navigatorId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initNavigation(input: { target: MobileTarget; navigatorId: string }): NavigationSession {
  if (input.navigatorId.length === 0) throw new Error('initNavigation: navigatorId must not be empty');
  return {
    target: input.target,
    navigatorId: input.navigatorId,
    state: 'idle',
    stackHistory: [],
    activeTab: null,
    activeModals: [],
    history: [],
  };
}

export function pushNavigationStack(session: NavigationSession, screenName: string): AxisStep<NavigationState> {
  if (screenName.length === 0) throw new Error('pushNavigationStack: screenName must not be empty');
  session.stackHistory.push(screenName);
  session.state = 'stack-pushed';
  return emit(session, 'navigation.stack_pushed', { screenName, depth: session.stackHistory.length });
}

export function switchNavigationTab(session: NavigationSession, tabName: string): AxisStep<NavigationState> {
  if (tabName.length === 0) throw new Error('switchNavigationTab: tabName must not be empty');
  session.activeTab = tabName;
  session.state = 'tab-switched';
  return emit(session, 'navigation.tab_switched', { tabName });
}

export function openNavigationModal(session: NavigationSession, modalId: string): AxisStep<NavigationState> {
  if (modalId.length === 0) throw new Error('openNavigationModal: modalId must not be empty');
  session.activeModals.push(modalId);
  session.state = 'modal-opened';
  return emit(session, 'navigation.modal_opened', { modalId, activeModalCount: session.activeModals.length });
}

export function navigateDeepLink(session: NavigationSession, url: string): AxisStep<NavigationState> {
  if (url.length === 0) throw new Error('navigateDeepLink: url must not be empty');
  session.state = 'deep-linked';
  return emit(session, 'navigation.deep_link_navigated', { url });
}
