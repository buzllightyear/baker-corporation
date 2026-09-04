먼저 `AGENTS.md`와 리뷰 브리프를 전부 읽고, 브리프의 고정 제약과 평가 축을 추출하겠습니다. 그다음 지정된 코드·콘텐츠·연구 문서를 교차 확인해, 코드와 브리프가 충돌하는 지점을 분리해서 근거 중심으로 정리하겠습니다. 파일은 수정하지 않습니다.

브리프의 핵심 주장은 네 종류입니다: 실제 게임 규칙, 콘텐츠 규모·도달성, 화면에서 드러나는 상호작용, 런타임·연출 구현입니다. 이제 각 주장과 직접 연결되는 파일을 찾아 라인 단위로 확인하고, 숫자는 콘텐츠 정의와 테스트/검증 코드 양쪽에서 대조하겠습니다.

초기 교차검증에서 브리프와 코드의 중요한 불일치가 이미 보입니다. WebMCP 등록은 브리프와 달리 현재 `document.modelContext`만 참조하며, `StageArt3D`는 초기 probe 뒤 렌더러 생성 실패를 잡지만 CSS 폴백으로 상태를 되돌리는 신호는 없습니다. UI의 실제 안내와 콘텐츠 도달성을 더 확인해 우선순위를 정하겠습니다.

콘텐츠 수치는 대체로 맞지만, 중요한 예외가 확인됐습니다. Ep0의 거짓 진술은 5개가 맞아도 거짓말하는 인물은 `okafor`, `lind` 두 명뿐이라 `validateCase`의 R2(3명 이상)를 통과할 수 없습니다. 더 심각하게는 잠긴 물증의 “부분 조사 카드”도 같은 ID로 저장되어 `coverage`와 `submit_theory`가 완전 해금된 증거처럼 셉니다. 준비 신호와 예비 심리의 신뢰도를 직접 깨는 문제라 최상위 항목으로 다루겠습니다.

추가로 `submit_theory`가 `provedBy`를 숨긴다는 브리프 주장도 코드상 성립하지 않습니다. `runTheory`는 가장 가까운 `provedBy` 집합의 누락 ID를 `missing`으로 반환하고, `HearingPanel`은 그 ID를 아직 발견하지 않은 물증·진술의 이름으로 바꿔 표시합니다. 이는 예비 심리가 추리를 검사하는 수준을 넘어 다음 정답 카드를 지목하는 오라클이므로 마감 전 수정 우선순위가 가장 높습니다. 시각 평가는 실제 방 이미지도 표본 확인하겠습니다.

# 우선순위 Top 10

1. **[마감 전(≤2h)] `submit_theory`의 `missing` 반환을 삭제한다.** 현재 `provedBy` 자체는 숨기지만, 가장 가까운 증명 집합에서 빠진 카드 ID를 그대로 반환하고 UI가 미발견 카드 이름까지 표시한다. 사실상 다음 정답 카드 안내다. [theory.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/theory.ts:17), [HearingPanel.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/HearingPanel.tsx:25)

2. **[마감 전(≤2h)] 잠긴 물증의 부분 카드와 완전 해금 카드를 구분한다.** 현재 `e_sato_jacket`을 선행 조건 전에 조사해도 같은 ID가 수첩에 들어간다. 이후 `coverage`와 `submit_theory`는 본문 해금 여부 없이 ID만 보고 완전한 증거로 인정한다. `Card.unlocked` 또는 공통 `proofEligible()` 판정이 필요하다. [redact.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/redact.ts:9), [kernel.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/kernel.ts:51), [leads.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/leads.ts:54)

3. **[마감 전(≤2h)] 준비 신호의 조건이나 문구를 정직하게 만든다.** Ep1은 증명 가능한 명제 9개 중 7개만 덮어도 `nothing_left_to_fetch`가 된다. 아직 열려 있는 실마리가 있어도 “더 가져올 것 없음”이라고 말한다. 미래에 열릴 `availableFrom` 진술도 현재 `leads.open`에서 빠진다. 연구 문서의 “모든 명제 또는 모든 실마리 소진”과 코드가 다르다. [leads.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/leads.ts:26), [leads.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/leads.ts:50), [05-stuck-synthesis.md](/Users/opty/PROJECTs/baker-corporation/docs/research/05-stuck-synthesis.md:27)

4. **[마감 전(≤2h)] WebMCP 컨텍스트 탐색을 한 함수로 통합해 `document.modelContext`와 `navigator.modelContext`를 모두 처리하고, 등록 실패를 화면에 표시한다.** 브리프와 달리 코드는 `document.modelContext`만 사용한다. 등록이 rollback되어 도구 수가 0이어도 `NoAgentBanner`는 API 존재 여부만 보고 숨는다. [registry.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/registry.ts:4), [useWebmcp.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/useWebmcp.ts:31), [NoAgentBanner.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/NoAgentBanner.tsx:3)

5. **[마감 전(≤2h)] 준비 신호가 켜질 때 상단 `기소` 버튼을 점멸시키고 “상단의 기소 버튼에서 최종 판단”이라는 구조 안내를 한 번 표시한다.** 현재 준비 문구는 “나머지는 조사관 몫”뿐이고, 기소 버튼은 평상시와 같은 위치·강도다. 채팅만 보던 플레이테스터가 한 시간 동안 버튼을 몰랐다는 결과와 코드가 그대로 연결된다. [MiniMap.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/MiniMap.tsx:41), [TopBar.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/TopBar.tsx:25)

6. **[마감 전(≤2h)] 한국어 모드의 하드코딩 영어를 제거한다.** `Tutorial`, `rooms`, `people`, `NO UNIT LINK`, `Sealed`, `Home`, audio `title`과 WebMCP busy 상태의 `talking`·`examining` 등이 그대로 노출된다. “한국어 UI는 한국어만”이라는 고정 제약을 현재 위반한다. [Home.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/Home.tsx:15), [TutorialChips.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/TutorialChips.tsx:19), [AudioControls.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/AudioControls.tsx:14), [tools.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/tools.ts:69)

7. **[마감 전(≤2h)] `StageArt3D`에 `onFailure`를 추가해 렌더러 생성 실패 시 CSS 그림으로 전환한다.** WebGL probe가 성공한 뒤 실제 `WebGLRenderer` 생성이 실패하면 컴포넌트는 빈 host만 남긴다. 부모는 `gl === true`라 CSS 폴백도 렌더링하지 않는다. [StageArt3D.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/StageArt3D.tsx:187), [SceneStage.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/SceneStage.tsx:121)

8. **[v1.1] 검증 규칙을 `validateCase` 하나로 통합한다.** Ep0은 R2를 실제로 위반하지만 테스트가 예외 문자열을 필터링한다. 독립 스크립트의 이동 비용은 아직 10분이라 현재 커널의 무료 이동과 다르다. “R1~R7 검증기가 보장한다”는 브리프 표현은 과장이다. [content-ep0.test.ts](/Users/opty/PROJECTs/baker-corporation/tests/content-ep0.test.ts:8), [check-ep0.ts](/Users/opty/PROJECTs/baker-corporation/scripts/check-ep0.ts:18), [clock.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/clock.ts:3)

9. **[v1.1] Ep1의 14×5 동일 화제 매트릭스를 줄이고 미끼 수법에도 명시적인 논증 경로를 준다.** 70개 진술 중 61개가 참이고, 모든 인물이 정확히 같은 14개 화제를 가진다. `m_airlock`에는 `p_not_airlock`이 있지만 `m_poison`에는 대응 명제가 없다. `e_glove`는 어떤 명제나 반박 경로에도 쓰이지 않는다. [ep1-sensor.ts](/Users/opty/PROJECTs/baker-corporation/content/ep1-sensor.ts:225), [ep1-sensor.ts](/Users/opty/PROJECTs/baker-corporation/content/ep1-sensor.ts:398), [ep1-sensor.ts](/Users/opty/PROJECTs/baker-corporation/content/ep1-sensor.ts:486)

10. **[장기] “말은 매 판 다르다”는 제품 약속을 실제 구현으로 만든다.** 현재 NPC 발화는 고정된 `card.body`이며 Watson 규칙도 그것을 따옴표 안에서 그대로 말하도록 강제한다. 달라지는 것은 주변 해설뿐이다. 사실 슬롯과 허용된 태도·어조를 분리해야 생성형 대화라는 정체성이 성립한다. [voice.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/voice.ts:1), [matching.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/matching.ts:15)

# 1. 코어 루프 & 메카닉

**가장 잘 된 것:** 사람과 에이전트의 역할 경계가 선언에 그치지 않고 커널에서 강제된다. `accuse`는 `holmes`만 가능하고, `timeline`·`cross_check`·`search_records`·`submit_theory`는 Watson 전용이다. WebMCP 도구 목록에도 `accuse`가 없다. 이 부분은 게임의 핵심 문법과 구현이 일치한다. [kernel.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/kernel.ts:34), [tools.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/tools.ts:35)

**가장 약한 점:**

- 예비 심리가 추론 검증기가 아니라 답안 검색기로 변한다. `unsupported`와 함께 반환되는 `missing`은 `provedBy`에서 직접 계산되며, UI는 이를 “사토의 재킷” 같은 이름으로 번역한다.
- 자유 질문은 사실상 영문 단어 완전일치다. 토크나이저가 `[a-z0-9]` 외 문자를 제거하고, 도구 설명도 한국어 대화를 하더라도 영어 키워드를 쓰라고 요구한다. [matching.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/matching.ts:6), [tools.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/tools.ts:72)

**제안:**

- **[마감 전(≤2h)]** `missing`을 응답과 `HearingPanel`에서 제거하고 `unsupported`만 표시한다.
- **[v1.1]** Watson이 `get_case.here.people[].topics`를 보고 의도를 `topic_id`로 선택하게 하고, `ask`는 다국어 별칭·형태소 정규화를 쓰는 보조 경로로 만든다.
- **[장기]** 카드에 공개 사실, 감정, 회피 가능 범위를 분리하고 Watson이 그 범위 안에서 발화를 생성하도록 한다.

# 2. 시스템 기획 & 밸런싱

**가장 잘 된 것:** 시간은 브리프의 질문과 달리 “회고 숫자뿐”이 아니다. `advance()`가 올린 시각은 NPC 위치, 늦게 열리는 진술, 소멸 물증을 바꾼다. 즉 패널티는 없어도 세계 상태를 순서화하는 리듬 자원이다. 이를 없애면 살아 있는 세계의 절반이 사라진다. [clock.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/clock.ts:3), [kernel.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/kernel.ts:11), [presence.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/presence.ts:12)

또한 핵심 명제는 복수 증명 경로를 갖는다. 예컨대 `p_sato_there`는 발자국 또는 도어 로그에 재킷을 결합해 증명할 수 있다. 소멸 증거 유지 결정과 잘 맞는다. [ep1-sensor.ts](/Users/opty/PROJECTs/baker-corporation/content/ep1-sensor.ts:493)

**가장 약한 점:**

- 잠긴 카드도 ID만 생기면 증명·커버리지에 포함된다. 특히 `e_sato_jacket`은 `e_sensor_panel` 전후 본문이 크게 다른 결정적 물증인데, 상태에는 그 차이가 없다. [ep1-sensor.ts](/Users/opty/PROJECTs/baker-corporation/content/ep1-sensor.ts:429)
- 준비 신호가 세 가지 방식으로 조기 발화할 수 있다. 75% 임계치, 미래 진술 제외, 부분 카드의 ID 인정이다. 따라서 현재 `nothing_left_to_fetch`는 신뢰할 수 없다.
- 미끼의 밀도가 불균형하다. `e_glove`는 기관부를 암시하지만 논증 그래프에는 전혀 참여하지 않고, 약물 수법은 선택지로만 존재한다.

**제안:**

- **[마감 전(≤2h)]** `Card.unlocked`를 저장하고 `coverage`, `runTheory`, `leads`가 같은 `proofEligible()`를 사용하게 한다.
- **[마감 전(≤2h)]** “더 가져올 것 없음”은 100% 증명 커버리지 또는 미래 진술까지 포함한 실제 `open === 0`에서만 발화시킨다.
- **[v1.1]** `p_not_poison` 같은 명제를 추가하고 각 오답 수법에 최소 1개 유혹 근거와 1개 반박 경로를 둔다.
- **[장기]** 콘텐츠 스키마에 `critical`, `alternate`, `decoy`, `refutation` 역할을 명시해 도달성뿐 아니라 정보 밀도도 자동 검사한다.

# 3. UX & 인터페이스

**가장 잘 된 것:** 최근 추가된 콜드 오픈, 승무원 서류, 미탐색 고리는 실제 코드에 연결되어 있다. 인트로는 에피소드별로 한 번 자동 표시되고, Dossier는 인물별 미청취 수와 대조 여부를 보여주며, 미니맵은 방 단위 열린 실마리를 표시한다. “어디”를 알려주되 내용을 숨기는 방향은 연구와 일치한다. [Intro.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/Intro.tsx:51), [Dossier.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/Dossier.tsx:40), [MiniMap.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/MiniMap.tsx:31)

**가장 약한 점:**

- 사람만 가능한 최종 행동이 상단의 평범한 버튼 하나다. 준비 완료 상태와 버튼 사이에 시각적·문구상 연결이 없다.
- 한국어 전용 고정 제약을 여러 곳에서 위반한다. 특히 Watson busy 문자열은 도구 구현에서 영어로 직접 넣어 한국어 UI의 상태줄에 노출된다.
- 화제 접기는 단순히 작성 순서의 앞 4개를 보여준다. Ep1의 중요한 `maint_code`는 다섯 번째라 기본 화면에서 숨는다. 튜토리얼만 목표 화제를 앞쪽으로 교체한다. [SceneStage.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/SceneStage.tsx:109)

**제안:**

- **[마감 전(≤2h)]** 준비 신호 발생 시 `기소` 버튼 강조와 1회성 구조 안내를 추가한다.
- **[마감 전(≤2h)]** 하드코딩 문자열을 `T`로 옮기고 한국어 모드 스크린 텍스트를 한 번 전수 점검한다.
- **[v1.1]** 화제를 `사건 핵심 / 인물 / 주변 정보`로 저작 단계에서 묶고, 미청취 핵심 화제를 접힌 영역에 두지 않는다.
- **[v1.1]** 900px 이하에서 실제 stage 높이를 보장한다. 현재 media query는 grid를 한 열로 바꾸지만, 절대 배치된 stage 내부 요소에 필요한 최소 높이를 정하지 않는다. [theme.css](/Users/opty/PROJECTs/baker-corporation/src/ui/theme.css:128)

# 4. 아트 스타일 & 시각적 정체성

**가장 잘 된 것:** 실제 방 이미지 표본은 암청색 금속, 녹·기름, 호박색 실무 조명, 중앙 원근 구도가 안정적으로 반복된다. CSS도 같은 호박색·청록색·스텐실·산업용 패널 문법을 명시적으로 공유한다. 방 그림의 스타일 편차는 브리프가 말하는 정도로 심하지 않다. [theme.css](/Users/opty/PROJECTs/baker-corporation/src/ui/theme.css:1), [chrome.css](/Users/opty/PROJECTs/baker-corporation/src/ui/chrome/chrome.css:22)

깊이 맵 패럴랙스도 단순 장식이 아니다. CPU 쪽 hotspot 변위와 셰이더 UV 변위를 맞춰 클릭 위치가 그림에서 미끄러지지 않도록 설계했다. [StageArt3D.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/StageArt3D.tsx:63)

**가장 약한 점:**

- 인물은 장면 속 존재라기보다 원형 프로필 버튼으로 떠 있다. 64px 원형 사진, 테두리, 라벨이 일관되게 오버레이되므로 방 그림의 현실감과 충돌한다. [SceneStage.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/SceneStage.tsx:136), [theme.css](/Users/opty/PROJECTs/baker-corporation/src/ui/theme.css:188)
- 시리즈 키비주얼과 에피소드 키비주얼이 분리되지 않았다. 홈은 한 장의 `hero-ship.jpg`가 전체 시리즈와 두 사건을 모두 대표한다. [Home.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/Home.tsx:8)

**제안:**

- **[마감 전(≤2h)]** 원형 초상을 선내 통신 단말처럼 각진 프레임과 스캔라인으로 바꿔 오버레이임을 의도된 디에게틱 UI로 보이게 한다.
- **[v1.1]** 방별 색온도, 렌즈 높이, 금속 색, 소품 밀도를 체크하는 아트 검수표를 만들고 전체 10장을 같은 기준으로 재조정한다.
- **[장기]** 에피소드마다 범죄 현장과 Watson 실루엣을 결합한 별도 키아트를 만든다.

브리프의 “8.2MB 아트를 lazy 없이 싣는다”는 코드와 다르다. 방 이미지는 현재 장면에서 `new Image()`로 요청되고, `three`도 WebGL probe 이후 동적 import된다. 전체 아트가 시작 시 한꺼번에 로드되지는 않는다. [SceneStage.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/SceneStage.tsx:32), [StageArt3D.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/StageArt3D.tsx:187)

# 5. 기술적 안정성 & 최적화

**가장 잘 된 것:** 커널은 UI와 분리된 순수 명령 처리 구조이고, 실패를 `KernelResult`로 돌려준다. 3D 코드는 동적 import, 텍스처·geometry·composer 해제, hidden tab 렌더 정지까지 구현했다. 구조 자체는 제출용 프로토타입보다 훨씬 단단하다. [kernel.ts](/Users/opty/PROJECTs/baker-corporation/src/kernel/kernel.ts:34), [StageArt3D.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/StageArt3D.tsx:298)

**가장 약한 점:**

- 브리프의 WebMCP 호환성 설명이 틀렸다. 현재 등록과 상태 확인은 모두 `document.modelContext` 전용이며, 에피소드가 없는 첫 화면에는 빈 도구 집합을 적용한다. “첫 페인트부터 양쪽 대응”이 아니다. [useWebmcp.ts](/Users/opty/PROJECTs/baker-corporation/src/webmcp/useWebmcp.ts:11)
- WebGL probe와 실제 renderer 생성 사이의 실패 경로가 끊겼다. 이 경우 검은 장면이 나올 수 있다.
- 앱 전체 error boundary가 없다. `App`은 주요 패널을 직접 조립하고 있어 한 렌더 예외가 전체 화면을 내릴 수 있다. [App.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/App.tsx:20)

**제안:**

- **[마감 전(≤2h)]** 공통 `getModelContext()`와 등록 상태 `idle/registering/ready/failed`를 만들고 실패 배너와 재시도 버튼을 노출한다.
- **[마감 전(≤2h)]** 3D 초기화 실패 콜백으로 CSS 폴백을 강제한다.
- **[v1.1]** play shell에 error boundary를 두고 저장된 run을 유지한 채 화면만 복구할 수 있게 한다.
- **[v1.1]** “한 탭에서 플레이”를 시작 화면에 명시한다. 현재 저장은 dispatch 때 쓰고 mount 때 한 번 읽을 뿐, 탭 간 상태 갱신은 없다. [store.ts](/Users/opty/PROJECTs/baker-corporation/src/state/store.ts:62), [persist.ts](/Users/opty/PROJECTs/baker-corporation/src/state/persist.ts:1)
- **[장기]** Chrome embed 기준 GPU·메모리·저사양 프로파일을 자동 측정한다.

메타데이터도 갱신이 필요하다. 현재 `src + content`는 66개 파일, 약 5,186 LOC로 브리프의 60개·4,385 LOC와 다르다. 테스트 정의는 `it()` 기준 150개가 맞지만, read-only 환경에서 Vitest가 `.vite-temp` 생성을 요구해 이번 리뷰에서는 실행 결과를 재검증하지 못했다.

# 6. 사운드 & 연출

**가장 잘 된 것:** 오디오가 상태 변화에 결합되어 있고 실패가 게임을 중단시키지 않는다. 방별 hum·air·ping 프로필, 1.5초 크로스페이드, A aeolian 음악 모드, 심리 후 25초 긴장 모드, 판결별 음향이 모두 실제로 연결되어 있다. [ambience.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/ambience.ts:42), [music.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/music.ts:1), [useAudioBindings.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/useAudioBindings.ts:76)

**가장 약한 점:**

- 브리프의 “판결 스팅어 없음”은 틀렸다. `solved`와 `failed` 스팅어가 있으며 verdict 변화 때 재생된다. 약한 것은 음향이 아니라 시각적 판결 순간이다. 현재 바로 정적 dialog가 뜬다. [sfx.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/sfx.ts:124), [VerdictView.tsx](/Users/opty/PROJECTs/baker-corporation/src/ui/VerdictView.tsx:12)
- 효과음도 18종이 아니라 `SfxName` 기준 16종이다. Watson에게는 음성이 없지만 1046→1568Hz 두 음의 고유 모티프는 이미 있다. “청각적 정체성 없음”보다 “정체성이 너무 짧고 모든 행동에서 비슷함”이 정확하다. [sfx.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/sfx.ts:13), [sfx.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/sfx.ts:80)
- 음악은 1.4kHz low-pass, 앰비언스는 주로 44~320Hz에 몰린다. 완전히 같은 대역은 아니지만 compressor·meter·실측 기준이 없어 합산 레벨과 마스킹은 귀로만 판단한 상태다. [music.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/music.ts:47), [engine.ts](/Users/opty/PROJECTs/baker-corporation/src/audio/engine.ts:79)

**제안:**

- **[마감 전(≤2h)]** 기소 제출 때 150~250ms 화면 정지·플래시·도장 충격을 넣고, 기존 `stamp`와 판결 스팅어에 타이밍을 맞춘다.
- **[v1.1]** 실제 이어폰·노트북 스피커에서 `home/play/tense`, 기관실, 판결을 각각 녹음해 LUFS·peak와 대화 가독성을 비교한다.
- **[v1.1]** Watson 모티프를 이동·관찰·대조·경고별로 같은 음색의 변주로 만든다.
- **[장기]** 발화 생성 구조가 도입될 때만 짧은 합성 음성이나 보코더형 음절을 검토한다. 현재 고정 카드 낭독에 TTS만 붙이면 반복 피로만 커진다.