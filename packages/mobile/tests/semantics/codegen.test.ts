import { describe, expect, it } from 'vitest';
import {
  completeCodegenBuild,
  emitCodegenType,
  generateSpec,
  initCodegen,
  loadCodegenSchema,
} from '../../src/index.js';

describe('v1.52 codegen semantics', () => {
  it('schema → spec → type → build full cycle', () => {
    const s = initCodegen({ target: 'ios', packageName: '@myapp/native' });
    loadCodegenSchema(s, 'sha256:abc');
    generateSpec(s, { specCount: 3 });
    emitCodegenType(s, 'NativeCameraSpec.h');
    emitCodegenType(s, 'NativeCameraSpec.mm');
    completeCodegenBuild(s);
    expect(s.state).toBe('build-completed');
    expect(s.emittedFiles).toHaveLength(2);
    expect(s.schemaHash).toBe('sha256:abc');
  });

  it('rejects spec before schema', () => {
    const s = initCodegen({ target: 'ios', packageName: 'X' });
    expect(() => generateSpec(s, { specCount: 1 })).toThrow(/session is idle/);
  });

  it('rejects zero specCount', () => {
    const s = initCodegen({ target: 'android', packageName: 'X' });
    loadCodegenSchema(s, 'sha');
    expect(() => generateSpec(s, { specCount: 0 })).toThrow(/specCount/);
  });

  it('rejects empty inputs', () => {
    expect(() => initCodegen({ target: 'ios', packageName: '' })).toThrow(/packageName/);
    const s = initCodegen({ target: 'ios', packageName: 'X' });
    expect(() => loadCodegenSchema(s, '')).toThrow(/schemaHash/);
  });

  it('rejects completeCodegenBuild before spec-generated or type-emitted', () => {
    const s = initCodegen({ target: 'ios', packageName: 'X' });
    loadCodegenSchema(s, 'sha');
    // state = 'schema-loaded' → completeCodegenBuild throws
    expect(() => completeCodegenBuild(s)).toThrow(/session is schema-loaded/);
  });

  it('rejects emitCodegenType when filePath is empty', () => {
    const s = initCodegen({ target: 'ios', packageName: 'X' });
    loadCodegenSchema(s, 'sha');
    generateSpec(s, { specCount: 1 });
    expect(() => emitCodegenType(s, '')).toThrow(/filePath must not be empty/);
  });
});
