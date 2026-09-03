export const T = {
  accuse: { en: 'Accuse', ko: '기소' }, accusationsLeft: { en: 'accusations left', ko: '남은 기소' }, clock: { en: 'Ship time', ko: '선내 시각' }, docking: { en: 'Docking in', ko: '정박까지' }, elapsed: { en: 'elapsed', ko: '경과' },
  notebook: { en: 'Notebook', ko: '수첩' }, map: { en: 'Deck plan', ko: '선내 평면도' }, scene: { en: 'Here', ko: '현재 위치' }, people: { en: 'People', ko: '인물' }, evidence: { en: 'Evidence', ko: '물증' }, topics: { en: 'Ask about', ko: '화제' },
  who: { en: 'Who', ko: '누가' }, how: { en: 'How', ko: '어떻게' }, decisive: { en: 'Decisive evidence', ko: '결정적 물증' }, submit: { en: 'Submit', ko: '제출' }, cancel: { en: 'Cancel', ko: '취소' },
  solved: { en: 'Case closed.', ko: '사건 종결.' }, failed: { en: 'The truth stays sealed.', ko: '진실은 봉인됐다.' }, wrongSlots: { en: 'Wrong:', ko: '틀린 칸:' },
  recap: { en: 'Recap', ko: '회고' }, timeLeft: { en: 'Time left', ko: '남긴 시간' }, watsonCalls: { en: 'Watson calls', ko: '왓슨 호출' }, accusations: { en: 'Accusations', ko: '기소 횟수' }, share: { en: 'Copy share link', ko: '공유 링크 복사' }, unvisited: { en: 'Never visited', ko: '가지 않은 곳' },
  noAgent: { en: 'This ship\'s robot only wakes inside ChatGPT. You can still investigate by hand.', ko: '이 배의 로봇은 ChatGPT에서 열어야 깨어납니다. 직접 수사는 가능합니다.' },
  watsonIdle: { en: 'Watson: awaiting orders', ko: '왓슨: 지시 대기' }, sayToWatson: { en: 'Say to Watson', ko: '왓슨에게 이렇게 말해보세요' }, copied: { en: 'Copied', ko: '복사됨' },
  foundBy: { en: 'found by', ko: '발견' }, holmes: { en: 'you', ko: '당신' }, watson: { en: 'Watson', ko: '왓슨' }, closedBanner: { en: 'Docked. Investigation closed — only the accusation remains.', ko: '정박. 수사 종료 — 기소만 남았습니다.' },
  play: { en: 'Play', ko: '시작' }, episode: { en: 'Episode', ko: '에피소드' }, siteTools: { en: 'site tools', ko: '사이트 도구' },
  tutGo: { en: 'Tutorial: go to', ko: '튜토리얼: 이동할 곳 —' }, tutTalk: { en: 'Tutorial: talk to', ko: '튜토리얼: 대화 —' }, tutExamine: { en: 'Tutorial: examine', ko: '튜토리얼: 조사 —' },
  tutWatson: { en: "Tutorial: Watson's turn — paste the sentence into the chat.", ko: '튜토리얼: 왓슨 차례입니다. 문장을 채팅에 붙여넣으세요.' }, tutAccuse: { en: 'Tutorial: press Accuse.', ko: '튜토리얼: 기소 버튼을 누르세요.' },
  tutLocked: { en: 'Finish the tutorial episode first.', ko: '튜토리얼 에피소드를 먼저 끝내세요.' }, tutDone: { en: 'Tutorial complete.', ko: '튜토리얼 완료.' },
  hearing: { en: 'Preliminary hearing', ko: '예비 심리' }, missing: { en: 'missing', ko: '부족한 근거' }, hearingNote: { en: 'The page grades the logic of the theory, never the truth. A proven theory can still accuse the wrong person.', ko: '페이지는 가설의 논리만 채점합니다. 진실은 판정하지 않습니다. 입증된 가설도 엉뚱한 사람을 가리킬 수 있습니다.' },
  // — evidence close-up (P3)
  pinNote: { en: 'Pin note', ko: '메모 남기기' }, askWatson: { en: 'Ask Watson', ko: '왓슨에게 묻기' }, back: { en: 'Back', ko: '뒤로' }, save: { en: 'Save', ko: '저장' },
  pinPlaceholder: { en: 'What is odd about this?', ko: '이 물건의 이상한 점은?' }, pinned: { en: 'Pinned', ko: '메모 부착됨' },
  askWatsonLook: { en: 'Watson, look at {name} for me.', ko: '왓슨, {name} 좀 봐줘.' },
  // — topic fold (P3)
  moreTopics: { en: '+{n} more', ko: '+{n}개 더' }, fewerTopics: { en: 'Fewer', ko: '접기' },
  // — Watson ticker (P3). Rendered as `▲ WATSON · <verb> <detail>`, or `▲ WATSON → <room>` for a walk.
  wtReading: { en: 'reading the case', ko: '사건 기록 확인' }, wtAsking: { en: 'asking', ko: '질문 —' }, wtExamining: { en: 'examining', ko: '조사 —' },
  wtPinning: { en: 'pinning a note', ko: '메모 부착' }, wtTimeline: { en: 'rebuilding timeline', ko: '동선 재구성' }, wtCrossChecking: { en: 'cross-checking', ko: '교차 확인 —' },
  wtSearching: { en: 'searching records', ko: '기록 검색' }, wtHearing: { en: 'hearing submitted', ko: '예비 심리 제출' },
} as const;
