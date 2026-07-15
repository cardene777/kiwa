export interface MetadataEntry {
  key: string;
  value: string;
}

export function createMetadata(entries: Record<string, string> = {}): MetadataEntry[] {
  return Object.entries(entries).map(([key, value]) => ({ key: key.toLowerCase(), value }));
}

export function mergeMetadata(a: MetadataEntry[], b: MetadataEntry[]): MetadataEntry[] {
  const map = new Map<string, string>();
  for (const { key, value } of a) map.set(key, value);
  for (const { key, value } of b) map.set(key, value);
  return Array.from(map, ([key, value]) => ({ key, value }));
}
