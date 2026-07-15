export interface LinkingEvent {
  url: string;
  timestamp: number;
}

export type LinkingListener = (event: LinkingEvent) => void;

export interface LinkingState {
  initialUrl: string | null;
  listeners: LinkingListener[];
  received: LinkingEvent[];
}

export function createLinkingState(initialUrl: string | null = null): LinkingState {
  return { initialUrl, listeners: [], received: [] };
}

/**
 * Linking.addEventListener 相当 event 発火 mock。 deep link / universal link の
 * simulation を in-process で行う。
 */
export function dispatchLinkingUrl(
  state: LinkingState,
  url: string,
  timestamp: number = 0,
): LinkingEvent {
  const event: LinkingEvent = { url, timestamp };
  state.received.push(event);
  for (const cb of state.listeners) cb(event);
  return event;
}
