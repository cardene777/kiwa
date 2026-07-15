import type { MacAppEnv, ViewNode } from './env.js';

export type InteractionType = 'click' | 'keypress' | 'gesture' | 'focus';

export interface InteractionEvent {
  type: InteractionType;
  target: string;
  key?: string;
  gesture?: 'swipe' | 'pinch' | 'rotate' | 'longPress';
  modifiers?: Array<'cmd' | 'ctrl' | 'opt' | 'shift'>;
}

export interface InteractionResult {
  dispatched: boolean;
  targetFound: boolean;
  targetType?: string;
  handled: boolean;
  reason?: string;
}

/**
 * view tree を walk して target id を探索、 見つかったら enabled かつ mode-specific な
 * dispatchable node であれば event を eventLog に記録する。 responder chain (AppKit) や
 * SwiftUI の @State トリガー相当は現段階では event log 記録に留める (framework 相当の
 * 副作用は user 側の describe を通じて external assert する)。
 */
export function simulateUserInteraction(env: MacAppEnv, event: InteractionEvent): InteractionResult {
  const target = findNode(env.rootView, event.target);
  if (!target) {
    return { dispatched: false, targetFound: false, handled: false, reason: `target not found: ${event.target}` };
  }
  if (!target.enabled) {
    return { dispatched: false, targetFound: true, targetType: target.type, handled: false, reason: 'target disabled' };
  }
  env.eventLog.push({ at: env.now(), kind: `${event.type}:${event.target}`, detail: event });
  return { dispatched: true, targetFound: true, targetType: target.type, handled: true };
}

function findNode(node: ViewNode, id: string): ViewNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}
