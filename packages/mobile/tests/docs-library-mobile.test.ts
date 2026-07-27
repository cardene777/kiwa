import { expect, test } from 'vitest';
import {
  flushAsyncStorageBatch,
  initAsyncStorage,
  initNavigation,
  invokeMobileCli,
  invokeNativeModule,
  mountReactNativeComponent,
  navigateDeepLink,
  pushNavigationStack,
  readAsyncStorageItem,
  recognizeGesture,
  setAsyncStorageItem,
  switchNavigationTab,
  unmountReactNativeComponent,
} from '../src/index.js';

test('validates the Quickstart component lifecycle', () => {
  const session = mountReactNativeComponent({ target: 'android', componentId: 'home-screen' });
  invokeNativeModule(session, 'CameraModule');
  recognizeGesture(session, 'tap');
  unmountReactNativeComponent(session);
  expect(session.state).toBe('unmounted');
  expect(session.nativeModuleInvocations).toBe(1);
  expect(session.gesturesRecognized).toEqual(['tap']);
});

test('validates the navigation, storage, and CLI how-to', async () => {
  const navigation = initNavigation({ target: 'ios', navigatorId: 'root' });
  pushNavigationStack(navigation, 'profile');
  switchNavigationTab(navigation, 'settings');
  expect(navigateDeepLink(navigation, 'example://settings/notifications').neutralEvent)
    .toBe('navigation.deep_link_navigated');
  expect(navigation.stackHistory).toEqual(['profile']);

  const storage = initAsyncStorage({ target: 'web', storeId: 'preferences' });
  setAsyncStorageItem(storage, { key: 'theme', value: 'dark' });
  expect(readAsyncStorageItem(storage, 'theme').metadata.hit).toBe(true);
  expect(flushAsyncStorageBatch(storage).metadata.itemCount).toBe(1);

  const result = await invokeMobileCli({
    command: 'expo build', args: ['--platform', 'ios'],
    env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run' },
  });
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('expo build');
});
