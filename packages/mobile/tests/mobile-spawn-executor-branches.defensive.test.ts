import { describe, expect, it } from 'vitest';
import { sanitizeEnv } from '../src/adapters/spawn-executor.js';

describe('sanitizeEnv defensive branches', () => {
  it('preserves allowlisted keys with non-empty string values', () => {
    const result = sanitizeEnv('expo build', {
      PATH: '/usr/bin',
      HOME: '/Users/test',
      SECRET: 'should-be-dropped',
    });
    expect(result.PATH).toBe('/usr/bin');
    expect(result.SECRET).toBeUndefined();
  });

  it('drops keys with empty string values', () => {
    const result = sanitizeEnv('pod install', {
      PATH: '/usr/bin',
      HOME: '',
    });
    expect(result.PATH).toBe('/usr/bin');
    expect(result.HOME).toBeUndefined();
  });

  it('drops keys with undefined values', () => {
    const result = sanitizeEnv('gradle build', {
      PATH: '/usr/bin',
    });
    expect(result.PATH).toBe('/usr/bin');
    expect(result.JAVA_HOME).toBeUndefined();
  });

  it('handles unknown command via PATH-only fallback', () => {
    const result = sanitizeEnv('unknown-cmd' as never, {
      PATH: '/usr/bin',
      OTHER: 'value',
    });
    expect(result.PATH).toBe('/usr/bin');
    expect(result.OTHER).toBeUndefined();
  });

  it('handles react-native start with metro port', () => {
    const result = sanitizeEnv('react-native start', {
      PATH: '/usr/bin',
      RCT_METRO_PORT: '8081',
      SECRET: 'x',
    });
    expect(result.PATH).toBe('/usr/bin');
    expect(result.RCT_METRO_PORT).toBe('8081');
    expect(result.SECRET).toBeUndefined();
  });

  it('handles gradle build with JAVA_HOME + ANDROID_HOME', () => {
    const result = sanitizeEnv('gradle build', {
      PATH: '/usr/bin',
      JAVA_HOME: '/opt/java',
      ANDROID_HOME: '/opt/android',
      ANDROID_SDK_ROOT: '/opt/android-sdk',
    });
    expect(result.JAVA_HOME).toBe('/opt/java');
    expect(result.ANDROID_HOME).toBe('/opt/android');
    expect(result.ANDROID_SDK_ROOT).toBe('/opt/android-sdk');
  });
});
