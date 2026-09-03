import { describe, it, expect } from 'vitest';
import { parseArgs, toolResult } from '../src/webmcp/normalize';

describe('parseArgs', () => {
  it('passes objects through', () => {
    expect(parseArgs<{ a: number }>({ a: 1 })).toEqual({ a: 1 });
  });
  it('parses JSON strings (Chrome 151 drift)', () => {
    expect(parseArgs<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });
  it('throws INVALID_ARGS on garbage', () => {
    expect(() => parseArgs('{not json')).toThrow('INVALID_ARGS');
    expect(() => parseArgs(42)).toThrow('INVALID_ARGS');
    expect(() => parseArgs(null)).toThrow('INVALID_ARGS');
  });
  it('rejects arrays and JSON that is not a plain object', () => {
    expect(() => parseArgs([1, 2])).toThrow('INVALID_ARGS');
    expect(() => parseArgs('[1,2]')).toThrow('INVALID_ARGS');
    expect(() => parseArgs('"str"')).toThrow('INVALID_ARGS');
    expect(() => parseArgs('null')).toThrow('INVALID_ARGS');
  });
});

describe('toolResult', () => {
  it('returns the payload as a plain object (single seam for a future envelope)', () => {
    const r = toolResult({ ok: true, x: 1 });
    expect(r).toEqual({ ok: true, x: 1 });
  });
});
