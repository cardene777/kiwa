import { describe, expect, it } from 'vitest';
import {
  buildSiteHead,
  defineSiteHead,
  defineRouteHead,
  defineIslandHead,
} from '../src/head/site-head.js';

describe('site head (dedup + canonical merge)', () => {
  it('T-DFI-SH-001 site + route + island fragments merge into single head', () => {
    const { merged } = buildSiteHead([
      defineSiteHead(),
      defineRouteHead(),
      defineIslandHead(),
    ]);
    // route title wins over site default
    expect(merged.title).toBe('greet');
    // description is deduped by name → route wins over site
    const description = merged.meta.find((m) => m.name === 'description');
    expect(description?.content).toBe('route-level head — overrides site description');
  });

  it('T-DFI-SH-002 later title override wins even when 3 fragments present', () => {
    const { merged } = buildSiteHead([
      defineSiteHead({ title: 'home' }),
      defineRouteHead({ title: 'about' }),
      defineIslandHead({ title: 'contact' }),
    ]);
    expect(merged.title).toBe('contact');
  });

  it('T-DFI-SH-003 link dedup by rel + href keeps first + drops duplicate', () => {
    const { merged } = buildSiteHead([
      defineSiteHead({ link: [{ rel: 'icon', href: '/f1.ico' }] }),
      defineRouteHead({ link: [{ rel: 'icon', href: '/f1.ico' }] }),
    ]);
    const icons = merged.link.filter((l) => l.rel === 'icon');
    expect(icons.length).toBe(1);
    expect(icons[0]?.href).toBe('/f1.ico');
  });

  it('T-DFI-SH-004 different rel + same href kept as 2 entries', () => {
    const { merged } = buildSiteHead([
      defineSiteHead({
        link: [
          { rel: 'stylesheet', href: '/theme.css' },
          { rel: 'preload', href: '/theme.css' },
        ],
      }),
    ]);
    expect(merged.link.length).toBe(2);
  });

  it('T-DFI-SH-005 renderHead output is canonical (title → meta → link)', () => {
    const { html } = buildSiteHead([defineSiteHead()]);
    const titleIdx = html.indexOf('<title>');
    const metaIdx = html.indexOf('<meta');
    const linkIdx = html.indexOf('<link');
    expect(titleIdx).toBeGreaterThan(-1);
    expect(metaIdx).toBeGreaterThan(titleIdx);
    expect(linkIdx).toBeGreaterThan(metaIdx);
  });

  it('T-DFI-SH-006 empty fragment list produces empty html', () => {
    const { html } = buildSiteHead([]);
    expect(html).toBe('');
  });

  it('T-DFI-SH-007 defineSiteHead exposes viewport meta by default', () => {
    const site = defineSiteHead();
    const viewport = site.meta.find((m) => m.name === 'viewport');
    expect(viewport?.content).toBe('width=device-width, initial-scale=1');
  });
});
