import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGame, registerEpisode } from '../src/state/store';
import { MINI_CASE } from './fixtures/mini-case';

// The bindings must fire even where nothing can be heard — mock the player and
// watch the calls, exactly as the browser playtest reads window.__bakerAudio.
vi.mock('../src/audio/sfx', async (orig) => {
  const real = await orig<typeof import('../src/audio/sfx')>();
  return { ...real, playSfx: vi.fn(), playSequence: vi.fn() };
});

import * as engine from '../src/audio/engine';
import { playSfx } from '../src/audio/sfx';
import { useAudioBindings } from '../src/audio/useAudioBindings';
import { mapRoom, ambience } from '../src/audio/ambience';

const mockedPlay = playSfx as unknown as ReturnType<typeof vi.fn>;

describe('audio engine under jsdom', () => {
  beforeEach(() => { localStorage.clear(); engine.reloadSettings(); });

  it('reports no support and never builds a context', () => {
    expect(engine.isSupported()).toBe(false);
    expect(engine.context()).toBe(null);
    expect(engine.master()).toBe(null);
    expect(engine.now()).toBe(0);
  });

  it('is a no-op for every helper, without throwing', () => {
    expect(() => {
      engine.unlock();
      engine.armUnlock();
      engine.osc('sine', 440, { gain: 0.2 });
      engine.noise(0.2, { lowpass: 400 });
      engine.impulseReverb(1, 2);
      engine.env(null, 0, 0.01, 0.05, 0.4, 0.1, 1);
      engine.dry(); engine.send();
    }).not.toThrow();
    expect(engine.osc('sine', 440)).toBe(null);
    expect(engine.noise(0.2)).toBe(null);
    expect(engine.impulseReverb(1, 2)).toBe(null);
    expect(engine.isUnlocked()).toBe(false);
  });

  it('defaults to unmuted at 0.6', () => {
    expect(engine.getSettings()).toEqual({ muted: false, volume: 0.6 });
  });

  it('persists mute and volume to localStorage', () => {
    engine.setMuted(true);
    engine.setVolume(0.25);
    expect(JSON.parse(localStorage.getItem('baker.audio')!)).toEqual({ muted: true, volume: 0.25 });
    expect(engine.isMuted()).toBe(true);
    expect(engine.getVolume()).toBe(0.25);
    // a fresh read of storage sees the same thing
    expect(engine.reloadSettings()).toEqual({ muted: true, volume: 0.25 });
  });

  it('clamps volume and survives a corrupt stored value', () => {
    engine.setVolume(9);
    expect(engine.getVolume()).toBe(1);
    engine.setVolume(-3);
    expect(engine.getVolume()).toBe(0);
    localStorage.setItem('baker.audio', '{not json');
    expect(engine.reloadSettings()).toEqual({ muted: false, volume: 0.6 });
  });
});

describe('playSfx', () => {
  it('ignores an unknown name and never throws', async () => {
    const real = await vi.importActual<typeof import('../src/audio/sfx')>('../src/audio/sfx');
    expect(() => real.playSfx('no-such-sound')).not.toThrow();
    expect(() => real.playSfx('hatch')).not.toThrow();     // no context: silent no-op
    expect(real.__sfxNames()).toContain('hatch');
    expect(real.__sfxNames()).not.toContain('no-such-sound');
  });
});

describe('room mapping', () => {
  it('maps place ids onto ambience profiles by what they contain', () => {
    expect(mapRoom('corridor_a')).toBe('corridor');
    expect(mapRoom('bridge')).toBe('bridge');
    expect(mapRoom('cargo3')).toBe('cargo');
    expect(mapRoom('bunks')).toBe('quarters');
    expect(mapRoom('quarters')).toBe('quarters');
    expect(mapRoom('airlock')).toBe('airlock');
    expect(mapRoom('medbay')).toBe('medbay');
    expect(mapRoom('engine')).toBe('engine');
    expect(mapRoom('galley')).toBe('galley');
    expect(mapRoom('somewhere-else')).toBe('default');
    expect(mapRoom(null)).toBe('default');
  });

  it('ambience start/setRoom/stop are no-ops without a context', () => {
    expect(() => { ambience.start(); ambience.setRoom('engine'); ambience.stop(); }).not.toThrow();
    expect(ambience.isRunning()).toBe(false);
  });
});

describe('useAudioBindings', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedPlay.mockClear();
    registerEpisode(MINI_CASE);
    useGame.getState().startEpisode('mini');
  });

  it('plays the hatch when the investigator moves', () => {
    renderHook(() => useAudioBindings(true));
    mockedPlay.mockClear();
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    expect(mockedPlay).toHaveBeenCalledWith('hatch');
  });

  it('says nothing when a move is refused', () => {
    renderHook(() => useAudioBindings(true));
    mockedPlay.mockClear();
    const r = useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'nowhere' });
    expect(r.ok).toBe(false);
    expect(mockedPlay).not.toHaveBeenCalledWith('hatch');
  });

  it('stamps an accusation and stops listening once unmounted', () => {
    const h = renderHook(() => useAudioBindings(true));
    mockedPlay.mockClear();
    useGame.setState((s) => ({ state: { ...s.state!, accusations: [{ who: 'x', how: 'y', evidence: 'z', at: 1, result: { who: true, how: true, evidence: true } }] } }));
    expect(mockedPlay).toHaveBeenCalledWith('stamp');
    h.unmount();
    mockedPlay.mockClear();
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it('sounds the verdict', () => {
    renderHook(() => useAudioBindings(true));
    mockedPlay.mockClear();
    useGame.setState((s) => ({ state: { ...s.state!, verdict: 'solved' } }));
    expect(mockedPlay).toHaveBeenCalledWith('solved');
  });

  it('opens a panel when the notebook opens', () => {
    renderHook(() => useAudioBindings(true));
    mockedPlay.mockClear();
    const before = useGame.getState().notebookOpen;
    useGame.getState().toggleNotebook();
    if (!before) expect(mockedPlay).toHaveBeenCalledWith('open');
    else { useGame.getState().toggleNotebook(); expect(mockedPlay).toHaveBeenCalledWith('open'); }
  });

  it('tells Watson walking apart from Watson working', () => {
    renderHook(() => useAudioBindings(true));
    mockedPlay.mockClear();
    useGame.getState().pushTicker({ text: '▲ WATSON → Galley' });
    expect(mockedPlay).toHaveBeenCalledWith('watsonMove');
    mockedPlay.mockClear();
    useGame.getState().pushTicker({ text: '▲ WATSON · examining the bin' });
    expect(mockedPlay).toHaveBeenCalledWith('watson');
  });
});
