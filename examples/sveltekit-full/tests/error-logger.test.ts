// kiwa unit test — errorLoggerHandle (handleError hook)。

import { beforeEach, describe, expect, it } from 'vitest';
import { setupSvelteKitHooksEnv } from '@kiwa-test/sveltekit';
import {
  errorLoggerHandle,
  readErrorLogs,
  clearErrorLogs,
} from '../src/lib/_kiwa/error-logger-handle.js';
import type { AuthLocals } from '../src/lib/_kiwa/auth-handle.js';

describe('errorLoggerHandle via setupSvelteKitHooksEnv.runHandleError', () => {
  beforeEach(() => {
    clearErrorLogs();
  });

  it('T-SF-501: 通常 error は structured log に記録 + safe message を report', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/items/42',
      locals: { user: { id: 'u1', role: 'admin' } },
    });
    const { report } = await env.runHandleError(errorLoggerHandle, {
      error: new Error('db connection lost'),
      status: 500,
      message: 'Internal Server Error',
    });
    expect(report).toEqual({ message: 'Internal Server Error (see request id for support)' });
    const logs = readErrorLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual({
      path: '/items/42',
      status: 500,
      errorMessage: 'db connection lost',
      userId: 'u1',
    });
  });

  it('T-SF-502: 非 Error の throw も String 化して log', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/',
      locals: { user: null },
    });
    await env.runHandleError(errorLoggerHandle, {
      error: 'string-error',
      status: 500,
      message: 'ISE',
    });
    const logs = readErrorLogs();
    expect(logs[0]?.errorMessage).toBe('string-error');
    expect(logs[0]?.userId).toBeNull();
  });

  it('T-SF-503: 複数回 error → log は append される', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/',
      locals: { user: null },
    });
    await env.runHandleError(errorLoggerHandle, { error: new Error('a'), status: 500, message: 'ISE' });
    await env.runHandleError(errorLoggerHandle, { error: new Error('b'), status: 500, message: 'ISE' });
    expect(readErrorLogs()).toHaveLength(2);
  });
});
