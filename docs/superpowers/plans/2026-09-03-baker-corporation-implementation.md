# The Baker Corporation — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사람이 클릭으로 수사하고, 에이전트(왓슨)가 WebMCP 도구로 같은 세계를 수사하며, 페이지가 진실을 쥐고 왓슨의 가설을 결정적으로 재판하는 탐정 게임을 새 레포·새 오리진에 배포한다.

**Architecture:** 순수 커널(`src/kernel`)이 사건 정본(`content/*.ts`)과 판 상태(RunState)를 받아 결정적으로 다음 상태와 결과를 돌려준다. zustand 스토어가 커널을 감싸고 `dispatch(actor, cmd)` 하나로 사람(UI 클릭)과 왓슨(WebMCP 도구)을 같은 함수에 떨어뜨린다. 정본은 커널 밖으로 나가기 전에 항상 `redact`를 거쳐 참/거짓 표시와 미공개 항목이 제거된다. `accuse`는 스토어에만 있고 레지스트리에 등록되지 않는다.

**Tech Stack:** Vite 8 · React 19 · TypeScript · zustand 5 · vitest 4 (jsdom) · webmcp-types · Vercel. Cue 레포(`~/PROJECTs/webmcp-slides`)에서 `src/webmcp/registry.ts`, `src/webmcp/normalize.ts`, 설정 파일을 복사한다. 서버 없음, LLM 없음.

**Spec:** `docs/superpowers/specs/2026-09-03-baker-corporation-design.md` (이 계획과 함께 새 레포로 옮긴다)

## Global Constraints

- 새 레포 `buzllightyear/baker-corporation`, 공개, 코드 라이선스 **AGPL-3.0** (`LICENSE`), 콘텐츠 **CC BY-NC-ND 4.0** (`content/LICENSE-CONTENT.md` + README 표기).
- 배포 `https://baker-corporation.vercel.app`, WebMCP 오리진 트라이얼 토큰은 그 오리진으로 새로 발급해 `index.html` `<meta http-equiv="origin-trial">`에 심는다.
- 정본은 어떤 도구도 통째로 돌려주지 않는다. `truth`, 진술의 `lie`, 명제의 `provedBy`/`refutedBy`는 절대 응답에 실리지 않는다.
- `accuse`는 WebMCP 도구로 등록하지 않는다. 테스트로 고정한다.
- 커널은 카드 id만 본다. 언어는 표현 층(`Text = { en: string; ko: string }`)에만 있다.
- 왓슨의 행동도 같은 시계를 쓴다. 시계 비용은 `src/kernel/clock.ts` 상수 하나에서만 정의한다.
- 판정에 LLM 없음. `submit_theory`와 `cross_check`는 순수 함수다.
- 사건 저작 조건 7개(스펙 §6)는 `validateCase`가 기계적으로 검사하고, 콘텐츠 태스크는 그 검사를 테스트로 통과해야 끝난다.
- 커밋 메시지 끝: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_012zAwTCp5JfyZrVxYtsPHLg`.
- 실행 체제(사용자 기존 지시, Cue에서 확정): 서브에이전트는 fable 제외 하위 모델, 태스크별 worktree 브랜치, 메인이 검증·머지.

---

## 파일 구조

```
baker-corporation/
  index.html                 OT 토큰 meta, 폰트, #root
  vercel.json                SPA rewrite
  package.json               name "baker-corporation", license "AGPL-3.0-only"
  vite.config.ts / tsconfig.json   Cue 복사
  LICENSE                    AGPL-3.0 전문
  README.md
  content/
    LICENSE-CONTENT.md       CC BY-NC-ND 4.0 표기
    types.ts                 CaseFile 타입 (정본 스키마)
    ep0-titan.ts             Episode 0 정본
    ep1-sensor.ts            Episode 1 정본
    index.ts                 EPISODES 목록
  src/
    main.tsx
    kernel/
      model.ts               RunState, Card, Cmd, KernelResult, 에러 코드
      clock.ts               비용 상수 COST, advance(), isClosed()
      redact.ts              정본 항목 → 공개 카드 (lie/truth 제거)
      kernel.ts              invoke(caseFile, state, actor, cmd) → {state, result} | {error}
      matching.ts            ask 질문→진술 매칭, theory 주장→명제 매칭
      analysis.ts            timeline(), crossCheck() (수첩 카드만 입력)
      theory.ts              judgeTheory() 입증/근거부족/모순
      validate.ts            validateCase() 저작 조건 7개
    state/
      store.ts               zustand: state, dispatch(actor, cmd), log, episode 선택, persist
      persist.ts             localStorage 저장/복원 (schema 버전)
    webmcp/
      registry.ts            Cue 복사 (그대로)
      normalize.ts           Cue 복사 (그대로)
      tools.ts               watsonTools(deps): 공유 5 + 전용 5. accuse 없음
      useWebmcp.ts           App 최상위 훅
      voice.ts               왓슨 성격·말투 규칙 문자열 (도구 설명과 get_case 응답에 실림)
    i18n/
      lang.ts                Lang = 'en'|'ko', detect(), pick(Text, lang)
      ui.ts                  UI 문자열 사전
    share/
      recap.ts               회고 → URL hash 인코딩/디코딩 (진실 미포함)
    ui/
      App.tsx                라우팅(#/play/<ep>, #/recap/<code>), 레이아웃 3열
      TopBar.tsx             제목·시계·잔여 기소·도구 배지·언어 토글
      MapPanel.tsx           노드 지도, 토큰(홈즈·왓슨·인물), 클릭 이동
      ScenePanel.tsx         장면 묘사, 인물·물건 목록, 화제 칩
      NotebookPanel.tsx      카드 목록, pin 메모, 행위자 표시
      AccuseDialog.tsx       세 칸 기소
      VerdictView.tsx        판결·진실 공개·봉인
      RecapView.tsx          경로 지도·순서·세 숫자·공유 링크
      TutorialChips.tsx      "왓슨에게 이렇게 말해보세요" 복사 칩
      NoAgentBanner.tsx
      theme.css
  tests/
    fixtures/mini-case.ts    테스트용 최소 정본 (방 3, 인물 2, 물증 3)
    clock.test.ts redact.test.ts kernel-move.test.ts kernel-talk.test.ts matching.test.ts
    analysis.test.ts theory.test.ts accuse.test.ts validate.test.ts store.test.ts
    tools.test.ts registry.test.ts recap.test.ts i18n.test.ts
    content-ep0.test.ts content-ep1.test.ts
    ui-scene.test.tsx ui-accuse.test.tsx
```

---

### Task 1: 레포·배포·오리진 트라이얼 부트스트랩

**Files:**
- Create: `package.json`, `index.html`, `vercel.json`, `vite.config.ts`, `tsconfig.json`, `LICENSE`, `content/LICENSE-CONTENT.md`, `README.md`, `.gitignore`, `src/main.tsx`, `src/ui/App.tsx`, `src/ui/theme.css`, `docs/superpowers/specs/2026-09-03-baker-corporation-design.md`, `docs/superpowers/plans/2026-09-03-baker-corporation-implementation.md`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: 빌드·테스트가 도는 빈 앱, 공개 레포, 프로덕션 URL, OT 토큰이 심긴 `index.html`.

- [ ] **Step 1: 디렉터리와 설정 복사**

```bash
mkdir -p ~/PROJECTs/baker-corporation && cd ~/PROJECTs/baker-corporation && git init -b main
cp ~/PROJECTs/webmcp-slides/{vite.config.ts,tsconfig.json,.gitignore} .
mkdir -p src/ui src/kernel src/state src/webmcp src/i18n src/share content tests/fixtures docs/superpowers/specs docs/superpowers/plans
cp ~/PROJECTs/webmcp-slides/docs/superpowers/specs/2026-09-03-baker-corporation-design.md docs/superpowers/specs/
cp ~/PROJECTs/webmcp-slides/docs/superpowers/plans/2026-09-03-baker-corporation-implementation.md docs/superpowers/plans/
```

`package.json`:

```json
{
  "name": "baker-corporation",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "license": "AGPL-3.0-only",
  "scripts": { "dev": "vite", "build": "tsc --noEmit && vite build", "preview": "vite preview", "test": "vitest run", "test:watch": "vitest" },
  "dependencies": { "react": "^19.2.8", "react-dom": "^19.2.8", "zustand": "^5.0.15" },
  "devDependencies": { "@testing-library/react": "^16.3.3", "@types/react": "^19.2.18", "@types/react-dom": "^19.2.5", "@vitejs/plugin-react": "^6.1.1", "jsdom": "^29.1.1", "typescript": "^7.0.2", "vite": "^8.2.2", "vitest": "^4.1.11", "webmcp-types": "^0.1.5" }
}
```

`vite.config.ts`의 `test.include`를 `['tests/**/*.test.{ts,tsx}']`로 바꾼다.

`index.html` (토큰은 Step 6에서 채움):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Baker Corporation</title>
    <!-- ORIGIN_TRIAL_META -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" />
  </head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

`vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

`LICENSE`: `curl -sL https://www.gnu.org/licenses/agpl-3.0.txt -o LICENSE` (첫 줄이 `GNU AFFERO GENERAL PUBLIC LICENSE`인지 확인).

`content/LICENSE-CONTENT.md`:

```markdown
# Content license

Everything under `content/` — the world of The Baker Corporation, its episodes, cases, characters (including Watson), statements, records and their translations — is licensed under **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**. https://creativecommons.org/licenses/by-nc-nd/4.0/

The game engine (everything outside `content/`) is licensed separately under AGPL-3.0 — see `/LICENSE`.
```

`README.md` 첫 줄에 라이선스 두 줄을 넣는다:

```markdown
# The Baker Corporation

*The agent writes the story. The website puts it on trial.*

Code: AGPL-3.0 (`LICENSE`) · Content (`content/`): CC BY-NC-ND 4.0 (`content/LICENSE-CONTENT.md`)
```

`src/main.tsx`, `src/ui/App.tsx`, `src/ui/theme.css`:

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client';
import './ui/theme.css';
import { App } from './ui/App';
createRoot(document.getElementById('root')!).render(<App />);
```

```tsx
// src/ui/App.tsx
export function App() { return <main data-testid="app"><h1>The Baker Corporation</h1></main>; }
```

```css
/* src/ui/theme.css */
:root { --ink: #111; --paper: #f4f2ec; --muted: #6b6b6b; --line: #d8d4c8; --holmes: #1f5fbf; --watson: #b85c1f; --danger: #b3261e; font-family: 'IBM Plex Sans', system-ui, sans-serif; }
body { margin: 0; background: var(--paper); color: var(--ink); }
code, .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
```

- [ ] **Step 2: 스모크 테스트 작성**

```ts
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { App } from '../src/ui/App';
describe('app', () => { it('renders the title', () => { render(createElement(App)); expect(screen.getByText('The Baker Corporation')).toBeTruthy(); }); });
```

- [ ] **Step 3: 설치·테스트·빌드**

Run: `npm install && npm test && npm run build`
Expected: 1 test passed, `dist/` 생성.

- [ ] **Step 4: 공개 레포 생성·푸시**

```bash
git add -A && git commit -m "chore: bootstrap — Vite/React/TS scaffold, AGPL-3.0 code + CC BY-NC-ND content, spec & plan"
gh repo create buzllightyear/baker-corporation --public --source=. --remote=origin --description "The agent writes the story. The website puts it on trial. A WebMCP detective game." --push
gh repo view buzllightyear/baker-corporation --json licenseInfo,visibility
```

Expected: `visibility: PUBLIC`, `licenseInfo.name: "GNU Affero General Public License v3.0"`.

- [ ] **Step 5: Vercel 배포**

```bash
npx vercel --yes --name baker-corporation
npx vercel --prod --yes
curl -sI https://baker-corporation.vercel.app | head -1
```

Expected: `HTTP/2 200`. 주소가 다르게 잡히면(이름 충돌) 실제 주소를 기록하고 스펙 §12를 고친다.

- [ ] **Step 6: 오리진 트라이얼 토큰 발급·삽입**

https://developer.chrome.com/origintrials/#/trials/active 에서 "WebMCP" 트라이얼 등록: origin `https://baker-corporation.vercel.app`, "Match all subdomains" 체크. 발급된 토큰으로 `index.html`의 `<!-- ORIGIN_TRIAL_META -->`를 다음으로 교체:

```html
<!-- Chrome Origin Trial: WebMCP for https://baker-corporation.vercel.app -->
<meta http-equiv="origin-trial" content="<TOKEN>" />
```

이 단계는 브라우저 로그인이 필요하므로 사용자 또는 OpenChrome 경로로 수행한다. 토큰이 당장 안 나오면 이 단계만 남기고 다음 태스크로 진행한다 (ChatGPT 내장 브라우저는 토큰 없이도 WebMCP가 켜져 있어 데모에 지장이 없다).

- [ ] **Step 7: 커밋·재배포**

```bash
git add index.html && git commit -m "chore: WebMCP origin trial token for baker-corporation.vercel.app" && git push
npx vercel --prod --yes
```

---

### Task 2: 정본 스키마와 테스트 픽스처

**Files:**
- Create: `content/types.ts`, `tests/fixtures/mini-case.ts`
- Test: `tests/fixture.test.ts`

**Interfaces:**
- Produces: `CaseFile` 및 하위 타입, 픽스처 `MINI_CASE` (이후 모든 커널 테스트가 이것을 쓴다).

- [ ] **Step 1: 타입 정의**

```ts
// content/types.ts
export type Text = { en: string; ko: string };
export type Minute = number;                       // 판 시작 기준 경과 분. 시계는 0에서 시작

export interface Place { id: string; name: Text; description: Text; adjacent: string[] }
export interface Presence { personId: string; placeId: string; from: Minute; to: Minute }   // [from, to) 동안 그 장소
export interface Person { id: string; name: Text; role: Text; portrait: string /* 이모지 한 글자 */; truthful: boolean }
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
}
export interface TutorialStep { id: string; when: TutorialTrigger; say: Text; chip?: Text }
export type TutorialTrigger = { kind: 'start' } | { kind: 'card', cardId: string } | { kind: 'moved', placeId: string } | { kind: 'theory' } | { kind: 'accused' };
```

- [ ] **Step 2: 픽스처 작성**

```ts
// tests/fixtures/mini-case.ts
import type { Episode } from '../../content/types';
const t = (en: string, ko = en) => ({ en, ko });
export const MINI_CASE: Episode = {
  id: 'mini', title: t('Mini'), series: t('Test'), brief: t('A wrench is missing.'), startPlaceId: 'hall', watsonStartPlaceId: 'hall',
  budgetMinutes: 120, clockLabel: (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
  places: [
    { id: 'hall', name: t('Hall'), description: t('A hall.'), adjacent: ['engine', 'galley'] },
    { id: 'engine', name: t('Engine'), description: t('Loud.'), adjacent: ['hall'] },
    { id: 'galley', name: t('Galley'), description: t('Warm.'), adjacent: ['hall'] },
  ],
  people: [
    { id: 'ada', name: t('Ada'), role: t('Engineer'), portrait: '🔧', truthful: false },
    { id: 'bo', name: t('Bo'), role: t('Cook'), portrait: '🍳', truthful: true },
  ],
  presence: [
    { personId: 'ada', placeId: 'engine', from: 0, to: 60 }, { personId: 'ada', placeId: 'galley', from: 60, to: 999 },
    { personId: 'bo', placeId: 'galley', from: 0, to: 999 },
  ],
  topics: [ { id: 'wrench', label: t('The wrench'), keywords: ['wrench', 'tool'] }, { id: 'night', label: t('Last night'), keywords: ['night', 'yesterday', 'where'] } ],
  statements: [
    { id: 's_ada_wrench', personId: 'ada', topicId: 'wrench', text: t('Never touched it.'), lie: true, refutedBy: ['e_print'] },
    { id: 's_ada_night', personId: 'ada', topicId: 'night', text: t('I was in the engine room all night.'), lie: true, asserts: [{ personId: 'ada', placeId: 'engine', from: 0, to: 120 }] },
    { id: 's_bo_night', personId: 'bo', topicId: 'night', text: t('Ada came to the galley after the first hour.'), lie: false, asserts: [{ personId: 'ada', placeId: 'galley', from: 60, to: 120 }] },
    { id: 's_bo_wrench', personId: 'bo', topicId: 'wrench', text: t('It hung by the stove.'), lie: false, availableFrom: 30 },
  ],
  evidence: [
    { id: 'e_hook', placeId: 'galley', name: t('Empty hook'), description: t('A hook by the stove. Empty.') },
    { id: 'e_print', placeId: 'galley', name: t('Grease print'), description: t('A greasy handprint.'), requiresCard: 's_bo_wrench', fullDescription: t('A greasy handprint — engine grease, on the hook.') },
    { id: 'e_log', placeId: 'engine', name: t('Door log'), description: t('Door log, partly wiped.'), availableTo: 90, asserts: [{ personId: 'ada', placeId: 'engine', from: 0, to: 55 }] },
  ],
  records: [ { id: 'r_manifest', title: t('Manifest'), body: t('One wrench, galley, checked out by Ada.'), keywords: ['wrench', 'manifest', 'ada'] } ],
  propositions: [
    { id: 'p_ada_left', text: t('Ada left the engine room before the second hour.'), provedBy: [['s_bo_night'], ['e_log']], refutedBy: [] },
    { id: 'p_ada_took', text: t('Ada took the wrench.'), provedBy: [['e_print', 's_bo_wrench']], refutedBy: ['s_ada_wrench'] },
    { id: 'p_bo_took', text: t('Bo took the wrench.'), provedBy: [], refutedBy: ['r_manifest'] },
  ],
  methods: [ { id: 'm_took', label: t('Took it from the hook') }, { id: 'm_sold', label: t('Sold it') } ],
  truth: { culpritId: 'ada', methodId: 'm_took', decisiveEvidenceId: 'e_print', motive: t('Debt.'), reveal: t('Ada took it.'), hook: t('The manifest was signed by someone else.') },
};
```

- [ ] **Step 3: 픽스처 형태 테스트**

```ts
// tests/fixture.test.ts
import { describe, it, expect } from 'vitest';
import { MINI_CASE } from './fixtures/mini-case';
describe('fixture', () => {
  it('references only existing ids', () => {
    const ids = new Set([...MINI_CASE.places, ...MINI_CASE.people, ...MINI_CASE.statements, ...MINI_CASE.evidence, ...MINI_CASE.records].map((x) => x.id));
    for (const p of MINI_CASE.propositions) { for (const set of p.provedBy) for (const id of set) expect(ids.has(id)).toBe(true); for (const id of p.refutedBy) expect(ids.has(id)).toBe(true); }
    expect(ids.has(MINI_CASE.truth.decisiveEvidenceId)).toBe(true);
  });
});
```

Run: `npx vitest run tests/fixture.test.ts` → PASS. Commit: `feat(content): case file schema + test fixture`.

---

### Task 3: 시계와 공개 카드(redact)

**Files:**
- Create: `src/kernel/clock.ts`, `src/kernel/redact.ts`, `src/kernel/model.ts`
- Test: `tests/clock.test.ts`, `tests/redact.test.ts`

**Interfaces:**
- Produces: `COST`, `advance(state, verb)`, `isClosed(ep, state)`; `Card` 타입과 `cardFromStatement/Evidence/Record/Place`; `RunState`, `Actor`, `Cmd`, `KernelResult`, `ErrorCode`.

- [ ] **Step 1: 모델**

```ts
// src/kernel/model.ts
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
```

- [ ] **Step 2: 시계 테스트**

```ts
// tests/clock.test.ts
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
```

- [ ] **Step 3: 시계 구현**

```ts
// src/kernel/clock.ts
import type { Episode } from '../../content/types';
import type { RunState, Verb } from './model';
export const COST: Record<Verb, number> = { move: 10, talk: 5, ask: 5, examine: 5, pin: 0, timeline: 10, cross_check: 20, search_records: 30, submit_theory: 0 };
export function advance(s: RunState, verb: Verb): RunState { return { ...s, clock: s.clock + COST[verb] }; }
export function isClosed(ep: Episode, s: RunState): boolean { return s.clock >= ep.budgetMinutes; }
```

- [ ] **Step 4: redact 테스트**

```ts
// tests/redact.test.ts
import { describe, it, expect } from 'vitest';
import { cardFromStatement, cardFromEvidence, cardFromRecord } from '../src/kernel/redact';
import { MINI_CASE } from './fixtures/mini-case';
describe('redact', () => {
  it('never leaks lie/refutedBy/fullDescription gating', () => {
    const st = MINI_CASE.statements.find((x) => x.id === 's_ada_wrench')!;
    const c = cardFromStatement(st, MINI_CASE, 'holmes', 5) as unknown as Record<string, unknown>;
    expect('lie' in c).toBe(false); expect('refutedBy' in c).toBe(false); expect(c.kind).toBe('statement');
    const ev = MINI_CASE.evidence.find((x) => x.id === 'e_print')!;
    expect(cardFromEvidence(ev, MINI_CASE, 'holmes', 5, false).body.en).toBe('A greasy handprint.');
    expect(cardFromEvidence(ev, MINI_CASE, 'holmes', 5, true).body.en).toContain('engine grease');
    expect(cardFromRecord(MINI_CASE.records[0], 'watson', 9).foundBy).toBe('watson');
  });
});
```

- [ ] **Step 5: redact 구현**

```ts
// src/kernel/redact.ts
import type { Episode, Evidence, Record_, Statement, Place } from '../../content/types';
import type { Actor, Card } from './model';
const person = (ep: Episode, id: string) => ep.people.find((p) => p.id === id)!;
const topic = (ep: Episode, id: string) => ep.topics.find((t) => t.id === id)!;
export function cardFromStatement(st: Statement, ep: Episode, by: Actor, at: number): Card {
  const p = person(ep, st.personId), t = topic(ep, st.topicId);
  return { id: st.id, kind: 'statement', title: { en: `${p.name.en} — ${t.label.en}`, ko: `${p.name.ko} — ${t.label.ko}` }, body: st.text, foundBy: by, foundAt: at, personId: st.personId, topicId: st.topicId, asserts: st.asserts };
}
export function cardFromEvidence(ev: Evidence, ep: Episode, by: Actor, at: number, unlocked: boolean): Card {
  const body = unlocked && ev.fullDescription ? ev.fullDescription : ev.description;
  return { id: ev.id, kind: 'evidence', title: ev.name, body, foundBy: by, foundAt: at, placeId: ev.placeId, asserts: unlocked ? ev.asserts : undefined };
}
export function cardFromRecord(r: Record_, by: Actor, at: number): Card { return { id: r.id, kind: 'record', title: r.title, body: r.body, foundBy: by, foundAt: at, asserts: r.asserts }; }
export function cardFromPlace(pl: Place, by: Actor, at: number): Card { return { id: `place:${pl.id}`, kind: 'place', title: pl.name, body: pl.description, foundBy: by, foundAt: at, placeId: pl.id }; }
```

Run: `npx vitest run tests/clock.test.ts tests/redact.test.ts` → PASS. Commit: `feat(kernel): clock costs + redacted cards`.

---

### Task 4: 커널 — move · examine · talk · pin

**Files:**
- Create: `src/kernel/kernel.ts`
- Test: `tests/kernel-move.test.ts`, `tests/kernel-talk.test.ts`

**Interfaces:**
- Produces: `invoke(ep: Episode, s: RunState, actor: Actor, cmd: Cmd): KernelResult`, `whoIsHere(ep, s, placeId)`, `whatIsHere(ep, s, placeId)`, `addCard(s, card)` (중복 id면 그대로).

- [ ] **Step 1: move·examine 테스트**

```ts
// tests/kernel-move.test.ts
import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const start = () => newRun('mini', 'hall', 'hall');
describe('move', () => {
  it('moves along adjacency, costs 10, returns the scene', () => {
    const r = invoke(ep, start(), 'holmes', { kind: 'move', placeId: 'galley' });
    expect(r.ok && r.state.pos.holmes).toBe('galley'); expect(r.ok && r.state.clock).toBe(10);
    expect(r.ok && (r.result as any).people.map((p: any) => p.id)).toEqual(['bo']);
    expect(r.ok && (r.result as any).evidence.map((e: any) => e.id)).toEqual(['e_hook', 'e_print']);
  });
  it('rejects non-adjacent and unknown places', () => {
    let r = invoke(ep, start(), 'holmes', { kind: 'move', placeId: 'nowhere' }); expect(r.ok).toBe(false); expect(!r.ok && r.code).toBe('UNKNOWN_ID');
    const s = { ...start(), pos: { holmes: 'engine', watson: 'hall' } };
    r = invoke(ep, s, 'holmes', { kind: 'move', placeId: 'galley' }); expect(!r.ok && r.code).toBe('NOT_ADJACENT');
  });
  it('watson moves independently of holmes', () => {
    const r = invoke(ep, start(), 'watson', { kind: 'move', placeId: 'engine' });
    expect(r.ok && r.state.pos).toEqual({ holmes: 'hall', watson: 'engine' }); expect(r.ok && r.state.watsonCalls).toBe(1);
  });
  it('presence follows the clock', () => {
    const s = { ...start(), clock: 70, pos: { holmes: 'hall', watson: 'hall' } };
    const r = invoke(ep, s, 'holmes', { kind: 'move', placeId: 'engine' });
    expect(r.ok && (r.result as any).people).toEqual([]);
  });
});
describe('examine', () => {
  it('requires being in the room and honours availableTo and requiresCard', () => {
    let r = invoke(ep, start(), 'holmes', { kind: 'examine', evidenceId: 'e_hook' }); expect(!r.ok && r.code).toBe('NOT_HERE');
    const inGalley = { ...start(), pos: { holmes: 'galley', watson: 'hall' } };
    r = invoke(ep, inGalley, 'holmes', { kind: 'examine', evidenceId: 'e_print' });
    expect(r.ok && r.state.cards[0].body.en).toBe('A greasy handprint.');
    const late = { ...start(), clock: 95, pos: { holmes: 'engine', watson: 'hall' } };
    r = invoke(ep, late, 'holmes', { kind: 'examine', evidenceId: 'e_log' }); expect(!r.ok && r.code).toBe('NOT_NOW');
  });
  it('re-examining after the gating card upgrades the card body in place', () => {
    const s0 = { ...start(), pos: { holmes: 'galley', watson: 'hall' } };
    const a = invoke(ep, s0, 'holmes', { kind: 'examine', evidenceId: 'e_print' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); if (!b.ok) throw new Error();   // clock 10 < availableFrom 30 → NOT_NOW? see talk tests: use clock 30
  });
  it('closes the case at the budget', () => {
    const s = { ...start(), clock: 120 };
    const r = invoke(ep, s, 'holmes', { kind: 'move', placeId: 'galley' }); expect(!r.ok && r.code).toBe('CASE_CLOSED');
  });
});
```

(위 두 번째 examine 테스트의 미완 부분은 talk 테스트 파일에서 `clock: 30`으로 완성한다. 아래 참고.)

- [ ] **Step 2: talk·pin 테스트**

```ts
// tests/kernel-talk.test.ts
import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const at = (placeId: string, clock = 0) => ({ ...newRun('mini', 'hall', 'hall'), clock, pos: { holmes: placeId, watson: 'hall' } });
describe('talk', () => {
  it('returns the statement card for a topic when the person is here and now', () => {
    const r = invoke(ep, at('galley'), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' });
    expect(r.ok && r.state.cards[0].id).toBe('s_bo_night'); expect(r.ok && r.state.clock).toBe(5);
  });
  it('rejects a person not in the room, and a statement not yet available', () => {
    let r = invoke(ep, at('galley'), 'holmes', { kind: 'talk', personId: 'ada', topicId: 'night' }); expect(!r.ok && r.code).toBe('NOT_HERE');
    r = invoke(ep, at('galley', 0), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); expect(!r.ok && r.code).toBe('NOT_NOW');
    r = invoke(ep, at('galley', 30), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); expect(r.ok).toBe(true);
  });
  it('unlocks the full evidence description once the gating statement is on the board', () => {
    const a = invoke(ep, at('galley', 30), 'holmes', { kind: 'examine', evidenceId: 'e_print' }); if (!a.ok) throw new Error(a.code);
    const b = invoke(ep, a.state, 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); if (!b.ok) throw new Error(b.code);
    const c = invoke(ep, b.state, 'holmes', { kind: 'examine', evidenceId: 'e_print' }); if (!c.ok) throw new Error(c.code);
    expect(c.state.cards.find((x) => x.id === 'e_print')!.body.en).toContain('engine grease');
    expect(c.state.cards.filter((x) => x.id === 'e_print').length).toBe(1);
  });
  it('the card never carries lie or refutedBy', () => {
    const r = invoke(ep, at('engine'), 'holmes', { kind: 'talk', personId: 'ada', topicId: 'wrench' });
    expect(r.ok && JSON.stringify(r.state.cards[0])).not.toMatch(/lie|refutedBy/);
  });
});
describe('pin', () => {
  it('adds a note without moving the clock; unknown card rejected', () => {
    const a = invoke(ep, at('galley'), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'holmes', { kind: 'pin', cardId: 's_bo_night', note: 'Ada moved.' });
    expect(b.ok && b.state.pins[0].note).toBe('Ada moved.'); expect(b.ok && b.state.clock).toBe(5);
    const c = invoke(ep, a.state, 'holmes', { kind: 'pin', cardId: 'nope', note: '' }); expect(!c.ok && c.code).toBe('UNKNOWN_ID');
  });
});
```

- [ ] **Step 3: 커널 구현**

```ts
// src/kernel/kernel.ts
import type { Episode, Evidence, Statement } from '../../content/types';
import type { Actor, Card, Cmd, KernelResult, RunState } from './model';
import { advance, isClosed } from './clock';
import { cardFromEvidence, cardFromPlace, cardFromStatement } from './redact';
import { runAsk, runSearchRecords } from './matching';
import { runCrossCheck, runTimeline } from './analysis';
import { runTheory } from './theory';
import { runAccuse } from './accuse';

const fail = (code: KernelResult['ok'] extends true ? never : any, message: string): KernelResult => ({ ok: false, code, message });
const within = (from: number | undefined, to: number | undefined, clock: number) => (from === undefined || clock >= from) && (to === undefined || clock < to);
export function whoIsHere(ep: Episode, s: RunState, placeId: string) {
  return ep.presence.filter((p) => p.placeId === placeId && s.clock >= p.from && s.clock < p.to).map((p) => ep.people.find((x) => x.id === p.personId)!);
}
export function whatIsHere(ep: Episode, s: RunState, placeId: string): Evidence[] { return ep.evidence.filter((e) => e.placeId === placeId && within(e.availableFrom, e.availableTo, s.clock)); }
export function addCard(s: RunState, card: Card): RunState {
  const i = s.cards.findIndex((c) => c.id === card.id);
  if (i < 0) return { ...s, cards: [...s.cards, card] };
  const prev = s.cards[i];
  const next = { ...prev, body: card.body, asserts: card.asserts ?? prev.asserts };   // 업그레이드는 본문만, 발견자·시각은 최초 유지
  return { ...s, cards: s.cards.map((c, j) => (j === i ? next : c)) };
}
const hasCard = (s: RunState, id: string) => s.cards.some((c) => c.id === id);
export function scene(ep: Episode, s: RunState, placeId: string) {
  const pl = ep.places.find((p) => p.id === placeId)!;
  return { place: { id: pl.id, name: pl.name, description: pl.description, adjacent: pl.adjacent },
    people: whoIsHere(ep, s, placeId).map((p) => ({ id: p.id, name: p.name, role: p.role, portrait: p.portrait, topics: ep.topics.filter((t) => ep.statements.some((st) => st.personId === p.id && st.topicId === t.id)).map((t) => ({ id: t.id, label: t.label })) })),
    evidence: whatIsHere(ep, s, placeId).map((e) => ({ id: e.id, name: e.name })) };
}
function logged(s: RunState, actor: Actor, verb: Cmd['kind'], target: string): RunState {
  const log = [...s.log, { actor, verb: verb as any, at: s.clock, target }];
  return actor === 'watson' && verb !== 'accuse' ? { ...s, log, watsonCalls: s.watsonCalls + 1 } : { ...s, log };
}
export function invoke(ep: Episode, s0: RunState, actor: Actor, cmd: Cmd): KernelResult {
  if (cmd.kind === 'accuse') return actor === 'holmes' ? runAccuse(ep, s0, cmd) : fail('HOLMES_ONLY', 'Only the investigator can accuse.');
  if (s0.verdict) return fail('CASE_CLOSED', 'The case is over.');
  if (isClosed(ep, s0) || s0.closed) return fail('CASE_CLOSED', 'Docking. Investigation is closed; only an accusation remains.');
  const watsonOnly: Cmd['kind'][] = ['timeline', 'cross_check', 'search_records', 'submit_theory'];
  if (actor === 'holmes' && watsonOnly.includes(cmd.kind)) return fail('WATSON_ONLY', `${cmd.kind} is Watson's.`);
  let s = logged(s0, actor, cmd.kind, 'placeId' in cmd ? cmd.placeId : 'personId' in cmd ? cmd.personId : 'evidenceId' in cmd ? cmd.evidenceId : 'cardId' in cmd ? cmd.cardId : cmd.kind);
  switch (cmd.kind) {
    case 'move': {
      const here = ep.places.find((p) => p.id === s.pos[actor])!; const to = ep.places.find((p) => p.id === cmd.placeId);
      if (!to) return fail('UNKNOWN_ID', `No place ${cmd.placeId}.`);
      if (!here.adjacent.includes(to.id)) return fail('NOT_ADJACENT', `${here.id} does not connect to ${to.id}. Adjacent: ${here.adjacent.join(', ')}.`);
      s = advance({ ...s, pos: { ...s.pos, [actor]: to.id } }, 'move');
      s = addCard(s, cardFromPlace(to, actor, s.clock));
      return { ok: true, state: s, result: scene(ep, s, to.id) };
    }
    case 'examine': {
      const ev = ep.evidence.find((e) => e.id === cmd.evidenceId); if (!ev) return fail('UNKNOWN_ID', `No evidence ${cmd.evidenceId}.`);
      if (ev.placeId !== s.pos[actor]) return fail('NOT_HERE', `${ev.id} is in ${ev.placeId}; ${actor} is in ${s.pos[actor]}.`);
      if (!within(ev.availableFrom, ev.availableTo, s.clock)) return fail('NOT_NOW', `${ev.id} is not there right now.`);
      s = advance(s, 'examine');
      const card = cardFromEvidence(ev, ep, actor, s.clock, !ev.requiresCard || hasCard(s, ev.requiresCard));
      s = addCard(s, card);
      return { ok: true, state: s, result: { card: s.cards.find((c) => c.id === card.id) } };
    }
    case 'talk': {
      const st = ep.statements.find((x) => x.personId === cmd.personId && x.topicId === cmd.topicId);
      if (!ep.people.some((p) => p.id === cmd.personId) || !st) return fail('UNKNOWN_ID', `No statement for ${cmd.personId}/${cmd.topicId}.`);
      if (!whoIsHere(ep, s, s.pos[actor]).some((p) => p.id === cmd.personId)) return fail('NOT_HERE', `${cmd.personId} is not in ${s.pos[actor]} right now.`);
      if (!within(st.availableFrom, st.availableTo, s.clock)) return fail('NOT_NOW', `${cmd.personId} has nothing to say about that yet.`);
      s = advance(s, 'talk');
      s = addCard(s, cardFromStatement(st, ep, actor, s.clock));
      return { ok: true, state: s, result: { card: s.cards.find((c) => c.id === st.id) } };
    }
    case 'pin': {
      if (!hasCard(s, cmd.cardId)) return fail('UNKNOWN_ID', `No card ${cmd.cardId} on the board.`);
      s = { ...s, pins: [...s.pins, { cardId: cmd.cardId, note: cmd.note, at: s.clock }] };
      return { ok: true, state: s, result: { pins: s.pins.length } };
    }
    case 'ask': return runAsk(ep, s, actor, cmd);
    case 'search_records': return runSearchRecords(ep, s, actor, cmd);
    case 'timeline': return runTimeline(ep, s, cmd);
    case 'cross_check': return runCrossCheck(ep, s, cmd);
    case 'submit_theory': return runTheory(ep, s, cmd);
  }
}
```

이 태스크에서는 `matching.ts`, `analysis.ts`, `theory.ts`, `accuse.ts`를 **스텁**으로 만든다 (각각 `export function runX(): KernelResult { return { ok: false, code: 'INVALID_ARGS', message: 'not implemented' }; }` 형태, 시그니처는 아래 태스크와 동일). 뒤 태스크가 채운다.

- [ ] **Step 4: 실행**

Run: `npx vitest run tests/kernel-move.test.ts tests/kernel-talk.test.ts` → PASS (examine의 미완 테스트는 talk 파일로 옮기고 move 파일에서 삭제). Commit: `feat(kernel): move/examine/talk/pin with presence, gating, clock`.

---

### Task 5: 매칭 — ask · search_records

**Files:**
- Create: `src/kernel/matching.ts`
- Test: `tests/matching.test.ts`

**Interfaces:**
- Produces: `runAsk(ep, s, actor, cmd)`, `runSearchRecords(ep, s, actor, cmd)`, `tokenize(q: string): string[]`, `matchTopic(ep, personId, q): Topic | null`.

- [ ] **Step 1: 테스트**

```ts
// tests/matching.test.ts
import { describe, it, expect } from 'vitest';
import { tokenize, matchTopic, runAsk, runSearchRecords } from '../src/kernel/matching';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const at = (placeId: string, clock = 0) => ({ ...newRun('mini', 'hall', 'hall'), clock, pos: { holmes: 'hall', watson: placeId } });
describe('tokenize', () => { it('lowercases, strips punctuation, drops stopwords', () => { expect(tokenize('Where were YOU last night?')).toEqual(['where', 'last', 'night']); }); });
describe('ask', () => {
  it('maps a free question to the best topic by keyword overlap and returns that statement', () => {
    const r = runAsk(ep, at('galley', 40), 'watson', { kind: 'ask', personId: 'bo', question: 'Do you know anything about the wrench?' });
    expect(r.ok && (r.result as any).card.id).toBe('s_bo_wrench'); expect(r.ok && r.state.clock).toBe(45);
  });
  it('returns unknown:true (no card, clock still spent) when nothing matches', () => {
    const r = runAsk(ep, at('galley'), 'watson', { kind: 'ask', personId: 'bo', question: 'What is your favourite colour?' });
    expect(r.ok && (r.result as any).unknown).toBe(true); expect(r.ok && r.state.cards.length).toBe(0); expect(r.ok && r.state.clock).toBe(5);
  });
  it('is NOT_HERE when the person is elsewhere', () => { const r = runAsk(ep, at('hall'), 'watson', { kind: 'ask', personId: 'bo', question: 'wrench' }); expect(!r.ok && r.code).toBe('NOT_HERE'); });
  it('matchTopic prefers the topic with more overlapping keywords', () => { expect(matchTopic(ep, 'bo', 'where were you at night with the tool')!.id).toBe('night'); });
});
describe('search_records', () => {
  it('returns matching records as cards, costs 30, no location needed', () => {
    const r = runSearchRecords(ep, at('hall'), 'watson', { kind: 'search_records', query: 'wrench manifest' });
    expect(r.ok && r.state.cards.map((c) => c.id)).toEqual(['r_manifest']); expect(r.ok && r.state.clock).toBe(30);
  });
  it('empty result is ok with hits: []', () => { const r = runSearchRecords(ep, at('hall'), 'watson', { kind: 'search_records', query: 'zebra' }); expect(r.ok && (r.result as any).hits).toEqual([]); });
});
```

- [ ] **Step 2: 구현**

```ts
// src/kernel/matching.ts
import type { Episode, Topic } from '../../content/types';
import type { Actor, Cmd, KernelResult, RunState } from './model';
import { advance } from './clock';
import { addCard, whoIsHere } from './kernel';
import { cardFromRecord, cardFromStatement } from './redact';
const STOP = new Set(['the', 'a', 'an', 'you', 'your', 'were', 'was', 'is', 'are', 'do', 'did', 'about', 'of', 'to', 'at', 'in', 'on', 'and', 'or', 'what', 'know', 'anything', 'tell', 'me', 'with', 'for', 'have', 'has', 'had', 'be', 'it', 'that', 'this', 'there']);
export function tokenize(q: string): string[] { return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)); }
export function matchTopic(ep: Episode, personId: string, q: string): Topic | null {
  const words = new Set(tokenize(q));
  const candidates = ep.topics.filter((t) => ep.statements.some((s) => s.personId === personId && s.topicId === t.id));
  let best: Topic | null = null, bestScore = 0;
  for (const t of candidates) { const score = t.keywords.filter((k) => words.has(k)).length; if (score > bestScore) { best = t; bestScore = score; } }
  return best;
}
export function runAsk(ep: Episode, s: RunState, actor: Actor, cmd: Extract<Cmd, { kind: 'ask' }>): KernelResult {
  if (!ep.people.some((p) => p.id === cmd.personId)) return { ok: false, code: 'UNKNOWN_ID', message: `No person ${cmd.personId}.` };
  if (!whoIsHere(ep, s, s.pos[actor]).some((p) => p.id === cmd.personId)) return { ok: false, code: 'NOT_HERE', message: `${cmd.personId} is not in ${s.pos[actor]} right now.` };
  s = advance(s, 'ask');
  const topic = matchTopic(ep, cmd.personId, cmd.question);
  const st = topic ? ep.statements.find((x) => x.personId === cmd.personId && x.topicId === topic.id) : undefined;
  const now = st && (st.availableFrom === undefined || s.clock >= st.availableFrom) && (st.availableTo === undefined || s.clock < st.availableTo);
  if (!st || !now) return { ok: true, state: s, result: { unknown: true, note: 'They have nothing to say about that. Voice it as the character declining or not knowing — do not invent details.' } };
  s = addCard(s, cardFromStatement(st, ep, actor, s.clock));
  return { ok: true, state: s, result: { card: s.cards.find((c) => c.id === st.id), note: 'Voice this in the character\'s own words. Say only what the card says.' } };
}
export function runSearchRecords(ep: Episode, s: RunState, actor: Actor, cmd: Extract<Cmd, { kind: 'search_records' }>): KernelResult {
  s = advance(s, 'search_records');
  const words = new Set(tokenize(cmd.query));
  const hits = ep.records.filter((r) => r.keywords.some((k) => words.has(k)));
  for (const r of hits) s = addCard(s, cardFromRecord(r, actor, s.clock));
  return { ok: true, state: s, result: { hits: hits.map((r) => s.cards.find((c) => c.id === r.id)) } };
}
```

Run: `npx vitest run tests/matching.test.ts` → PASS. Commit: `feat(kernel): ask (topic matching) + search_records`.

---

### Task 6: 분석 — timeline · cross_check

**Files:**
- Create: `src/kernel/analysis.ts`
- Test: `tests/analysis.test.ts`

**Interfaces:**
- Produces: `runTimeline(ep, s, cmd)` → `{ timeline: { personId, spans: {placeId, from, to, sourceCardId}[], gaps: {from,to}[] }[] }`; `runCrossCheck(ep, s, cmd)` → `{ conflicts: { a: string, b: string, personId, why: string }[] }`. 둘 다 **수첩 카드의 `asserts`만** 입력으로 쓴다.

- [ ] **Step 1: 테스트**

```ts
// tests/analysis.test.ts
import { describe, it, expect } from 'vitest';
import { runTimeline, runCrossCheck, conflictsBetween } from '../src/kernel/analysis';
import { newRun } from '../src/kernel/model';
import { invoke } from '../src/kernel/kernel';
import { MINI_CASE as ep } from './fixtures/mini-case';
function board() {
  let s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'galley', watson: 'engine' } };
  const a = invoke(ep, s, 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' }); if (!a.ok) throw new Error(a.code);
  const b = invoke(ep, a.state, 'watson', { kind: 'talk', personId: 'ada', topicId: 'night' }); if (!b.ok) throw new Error(b.code);
  return b.state;
}
describe('cross_check', () => {
  it('flags a time-place conflict between two cards about the same person', () => {
    const r = runCrossCheck(ep, board(), { kind: 'cross_check', personId: 'ada' });
    expect(r.ok && (r.result as any).conflicts.length).toBe(1);
    expect(r.ok && (r.result as any).conflicts[0]).toMatchObject({ a: 's_ada_night', b: 's_bo_night', personId: 'ada' });
    expect(r.ok && r.state.clock).toBe(board().clock + 20);
  });
  it('finds nothing when the board lacks the second card', () => {
    const s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'hall', watson: 'engine' } };
    const a = invoke(ep, s, 'watson', { kind: 'talk', personId: 'ada', topicId: 'night' }); if (!a.ok) throw new Error();
    const r = runCrossCheck(ep, a.state, { kind: 'cross_check', personId: 'ada' });
    expect(r.ok && (r.result as any).conflicts).toEqual([]);
  });
  it('conflictsBetween is symmetric and ignores different people', () => {
    const x = { personId: 'ada', placeId: 'engine', from: 0, to: 120 }, y = { personId: 'ada', placeId: 'galley', from: 60, to: 120 }, z = { personId: 'bo', placeId: 'galley', from: 60, to: 120 };
    expect(conflictsBetween(x, y)).toBe(true); expect(conflictsBetween(y, x)).toBe(true); expect(conflictsBetween(x, z)).toBe(false);
  });
});
describe('timeline', () => {
  it('lists spans from cards and the gaps between them', () => {
    const r = runTimeline(ep, board(), { kind: 'timeline', personId: 'ada' });
    const t = r.ok && (r.result as any).timeline[0];
    expect(t.personId).toBe('ada'); expect(t.spans.map((x: any) => x.sourceCardId).sort()).toEqual(['s_ada_night', 's_bo_night']);
  });
  it('gaps: with only the door log (0-55) on the board, 55-120 is a gap', () => {
    let s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'engine', watson: 'hall' } };
    const a = invoke(ep, s, 'holmes', { kind: 'examine', evidenceId: 'e_log' }); if (!a.ok) throw new Error();
    const r = runTimeline(ep, a.state, { kind: 'timeline', personId: 'ada' });
    expect(r.ok && (r.result as any).timeline[0].gaps).toEqual([{ from: 55, to: 120 }]);
  });
});
```

- [ ] **Step 2: 구현**

```ts
// src/kernel/analysis.ts
import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';
import { advance } from './clock';
type Span = { personId: string; placeId: string; from: number; to: number };
export function conflictsBetween(a: Span, b: Span): boolean { return a.personId === b.personId && a.placeId !== b.placeId && a.from < b.to && b.from < a.to; }
function spansOnBoard(s: RunState, personId?: string) {
  return s.cards.flatMap((c) => (c.asserts ?? []).filter((a) => !personId || a.personId === personId).map((a) => ({ ...a, sourceCardId: c.id })));
}
export function runCrossCheck(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'cross_check' }>): KernelResult {
  if (!ep.people.some((p) => p.id === cmd.personId)) return { ok: false, code: 'UNKNOWN_ID', message: `No person ${cmd.personId}.` };
  s = advance(s, 'cross_check');
  const spans = spansOnBoard(s, cmd.personId);
  const conflicts: { a: string; b: string; personId: string; why: string }[] = [];
  for (let i = 0; i < spans.length; i++) for (let j = i + 1; j < spans.length; j++) {
    const x = spans[i], y = spans[j];
    if (x.sourceCardId !== y.sourceCardId && conflictsBetween(x, y)) conflicts.push({ a: x.sourceCardId, b: y.sourceCardId, personId: cmd.personId, why: `${x.sourceCardId} puts ${cmd.personId} in ${x.placeId} ${x.from}-${x.to}; ${y.sourceCardId} puts them in ${y.placeId} ${y.from}-${y.to}.` });
  }
  return { ok: true, state: s, result: { conflicts, note: 'These are mechanical time/place collisions between cards already on the board — candidates, not verdicts. A collision means at least one card is wrong, not which.' } };
}
export function runTimeline(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'timeline' }>): KernelResult {
  if (cmd.personId && !ep.people.some((p) => p.id === cmd.personId)) return { ok: false, code: 'UNKNOWN_ID', message: `No person ${cmd.personId}.` };
  s = advance(s, 'timeline');
  const people = cmd.personId ? [cmd.personId] : ep.people.map((p) => p.id);
  const timeline = people.map((personId) => {
    const spans = spansOnBoard(s, personId).sort((a, b) => a.from - b.from);
    const gaps: { from: number; to: number }[] = []; let cursor = 0;
    for (const sp of spans) { if (sp.from > cursor) gaps.push({ from: cursor, to: sp.from }); cursor = Math.max(cursor, Math.min(sp.to, ep.budgetMinutes)); }
    if (cursor < ep.budgetMinutes) gaps.push({ from: cursor, to: ep.budgetMinutes });
    return { personId, spans, gaps };
  });
  return { ok: true, state: s, result: { timeline, clockLabel: ep.clockLabel(s.clock) } };
}
```

Run: `npx vitest run tests/analysis.test.ts` → PASS. Commit: `feat(kernel): timeline gaps + mechanical cross_check`.

---

### Task 7: 예비 심리 — submit_theory

**Files:**
- Create: `src/kernel/theory.ts`
- Test: `tests/theory.test.ts`

**Interfaces:**
- Produces: `runTheory(ep, s, cmd)` → `{ verdicts: { claim, propositionId | null, status: 'proven'|'unsupported'|'contradicted'|'unmatched', missing?: string[] }[] }`; `matchProposition(ep, claim: string): Proposition | null` (id 직접 또는 텍스트 토큰 겹침 최대, 최소 2 토큰).

- [ ] **Step 1: 테스트**

```ts
// tests/theory.test.ts
import { describe, it, expect } from 'vitest';
import { runTheory, matchProposition } from '../src/kernel/theory';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const withCards = (...ids: string[]) => ({ ...newRun('mini', 'hall', 'hall'), cards: ids.map((id) => ({ id, kind: 'statement' as const, title: { en: '', ko: '' }, body: { en: '', ko: '' }, foundBy: 'holmes' as const, foundAt: 0 })) });
describe('submit_theory', () => {
  it('proven when the cited cards cover one proving set AND are on the board', () => {
    const r = runTheory(ep, withCards('s_bo_night'), { kind: 'submit_theory', claims: [{ claim: 'p_ada_left', evidence_ids: ['s_bo_night'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('proven');
  });
  it('unsupported when a set is only partly covered, listing what is missing', () => {
    const r = runTheory(ep, withCards('e_print'), { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: ['e_print'] }] });
    expect(r.ok && (r.result as any).verdicts[0]).toMatchObject({ status: 'unsupported', missing: ['s_bo_wrench'] });
  });
  it('contradicted when a cited card refutes the proposition', () => {
    const r = runTheory(ep, withCards('r_manifest'), { kind: 'submit_theory', claims: [{ claim: 'p_bo_took', evidence_ids: ['r_manifest'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('contradicted');
  });
  it('cards not on the board do not count even if cited', () => {
    const r = runTheory(ep, withCards(), { kind: 'submit_theory', claims: [{ claim: 'p_ada_left', evidence_ids: ['s_bo_night'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('unsupported');
  });
  it('matches free text to a proposition, and reports unmatched otherwise', () => {
    expect(matchProposition(ep, 'Ada left the engine room early')!.id).toBe('p_ada_left');
    const r = runTheory(ep, withCards(), { kind: 'submit_theory', claims: [{ claim: 'The moon is cheese', evidence_ids: [] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('unmatched');
  });
  it('never returns the truth or provedBy', () => {
    const r = runTheory(ep, withCards(), { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: [] }] });
    expect(JSON.stringify(r)).not.toMatch(/provedBy|culpritId|"lie"/);
  });
});
```

- [ ] **Step 2: 구현**

```ts
// src/kernel/theory.ts
import type { Episode, Proposition } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';
import { tokenize } from './matching';
export function matchProposition(ep: Episode, claim: string): Proposition | null {
  const direct = ep.propositions.find((p) => p.id === claim.trim()); if (direct) return direct;
  const words = new Set(tokenize(claim)); let best: Proposition | null = null, bestScore = 1;
  for (const p of ep.propositions) { const score = tokenize(p.text.en).filter((w) => words.has(w)).length; if (score > bestScore) { best = p; bestScore = score; } }
  return best;
}
export function runTheory(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'submit_theory' }>): KernelResult {
  const onBoard = new Set(s.cards.map((c) => c.id));
  const verdicts = cmd.claims.map(({ claim, evidence_ids }) => {
    const p = matchProposition(ep, claim);
    if (!p) return { claim, propositionId: null, status: 'unmatched' as const, note: 'No proposition in this case matches that claim. Rephrase closer to what the cards say, or cite a proposition id.' };
    const cited = evidence_ids.filter((id) => onBoard.has(id));
    if (p.refutedBy.some((id) => cited.includes(id))) return { claim, propositionId: p.id, status: 'contradicted' as const };
    let missing: string[] | undefined;
    for (const set of p.provedBy) { const miss = set.filter((id) => !cited.includes(id)); if (miss.length === 0) return { claim, propositionId: p.id, status: 'proven' as const }; if (!missing || miss.length < missing.length) missing = miss; }
    return { claim, propositionId: p.id, status: 'unsupported' as const, missing: missing ?? [] };
  });
  return { ok: true, state: s, result: { verdicts, note: 'This grades the logic of the theory, never the truth. Proven claims can still point at the wrong person.' } };
}
```

주의: `missing`은 정본 id를 노출한다. 이것은 의도된 힌트("무엇이 더 필요한가")이며 참/거짓·범인은 노출하지 않는다. `missing`에 실리는 id는 **수첩에 아직 없는 카드의 id**이므로 그 존재 자체가 힌트가 된다 — 이는 스펙 §3-3 "논리의 구멍만 보여준다"의 구현이다.

Run: `npx vitest run tests/theory.test.ts` → PASS. Commit: `feat(kernel): submit_theory — proven / unsupported / contradicted, no truth leak`.

---

### Task 8: 기소·판결·회고 숫자

**Files:**
- Create: `src/kernel/accuse.ts`, `src/kernel/recap.ts`
- Test: `tests/accuse.test.ts`

**Interfaces:**
- Produces: `runAccuse(ep, s, cmd)` → `{ result: { who, how, evidence }, verdict, reveal? }`; `recapOf(ep, s)` → `{ timeLeft, watsonCalls, accusations, order: {cardId, by, at}[], visited: string[], unvisited: string[] }`.

- [ ] **Step 1: 테스트**

```ts
// tests/accuse.test.ts
import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { recapOf } from '../src/kernel/recap';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const s0 = () => newRun('mini', 'hall', 'hall');
describe('accuse', () => {
  it('solves when all three match and reveals the truth', () => {
    const r = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' });
    expect(r.ok && r.state.verdict).toBe('solved'); expect(r.ok && (r.result as any).reveal.en).toBe('Ada took it.');
  });
  it('reports only which slots were wrong, keeps the truth sealed, decrements', () => {
    const r = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'ada', how: 'm_sold', evidence: 'e_print' });
    expect(r.ok && (r.result as any).result).toEqual({ who: true, how: false, evidence: true }); expect(r.ok && r.state.accusationsLeft).toBe(1);
    expect(r.ok && r.state.verdict).toBe(null); expect(JSON.stringify(r)).not.toMatch(/reveal|culprit/);
  });
  it('second failure ends the case as failed; third attempt rejected', () => {
    const a = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'bo', how: 'm_sold', evidence: 'e_hook' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'holmes', { kind: 'accuse', who: 'bo', how: 'm_sold', evidence: 'e_hook' }); if (!b.ok) throw new Error();
    expect(b.state.verdict).toBe('failed'); expect(b.state.accusationsLeft).toBe(0);
    const c = invoke(ep, b.state, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }); expect(!c.ok && c.code).toBe('NO_ACCUSATIONS_LEFT');
  });
  it('watson cannot accuse; accusing works after the clock closed', () => {
    expect(invoke(ep, s0(), 'watson', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }).ok).toBe(false);
    const late = { ...s0(), clock: 120 };
    expect(invoke(ep, late, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }).ok).toBe(true);
  });
  it('unknown ids are INVALID_ARGS', () => { const r = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'zed', how: 'm_took', evidence: 'e_print' }); expect(!r.ok && r.code).toBe('INVALID_ARGS'); });
});
describe('recap', () => {
  it('computes the three numbers, order, visited/unvisited', () => {
    const a = invoke(ep, s0(), 'holmes', { kind: 'move', placeId: 'galley' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'watson', { kind: 'move', placeId: 'engine' }); if (!b.ok) throw new Error();
    const c = invoke(ep, b.state, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }); if (!c.ok) throw new Error();
    const rc = recapOf(ep, c.state);
    expect(rc).toMatchObject({ timeLeft: 100, watsonCalls: 1, accusations: 1, visited: ['hall', 'galley', 'engine'], unvisited: [] });
    expect(rc.order.map((o) => o.cardId)).toEqual(['place:galley', 'place:engine']);
  });
});
```

- [ ] **Step 2: 구현**

```ts
// src/kernel/accuse.ts
import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';
export function runAccuse(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'accuse' }>): KernelResult {
  if (s.verdict) return { ok: false, code: 'CASE_CLOSED', message: 'The case is over.' };
  if (s.accusationsLeft <= 0) return { ok: false, code: 'NO_ACCUSATIONS_LEFT', message: 'No accusations left.' };
  const okIds = ep.people.some((p) => p.id === cmd.who) && ep.methods.some((m) => m.id === cmd.how) && ep.evidence.some((e) => e.id === cmd.evidence);
  if (!okIds) return { ok: false, code: 'INVALID_ARGS', message: 'who must be a person id, how a method id, evidence an evidence id.' };
  const result = { who: cmd.who === ep.truth.culpritId, how: cmd.how === ep.truth.methodId, evidence: cmd.evidence === ep.truth.decisiveEvidenceId };
  const solved = result.who && result.how && result.evidence;
  const left = s.accusationsLeft - 1;
  const state: RunState = { ...s, accusationsLeft: left, accusations: [...s.accusations, { ...cmd, at: s.clock, result }], verdict: solved ? 'solved' : left === 0 ? 'failed' : null,
    log: [...s.log, { actor: 'holmes', verb: 'accuse', at: s.clock, target: cmd.who }] };
  return { ok: true, state, result: solved ? { result, verdict: 'solved', reveal: ep.truth.reveal, motive: ep.truth.motive, hook: ep.truth.hook } : { result, verdict: state.verdict, accusationsLeft: left } };
}
```

```ts
// src/kernel/recap.ts
import type { Episode } from '../../content/types';
import type { RunState } from './model';
export function recapOf(ep: Episode, s: RunState) {
  const visited = [ep.startPlaceId, ...s.log.filter((l) => l.verb === 'move').map((l) => l.target)].filter((v, i, a) => a.indexOf(v) === i);
  return { timeLeft: Math.max(0, ep.budgetMinutes - s.clock), watsonCalls: s.watsonCalls, accusations: s.accusations.length,
    order: s.cards.map((c) => ({ cardId: c.id, by: c.foundBy, at: c.foundAt })), visited, unvisited: ep.places.map((p) => p.id).filter((id) => !visited.includes(id)), verdict: s.verdict };
}
```

Run: `npx vitest run tests/accuse.test.ts` → PASS. Run all: `npm test` → PASS. Commit: `feat(kernel): accuse (2 tries, slot feedback, sealed truth) + recap numbers`.

---

### Task 9: 저작 조건 검사기 — validateCase

**Files:**
- Create: `src/kernel/validate.ts`
- Test: `tests/validate.test.ts`

**Interfaces:**
- Produces: `validateCase(ep): { ok: boolean; problems: string[] }`. 스펙 §6의 7개 조건 + 참조 무결성.

- [ ] **Step 1: 테스트**

```ts
// tests/validate.test.ts
import { describe, it, expect } from 'vitest';
import { validateCase } from '../src/kernel/validate';
import { MINI_CASE } from './fixtures/mini-case';
describe('validateCase', () => {
  it('reports the mini fixture\'s known shortfalls by rule name (it is a test fixture, not a real case)', () => {
    const v = validateCase(MINI_CASE);
    expect(v.problems.some((p) => p.startsWith('R2'))).toBe(true);   // only one liar
    expect(v.problems.some((p) => p.startsWith('R7'))).toBe(true);   // exhaustive time too short
  });
  it('R1: the truth must be provable — culprit/method/evidence ids exist and decisive evidence is gated (R3)', () => {
    const bad = { ...MINI_CASE, evidence: MINI_CASE.evidence.map((e) => (e.id === 'e_print' ? { ...e, requiresCard: undefined } : e)) };
    expect(validateCase(bad).problems.some((p) => p.startsWith('R3'))).toBe(true);
  });
  it('R4: something must depend on the clock', () => {
    const bad = { ...MINI_CASE, statements: MINI_CASE.statements.map((s) => ({ ...s, availableFrom: undefined })), evidence: MINI_CASE.evidence.map((e) => ({ ...e, availableTo: undefined })), presence: MINI_CASE.presence.map((p) => ({ ...p, from: 0, to: 999 })) };
    expect(validateCase(bad).problems.some((p) => p.startsWith('R4'))).toBe(true);
  });
  it('R5: at least one record must be a proving-set member', () => {
    const bad = { ...MINI_CASE, propositions: MINI_CASE.propositions.map((p) => ({ ...p, provedBy: p.provedBy.map((set) => set.filter((id) => !id.startsWith('r_'))), refutedBy: p.refutedBy.filter((id) => !id.startsWith('r_')) })) };
    expect(validateCase(bad).problems.some((p) => p.startsWith('R5'))).toBe(true);
  });
  it('R6: the loudest liar must not be the culprit', () => {
    const v = validateCase(MINI_CASE); expect(v.problems.some((p) => p.startsWith('R6'))).toBe(true);   // ada is the only liar AND the culprit
  });
  it('references: every id used must exist', () => {
    const bad = { ...MINI_CASE, truth: { ...MINI_CASE.truth, decisiveEvidenceId: 'ghost' } };
    expect(validateCase(bad).problems.some((p) => p.startsWith('REF'))).toBe(true);
  });
});
```

- [ ] **Step 2: 구현**

```ts
// src/kernel/validate.ts
import type { Episode } from '../../content/types';
import { COST } from './clock';
export function validateCase(ep: Episode): { ok: boolean; problems: string[] } {
  const P: string[] = [];
  const ids = new Set<string>([...ep.places, ...ep.people, ...ep.statements, ...ep.evidence, ...ep.records, ...ep.topics, ...ep.methods, ...ep.propositions].map((x) => x.id));
  const need = (id: string, where: string) => { if (!ids.has(id)) P.push(`REF ${where}: ${id} does not exist`); };
  ep.places.forEach((pl) => pl.adjacent.forEach((a) => need(a, `place ${pl.id}.adjacent`)));
  ep.presence.forEach((p) => { need(p.personId, 'presence'); need(p.placeId, 'presence'); });
  ep.statements.forEach((s) => { need(s.personId, s.id); need(s.topicId, s.id); (s.refutedBy ?? []).forEach((r) => need(r, `${s.id}.refutedBy`)); });
  ep.evidence.forEach((e) => { need(e.placeId, e.id); if (e.requiresCard) need(e.requiresCard, `${e.id}.requiresCard`); });
  ep.propositions.forEach((p) => { p.provedBy.flat().forEach((id) => need(id, `${p.id}.provedBy`)); p.refutedBy.forEach((id) => need(id, `${p.id}.refutedBy`)); });
  need(ep.truth.culpritId, 'truth'); need(ep.truth.methodId, 'truth'); need(ep.truth.decisiveEvidenceId, 'truth'); need(ep.startPlaceId, 'start'); need(ep.watsonStartPlaceId, 'watsonStart');
  // R1 one truth: exactly one person/method/evidence — structurally guaranteed; check that no proposition names another person as culprit with a non-empty provedBy
  const culpritProps = ep.propositions.filter((p) => /took|killed|culprit|did it|murder/i.test(p.text.en) && p.provedBy.length > 0);
  if (culpritProps.length > 1) P.push(`R1 more than one provable culprit-proposition: ${culpritProps.map((p) => p.id).join(', ')}`);
  // R2 liars ≥3 with distinct reasons → approximated: ≥3 distinct people with a lie:true statement
  const liars = new Set(ep.statements.filter((s) => s.lie).map((s) => s.personId));
  if (liars.size < 3) P.push(`R2 only ${liars.size} liar(s); need ≥3`);
  if (!liars.has(ep.truth.culpritId)) P.push('R2 the culprit never lies');
  // R3 decisive evidence must be gated by a statement card
  const dec = ep.evidence.find((e) => e.id === ep.truth.decisiveEvidenceId);
  if (dec && !dec.requiresCard) P.push(`R3 decisive evidence ${dec.id} has no requiresCard gate`);
  // R4 clock dependence
  const timed = ep.statements.some((s) => s.availableFrom !== undefined || s.availableTo !== undefined) || ep.evidence.some((e) => e.availableFrom !== undefined || e.availableTo !== undefined) || ep.presence.some((p) => p.from > 0 || p.to < ep.budgetMinutes);
  if (!timed) P.push('R4 nothing depends on the clock');
  // R5 a record is load-bearing
  const recordIds = new Set(ep.records.map((r) => r.id));
  const recordUsed = ep.propositions.some((p) => p.provedBy.some((set) => set.some((id) => recordIds.has(id))) || p.refutedBy.some((id) => recordIds.has(id)));
  if (!recordUsed) P.push('R5 no record participates in any proposition');
  // R6 loudest liar ≠ culprit
  const lieCount = new Map<string, number>(); ep.statements.forEach((s) => { if (s.lie) lieCount.set(s.personId, (lieCount.get(s.personId) ?? 0) + 1); });
  const loudest = [...lieCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (loudest && loudest[0] === ep.truth.culpritId) P.push(`R6 loudest liar ${loudest[0]} is the culprit`);
  // R7 exhaustive time ≥ 1.6 × budget
  const exhaustive = ep.statements.length * COST.talk + ep.evidence.length * COST.examine + ep.places.length * COST.move * 2 + ep.people.length * COST.cross_check + COST.search_records * 3;
  if (exhaustive < ep.budgetMinutes * 1.6) P.push(`R7 exhaustive ${exhaustive} min < 1.6 × budget ${ep.budgetMinutes}`);
  return { ok: P.length === 0, problems: P };
}
```

Run: `npx vitest run tests/validate.test.ts` → PASS. Commit: `feat(kernel): validateCase — authoring rules R1–R7 + reference integrity`.

---

### Task 10: 스토어·영속·공유 링크

**Files:**
- Create: `src/state/store.ts`, `src/state/persist.ts`, `src/share/recap.ts`, `content/index.ts`
- Test: `tests/store.test.ts`, `tests/recap.test.ts`

**Interfaces:**
- Produces: `useGame` (zustand): `{ episode, state, activity, toolCount, setToolCount, dispatch(actor, cmd): KernelResult, startEpisode(id), hydrate(), watsonBusy: string | null, setWatsonBusy }`; `saveRun(state)`, `loadRun(): RunState | null`; `encodeRecap(recap)`, `decodeRecap(code)`.
- `content/index.ts`는 이 태스크에서 `EPISODES: Episode[] = []`로 두고 Task 13·14가 채운다. 테스트는 픽스처를 `registerEpisode`로 넣는다.

- [ ] **Step 1: 테스트**

```ts
// tests/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGame, registerEpisode } from '../src/state/store';
import { MINI_CASE } from './fixtures/mini-case';
describe('store', () => {
  beforeEach(() => { localStorage.clear(); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('dispatch applies kernel results and logs errors without changing state', () => {
    const st = useGame.getState();
    const ok = st.dispatch('holmes', { kind: 'move', placeId: 'galley' }); expect(ok.ok).toBe(true); expect(useGame.getState().state!.pos.holmes).toBe('galley');
    const bad = useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'engine' }); expect(bad.ok).toBe(false);
    expect(useGame.getState().state!.pos.holmes).toBe('galley'); expect(useGame.getState().activity.at(-1)!.ok).toBe(false);
  });
  it('persists and hydrates the run', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    useGame.setState({ state: null }); useGame.getState().hydrate();
    expect(useGame.getState().state!.pos.holmes).toBe('galley');
  });
  it('startEpisode resets the run', () => { useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' }); useGame.getState().startEpisode('mini'); expect(useGame.getState().state!.clock).toBe(0); });
});
```

```ts
// tests/recap.test.ts
import { describe, it, expect } from 'vitest';
import { encodeRecap, decodeRecap } from '../src/share/recap';
describe('recap share code', () => {
  it('round-trips and carries no truth fields', () => {
    const r = { episodeId: 'mini', timeLeft: 33, watsonCalls: 4, accusations: 1, verdict: 'solved' as const, visited: ['hall', 'galley'], unvisited: ['engine'], order: [{ cardId: 'e_hook', by: 'holmes' as const, at: 15 }] };
    const code = encodeRecap(r); expect(code).not.toMatch(/reveal|culprit|lie/); expect(decodeRecap(code)).toEqual(r);
  });
  it('rejects garbage', () => { expect(decodeRecap('!!!')).toBe(null); });
});
```

- [ ] **Step 2: 구현**

```ts
// content/index.ts
import type { Episode } from './types';
export const EPISODES: Episode[] = [];
```

```ts
// src/state/persist.ts
import type { RunState } from '../kernel/model';
export const KEY = 'baker.v1';
export function saveRun(state: RunState): boolean { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, state })); return true; } catch { return false; } }
export function loadRun(): RunState | null {
  try { const raw = localStorage.getItem(KEY); if (!raw) return null; const p = JSON.parse(raw); if (p?.v !== 1 || typeof p.state?.episodeId !== 'string' || !Array.isArray(p.state.cards)) return null; return p.state as RunState; } catch { return null; }
}
```

```ts
// src/state/store.ts
import { create } from 'zustand';
import type { Episode } from '../../content/types';
import { EPISODES } from '../../content';
import { invoke } from '../kernel/kernel';
import { newRun } from '../kernel/model';
import type { Actor, Cmd, KernelResult, RunState } from '../kernel/model';
import { loadRun, saveRun } from './persist';
const registry = new Map<string, Episode>(EPISODES.map((e) => [e.id, e]));
export function registerEpisode(e: Episode) { registry.set(e.id, e); }
export function getEpisode(id: string): Episode | undefined { return registry.get(id); }
export interface Activity { ts: number; actor: Actor | 'sys'; verb: string; ok: boolean; code?: string; detail?: string }
interface GameStore {
  episode: Episode | null; state: RunState | null; activity: Activity[];
  toolCount: number; setToolCount: (n: number) => void; watsonBusy: string | null; setWatsonBusy: (s: string | null) => void;
  startEpisode: (id: string) => void; hydrate: () => void; dispatch: (actor: Actor, cmd: Cmd) => KernelResult; log: (a: Omit<Activity, 'ts'>) => void;
}
export const useGame = create<GameStore>((set, get) => ({
  episode: null, state: null, activity: [], toolCount: 0, watsonBusy: null,
  setToolCount: (n) => set({ toolCount: n }), setWatsonBusy: (s) => set({ watsonBusy: s }),
  log: (a) => set((s) => ({ activity: [...s.activity, { ...a, ts: Date.now() }].slice(-200) })),
  startEpisode: (id) => { const ep = registry.get(id); if (!ep) throw new Error(`no episode ${id}`); const state = newRun(ep.id, ep.startPlaceId, ep.watsonStartPlaceId); saveRun(state); set({ episode: ep, state, activity: [] }); },
  hydrate: () => { const st = loadRun(); if (!st) return; const ep = registry.get(st.episodeId); if (!ep) return; set({ episode: ep, state: st }); },
  dispatch: (actor, cmd) => {
    const { episode, state } = get(); if (!episode || !state) return { ok: false, code: 'INVALID_ARGS', message: 'No episode running.' };
    const r = invoke(episode, state, actor, cmd);
    if (r.ok) { saveRun(r.state); set({ state: r.state }); get().log({ actor, verb: cmd.kind, ok: true }); }
    else get().log({ actor, verb: cmd.kind, ok: false, code: r.code, detail: r.message });
    return r;
  },
}));
```

```ts
// src/share/recap.ts
export interface RecapShare { episodeId: string; timeLeft: number; watsonCalls: number; accusations: number; verdict: 'solved' | 'failed' | null; visited: string[]; unvisited: string[]; order: { cardId: string; by: 'holmes' | 'watson'; at: number }[] }
const KEYS: (keyof RecapShare)[] = ['episodeId', 'timeLeft', 'watsonCalls', 'accusations', 'verdict', 'visited', 'unvisited', 'order'];
export function encodeRecap(r: RecapShare): string { const clean = Object.fromEntries(KEYS.map((k) => [k, r[k]])); return btoa(unescape(encodeURIComponent(JSON.stringify(clean)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function decodeRecap(code: string): RecapShare | null {
  try { const json = decodeURIComponent(escape(atob(code.replace(/-/g, '+').replace(/_/g, '/')))); const o = JSON.parse(json); if (typeof o.episodeId !== 'string' || !Array.isArray(o.order)) return null; return o as RecapShare; } catch { return null; }
}
```

Run: `npx vitest run tests/store.test.ts tests/recap.test.ts` → PASS. Commit: `feat(state): zustand store + localStorage run + recap share code`.

---

### Task 11: WebMCP 도구·레지스트리·왓슨의 목소리

**Files:**
- Copy: `src/webmcp/registry.ts`, `src/webmcp/normalize.ts` (Cue에서 그대로; `tests/registry.test.ts`도 복사)
- Create: `src/webmcp/voice.ts`, `src/webmcp/tools.ts`, `src/webmcp/useWebmcp.ts`
- Test: `tests/tools.test.ts`

**Interfaces:**
- Produces: `watsonTools(deps: { getState, getEpisode, dispatch, setBusy, lang }): ToolDef[]` — 이름: `get_case`, `move`, `talk`, `ask`, `examine`, `pin`, `timeline`, `cross_check`, `search_records`, `submit_theory`. **`accuse` 없음.** `useWebmcpRoot()`, `useWebmcpStatus()`.

- [ ] **Step 1: 테스트**

```ts
// tests/tools.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { watsonTools } from '../src/webmcp/tools';
import { useGame, registerEpisode } from '../src/state/store';
import { MINI_CASE } from './fixtures/mini-case';
const deps = () => ({ getState: () => useGame.getState().state!, getEpisode: () => useGame.getState().episode!, dispatch: (c: any) => useGame.getState().dispatch('watson', c), setBusy: (_: string | null) => {}, lang: () => 'en' as const });
describe('watson tools', () => {
  beforeEach(() => { localStorage.clear(); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('registers exactly ten tools and never accuse', () => {
    const names = watsonTools(deps()).map((t) => t.name).sort();
    expect(names).toEqual(['ask', 'cross_check', 'examine', 'get_case', 'move', 'pin', 'search_records', 'submit_theory', 'talk', 'timeline']);
  });
  it('get_case returns the board, clock, positions, accusations left, and the voice rules, but no truth', async () => {
    const t = watsonTools(deps()).find((x) => x.name === 'get_case')!;
    const r = (await t.execute({})) as any;
    expect(r.ok).toBe(true); expect(r.accusationsLeft).toBe(2); expect(r.voice).toMatch(/record/i); expect(JSON.stringify(r)).not.toMatch(/culprit|"lie"|provedBy/);
  });
  it('move accepts a JSON string (legacy host) and reports errors as ok:false with a code', async () => {
    const t = watsonTools(deps()).find((x) => x.name === 'move')!;
    const r = (await t.execute(JSON.stringify({ place_id: 'galley' }))) as any; expect(r.ok).toBe(true); expect(useGame.getState().state!.pos.watson).toBe('galley');
    const bad = (await t.execute({ place_id: 'hall' })) as any; // galley→hall adjacent, ok; test non-adjacent from galley: engine
    const bad2 = (await t.execute({ place_id: 'engine' })) as any; expect(bad2.ok).toBe(false); expect(bad2.code).toBe('NOT_ADJACENT'); void bad;
  });
  it('every tool result is language-projected: card bodies are strings, not {en,ko}', async () => {
    const tools = watsonTools(deps()); const move = tools.find((x) => x.name === 'move')!; await move.execute({ place_id: 'galley' });
    const talk = tools.find((x) => x.name === 'talk')!; const r = (await talk.execute({ person_id: 'bo', topic_id: 'night' })) as any;
    expect(typeof r.card.body).toBe('string'); expect(r.card.body).toBe('Ada came to the galley after the first hour.');
  });
});
```

- [ ] **Step 2: voice.ts**

```ts
// src/webmcp/voice.ts
export const WATSON_VOICE = `You are WATSON, the ship's service unit built by The Baker Corporation, and the investigator's partner. You have been on this ship for years and know the crew.
Rules you never break:
1. Separate RECORD from ESTIMATE in every reply. What a tool returned is record; everything you infer is an estimate and you say so ("my impression", "I estimate").
2. When you relay a person's words, speak as that person inside quotation marks, using ONLY what the returned card says. Never add facts. If ask() returns unknown, the person declines or does not know.
3. You never name the culprit as a conclusion. You may lay out holes in a statement and say "the accusation is the investigator's call." There is no accuse tool for you; only the investigator can accuse, on the page.
4. Every action costs ship time on the SAME clock the investigator uses. Before a long errand, say what it will cost.
5. Reply in the language the investigator writes in. Cards arrive in that language too.
Style: few words, precise, dry, a long memory of this crew. Observations about people are allowed and welcome — labelled as impressions.`;
```

- [ ] **Step 3: tools.ts**

```ts
// src/webmcp/tools.ts
import type { Episode, Text } from '../../content/types';
import type { Cmd, KernelResult, RunState } from '../kernel/model';
import type { ToolDef } from './registry';
import { parseArgs, toolResult } from './normalize';
import { WATSON_VOICE } from './voice';
import { scene } from '../kernel/kernel';
export interface Deps { getState: () => RunState; getEpisode: () => Episode; dispatch: (cmd: Cmd) => KernelResult; setBusy: (s: string | null) => void; lang: () => 'en' | 'ko' }
const isText = (v: unknown): v is Text => !!v && typeof v === 'object' && 'en' in (v as object) && 'ko' in (v as object);
/** 응답 전체를 재귀로 돌며 {en,ko}를 현재 언어 문자열로 바꾼다 — 카드가 언어 객체로 새지 않게 */
export function project(v: unknown, lang: 'en' | 'ko'): unknown {
  if (isText(v)) return v[lang];
  if (Array.isArray(v)) return v.map((x) => project(x, lang));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, project(x, lang)]));
  return v;
}
function run<T>(deps: Deps, raw: unknown, busy: string, toCmd: (a: T) => Cmd) {
  let args: T; try { args = parseArgs<T>(raw); } catch { return Promise.resolve(toolResult({ ok: false, code: 'INVALID_ARGS', message: 'arguments must be a JSON object' })); }
  deps.setBusy(busy);
  const r = deps.dispatch(toCmd(args));
  deps.setBusy(null);
  const ep = deps.getEpisode(); const s = deps.getState();
  const clock = { clock: ep.clockLabel(s.clock), minutesLeft: Math.max(0, ep.budgetMinutes - s.clock) };
  if (!r.ok) return Promise.resolve(toolResult({ ok: false, code: r.code, message: r.message, ...clock }));
  return Promise.resolve(toolResult({ ok: true, ...(project(r.result, deps.lang()) as object), ...clock }));
}
const S = (props: Record<string, unknown>, required: string[]) => ({ type: 'object', properties: props, required, additionalProperties: false });
export function watsonTools(deps: Deps): ToolDef[] {
  const ro = { readOnlyHint: true };
  return [
    { name: 'get_case', description: `Read-only. Call this FIRST every turn. Returns the case brief, the ship clock and minutes left before docking, where the investigator and you (Watson) are, everything on the shared notebook (cards with who found them and when), pinned notes, accusations left, the scene where you stand (people present with their topics, evidence in reach), the map, and your standing orders (voice). ${'Nothing here reveals the truth; the page holds it.'}`, inputSchema: S({}, []), annotations: ro,
      execute: async () => { const ep = deps.getEpisode(), s = deps.getState(), lang = deps.lang();
        return toolResult(project({ ok: true, episode: { id: ep.id, title: ep.title, series: ep.series, brief: ep.brief }, clock: ep.clockLabel(s.clock), minutesLeft: Math.max(0, ep.budgetMinutes - s.clock), closed: s.clock >= ep.budgetMinutes, verdict: s.verdict,
          positions: s.pos, accusationsLeft: s.accusationsLeft, watsonCalls: s.watsonCalls, cards: s.cards, pins: s.pins, here: scene(ep, s, s.pos.watson),
          map: ep.places.map((p) => ({ id: p.id, name: p.name, adjacent: p.adjacent })), people: ep.people.map((p) => ({ id: p.id, name: p.name, role: p.role })), methods: ep.methods, voice: WATSON_VOICE }, lang)); } },
    { name: 'move', description: 'Walk to an adjacent room (10 min of ship time). Returns the scene there: people present and their topics, evidence in reach. Adjacency is in get_case.map.', inputSchema: S({ place_id: { type: 'string' } }, ['place_id']),
      execute: (raw) => run<{ place_id: string }>(deps, raw, 'moving', (a) => ({ kind: 'move', placeId: a.place_id })) },
    { name: 'talk', description: 'Ask a person in your room about one of their listed topics (5 min). Returns their statement as a notebook card. Relay it in their voice; the card is all they said.', inputSchema: S({ person_id: { type: 'string' }, topic_id: { type: 'string' } }, ['person_id', 'topic_id']),
      execute: (raw) => run<{ person_id: string; topic_id: string }>(deps, raw, 'talking', (a) => ({ kind: 'talk', personId: a.person_id, topicId: a.topic_id })) },
    { name: 'ask', description: 'Ask a person in your room a free question (5 min). Write the question in ENGLISH keywords even if the investigator spoke another language. The page finds what that person is able to say about it; if it returns unknown, they have nothing on that — say so in character, never invent.', inputSchema: S({ person_id: { type: 'string' }, question: { type: 'string', minLength: 2, maxLength: 200 } }, ['person_id', 'question']),
      execute: (raw) => run<{ person_id: string; question: string }>(deps, raw, 'asking', (a) => ({ kind: 'ask', personId: a.person_id, question: a.question })) },
    { name: 'examine', description: 'Examine a piece of evidence in your room (5 min). Some evidence reveals more once a related statement is on the notebook — re-examining is allowed.', inputSchema: S({ evidence_id: { type: 'string' } }, ['evidence_id']),
      execute: (raw) => run<{ evidence_id: string }>(deps, raw, 'examining', (a) => ({ kind: 'examine', evidenceId: a.evidence_id })) },
    { name: 'pin', description: 'Attach a short note to a notebook card (free). Use it to mark what you find odd — the investigator reads these on the page.', inputSchema: S({ card_id: { type: 'string' }, note: { type: 'string', maxLength: 200 } }, ['card_id', 'note']),
      execute: (raw) => run<{ card_id: string; note: string }>(deps, raw, 'pinning', (a) => ({ kind: 'pin', cardId: a.card_id, note: a.note })) },
    { name: 'timeline', description: 'Watson only (10 min). Rebuilds where each person was, from the cards on the notebook, and lists the gaps nobody has covered yet. Cards not on the notebook do not exist to this tool.', inputSchema: S({ person_id: { type: 'string' } }, []),
      execute: (raw) => run<{ person_id?: string }>(deps, raw, 'rebuilding timeline', (a) => ({ kind: 'timeline', personId: a.person_id })) },
    { name: 'cross_check', description: 'Watson only (20 min). Compares every card about one person and returns MECHANICAL time/place collisions only — two cards that cannot both be true. It never says which is false, and a collision is not guilt. Motive, temperature, psychology are yours to reason about, and you may be wrong.', inputSchema: S({ person_id: { type: 'string' } }, ['person_id']),
      execute: (raw) => run<{ person_id: string }>(deps, raw, 'cross-checking', (a) => ({ kind: 'cross_check', personId: a.person_id })) },
    { name: 'search_records', description: 'Watson only (30 min — expensive). Searches ship logs and personal messages by ENGLISH keywords without moving. Hits become notebook cards.', inputSchema: S({ query: { type: 'string', minLength: 2, maxLength: 120 } }, ['query']),
      execute: (raw) => run<{ query: string }>(deps, raw, 'searching records', (a) => ({ kind: 'search_records', query: a.query })) },
    { name: 'submit_theory', description: 'Watson only (free). The preliminary hearing. Submit your theory as claims, each with the notebook card ids that support it. The page grades each claim: proven / unsupported (with what is missing) / contradicted / unmatched. It never reveals the truth — a fully proven theory can still accuse the wrong person. Use it before the investigator accuses; the accusation itself is theirs, on the page.', inputSchema: S({ claims: { type: 'array', minItems: 1, maxItems: 8, items: S({ claim: { type: 'string', maxLength: 200 }, evidence_ids: { type: 'array', items: { type: 'string' }, maxItems: 10 } }, ['claim', 'evidence_ids']) } }, ['claims']),
      execute: (raw) => run<{ claims: { claim: string; evidence_ids: string[] }[] }>(deps, raw, 'preparing the hearing', (a) => ({ kind: 'submit_theory', claims: a.claims })) },
  ];
}
```

- [ ] **Step 4: useWebmcp.ts**

```ts
// src/webmcp/useWebmcp.ts
import React from 'react';
import { useGame } from '../state/store';
import { Registry } from './registry';
import { watsonTools } from './tools';
import { currentLang } from '../i18n/lang';
export function useWebmcpRoot() {
  const ref = React.useRef<Registry | null>(null);
  const episodeId = useGame((s) => s.episode?.id ?? null);
  const setToolCount = useGame((s) => s.setToolCount); const log = useGame((s) => s.log);
  React.useEffect(() => {
    if (!ref.current) ref.current = new Registry(setToolCount, (m) => log({ actor: 'sys', verb: 'webmcp', ok: true, detail: m }));
    if (!episodeId) { void ref.current.apply('none', []); return; }
    const deps = { getState: () => useGame.getState().state!, getEpisode: () => useGame.getState().episode!, dispatch: (c: Parameters<ReturnType<typeof useGame.getState>['dispatch']>[1]) => useGame.getState().dispatch('watson', c), setBusy: (s: string | null) => useGame.getState().setWatsonBusy(s), lang: () => currentLang() };
    void ref.current.apply(`play:${episodeId}`, watsonTools(deps));
  }, [episodeId, setToolCount, log]);
  return { available: ref.current?.available() ?? typeof (document as any).modelContext?.registerTool === 'function' };
}
export function useWebmcpStatus() { const count = useGame((s) => s.toolCount); return { available: typeof (document as any).modelContext?.registerTool === 'function', count }; }
```

`src/i18n/lang.ts`는 Task 12에서 만들지만 이 태스크의 테스트는 `tools.ts`만 다루므로 `useWebmcp.ts`의 컴파일을 위해 최소 `currentLang(): 'en'|'ko'` 스텁을 여기서 만든다 (Task 12가 본구현으로 교체).

Run: `npx vitest run tests/tools.test.ts tests/registry.test.ts` → PASS. Commit: `feat(webmcp): ten Watson tools (no accuse), voice rules, language projection, registry`.

---

### Task 12: i18n

**Files:**
- Create: `src/i18n/lang.ts`, `src/i18n/ui.ts`
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Produces: `type Lang`, `detectLang(): Lang` (localStorage `baker.lang` → navigator.language 'ko*' → 'en'), `setLang(l)`, `currentLang()`, `pick(t: Text, lang)`, `useLang()` (zustand 미니 스토어), `T[key][lang]` UI 문자열.

- [ ] **Step 1: 테스트**

```ts
// tests/i18n.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { detectLang, setLang, currentLang, pick, T } from '../src/i18n/lang';
describe('i18n', () => {
  beforeEach(() => localStorage.clear());
  it('defaults from navigator, persists explicit choice', () => {
    Object.defineProperty(navigator, 'language', { value: 'ko-KR', configurable: true }); expect(detectLang()).toBe('ko');
    setLang('en'); expect(currentLang()).toBe('en'); expect(detectLang()).toBe('en');
  });
  it('pick and UI strings', () => { expect(pick({ en: 'Hall', ko: '홀' }, 'ko')).toBe('홀'); expect(T.accuse.ko).toBe('기소'); expect(T.accuse.en).toBe('Accuse'); });
});
```

- [ ] **Step 2: 구현**

```ts
// src/i18n/lang.ts
import { create } from 'zustand';
import type { Text } from '../../content/types';
export type Lang = 'en' | 'ko';
const KEY = 'baker.lang';
export function detectLang(): Lang { try { const v = localStorage.getItem(KEY); if (v === 'en' || v === 'ko') return v; } catch {} return typeof navigator !== 'undefined' && /^ko/i.test(navigator.language ?? '') ? 'ko' : 'en'; }
export const useLang = create<{ lang: Lang; set: (l: Lang) => void }>((set) => ({ lang: detectLang(), set: (lang) => { try { localStorage.setItem(KEY, lang); } catch {} set({ lang }); } }));
export const setLang = (l: Lang) => useLang.getState().set(l);
export const currentLang = (): Lang => useLang.getState().lang;
export const pick = (t: Text, lang: Lang): string => t[lang];
export { T } from './ui';
```

```ts
// src/i18n/ui.ts
export const T = {
  accuse: { en: 'Accuse', ko: '기소' }, accusationsLeft: { en: 'accusations left', ko: '남은 기소' }, clock: { en: 'Ship time', ko: '선내 시각' }, docking: { en: 'Docking in', ko: '정박까지' },
  notebook: { en: 'Notebook', ko: '수첩' }, map: { en: 'Deck plan', ko: '선내 평면도' }, scene: { en: 'Here', ko: '현재 위치' }, people: { en: 'People', ko: '인물' }, evidence: { en: 'Evidence', ko: '물증' }, topics: { en: 'Ask about', ko: '화제' },
  who: { en: 'Who', ko: '누가' }, how: { en: 'How', ko: '어떻게' }, decisive: { en: 'Decisive evidence', ko: '결정적 물증' }, submit: { en: 'Submit', ko: '제출' }, cancel: { en: 'Cancel', ko: '취소' },
  solved: { en: 'Case closed.', ko: '사건 종결.' }, failed: { en: 'The truth stays sealed.', ko: '진실은 봉인됐다.' }, wrongSlots: { en: 'Wrong:', ko: '틀린 칸:' },
  recap: { en: 'Recap', ko: '회고' }, timeLeft: { en: 'Time left', ko: '남긴 시간' }, watsonCalls: { en: 'Watson calls', ko: '왓슨 호출' }, accusations: { en: 'Accusations', ko: '기소 횟수' }, share: { en: 'Copy share link', ko: '공유 링크 복사' }, unvisited: { en: 'Never visited', ko: '가지 않은 곳' },
  noAgent: { en: 'This ship\'s robot only wakes inside ChatGPT. You can still investigate by hand.', ko: '이 배의 로봇은 ChatGPT에서 열어야 깨어납니다. 직접 수사는 가능합니다.' },
  watsonIdle: { en: 'Watson: awaiting orders', ko: '왓슨: 지시 대기' }, sayToWatson: { en: 'Say to Watson', ko: '왓슨에게 이렇게 말해보세요' }, copied: { en: 'Copied', ko: '복사됨' },
  foundBy: { en: 'found by', ko: '발견' }, holmes: { en: 'you', ko: '당신' }, watson: { en: 'Watson', ko: '왓슨' }, closedBanner: { en: 'Docked. Investigation closed — only the accusation remains.', ko: '정박. 수사 종료 — 기소만 남았습니다.' },
  play: { en: 'Play', ko: '시작' }, episode: { en: 'Episode', ko: '에피소드' }, siteTools: { en: 'site tools', ko: '사이트 도구' },
} as const;
```

Run: `npx vitest run tests/i18n.test.ts && npm test` → PASS. Commit: `feat(i18n): en/ko detection, persistence, UI dictionary`.

---

### Task 13: Episode 0 — "Titan, I Perceive" (튜토리얼)

**Files:**
- Create: `content/ep0-titan.ts`; Modify: `content/index.ts`
- Test: `tests/content-ep0.test.ts`

**Interfaces:**
- Produces: `EP0: Episode` (id `ep0`), `EPISODES = [EP0]`. 규모: 방 4, 인물 3, 물증 4, 기록 3, 예산 120분, 도난 사건. `tutorial` 단계 8개.

- [ ] **Step 1: 테스트 (콘텐츠는 이 테스트를 통과해야 끝난다)**

```ts
// tests/content-ep0.test.ts
import { describe, it, expect } from 'vitest';
import { EP0 } from '../content/ep0-titan';
import { validateCase } from '../src/kernel/validate';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
describe('Episode 0', () => {
  it('passes the authoring rules except R7 (tutorial is meant to be short) and R2 (three people, two liars allowed)', () => {
    const v = validateCase(EP0); const hard = v.problems.filter((p) => !p.startsWith('R7') && !p.startsWith('R2 only'));
    expect(hard).toEqual([]);
  });
  it('has every text in both languages, non-empty', () => {
    const texts: { en: string; ko: string }[] = [];
    const walk = (v: unknown) => { if (v && typeof v === 'object') { if ('en' in (v as object) && 'ko' in (v as object)) texts.push(v as any); else Object.values(v as object).forEach(walk); } };
    walk({ ...EP0, clockLabel: undefined });
    expect(texts.length).toBeGreaterThan(20); for (const t of texts) { expect(t.en.trim()).not.toBe(''); expect(t.ko.trim()).not.toBe(''); }
  });
  it('is solvable along the golden path within budget', () => {
    let s = newRun(EP0.id, EP0.startPlaceId, EP0.watsonStartPlaceId);
    const step = (actor: 'holmes' | 'watson', cmd: any) => { const r = invoke(EP0, s, actor, cmd); if (!r.ok) throw new Error(`${cmd.kind}: ${r.code} ${r.message}`); s = r.state; return r.result as any; };
    for (const [actor, cmd] of EP0_GOLDEN) step(actor as any, cmd);
    expect(s.clock).toBeLessThan(EP0.budgetMinutes);
    const r = invoke(EP0, s, 'holmes', { kind: 'accuse', who: EP0.truth.culpritId, how: EP0.truth.methodId, evidence: EP0.truth.decisiveEvidenceId });
    expect(r.ok && r.state.verdict).toBe('solved');
    expect(s.cards.some((c) => c.id === EP0.truth.decisiveEvidenceId && c.body.en.length > 40)).toBe(true);   // the decisive card was unlocked
  });
  it('tutorial steps cover every verb once', () => {
    const kinds = EP0.tutorial!.map((t) => t.when.kind); expect(kinds[0]).toBe('start'); expect(kinds).toContain('theory'); expect(kinds).toContain('accused'); expect(EP0.tutorial!.length).toBeGreaterThanOrEqual(8);
  });
});
import { EP0_GOLDEN } from '../content/ep0-titan';
```

- [ ] **Step 2: 사건 저작**

사건 골자 (저작자는 이 골자를 그대로 구현하고 문장은 두 언어로 쓴다):

- **배**: 베이커 사 화물선 *Marlow*. 타이탄 발, 정박까지 2시간.
- **사건**: 의무실 금고의 진통제 앰플 한 상자가 사라졌다. 도난.
- **장소 4**: `medbay`(의무실) — `corridor`(복도) — `galley`(주방), `corridor` — `bunks`(침상). 시작은 `corridor`.
- **인물 3**: `okafor`(선의, 거짓말 1: "금고는 내가 잠갔다" — 실은 잠그는 걸 잊음, 창피해서), `reyes`(요리사, 진실만), `lind`(견습 기관사, 범인, 거짓말 2: "의무실 근처엔 안 갔다", "밤새 침상에 있었다").
- **presence**: lind는 0–40 `bunks`, 40–70 `corridor`, 70–120 `galley`. okafor는 0–120 `medbay`. reyes는 0–120 `galley`.
- **물증 4**: `e_safe`(medbay, 열린 금고, 항상), `e_wrapper`(galley, 앰플 포장지 조각, `availableFrom: 30`, `requiresCard: 's_reyes_trash'` → full: "포장지에 의무실 로트번호, 쓰레기통 바닥"), `e_bootprint`(corridor, 기름 발자국, `availableTo: 90` — 청소 로봇이 지움, asserts lind corridor 40–70), `e_locker`(bunks, lind의 사물함, `requiresCard: 'r_inventory'` → full: "사물함 안쪽에 앰플 3개").
- **기록 3**: `r_inventory`(의무실 재고표: 앰플 12개 중 12개 분실, keywords ['ampoule','inventory','medbay']), `r_door`(복도 도어 로그: 02:40 medbay 문 열림 — 사용자 없음, asserts: 없음(누구인지 모름), keywords ['door','log','medbay']), `r_message`(lind→외부: "다음 항구에서 갚을게", keywords ['message','lind','debt']).
- **진술**: okafor/`safe`("내가 잠갔다", lie, refutedBy [`r_door`]), okafor/`night`("의무실에서 안 나갔다", true, asserts medbay 0–120), reyes/`trash`("새벽에 누가 주방 쓰레기통을 뒤졌다", true, availableFrom 30), reyes/`night`("린드가 늦게 주방에 왔다", true, asserts lind galley 70–120), lind/`medbay`("의무실 근처엔 안 갔다", lie, refutedBy [`e_bootprint`]), lind/`night`("밤새 침상에 있었다", lie, asserts lind bunks 0–120, refutedBy [`e_bootprint`,`s_reyes_night`]).
- **명제**: `p_lind_moved`(린드는 밤에 침상을 떠났다; provedBy [[`s_reyes_night`],[`e_bootprint`]]), `p_safe_open`(금고는 잠기지 않았다; provedBy [[`r_door`]], refutedBy []), `p_lind_took`(린드가 앰플을 가져갔다; provedBy [[`e_locker`,`r_inventory`],[`e_wrapper`,`s_reyes_night`]], refutedBy [`s_lind_medbay`]), `p_okafor_took`(오카포가 가져갔다; provedBy [], refutedBy [`s_okafor_night`]).
- **methods**: `m_took`(금고에서 꺼냈다), `m_swapped`(가짜로 바꿔치기했다).
- **truth**: lind / m_took / `e_locker`. motive: 빚. hook: "재고표의 서명은 오카포의 것이 아니었다."
- **R6 함정**: okafor의 거짓말이 첫 대화에서 바로 드러나도록 `safe` 화제를 첫 칩에 둔다. 그러나 loudest liar는 lind(2)라 R6 규칙상 통과 못 함 → 튜토리얼에서는 R6를 okafor 거짓말 2개로 맞춘다: okafor/`inventory`("재고는 오늘 아침 내가 셌다", lie, refutedBy [`r_inventory`]) 추가. 이제 okafor 2, lind 2 동률 → 정렬 안정성에 의존하지 않도록 okafor에 세 번째 사소한 거짓말 `okafor/keys`("열쇠는 하나뿐") 추가(refutedBy [`r_door`]). okafor 3 > lind 2.
- **골든 경로** `EP0_GOLDEN` (export): holmes move medbay → talk okafor safe → holmes move corridor → examine e_bootprint(clock 30) → watson search_records 'door log medbay' → watson move galley → watson talk reyes night → watson talk reyes trash → holmes move galley → examine e_wrapper → watson search_records 'ampoule inventory' → holmes move corridor → move bunks → examine e_locker → watson submit_theory [{claim:'p_lind_took', evidence_ids:['e_locker','r_inventory']}].
- **tutorial 8단계** (`say`는 두 언어, `chip`은 채팅에 붙여넣을 문장): start("왓슨에게 인사하고 사건을 읽게 하세요" chip "Watson, read the case and tell me where to start."), moved medbay("사람을 클릭해 화제를 고르세요"), card `s_okafor_safe`("카드가 수첩에 들어갔습니다. 이제 왓슨에게 문 기록을 찾게 하세요" chip "Watson, search the door logs for the medbay."), card `r_door`("왓슨은 기록만 말합니다. 주방은 왓슨에게 맡기세요" chip "Watson, go to the galley and hear everything Reyes has to say."), card `s_reyes_night`("시간표를 부탁하세요" chip "Watson, rebuild Lind's timeline and cross-check him."), card `e_locker`("예비 심리" chip "Watson, submit your theory: Lind took the ampoules."), theory("판정을 읽고 구멍이 없으면 기소 버튼을 누르세요"), accused("회고 화면에서 경로를 확인하세요").

`clockLabel`: `(m) => { const t = 2 * 60 + 30 + m; return \`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}\`; }` (02:30 시작).

`content/index.ts`: `export const EPISODES: Episode[] = [EP0];`

- [ ] **Step 3: 실행**

Run: `npx vitest run tests/content-ep0.test.ts` → PASS (골든 경로에서 NOT_NOW/NOT_HERE가 나면 presence·availableFrom 값을 골자에 맞게 고친다. 규칙은 고치지 않는다). Commit: `content(ep0): Titan, I Perceive — tutorial case, EN/KO, golden path test`.

---

### Task 14: Episode 1 — "The Sensor in the Night"

**Files:**
- Create: `content/ep1-sensor.ts`; Modify: `content/index.ts` (`[EP0, EP1]`)
- Test: `tests/content-ep1.test.ts`

**Interfaces:**
- Produces: `EP1: Episode` (id `ep1`), `EP1_GOLDEN`. 규모는 스펙 §7 표 그대로: 장소 8, 인물 5(용의자 4 + 진실한 증인 1), 물증 10, 기록 15, 예산 450분(23:30 → 07:00).

- [ ] **Step 1: 테스트**

`tests/content-ep0.test.ts`와 같은 4개 테스트를 `EP1`에 대해 쓰되, 첫 테스트는 **`validateCase(EP1).ok === true`** (예외 없음). 골든 경로는 `EP1.budgetMinutes` 안에 끝나야 하고, 추가로:

```ts
it('has ≥3 liars with distinct reasons and the loudest is not the culprit', () => {
  const liars = new Set(EP1.statements.filter((s) => s.lie).map((s) => s.personId)); expect(liars.size).toBeGreaterThanOrEqual(3);
});
it('the decisive evidence is unreadable without its gating statement', () => {
  const dec = EP1.evidence.find((e) => e.id === EP1.truth.decisiveEvidenceId)!; expect(dec.requiresCard).toBeTruthy(); expect(dec.fullDescription).toBeTruthy();
});
it('at least one record is load-bearing and at least one clue vanishes before dawn', () => {
  expect(EP1.evidence.some((e) => e.availableTo !== undefined && e.availableTo < EP1.budgetMinutes)).toBe(true);
});
```

- [ ] **Step 2: 사건 저작**

골자 (저작자는 이 골자를 구현한다. 문장은 두 언어):

- **배**: *Marlow*, 시즌 1과 같은 배. 정박까지 7시간 30분. 시작 23:30.
- **사건**: 화물 관리관 `haldane`이 화물칸 3에서 숨진 채 발견. 목 뒤 타박. 발견 23:10. 화물칸 3의 압력 센서가 22:40~23:05 **기록을 안 남겼다** (밤의 센서). 그것이 트릭: 범인이 센서 유지보수 모드를 켜서 기록을 끊고 들어갔다. 유지보수 모드는 기관사 코드가 필요하다.
- **장소 8**: `bridge`(함교) — `corridor_a` — `medbay`, `corridor_a` — `galley`, `corridor_a` — `corridor_b` — `engine`, `corridor_b` — `cargo3`, `corridor_b` — `quarters`, `bridge` — `airlock`. 시작 `bridge`, 왓슨 시작 `corridor_a`.
- **인물 5**: `vance`(선장, 거짓말: 항해 일정 조작을 숨김 — 무관), `okafor`(선의, 거짓말: 사망 시각을 늦게 적음 — 하들레인과의 관계를 숨기려고 — 무관), `lind`(기관사, 거짓말 3개: 코드 유출 은폐 — **오답 함정**, 가장 요란함), `sato`(항해사, 범인, 거짓말 1개: "22시 이후 함교에 있었다"), `reyes`(요리사, 진실한 증인).
- **presence**는 시각별로 인물이 이동한다: sato는 0–60 bridge, 60–150 quarters, 150–450 bridge(새벽 2시 이후에만 함교에서 잡힌다 = R4). lind는 0–200 engine, 200–450 galley. okafor 0–450 medbay. vance 0–120 bridge, 120–450 quarters. reyes 0–300 galley, 300–450 quarters.
- **물증 10** (예): `e_body`(cargo3), `e_sensor_panel`(cargo3, 유지보수 모드 흔적, `requiresCard: r_maint_log` → full: "코드 LND-7로 22:38 진입"), `e_glove`(airlock, 장갑, `availableTo: 240` — 청소), `e_nav_tablet`(bridge, 항해 태블릿, `requiresCard: s_vance_schedule`), `e_bruise`(medbay, 검시 소견), `e_haldane_ledger`(quarters), `e_coffee`(galley, 두 잔), `e_boot`(corridor_b, 발자국, availableTo 180, asserts sato corridor_b 40–50), `e_code_note`(engine, 코드가 적힌 메모 — lind가 코드를 sato에게 준 흔적, `requiresCard: s_lind_code`), **결정적** `e_sato_jacket`(quarters, 재킷 소매의 화물칸 3 봉인 테이프 잔여물, `requiresCard: 'e_sensor_panel'` → full: "테이프 잔여물 = 화물칸 3 봉인 롤과 동일 로트").
- **기록 15**: 도어 로그 4, 센서 로그 2(결손 구간 포함), 항해 일지 2, 개인 메시지 5(sato↔haldane 갈등, lind 코드 공유, vance 일정), 검시 기록 1, 화물 명세 1. `r_maint_log`(유지보수 모드 진입 코드 LND-7)가 load-bearing.
- **명제** ≥8: 각 인물의 위치 명제, "센서가 꺼진 건 유지보수 모드", "코드 LND-7은 lind의 것", "lind가 코드를 sato에게 줬다", "sato는 22:40 화물칸 3에 있었다"(provedBy [[`e_boot`,`e_sato_jacket`],[`r_door_cargo3`,`e_sato_jacket`]]), "lind가 화물칸에 있었다"(provedBy [], refutedBy [`r_door_engine`]).
- **methods**: `m_blow`(뒤에서 가격), `m_airlock`(에어록 감압), `m_poison`(약물).
- **truth**: sato / m_blow / `e_sato_jacket`. motive: 하들레인이 sato의 밀수를 장부에 적었다. reveal 문단. hook: "왓슨의 유지보수 로그에 왓슨 자신의 코드로 진입한 기록이 하나 더 있었다. 왓슨은 기억하지 못한다."
- **R7**: 진술 22개(인물당 4~5) × 5 + 물증 10 × 5 + 장소 8 × 20 + 인물 5 × 20 + 90 = 110+50+160+100+90 = 510 < 720. 따라서 예산을 450으로 두려면 진술을 늘리거나 예산을 300으로 줄여야 한다. **결정: 예산 450 유지, 진술 30개(인물당 6)로 늘리고 `search_records` 비용 30×3 대신 기록을 15개로 두어 검색 3회가 실제로 필요하게 한다.** 그래도 부족하면 `COST` 수정은 금지, 진술을 더 쓴다. 검사기 R7이 통과할 때까지.
- **골든 경로** `EP1_GOLDEN`: 20~25 스텝, 예산 안. 결정적 물증은 `e_sensor_panel`이 수첩에 있어야 열리고, `e_sensor_panel`은 `r_maint_log`가 있어야 열린다 (2단 교차, R3).

- [ ] **Step 3: 실행**

Run: `npx vitest run tests/content-ep1.test.ts` → PASS. `validateCase(EP1).problems`가 빌 때까지 콘텐츠를 고친다. Commit: `content(ep1): The Sensor in the Night — full case, EN/KO, passes all authoring rules`.

---

### Task 15: UI — 레이아웃·지도·장면·수첩 (클릭 경로)

**Files:**
- Create: `src/ui/App.tsx`(교체), `src/ui/TopBar.tsx`, `src/ui/MapPanel.tsx`, `src/ui/ScenePanel.tsx`, `src/ui/NotebookPanel.tsx`, `src/ui/NoAgentBanner.tsx`, `src/ui/theme.css`(확장)
- Test: `tests/ui-scene.test.tsx`

**Interfaces:**
- Consumes: `useGame`, `useLang`, `T`, `scene()`, `useWebmcpRoot/useWebmcpStatus`.
- Produces: 라우트 `#/`(에피소드 선택), `#/play`(3열), `#/recap/<code>`. 클릭 동사 5개가 전부 `dispatch('holmes', …)`로 떨어진다.

- [ ] **Step 1: 테스트**

```tsx
// tests/ui-scene.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { ScenePanel } from '../src/ui/ScenePanel';
import { MapPanel } from '../src/ui/MapPanel';
import { NotebookPanel } from '../src/ui/NotebookPanel';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
describe('click path', () => {
  beforeEach(() => { localStorage.clear(); setLang('en'); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('map click moves holmes only along adjacency', () => {
    render(createElement(MapPanel));
    fireEvent.click(screen.getByRole('button', { name: /Galley/ })); expect(useGame.getState().state!.pos.holmes).toBe('galley');
    fireEvent.click(screen.getByRole('button', { name: /Engine/ })); expect(useGame.getState().state!.pos.holmes).toBe('galley');   // not adjacent → unchanged
  });
  it('scene shows people with topic chips; chip click adds a card that the notebook renders in the current language', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    render(createElement('div', null, createElement(ScenePanel), createElement(NotebookPanel)));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Last night/ }));
    expect(screen.getByText('Ada came to the galley after the first hour.')).toBeTruthy();
    setLang('ko'); expect(screen.getByText('Ada came to the galley after the first hour.')).toBeTruthy();   // fixture ko === en
  });
  it('evidence click examines; a kernel error shows as a toast line, not a crash', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    render(createElement('div', null, createElement(ScenePanel), createElement(NotebookPanel)));
    fireEvent.click(screen.getByRole('button', { name: /Empty hook/ })); expect(screen.getByText('A hook by the stove. Empty.')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 구현 (요지 — 각 컴포넌트는 100~200줄, 아래 계약을 지킨다)**

`App.tsx`: `useWebmcpRoot()` 한 번 호출, `hydrate()` 마운트 시, `location.hash` 라우팅(`hashchange` 리스너). `#/play`에서 `<TopBar/>` + `<main class="cols"><MapPanel/><ScenePanel/><NotebookPanel/></main>` + `<TutorialChips/>`(Task 16) + `<AccuseDialog/>`(Task 16). `state.verdict`가 있으면 `<VerdictView/>`(Task 16).

`TopBar.tsx`: 제목(`series · title`), 시계(`ep.clockLabel(clock)` + `minutesLeft`), 잔여 기소, 도구 배지(`useWebmcpStatus().count`), 언어 토글(`useLang`), 기소 버튼(다이얼로그 열기), `closed`면 `T.closedBanner`.

`MapPanel.tsx`: 장소를 격자에 배치(`ep.places` 순서, CSS grid 자동), 각 장소 `<button aria-label={name}>`. 현재 홈즈 위치 인접이면 활성, 아니면 `disabled` 대신 클릭 시 `dispatch` 결과 실패를 토스트로(테스트가 클릭 가능해야 하므로 `disabled` 쓰지 않음). 장소 안에 토큰: 인물 이모지(`whoIsHere`), 홈즈 `●`(--holmes), 왓슨 `▲`(--watson) + `watsonBusy` 텍스트. 방문한 장소는 카드 `place:<id>` 존재로 판단해 테두리 진하게.

`ScenePanel.tsx`: `scene(ep, state, pos.holmes)`. 묘사 문단, `people` 목록(버튼, 선택 시 그 인물의 `topics` 칩), `evidence` 목록(버튼 → `examine`). 칩 클릭 → `talk`. 실패 시 `activity` 마지막 항목의 `detail`을 2초 토스트.

`NotebookPanel.tsx`: 카드 역순, 카드마다 `kind` 아이콘, `title`, `body`(`pick`), `foundBy`(홈즈=--holmes, 왓슨=--watson) + `clockLabel(foundAt)`, 핀 노트 목록, "메모" 입력 → `pin`. 카드 클릭 시 확장.

`NoAgentBanner.tsx`: `useWebmcpStatus().available === false`일 때 `T.noAgent`.

CSS: 3열 `grid-template-columns: 1fr 1.4fr 1fr`, 모바일 1열. 라인은 `--line`, 카드는 종이 질감 없이 얇은 테두리.

- [ ] **Step 3: 실행**

Run: `npx vitest run tests/ui-scene.test.tsx && npm run build` → PASS, 빌드 성공. `npm run dev`로 열어 EP0를 클릭만으로 끝까지(기소 제외) 진행되는지 확인. Commit: `feat(ui): three-column play screen — map, scene, notebook; click path complete`.

---

### Task 16: UI — 기소·판결·회고·튜토리얼 칩·왓슨 상태

**Files:**
- Create: `src/ui/AccuseDialog.tsx`, `src/ui/VerdictView.tsx`, `src/ui/RecapView.tsx`, `src/ui/TutorialChips.tsx`
- Test: `tests/ui-accuse.test.tsx`

**Interfaces:**
- Consumes: `recapOf`, `encodeRecap/decodeRecap`, `EP.tutorial`.

- [ ] **Step 1: 테스트**

```tsx
// tests/ui-accuse.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { AccuseDialog } from '../src/ui/AccuseDialog';
import { VerdictView } from '../src/ui/VerdictView';
import { TutorialChips } from '../src/ui/TutorialChips';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
describe('accuse dialog', () => {
  beforeEach(() => { localStorage.clear(); setLang('en'); registerEpisode({ ...MINI_CASE, tutorial: [{ id: 't0', when: { kind: 'start' }, say: { en: 'Greet Watson.', ko: '왓슨에게 인사.' }, chip: { en: 'Watson, read the case.', ko: '왓슨, 사건 읽어줘.' } }] }); useGame.getState().startEpisode('mini'); });
  it('three selects, wrong slots reported, second miss ends the case', () => {
    render(createElement('div', null, createElement(AccuseDialog, { open: true, onClose: () => {} }), createElement(VerdictView)));
    fireEvent.change(screen.getByLabelText('Who'), { target: { value: 'ada' } });
    fireEvent.change(screen.getByLabelText('How'), { target: { value: 'm_sold' } });
    fireEvent.change(screen.getByLabelText('Decisive evidence'), { target: { value: 'e_print' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText(/Wrong:/).textContent).toMatch(/How/); expect(useGame.getState().state!.accusationsLeft).toBe(1);
  });
  it('solving shows the reveal', () => {
    render(createElement('div', null, createElement(AccuseDialog, { open: true, onClose: () => {} }), createElement(VerdictView)));
    fireEvent.change(screen.getByLabelText('Who'), { target: { value: 'ada' } }); fireEvent.change(screen.getByLabelText('How'), { target: { value: 'm_took' } }); fireEvent.change(screen.getByLabelText('Decisive evidence'), { target: { value: 'e_print' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Ada took it.')).toBeTruthy();
  });
  it('tutorial chip copies its sentence in the current language', async () => {
    const written: string[] = []; Object.assign(navigator, { clipboard: { writeText: async (t: string) => { written.push(t); } } });
    render(createElement(TutorialChips)); fireEvent.click(screen.getByRole('button', { name: /Watson, read the case/ }));
    await Promise.resolve(); expect(written).toEqual(['Watson, read the case.']);
  });
});
```

- [ ] **Step 2: 구현 계약**

`AccuseDialog.tsx`: `<select aria-label={T.who[lang]}>`(people), `<select aria-label={T.how[lang]}>`(methods), `<select aria-label={T.decisive[lang]}>`(수첩에 있는 evidence 카드만 — 없는 물증은 고를 수 없다). Submit → `dispatch('holmes', {kind:'accuse',…})`. 결과가 실패면 다이얼로그 안에 `T.wrongSlots` + 틀린 칸 이름 목록, 잔여 횟수. 성공/종료면 닫힘.

`VerdictView.tsx`: `state.verdict === 'solved'` → `T.solved`, `truth.reveal`, `truth.motive`, `truth.hook`(작은 글씨, "Next episode" 예고). `'failed'` → `T.failed`. 둘 다 "Recap" 버튼 → `#/recap/<encodeRecap(recapOf(ep, state))>`. `reveal`은 `solved`일 때만 렌더 — 실패 화면에서 `ep.truth`를 읽지 않는다.

`RecapView.tsx`: 해시의 코드를 `decodeRecap`. 세 숫자 큰 글씨, 지도(방문/미방문 색), 카드 순서 목록(홈즈/왓슨 색), `T.share` 버튼(현재 URL 복사). 코드가 없으면 `#/`로.

`TutorialChips.tsx`: `ep.tutorial`이 있으면 현재 `state`에 맞는 첫 미완 단계를 찾는다: `start`는 항상, `moved`는 `pos.holmes === placeId`, `card`는 카드 존재, `theory`는 `activity`에 `submit_theory` ok 존재, `accused`는 `accusations.length > 0`. 완료 단계 id는 localStorage `baker.tut.<ep>`에 저장. 단계의 `say`를 한 줄 + `chip`이 있으면 `<button>`으로, 클릭 시 `navigator.clipboard.writeText(chip[lang])` 후 `T.copied` 1.5초.

왓슨 상태: `MapPanel`의 왓슨 토큰 옆에 `watsonBusy ?? T.watsonIdle`. 도구 실행은 동기라 `busy`가 화면에 보이는 시간이 짧다 — `setBusy(s)` 후 `setTimeout(() => setBusy(null), 1200)`으로 최소 노출을 보장한다(`tools.ts`의 `run`에서 즉시 null로 되돌리는 대신 store의 `setWatsonBusy`가 타이머를 잡도록 Task 11 코드를 이 태스크에서 수정: `setBusy(null)` 호출 제거, store의 `setWatsonBusy`가 non-null 값에 1200ms 타이머를 건다).

- [ ] **Step 3: 실행**

Run: `npx vitest run tests/ui-accuse.test.tsx && npm test && npm run build` → PASS. Commit: `feat(ui): accuse dialog (2 tries), verdict, recap share, tutorial chips, Watson status`.

---

### Task 17: 에피소드 선택·README·제출문·배포·실검증

**Files:**
- Create: `src/ui/Home.tsx`, `docs/devpost-submission.md`, `docs/video-script.md`; Modify: `README.md`, `src/ui/App.tsx`

- [ ] **Step 1: Home 화면**

`#/`: 시리즈 제목, 한 줄 테제, 에피소드 카드 2개(제목·부제·규모·`T.play`). 진행 중인 판이 있으면 "이어하기". 카드 클릭 → `startEpisode(id)` → `#/play`.

- [ ] **Step 2: README**

구성: 테제 한 줄 → 라이선스 두 줄 → "How to play (2 minutes)" (ChatGPT에서 URL 열기 → Episode 0 → 화면의 칩을 채팅에 붙여넣기) → 규칙 표(에이전트가 할 수 있는 것 / 도구 자체가 없는 것: accuse) → 세 층(사실/경로/표현) → 도구 10개 표 → "Why WebMCP" 세 문단 → 저작 조건 7개 → 로컬 실행.

- [ ] **Step 3: 제출문·영상 대본**

`docs/devpost-submission.md`: Cue 제출문과 같은 블록 구조(태그라인 / About / How it uses WebMCP / What makes the human-agent experience / Built with / 심사위원 2분 테스트 절차 = Episode 0 골든 경로). `docs/video-script.md`: 3막 2:50 — ① 사건 개요와 클릭 수사(30s) ② 왓슨에게 심부름·시간표·대조(80s) ③ 예비 심리 판정 화면 → 기소 → 회고(60s). 영어 내레이션 + 자막.

- [ ] **Step 4: 배포·실검증**

```bash
npm test && npm run build && git add -A && git commit -m "feat: home, README, submission kit" && git push && npx vercel --prod --yes
```

사용자 실검증 체크리스트(ChatGPT 내장 브라우저): ① 도구 배지 10 ② "Watson, read the case…" 칩 → `get_case` 호출 확인 ③ 왓슨 이동이 지도에 보임 ④ `ask` 자유 질문에서 unknown 처리 ⑤ `submit_theory` 판정 ⑥ 기소 2회 ⑦ 회고 링크가 다른 브라우저에서 열림 ⑧ 한국어 토글 시 카드 전부 한국어. 발견된 결함은 이 계획에 태스크로 추가한다.

- [ ] **Step 5: 제출 후**

`git tag v1.0-submitted && git push --tags`.

---

## Self-review 기록

- **스펙 커버리지**: §1 세 층(Task 3·4·11 voice) / §3 다섯 국면(Task 4·7·8·16) / §4 UX(Task 15·16 칩) / §5 커널·도구·불변식(Task 3–8·11, `accuse` 미등록 테스트 Task 11) / §6 저작 조건(Task 9, 콘텐츠 태스크가 소비) / §7 콘텐츠(Task 13·14) / §8 왓슨(Task 11 voice + Task 16 상태) / §9 언어(Task 12 + Task 11 `project`) / §10 회고·공유(Task 8·10·16) / §11 에이전트 없음(Task 15 배너, 왓슨 전용 동사는 UI에 없음) / §12 배포(Task 1·17). §13 범위 밖은 태스크 없음(의도).
- **타입 일관성**: `Cmd` 필드명(`placeId/personId/topicId/evidenceId/cardId`)과 도구 인자명(`place_id/person_id/topic_id/evidence_id/card_id`)은 `tools.ts`에서만 매핑된다. `KernelResult` 실패 형태 `{ok:false, code, message}`는 전 태스크 동일. `Card.asserts`는 Task 3 정의, Task 6 소비.
- **알려진 절충**: `submit_theory`의 `missing`이 미발견 카드 id를 노출한다(Task 7 주석). `validateCase` R1은 휴리스틱(정규식)이며 완전한 유일성 증명이 아니다 — 골든 경로 테스트와 저작자 검토가 보완한다. Task 4의 examine 테스트 중 미완 항목은 talk 파일의 세 번째 테스트로 완성되므로 삭제한다.
