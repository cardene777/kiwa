/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCspHeader, buildSecurityHeaders, validateSecurityHeaders } from '../../src/index.js';

const MODULE = 'security-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('security app scenario perf (real workload)', () => {
  it('3-layer perf: csp build burst / security headers validation / hardening flow', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'csp_build_burst (50 buildCspHeader)',
          fn: () => {
            for (let i = 0; i < 50; i++) {
              buildCspHeader({
                directives: {
                  'default-src': ["'self'"],
                  'script-src': ["'self'", 'https://cdn.example.com'],
                  'style-src': ["'self'", "'unsafe-inline'"],
                },
              });
            }
          },
          serialP95CapMs: 30,
        },
        {
          name: 'security_headers_validate_loop (20 build + validate)',
          fn: () => {
            for (let i = 0; i < 20; i++) {
              const input = {
                hsts: { maxAge: 31536000, includeSubDomains: true },
                xFrameOptions: 'DENY' as const,
                xContentTypeOptions: 'nosniff' as const,
                referrerPolicy: 'no-referrer' as const,
              };
              buildSecurityHeaders(input);
              validateSecurityHeaders(input);
            }
          },
          serialP95CapMs: 50,
        },
        {
          name: 'production_hardening_flow (csp + security headers combined)',
          fn: () => {
            const csp = buildCspHeader({
              directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'"],
                'connect-src': ["'self'", 'https://api.example.com'],
              },
            });
            const headers = buildSecurityHeaders({
              hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
              xFrameOptions: 'DENY',
            });
            if (!csp.headerValue || !headers.headers) throw new Error('hardening incomplete');
          },
          serialP95CapMs: 30,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
