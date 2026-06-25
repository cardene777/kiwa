import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyConfigTemplate,
  detectIndent,
  detectTsconfigStrict,
  normalizeFoundryRelPath,
  normalizeTestDir,
  prefixWithDot,
  resolveConfigFileName,
  resolveTemplatePath,
  rollback,
  stripJsonComments,
  toPosix,
} from '../src/commands/init.js';

let tempDir = '';

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwa-helpers-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('normalizeTestDir', () => {
  it('T-NTD-001 undefined returns "e2e"', () => {
    expect(normalizeTestDir(undefined)).toBe('e2e');
  });

  it('T-NTD-002 empty string returns "e2e"', () => {
    expect(normalizeTestDir('')).toBe('e2e');
  });

  it('T-NTD-003 simple relative path passed through', () => {
    expect(normalizeTestDir('e2e')).toBe('e2e');
  });

  it('T-NTD-004 nested relative path passed through', () => {
    expect(normalizeTestDir('tests/e2e')).toBe('tests/e2e');
  });

  it('T-NTD-005 backslash normalized to forward slash', () => {
    expect(normalizeTestDir('tests\\e2e')).toBe('tests/e2e');
  });

  it('T-NTD-006 leading "./" stripped', () => {
    expect(normalizeTestDir('./tests/e2e')).toBe('tests/e2e');
  });

  it('T-NTD-007 trailing single slash stripped', () => {
    expect(normalizeTestDir('e2e/')).toBe('e2e');
  });

  it('T-NTD-008 multiple trailing slashes stripped', () => {
    expect(normalizeTestDir('e2e///')).toBe('e2e');
  });

  it('T-NTD-009 absolute path "/abs" rejected', () => {
    expect(() => normalizeTestDir('/abs')).toThrow(/relative path/);
  });

  it('T-NTD-010 path with ".." rejected', () => {
    expect(() => normalizeTestDir('../outside')).toThrow(/relative path/);
  });

  it('T-NTD-011 path with ".." in middle rejected', () => {
    expect(() => normalizeTestDir('a/../b')).toThrow(/relative path/);
  });

  it('T-NTD-012 normalized empty string rejected (e.g. "./")', () => {
    expect(() => normalizeTestDir('./')).toThrow(/relative path/);
  });

  it('T-NTD-013 error message contains original input', () => {
    expect(() => normalizeTestDir('/abs/path')).toThrow(/"\/abs\/path"/);
  });

  it('T-NTD-014 error message starts with "kiwa init"', () => {
    expect(() => normalizeTestDir('/abs')).toThrow(/^kiwa init/);
  });
});

describe('resolveConfigFileName', () => {
  it('T-RCF-001 undefined returns "playwright.config.ts"', () => {
    expect(resolveConfigFileName(undefined)).toBe('playwright.config.ts');
  });

  it('T-RCF-002 empty string returns "playwright.config.ts"', () => {
    expect(resolveConfigFileName('')).toBe('playwright.config.ts');
  });

  it('T-RCF-003 simple suffix returns "playwright.<suffix>.config.ts"', () => {
    expect(resolveConfigFileName('ci')).toBe('playwright.ci.config.ts');
  });

  it('T-RCF-004 hyphen allowed', () => {
    expect(resolveConfigFileName('my-env')).toBe('playwright.my-env.config.ts');
  });

  it('T-RCF-005 underscore allowed', () => {
    expect(resolveConfigFileName('my_env')).toBe('playwright.my_env.config.ts');
  });

  it('T-RCF-006 alphanumeric allowed', () => {
    expect(resolveConfigFileName('env123')).toBe('playwright.env123.config.ts');
  });

  it('T-RCF-007 period rejected', () => {
    expect(() => resolveConfigFileName('a.b')).toThrow(/config-suffix/);
  });

  it('T-RCF-008 slash rejected', () => {
    expect(() => resolveConfigFileName('a/b')).toThrow(/config-suffix/);
  });

  it('T-RCF-009 special char "@" rejected', () => {
    expect(() => resolveConfigFileName('a@b')).toThrow(/config-suffix/);
  });

  it('T-RCF-010 space rejected', () => {
    expect(() => resolveConfigFileName('a b')).toThrow(/config-suffix/);
  });

  it('T-RCF-011 error message contains original input', () => {
    expect(() => resolveConfigFileName('a.b')).toThrow(/"a\.b"/);
  });

  it('T-RCF-012 error message contains regex pattern', () => {
    expect(() => resolveConfigFileName('@')).toThrow(/\[a-zA-Z0-9_-\]\+/);
  });
});

describe('applyConfigTemplate', () => {
  it('T-ACT-001 single-quote testDir replaced', () => {
    const out = applyConfigTemplate("testDir: './e2e'", 'tests/e2e');
    expect(out).toContain("testDir: './tests/e2e'");
  });

  it('T-ACT-002 double-quote testDir replaced', () => {
    const out = applyConfigTemplate('testDir: "./e2e"', 'tests/e2e');
    expect(out).toContain('testDir: "./tests/e2e"');
  });

  it('T-ACT-003 already "./" prefix preserved', () => {
    const out = applyConfigTemplate("testDir: './e2e'", './custom');
    expect(out).toContain("testDir: './custom'");
  });

  it('T-ACT-004 testDir without "./" gets prefix added', () => {
    const out = applyConfigTemplate("testDir: './e2e'", 'simple');
    expect(out).toContain("testDir: './simple'");
  });

  it('T-ACT-005 backslash testDir normalized to forward slash', () => {
    const out = applyConfigTemplate("testDir: './e2e'", 'tests\\custom');
    expect(out).toContain("testDir: './tests/custom'");
  });

  it('T-ACT-006 surrounding content preserved', () => {
    const before = "export default {\n  testDir: './e2e',\n  use: { browserName: 'chromium' },\n};";
    const out = applyConfigTemplate(before, 'tests/x');
    expect(out).toContain("use: { browserName: 'chromium' }");
    expect(out).toContain("testDir: './tests/x'");
  });

  it('T-ACT-007 no testDir match - content unchanged', () => {
    const out = applyConfigTemplate('export default {};', 'tests/x');
    expect(out).toBe('export default {};');
  });
});

describe('prefixWithDot', () => {
  it('T-PWD-001 path without "./" gets "./" prefix', () => {
    expect(prefixWithDot('tests/e2e')).toBe('./tests/e2e');
  });

  it('T-PWD-002 path with "./" prefix preserved', () => {
    expect(prefixWithDot('./tests/e2e')).toBe('./tests/e2e');
  });

  it('T-PWD-003 path with "/" prefix preserved', () => {
    expect(prefixWithDot('/abs/path')).toBe('/abs/path');
  });

  it('T-PWD-004 empty string gets "./" prefix', () => {
    expect(prefixWithDot('')).toBe('./');
  });

  it('T-PWD-005 single char "x" gets "./" prefix', () => {
    expect(prefixWithDot('x')).toBe('./x');
  });
});

describe('toPosix', () => {
  it('T-TPX-001 backslash normalized + "./" prefix', () => {
    expect(toPosix('tests\\e2e')).toBe('./tests/e2e');
  });

  it('T-TPX-002 forward slash preserved + "./" prefix', () => {
    expect(toPosix('tests/e2e')).toBe('./tests/e2e');
  });

  it('T-TPX-003 mixed slashes normalized', () => {
    expect(toPosix('tests\\sub/e2e')).toBe('./tests/sub/e2e');
  });

  it('T-TPX-004 already "./" prefix preserved', () => {
    expect(toPosix('./tests/e2e')).toBe('./tests/e2e');
  });

  it('T-TPX-005 absolute path with "/" preserved', () => {
    expect(toPosix('/abs')).toBe('/abs');
  });
});

describe('normalizeFoundryRelPath', () => {
  it('T-NFR-001 simple relative path returned', () => {
    expect(normalizeFoundryRelPath('contract')).toBe('contract');
  });

  it('T-NFR-002 backslash normalized', () => {
    expect(normalizeFoundryRelPath('contract\\sub')).toBe('contract/sub');
  });

  it('T-NFR-003 trailing slash stripped', () => {
    expect(normalizeFoundryRelPath('contract/')).toBe('contract');
  });

  it('T-NFR-004 multiple trailing slashes stripped', () => {
    expect(normalizeFoundryRelPath('contract///')).toBe('contract');
  });

  it('T-NFR-005 empty string rejected', () => {
    expect(() => normalizeFoundryRelPath('')).toThrow(/foundry/);
  });

  it('T-NFR-006 absolute path rejected', () => {
    expect(() => normalizeFoundryRelPath('/abs/contract')).toThrow(/absolute/);
  });

  it('T-NFR-007 leading "./" preserved (not stripped)', () => {
    expect(normalizeFoundryRelPath('./contract')).toBe('./contract');
  });

  it('T-NFR-008 ".." in path preserved (no rejection like normalizeTestDir)', () => {
    expect(normalizeFoundryRelPath('../contract')).toBe('../contract');
  });

  it('T-NFR-009 absolute path error contains original input', () => {
    expect(() => normalizeFoundryRelPath('/foo')).toThrow(/"\/foo"/);
  });

  it('T-NFR-010 empty error message starts with "kiwa init"', () => {
    expect(() => normalizeFoundryRelPath('')).toThrow(/^kiwa init/);
  });
});

describe('rollback', () => {
  it('T-RBK-001 existing file removed', () => {
    fs.writeFileSync(path.join(tempDir, 'a.txt'), 'x');
    rollback(tempDir, ['a.txt'], []);
    expect(fs.existsSync(path.join(tempDir, 'a.txt'))).toBe(false);
  });

  it('T-RBK-002 non-existent file silently ignored', () => {
    expect(() => rollback(tempDir, ['missing.txt'], [])).not.toThrow();
  });

  it('T-RBK-003 empty dir removed', () => {
    const dir = path.join(tempDir, 'empty');
    fs.mkdirSync(dir);
    rollback(tempDir, [], [dir]);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('T-RBK-004 non-empty dir silently ignored', () => {
    const dir = path.join(tempDir, 'with-content');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'leftover.txt'), 'x');
    expect(() => rollback(tempDir, [], [dir])).not.toThrow();
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('T-RBK-005 dirs removed in descending length order (deepest first)', () => {
    const shallow = path.join(tempDir, 'a');
    const deep = path.join(tempDir, 'a/b/c');
    fs.mkdirSync(deep, { recursive: true });
    rollback(tempDir, [], [shallow, deep]);
    expect(fs.existsSync(deep)).toBe(false);
    expect(fs.existsSync(shallow)).toBe(true);
  });

  it('T-RBK-006 multiple files removed', () => {
    fs.writeFileSync(path.join(tempDir, 'a.txt'), 'x');
    fs.writeFileSync(path.join(tempDir, 'b.txt'), 'x');
    rollback(tempDir, ['a.txt', 'b.txt'], []);
    expect(fs.existsSync(path.join(tempDir, 'a.txt'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, 'b.txt'))).toBe(false);
  });

  it('T-RBK-007 empty arrays handled', () => {
    expect(() => rollback(tempDir, [], [])).not.toThrow();
  });

  it('T-RBK-008 file removed before dir cleanup', () => {
    const dir = path.join(tempDir, 'd');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'f.txt'), 'x');
    rollback(tempDir, ['d/f.txt'], [dir]);
    expect(fs.existsSync(dir)).toBe(false);
  });
});

describe('detectIndent', () => {
  it('T-DIN-001 tab indent detected', () => {
    expect(detectIndent('{\n\t"a": 1\n}')).toBe('\t');
  });

  it('T-DIN-002 2-space indent detected', () => {
    expect(detectIndent('{\n  "a": 1\n}')).toBe(2);
  });

  it('T-DIN-003 4-space indent detected', () => {
    expect(detectIndent('{\n    "a": 1\n}')).toBe(4);
  });

  it('T-DIN-004 single-space indent detected', () => {
    expect(detectIndent('{\n "a": 1\n}')).toBe(1);
  });

  it('T-DIN-005 no indent - default 2', () => {
    expect(detectIndent('{}')).toBe(2);
  });

  it('T-DIN-006 empty lines skipped before indent detection', () => {
    expect(detectIndent('{\n\n  "a": 1\n}')).toBe(2);
  });

  it('T-DIN-007 skipped first line - second line indent used', () => {
    expect(detectIndent('first line not checked\n  "a": 1')).toBe(2);
  });

  it('T-DIN-008 tab takes precedence over space when first', () => {
    expect(detectIndent('{\n\t"a": 1\n  "b": 2\n}')).toBe('\t');
  });

  it('T-DIN-009 multiple tabs - still returns "\\t"', () => {
    expect(detectIndent('{\n\t\t"a": 1\n}')).toBe('\t');
  });

  it('T-DIN-010 fully empty string returns default 2', () => {
    expect(detectIndent('')).toBe(2);
  });
});

describe('resolveTemplatePath', () => {
  it('T-RTP-001 known existing template found', () => {
    const p = resolveTemplatePath('tsconfig.json.tpl');
    expect(fs.existsSync(p)).toBe(true);
  });

  it('T-RTP-002 connect.spec.ts.tpl found', () => {
    const p = resolveTemplatePath('connect.spec.ts.tpl');
    expect(fs.existsSync(p)).toBe(true);
  });

  it('T-RTP-003 playwright.config.ts.tpl found', () => {
    const p = resolveTemplatePath('playwright.config.ts.tpl');
    expect(fs.existsSync(p)).toBe(true);
  });

  it('T-RTP-004 with-deploy/prepare-env.ts.tpl found', () => {
    const p = resolveTemplatePath('with-deploy/prepare-env.ts.tpl');
    expect(fs.existsSync(p)).toBe(true);
  });

  it('T-RTP-005 non-existent template throws', () => {
    expect(() => resolveTemplatePath('not-a-real-template.tpl')).toThrow(/Template not found/);
  });

  it('T-RTP-006 throw message contains template name', () => {
    expect(() => resolveTemplatePath('missing.tpl')).toThrow(/missing\.tpl/);
  });
});

describe('detectTsconfigStrict', () => {
  it('T-DTS-001 strict: true returns true', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "strict": true } }');
    expect(detectTsconfigStrict(f)).toBe(true);
  });

  it('T-DTS-002 strict: false returns false', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "strict": false } }');
    expect(detectTsconfigStrict(f)).toBe(false);
  });

  it('T-DTS-003 missing strict key returns undefined', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "target": "es2022" } }');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });

  it('T-DTS-004 missing compilerOptions returns undefined', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{}');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });

  it('T-DTS-005 non-boolean strict returns undefined', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "strict": "yes" } }');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });

  it('T-DTS-006 strict null returns undefined', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "strict": null } }');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });

  it('T-DTS-007 with line comments parsed and strict detected', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '// header\n{ "compilerOptions": { "strict": true } }');
    expect(detectTsconfigStrict(f)).toBe(true);
  });

  it('T-DTS-008 with block comments parsed', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '/* header */\n{ "compilerOptions": { "strict": false } }');
    expect(detectTsconfigStrict(f)).toBe(false);
  });

  it('T-DTS-009 invalid JSON returns undefined (caught in try)', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ broken');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });

  it('T-DTS-010 non-existent file returns undefined', () => {
    expect(detectTsconfigStrict(path.join(tempDir, 'missing.json'))).toBeUndefined();
  });

  it('T-DTS-011 strict: 1 (truthy number) returns undefined', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "strict": 1 } }');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });

  it('T-DTS-012 strict: 0 (falsy number) returns undefined', () => {
    const f = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(f, '{ "compilerOptions": { "strict": 0 } }');
    expect(detectTsconfigStrict(f)).toBeUndefined();
  });
});

describe('stripJsonComments', () => {
  it('T-SJC-001 single-line "//" comment removed', () => {
    expect(stripJsonComments('// comment\n{"a": 1}')).toBe('\n{"a": 1}');
  });

  it('T-SJC-002 block /* */ comment removed', () => {
    expect(stripJsonComments('/* block */{"a": 1}')).toBe('{"a": 1}');
  });

  it('T-SJC-003 multiple line comments removed', () => {
    expect(stripJsonComments('// a\n// b\n{"x": 1}')).toBe('\n\n{"x": 1}');
  });

  it('T-SJC-004 multi-line block comment removed', () => {
    expect(stripJsonComments('/*\n  multi\n  line\n*/{"a": 1}')).toBe('{"a": 1}');
  });

  it('T-SJC-005 mixed block and line comments removed', () => {
    const out = stripJsonComments('/* a */\n// b\n{"x": 1}');
    expect(out).toContain('{"x": 1}');
    expect(out).not.toContain('/* a */');
    expect(out).not.toContain('// b');
  });

  it('T-SJC-006 indented "//" comment removed', () => {
    expect(stripJsonComments('  // indent\n{"a": 1}')).toBe('\n{"a": 1}');
  });

  it('T-SJC-007 input without comments returned unchanged', () => {
    expect(stripJsonComments('{"a": 1}')).toBe('{"a": 1}');
  });

  it('T-SJC-008 empty input returned empty', () => {
    expect(stripJsonComments('')).toBe('');
  });

  it('T-SJC-009 line comment in middle (not anchored to ^) NOT removed', () => {
    // "//" anchored to line start with ^\s* - inline "//" after content not matched
    const result = stripJsonComments('{"a": 1} // trailing');
    expect(result).toContain('"a": 1');
  });

  it('T-SJC-010 multiple block comments removed', () => {
    expect(stripJsonComments('/* a */{"x": 1}/* b */')).toBe('{"x": 1}');
  });
});
