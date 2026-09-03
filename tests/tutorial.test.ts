import { describe, it, expect } from 'vitest';
import { guide, allowed, hint } from '../src/ui/tutorial';
import { newRun } from '../src/kernel/model';
import { invoke } from '../src/kernel/kernel';
import { MINI_CASE } from './fixtures/mini-case';
import type { Episode } from '../content/types';
const t = (en: string) => ({ en, ko: en });
const EP: Episode = { ...MINI_CASE, tutorial: [
  { id: 's0', when: { kind: 'start' }, say: t('greet'), chip: t('Watson, read.') },
  { id: 's1', when: { kind: 'watson_read' }, say: t('go to the galley') },
  { id: 's2', when: { kind: 'moved', placeId: 'galley' }, say: t('talk to Bo about last night') },
  { id: 's3', when: { kind: 'card', cardId: 's_bo_night' }, say: t('now the hook') },
  { id: 's4', when: { kind: 'card', cardId: 'e_hook' }, say: t('accuse') },
  { id: 's5', when: { kind: 'accused' }, say: t('done') },
] };
describe('guided tutorial', () => {
  it('advances linearly and gates human actions to the current goal', () => {
    let s = newRun('mini', 'hall', 'hall');
    let g = guide(EP, s, 0)!; expect(g.index).toBe(0); expect(g.goal).toEqual({ kind: 'watson_read' });
    expect(allowed(EP, s, g.goal, { kind: 'move', placeId: 'galley' })).toBe(true);           // walking is always free
    expect(allowed(EP, s, g.goal, { kind: 'examine', evidenceId: 'e_hook' })).toBe(false);   // Watson's turn
    g = guide(EP, s, 1)!; expect(g.index).toBe(1); expect(g.goal).toEqual({ kind: 'moved', placeId: 'galley' });
    expect(allowed(EP, s, g.goal, { kind: 'move', placeId: 'engine' })).toBe(true);
    expect(allowed(EP, s, g.goal, { kind: 'talk', personId: 'bo', topicId: 'night' })).toBe(false);
    expect(hint(EP, s, g.goal, 'en')).toMatch(/Galley/);
    s = (invoke(EP, s, 'holmes', { kind: 'move', placeId: 'galley' }) as { state: typeof s }).state;
    g = guide(EP, s, 1)!; expect(g.index).toBe(2);
    expect(allowed(EP, s, g.goal, { kind: 'talk', personId: 'bo', topicId: 'wrench' })).toBe(false);
    expect(allowed(EP, s, g.goal, { kind: 'talk', personId: 'bo', topicId: 'night' })).toBe(true);
    expect(allowed(EP, s, g.goal, { kind: 'examine', evidenceId: 'e_hook' })).toBe(false);
    s = (invoke(EP, s, 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' }) as { state: typeof s }).state;
    g = guide(EP, s, 1)!; expect(g.index).toBe(3); expect(allowed(EP, s, g.goal, { kind: 'examine', evidenceId: 'e_hook' })).toBe(true);
    s = (invoke(EP, s, 'holmes', { kind: 'examine', evidenceId: 'e_hook' }) as { state: typeof s }).state;
    g = guide(EP, s, 1)!; expect(g.goal).toEqual({ kind: 'accused' }); expect(allowed(EP, s, g.goal, { kind: 'talk', personId: 'bo', topicId: 'wrench' })).toBe(false);
    s = (invoke(EP, s, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }) as { state: typeof s }).state;
    expect(guide(EP, s, 1)!.complete).toBe(true);
  });
  it('moving is allowed under every goal', () => {
    const s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'engine', watson: 'hall' } };
    expect(allowed(EP, s, { kind: 'moved', placeId: 'galley' }, { kind: 'move', placeId: 'hall' })).toBe(true);
    expect(allowed(EP, s, { kind: 'card', cardId: 'r_manifest' }, { kind: 'move', placeId: 'hall' })).toBe(true);
  });
});
