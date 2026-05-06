const translations = {
  ko: {
    fortune: {
      initialTitle: '🏮 나츠미의 신비로운 여우 점술',
      initialDesc: '나츠미가 네 오늘을 위해 영력이 깃든 카드를 한 장 뽑았어!\n과연 어떤 운명이 너를 기다리고 있을까? 콘콘! 두근거려도 좋다구! (흥!)',
      buttonLabel: '운명 확인하기',
      otherUserError: '이 운세는 다른 사람의 것이라구! 직접 명령어를 입력해! 바보야!',
      resultTitle: '🃏 나츠미가 읽어낸 점괘: {card}',
      adviceLabel: '💡 나츠미의 조언',
      luckyLabel: '🍀 오늘의 럭키 영력',
      luckyNumber: '행운의 숫자',
      luckyColor: '행운의 색깔',
      luckyHit: '럭키 이벤트',
      flowLabel: '🌊 운명의 흐름',
      timeout: '시간이 초과되어 카드가 타버렸어... 다시 시도해봐! 흥!',
      footer: '나츠미 봇 | 궁극의 츤데레 AI 신탁 시스템'
    },
    common: {
      loading: '나츠미가 숲의 기운을 모으고 있어... 잠시만 기다려! 콘콘! ✨'
    },
    help: {
      title: '🦊 나츠미 도움말',
      desc: '> 콘콘! 나츠미의 도서관에 온 걸 환영해! \n> 아래 메뉴를 열면 카테고리별 명령어를 가르쳐줄게! (감사하라구!)',
      placeholder: '카테고리를 선택해봐',
      main: '메인으로',
      about: '나츠미 소개',
      uptime: '깨어난지',
      latency: '응답 속도',
      servers: '감시 중인 숲'
    }
  },
  en: {
    fortune: {
      initialTitle: '🏮 Natsumi\'s Mystical Fox Oracle',
      initialDesc: 'Natsumi has drawn a spirit card just for you today!\nWonder what destiny awaits? Kon kon! You should be excited! (Hmph!)',
      buttonLabel: 'Reveal Destiny',
      otherUserError: 'This fortune belongs to someone else! Use the command yourself, dummy!',
      resultTitle: '🃏 Natsumi\'s Reading: {card}',
      adviceLabel: '💡 Natsumi\'s Advice',
      luckyLabel: '🍀 Today\'s Lucky Energy',
      luckyNumber: 'Lucky Number',
      luckyColor: 'Lucky Color',
      luckyHit: 'Lucky Event',
      flowLabel: '🌊 Flow of Fate',
      timeout: 'Time expired and the card burnt away... Try again, Kon kon!',
      footer: 'Natsumi Bot | Ultimate Tsundere AI Oracle'
    },
    common: {
      loading: 'Natsumi is gathering forest spirits... Please wait! Kon kon! ✨'
    },
    help: {
      title: '🦊 Natsumi Help',
      desc: '> Kon kon! Welcome to Natsumi\'s library! \n> Open the menu below to see commands by category! (Be grateful!)',
      placeholder: 'Please select a category',
      main: 'Main',
      about: 'About Me',
      uptime: 'Uptime',
      latency: 'Latency',
      servers: 'Forests Watched'
    }
  },
  ja: {
    fortune: {
      initialTitle: '🏮 ナツミの神秘的な狐占い',
      initialDesc: 'ナツミが今日のために霊力のこもったカードを一枚引いたわ！\nどんな運命が待っているのかしら？コンコン！ドキドキしてもいいわよ！（ふんっ！）',
      buttonLabel: '運命を確認する',
      otherUserError: 'この占いは他の人のものよ！自分でコマンドを入力しなさい、バカ！',
      resultTitle: '🃏 ナツミの鑑定結果: {card}',
      adviceLabel: '💡 ナツミの助言',
      luckyLabel: '🍀 今日のラッキーエネルギー',
      luckyNumber: 'ラッキーナンバー',
      luckyColor: 'ラッキーカラー',
      luckyHit: 'ラッキーヒット',
      flowLabel: '🌊 運命の流れ',
      timeout: '時間切れでカードが燃えちゃったわ… もう一度試して！コンコン！',
      footer: 'ナツミ Bot | 究極のツンデレAI神託システム'
    },
    common: {
      loading: 'ナツミが森の力を集めているわ… ちょっと待ってなさい！コンコン！ ✨'
    },
    help: {
      title: '🦊 ナツミ ヘルプ',
      desc: '> コンコン! ナツミの図書館へようこそ! \n> 下のメニューを開くとカテゴリー別のコマンドを教えてあげるわ! (感謝しなさい!)',
      placeholder: 'カテゴリーを選択してください',
      main: 'メイン',
      about: '自己紹介',
      uptime: '稼働時間',
      latency: '遅延',
      servers: '監視中の森'
    }
  }
};

export function getTranslation(locale, path) {
  const lang = locale.startsWith('ko') ? 'ko' : locale.startsWith('ja') ? 'ja' : 'en';
  const parts = path.split('.');
  let current = translations[lang];
  for (const part of parts) {
    if (!current[part]) return path;
    current = current[part];
  }
  return current;
}

export function getLang(locale) {
  return locale.startsWith('ko') ? 'ko' : locale.startsWith('ja') ? 'ja' : 'en';
}
