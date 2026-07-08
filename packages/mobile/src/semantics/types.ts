/**
 * @kiwa-test/mobile — Mobile test harness (v0.1、 new-base pair 第 13)。
 *
 * 3 axis (React Native + Expo + Metro) を target-neutral state machine で扱う。
 * target = ios + android + web (Expo Web) の 3 platform、 provider dialect も
 * 3 target で mapping。
 */
export type MobileTarget = 'ios' | 'android' | 'web';

export type MobileAxis = 'react-native' | 'expo' | 'metro';

export type NeutralEventName =
  // React Native axis (component + native module + gesture)
  | 'rn.component_mounted'
  | 'rn.native_module_invoked'
  | 'rn.gesture_recognized'
  | 'rn.component_unmounted'
  // Expo axis (build config + linking + push)
  | 'expo.build_config_loaded'
  | 'expo.deep_link_resolved'
  | 'expo.push_notification_received'
  | 'expo.build_completed'
  // Metro axis (bundler + HMR + resolver)
  | 'metro.bundle_started'
  | 'metro.module_resolved'
  | 'metro.hmr_applied'
  | 'metro.bundle_completed';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<MobileTarget, Partial<Record<NeutralEventName, string>>> = {
  ios: {
    'rn.component_mounted': 'ios.rn.uikit.mount',
    'rn.native_module_invoked': 'ios.rn.bridge.invoke',
    'rn.gesture_recognized': 'ios.rn.gesture.recognize',
    'rn.component_unmounted': 'ios.rn.uikit.unmount',
    'expo.build_config_loaded': 'ios.expo.app.json',
    'expo.deep_link_resolved': 'ios.expo.universal-link',
    'expo.push_notification_received': 'ios.expo.apns',
    'expo.build_completed': 'ios.expo.eas.build',
    'metro.bundle_started': 'ios.metro.transform.start',
    'metro.module_resolved': 'ios.metro.resolver',
    'metro.hmr_applied': 'ios.metro.hmr',
    'metro.bundle_completed': 'ios.metro.transform.done',
  },
  android: {
    'rn.component_mounted': 'android.rn.uimanager.mount',
    'rn.native_module_invoked': 'android.rn.bridge.invoke',
    'rn.gesture_recognized': 'android.rn.gesture.detect',
    'rn.component_unmounted': 'android.rn.uimanager.unmount',
    'expo.build_config_loaded': 'android.expo.app.json',
    'expo.deep_link_resolved': 'android.expo.app-link',
    'expo.push_notification_received': 'android.expo.fcm',
    'expo.build_completed': 'android.expo.eas.build',
    'metro.bundle_started': 'android.metro.transform.start',
    'metro.module_resolved': 'android.metro.resolver',
    'metro.hmr_applied': 'android.metro.hmr',
    'metro.bundle_completed': 'android.metro.transform.done',
  },
  web: {
    'rn.component_mounted': 'web.rn-web.mount',
    'rn.native_module_invoked': 'web.rn-web.polyfill.invoke',
    'rn.gesture_recognized': 'web.rn-web.gesture-shim',
    'rn.component_unmounted': 'web.rn-web.unmount',
    'expo.build_config_loaded': 'web.expo.web.config',
    'expo.deep_link_resolved': 'web.expo.href-router',
    'expo.push_notification_received': 'web.expo.web-push',
    'expo.build_completed': 'web.expo.web.build',
    'metro.bundle_started': 'web.metro-web.transform.start',
    'metro.module_resolved': 'web.metro-web.resolver',
    'metro.hmr_applied': 'web.metro-web.hmr',
    'metro.bundle_completed': 'web.metro-web.transform.done',
  },
};

export function providerEventName(target: MobileTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
