import { describe, it, expect } from 'vitest';
import { COST, advance, isClosed } from '../src/kernel/clock';
import { newRun } from '../src/kernel/model';
import { MINI_CASE } from './fixtures/mini-case';
describe('clock', () => {
  it('advances by the verb cost and closes at the budget', () => {
    let s = newRun('mini', 'hall', 'hall');
    s = advance(s, 'move'); expect(s.clock).toBe(COST.move);
    s = { ...s, clock: MINI_CASE.budgetMinutes - 1 };
    s = advance(s, 'talk'); expect(isClosed(MINI_CASE, s)).toBe(true);
  });
  it('pin costs nothing', () => { const s = advance(newRun('mini', 'hall', 'hall'), 'pin'); expect(s.clock).toBe(0); });
});
