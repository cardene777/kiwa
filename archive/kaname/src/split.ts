import type { SpecDoc, SpecItem, SplitResult } from './types.js';

function header(title: string, layer: 'formal' | 'runtime', issueRef?: string): string {
  const parts = [`# ${title}`, ''];
  if (issueRef) parts.push(`> Ref: ${issueRef}`, '');
  if (layer === 'formal') {
    parts.push(
      '> **Layer = formal.** Every item below MUST be verifiable by',
      '> `@kiwa-lab/lean` (state machines, pure contracts). Items that cannot',
      '> be phrased as Lean specs belong in `specRuntime.md` instead — do not',
      '> mix layers.',
      '',
    );
  } else {
    parts.push(
      '> **Layer = runtime + human.** Side effects, integration, performance,',
      '> UX, business intent. Verified by vitest / real-driver tests or by',
      '> explicit human review. Items that CAN be phrased as Lean state',
      '> machines belong in `specFormal.md` instead — do not mix layers.',
      '',
    );
  }
  return parts.join('\n');
}

function renderItem(item: SpecItem): string {
  const lines: string[] = [];
  lines.push(`## ${item.id} — ${item.statement}`);
  lines.push('');
  lines.push(`- **Layer** — ${item.layer}`);
  lines.push(`- **Verify by** — \`${item.verifyBy}\``);
  if (item.notes) {
    lines.push('');
    lines.push(item.notes.trim());
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Split a SpecDoc into two paired markdown files:
 *
 *   - `specFormal.md`  → items with `layer === 'formal'`
 *   - `specRuntime.md` → items with `layer === 'runtime'` or `'human'`
 *
 * The intent is that a caller writes each acceptance criterion once, tags it
 * with the layer that will verify it, and gets two files back that never
 * disagree with each other. If the caller wants the same idea verified in
 * two places, they must write two separate items (with distinct verifyBy
 * targets), so the "written but never verified" silent gap is impossible.
 */
export function splitSpec(doc: SpecDoc): SplitResult {
  const formalItems = doc.items.filter((i) => i.layer === 'formal');
  const otherItems = doc.items.filter((i) => i.layer !== 'formal');

  const specFormal =
    header(doc.title, 'formal', doc.issueRef) + formalItems.map(renderItem).join('\n');
  const specRuntime =
    header(doc.title, 'runtime', doc.issueRef) + otherItems.map(renderItem).join('\n');

  const summary = {
    total: doc.items.length,
    formalCount: doc.items.filter((i) => i.layer === 'formal').length,
    runtimeCount: doc.items.filter((i) => i.layer === 'runtime').length,
    humanCount: doc.items.filter((i) => i.layer === 'human').length,
  };

  return { specFormal, specRuntime, summary };
}
