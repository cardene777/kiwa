import { providerEventName, type MobileAxis, type MobileTarget, type NeutralEventName } from './types.js';

export interface FidelityRow {
  provider: MobileTarget;
  axis: MobileAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: MobileTarget[];
  axes: MobileAxis[];
  rows: FidelityRow[];
}

export const MOBILE_AXIS_TO_EVENTS: Record<MobileAxis, NeutralEventName[]> = {
  'react-native': [
    'rn.component_mounted',
    'rn.native_module_invoked',
    'rn.gesture_recognized',
    'rn.component_unmounted',
  ],
  expo: [
    'expo.build_config_loaded',
    'expo.deep_link_resolved',
    'expo.push_notification_received',
    'expo.build_completed',
  ],
  metro: [
    'metro.bundle_started',
    'metro.module_resolved',
    'metro.hmr_applied',
    'metro.bundle_completed',
  ],
};

export function collectFidelityCoverage(
  providers: MobileTarget[] = ['ios', 'android', 'web'],
): FidelityCoverage {
  const axes = Object.keys(MOBILE_AXIS_TO_EVENTS) as MobileAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = MOBILE_AXIS_TO_EVENTS[axis];
      rows.push({
        provider,
        axis,
        neutralEvents,
        providerEvents: neutralEvents.map((event) => providerEventName(provider, event)),
      });
    }
  }
  return { providers, axes, rows };
}
