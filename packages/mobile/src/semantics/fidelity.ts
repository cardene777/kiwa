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
  // v1.51 advanced II
  navigation: [
    'navigation.stack_pushed',
    'navigation.tab_switched',
    'navigation.modal_opened',
    'navigation.deep_link_navigated',
  ],
  reanimated: [
    'reanimated.shared_value_updated',
    'reanimated.worklet_executed',
    'reanimated.animation_started',
    'reanimated.animation_completed',
  ],
  'async-storage': [
    'async-storage.item_set',
    'async-storage.item_read',
    'async-storage.item_removed',
    'async-storage.batch_flushed',
  ],
  'secure-storage': [
    'secure-storage.credential_stored',
    'secure-storage.credential_retrieved',
    'secure-storage.biometric_challenged',
    'secure-storage.credential_removed',
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
