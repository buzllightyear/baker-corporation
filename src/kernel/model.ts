import type { Text } from '../../content/types';
export type Actor = 'holmes' | 'watson';
export type Verb = 'move' | 'talk' | 'ask' | 'examine' | 'pin' | 'timeline' | 'cross_check' | 'search_records' | 'submit_theory';
export type CardKind = 'statement' | 'evidence' | 'record' | 'place';
export interface Card {
  id: string; kind: CardKind; title: Text; body: Text; foundBy: Actor; foundAt: number;   // foundAt = 게임 분
  personId?: string; topicId?: string; placeId?: string;
  asserts?: { personId: string; placeId: string; from: number; to: number }[];            // 공개: cross_check 재료
}
export interface Pin { cardId: string; note: string; at: number }
export interface LogEntry { actor: Actor; verb: Verb | 'accuse'; at: number; target: string }
export interface Accusation { who: string; how: string; evidence: string; at: number; result: { who: boolean; how: boolean; evidence: boolean } }
export interface RunState {
  episodeId: string; clock: number; closed: boolean;
  pos: Record<Actor, string>;
  cards: Card[]; pins: Pin[]; log: LogEntry[];
  accusationsLeft: number; accusations: Accusation[];
  verdict: null | 'solved' | 'failed';
  watsonCalls: number;
}
export type Cmd =
  | { kind: 'move'; placeId: string } | { kind: 'talk'; personId: string; topicId: string } | { kind: 'ask'; personId: string; question: string }
  | { kind: 'examine'; evidenceId: string } | { kind: 'pin'; cardId: string; note: string }
  | { kind: 'timeline'; personId?: string } | { kind: 'cross_check'; personId: string } | { kind: 'search_records'; query: string }
  | { kind: 'submit_theory'; claims: { claim: string; evidence_ids: string[] }[] }
  | { kind: 'accuse'; who: string; how: string; evidence: string };
export type ErrorCode = 'NOT_ADJACENT' | 'UNKNOWN_ID' | 'NOT_HERE' | 'NOT_NOW' | 'CASE_CLOSED' | 'WATSON_ONLY' | 'HOLMES_ONLY' | 'NO_ACCUSATIONS_LEFT' | 'INVALID_ARGS';
export type KernelResult<T = unknown> = { ok: true; state: RunState; result: T } | { ok: false; code: ErrorCode; message: string };
export function newRun(episodeId: string, startPlaceId: string, watsonStartPlaceId: string): RunState {
  return { episodeId, clock: 0, closed: false, pos: { holmes: startPlaceId, watson: watsonStartPlaceId }, cards: [], pins: [], log: [], accusationsLeft: 2, accusations: [], verdict: null, watsonCalls: 0 };
}
