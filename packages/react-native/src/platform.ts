import type { RNPlatformOS } from './env.js';

export interface PlatformState {
  os: RNPlatformOS;
  version: number | string;
  isPad?: boolean;
  isTV?: boolean;
}

/**
 * Platform.OS / Platform.Version 値差替。 iOS / Android / web / windows / macos の 5 OS を
 * 切替可能、 test 内で platform-dependent path の分岐を verify する経路。
 */
export function setPlatform(
  state: PlatformState,
  next: { os?: RNPlatformOS; version?: number | string; isPad?: boolean; isTV?: boolean },
): PlatformState {
  if (next.os !== undefined) state.os = next.os;
  if (next.version !== undefined) state.version = next.version;
  if (next.isPad !== undefined) state.isPad = next.isPad;
  if (next.isTV !== undefined) state.isTV = next.isTV;
  return state;
}
