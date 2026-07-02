/**
 * Text chunker — approximates LangChain's `RecursiveCharacterTextSplitter`
 * with a small deterministic implementation. Splits on sentence boundaries
 * first (period + whitespace), then rolls up sentences into chunks up to
 * `chunkSize` characters with `overlap` characters carried across chunks.
 *
 * Kept dependency-free so real vs mock exercise the identical chunk shape
 * without pulling `langchain` into the workspace root.
 */

export interface ChunkOptions {
  chunkSize: number;
  overlap: number;
}

export interface Chunk {
  docId: string;
  chunkIndex: number;
  text: string;
}

export function chunkText(
  docId: string,
  text: string,
  options: ChunkOptions = { chunkSize: 500, overlap: 50 },
): Chunk[] {
  const sentences = splitSentences(text);
  const chunks: Chunk[] = [];
  let buffer = '';
  let index = 0;
  for (const sentence of sentences) {
    if (buffer.length + sentence.length + 1 > options.chunkSize && buffer.length > 0) {
      chunks.push({ docId, chunkIndex: index, text: buffer.trim() });
      index += 1;
      // Carry the tail of the previous buffer as overlap so downstream chunks
      // share a sliver of context — mirrors LangChain's overlap default.
      const carry = buffer.slice(Math.max(0, buffer.length - options.overlap));
      buffer = `${carry} ${sentence}`.trim();
    } else {
      buffer = buffer.length === 0 ? sentence : `${buffer} ${sentence}`;
    }
  }
  if (buffer.trim().length > 0) {
    chunks.push({ docId, chunkIndex: index, text: buffer.trim() });
  }
  return chunks;
}

function splitSentences(text: string): string[] {
  // Split on `. ` while preserving the trailing period. Filter empties so a
  // trailing period doesn't emit an extra sentence.
  const parts = text.split(/(?<=\.)\s+/).map((s) => s.trim());
  return parts.filter((s) => s.length > 0);
}
