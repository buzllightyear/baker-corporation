// content/ep1-sensor.ts — Episode 1, "The Sensor in the Night"
//
// Timebase: the run clock starts at 23:30, twenty minutes after the body was
// found. Minute 0 = 23:30, minute 450 = 07:00 (docking). Anything that happened
// on the night of the death therefore sits at a NEGATIVE minute: 22:00 = -90,
// 22:38 = -52, 22:40 = -50, 23:05 = -25, 23:10 = -20. `presence` (where a living
// crew member can be found and talked to) stays inside [0, 450]; `asserts`
// (claims about where somebody was) reach back before 0.
import type { Episode } from './types';

const t = (en: string, ko: string) => ({ en, ko });

export const EP1: Episode = {
  id: 'ep1',
  title: t('The Sensor in the Night', '밤의 센서'),
  series: t('The Baker Corporation', '베이커 사'),
  brief: t(
    'Freighter Marlow, seven and a half hours out from Ceres Reach. At 23:10 the cook found cargo master Haldane face down in bay 3 with a single wound at the base of the skull. The bay 3 pressure sensor wrote nothing between 22:40 and 23:05 — twenty-five minutes of a ship that does not exist. Nine crew, no port authority until dawn, and you are the only investigator aboard who is not also a suspect.',
    '화물선 말로우, 세레스 리치 입항까지 일곱 시간 반. 23시 10분, 요리사가 화물칸 3에서 화물 관리관 하들레인을 발견했다. 엎드린 자세, 뒤통수 아래 상처 하나. 화물칸 3의 압력 센서는 22시 40분부터 23시 5분까지 아무것도 기록하지 않았다. 배가 존재하지 않았던 25분이다. 승무원 아홉, 항만 당국은 날이 밝아야 오고, 이 배에서 용의자가 아닌 조사관은 당신뿐이다.',
  ),
  startPlaceId: 'bridge',
  watsonStartPlaceId: 'corridor_a',
  budgetMinutes: 450,
  clockLabel: (m) => {
    const x = (((23 * 60 + 30 + m) % 1440) + 1440) % 1440;
    return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
  },

  places: [
    {
      id: 'bridge',
      name: t('Bridge', '함교'),
      description: t(
        'Three consoles, two of them dark. The docking countdown runs in the corner of every screen whether you want it or not.',
        '콘솔 셋, 그중 둘은 꺼져 있다. 원하든 원치 않든 모든 화면 구석에서 입항 카운트다운이 돈다.',
      ),
      adjacent: ['corridor_a', 'airlock'],
    },
    {
      id: 'corridor_a',
      name: t('Forward corridor', '앞쪽 복도'),
      description: t(
        'The forward spine. Medbay to port, galley to starboard, the aft corridor straight on. Every door in this ship logs itself, and every log is one deck below.',
        '앞쪽 척추. 좌현에 의무실, 우현에 주방, 곧장 가면 뒤쪽 복도. 이 배의 문은 전부 스스로를 기록하고, 그 기록은 전부 한 층 아래에 있다.',
      ),
      adjacent: ['bridge', 'medbay', 'galley', 'corridor_b'],
    },
    {
      id: 'medbay',
      name: t('Medbay', '의무실'),
      description: t(
        'Two bunks, one occupied by a sheet with a shape under it. The drug cabinet is the only thing aboard with a lock the doctor trusts.',
        '침상 둘, 그중 하나는 천을 덮은 형체가 차지했다. 이 배에서 선의가 신뢰하는 자물쇠는 약품장 하나뿐이다.',
      ),
      adjacent: ['corridor_a'],
    },
    {
      id: 'galley',
      name: t('Galley', '주방'),
      description: t(
        'Warm, and the only warm place aboard. The wall clock has been four minutes fast for a week and nobody has fixed it.',
        '따뜻하다. 이 배에서 따뜻한 곳은 여기뿐이다. 벽시계는 일주일째 4분 빠르고 아무도 고치지 않았다.',
      ),
      adjacent: ['corridor_a'],
    },
    {
      id: 'corridor_b',
      name: t('Aft corridor', '뒤쪽 복도'),
      description: t(
        'Grated deck, hydraulic lines overhead, a slow drip that has been there for years. Engine room aft, bay 3 to port, crew quarters to starboard.',
        '격자 바닥, 머리 위 유압 배관, 몇 년째 그대로인 느린 물방울. 뒤로 기관실, 좌현에 화물칸 3, 우현에 거주 구역.',
      ),
      adjacent: ['corridor_a', 'engine', 'cargo3', 'quarters'],
    },
    {
      id: 'engine',
      name: t('Engine room', '기관실'),
      description: t(
        'Loud enough that people shout and nobody remembers what was said. Lind keeps it tidier than the rest of the ship deserves.',
        '사람들이 소리를 질러야 하고 무슨 말을 했는지는 아무도 기억 못 할 만큼 시끄럽다. 린드는 이 배가 받을 자격보다 여기를 깨끗이 유지한다.',
      ),
      adjacent: ['corridor_b'],
    },
    {
      id: 'cargo3',
      name: t('Cargo bay 3', '화물칸 3'),
      description: t(
        'Sealed freight, stacked two high, cold enough to see your breath. The pressure sensor sits in a housing by the inner hatch, and it is the reason you are here.',
        '봉인 화물이 두 단으로 쌓여 있고 입김이 보일 만큼 춥다. 압력 센서는 안쪽 해치 옆 함체에 있고, 당신이 여기 있는 이유가 그것이다.',
      ),
      adjacent: ['corridor_b'],
    },
    {
      id: 'quarters',
      name: t('Crew quarters', '거주 구역'),
      description: t(
        'Nine bunks, six curtains drawn. Private space aboard a freighter means a curtain and an unwritten rule.',
        '침상 아홉, 그중 여섯은 커튼이 쳐져 있다. 화물선에서 사적 공간이란 커튼 한 장과 불문율을 뜻한다.',
      ),
      adjacent: ['corridor_b'],
    },
    {
      id: 'airlock',
      name: t('Airlock', '에어록'),
      description: t(
        'The outer hatch, its coaming furred with frost. The inner panel says the last cycle was at Titan, eleven days ago.',
        '바깥 해치, 테두리에 성에가 앉았다. 안쪽 패널은 마지막 개폐가 11일 전 타이탄에서였다고 말한다.',
      ),
      adjacent: ['bridge'],
    },
  ],

  people: [
    {
      id: 'vance', name: t('Captain Iris Vance', '아이리스 밴스 선장'), role: t('Master of the Marlow', '말로우 선장'), portrait: '🎖️', truthful: false,
      blurb: t(
        'Twenty years on the Ceres run, and signs every manifest that leaves this ship.',
        '세레스 항로 이십 년, 이 배에서 나가는 모든 화물 명세에 서명한다.',
      ),
    },
    {
      id: 'okafor', name: t('Dr. Ada Okafor', '아다 오카포 선의'), role: t('Ship’s doctor', '선의'), portrait: '⚕️', truthful: false,
      blurb: t(
        'Runs the medbay alone, and wrote the only account of the body anyone will read.',
        '의무실을 혼자 맡고, 누구든 읽게 될 시신에 관한 유일한 기록을 썼다.',
      ),
    },
    {
      id: 'lind', name: t('Teo Lind', '테오 린드'), role: t('Engineer', '기관사'), portrait: '🔧', truthful: false,
      blurb: t(
        'Holds the maintenance codes for every sensor and hatch between the bridge and bay 3.',
        '함교에서 화물칸 3까지, 모든 센서와 해치의 정비 코드를 쥐고 있다.',
      ),
    },
    {
      id: 'sato', name: t('Kei Sato', '케이 사토'), role: t('Navigator', '항해사'), portrait: '🧭', truthful: false,
      blurb: t(
        'Plots the course, keeps the bridge log, and has been off the watch rotation for a week.',
        '항로를 짜고 함교 일지를 쓰며, 일주일째 당직 순번에서 빠져 있다.',
      ),
    },
    {
      id: 'reyes', name: t('Mara Reyes', '마라 레예스'), role: t('Cook', '요리사'), portrait: '🍲', truthful: true,
      blurb: t(
        'Found the body at 23:10, on her way to lock the galley down for the night.',
        '밤에 주방을 잠그러 가던 23시 10분, 시신을 발견했다.',
      ),
    },
  ],

  intro: {
    cards: [
      {
        title: t('Seven and a half hours out', '입항까지 일곱 시간 반'),
        image: '/art/rooms/bridge.jpg',
        body: t(
          'The Marlow is seven and a half hours from Ceres Reach with nine aboard and no port authority until dawn. Between here and there the ship is its own jurisdiction, and its own witness.',
          '말로우는 세레스 리치까지 일곱 시간 반, 아홉 명이 타고 있고 날이 밝기 전에는 항만 당국도 오지 않는다. 그때까지 이 배는 스스로 관할이고, 스스로 증인이다.',
        ),
      },
      {
        title: t('Bay 3, 23:10', '화물칸 3, 23시 10분'),
        image: '/art/rooms/cargo3.jpg',
        body: t(
          'At 23:10 the cook found cargo master Haldane face down in bay 3, one wound at the base of the skull. The bay 3 pressure sensor recorded nothing from 22:40 to 23:05. Twenty-five minutes of a ship that did not exist.',
          '23시 10분, 요리사가 화물칸 3에서 화물 관리관 하들레인을 발견했다. 엎드린 자세, 뒤통수 아래 상처 하나. 화물칸 3의 압력 센서는 22시 40분부터 23시 5분까지 아무것도 기록하지 않았다. 배가 존재하지 않았던 25분이다.',
        ),
      },
      {
        title: t('The crew', '승무원'),
        showCrew: true,
        body: t(
          'Five of the crew will speak with you. Every one of them was somewhere at 22:40, and every one of them would rather you heard it from them first.',
          '승무원 다섯이 당신과 이야기할 것이다. 22시 40분에 모두 어딘가에 있었고, 모두 그 얘기를 자기 입으로 먼저 하고 싶어 한다.',
        ),
      },
      {
        title: t('Your posting', '당신의 배치'),
        image: '/art/portraits/watson.jpg',
        body: t(
          'You are the investigator Baker Corp sent. Watson is the service unit they issued you.',
          '당신은 베이커 사가 보낸 조사관입니다. 왓슨은 그들이 당신에게 지급한 업무용 유닛입니다.',
        ),
      },
    ],
  },

  presence: [
    { personId: 'sato', placeId: 'bridge', from: 0, to: 60 },
    { personId: 'sato', placeId: 'quarters', from: 60, to: 150 },
    { personId: 'sato', placeId: 'bridge', from: 150, to: 450 },
    { personId: 'lind', placeId: 'engine', from: 0, to: 200 },
    { personId: 'lind', placeId: 'galley', from: 200, to: 450 },
    { personId: 'okafor', placeId: 'medbay', from: 0, to: 450 },
    { personId: 'vance', placeId: 'bridge', from: 0, to: 120 },
    { personId: 'vance', placeId: 'quarters', from: 120, to: 450 },
    { personId: 'reyes', placeId: 'galley', from: 0, to: 300 },
    { personId: 'reyes', placeId: 'quarters', from: 300, to: 450 },
  ],

  topics: [
    { id: 'night', label: t('That night', '그날 밤'), keywords: ['night', 'where', 'when', 'alarm'] },
    { id: 'haldane', label: t('Haldane', '하들레인'), keywords: ['haldane', 'victim', 'master'] },
    { id: 'cargo3', label: t('Cargo bay 3', '화물칸 3'), keywords: ['cargo', 'bay', 'hold', 'three'] },
    { id: 'sensor', label: t('The pressure sensor', '압력 센서'), keywords: ['sensor', 'pressure', 'gap', 'recording'] },
    { id: 'maint_code', label: t('Engineering codes', '기관 코드'), keywords: ['code', 'maintenance', 'override', 'lnd'] },
    { id: 'body', label: t('The body', '시신'), keywords: ['body', 'found', 'wound', 'discovery'] },
    { id: 'schedule', label: t('The voyage plan', '항해 일정'), keywords: ['schedule', 'voyage', 'plan', 'dock'] },
    { id: 'manifest', label: t('The manifest', '화물 명세'), keywords: ['manifest', 'freight', 'crates', 'inventory'] },
    { id: 'smuggling', label: t('Private freight', '개인 화물'), keywords: ['smuggling', 'contraband', 'private', 'goods'] },
    { id: 'crew', label: t('The crew', '승무원'), keywords: ['crew', 'everyone', 'people', 'suspect'] },
    { id: 'death_time', label: t('Time of death', '사망 시각'), keywords: ['death', 'time', 'coroner', 'autopsy'] },
    { id: 'seals', label: t('Seal tape', '봉인 테이프'), keywords: ['seal', 'seals', 'tape', 'roll'] },
    { id: 'airlock', label: t('The airlock', '에어록'), keywords: ['airlock', 'hatch', 'outer', 'vacuum'] },
    { id: 'share', label: t('Who gave what to whom', '누가 무엇을 건넸나'), keywords: ['share', 'gave', 'told', 'borrowed'] },
  ],

  // 70 statements — five people × fourteen topics. The count is set by authoring
  // rule R7: exhaustive interrogation has to cost about 1.6× the 450-minute
  // budget, so the investigator must choose roughly half of it.
  statements: [
    // ── Captain Vance — lies twice, both to bury an unlogged schedule change ──
    { id: 's_vance_night', personId: 'vance', topicId: 'night', lie: false,
      text: t('I had the bridge until midnight. Sato was up there with me, then stepped out about half past ten and came back near half eleven.', '자정까지 함교는 내가 지켰습니다. 사토도 같이 있었는데, 10시 반쯤 나갔다가 11시 반 다 돼서 돌아왔어요.'),
      asserts: [{ personId: 'vance', placeId: 'bridge', from: -90, to: -20 }, { personId: 'sato', placeId: 'bridge', from: -90, to: -59 }] },
    { id: 's_vance_haldane', personId: 'vance', topicId: 'haldane', lie: false,
      text: t('Haldane kept the hold and kept his own counsel. A good officer and poor company, in that order.', '하들레인은 화물칸을 지켰고 속을 안 보였습니다. 좋은 사관이고 나쁜 말동무였죠. 순서대로.') },
    { id: 's_vance_cargo3', personId: 'vance', topicId: 'cargo3', lie: false,
      text: t('Bay 3 is sealed freight. Two keys aboard: his and mine.', '화물칸 3은 봉인 화물입니다. 배에 열쇠는 둘, 그 사람 것과 내 것.') },
    { id: 's_vance_sensor', personId: 'vance', topicId: 'sensor', lie: false,
      text: t('If a sensor stops writing, that is an engineering fault, and engineering answers for it. Not command.', '센서가 기록을 멈추면 그건 기관 쪽 고장이고, 책임도 기관이 집니다. 지휘부가 아니라.') },
    { id: 's_vance_maint_code', personId: 'vance', topicId: 'maint_code', lie: false,
      text: t('I do not carry engineering codes. Command has no use for them and no excuse for having them.', '나는 기관 코드를 안 갖고 다닙니다. 지휘부엔 쓸 일도 없고, 갖고 있을 명분도 없어요.') },
    { id: 's_vance_body', personId: 'vance', topicId: 'body', lie: false,
      text: t('Reyes found him at ten past eleven and called me before she called the doctor. I have thought about that ordering all night.', '레예스가 11시 10분에 발견하고 선의보다 나한테 먼저 연락했습니다. 그 순서를 밤새 생각하고 있어요.') },
    { id: 's_vance_schedule', personId: 'vance', topicId: 'schedule', lie: true,
      text: t('The voyage plan has not been touched since we left Titan.', '항해 일정은 타이탄을 떠난 뒤로 손댄 적 없습니다.'),
      refutedBy: ['e_nav_tablet', 'r_nav_amend'] },
    { id: 's_vance_manifest', personId: 'vance', topicId: 'manifest', lie: true,
      text: t('I sign every manifest myself, and I signed that one.', '명세서는 내가 전부 직접 서명합니다. 그것도 내가 했어요.'),
      refutedBy: ['r_manifest'] },
    { id: 's_vance_smuggling', personId: 'vance', topicId: 'smuggling', lie: false,
      text: t('If anything private is riding in that hold, nobody told the captain, which is how these things are usually arranged.', '개인 물건이 저 화물칸에 실렸다면 선장한테는 아무도 말 안 했다는 뜻이죠. 원래 그렇게들 합니다.') },
    { id: 's_vance_crew', personId: 'vance', topicId: 'crew', lie: false,
      text: t('Nine crew, seven years, no incidents. I will not hand you a suspect to make your night shorter.', '승무원 아홉, 7년, 사고 없음. 당신 밤을 줄여주자고 용의자를 넘겨주진 않겠습니다.') },
    { id: 's_vance_death_time', personId: 'vance', topicId: 'death_time', lie: false,
      text: t('The doctor gave me five past eleven. I wrote it in the log and I had no reason to argue with her.', '선의가 11시 5분이라고 했습니다. 항해일지에 그대로 적었고, 반박할 이유가 없었어요.') },
    { id: 's_vance_seals', personId: 'vance', topicId: 'seals', lie: false,
      text: t('Seal tape is issued from the hold locker and signed out by the roll. Haldane signed for the current one.', '봉인 테이프는 화물칸 사물함에서 롤 단위로 불출하고 서명합니다. 지금 롤은 하들레인이 서명했어요.') },
    { id: 's_vance_airlock', personId: 'vance', topicId: 'airlock', lie: false,
      text: t('The outer hatch has not cycled since Titan. Read the panel yourself; it is the one instrument aboard nobody bothers to lie to.', '바깥 해치는 타이탄 이후로 안 열렸습니다. 패널을 직접 보세요. 이 배에서 아무도 거짓말할 생각을 안 하는 유일한 계기니까.') },
    { id: 's_vance_share', personId: 'vance', topicId: 'share', lie: false,
      text: t('I share nothing that opens a door. Neither should anyone else aboard.', '문을 여는 건 아무것도 남한테 안 넘깁니다. 이 배 누구도 그래선 안 되고.') },

    // ── Dr. Okafor — lies twice, to keep a relationship and a late certificate ──
    { id: 's_okafor_night', personId: 'okafor', topicId: 'night', lie: false,
      text: t('I was in the medbay from twenty-two hundred. I did not leave it until the call came.', '22시부터 의무실에 있었습니다. 연락 올 때까지 나가지 않았고요.'),
      asserts: [{ personId: 'okafor', placeId: 'medbay', from: -90, to: 0 }] },
    { id: 's_okafor_haldane', personId: 'okafor', topicId: 'haldane', lie: true,
      text: t('Haldane and I spoke about supplies. Nothing else.', '하들레인과는 보급 얘기만 했습니다. 그 외엔 없어요.'),
      refutedBy: ['r_msg_okafor_haldane'] },
    { id: 's_okafor_cargo3', personId: 'okafor', topicId: 'cargo3', lie: false,
      text: t('I have no business in the hold. Cold, loud, and nothing in it bleeds.', '화물칸엔 볼일이 없습니다. 춥고 시끄럽고, 거기엔 피 흘리는 게 없으니까.') },
    { id: 's_okafor_sensor', personId: 'okafor', topicId: 'sensor', lie: false,
      text: t('Medical does not read cargo sensors. I read one instrument and it stopped an hour ago.', '의무실은 화물 센서를 안 봅니다. 내가 보는 계기는 하나고, 그건 한 시간 전에 멈췄어요.') },
    { id: 's_okafor_maint_code', personId: 'okafor', topicId: 'maint_code', lie: false,
      text: t('Mine opens the drug cabinet and nothing else. It is four digits and I change it every voyage.', '내 코드는 약품장만 엽니다. 네 자리고, 항해마다 바꿔요.') },
    { id: 's_okafor_body', personId: 'okafor', topicId: 'body', lie: false,
      text: t('Blunt trauma, base of the skull, one blow, downward. He was unconscious before he reached the deck.', '둔기 외상, 두개저부, 한 번, 위에서 아래로. 바닥에 닿기 전에 의식을 잃었습니다.') },
    { id: 's_okafor_schedule', personId: 'okafor', topicId: 'schedule', lie: false,
      text: t('Docking time matters to me for one reason: the body has to be handed over the way I received it.', '입항 시각이 나한테 중요한 이유는 하나입니다. 시신을 받은 상태 그대로 넘겨야 하니까.') },
    { id: 's_okafor_manifest', personId: 'okafor', topicId: 'manifest', lie: false,
      text: t('Medical stores run on a separate manifest. Mine balances, and I would rather you checked it than asked me about it.', '의료품은 별도 명세로 관리합니다. 내 쪽은 맞아떨어져요. 물어보느니 직접 대조하시는 편이 낫습니다.') },
    { id: 's_okafor_smuggling', personId: 'okafor', topicId: 'smuggling', lie: false,
      text: t('People bring things aboard. I stopped asking what in my second year.', '사람들은 뭔가를 싣고 옵니다. 나는 2년 차에 묻는 걸 그만뒀어요.') },
    { id: 's_okafor_crew', personId: 'okafor', topicId: 'crew', lie: false,
      text: t('Lind talks. Sato does not. That is the whole of what I will say about the crew.', '린드는 말이 많고 사토는 말이 없습니다. 승무원에 대해 할 말은 그게 전부예요.') },
    { id: 's_okafor_death_time', personId: 'okafor', topicId: 'death_time', lie: true, availableFrom: 60,
      text: t('He died at twenty-three oh five. No earlier.', '사망은 23시 5분입니다. 그보다 이르지 않아요.'),
      refutedBy: ['e_bruise', 'r_coroner'] },
    { id: 's_okafor_seals', personId: 'okafor', topicId: 'seals', lie: false,
      text: t('There was adhesive on his sleeve as well. I noted it and I did not photograph it, which I now regret.', '그 사람 소매에도 점착제가 묻어 있었습니다. 기록만 하고 사진은 안 찍었어요. 지금은 후회합니다.') },
    { id: 's_okafor_airlock', personId: 'okafor', topicId: 'airlock', lie: false,
      text: t('Nobody met vacuum tonight. His lungs are intact and his blood is where blood should be.', '오늘 밤 진공에 노출된 사람은 없습니다. 폐는 온전하고 혈액도 있어야 할 자리에 있어요.') },
    { id: 's_okafor_share', personId: 'okafor', topicId: 'share', lie: false,
      text: t('I told the captain what he needed and not one word more. That is not obstruction, it is medicine.', '선장에게는 필요한 것만 말하고 한 마디도 더 하지 않았습니다. 방해가 아니라 의료예요.') },

    // ── Lind — the loudest liar aboard. Four lies, all to bury a leaked code ──
    { id: 's_lind_night', personId: 'lind', topicId: 'night', lie: true,
      text: t('Engine room, all night, alone. I spoke to nobody and nobody spoke to me.', '기관실, 밤새, 혼자. 아무한테도 말 안 걸었고 아무도 나한테 안 걸었어요.'),
      asserts: [{ personId: 'lind', placeId: 'engine', from: -90, to: 30 }],
      refutedBy: ['r_msg_lind_sato'] },
    { id: 's_lind_haldane', personId: 'lind', topicId: 'haldane', lie: false,
      text: t('Haldane wrote me up twice this year over the coolant log. We were not friends and I am not going to pretend otherwise tonight.', '하들레인은 올해만 냉각수 기록 건으로 나를 두 번 걸었어요. 친하지 않았고, 오늘 밤이라고 친한 척할 생각도 없습니다.') },
    { id: 's_lind_cargo3', personId: 'lind', topicId: 'cargo3', lie: false,
      text: t('I service bay 3 twice a voyage. Last time was four days ago and I logged it properly, which you can check.', '화물칸 3은 항해당 두 번 정비합니다. 마지막이 나흘 전이고 기록도 제대로 남겼어요. 확인해보셔도 됩니다.') },
    { id: 's_lind_sensor', personId: 'lind', topicId: 'sensor', lie: true,
      text: t('That sensor has been dropping out for weeks. It does it on its own. Old housing, bad seat, cold bay — it will do it again before dawn.', '그 센서는 몇 주째 계속 끊깁니다. 저절로 그래요. 함체가 낡았고 자리가 안 맞고 화물칸은 춥고. 날 밝기 전에 또 끊길걸요.'),
      refutedBy: ['r_maint_log', 'e_sensor_panel'] },
    { id: 's_lind_maint_code', personId: 'lind', topicId: 'maint_code', lie: false,
      text: t('LND-7 is mine. Engineering codes are issued one to a person, and there is exactly one engineer aboard.', 'LND-7은 제 겁니다. 기관 코드는 한 사람당 하나씩 발급되고, 이 배 기관사는 딱 한 명이에요.') },
    { id: 's_lind_body', personId: 'lind', topicId: 'body', lie: false,
      text: t('I did not see him. I heard the call on the intercom like everyone else and I stayed where I was.', '못 봤습니다. 다들처럼 인터컴으로 들었고, 있던 자리에 그대로 있었어요.') },
    { id: 's_lind_schedule', personId: 'lind', topicId: 'schedule', lie: false,
      text: t('Ask the captain about the plan. I burn what I am told to burn and I have burned eleven hours more than the plan says.', '일정은 선장한테 물으세요. 저는 태우라는 만큼 태웁니다. 그리고 일정표보다 열한 시간어치를 더 태웠어요.') },
    { id: 's_lind_manifest', personId: 'lind', topicId: 'manifest', lie: false,
      text: t('I sign for parts, not freight. Different book, different locker, different officer.', '저는 부품에 서명하지 화물엔 안 합니다. 장부도 사물함도 담당 사관도 다 달라요.') },
    { id: 's_lind_smuggling', personId: 'lind', topicId: 'smuggling', lie: false,
      text: t('Half this crew brings something home. It has never once been my business what.', '이 배 절반은 뭔가를 집에 가져갑니다. 그게 뭔지는 한 번도 제 일이었던 적이 없어요.') },
    { id: 's_lind_crew', personId: 'lind', topicId: 'crew', lie: true,
      text: t('Nobody on this ship has asked me for an override in a year. Not one person, not once.', '이 배에서 저한테 오버라이드를 요청한 사람은 1년 동안 없었습니다. 한 사람도, 한 번도.'),
      refutedBy: ['r_msg_lind_sato'] },
    { id: 's_lind_death_time', personId: 'lind', topicId: 'death_time', lie: false,
      text: t('Whatever the doctor wrote. I was not there and I am not going to guess for you.', '선의가 적은 대로겠죠. 저는 거기 없었고, 대신 추측해드리진 않겠습니다.') },
    { id: 's_lind_seals', personId: 'lind', topicId: 'seals', lie: false,
      text: t('Seal tape lives in the hold locker. I do not carry it and it does not stick to anything I own.', '봉인 테이프는 화물칸 사물함에 있습니다. 저는 안 갖고 다니고, 제 물건엔 붙을 일도 없어요.') },
    { id: 's_lind_airlock', personId: 'lind', topicId: 'airlock', lie: false,
      text: t('The outer hatch draws off my board. It did not draw tonight, and a hatch cycle is not something you can hide from a power bus.', '바깥 해치는 제 반에서 전력을 끌어갑니다. 오늘 밤엔 안 끌었어요. 해치 개폐는 전력 버스한테 숨길 수 있는 게 아닙니다.') },
    { id: 's_lind_share', personId: 'lind', topicId: 'share', lie: true, availableFrom: 200,
      text: t('I have never given my code to anyone. Not once, not to a captain, not to a friend.', '제 코드를 누구한테도 준 적 없습니다. 한 번도요. 선장한테도, 친구한테도.'),
      refutedBy: ['e_code_note', 'r_msg_lind_sato'] },

    // ── Sato — the culprit. Exactly one lie, and it is about the night ──
    { id: 's_sato_night', personId: 'sato', topicId: 'night', lie: true,
      text: t('I was on the bridge from twenty-two hundred until the alarm.', '22시부터 경보가 울릴 때까지 함교에 있었습니다.'),
      asserts: [{ personId: 'sato', placeId: 'bridge', from: -90, to: -20 }],
      refutedBy: ['e_boot', 'r_door_cargo3', 's_reyes_night'] },
    { id: 's_sato_haldane', personId: 'sato', topicId: 'haldane', lie: false,
      text: t('He kept a ledger. He liked writing people down more than he liked talking to them.', '그 사람은 장부를 썼습니다. 사람과 말하는 것보다 사람을 적어두는 걸 좋아했어요.') },
    { id: 's_sato_cargo3', personId: 'sato', topicId: 'cargo3', lie: false,
      text: t('Bay 3 was his. Everything in it was his to write down and nothing in it was his to own.', '화물칸 3은 그 사람 구역이었습니다. 안에 있는 건 전부 그가 적을 수 있었고, 아무것도 그의 소유는 아니었죠.') },
    { id: 's_sato_sensor', personId: 'sato', topicId: 'sensor', lie: false,
      text: t('A sensor that stops writing is a sensor somebody stopped. Instruments do not develop opinions about which minutes to keep.', '기록을 멈춘 센서는 누군가 멈춘 센서입니다. 계기가 어느 분을 남길지 취향을 갖진 않으니까요.') },
    { id: 's_sato_maint_code', personId: 'sato', topicId: 'maint_code', lie: false,
      text: t('Navigation has no codes for the hold. We have codes for the stars, which nobody wants to steal.', '항해부는 화물칸 코드를 안 갖습니다. 우리 코드는 별에 관한 거고, 그건 아무도 훔치려 하지 않죠.') },
    { id: 's_sato_body', personId: 'sato', topicId: 'body', lie: false,
      text: t('I saw him after they moved him. Face down is how she found him, head turned the wrong way for a fall.', '옮긴 뒤에 봤습니다. 발견 당시엔 엎드린 자세였고, 넘어진 사람 치고는 머리가 잘못된 방향이었어요.') },
    { id: 's_sato_schedule', personId: 'sato', topicId: 'schedule', lie: false,
      text: t('We are eleven hours late and the plan says we are not. I am the navigator; I notice.', '우리는 열한 시간 늦었는데 일정표는 아니라고 합니다. 저는 항해사예요. 그런 건 압니다.') },
    { id: 's_sato_manifest', personId: 'sato', topicId: 'manifest', lie: false,
      text: t('Read the manifest for bay 3. Then count what is actually in it. The difference is the case, not me.', '화물칸 3 명세서를 보세요. 그다음에 실제로 뭐가 들었는지 세보시고요. 그 차이가 사건이지, 제가 아닙니다.') },
    { id: 's_sato_smuggling', personId: 'sato', topicId: 'smuggling', lie: false,
      text: t('Everybody carries something home. Mine would not be worth a man’s neck, whatever the ledger says.', '다들 뭔가를 집에 가져갑니다. 제 것은 사람 목숨값은 아니에요. 장부가 뭐라고 적었든.') },
    { id: 's_sato_crew', personId: 'sato', topicId: 'crew', lie: false,
      text: t('Lind will talk to you for an hour and tell you nothing. That is not guilt, that is Lind.', '린드는 한 시간을 떠들고도 아무것도 말 안 할 겁니다. 그건 죄가 아니라 그냥 린드예요.') },
    { id: 's_sato_death_time', personId: 'sato', topicId: 'death_time', lie: false,
      text: t('The doctor’s number is half an hour late. Ask her why, and watch her hands when you do.', '선의가 적은 시각은 30분 늦습니다. 이유를 물어보세요. 물을 때 손을 보시고요.') },
    { id: 's_sato_seals', personId: 'sato', topicId: 'seals', lie: false,
      text: t('Seal tape is a hold item. I have never signed for a roll in six years aboard.', '봉인 테이프는 화물칸 물품입니다. 6년 타면서 롤에 서명한 적 없어요.') },
    { id: 's_sato_airlock', personId: 'sato', topicId: 'airlock', lie: false,
      text: t('The hatch is on the captain’s board, not mine. If it had cycled we would all be reading about it.', '해치는 선장 반에 있지 제 것이 아닙니다. 열렸다면 우리 전부가 그 기록을 읽고 있겠죠.') },
    { id: 's_sato_share', personId: 'sato', topicId: 'share', lie: false,
      text: t('I ask for what I need. People give it or they do not; I have never had to press anybody.', '필요한 건 부탁합니다. 주든 안 주든이죠. 누굴 압박해본 적은 없어요.') },

    // ── Reyes — the one truthful witness. No lies at all ──
    { id: 's_reyes_night', personId: 'reyes', topicId: 'night', lie: false, availableFrom: 60,
      text: t('I was closing the galley. Sato went past the door heading aft, twenty to eleven or near enough — I had just pulled the trays.', '주방을 정리하고 있었어요. 사토가 문 앞을 지나 뒤쪽으로 갔습니다. 11시 20분 전쯤, 그 언저리요. 마침 트레이를 막 뺐을 때라.'),
      asserts: [{ personId: 'reyes', placeId: 'galley', from: -90, to: 0 }, { personId: 'sato', placeId: 'corridor_a', from: -58, to: -55 }] },
    { id: 's_reyes_haldane', personId: 'reyes', topicId: 'haldane', lie: false,
      text: t('He ate late and alone. Same tray every night for six years, and he always brought it back washed.', '늦게, 혼자 먹었어요. 6년 동안 매일 밤 같은 트레이였고, 늘 씻어서 갖다 놨습니다.') },
    { id: 's_reyes_cargo3', personId: 'reyes', topicId: 'cargo3', lie: false,
      text: t('I went down to bay 3 for crates of flour. That is how I found him. I have not been back.', '밀가루 상자 가지러 화물칸 3에 내려갔어요. 그러다 발견한 겁니다. 그 뒤로 안 갔고요.') },
    { id: 's_reyes_sensor', personId: 'reyes', topicId: 'sensor', lie: false,
      text: t('I would not know a sensor from a light switch. I know the bay was quiet, and it is never quiet.', '센서랑 전등 스위치도 구분 못 해요. 다만 화물칸이 조용했다는 건 압니다. 거긴 조용한 적이 없거든요.') },
    { id: 's_reyes_maint_code', personId: 'reyes', topicId: 'maint_code', lie: false,
      text: t('Lind reads his code out loud when he is tired. I have heard it twice and I could not tell you it now.', '린드는 피곤하면 자기 코드를 소리 내서 읽어요. 두 번 들었는데 지금은 기억 안 납니다.') },
    { id: 's_reyes_body', personId: 'reyes', topicId: 'body', lie: false,
      text: t('Ten past eleven. His hands were already cold when I touched them, and the galley is two decks warmer.', '11시 10분이요. 손을 만졌을 때 벌써 차가웠어요. 주방은 거기보다 두 층은 더 따뜻한데.') },
    { id: 's_reyes_schedule', personId: 'reyes', topicId: 'schedule', lie: false,
      text: t('I cook to the clock on the galley wall. It has been four minutes fast for a week and nobody will let me fix it.', '주방 벽시계에 맞춰서 요리해요. 일주일째 4분 빠른데 아무도 못 고치게 합니다.') },
    { id: 's_reyes_manifest', personId: 'reyes', topicId: 'manifest', lie: false,
      text: t('My stores are twelve crates. The manifest says fourteen. I have said so at every port and nobody writes it down.', '제 재고는 열두 상자예요. 명세서는 열넷이라고 하고요. 기항할 때마다 말했는데 아무도 안 적습니다.') },
    { id: 's_reyes_smuggling', personId: 'reyes', topicId: 'smuggling', lie: false,
      text: t('There are two crates in bay 3 that nobody eats and nobody burns. I noticed them at Titan.', '화물칸 3에 아무도 먹지 않고 아무도 태우지 않는 상자가 둘 있어요. 타이탄에서 봤습니다.') },
    { id: 's_reyes_crew', personId: 'reyes', topicId: 'crew', lie: false,
      text: t('Ask me who is kind and I can answer. Ask me who is guilty and I will only waste your clock.', '누가 다정하냐고 물으면 답할 수 있어요. 누가 범인이냐고 물으면 시간만 버리실 겁니다.') },
    { id: 's_reyes_death_time', personId: 'reyes', topicId: 'death_time', lie: false,
      text: t('He was cold at ten past eleven. The doctor says five past. Make of that what you like; I only touched him.', '11시 10분에 이미 차가웠어요. 선의는 11시 5분이라고 하고요. 판단은 알아서 하세요. 저는 만져본 것뿐이니.') },
    { id: 's_reyes_seals', personId: 'reyes', topicId: 'seals', lie: false,
      text: t('There is a roll of seal tape in the hold locker. It was full at Titan and it is half gone now.', '화물칸 사물함에 봉인 테이프 롤이 하나 있어요. 타이탄에선 새것이었는데 지금은 반이 없습니다.') },
    { id: 's_reyes_airlock', personId: 'reyes', topicId: 'airlock', lie: false,
      text: t('Nobody uses the airlock underway. There is nothing out there and everybody aboard knows it.', '항해 중엔 아무도 에어록을 안 씁니다. 바깥엔 아무것도 없고 배에 탄 사람은 다 알아요.') },
    { id: 's_reyes_share', personId: 'reyes', topicId: 'share', lie: false,
      text: t('I gave Lind coffee at ten and he gave me half the engine room’s gossip. He always does. He came back for a second cup.', '10시에 린드한테 커피를 줬더니 기관실 소문을 반쯤 풀어놓더군요. 늘 그래요. 두 잔째 받으러 또 왔고요.') },
  ],

  evidence: [
    { id: 'e_body', placeId: 'cargo3',
      name: t('Haldane', '하들레인'),
      description: t('Face down between two crates, one arm folded under him. A single depressed fracture at the base of the skull, and no defensive marks on either hand.', '상자 두 개 사이에 엎드려 있고 한쪽 팔이 몸 밑에 접혀 있다. 두개저부에 함몰 골절 하나, 양손 어디에도 방어흔은 없다.') },

    { id: 'e_sensor_panel', placeId: 'cargo3', requiresCard: 'r_maint_log',
      name: t('Pressure sensor housing', '압력 센서 함체'),
      description: t('The sensor housing beside the inner hatch. The service cover is seated crooked, one screw a quarter turn proud.', '안쪽 해치 옆 센서 함체. 정비 커버가 비뚤게 앉았고 나사 하나가 4분의 1 바퀴 덜 조여 있다.'),
      fullDescription: t('The service cover is seated crooked, one screw a quarter turn proud. With the maintenance register in hand the panel’s own counter reads plainly: service mode entered at 22:38 under engineering code LND-7, cleared at 23:05. The gap in the pressure log is not a fault. It is an instruction.', '정비 커버가 비뚤게 앉았고 나사 하나가 4분의 1 바퀴 덜 조여 있다. 유지보수 대장을 손에 쥐고 보면 함체 자체의 카운터가 분명하게 읽힌다. 22시 38분 기관 코드 LND-7로 정비 모드 진입, 23시 5분 해제. 압력 기록의 공백은 고장이 아니다. 지시다.') },

    { id: 'e_glove', placeId: 'airlock', availableTo: 240,
      name: t('Work glove', '작업 장갑'),
      description: t('A left-hand work glove wedged behind the hatch coaming, engineering issue, size large. Dry, and cold all the way through. (The cleaning cycle takes the airlock at 03:30.)', '해치 테두리 뒤에 끼인 왼손 작업 장갑. 기관부 지급품, 라지. 말라 있고 속까지 차갑다. (청소 순환이 3시 30분에 에어록을 지난다.)') },

    { id: 'e_nav_tablet', placeId: 'bridge', requiresCard: 's_vance_schedule',
      name: t('Navigation tablet', '항해 태블릿'),
      description: t('The navigator’s spare tablet, screen locked, plan view cached.', '항해사 예비 태블릿. 화면은 잠겼고 일정 화면이 캐시에 남아 있다.'),
      fullDescription: t('The cached plan view carries an amendment filed at 21:50 tonight under command authority — eleven hours added to the run, routing via the outer approach. The captain says the plan has not been touched since Titan. The tablet was left on the console where anyone could read it.', '캐시에 남은 일정 화면에 오늘 21시 50분 지휘 권한으로 제출된 수정안이 있다. 항해 시간 열한 시간 추가, 외곽 접근 경로 경유. 선장은 타이탄 이후 일정에 손댄 적 없다고 했다. 태블릿은 누구나 읽을 수 있는 콘솔 위에 놓여 있었다.') },

    { id: 'e_bruise', placeId: 'medbay',
      name: t('The wound, cleaned', '세척된 상처'),
      description: t('One blow, downward, from behind and above, delivered with a narrow edge. Lividity has fixed low in the body — settled longer than a certificate timed at 23:05 allows.', '한 번, 위에서 뒤로 내리친 타격, 좁은 모서리. 시반이 몸 아래쪽에 고정됐다. 23시 5분으로 적힌 사망 진단서가 허용하는 것보다 오래 가라앉은 상태다.') },

    { id: 'e_haldane_ledger', placeId: 'quarters',
      name: t('Haldane’s ledger', '하들레인의 장부'),
      description: t('A paper ledger in his own shorthand, kept beside the bunk. Two pages list private freight against crew names, with dates and a running column of what each would owe at dock.', '침상 옆에 둔 종이 장부, 본인만 아는 약어로 적혔다. 두 페이지에 걸쳐 개인 화물이 승무원 이름과 함께 적혀 있고, 날짜와 입항 시 각자가 물어야 할 액수가 열로 이어진다.') },

    { id: 'e_coffee', placeId: 'galley',
      name: t('Two cups', '컵 두 개'),
      description: t('Two cups in the galley sink, both used, one rim smeared with engine grease. The cook washes up at 22:00 and these were left after.', '주방 싱크에 컵 두 개, 둘 다 쓴 것이고 한쪽 테두리에 기계유가 묻었다. 요리사는 22시에 설거지를 하고, 이건 그 뒤에 남은 것이다.') },

    { id: 'e_boot', placeId: 'corridor_b', availableTo: 180,
      name: t('Boot print', '발자국'),
      description: t('A single print in hydraulic fluid under the drip, pointing aft toward bay 3. Navigator’s sole pattern, size eight, and the fluid has not spread — laid down under an hour before the body was found. (The drip will flood it out by 02:30.)', '물방울 아래 유압유에 찍힌 발자국 하나, 뒤쪽 화물칸 3 방향. 항해부 밑창 무늬, 250mm. 유체가 번지지 않았다. 시신 발견 한 시간 안쪽에 찍혔다는 뜻이다. (물방울이 2시 30분이면 이 자국을 지운다.)'),
      asserts: [{ personId: 'sato', placeId: 'corridor_b', from: -55, to: -52 }] },

    { id: 'e_code_note', placeId: 'engine', requiresCard: 's_lind_maint_code',
      name: t('Scrap of paper', '종이 쪽지'),
      description: t('A scrap pinned inside the engineering locker door, folded once. Grease along the crease.', '기관부 사물함 문 안쪽에 핀으로 꽂힌 쪽지, 한 번 접혔다. 접힌 자리에 기름이 묻어 있다.'),
      fullDescription: t('Unfolded: LND-7 in Lind’s block capitals, and under it, in a second and much neater hand, tonight’s date. Lind writes his own code down for himself. Somebody else wrote down when they would use it.', '펼치면 린드의 대문자 필체로 LND-7, 그 아래 훨씬 정갈한 다른 필체로 오늘 날짜. 린드는 자기 코드를 자기 보라고 적어둔다. 언제 쓸지를 적어둔 건 다른 사람이다.') },

    { id: 'e_sato_jacket', placeId: 'quarters', requiresCard: 'e_sensor_panel',
      name: t('Sato’s jacket', '사토의 재킷'),
      description: t('A navigator’s jacket on the bunk hook, third from the hatch. The left cuff is tacky to the touch.', '해치에서 세 번째 침상 고리에 걸린 항해부 재킷. 왼쪽 소매가 만지면 끈적인다.'),
      fullDescription: t('The left cuff carries adhesive residue lifted whole from cargo seal tape, still holding the weave of it. The lot number in the residue matches the roll in the bay 3 locker, and the bay 3 seal was cut and re-laid inside the twenty-five minutes the sensor was in service mode. Whoever wore this jacket handled that seal while the bay was not being recorded.', '왼쪽 소매에 화물 봉인 테이프에서 그대로 옮겨붙은 점착제가 남아 있고, 테이프의 짜임까지 찍혀 있다. 점착제의 로트 번호가 화물칸 3 사물함의 롤과 일치하고, 화물칸 3의 봉인은 센서가 정비 모드로 있던 25분 안에 잘렸다가 다시 붙여졌다. 이 재킷을 입은 사람은 화물칸이 기록되지 않는 동안 그 봉인을 만졌다.'),
      asserts: [{ personId: 'sato', placeId: 'cargo3', from: -52, to: -25 }] },
  ],

  records: [
    { id: 'r_door_cargo3', title: t('Door log — cargo bay 3', '도어 로그 — 화물칸 3'), keywords: ['door', 'cargo', 'log', 'hatch'],
      body: t('Inner hatch, bay 3. Badge SATO K. in 22:38, out 23:05. No other entries between 21:00 and 23:10. Pressure sensor: no entries in that window.', '화물칸 3 안쪽 해치. 배지 SATO K. 22:38 진입, 23:05 퇴출. 21시부터 23시 10분 사이 다른 기록 없음. 압력 센서: 해당 구간 기록 없음.'),
      asserts: [{ personId: 'sato', placeId: 'cargo3', from: -52, to: -25 }] },

    { id: 'r_door_engine', title: t('Door log — engine room', '도어 로그 — 기관실'), keywords: ['door', 'engine', 'log'],
      body: t('Main door, engine room. Badge LIND T. in 21:58, out 00:12. No other entries all watch.', '기관실 주 출입문. 배지 LIND T. 21:58 진입, 00:12 퇴출. 당직 내내 다른 기록 없음.'),
      asserts: [{ personId: 'lind', placeId: 'engine', from: -92, to: 42 }] },

    { id: 'r_door_bridge', title: t('Door log — bridge', '도어 로그 — 함교'), keywords: ['door', 'bridge', 'log'],
      body: t('Bridge door. VANCE I. in 21:45. SATO K. in 21:52, out 22:31, in 23:22. REYES M. in 23:12, out 23:14.', '함교 출입문. VANCE I. 21:45 진입. SATO K. 21:52 진입, 22:31 퇴출, 23:22 재진입. REYES M. 23:12 진입, 23:14 퇴출.'),
      asserts: [{ personId: 'sato', placeId: 'bridge', from: -98, to: -59 }] },

    { id: 'r_door_quarters', title: t('Door log — crew quarters', '도어 로그 — 거주 구역'), keywords: ['door', 'quarters', 'log'],
      body: t('Crew quarters door. Entries between 22:00 and 23:00 are absent; the controller reports a reset at 23:04. Reset requires a maintenance credential.', '거주 구역 출입문. 22시부터 23시 사이 기록 없음. 컨트롤러는 23시 4분 리셋을 보고한다. 리셋에는 유지보수 자격 증명이 필요하다.') },

    { id: 'r_sensor_cargo3', title: t('Pressure log — bay 3', '압력 로그 — 화물칸 3'), keywords: ['sensor', 'pressure', 'gap'],
      body: t('Continuous to 22:40. Resumes 23:05. Twenty-five minutes absent, and no fault flag was raised at either edge of the gap — a failing sensor complains, this one simply stopped.', '22시 40분까지 연속. 23시 5분 재개. 25분 결손이며 공백의 양 끝 어디에서도 고장 플래그가 뜨지 않았다. 고장 난 센서는 항의를 한다. 이건 그냥 멈췄다.') },

    { id: 'r_maint_log', title: t('Maintenance mode register', '유지보수 모드 대장'), keywords: ['maintenance', 'register', 'code', 'lnd'],
      body: t('Bay 3 pressure sensor set to service 22:38, cleared 23:05. Authorising code LND-7. Service mode suspends logging by design; the register is kept separately for exactly this reason.', '화물칸 3 압력 센서 22:38 정비 설정, 23:05 해제. 승인 코드 LND-7. 정비 모드는 설계상 로깅을 중단시키며, 대장을 따로 두는 이유가 정확히 이것이다.') },

    { id: 'r_nav_plan', title: t('Voyage plan', '항해 계획서'), keywords: ['voyage', 'plan', 'navigation'],
      body: t('Titan to Ceres Reach. Filed at departure, docking 07:00. Signed by the master and countersigned by the navigator.', '타이탄에서 세레스 리치. 출항 시 제출, 입항 07:00. 선장 서명, 항해사 부서명.') },

    { id: 'r_nav_amend', title: t('Voyage plan, amendment 4', '항해 계획서 수정안 4'), keywords: ['amendment', 'schedule', 'navigation'],
      body: t('Filed 21:50 tonight under command authority. Eleven hours added to the run, routing via the outer approach. No countersignature. Amendments after departure are reportable at dock.', '오늘 21시 50분 지휘 권한으로 제출. 항해 시간 열한 시간 추가, 외곽 접근 경로 경유. 부서명 없음. 출항 후 수정안은 입항 시 신고 대상이다.') },

    { id: 'r_msg_sato_haldane', title: t('Message — Haldane to Sato, 19:40', '메시지 — 하들레인 → 사토, 19:40'), keywords: ['message', 'sato', 'haldane'],
      body: t('"I have written the two crates into the book under your name. Come down and explain them to me before we dock, or I file the book as it stands."', '"상자 두 개를 자네 이름으로 장부에 적었네. 입항 전에 내려와서 설명하든지, 아니면 적힌 그대로 제출하겠네."') },

    { id: 'r_msg_haldane_vance', title: t('Message — Haldane to Vance, 20:15', '메시지 — 하들레인 → 밴스, 20:15'), keywords: ['message', 'haldane', 'vance'],
      body: t('"Eleven hours is not a routing change, captain. It is a delivery. I will be writing it that way."', '"열한 시간은 경로 변경이 아닙니다, 선장님. 그건 배달이죠. 저는 그렇게 적을 겁니다."') },

    { id: 'r_msg_lind_sato', title: t('Message — Lind to Sato, 22:05', '메시지 — 린드 → 사토, 22:05'), keywords: ['message', 'lind', 'code'],
      body: t('"Do not write it down and do not use it twice. And do not come back down here after."', '"적어두지 말고 두 번 쓰지도 마. 그리고 끝나고 여기 다시 내려오지 마."') },

    { id: 'r_msg_okafor_haldane', title: t('Message — Okafor to Haldane, four days ago', '메시지 — 오카포 → 하들레인, 나흘 전'), keywords: ['message', 'okafor', 'letter'],
      body: t('03:20. "Then tell them yourself. I am tired of doing the arithmetic for both of us."', '03:20. "그럼 당신이 직접 말해요. 둘 몫의 계산을 나 혼자 하는 데 지쳤어요."') },

    { id: 'r_msg_reyes', title: t('Message — Reyes to shore, 18:00', '메시지 — 레예스 → 육상, 18:00'), keywords: ['message', 'reyes', 'galley'],
      body: t('"Two crates in the hold nobody eats from and nobody signs for. Ask me at dock and I will tell you the numbers."', '"화물칸에 아무도 안 먹고 아무도 서명 안 하는 상자가 둘 있어요. 입항하면 물어보세요. 숫자까지 말해줄게요."') },

    { id: 'r_coroner', title: t('Medical certificate', '사망 진단서'), keywords: ['coroner', 'death', 'certificate', 'report'],
      body: t('Signed A. Okafor. Death 23:05, blunt trauma, base of skull. Filed 23:41. Body found 23:10 — the certificate places death five minutes before discovery, and the discovering witness reports cold hands.', 'A. 오카포 서명. 사망 23:05, 둔기 외상, 두개저부. 23:41 제출. 시신 발견은 23:10 — 진단서는 사망을 발견 5분 전으로 잡았으나 발견 증인은 손이 차가웠다고 진술한다.') },

    { id: 'r_manifest', title: t('Cargo manifest — bay 3', '화물 명세 — 화물칸 3'), keywords: ['manifest', 'cargo', 'freight', 'bay'],
      body: t('Fourteen crates. Signed HALDANE J. as loading officer. The master’s countersignature block is empty on every page.', '상자 열네 개. 적재 사관 HALDANE J. 서명. 선장 부서명란은 모든 장이 비어 있다.') },
  ],

  propositions: [
    { id: 'p_sensor_maint', text: t('The bay 3 sensor stopped recording because someone put it into service mode.', '화물칸 3 센서가 기록을 멈춘 것은 누군가 정비 모드로 넣었기 때문이다.'),
      provedBy: [['r_maint_log', 'r_sensor_cargo3'], ['e_sensor_panel', 'r_sensor_cargo3']], refutedBy: ['s_lind_sensor'] },
    { id: 'p_code_is_lind', text: t('The authorising code LND-7 is issued to Lind.', '승인 코드 LND-7은 린드에게 발급된 것이다.'),
      provedBy: [['r_maint_log', 's_lind_maint_code']], refutedBy: [] },
    { id: 'p_lind_passed_code', text: t('Lind passed his engineering code to Sato before 22:38.', '린드는 22시 38분 전에 자기 기관 코드를 사토에게 넘겼다.'),
      provedBy: [['e_code_note', 'r_msg_lind_sato']], refutedBy: ['s_lind_share'] },
    { id: 'p_sato_there', text: t('Sato was in cargo bay 3 at 22:40.', '사토는 22시 40분에 화물칸 3에 있었다.'),
      provedBy: [['e_boot', 'e_sato_jacket'], ['r_door_cargo3', 'e_sato_jacket']], refutedBy: ['s_sato_night'] },
    { id: 'p_lind_in_cargo', text: t('Lind was in cargo bay 3 while the sensor was dark.', '센서가 꺼져 있는 동안 린드는 화물칸 3에 있었다.'),
      provedBy: [], refutedBy: ['r_door_engine'] },
    { id: 'p_okafor_late', text: t('The certified time of death is later than the body allows.', '진단서에 적힌 사망 시각은 시신 상태가 허용하는 것보다 늦다.'),
      provedBy: [['e_bruise', 'r_coroner'], ['s_reyes_body', 'r_coroner']], refutedBy: [] },
    { id: 'p_vance_amended', text: t('Vance amended the voyage plan after departure.', '밴스는 출항 후에 항해 계획을 수정했다.'),
      provedBy: [['e_nav_tablet', 'r_nav_amend']], refutedBy: [] },
    { id: 'p_haldane_ledger', text: t('Haldane was recording Sato’s private freight against Sato’s name.', '하들레인은 사토의 개인 화물을 사토 이름으로 기록하고 있었다.'),
      provedBy: [['e_haldane_ledger', 'r_msg_sato_haldane'], ['e_haldane_ledger', 'r_manifest']], refutedBy: [] },
    { id: 'p_not_airlock', text: t('Haldane did not die in the airlock.', '하들레인은 에어록에서 죽지 않았다.'),
      provedBy: [['e_bruise', 'e_body']], refutedBy: [] },
    { id: 'p_sato_left_bridge', text: t('Sato left the bridge before 22:35.', '사토는 22시 35분 전에 함교를 떠났다.'),
      provedBy: [['r_door_bridge'], ['s_reyes_night']], refutedBy: ['s_sato_night'] },
  ],

  methods: [
    { id: 'm_blow', label: t('Struck from behind', '뒤에서 가격') },
    { id: 'm_airlock', label: t('Airlock decompression', '에어록 감압') },
    { id: 'm_poison', label: t('Drugged', '약물') },
  ],

  truth: {
    culpritId: 'sato',
    methodId: 'm_blow',
    decisiveEvidenceId: 'e_sato_jacket',
    motive: t(
      'Haldane had written Sato’s two private crates into the cargo book under Sato’s name, and told Sato he would file the book as it stood when the Marlow docked.',
      '하들레인은 사토의 개인 상자 두 개를 사토 이름으로 화물 장부에 적었고, 말로우가 입항하면 적힌 그대로 제출하겠다고 사토에게 통보했다.',
    ),
    reveal: t(
      'Sato asked Lind for a service override, and Lind — careless with everything except his own record — gave it. At 22:38 the bay 3 sensor went into maintenance mode and stopped writing; two minutes later Sato cut the seal, and Haldane, who had come down to wait for the explanation he had demanded, turned his back on the wrong person. The seal was re-laid before the sensor woke at 23:05, and the tape left its lot number on Sato’s cuff.',
      '사토는 린드에게 정비 오버라이드를 부탁했고, 자기 기록 말고는 무엇에도 조심성이 없는 린드는 그것을 넘겼다. 22시 38분 화물칸 3 센서가 정비 모드로 들어가 기록을 멈췄고, 2분 뒤 사토가 봉인을 잘랐다. 요구한 해명을 들으러 내려와 기다리던 하들레인은 하필 그 사람에게 등을 보였다. 봉인은 23시 5분 센서가 깨어나기 전에 다시 붙여졌고, 테이프는 사토의 소매에 로트 번호를 남겼다.',
    ),
    hook: t(
      'Watson’s own maintenance log shows one more entry under Watson’s own code. Watson does not remember it.',
      '왓슨의 유지보수 로그에는 왓슨 자신의 코드로 진입한 기록이 하나 더 있다. 왓슨은 그것을 기억하지 못한다.',
    ),
  },
};

// The golden path: a legal, in-budget solution. Every step is checked by
// scripts/check-ep1.ts and by tests/content-ep1.test.ts against the real kernel.
// Final clock: 280 of 450 minutes.
export const EP1_GOLDEN: ReadonlyArray<readonly ['holmes' | 'watson', Record<string, unknown>]> = [
  ['holmes', { kind: 'talk', personId: 'vance', topicId: 'night' }],
  ['holmes', { kind: 'talk', personId: 'vance', topicId: 'schedule' }],
  ['holmes', { kind: 'examine', evidenceId: 'e_nav_tablet' }],
  ['holmes', { kind: 'talk', personId: 'sato', topicId: 'night' }],
  ['holmes', { kind: 'talk', personId: 'sato', topicId: 'cargo3' }],
  ['watson', { kind: 'search_records', query: 'maintenance code' }],
  ['watson', { kind: 'move', placeId: 'corridor_b' }],
  ['watson', { kind: 'move', placeId: 'engine' }],
  ['watson', { kind: 'talk', personId: 'lind', topicId: 'maint_code' }],
  ['watson', { kind: 'examine', evidenceId: 'e_code_note' }],
  ['holmes', { kind: 'move', placeId: 'corridor_a' }],
  ['holmes', { kind: 'move', placeId: 'corridor_b' }],
  ['holmes', { kind: 'examine', evidenceId: 'e_boot' }],
  ['holmes', { kind: 'move', placeId: 'cargo3' }],
  ['holmes', { kind: 'examine', evidenceId: 'e_sensor_panel' }],
  ['watson', { kind: 'search_records', query: 'door log' }],
  ['holmes', { kind: 'move', placeId: 'corridor_b' }],
  ['holmes', { kind: 'move', placeId: 'quarters' }],
  ['holmes', { kind: 'examine', evidenceId: 'e_sato_jacket' }],
  ['watson', { kind: 'move', placeId: 'corridor_b' }],
  ['watson', { kind: 'move', placeId: 'corridor_a' }],
  ['watson', { kind: 'move', placeId: 'galley' }],
  ['watson', { kind: 'talk', personId: 'reyes', topicId: 'night' }],
  ['watson', { kind: 'cross_check', personId: 'sato' }],
  ['watson', { kind: 'timeline', personId: 'sato' }],
  ['watson', { kind: 'search_records', query: 'sensor pressure' }],
  ['watson', { kind: 'cross_check', personId: 'lind' }],
  ['watson', { kind: 'timeline' }],
  ['watson', { kind: 'talk', personId: 'lind', topicId: 'share' }],
  ['watson', {
    kind: 'submit_theory',
    claims: [
      { claim: 'p_sensor_maint', evidence_ids: ['r_maint_log', 'r_sensor_cargo3'] },
      { claim: 'p_code_is_lind', evidence_ids: ['r_maint_log', 's_lind_maint_code'] },
      { claim: 'p_lind_passed_code', evidence_ids: ['e_code_note', 'r_msg_lind_sato'] },
      { claim: 'p_lind_in_cargo', evidence_ids: ['r_door_engine'] },
      { claim: 'p_sato_there', evidence_ids: ['e_boot', 'e_sato_jacket'] },
    ],
  }],
];
