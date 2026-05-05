const translations = {
  ko: {
    fortune: {
      initialTitle: '✨ 나츠미의 신비한 타로 운세',
      initialDesc: '나츠미가 당신의 오늘을 위해 신성한 카드를 한 장 뽑았다냥!\n과연 어떤 운명이 당신을 기다리고 있을까냥? 듀근듀근하다냥!',
      buttonLabel: '운명 확인하기',
      otherUserError: '이 운세는 다른 사람의 것이라냥! 직접 슬래시 명령어를 입력하라냥!',
      resultTitle: '🃏 나츠미가 뽑은 점괘: {card}',
      adviceLabel: '💡 나츠미의 조언',
      luckyLabel: '🍀 오늘의 럭키 에너지',
      luckyNumber: '행운의 숫자',
      luckyColor: '행운의 색깔',
      luckyHit: '럭키 히트',
      flowLabel: '🌊 운명의 흐름',
      timeout: '시간이 초과되어 카드가 사라졌다냥.. 다시 시도해달라냥!',
      footer: '나츠미 봇 v6.1.3 | 궁극의 다국어 AI 신탁 시스템'
    },
    common: {
      loading: '나츠미가 별의 기운을 모으고 있다냥... 잠시만 기다려달라냥! ✨'
    },
    help: {
      title: '🐱 나츠미 도움말',
      desc: '> 냐하핫! 나츠미 도움말 페이지다냥! \n> 아래 메뉴를 열면 카테고리별 명령어를 볼 수 있다냥!',
      placeholder: '카테고리를 선택해 주세요',
      main: '메인',
      about: '소개',
      uptime: '업타임',
      latency: '지연 시간',
      servers: '서버 수'
    }
  },
  en: {
    fortune: {
      initialTitle: '✨ Natsumi\'s Mystical Tarot Oracle',
      initialDesc: 'Natsumi has drawn a sacred card just for you today!\nWhat destiny awaits you? So exciting, nya!',
      buttonLabel: 'Reveal Destiny',
      otherUserError: 'This fortune belongs to someone else! Use the command yourself, nya!',
      resultTitle: '🃏 Natsumi\'s Reading: {card}',
      adviceLabel: '💡 Natsumi\'s Advice',
      luckyLabel: '🍀 Today\'s Lucky Energy',
      luckyNumber: 'Lucky Number',
      luckyColor: 'Lucky Color',
      luckyHit: 'Lucky Hit',
      flowLabel: '🌊 Flow of Fate',
      timeout: 'Time expired and the card vanished... Try again, nya!',
      footer: 'Natsumi Bot v6.1.3 | Ultimate Multilingual AI Oracle'
    },
    common: {
      loading: 'Natsumi is gathering astral energy... Please wait a moment! ✨'
    },
    help: {
      title: '🐱 Natsumi Help',
      desc: '> Nyahaha! This is Natsumi\'s help page, nya! \n> Open the menu below to see commands by category!',
      placeholder: 'Please select a category',
      main: 'Main',
      about: 'About',
      uptime: 'Uptime',
      latency: 'Latency',
      servers: 'Servers'
    }
  },
  ja: {
    fortune: {
      initialTitle: '✨ ナツミの神秘的なタロット占い',
      initialDesc: 'ナツミが今日のために聖なるカードを一枚引いたにゃ！\nどんな運命が待っているのかにゃ？ドキドキだにゃ！',
      buttonLabel: '運命を確認する',
      otherUserError: 'この占いは他の人のものだにゃ！自分でコマンドを入力するにゃ！',
      resultTitle: '🃏 ナツミの鑑定結果: {card}',
      adviceLabel: '💡 ナツミの助言',
      luckyLabel: '🍀 今日のラッキーエネルギー',
      luckyNumber: 'ラッキーナンバー',
      luckyColor: 'ラッキーカラー',
      luckyHit: 'ラッキーヒット',
      flowLabel: '🌊 運命の流れ',
      timeout: '時間を超過してカードが消えてしまったにゃ… もう一度試してにゃ！',
      footer: 'ナツミ Bot v6.1.3 | 究極の多言語AI神託システム'
    },
    common: {
      loading: 'ナツミが星の力を集めているにゃ… ちょっと待ってにゃ！ ✨'
    },
    help: {
      title: '🐱 ナツミ ヘルプ',
      desc: '> にゃははっ! ナツミのヘルプページだにゃ! \n> 下のメニューを開くとカテゴリー別のコマンドが見れるにゃ!',
      placeholder: 'カテゴリーを選択してください',
      main: 'メイン',
      about: '紹介',
      uptime: '稼働時間',
      latency: '遅延',
      servers: 'サーバー数'
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
