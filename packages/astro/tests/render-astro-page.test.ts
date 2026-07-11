import { describe, expect, it } from 'vitest';
import {
  renderAstroPage,
  kiwaAstroNotFound,
  ASTRO_REDIRECT_SYMBOL,
  ASTRO_NOT_FOUND_SYMBOL,
  ASTRO_REWRITE_SYMBOL,
} from '../src/render-astro-page.js';

describe('renderAstroPage', () => {
  it('T-AP-001: page returning HTML string is wrapped in 200 Response', async () => {
    const result = await renderAstroPage({
      page: () => '<h1>hello</h1>',
      url: 'https://x/',
    });
    expect(result.html).toBe('<h1>hello</h1>');
    expect(result.response.status).toBe(200);
    expect(result.response.headers.get('content-type')).toContain('text/html');
    expect(result.redirect).toBeNull();
    expect(result.notFound).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('T-AP-002: page returning Response is used verbatim and html captures body', async () => {
    const result = await renderAstroPage({
      page: () =>
        new Response('<custom/>', {
          status: 201,
          headers: { 'content-type': 'application/xhtml+xml' },
        }),
      url: 'https://x/',
    });
    expect(result.response.status).toBe(201);
    expect(result.response.headers.get('content-type')).toBe('application/xhtml+xml');
    expect(result.html).toBe('<custom/>');
  });

  it('T-AP-003: context.params propagated to the page', async () => {
    let captured: { slug?: string } = {};
    await renderAstroPage<Record<string, unknown>, { slug?: string }>({
      page: ({ params }) => {
        captured = params;
        return '';
      },
      url: 'https://x/posts/kiwa',
      params: { slug: 'kiwa' },
    });
    expect(captured.slug).toBe('kiwa');
  });

  it('T-AP-004: context.props (Astro.props equivalent) propagated', async () => {
    let captured: { title?: string } = {};
    await renderAstroPage<{ title: string }>({
      page: ({ props }) => {
        captured = props;
        return '';
      },
      url: 'https://x/',
      props: { title: 'hi' },
    });
    expect(captured.title).toBe('hi');
  });

  it('T-AP-005: context.request reflects url + method + headers', async () => {
    let captured: { method?: string; auth?: string | null; url?: string } = {};
    await renderAstroPage({
      page: ({ request }) => {
        captured = {
          method: request.method,
          auth: request.headers.get('authorization'),
          url: request.url,
        };
        return '';
      },
      url: 'https://x/api/me',
      method: 'POST',
      headers: { authorization: 'Bearer t' },
    });
    expect(captured.method).toBe('POST');
    expect(captured.auth).toBe('Bearer t');
    expect(captured.url).toBe('https://x/api/me');
  });

  it('T-AP-006: cookies seeded + readable + mutable inside the page', async () => {
    const result = await renderAstroPage({
      page: ({ cookies }) => {
        const session = cookies.get('session');
        cookies.set('csrf', 'xyz');
        cookies.delete('legacy');
        return session?.value ?? '';
      },
      url: 'https://x/',
      cookies: { session: 'abc', legacy: 'old' },
    });
    expect(result.html).toBe('abc');
  });

  it('T-AP-006b: cookies.get() returns undefined for a non-existent cookie', async () => {
    // Closes the `typeof value === 'undefined' ? undefined : ...` truthy arm at line 33.
    let observedGet: { value: string } | undefined = { value: 'not-reset' };
    await renderAstroPage({
      page: ({ cookies }) => {
        observedGet = cookies.get('does-not-exist');
        return '';
      },
      url: 'https://x/',
    });
    expect(observedGet).toBeUndefined();
  });

  it('T-AP-006a: cookies.has() reports presence for seeded + newly-set cookies', async () => {
    // Closes the has() method on the buildCookieJar (line 41-43 in render-astro-page.js).
    // Existing tests only call get / set / delete, so has() was never invoked.
    let observedHasSession = false;
    let observedHasMissing = true;
    let observedHasNewly = false;
    await renderAstroPage({
      page: ({ cookies }) => {
        observedHasSession = cookies.has('session');
        observedHasMissing = cookies.has('nonexistent');
        cookies.set('newly', 'v');
        observedHasNewly = cookies.has('newly');
        return '';
      },
      url: 'https://x/',
      cookies: { session: 'abc' },
    });
    expect(observedHasSession).toBe(true);
    expect(observedHasMissing).toBe(false);
    expect(observedHasNewly).toBe(true);
  });

  it('T-AP-007: Astro.redirect() captured as redirect signal + 302 Response', async () => {
    const result = await renderAstroPage({
      page: ({ redirect }) => {
        redirect('/login');
        return '';
      },
      url: 'https://x/dashboard',
    });
    expect(result.redirect?.url).toBe('/login');
    expect(result.redirect?.status).toBe(302);
    expect(result.redirect?.[ASTRO_REDIRECT_SYMBOL]).toBe(true);
    expect(result.response.status).toBe(302);
    expect(result.response.headers.get('location')).toBe('/login');
  });

  it('T-AP-008: redirect custom status propagated (301)', async () => {
    const result = await renderAstroPage({
      page: ({ redirect }) => {
        redirect('/permanent', 301);
        return '';
      },
      url: 'https://x/',
    });
    expect(result.redirect?.status).toBe(301);
  });

  it('T-AP-009: kiwaAstroNotFound() captured + default 404 Response', async () => {
    const result = await renderAstroPage({
      page: () => {
        throw kiwaAstroNotFound();
      },
      url: 'https://x/missing',
    });
    expect(result.notFound?.[ASTRO_NOT_FOUND_SYMBOL]).toBe(true);
    expect(result.response.status).toBe(404);
  });

  it('T-AP-010: kiwaAstroNotFound(customResponse) propagates custom Response', async () => {
    const custom = new Response('<not-found-page/>', { status: 404, headers: { 'content-type': 'text/html' } });
    const result = await renderAstroPage({
      page: () => {
        throw kiwaAstroNotFound(custom);
      },
      url: 'https://x/',
    });
    expect(result.notFound?.response).toBe(custom);
    expect(result.response).toBe(custom);
  });

  it('T-AP-011: Astro.rewrite() captured + 200 placeholder Response', async () => {
    const result = await renderAstroPage({
      page: ({ rewrite }) => {
        rewrite('/internal/target');
        return '';
      },
      url: 'https://x/public',
    });
    expect(result.rewrite?.target).toBe('/internal/target');
    expect(result.rewrite?.[ASTRO_REWRITE_SYMBOL]).toBe(true);
    expect(result.response.status).toBe(200);
  });

  it('T-AP-012: non-signal throw surfaces in error + 500 Response', async () => {
    const result = await renderAstroPage({
      page: () => {
        throw new Error('boom');
      },
      url: 'https://x/',
    });
    expect((result.error as Error).message).toBe('boom');
    expect(result.response.status).toBe(500);
  });

  it('T-AP-013: locals propagated for middleware → page handoff', async () => {
    let captured: { user?: string } = {};
    await renderAstroPage<Record<string, unknown>, Record<string, string | undefined>, { user: string }>({
      page: ({ locals }) => {
        captured = locals;
        return '';
      },
      url: 'https://x/',
      locals: { user: 'alice' },
    });
    expect(captured.user).toBe('alice');
  });

  it('T-AP-014: site option parsed to URL on context.site', async () => {
    let captured: URL | undefined;
    await renderAstroPage({
      page: ({ site }) => {
        captured = site;
        return '';
      },
      url: 'https://x/',
      site: 'https://kiwa.example.com/',
    });
    expect(captured?.href).toBe('https://kiwa.example.com/');
  });

  it('T-AP-015: site defaults to undefined when omitted', async () => {
    let captured: URL | undefined;
    await renderAstroPage({
      page: ({ site }) => {
        captured = site;
        return '';
      },
      url: 'https://x/',
    });
    expect(captured).toBeUndefined();
  });

  it('T-AP-016: generator defaults populated (mirrors Astro.generator)', async () => {
    let gen = '';
    await renderAstroPage({
      page: ({ generator }) => {
        gen = generator;
        return '';
      },
      url: 'https://x/',
    });
    expect(gen).toContain('Astro');
  });

  it('T-AP-017: async page awaited correctly', async () => {
    const result = await renderAstroPage({
      page: async () => {
        await Promise.resolve();
        return '<async/>';
      },
      url: 'https://x/',
    });
    expect(result.html).toBe('<async/>');
  });
});
