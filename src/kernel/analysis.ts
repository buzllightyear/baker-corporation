// STUB — filled in by Task 6.
import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';

export function runTimeline(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'timeline' }>): KernelResult {
  return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' };
}
export function runCrossCheck(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'cross_check' }>): KernelResult {
  return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' };
}
