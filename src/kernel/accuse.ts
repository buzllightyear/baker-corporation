// STUB — filled in by Task 8.
import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';

export function runAccuse(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'accuse' }>): KernelResult {
  return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' };
}
