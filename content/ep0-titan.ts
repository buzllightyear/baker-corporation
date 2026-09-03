// content/ep0-titan.ts
// Episode 0 — "Titan, I Perceive" (타이탄에서 오셨군요). The tutorial case.
// The freighter Marlow, two hours from dock. A box of ampoules is gone from the medbay safe.
import type { Episode, Text } from './types';

const t = (en: string, ko: string): Text => ({ en, ko });

export const EP0: Episode = {
  id: 'ep0',
  title: t('Titan, I Perceive', '타이탄에서 오셨군요'),
  series: t('The Baker Corporation', '베이커 사'),
  brief: t(
    'The Baker freighter Marlow, eleven hours out of Titan. A box of analgesic ampoules is gone from the medbay safe, and nobody reported it until the night watch ended. We dock in two hours; after that the case belongs to the port authority.',
    '타이탄을 떠난 지 열한 시간 된 베이커 사 화물선 말로우. 의무실 금고에서 진통제 앰플 한 상자가 사라졌는데, 야간 당직이 끝날 때까지 아무도 신고하지 않았다. 정박까지 두 시간, 그 뒤부터 이 사건은 항만 당국 소관이다.',
  ),
  startPlaceId: 'corridor',
  watsonStartPlaceId: 'corridor',
  budgetMinutes: 120,
  clockLabel: (m) => {
    const t = 150 + m;
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  },

  places: [
    {
      id: 'corridor',
      name: t('Main corridor', '중앙 복도'),
      description: t(
        'A straight run of deck plate from the medbay hatch to the bunks. The cleaning unit has already started its round at the far end.',
        '의무실 해치에서 침상까지 곧게 뻗은 통로. 저쪽 끝에서 청소 로봇이 벌써 순회를 시작했다.',
      ),
      adjacent: ['medbay', 'galley', 'bunks'],
    },
    {
      id: 'medbay',
      name: t('Medbay', '의무실'),
      description: t(
        'White light, one berth, one drug safe bolted to the bulkhead. The safe is open and Okafor has not closed it.',
        '흰 조명, 침상 하나, 격벽에 볼트로 박힌 약품 금고 하나. 금고는 열려 있고 오카포는 아직 닫지 않았다.',
      ),
      adjacent: ['corridor'],
    },
    {
      id: 'galley',
      name: t('Galley', '주방'),
      description: t(
        'Warm, and it still smells of last night\'s stew. The bin by the door has been tipped out once already this watch.',
        '따뜻하고 어젯밤 스튜 냄새가 남아 있다. 문 옆 쓰레기통은 이번 당직에 이미 한 번 비워졌다.',
      ),
      adjacent: ['corridor'],
    },
    {
      id: 'bunks',
      name: t('Crew bunks', '승무원 침상'),
      description: t(
        'Six berths, four of them empty at this hour. Lockers along the far wall, none of them locked.',
        '침상 여섯 중 넷은 이 시각에 비어 있다. 안쪽 벽을 따라 사물함이 늘어서 있고, 잠긴 것은 하나도 없다.',
      ),
      adjacent: ['corridor'],
    },
  ],

  people: [
    { id: 'okafor', name: t('Okafor', '오카포'), role: t('Ship\'s medic', '선의'), portrait: '🩺', truthful: false },
    { id: 'reyes', name: t('Reyes', '레이예스'), role: t('Cook', '요리사'), portrait: '🍳', truthful: true },
    { id: 'lind', name: t('Lind', '린드'), role: t('Apprentice engineer', '견습 기관사'), portrait: '🔧', truthful: false },
  ],

  presence: [
    { personId: 'okafor', placeId: 'medbay', from: 0, to: 120 },
    { personId: 'reyes', placeId: 'galley', from: 0, to: 120 },
    { personId: 'lind', placeId: 'bunks', from: 0, to: 40 },
    { personId: 'lind', placeId: 'corridor', from: 40, to: 70 },
    { personId: 'lind', placeId: 'galley', from: 70, to: 120 },
  ],

  topics: [
    { id: 'safe', label: t('The safe', '금고'), keywords: ['safe', 'lock', 'locked', 'locking'] },
    { id: 'night', label: t('Last night', '간밤'), keywords: ['night', 'yesterday', 'where', 'watch'] },
    { id: 'inventory', label: t('The stock count', '재고'), keywords: ['inventory', 'stock', 'count', 'ampoule', 'ampoules'] },
    { id: 'keys', label: t('The keys', '열쇠'), keywords: ['key', 'keys'] },
    { id: 'trash', label: t('The galley bin', '주방 쓰레기통'), keywords: ['bin', 'trash', 'rubbish', 'waste'] },
    { id: 'medbay', label: t('The medbay', '의무실'), keywords: ['medbay', 'infirmary', 'sickbay'] },
  ],

  statements: [
    {
      id: 's_okafor_safe',
      personId: 'okafor',
      topicId: 'safe',
      text: t('I locked that safe at the end of my watch. I always do.', '당직 끝나고 그 금고는 내가 잠갔소. 늘 그렇게 하고.'),
      lie: true,
      refutedBy: ['r_door'],
    },
    {
      id: 's_okafor_night',
      personId: 'okafor',
      topicId: 'night',
      text: t('I did not leave the medbay all night. Ask anyone who came by.', '밤새 의무실을 안 떠났소. 들른 사람 아무한테나 물어보시오.'),
      lie: false,
      asserts: [{ personId: 'okafor', placeId: 'medbay', from: 0, to: 120 }],
    },
    {
      id: 's_okafor_inventory',
      personId: 'okafor',
      topicId: 'inventory',
      text: t('I counted the stock myself this morning. Nothing was short then.', '재고는 오늘 아침에 내가 직접 셌소. 그때는 모자란 게 없었고.'),
      lie: true,
      refutedBy: ['r_inventory'],
    },
    {
      id: 's_okafor_keys',
      personId: 'okafor',
      topicId: 'keys',
      text: t('There is one key to that safe and it hangs on my belt.', '그 금고 열쇠는 하나뿐이고, 내 허리띠에 걸려 있소.'),
      lie: true,
      refutedBy: ['r_door'],
    },
    {
      id: 's_reyes_trash',
      personId: 'reyes',
      topicId: 'trash',
      text: t('Somebody went through my bin before dawn. They left the lid off.', '동트기 전에 누가 내 쓰레기통을 뒤졌어요. 뚜껑도 안 닫아놨더라고요.'),
      lie: false,
      availableFrom: 30,
    },
    {
      id: 's_reyes_night',
      personId: 'reyes',
      topicId: 'night',
      text: t('Lind came in late, after the third bell, and stood by the kettle saying nothing.', '린드가 늦게, 세 번째 종 지나서 들어와서는 주전자 옆에 말없이 서 있었어요.'),
      lie: false,
      asserts: [{ personId: 'lind', placeId: 'galley', from: 70, to: 120 }],
    },
    {
      id: 's_lind_medbay',
      personId: 'lind',
      topicId: 'medbay',
      text: t('I never went near the medbay. I have no business up that end.', '의무실 근처엔 안 갔어요. 그쪽에 갈 일이 없어요.'),
      lie: true,
      refutedBy: ['e_bootprint'],
    },
    {
      id: 's_lind_night',
      personId: 'lind',
      topicId: 'night',
      text: t('I was in my bunk all night. Slept straight through the watch change.', '밤새 침상에 있었어요. 당직 교대도 모르고 내리 잤고요.'),
      lie: true,
      asserts: [{ personId: 'lind', placeId: 'bunks', from: 0, to: 120 }],
      refutedBy: ['e_bootprint', 's_reyes_night'],
    },
  ],

  evidence: [
    {
      id: 'e_safe',
      placeId: 'medbay',
      name: t('The open safe', '열린 금고'),
      description: t(
        'The drug safe stands open. The tray that held the analgesic box is empty, and the seal is not broken.',
        '약품 금고가 열려 있다. 진통제 상자가 놓여 있던 칸은 비었고, 봉인은 뜯긴 자국이 없다.',
      ),
    },
    {
      id: 'e_wrapper',
      placeId: 'galley',
      name: t('Foil scrap', '포장지 조각'),
      description: t('A scrap of foil near the top of the galley bin.', '주방 쓰레기통 위쪽에 은박 포장지 조각이 있다.'),
      availableFrom: 30,
      requiresCard: 's_reyes_trash',
      fullDescription: t(
        'A scrap of ampoule foil with the medbay lot number still legible, pushed down under last night\'s peelings at the bottom of the bin.',
        '앰플 은박 조각. 의무실 로트번호가 아직 읽히고, 어젯밤 껍질 밑 쓰레기통 바닥까지 눌러 박혀 있다.',
      ),
    },
    {
      id: 'e_bootprint',
      placeId: 'corridor',
      name: t('Boot print', '기름 발자국'),
      description: t(
        'One boot print in engine grease on the deck plate, pointing at the medbay hatch. The cleaning unit will reach it before dock.',
        '갑판 철판에 찍힌 기름 발자국 하나. 의무실 해치 쪽을 향해 있다. 정박 전에 청소 로봇이 여기까지 온다.',
      ),
      availableTo: 90,
      asserts: [{ personId: 'lind', placeId: 'corridor', from: 40, to: 70 }],
    },
    {
      id: 'e_locker',
      placeId: 'bunks',
      name: t('Lind\'s locker', '린드의 사물함'),
      description: t('Lind\'s locker, shut but not locked. A work sock on top of the pile.', '린드의 사물함. 닫혀 있지만 잠겨 있진 않다. 옷더미 위에 작업용 양말 한 짝.'),
      requiresCard: 'r_inventory',
      fullDescription: t(
        'Three analgesic ampoules rolled inside a sock at the back of the locker, lot numbers matching the medbay stock sheet.',
        '사물함 안쪽 양말 속에 진통제 앰플 세 개가 말려 들어가 있다. 로트번호가 의무실 재고표와 같다.',
      ),
    },
  ],

  records: [
    {
      id: 'r_inventory',
      title: t('Medbay stock sheet', '의무실 재고표'),
      body: t(
        'Analgesic ampoules: one box of twelve issued to the Marlow, twelve unaccounted for. Counted and signed at 22:00.',
        '진통제 앰플: 말로우호에 열두 개들이 한 상자 지급, 열두 개 전부 행방불명. 22시에 세고 서명함.',
      ),
      keywords: ['ampoule', 'inventory', 'medbay'],
    },
    {
      id: 'r_door',
      title: t('Corridor door log', '복도 도어 로그'),
      body: t(
        '02:40 — medbay hatch opened. No crew tag recorded. Safe interlock reported unlocked at the same minute.',
        '02시 40분, 의무실 해치 열림. 승무원 태그 기록 없음. 같은 분에 금고 인터록이 잠김 해제로 보고됨.',
      ),
      keywords: ['door', 'log', 'medbay'],
    },
    {
      id: 'r_message',
      title: t('Outgoing message, unsigned', '발신 메시지, 서명 없음'),
      body: t(
        '"I will pay you at the next port. Keep it off the ship\'s book." Queued from the bunk terminal at 01:12.',
        '"다음 항구에서 갚을게. 배 장부엔 올리지 마." 01시 12분, 침상 단말에서 발신 대기.',
      ),
      keywords: ['message', 'lind', 'debt'],
    },
  ],

  propositions: [
    {
      id: 'p_lind_moved',
      text: t('Lind left the bunks during the night.', '린드는 밤중에 침상을 떠났다.'),
      provedBy: [['s_reyes_night'], ['e_bootprint']],
      refutedBy: [],
    },
    {
      id: 'p_safe_open',
      text: t('The safe was not locked that night.', '그날 밤 금고는 잠겨 있지 않았다.'),
      provedBy: [['r_door']],
      refutedBy: [],
    },
    {
      id: 'p_lind_took',
      text: t('Lind took the ampoules.', '린드가 앰플을 가져갔다.'),
      provedBy: [['e_locker', 'r_inventory'], ['e_wrapper', 's_reyes_night']],
      refutedBy: ['s_lind_medbay'],
    },
    {
      id: 'p_okafor_took',
      text: t('Okafor took the ampoules.', '오카포가 앰플을 가져갔다.'),
      provedBy: [],
      refutedBy: ['s_okafor_night'],
    },
  ],

  methods: [
    { id: 'm_took', label: t('Took them from the open safe', '열린 금고에서 꺼냈다') },
    { id: 'm_swapped', label: t('Swapped them for a decoy box', '가짜 상자로 바꿔치기했다') },
  ],

  truth: {
    culpritId: 'lind',
    methodId: 'm_took',
    decisiveEvidenceId: 'e_locker',
    motive: t(
      'Debt. A message queued from the bunk terminal at 01:12 promised payment at the next port.',
      '빚. 01시 12분 침상 단말에서 다음 항구에 갚겠다는 메시지가 발신 대기 중이었다.',
    ),
    reveal: t(
      'Lind took the box out of a safe Okafor had forgotten to lock, dropped the foil in the galley bin on the way back, and slept out the rest of the watch with three ampoules in his locker.',
      '오카포가 잠그는 걸 잊은 금고에서 린드가 상자를 꺼냈다. 돌아오는 길에 은박은 주방 쓰레기통에 버렸고, 앰플 세 개는 사물함에 둔 채 남은 당직 시간을 잤다.',
    ),
    hook: t(
      'The signature at the bottom of the stock sheet was not Okafor\'s, and Okafor has not once asked whose it is.',
      '재고표 아래 서명은 오카포의 것이 아니었다. 그리고 오카포는 그게 누구 것인지 한 번도 묻지 않았다.',
    ),
  },

  tutorial: [
    {
      id: 'tut_start',
      when: { kind: 'start' },
      say: t(
        'Say hello to Watson and have him read the case. He starts on the map where you do.',
        '왓슨에게 인사하고 사건 개요를 읽게 하세요. 왓슨은 지도 위 당신과 같은 자리에서 시작합니다.',
      ),
      chip: t('Watson, read the case and tell me where to start.', '왓슨, 사건을 읽고 어디서 시작할지 말해줘.'),
    },
    {
      id: 'tut_medbay',
      when: { kind: 'moved', placeId: 'medbay' },
      say: t(
        'Click a person to see what they will talk about. Pick a topic and the answer goes into your notebook.',
        '인물을 클릭하면 무슨 화제를 꺼낼 수 있는지 보입니다. 화제를 고르면 대답이 수첩에 들어갑니다.',
      ),
    },
    {
      id: 'tut_first_card',
      when: { kind: 'card', cardId: 's_okafor_safe' },
      say: t(
        'That statement is on the board now. Keep walking, and send Watson into the ship\'s logs.',
        '그 진술이 수첩에 들어갔습니다. 당신은 계속 걷고, 문서는 왓슨에게 맡기세요.',
      ),
      chip: t('Watson, search the door logs for the medbay.', '왓슨, 의무실 도어 로그를 찾아줘.'),
    },
    {
      id: 'tut_records',
      when: { kind: 'card', cardId: 'r_door' },
      say: t(
        'Watson reports what the records say and nothing more. Let him take the galley while you take the corridor.',
        '왓슨은 기록에 있는 것만 말합니다. 복도는 당신이, 주방은 왓슨이 맡으세요.',
      ),
      chip: t('Watson, go to the galley and hear everything Reyes has to say.', '왓슨, 주방에 가서 레이예스 얘기를 다 들어줘.'),
    },
    {
      id: 'tut_conflict',
      when: { kind: 'card', cardId: 's_reyes_night' },
      say: t(
        'Two cards now put Lind in two places. Have Watson lay them side by side.',
        '이제 카드 두 장이 린드를 서로 다른 곳에 놓습니다. 왓슨에게 나란히 놓아보라고 하세요.',
      ),
      chip: t(
        'Watson, ask Lind where he was last night, then rebuild his timeline and cross-check him.',
        '왓슨, 린드에게 간밤에 어디 있었는지 묻고 시간표를 다시 짜서 대조해줘.',
      ),
    },
    {
      id: 'tut_theory',
      when: { kind: 'card', cardId: 'e_locker' },
      say: t(
        'You have enough for a hearing. Have Watson submit the theory and read the holes it comes back with.',
        '예비 심리를 걸 만큼 모였습니다. 왓슨에게 가설을 제출하게 하고 돌아온 구멍을 읽으세요.',
      ),
      chip: t('Watson, submit your theory: Lind took the ampoules.', '왓슨, 가설을 제출해줘. 린드가 앰플을 가져갔다고.'),
    },
    {
      id: 'tut_verdicts',
      when: { kind: 'theory' },
      say: t(
        'Read the verdicts. If nothing came back unsupported, the accusation is yours to make; Watson cannot make it.',
        '판정을 읽으세요. 근거 부족이 없다면 기소는 당신 몫입니다. 왓슨은 기소할 수 없습니다.',
      ),
    },
    {
      id: 'tut_recap',
      when: { kind: 'accused' },
      say: t(
        'The recap shows your route, the order the facts surfaced, and the time you never spent.',
        '회고 화면에 당신의 경로와 사실이 드러난 순서, 그리고 쓰지 않은 시간이 나옵니다.',
      ),
    },
  ],
};

// The golden path: one solved run inside the two hours, with Holmes walking and Watson
// doing the paperwork. Ends at minute 100 of 120. Used by tests/content-ep0.test.ts.
//
// Two steps of the plan's outline are deliberately absent, because the outline's own list
// costs 150 minutes against a 120 minute budget (6 moves 60 + 3 talks 15 + 3 examines 15
// + 2 searches 60):
//   - the second search_records ('ampoule inventory') is redundant: r_inventory carries the
//     keyword 'medbay', so the first search already brings the stock sheet back with the
//     door log;
//   - Holmes never walks to the galley; Watson, who is already standing there, examines
//     e_wrapper. That is the division of labour the tutorial is teaching anyway.
export const EP0_GOLDEN: ReadonlyArray<readonly ['holmes' | 'watson', Record<string, unknown>]> = [
  ['holmes', { kind: 'move', placeId: 'medbay' }],
  ['holmes', { kind: 'talk', personId: 'okafor', topicId: 'safe' }],
  ['holmes', { kind: 'move', placeId: 'corridor' }],
  ['holmes', { kind: 'examine', evidenceId: 'e_bootprint' }],
  ['watson', { kind: 'search_records', query: 'door log medbay' }],
  ['watson', { kind: 'move', placeId: 'galley' }],
  ['watson', { kind: 'talk', personId: 'reyes', topicId: 'night' }],
  ['watson', { kind: 'talk', personId: 'reyes', topicId: 'trash' }],
  ['watson', { kind: 'examine', evidenceId: 'e_wrapper' }],
  ['holmes', { kind: 'move', placeId: 'bunks' }],
  ['holmes', { kind: 'examine', evidenceId: 'e_locker' }],
  ['watson', { kind: 'submit_theory', claims: [{ claim: 'p_lind_took', evidence_ids: ['e_locker', 'r_inventory'] }] }],
] as const;
