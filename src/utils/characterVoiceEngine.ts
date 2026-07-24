export interface VoiceSnippet {
  phraseJa: string;
  phraseRomaji: string;
  translation: string;
  badge: string;
  auraColor: string; // e.g. golden, crimson, blue, purple, emerald
  pactTitle: string;
  audioUrl?: string;
}

const VOICE_CATALOG: { [key: string]: VoiceSnippet } = {
  naruto: {
    phraseJa: "俺は諦めない、それが俺の忍道だ！だってばよ！",
    phraseRomaji: "Ore wa akiramenai, sore ga ore no nindou da! Dattebayo!",
    translation: "Eu nunca desisto, esse é meu jeito ninja! Tô certo!",
    badge: "Determinação Ninja",
    auraColor: "from-amber-400 to-orange-600 shadow-orange-500/50",
    pactTitle: "Companheiro do Hokage",
    audioUrl: "https://www.myinstants.com/media/sounds/naruto-kage-bunshin.mp3"
  },
  tanjiro: {
    phraseJa: "水の呼吸、拾ノ型、生生流転！妹は俺が守る！",
    phraseRomaji: "Mizu no kokyuu, juu no kata: Seisei ruten! Imouto wa ore ga mamoru!",
    translation: "Respiração da Água, Décima Forma: Fluxo Constante! Eu protegerei minha irmã!",
    badge: "Espírito da Água",
    auraColor: "from-teal-400 to-blue-600 shadow-cyan-500/50",
    pactTitle: "Parceiro do Kamado",
    audioUrl: "https://www.myinstants.com/media/sounds/tanjiro-mizu-no-kokyu.mp3"
  },
  luffy: {
    phraseJa: "海賊王に、俺はなる！肉を食うぞ！",
    phraseRomaji: "Kaizoku ou ni, ore wa naru! Niku o kuuzo!",
    translation: "Eu serei o Rei dos Piratas! Hora de comer carne!",
    badge: "Haki do Rei",
    auraColor: "from-red-500 to-yellow-500 shadow-red-500/50",
    pactTitle: "Oficial do Chapéu de Palha",
    audioUrl: "https://www.myinstants.com/media/sounds/luffy-kaizoku-ou-ni-ore-wa-naru.mp3"
  },
  zoro: {
    phraseJa: "世界一の剣豪になる。勝つまで、もう二と負けねえ！",
    phraseRomaji: "Sekaiichi no kengou ni naru. Katsu made, mou nido to makenee!",
    translation: "Vou ser o maior espadachim do mundo. Até vencer, nunca mais perderei!",
    badge: "Três Espadas",
    auraColor: "from-emerald-400 to-green-700 shadow-green-500/50",
    pactTitle: "Guerreiro das Três Espadas",
    audioUrl: "https://www.myinstants.com/media/sounds/zoro-santoryu.mp3"
  },
  goku: {
    phraseJa: "オッス！オラ悟空！もっと強くなって、地球を守るぞ！",
    phraseRomaji: "Ossu! Ora Goku! Motto tsuyoku natte, chikyuu o mamoru zo!",
    translation: "Oi, eu sou o Goku! Vou ficar ainda mais forte para proteger a Earth!",
    badge: "Instinto Superior",
    auraColor: "from-cyan-400 to-yellow-400 shadow-yellow-500/50",
    pactTitle: "Aliado dos Saiyajins",
    audioUrl: "https://www.myinstants.com/media/sounds/kamehameha_3.mp3"
  },
  sasuke: {
    phraseJa: "千鳥！俺はうちはの復讐者だ、すべてを闇に葬る。",
    phraseRomaji: "Chidori! Ore wa Uchiha no fukushusha da, subete o yami ni houmuru.",
    translation: "Chidori! Eu sou um vingador do clã Uchiha, vou enterrar tudo nas trevas.",
    badge: "Olho do Rinnegan",
    auraColor: "from-indigo-600 to-purple-800 shadow-purple-500/50",
    pactTitle: "Protetor das Sombras",
    audioUrl: "https://www.myinstants.com/media/sounds/sasuke-chidori.mp3"
  },
  eren: {
    phraseJa: "駆逐してやる、この世から、一匹残らず！進み続ける。",
    phraseRomaji: "Kuchiku shite yaru, kono yo kara, ippiki nokorazu! Susumi tsuzakeru.",
    translation: "Vou exterminar todos eles, deste mundo, até o último! Continuarei avançando.",
    badge: "Rumble Fundador",
    auraColor: "from-amber-800 to-red-950 shadow-red-950/50",
    pactTitle: "Vanguardista da Liberdade",
    audioUrl: "https://www.myinstants.com/media/sounds/eren-tatakae.mp3"
  },
  gojo: {
    phraseJa: "領域展開、無量空処。大丈夫、僕最強だから。",
    phraseRomaji: "Ryouiki Tenkai: Muryoukuusho. Daijoubu, boku saikyou dakara.",
    translation: "Expansão de Domínio: Vazio Infinito. Não se preocupe, eu sou o mais forte.",
    badge: "Sem Limites",
    auraColor: "from-sky-300 to-indigo-500 shadow-sky-400/50",
    pactTitle: "Discípulo do Infinito",
    audioUrl: "https://www.myinstants.com/media/sounds/gojo-hollow-purple.mp3"
  },
  kaneki: {
    phraseJa: "この世界が間違っている。僕に喰われろ！",
    phraseRomaji: "Kono sekai ga machigatteiru. Boku ni kuwarero!",
    translation: "Este mundo está errado. Deixe-me devorar você!",
    badge: "Kakuja Desperto",
    auraColor: "from-slate-700 to-red-700 shadow-red-800/50",
    pactTitle: "Investigador Ghoul"
  },
  deku: {
    phraseJa: "ワン・フォー・オール！君を救う、それが僕のヒーローアカデミアだ！",
    phraseRomaji: "Wan Fō Ōru! Kimi o sukuu, sore ga boku no hiiroo akademia da!",
    translation: "One For All! Vou te salvar, esse é o meu Hero Academia!",
    badge: "Herói em Evolução",
    auraColor: "from-emerald-300 to-teal-500 shadow-teal-400/50",
    pactTitle: "Sucessor do One For All"
  },
  edward: {
    phraseJa: "等価交換だ！俺の人生半分やるから、お前の人生半分くれ！",
    phraseRomaji: "Touka koukan da! Ore no jinsei hanbun yaru kara, omae no jinsei hanbun kure!",
    translation: "Troca equivalente! Dou metade da minha vida se me der metade da sua!",
    badge: "Metal Alquimista",
    auraColor: "from-yellow-500 to-amber-700 shadow-yellow-600/50",
    pactTitle: "Pesquisador da Pedra Filosofal"
  },
  subaru: {
    phraseJa: "俺が必ず、お前を救ってみせる！死に戻りの力で！",
    phraseRomaji: "Ore ga kanarazu, omae o sukutte miseru! Shini modori no chikara de!",
    translation: "Eu irei te salvar, não importa o quê! Com o retorno através da morte!",
    badge: "Bênção da Bruxa",
    auraColor: "from-purple-900 to-black shadow-purple-900/50",
    pactTitle: "Escolhido pelo Retorno da Morte"
  },
  natsu: {
    phraseJa: "火竜の鉄拳！燃えてきたぞ！仲間のためなら負けねえ！",
    phraseRomaji: "Karyuu no Tekken! Moete kita zo! Nakama no tame nara makenee!",
    translation: "Punho de Ferro do Dragão de Fogo! Estou empolgado! Pelos meus amigos eu não caio!",
    badge: "Dragon Slayer",
    auraColor: "from-orange-500 to-red-600 shadow-orange-500/50",
    pactTitle: "Irmão da Guilda Fairy Tail"
  },
  saitama: {
    phraseJa: "趣味でヒーローをやっている者だ。ワンパンで終わっちゃう。",
    phraseRomaji: "Shumi de hiiroo o yatteiru mono da. Wanpan de owacchau.",
    translation: "Sou apenas um cara que é herói por diversão. Mas acaba tudo com um soco.",
    badge: "Força Absoluta",
    auraColor: "from-yellow-400 to-yellow-600 shadow-yellow-300/50",
    pactTitle: "Parceiro de Treino de Saitama",
    audioUrl: "https://www.myinstants.com/media/sounds/saitama-ok.mp3"
  },
  light: {
    phraseJa: "僕は新世界の神になる！計画通り！",
    phraseRomaji: "Boku wa shinsekai no kami ni naru! Keikaku doori!",
    translation: "Eu serei o Deus do novo mundo! Exatamente como planejado!",
    badge: "Justiça do Kira",
    auraColor: "from-zinc-800 to-red-900 shadow-red-950/50",
    pactTitle: "Portador do Death Note",
    audioUrl: "https://www.myinstants.com/media/sounds/light-yagami-laugh.mp3"
  },
  killua: {
    phraseJa: "神速！あんた、俺と友達になってよ。",
    phraseRomaji: "Godspeed! Anta, ore to tomodachi ni natte yo.",
    translation: "Velocidade Sombria! Ei você, torne-se meu amigo.",
    badge: "Velocidade Relâmpago",
    auraColor: "from-indigo-300 to-sky-400 shadow-cyan-400/50",
    pactTitle: "Companheiro do Clã Zoldyck"
  },
  mikasa: {
    phraseJa: "貴方は私が守る、エレン。世界が残酷でも関係ない。",
    phraseRomaji: "Anata wa watashi ga mamoru, Eren. Sekai ga zankoku demo kankei nai.",
    translation: "Eu vou proteger você, Eren. Não me importo se o mundo é cruel.",
    badge: "Protetora Leal",
    auraColor: "from-slate-600 to-zinc-900 shadow-zinc-700/50",
    pactTitle: "Fiel Escudeiro da Mikasa"
  },
  levi: {
    phraseJa: "悔いのない選択をしろ。巨人を駆逐するぞ。",
    phraseRomaji: "Kui no nai sentaku o shiro. Kyojin o kuchiku suru zo.",
    translation: "Faça uma escolha da qual não se arrependerá. Vamos exterminar os titãs.",
    badge: "Líder das Sombras",
    auraColor: "from-slate-500 to-green-800 shadow-green-700/50",
    pactTitle: "Oficial da Tropa de Exploração",
    audioUrl: "https://www.myinstants.com/media/sounds/levi-kennyaaa.mp3"
  },
  nezuko: {
    phraseJa: "んー！んー！（爆血！）",
    phraseRomaji: "Mmh! Mmh! (Bakketsu!)",
    translation: "Mmh! Mmh! (Sangue Explosivo!)",
    badge: "Chama Demoníaca",
    auraColor: "from-pink-400 to-rose-600 shadow-pink-500/50",
    pactTitle: "Guardião da Nezuko",
    audioUrl: "https://www.myinstants.com/media/sounds/nezuko-chwaan.mp3"
  },
  megumin: {
    phraseJa: "エクスプロージョン！我が名はめぐみん、紅魔族随一の魔法の使い手！",
    phraseRomaji: "Ekusepureeshon! Waga na wa Megumin, Kouma-zoku zuiichi no mahou no tsukaite!",
    translation: "Explooooosion! Meu nome é Megumin, a maior manipuladora de magia do Clã Carmesim!",
    badge: "Magia Explosiva",
    auraColor: "from-red-600 to-yellow-600 shadow-red-500/50",
    pactTitle: "Companheiro de Arcana Explosiva",
    audioUrl: "https://www.myinstants.com/media/sounds/megumin-explosion.mp3"
  },
  rem: {
    phraseJa: "レムはスバル君を信じています。ここから始めましょう、一から！",
    phraseRomaji: "Remu wa Subaru-kun o shinjite imasu. Koko kara hajimemashou, ichi kara!",
    translation: "Rem acredita no Subaru-kun. Vamos começar daqui, do absoluto zero!",
    badge: "Fidelidade Divina",
    auraColor: "from-sky-300 to-blue-500 shadow-sky-400/50",
    pactTitle: "Abençoado pelo Sorriso da Rem"
  },
  emilia: {
    phraseJa: "ありがとう、スバル。私はエミリア、ただのハーフエルフだよ。",
    phraseRomaji: "Arigatou, Subaru. Watashi wa Emiria, tada no haafu erufu dayo.",
    translation: "Obrigada, Subaru. Eu sou Emilia, apenas uma meio-elfa.",
    badge: "Magia Espiritual",
    auraColor: "from-purple-300 to-violet-500 shadow-purple-300/50",
    pactTitle: "Cavaleiro Real de Emilia"
  },
  dio: {
    phraseJa: "ザ・ワールド！時よ止まれ！",
    phraseRomaji: "Za Warudo! Toki yo tomare!",
    translation: "The World! O tempo para!",
    badge: "Vampiro Imortal",
    auraColor: "from-yellow-400 to-amber-600 shadow-yellow-500/50",
    pactTitle: "Servo de DIO",
    audioUrl: "https://www.myinstants.com/media/sounds/za-warudo-stop-time-sound-effect_2.mp3"
  },
  jotaro: {
    phraseJa: "やれやれだぜ... オラオラオラ！",
    phraseRomaji: "Yare yare daze... Ora ora ora!",
    translation: "Você é um saco... Ora Ora Ora!",
    badge: "Stand Platinum",
    auraColor: "from-purple-500 to-indigo-700 shadow-purple-500/50",
    pactTitle: "Companheiro do Kujo",
    audioUrl: "https://www.myinstants.com/media/sounds/jotaro-ora.mp3"
  },
  zenitsu: {
    phraseJa: "雷の呼吸 壱ノ型 霹靂一閃！",
    phraseRomaji: "Kaminari no kokyuu ichi no kata: Hekireki issen!",
    translation: "Respiração do Trovão, Primeira Forma: Lampejo do Trovão!",
    badge: "Trovão Adormecido",
    auraColor: "from-yellow-300 to-yellow-500 shadow-yellow-400/50",
    pactTitle: "Parceiro do Trovão",
    audioUrl: "https://www.myinstants.com/media/sounds/zenitsu-thunder-breathing.mp3"
  }
};

/**
 * Resiliently returns character custom signature voice/aura/badge data or fallback.
 */
export function getCharacterData(name: string, role?: string, animeTitle?: string): VoiceSnippet {
  const cleanName = name.replace(/,/g, '').toLowerCase();
  
  // Resilient name-matching loop
  for (const key of Object.keys(VOICE_CATALOG)) {
    if (cleanName.includes(key)) {
      return VOICE_CATALOG[key];
    }
  }

  // Personalization fallback based on character role/role type: prevents cross-character voice mismatches!
  const isMain = role?.toLowerCase().includes('main');
  const displayAnime = animeTitle || 'sua jornada';
  const cleanDispName = name.split(',').reverse().join(' ').trim();

  if (isMain) {
    return {
      phraseJa: `${cleanDispName}が立ち上がる！私の信念、絶対に曲げない！`,
      phraseRomaji: `${cleanDispName} ga tachiagaru! Watashi no shinnen, zettai ni magenai!`,
      translation: `${cleanDispName} se levanta! Eu nunca vou quebrar as minhas convicções!`,
      badge: "Alma do Protagonista",
      auraColor: "from-blue-500 to-amber-400 shadow-blue-400/40",
      pactTitle: `Eterno Elo com ${cleanDispName}`
    };
  } else {
    return {
      phraseJa: `${cleanDispName}、いつでもお前の味方だ！信じる力は無限だ！`,
      phraseRomaji: `${cleanDispName}, itsudemo omae no mikata da! Shinjiru chikara wa mugen da!`,
      translation: `${cleanDispName} estará sempre ao seu lado! O poder da crença é infinito!`,
      badge: "Vínculo Heroico",
      auraColor: "from-slate-400 to-indigo-500 shadow-indigo-400/30",
      pactTitle: `Protetor Jurado de ${cleanDispName}`
    };
  }
}

let currentAudio: HTMLAudioElement | null = null;

/**
 * Plays the character's original voice clip if available, or falls back to Web Speech API.
 */
export function playVoice(audioUrl: string | undefined, phraseJa: string, onStart?: () => void, onEnd?: () => void) {
  // Cancel any ongoing speaking to prevent overlays
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (audioUrl) {
    if (onStart) onStart();
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = 0.8;
    currentAudio.onended = () => {
      if (onEnd) onEnd();
      currentAudio = null;
    };
    currentAudio.play().catch((err) => {
      console.warn("Failed to play audioUrl, falling back to TTS", err);
      playTTS(phraseJa, onStart, onEnd);
    });
    return;
  }

  playTTS(phraseJa, onStart, onEnd);
}

function playTTS(phraseJa: string, onStart?: () => void, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(phraseJa);
  utterance.lang = 'ja-JP';
  
  // Prefer real Japanese voices if available on the browser
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
  if (jaVoice) {
    utterance.voice = jaVoice;
  }
  
  utterance.pitch = 1.1; // anime style pitch
  utterance.rate = 0.95;  // natural dialogue speed

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}
