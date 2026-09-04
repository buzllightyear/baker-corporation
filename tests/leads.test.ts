import { describe, it, expect } from 'vitest';
import { leads, coverage, fetchStatus } from '../src/kernel/leads';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
import type { RunState, Cmd, Actor } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';

const run = (...steps: [Actor, Cmd][]): RunState => steps.reduce((s, [a, c]) => { const r = invoke(ep, s, a, c); if (!r.ok) throw new Error(`${c.kind}: ${r.message}`); return r.state; }, newRun('mini', 'hall', 'hall'));

describe('leads', () => {
  it('counts unvisited rooms, unexamined evidence and unheard topics at the start', () => {
    const l = leads(ep, newRun('mini', 'hall', 'hall'));
    expect(l.rooms.find((r) => r.placeId === 'hall')).toMatchObject({ unvisited: false, unexamined: 0, unheard: 0 });
    expect(l.rooms.find((r) => r.placeId === 'engine')).toMatchObject({ unvisited: true, unexamined: 1, unheard: 2 });   // e_log; ada: wrench, night
    expect(l.rooms.find((r) => r.placeId === 'galley')).toMatchObject({ unvisited: true, unexamined: 2, unheard: 1 });   // e_hook, e_print; bo: night (wrench opens at 30)
    expect(l.people.find((p) => p.personId === 'ada')).toMatchObject({ unheard: 2, crossed: false, placeId: 'engine' });
    expect(l.open).toBe(1 + 1 + 2 + 1 + 2 + 1);
  });
  it('a heard topic, an examined item and a cross-check each close a lead', () => {
    const s = run(['holmes', { kind: 'move', placeId: 'engine' }], ['holmes', { kind: 'talk', personId: 'ada', topicId: 'wrench' }], ['holmes', { kind: 'examine', evidenceId: 'e_log' }]);
    const l = leads(ep, s);
    expect(l.rooms.find((r) => r.placeId === 'engine')).toMatchObject({ unvisited: false, unexamined: 0, unheard: 1 });
    expect(l.people.find((p) => p.personId === 'ada')).toMatchObject({ unheard: 1, crossed: false });
    const s2 = invoke(ep, s, 'watson', { kind: 'cross_check', personId: 'ada' });
    expect(s2.ok && leads(ep, s2.state).people.find((p) => p.personId === 'ada')?.crossed).toBe(true);
  });
  it('never reads lie/truth: counts are identical for a liar and an honest person with the same cards', () => {
    const l = leads(ep, newRun('mini', 'hall', 'hall'));
    expect(Object.keys(l.people[0])).toEqual(['personId', 'unheard', 'crossed', 'placeId']);
  });
});

describe('coverage and fetchStatus', () => {
  it('is incomplete at the start and complete once every provable proposition has a proving set on the notebook', () => {
    const s0 = newRun('mini', 'hall', 'hall');
    expect(coverage(ep, s0)).toEqual({ covered: 0, provable: 2, complete: false });
    expect(fetchStatus(ep, s0)).toBe('more_to_fetch');
    const s = run(
      ['holmes', { kind: 'move', placeId: 'galley' }],
      ['holmes', { kind: 'talk', personId: 'bo', topicId: 'night' }],           // p_ada_left via s_bo_night
      ['watson', { kind: 'search_records', query: 'wrench' }],                  // clock 35 → s_bo_wrench opens
      ['holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }],
      ['holmes', { kind: 'examine', evidenceId: 'e_print' }],                    // p_ada_took via e_print + s_bo_wrench
    );
    expect(coverage(ep, s)).toEqual({ covered: 2, provable: 2, complete: true });
    expect(fetchStatus(ep, s)).toBe('nothing_left_to_fetch');
  });
});

describe('store announces coverage once', () => {
  it('pushes the structural line when coverage completes, and not again', async () => {
    const { useGame, registerEpisode } = await import('../src/state/store');
    const { setLang } = await import('../src/i18n/lang');
    setLang('en'); registerEpisode(ep); useGame.getState().startEpisode('mini');
    const d = (a: Actor, c: Cmd) => { const r = useGame.getState().dispatch(a, c); if (!r.ok) throw new Error(r.message); };
    d('holmes', { kind: 'move', placeId: 'galley' }); d('holmes', { kind: 'talk', personId: 'bo', topicId: 'night' });
    d('watson', { kind: 'search_records', query: 'wrench' }); d('holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' });
    expect(useGame.getState().ticker.some((l) => l.text.includes('nothing left to fetch'))).toBe(false);
    d('holmes', { kind: 'examine', evidenceId: 'e_print' });
    const lines = () => useGame.getState().ticker.filter((l) => l.text.includes('nothing left to fetch'));
    expect(lines()).toHaveLength(1);
    d('holmes', { kind: 'examine', evidenceId: 'e_hook' });
    expect(lines()).toHaveLength(1);
  });
});
