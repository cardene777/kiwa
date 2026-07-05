// Behavior tests for summariseReport used by mutation-baseline-refresh.mjs.
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/mutation-baseline-refresh.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { summariseReport } from './mutation-baseline-refresh.mjs';

const emptyReport = { files: {} };

const mixedReport = {
  files: {
    'src/a.js': {
      language: 'javascript',
      mutants: [
        { id: '1', status: 'Killed', mutatorName: 'BooleanLiteral' },
        { id: '2', status: 'Survived', mutatorName: 'ConditionalExpression', replacement: 'true', location: { start: { line: 12, column: 8 } } },
        { id: '3', status: 'Timeout', mutatorName: 'ArithmeticOperator' },
        { id: '4', status: 'NoCoverage', mutatorName: 'StringLiteral' },
      ],
    },
    'src/b.js': {
      language: 'javascript',
      mutants: [
        { id: '5', status: 'Killed', mutatorName: 'BooleanLiteral' },
        { id: '6', status: 'CompileError', mutatorName: 'BlockStatement' },
        { id: '7', status: 'Survived', mutatorName: 'MethodExpression', replacement: 'x', location: { start: { line: 3, column: 2 } } },
      ],
    },
  },
};

test('summariseReport handles an empty report without dividing by zero', () => {
  const summary = summariseReport(emptyReport);
  assert.equal(summary.killRate, 0);
  assert.equal(summary.killed, 0);
  assert.equal(summary.survived, 0);
  assert.equal(summary.timeout, 0);
  assert.equal(summary.noCoverage, 0);
  assert.equal(summary.error, 0);
  assert.deepEqual(summary.survivors, []);
});

test('summariseReport counts each mutant status into its bucket', () => {
  const summary = summariseReport(mixedReport);
  assert.equal(summary.killed, 2, 'two Killed mutants across two files');
  assert.equal(summary.survived, 2, 'two Survived mutants across two files');
  assert.equal(summary.timeout, 1, 'one Timeout mutant');
  assert.equal(summary.noCoverage, 1, 'one NoCoverage mutant');
  assert.equal(summary.error, 1, 'one CompileError counted as error');
});

test('summariseReport killRate excludes NoCoverage from the denominator', () => {
  // covered denominator = killed + survived + timeout = 2 + 2 + 1 = 5
  // numerator = killed + timeout = 3
  // score = 60
  const summary = summariseReport(mixedReport);
  assert.equal(summary.killRate, 60);
});

test('summariseReport records survivor location + mutator + trimmed replacement', () => {
  const summary = summariseReport(mixedReport);
  assert.equal(summary.survivors.length, 2);
  const [first, second] = summary.survivors;
  assert.equal(first.file, 'src/a.js');
  assert.equal(first.line, 12);
  assert.equal(first.column, 8);
  assert.equal(first.mutator, 'ConditionalExpression');
  assert.equal(first.replacement, 'true');
  assert.equal(second.file, 'src/b.js');
  assert.equal(second.mutator, 'MethodExpression');
});

test('summariseReport clamps oversized replacement strings to 120 chars', () => {
  const big = 'x'.repeat(500);
  const summary = summariseReport({
    files: {
      'src/c.js': {
        language: 'javascript',
        mutants: [
          { id: '1', status: 'Survived', mutatorName: 'StringLiteral', replacement: big, location: { start: { line: 1, column: 1 } } },
        ],
      },
    },
  });
  assert.equal(summary.survivors[0].replacement.length, 120);
});
