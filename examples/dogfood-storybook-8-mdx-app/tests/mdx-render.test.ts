import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';
import { ALL_DOCS, buttonDoc, formDoc, tabsDoc } from '../src/mdx/docs.js';
import { renderAllMdxDocs } from '../src/flows/story-flows.js';

let adapter: StorybookMdxAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS, ALL_DOCS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — MDX render (prose + preview + code)', () => {
  it('T-DFSMDX-MDX-001 renderMdx returns block list matching authored order', async () => {
    const report = await adapter.renderMdx(buttonDoc.docId);
    expect(report.docId).toBe(buttonDoc.docId);
    expect(report.title).toBe('Button');
    // The Button doc has 5 authored blocks — 2 prose + 1 code + 2 preview.
    expect(report.blocks.length).toBe(5);
    // Kinds must match authored kinds in order.
    const kinds = report.blocks.map((b) => b.kind);
    const authoredKinds = buttonDoc.blocks.map((b) => b.kind);
    expect(kinds).toEqual(authoredKinds);
  });

  it('T-DFSMDX-MDX-002 prose block text passes through unchanged', async () => {
    const report = await adapter.renderMdx(buttonDoc.docId);
    const prose = report.blocks.find((b) => b.kind === 'prose');
    expect(prose).toBeDefined();
    if (prose?.kind === 'prose') {
      expect(prose.text.length).toBeGreaterThan(20);
      expect(prose.text).toContain('Button');
    }
  });

  it('T-DFSMDX-MDX-003 code block preserves language + source verbatim', async () => {
    const report = await adapter.renderMdx(buttonDoc.docId);
    const code = report.blocks.find((b) => b.kind === 'code');
    expect(code).toBeDefined();
    if (code?.kind === 'code') {
      expect(code.language).toBe('tsx');
      expect(code.source).toBe('<Button variant="primary" label="Save" />');
    }
  });

  it('T-DFSMDX-MDX-004 preview block renders inline markup + hash', async () => {
    const report = await adapter.renderMdx(buttonDoc.docId);
    const preview = report.blocks.find((b) => b.kind === 'preview');
    expect(preview).toBeDefined();
    if (preview?.kind === 'preview') {
      expect(preview.storyId).toBe('designsystem-button--primary');
      expect(preview.markup.length).toBeGreaterThan(10);
      expect(preview.hash).toMatch(/^[0-9a-f]+$/);
    }
  });

  it('T-DFSMDX-MDX-005 multiple previews in 1 doc produce distinct storyIds', async () => {
    const report = await adapter.renderMdx(tabsDoc.docId);
    const previews = report.blocks.filter((b) => b.kind === 'preview');
    expect(previews.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(previews.map((p) => (p.kind === 'preview' ? p.storyId : '')));
    expect(ids.size).toBe(previews.length);
  });

  it('T-DFSMDX-MDX-006 renderMdx throws for unknown docId', async () => {
    await expect(adapter.renderMdx('UnknownDoc.mdx')).rejects.toThrow(
      /MdxRegistry — no doc/,
    );
  });

  it('T-DFSMDX-MDX-007 metrics.mdxRenderInvocations increments per call', async () => {
    await adapter.renderMdx(buttonDoc.docId);
    await adapter.renderMdx(formDoc.docId);
    expect(adapter.metrics().mdxRenderInvocations).toBe(2);
  });

  it('T-DFSMDX-MDX-008 renderAllMdxDocs returns 1 report per doc', async () => {
    const reports = await renderAllMdxDocs(adapter);
    expect(reports.length).toBe(ALL_DOCS.length);
    for (const r of reports) {
      expect(r.blocks.length).toBeGreaterThan(0);
    }
  });

  it('T-DFSMDX-MDX-009 trace records 1 renderMdx op per doc', async () => {
    await renderAllMdxDocs(adapter);
    const traces = adapter.traces().filter((t) => t.op === 'renderMdx');
    expect(traces.length).toBe(ALL_DOCS.length);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('T-DFSMDX-MDX-010 preview markup contains the primitive tag for the story', async () => {
    const report = await adapter.renderMdx(buttonDoc.docId);
    const preview = report.blocks.find(
      (b) => b.kind === 'preview' && b.storyId === 'designsystem-button--primary',
    );
    expect(preview).toBeDefined();
    if (preview?.kind === 'preview') {
      // Button primitive renders a <button> tag.
      expect(preview.markup).toContain('<button');
    }
  });
});
