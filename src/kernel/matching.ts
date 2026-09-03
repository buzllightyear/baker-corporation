// STUB — filled in by Task 5.
import type { Episode } from '../../content/types';
import type { Actor, Cmd, KernelResult, RunState } from './model';

export function runAsk(ep: Episode, s: RunState, actor: Actor, cmd: Extract<Cmd, { kind: 'ask' }>): KernelResult {
  return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' };
}
export function runSearchRecords(ep: Episode, s: RunState, actor: Actor, cmd: Extract<Cmd, { kind: 'search_records' }>): KernelResult {
  return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' };
}
