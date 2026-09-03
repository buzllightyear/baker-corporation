export type Text = { en: string; ko: string };
export type Minute = number;                       // 판 시작 기준 경과 분. 시계는 0에서 시작

export interface Place { id: string; name: Text; description: Text; adjacent: string[] }
export interface Presence { personId: string; placeId: string; from: Minute; to: Minute }   // [from, to) 동안 그 장소
export interface Person { id: string; name: Text; role: Text; portrait: string /* 이모지 한 글자 */; truthful: boolean; blurb?: Text /* 명부 한 줄. 공개, 스포일러 없음 */ }
export interface Topic { id: string; label: Text; keywords: string[] }                      // keywords는 영어 소문자
export interface Statement {
  id: string; personId: string; topicId: string;
  text: Text;
  availableFrom?: Minute; availableTo?: Minute;   // 없으면 항상
  lie: boolean;                                   // 비공개
  refutedBy?: string[];                           // 이 진술을 반증하는 물증/진술 id (비공개)
  asserts?: { personId: string; placeId: string; from: Minute; to: Minute }[];  // 시간·장소 주장 (cross_check용, 공개)
}
export interface Evidence {
  id: string; placeId: string; name: Text; description: Text;
  availableFrom?: Minute; availableTo?: Minute;
  requiresCard?: string;                          // 이 카드가 수첩에 있어야 description이 아니라 fullDescription을 준다
  fullDescription?: Text;
  asserts?: { personId: string; placeId: string; from: Minute; to: Minute }[];
}
export interface Record_ { id: string; title: Text; body: Text; keywords: string[]; asserts?: Statement['asserts'] }
export interface Proposition { id: string; text: Text; provedBy: string[][]; refutedBy: string[] }  // provedBy: 덮는 집합들(OR of AND). 비공개
export interface Truth { culpritId: string; methodId: string; decisiveEvidenceId: string; motive: Text; reveal: Text; hook: Text }
export interface Method { id: string; label: Text }
export interface Episode {
  id: string; title: Text; series: Text; brief: Text; startPlaceId: string; watsonStartPlaceId: string;
  budgetMinutes: Minute; clockLabel: (m: Minute) => string;   // 예: 23:30 + m
  places: Place[]; people: Person[]; presence: Presence[]; topics: Topic[]; statements: Statement[];
  evidence: Evidence[]; records: Record_[]; propositions: Proposition[]; methods: Method[]; truth: Truth;
  tutorial?: TutorialStep[];
  intro?: Intro;                                   // 챕터 타이틀 카드 뒤에 오는 콜드 오픈 카드들
}
// 콜드 오픈. 카드 0(타이틀)은 UI가 만들고, 여기 카드들이 1..n으로 이어진다.
export interface IntroCard { title: Text; body: Text; image?: string; showCrew?: boolean }
export interface Intro { cards: IntroCard[] }
export interface TutorialStep { id: string; when: TutorialTrigger; say: Text; chip?: Text }
export type TutorialTrigger = { kind: 'start' } | { kind: 'watson_read' } | { kind: 'card', cardId: string } | { kind: 'moved', placeId: string } | { kind: 'theory' } | { kind: 'accused' };
