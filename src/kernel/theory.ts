// STUB — filled in by Task 7.
import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';

export function runTheory(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'submit_theory' }>): KernelResult {
  return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' };
}
