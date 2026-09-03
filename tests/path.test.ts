import { describe, it, expect } from 'vitest';
import { routeTo } from '../src/kernel/path';
import { MINI_CASE } from './fixtures/mini-case';
describe('routeTo', () => {
  it('finds the shortest route and handles trivial/unreachable cases', () => {
    expect(routeTo(MINI_CASE, 'galley', 'engine')).toEqual(['hall', 'engine']);
    expect(routeTo(MINI_CASE, 'hall', 'hall')).toEqual([]);
    expect(routeTo(MINI_CASE, 'hall', 'nowhere')).toBe(null);
  });
});
