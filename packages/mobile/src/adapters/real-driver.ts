/**
 * Mobile real driver env-gate (v0.2)。
 *
 * v1.51 で real CLI (Expo EAS + Metro real bundle + React Navigation deep link
 * verify + Reanimated JSI worklet + AsyncStorage / MMKV native + Keychain /
 * Keystore native) 呼出を stub 経由で隠蔽する契約。
 *
 * env `KIWA_MOBILE_MODE=real` + 対応 URL env が全揃った時のみ real 呼出。
 * それ以外は explicit throw で fail-closed。
 */

export type MobileRealDriverAxis =
  | 'expo-eas'
  | 'metro'
  | 'navigation'
  | 'reanimated'
  | 'async-storage'
  | 'secure-storage';

export interface MobileRealDriverEnv {
  mode: 'real';
  expoEasUrl?: string;
  metroUrl?: string;
  navigationUrl?: string;
  reanimatedUrl?: string;
  asyncStorageUrl?: string;
  secureStorageUrl?: string;
}

const ENV_KEY_BY_AXIS: Record<MobileRealDriverAxis, keyof MobileRealDriverEnv> = {
  'expo-eas': 'expoEasUrl',
  metro: 'metroUrl',
  navigation: 'navigationUrl',
  reanimated: 'reanimatedUrl',
  'async-storage': 'asyncStorageUrl',
  'secure-storage': 'secureStorageUrl',
};

export function readMobileRealDriverEnv(env: NodeJS.ProcessEnv = process.env): MobileRealDriverEnv | null {
  if (env.KIWA_MOBILE_MODE !== 'real') return null;
  const out: MobileRealDriverEnv = { mode: 'real' };
  if (env.KIWA_EXPO_EAS_URL) out.expoEasUrl = env.KIWA_EXPO_EAS_URL;
  if (env.KIWA_METRO_URL) out.metroUrl = env.KIWA_METRO_URL;
  if (env.KIWA_NAVIGATION_URL) out.navigationUrl = env.KIWA_NAVIGATION_URL;
  if (env.KIWA_REANIMATED_URL) out.reanimatedUrl = env.KIWA_REANIMATED_URL;
  if (env.KIWA_ASYNC_STORAGE_URL) out.asyncStorageUrl = env.KIWA_ASYNC_STORAGE_URL;
  if (env.KIWA_SECURE_STORAGE_URL) out.secureStorageUrl = env.KIWA_SECURE_STORAGE_URL;
  return out;
}

export function assertMobileRealDriverAvailable(
  axis: MobileRealDriverAxis,
  env: MobileRealDriverEnv | null,
): void {
  if (env === null) {
    throw new Error(
      `mobile real driver requested for ${axis} but KIWA_MOBILE_MODE!=='real'`,
    );
  }
  const envKey = ENV_KEY_BY_AXIS[axis];
  const value = env[envKey];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `mobile ${axis} URL env (${String(envKey)}) not set; real driver unavailable`,
    );
  }
}
