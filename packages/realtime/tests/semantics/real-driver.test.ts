import { describe, expect, it } from 'vitest';
import {
  REAL_DRIVER_REQUIRED_KEYS,
  resolveRealtimeDriver,
  resolveRealtimeDriverByProvider,
} from '../../src/index.js';

interface FakeDriver {
  tag: 'real' | 'mock';
  env: Record<string, string>;
  url: string;
}

const makeReal = (env: Record<string, string>): FakeDriver => ({
  tag: 'real',
  env,
  url: env.SUPABASE_URL ?? env.SOCKETIO_URL ?? '',
});

const makeMock = (): FakeDriver => ({ tag: 'mock', env: {}, url: '' });

describe('real driver env-gate', () => {
  it('T-SEM-RD-001 KIWA_MODE unset returns mock fallback', () => {
    const result = resolveRealtimeDriver<FakeDriver>({
      provider: 'supabase',
      requiredKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
      createReal: makeReal,
      createMock: makeMock,
      envSource: {},
    });
    expect(result.isReal).toBe(false);
    expect(result.driver.tag).toBe('mock');
    expect(result.reason).toMatch(/not "real"/);
  });

  it('T-SEM-RD-002 KIWA_MODE=real + all keys returns real driver', () => {
    const result = resolveRealtimeDriver<FakeDriver>({
      provider: 'supabase',
      requiredKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
      createReal: makeReal,
      createMock: makeMock,
      envSource: {
        KIWA_MODE: 'real',
        SUPABASE_URL: 'https://x.supabase.co',
        SUPABASE_ANON_KEY: 'ak-1',
      },
    });
    expect(result.isReal).toBe(true);
    expect(result.driver.tag).toBe('real');
    expect(result.driver.env.SUPABASE_URL).toBe('https://x.supabase.co');
    expect(result.missingKeys).toEqual([]);
  });

  it('T-SEM-RD-003 KIWA_MODE=real but missing key returns mock with missingKeys list', () => {
    const result = resolveRealtimeDriver<FakeDriver>({
      provider: 'ably',
      requiredKeys: ['ABLY_API_KEY'],
      createReal: makeReal,
      createMock: makeMock,
      envSource: { KIWA_MODE: 'real' },
    });
    expect(result.isReal).toBe(false);
    expect(result.missingKeys).toContain('ABLY_API_KEY');
    expect(result.reason).toMatch(/missing ABLY_API_KEY/);
  });

  it('T-SEM-RD-004 empty string env value is treated as missing', () => {
    const result = resolveRealtimeDriver<FakeDriver>({
      provider: 'pusher',
      requiredKeys: ['PUSHER_KEY'],
      createReal: makeReal,
      createMock: makeMock,
      envSource: { KIWA_MODE: 'real', PUSHER_KEY: '' },
    });
    expect(result.isReal).toBe(false);
    expect(result.missingKeys).toContain('PUSHER_KEY');
  });

  it('T-SEM-RD-005 REAL_DRIVER_REQUIRED_KEYS covers 4 providers with expected keys', () => {
    expect(REAL_DRIVER_REQUIRED_KEYS.supabase).toEqual(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    expect(REAL_DRIVER_REQUIRED_KEYS.ably).toEqual(['ABLY_API_KEY']);
    expect(REAL_DRIVER_REQUIRED_KEYS.pusher).toEqual([
      'PUSHER_APP_ID',
      'PUSHER_KEY',
      'PUSHER_SECRET',
      'PUSHER_CLUSTER',
    ]);
    expect(REAL_DRIVER_REQUIRED_KEYS.socketio).toEqual(['SOCKETIO_URL']);
  });

  it('T-SEM-RD-006 resolveRealtimeDriverByProvider uses default key lookup', () => {
    const result = resolveRealtimeDriverByProvider<FakeDriver>(
      'socketio',
      makeReal,
      makeMock,
      { KIWA_MODE: 'real', SOCKETIO_URL: 'https://ws.example.com' },
    );
    expect(result.isReal).toBe(true);
    expect(result.driver.url).toBe('https://ws.example.com');
  });
});
