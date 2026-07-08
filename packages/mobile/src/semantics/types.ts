/**
 * @kiwa/mobile — Mobile test harness (v0.1、 new-base pair 第 13)。
 *
 * 3 axis (React Native + Expo + Metro) を target-neutral state machine で扱う。
 * target = ios + android + web (Expo Web) の 3 platform、 provider dialect も
 * 3 target で mapping。
 */
export type MobileTarget = 'ios' | 'android' | 'web';

export type MobileAxis =
  | 'react-native'
  | 'expo'
  | 'metro'
  // v1.51 advanced II
  | 'navigation'
  | 'reanimated'
  | 'async-storage'
  | 'secure-storage'
  // v1.52 advanced III (New Architecture)
  | 'fabric'
  | 'turbo-modules'
  | 'codegen'
  | 'new-architecture';

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
  | 'metro.bundle_completed'
  // v1.51 navigation axis (React Navigation / Expo Router)
  | 'navigation.stack_pushed'
  | 'navigation.tab_switched'
  | 'navigation.modal_opened'
  | 'navigation.deep_link_navigated'
  // v1.51 reanimated axis (shared value + worklet)
  | 'reanimated.shared_value_updated'
  | 'reanimated.worklet_executed'
  | 'reanimated.animation_started'
  | 'reanimated.animation_completed'
  // v1.51 async-storage axis (AsyncStorage / MMKV)
  | 'async-storage.item_set'
  | 'async-storage.item_read'
  | 'async-storage.item_removed'
  | 'async-storage.batch_flushed'
  // v1.51 secure-storage axis (Keychain / EncryptedStorage / Keystore)
  | 'secure-storage.credential_stored'
  | 'secure-storage.credential_retrieved'
  | 'secure-storage.biometric_challenged'
  | 'secure-storage.credential_removed'
  // v1.52 fabric axis (concurrent renderer + priority + shadow tree)
  | 'fabric.render_scheduled'
  | 'fabric.shadow_tree_committed'
  | 'fabric.priority_updated'
  | 'fabric.mount_completed'
  // v1.52 turbo-modules axis (typed native module + JSI + spec generation)
  | 'turbo-modules.spec_registered'
  | 'turbo-modules.jsi_bound'
  | 'turbo-modules.method_invoked'
  | 'turbo-modules.unregistered'
  // v1.52 codegen axis (typed bridge + schema-first + type generation)
  | 'codegen.schema_loaded'
  | 'codegen.spec_generated'
  | 'codegen.type_emitted'
  | 'codegen.build_completed'
  // v1.52 new-architecture axis (async init + concurrent React + interop layer)
  | 'new-architecture.init_started'
  | 'new-architecture.concurrent_enabled'
  | 'new-architecture.interop_bridged'
  | 'new-architecture.ready';

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
    'navigation.stack_pushed': 'ios.rn-nav.stack.push',
    'navigation.tab_switched': 'ios.rn-nav.tab.switch',
    'navigation.modal_opened': 'ios.rn-nav.modal.present',
    'navigation.deep_link_navigated': 'ios.rn-nav.universal-link',
    'reanimated.shared_value_updated': 'ios.reanimated.sv.update',
    'reanimated.worklet_executed': 'ios.reanimated.worklet.run',
    'reanimated.animation_started': 'ios.reanimated.anim.start',
    'reanimated.animation_completed': 'ios.reanimated.anim.done',
    'async-storage.item_set': 'ios.mmkv.set',
    'async-storage.item_read': 'ios.mmkv.get',
    'async-storage.item_removed': 'ios.mmkv.delete',
    'async-storage.batch_flushed': 'ios.mmkv.batch',
    'secure-storage.credential_stored': 'ios.keychain.set',
    'secure-storage.credential_retrieved': 'ios.keychain.get',
    'secure-storage.biometric_challenged': 'ios.biometry.face-id',
    'secure-storage.credential_removed': 'ios.keychain.delete',
    'fabric.render_scheduled': 'ios.fabric.render.schedule',
    'fabric.shadow_tree_committed': 'ios.fabric.shadow.commit',
    'fabric.priority_updated': 'ios.fabric.priority.update',
    'fabric.mount_completed': 'ios.fabric.mount.done',
    'turbo-modules.spec_registered': 'ios.turbo.spec.register',
    'turbo-modules.jsi_bound': 'ios.turbo.jsi.bind',
    'turbo-modules.method_invoked': 'ios.turbo.method.invoke',
    'turbo-modules.unregistered': 'ios.turbo.unregister',
    'codegen.schema_loaded': 'ios.codegen.schema.load',
    'codegen.spec_generated': 'ios.codegen.spec.emit',
    'codegen.type_emitted': 'ios.codegen.type.write',
    'codegen.build_completed': 'ios.codegen.build.done',
    'new-architecture.init_started': 'ios.new-arch.init.start',
    'new-architecture.concurrent_enabled': 'ios.new-arch.concurrent.on',
    'new-architecture.interop_bridged': 'ios.new-arch.interop.bridge',
    'new-architecture.ready': 'ios.new-arch.ready',
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
    'navigation.stack_pushed': 'android.rn-nav.stack.push',
    'navigation.tab_switched': 'android.rn-nav.tab.switch',
    'navigation.modal_opened': 'android.rn-nav.dialog.show',
    'navigation.deep_link_navigated': 'android.rn-nav.app-link',
    'reanimated.shared_value_updated': 'android.reanimated.sv.update',
    'reanimated.worklet_executed': 'android.reanimated.worklet.run',
    'reanimated.animation_started': 'android.reanimated.anim.start',
    'reanimated.animation_completed': 'android.reanimated.anim.done',
    'async-storage.item_set': 'android.mmkv.set',
    'async-storage.item_read': 'android.mmkv.get',
    'async-storage.item_removed': 'android.mmkv.delete',
    'async-storage.batch_flushed': 'android.mmkv.batch',
    'secure-storage.credential_stored': 'android.keystore.set',
    'secure-storage.credential_retrieved': 'android.keystore.get',
    'secure-storage.biometric_challenged': 'android.biometry.fingerprint',
    'secure-storage.credential_removed': 'android.keystore.delete',
    'fabric.render_scheduled': 'android.fabric.render.schedule',
    'fabric.shadow_tree_committed': 'android.fabric.shadow.commit',
    'fabric.priority_updated': 'android.fabric.priority.update',
    'fabric.mount_completed': 'android.fabric.mount.done',
    'turbo-modules.spec_registered': 'android.turbo.spec.register',
    'turbo-modules.jsi_bound': 'android.turbo.jsi.bind',
    'turbo-modules.method_invoked': 'android.turbo.method.invoke',
    'turbo-modules.unregistered': 'android.turbo.unregister',
    'codegen.schema_loaded': 'android.codegen.schema.load',
    'codegen.spec_generated': 'android.codegen.spec.emit',
    'codegen.type_emitted': 'android.codegen.type.write',
    'codegen.build_completed': 'android.codegen.build.done',
    'new-architecture.init_started': 'android.new-arch.init.start',
    'new-architecture.concurrent_enabled': 'android.new-arch.concurrent.on',
    'new-architecture.interop_bridged': 'android.new-arch.interop.bridge',
    'new-architecture.ready': 'android.new-arch.ready',
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
    'navigation.stack_pushed': 'web.history.push',
    'navigation.tab_switched': 'web.history.tab.switch',
    'navigation.modal_opened': 'web.dialog.open',
    'navigation.deep_link_navigated': 'web.href.navigate',
    'reanimated.shared_value_updated': 'web.reanimated-web.sv.update',
    'reanimated.worklet_executed': 'web.reanimated-web.worklet.shim',
    'reanimated.animation_started': 'web.reanimated-web.anim.start',
    'reanimated.animation_completed': 'web.reanimated-web.anim.done',
    'async-storage.item_set': 'web.localStorage.setItem',
    'async-storage.item_read': 'web.localStorage.getItem',
    'async-storage.item_removed': 'web.localStorage.removeItem',
    'async-storage.batch_flushed': 'web.indexedDB.transaction',
    'secure-storage.credential_stored': 'web.credential-mgmt.store',
    'secure-storage.credential_retrieved': 'web.credential-mgmt.get',
    'secure-storage.biometric_challenged': 'web.webauthn.challenge',
    'secure-storage.credential_removed': 'web.credential-mgmt.remove',
    'fabric.render_scheduled': 'web.rn-web.render.schedule',
    'fabric.shadow_tree_committed': 'web.rn-web.vdom.commit',
    'fabric.priority_updated': 'web.rn-web.priority.update',
    'fabric.mount_completed': 'web.rn-web.mount.done',
    'turbo-modules.spec_registered': 'web.turbo-web.spec.register',
    'turbo-modules.jsi_bound': 'web.turbo-web.polyfill.bind',
    'turbo-modules.method_invoked': 'web.turbo-web.method.invoke',
    'turbo-modules.unregistered': 'web.turbo-web.unregister',
    'codegen.schema_loaded': 'web.codegen-web.schema.load',
    'codegen.spec_generated': 'web.codegen-web.spec.emit',
    'codegen.type_emitted': 'web.codegen-web.type.write',
    'codegen.build_completed': 'web.codegen-web.build.done',
    'new-architecture.init_started': 'web.new-arch-web.init.start',
    'new-architecture.concurrent_enabled': 'web.concurrent-react.enable',
    'new-architecture.interop_bridged': 'web.new-arch-web.interop.bridge',
    'new-architecture.ready': 'web.new-arch-web.ready',
  },
};

export function providerEventName(target: MobileTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
