import { mockExpoRouter, type ExpoRouterMock, type ExpoRouterOptions } from './router.js';
import { mockSecureStore, type SecureStoreMock, type SecureStoreOptions } from './secure-store.js';
import { mockFileSystem, type FileSystemMock, type FileSystemOptions } from './file-system.js';
import { mockCamera, type CameraMock, type CameraOptions } from './camera.js';
import type { ScheduledNotification } from './notifications.js';

export interface CreateExpoTestEnvOptions {
  router?: ExpoRouterOptions;
  secureStore?: SecureStoreOptions;
  fileSystem?: FileSystemOptions;
  camera?: CameraOptions;
  nowFn?: () => number;
}

export interface ExpoTestEnv {
  router: ExpoRouterMock;
  secureStore: SecureStoreMock;
  fileSystem: FileSystemMock;
  camera: CameraMock;
  scheduled: ScheduledNotification[];
  nowFn: () => number;
  nextId: () => string;
  reset: () => void;
}

/**
 * Expo runtime mock env。 Router / SecureStore / Notifications / FileSystem / Camera の
 * 5 SDK mock を集約、 単一 env object 経由で全 SDK を叩ける。
 */
export function createExpoTestEnv(options: CreateExpoTestEnvOptions = {}): ExpoTestEnv {
  const nowFn = options.nowFn ?? (() => 1_700_000_000_000);
  let notificationCounter = 0;
  const nextId = () => {
    notificationCounter += 1;
    return `notif-${notificationCounter}`;
  };

  const env: ExpoTestEnv = {
    router: mockExpoRouter(options.router ?? {}),
    secureStore: mockSecureStore(options.secureStore ?? {}),
    fileSystem: mockFileSystem(options.fileSystem ?? {}),
    camera: mockCamera(options.camera ?? {}),
    scheduled: [],
    nowFn,
    nextId,
    reset() {
      env.router.clear();
      env.secureStore.clear();
      env.fileSystem.clear();
      env.camera.clear();
      env.scheduled.length = 0;
      notificationCounter = 0;
    },
  };

  return env;
}
