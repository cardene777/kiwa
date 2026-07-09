import {
  defineHead,
  mergeHead,
  renderHead,
  type HeadFragment,
  type HeadLinkTag,
  type HeadMetaTag,
} from '@kiwa-lab/fresh';

/**
 * Site-wide Head fragment factories — every fragment is small on purpose so
 * the merge harness can prove the dedup rules with 2-4 fragment inputs.
 *
 * Fresh's `<Head>` collects fragments from any island, layout, or route.
 * The dogfood exposes 3 fragment sources (site / route / island) so the
 * fidelity harness can drive a realistic merge shape.
 */

export interface SiteHeadInput {
  readonly title?: string;
  readonly meta?: readonly HeadMetaTag[];
  readonly link?: readonly HeadLinkTag[];
}

export function defineSiteHead(input: SiteHeadInput = {}): HeadFragment {
  return defineHead({
    title: input.title ?? 'kiwa fresh dogfood',
    meta: input.meta ?? [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'kiwa fresh dogfood — default site head' },
    ],
    link: input.link ?? [
      { rel: 'icon', href: '/favicon.ico' },
    ],
  });
}

export function defineRouteHead(input: SiteHeadInput = {}): HeadFragment {
  return defineHead({
    title: input.title ?? 'greet',
    meta: input.meta ?? [
      { name: 'description', content: 'route-level head — overrides site description' },
    ],
    link: input.link ?? [],
  });
}

export function defineIslandHead(input: SiteHeadInput = {}): HeadFragment {
  // exactOptionalPropertyTypes = true means we must omit the title key entirely
  // when it is undefined rather than passing `title: undefined`.
  const opts: {
    title?: string;
    meta: readonly HeadMetaTag[];
    link: readonly HeadLinkTag[];
  } = {
    meta: input.meta ?? [],
    link: input.link ?? [
      { rel: 'stylesheet', href: '/islands/counter.css' },
    ],
  };
  if (input.title !== undefined) opts.title = input.title;
  return defineHead(opts);
}

export interface SiteHeadResult {
  readonly merged: HeadFragment;
  readonly html: string;
}

/**
 * Merge N fragments in `[site, route, island, ...extra]` order and stringify
 * the canonical head. Tests assert on both the merged shape (title / meta /
 * link count) and the rendered HTML string.
 */
export function buildSiteHead(fragments: readonly HeadFragment[]): SiteHeadResult {
  const merged = mergeHead(fragments);
  const html = renderHead(merged);
  return { merged, html };
}
