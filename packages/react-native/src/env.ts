import { mockAsyncStorage, type AsyncStorageInitial, type AsyncStorageMock } from './async-storage.js';
import { mockNavigation, type NavigationMock, type NavigationRoute } from './navigation.js';
import { createLinkingState, type LinkingState } from './linking.js';
import type { PlatformState } from './platform.js';
import type { DimensionsState } from './dimensions.js';

export type RNPlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos';

export interface CreateRNTestEnvOptions {
  platform?: RNPlatformOS;
  version?: number | string;
  initialRoute?: NavigationRoute;
  asyncStorageInitial?: AsyncStorageInitial;
  initialUrl?: string;
  window?: { width: number; height: number; scale?: number };
  screen?: { width: number; height: number; scale?: number };
}

export interface RNTestEnv {
  platform: PlatformState;
  dimensions: DimensionsState;
  asyncStorage: AsyncStorageMock;
  navigation: NavigationMock;
  linking: LinkingState;
}

/**
 * RN test env bundle。 5 primitive (platform / dimensions / asyncStorage / navigation /
 * linking) を 1 env に集約、 test setup で 1 呼出しすれば全 API mock が使える。
 */
export function createRNTestEnv(options: CreateRNTestEnvOptions = {}): RNTestEnv {
  const platform: PlatformState = {
    os: options.platform ?? 'ios',
    version: options.version ?? 17,
  };
  const dimensions: DimensionsState = {
    window: {
      width: options.window?.width ?? 390,
      height: options.window?.height ?? 844,
      scale: options.window?.scale ?? 3,
    },
    screen: {
      width: options.screen?.width ?? 390,
      height: options.screen?.height ?? 844,
      scale: options.screen?.scale ?? 3,
    },
  };
  const asyncStorage = mockAsyncStorage(options.asyncStorageInitial);
  const navigation = mockNavigation(options.initialRoute ?? { name: 'Home' });
  const linking = createLinkingState(options.initialUrl ?? null);
  return { platform, dimensions, asyncStorage, navigation, linking };
}
