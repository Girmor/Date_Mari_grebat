// =====================================================================
// ⚠️⚠️⚠️  ТЕСТОВИЙ РЕЖИМ  ⚠️⚠️⚠️
//   true  → пауза між етапами лише 5 секунд (щоб усе швидко перевірити);
//   false → справжні 15 хвилин.
// ОБОВ'ЯЗКОВО ПОСТАВ false, ПЕРШ НІЖ ДАВАТИ ПОСИЛАННЯ МЕРІ!
// (Коли тут false, додай ?fast=1 до адреси, щоб усе одно мати 5 секунд.)
// =====================================================================
const TEST_MODE = true;

/**
 * Рандомізатор подій — інтерактивний сценарій веселого дня.
 * Чистий статичний сайт: index.html + script.js + style.css, без збірки.
 */

// ============================================
// CONFIGURATION
// ============================================

// Службові параметри адреси (для репетиції власником):
//   ?fast=1  — пауза між етапами 5 секунд замість 15 хвилин;
//   ?reset=1 — стерти збережений прогрес і почати з чистого аркуша
//              (це ЄДИНИЙ спосіб стерти вже пройдений день).
//
// ⚠️ Прогрес зберігається в ТОМУ браузері, де відкрили посилання. Telegram,
// Instagram, Safari і Chrome мають кожен своє сховище: якщо почати в Telegram,
// а потім відкрити посилання в Safari, день почнеться спочатку. Тож дай Мері
// посилання так, щоб вона одразу відкрила його в Safari/Chrome, і далі
// повертайся туди ж (на iPhone: «…» → «Відкрити в Safari»).
const URL_PARAMS = new URLSearchParams(window.location.search);
const FAST_MODE = TEST_MODE || URL_PARAMS.get('fast') === '1';

const CONFIG = {
  DELAY_MS: FAST_MODE ? 5 * 1000 : 15 * 60 * 1000, // пауза між етапами
  MAX_REROLLS: 1, // скільки разів на етапі можна натиснути «Інший варіант»
  OWNER_SKIP_HOLD_MS: 1500, // утримання таймера, щоб одразу завершити очікування
  IMAGE_WAIT_MS: 4000, // скільки максимум чекати картинку перед показом результату
  ROLL_MS: 2100, // «рулетка»: скільки бігає підсвітка до майже-зупинки
  NEAR_MISS_MS: 820, // пауза на сусідньому варіанті перед останнім кроком
  SCENE_MS: 300, // тривалість переходу між екранами
  STORAGE_KEY: 'dateRandomizerState_v4',
  LEGACY_STORAGE_KEYS: ['dateRandomizerState_v3', 'dateRandomizerState_v2', 'dateRandomizerState'],
  USER_ID_KEY: 'dateRandomizerUserId',
  FAVORITES_KEY: 'favoriteTopics',
  SOUNDS_ENABLED_KEY: 'soundsEnabled',
  LEGACY_THEME_KEY: 'dateRandomizerTheme'
};

// ============================================
// ✏️ КОНТЕНТ — РЕДАГУЙ ТУТ
// ============================================
// Етапи йдуть саме в такому порядку, як записані нижче.
// Кожен варіант — це рядок { text: "...", image: "..." }:
//   text  — назва, яку побачить Мері;
//   image — шлях до картинки в папці images/, наприклад "images/Kino_novyi.jpg".
//           Назва файлу без пробілів, а великі й малі літери мають точно
//           збігатися з назвою файлу (GitHub Pages їх розрізняє).
//   map   — (необов'язково) посилання на Google Maps, напр. "https://maps.app.goo.gl/...";
//           тоді з'явиться кнопка «Як дістатися» (на результаті, під час паузи й у маршруті).
//           Посилання беремо в Google Maps: «Поділитися» → «Копіювати посилання».
//   mapHint — (необов'язково) коротка підказка біля кнопки, напр. "у ТЦ «Гулівер»".
//   fit   — (необов'язково) "contain" для логотипів: показати картинку цілою на білій
//           картці, без обрізання. Замалі картинки й так показуються в рамці, без розмиття.
//   color — (у етапу, необов'язково) колір фону цього етапу, напр. "#D4874A";
//           колір тексту (темний чи світлий) підбереться автоматично.
//   icon  — більше не використовується (лишилось від старого дизайну), можна не чіпати.
// Щоб замінити варіант — зміни text та image; щоб додати — скопіюй рядок.
// Якщо картинка не завантажиться, замість неї з'явиться емодзі етапу.
// Після правок на телефоні, де вже була репетиція, відкрий сайт з ?reset=1.

const DATE_OPTIONS = {
  stages: [
    {
      id: 'coffee',
      question: "Час кави ☕️ Обирай, де саме:",
      icon: "fa-mug-hot",
      emoji: "☕",
      color: "#D4874A",
      options: [
        { text: "Кава на WOG", image: "images/Kava_wog.jpg", map: "https://maps.app.goo.gl/biPR1XYGzDe1pajSA" },
        { text: "25th hour", image: "images/Kava_25thhour.jpg", map: "https://maps.app.goo.gl/wXZu7xbZhrnazd587" },
        { text: "Craft Coffee", image: "images/Kava_craft.jpg", fit: "contain", map: "https://maps.app.goo.gl/QCfKxB5D33t7jDSWA", mapHint: "у ТЦ «Гулівер»" },
        { text: "Кав'ярня «Панорама»", image: "images/Kava_panorama.jpeg", map: "https://maps.app.goo.gl/q4pSctEGf5hMDTpP9" }
      ]
    },
    {
      id: 'walk',
      question: "Прогуляємося? Обирай маршрут:",
      icon: "fa-person-walking",
      emoji: "🚶",
      color: "#5DB97A",
      options: [
        { text: "Сквер Івана Старова", image: "images/Prog_Parg_Starova.jpg" },
        { text: "Парк Шевченка", image: "images/Prog_Park_Shevshenka.jpg" },
        { text: "Яхт-клуб «Січ»", image: "images/Prog_yaht.jpg" },
        { text: "Парк Зелений Гай", image: "images/Prog_Zelen_dynopark.jpg" }
      ]
    },
    {
      id: 'food',
      question: "Щось я зголоднів… Врятуєш мене?",
      icon: "fa-utensils",
      emoji: "🍽️",
      color: "#F05A3A",
      options: [
        { text: "Buon Fratelli", image: "images/Rest_Bioni.jpg", map: "https://maps.app.goo.gl/ZBFzjPnsN9TZC2Vy7" },
        { text: "BROOKS eats & drinks", image: "images/Rest_brooks.jpg", map: "https://maps.app.goo.gl/CC2tx2MMESCRtA659" },
        { text: "Spoon", image: "images/Rest_Spoon.jpg", map: "https://maps.app.goo.gl/u9P5g5pHCpZYfqaMA" },
        { text: "Giannivino", image: "images/Rest_Giannivino.jpg", map: "https://maps.app.goo.gl/hXaLMcv7wfkN4kCu7" }
      ]
    },
    {
      id: 'movie',
      question: "Може, глянемо фільм?",
      icon: "fa-film",
      emoji: "🎬",
      color: "#2E2A7A",
      // TODO(власник): ці три фільми ЗАСТАРІЛІ — це заглушки!
      // Заміни назви й картинки на те, що зараз справді йде в кіно.
      options: [
        { text: "Грішники", image: "images/Kino_grishniki.jpeg" },
        { text: "Громовержці", image: "images/Kino_gromovergi.jpg" },
        { text: "MINECRAFT", image: "images/Kino_minecrafte.jpg" }
      ]
    },
    {
      id: 'gift',
      question: "За твоє «терпіння» — міні-подарунок!",
      icon: "fa-gift",
      emoji: "🎁",
      color: "#F4A6C6",
      options: [
        { text: "Квіти", image: "images/Podarik_kviti.jpg" },
        { text: "Рафаелки", image: "images/Podarik_rafaelo.jpeg" },
        { text: "Брелок", image: "images/Podarik_brelok.jpg" },
        { text: "Міні-іграшка", image: "images/Podarik_snish.jpeg" }
      ]
    }
  ]
};

// ============================================
// SAFE STORAGE
// ============================================
// Some in-app browsers block localStorage (it throws). Then the app still
// works, just from memory for this visit, instead of showing a blank page.

const Store = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // unavailable — nothing to remove
    }
  }
};

const BASE_TITLE = document.title;

// ============================================
// LOOK: palette & photo shapes
// ============================================

const PALETTE = {
  ink: '#141210',
  cream: '#F4EFE6',
  accent: '#FFD23F',
  // used when a stage has no `color` of its own
  stageFallback: ['#D4874A', '#5DB97A', '#F05A3A', '#2E2A7A', '#F4A6C6']
};

// Photo frame shape per stage (width / height). Everything else is 4:3.
const PHOTO_RATIO = { movie: 2 / 3, gift: 1 };

const STAGE_COUNT = DATE_OPTIONS.stages.length;

// ============================================
// UTILITIES
// ============================================

class Utils {
  static $(selector, root = document) {
    return root.querySelector(selector);
  }

  static $$(selector, root = document) {
    return root.querySelectorAll(selector);
  }

  static vibrate(pattern = 50) {
    try {
      if ('vibrate' in navigator) navigator.vibrate(pattern);
    } catch (e) {
      // not supported (iOS) — ignore
    }
  }

  static formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  static preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Never rejects: resolves true when the image loaded, false otherwise.
  static loadImage(src) {
    return Utils.preloadImage(src).then(() => true, () => false);
  }

  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static localDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static pad2(n) {
    return String(n).padStart(2, '0');
  }

  // Ukrainian plural: 1 варіант, 2–4 варіанти, 5+ варіантів
  static plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  static escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Escaped text for big headings: a dash never starts a line (Ukrainian typography).
  static headingHtml(value) {
    return Utils.escapeHtml(value).replace(/ — /g, '&nbsp;— ');
  }

  static reducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  static icon(name, className = '') {
    return `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  // Shrinks a heading until its longest word fits on a line (no mid-word breaks).
  static fit(el, minPx = 20) {
    if (!el || !el.isConnected) return;
    el.style.fontSize = '';
    el.style.overflowWrap = '';
    let size = parseFloat(getComputedStyle(el).fontSize) || 16;
    let guard = 60;
    while (el.scrollWidth > el.clientWidth + 1 && size > minPx && guard--) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    if (el.scrollWidth > el.clientWidth + 1) el.style.overflowWrap = 'anywhere';
  }

  static restartAnimation(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // reflow so the animation can run again
    el.classList.add(className);
  }
}

// Picture with a neat fallback: if the image fails, the stage emoji shows instead.
// fit: "contain" (logos) → whole image on a white card instead of a crop.
function createPhoto(option, stage, className = '') {
  const wrap = document.createElement('div');
  wrap.className = `photo ${className}`.trim();
  if (option.fit === 'contain') wrap.classList.add('is-contain');

  const img = new Image();
  img.alt = option.text;
  img.decoding = 'async';
  img.addEventListener('load', () => {
    wrap.classList.remove('is-failed');
    checkLowRes(wrap);
  });
  img.addEventListener('error', () => wrap.classList.add('is-failed'));

  const placeholder = document.createElement('span');
  placeholder.className = 'ph';
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.textContent = stage.emoji;

  wrap.append(img, placeholder);
  img.src = option.image;
  return wrap;
}

// A picture that would be blown up more than ~1.4× (blurry) is shown at its
// own size on a soft frame instead. Only measurable once the box is visible.
function checkLowRes(wrap) {
  const img = wrap?.querySelector('img');
  if (!img || !img.naturalWidth || wrap.classList.contains('is-contain')) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (!w || !h) return;
  const upscale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  wrap.classList.toggle('is-lowres', upscale > 1.4);
}

// "Як дістатися" — Google Maps link for a chosen place (null when no map).
function createMapLink(option, { compact = false } = {}) {
  if (!option?.map || !/^https:\/\//.test(option.map)) return null;
  const a = document.createElement('a');
  a.className = compact ? 'map-pin' : 'map-link';
  a.href = option.map;
  a.target = '_blank';
  a.rel = 'noopener';
  if (compact) {
    a.setAttribute('aria-label', `Як дістатися: ${option.text}`);
    a.innerHTML = Utils.icon('pin');
  } else {
    a.innerHTML = `${Utils.icon('pin')}<span>Як дістатися</span>`;
    if (option.mapHint) {
      const hint = document.createElement('span');
      hint.className = 'map-hint';
      hint.textContent = option.mapHint;
      a.appendChild(hint);
    }
  }
  return a;
}

function stageColor(index) {
  const own = DATE_OPTIONS.stages[index]?.color;
  return Color.isValid(own) ? own : PALETTE.stageFallback[index % PALETTE.stageFallback.length];
}

function stageRatio(index) {
  return PHOTO_RATIO[DATE_OPTIONS.stages[index]?.id] || 4 / 3;
}

// ============================================
// COLOUR (contrast-checked chapter palettes)
// ============================================

const Color = {
  isValid(hex) {
    return typeof hex === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
  },

  rgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  },

  toHex(rgb) {
    return `#${rgb.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
  },

  luminance(hex) {
    const lin = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const [r, g, b] = Color.rgb(hex);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  },

  contrast(a, b) {
    const x = Color.luminance(a);
    const y = Color.luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  },

  mix(a, b, t) {
    const A = Color.rgb(a);
    const B = Color.rgb(b);
    return Color.toHex(A.map((v, i) => v * t + B[i] * (1 - t)));
  },

  rgba(hex, alpha) {
    const [r, g, b] = Color.rgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // Softest blend of `fg` towards `bg` that still meets WCAG AA (4.5:1).
  soft(fg, bg) {
    let t = 0.66;
    let soft = Color.mix(fg, bg, t);
    while (Color.contrast(soft, bg) < 4.6 && t < 1) {
      t = Math.min(1, t + 0.02);
      soft = Color.mix(fg, bg, t);
    }
    return soft;
  },

  // Ink or cream text — whichever reads better on this background.
  chapter(bg) {
    const { ink, cream, accent } = PALETTE;
    const fg = Color.contrast(ink, bg) >= Color.contrast(cream, bg) ? ink : cream;
    const dark = fg === cream;
    const surface = dark
      ? Color.mix(cream, bg, 0.1)
      : (Color.luminance(bg) > 0.6 ? Color.mix(ink, bg, 0.06) : Color.mix(cream, bg, 0.45));
    return {
      bg,
      fg,
      dark,
      soft: Color.soft(fg, bg),
      surface,
      surfaceSoft: Color.soft(fg, surface),
      btnBg: fg,
      btnFg: dark ? ink : cream,
      track: Color.rgba(fg, 0.22),
      line: Color.rgba(fg, 0.24),
      accent
    };
  }
};

// ============================================
// SOUND MANAGER
// ============================================

class SoundManager {
  constructor() {
    this.enabled = Store.get(CONFIG.SOUNDS_ENABLED_KEY) !== 'false';
    this.audioContext = null;
    this.AudioCtor = null;
  }

  // Browsers (iOS Safari especially) only allow audio to start inside a user
  // gesture, so the AudioContext is created/resumed on the first tap or key
  // press instead of on page load. The listeners stay: iOS can suspend the
  // context again (e.g. after the phone was locked) and the next tap revives it.
  init() {
    this.AudioCtor = window.AudioContext || window.webkitAudioContext || null;
    if (!this.AudioCtor) return;

    const unlock = () => this.unlock();
    ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(type => {
      document.addEventListener(type, unlock, { capture: true, passive: true });
    });
  }

  unlock() {
    if (!this.AudioCtor) return;
    try {
      if (!this.audioContext) {
        this.audioContext = new this.AudioCtor();
      }
      if (this.audioContext.state !== 'running') {
        const resumed = this.audioContext.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
      }
    } catch (e) {
      console.warn('Audio is not available:', e);
      this.AudioCtor = null;
    }
  }

  isReady() {
    return Boolean(this.audioContext) && this.audioContext.state === 'running';
  }

  toggle() {
    this.enabled = !this.enabled;
    Store.set(CONFIG.SOUNDS_ENABLED_KEY, String(this.enabled));
    return this.enabled;
  }

  playClick() {
    if (!this.enabled || !this.isReady()) return;
    this.playTone(800, 0.05, 'sine');
  }

  playSuccess() {
    if (!this.enabled || !this.isReady()) return;
    this.playTone(523, 0.1, 'sine');
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine'), 200);
  }

  playSpin() {
    if (!this.enabled || !this.isReady()) return;
    this.playTone(400 + Math.random() * 200, 0.03, 'square');
  }

  playUnlock() {
    if (!this.enabled || !this.isReady()) return;
    this.playTone(440, 0.1, 'sine');
    setTimeout(() => this.playTone(554, 0.1, 'sine'), 150);
    setTimeout(() => this.playTone(659, 0.2, 'sine'), 300);
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.isReady()) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }
}

// ============================================
// CONVERSATION TOPICS DATA
// ============================================

// Питання сформульовані нейтрально щодо статі, щоб їх міг читати вголос
// будь-хто з двох.
const CONVERSATION_TOPICS = {
  fun: [
    "Яке твоє найдивніше хобі чи захоплення?",
    "Куди б тобі хотілося телепортуватися прямо зараз?",
    "Яка суперсила пасувала б тобі найбільше?",
    "Яку тварину, навіть найекзотичнішу, тобі хотілося б мати вдома?",
    "Яка найсмішніша ситуація траплялася з тобою на людях?",
    "У чому тобі хотілося б стати експертом за одну ніч?",
    "Яка пісня завжди піднімає тобі настрій?",
    "Якби можна було змінити одну річ у житті без жодних наслідків, що б це було?",
    "Яка історія з дитинства досі змушує тебе червоніти?",
    "Якби можна було вигадати власне свято, яким би воно було?",
    "Яке найдивніше поєднання продуктів тобі смакує?",
    "З ким із відомих людей — сучасних чи історичних — тобі хотілося б пообідати?"
  ],
  deep: [
    "Який твій найкращий спогад з дитинства?",
    "Що тебе найбільше мотивує в житті?",
    "Яка твоя найбільша мрія?",
    "Якби можна було щось змінити в собі, що б це було?",
    "Яка цінність для тебе найважливіша?",
    "Чого ти найбільше боїшся?",
    "Який момент змінив твоє життя назавжди?",
    "Що робить твій день по-справжньому щасливим?",
    "Як ти уявляєш своє життя через п'ять років?",
    "Що надихає тебе ставати кращою версією себе?",
    "Яке в тебе життєве кредо?",
    "Що для тебе означає успіх?"
  ],
  unusual: [
    "Якби можна було говорити з тваринами, з ким би тобі найбільше хотілося поспілкуватися?",
    "У якій історичній епосі тобі хотілося б пожити?",
    "Як би називалася твоя автобіографія?",
    "Який у тебе є незвичайний талант?",
    "Якби можна було змінити одне правило у світі, що б це було?",
    "Яка найдивніша річ у твоєму списку бажань?",
    "Що б тобі хотілося запитати у свого майбутнього «я»?",
    "Ким тобі було б цікаво попрацювати хоча б тиждень?",
    "Яку нову традицію тобі хотілося б запровадити?",
    "Який найнезвичніший факт запам'ятався тобі останнім часом?",
    "Якби твоє життя було фільмом, то якого жанру?",
    "Який найнесподіваніший факт про тебе?",
    "Яку магічну здібність тобі хотілося б мати хоча б на один день?"
  ],
  icebreakers: [
    "Що найкраще сталося з тобою сьогодні?",
    "Яка твоя улюблена пора року і чому?",
    "Який фільм ти можеш переглядати безліч разів?",
    "Який твій улюблений спосіб провести вихідні?",
    "Кава чи чай? І як саме ти їх любиш?",
    "Яка страва для тебе — найкращі ліки від поганого настрою?",
    "Який подарунок тебе найбільше здивував?",
    "Куди ти любиш подорожувати?",
    "Яка книга справила на тебе найбільше враження?",
    "Яке твоє улюблене місце, щоб смачно поїсти?",
    "Як ти любиш відпочивати після важкого дня?",
    "Який твій улюблений вид мистецтва?"
  ]
};

// ============================================
// CONVERSATION TOPICS (inline card on the wait screen)
// ============================================

const TOPIC_CATEGORIES = [
  ['fun', 'Веселі'],
  ['deep', 'Глибокі'],
  ['unusual', 'Незвичайні'],
  ['icebreakers', 'Для початку']
];

class ConversationTopics {
  constructor() {
    this.category = 'fun';
    this.key = null; // "category-index" of the question on screen
    this.usedTopics = new Set();
    this.favorites = this.loadFavorites();
    this.element = null;
  }

  // Favourites are stored as "category-index" keys; drop any that no longer
  // point at an existing topic (e.g. a removed category) or are corrupted.
  loadFavorites() {
    try {
      const raw = JSON.parse(Store.get(CONFIG.FAVORITES_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(key => this.getTopicByKey(key) !== null) : [];
    } catch (e) {
      return [];
    }
  }

  getTopicByKey(key) {
    if (typeof key !== 'string') return null;
    const [category, index] = key.split('-');
    const topics = CONVERSATION_TOPICS[category];
    return topics?.[Number(index)] ?? null;
  }

  // Collapsed by default into one quiet row; the choice is remembered for the session.
  isOpen() {
    try {
      return sessionStorage.getItem('topicsOpen') === '1';
    } catch (e) {
      return false;
    }
  }

  setOpen(open) {
    try {
      sessionStorage.setItem('topicsOpen', open ? '1' : '0');
    } catch (e) {
      // private mode etc. — just not remembered
    }
  }

  render({ fresh = false } = {}) {
    const wrap = document.createElement('section');
    wrap.className = 'topics';
    wrap.setAttribute('aria-label', 'Ідеї для розмови');
    wrap.innerHTML = `
      <button class="topics-toggle" type="button" aria-expanded="false" aria-controls="topicCard">
        <span>💬 Про що поговорити?</span>${Utils.icon('chevron', 'chev')}
      </button>`;
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.id = 'topicCard';
    wrap.appendChild(card);

    const toggle = wrap.querySelector('.topics-toggle');
    const apply = (open) => {
      wrap.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      card.hidden = !open;
    };
    apply(this.isOpen());
    toggle.addEventListener('click', () => {
      const open = !wrap.classList.contains('is-open');
      apply(open);
      this.setOpen(open);
      Utils.vibrate(10);
      if (open) Utils.restartAnimation(card, 'fade-up');
    });

    card.innerHTML = `
      <div class="chips" role="group" aria-label="Тема"></div>
      <p class="topic-text"></p>
      <div class="topic-actions">
        <button class="btn-quiet topic-next" type="button">
          ${Utils.icon('refresh')}<span>Інше питання</span>
        </button>
        <button class="icon-btn star-btn" type="button" aria-pressed="false" aria-label="Додати до улюблених">
          ${Utils.icon('star')}
        </button>
      </div>
    `;
    this.element = card;

    card.querySelector('.topic-next').addEventListener('click', () => {
      this.next();
      Utils.vibrate(20);
    });
    card.querySelector('.star-btn').addEventListener('click', () => this.toggleFavorite());

    this.renderChips();
    if (!fresh && this.key && this.getTopicByKey(this.key) !== null) {
      this.showKey(this.key, false);
    } else {
      this.next();
    }
    return wrap;
  }

  renderChips() {
    const chips = this.element?.querySelector('.chips');
    if (!chips) return;
    const list = [...TOPIC_CATEGORIES];
    if (this.favorites.length) list.push(['favorites', `★ Улюблені · ${this.favorites.length}`]);
    if (this.category === 'favorites' && !this.favorites.length) this.category = 'fun';

    chips.innerHTML = list.map(([id, label]) =>
      `<button class="chip" type="button" data-category="${id}" aria-pressed="${id === this.category}">${label}</button>`
    ).join('');
    chips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.category = chip.dataset.category;
        chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
        this.next();
      });
    });
  }

  next() {
    let keys;
    if (this.category === 'favorites') {
      keys = [...this.favorites];
    } else {
      keys = CONVERSATION_TOPICS[this.category].map((_, i) => `${this.category}-${i}`);
    }
    if (!keys.length) return;

    let available = keys.filter(k => !this.usedTopics.has(k) && k !== this.key);
    if (!available.length) {
      keys.forEach(k => this.usedTopics.delete(k));
      available = keys.length > 1 ? keys.filter(k => k !== this.key) : keys;
    }
    const key = Utils.randomItem(available);
    this.usedTopics.add(key);
    this.showKey(key, true);
  }

  showKey(key, animate) {
    this.key = key;
    const text = this.element?.querySelector('.topic-text');
    if (!text) return;
    text.textContent = this.getTopicByKey(key);
    if (animate) Utils.restartAnimation(text, 'tick');
    this.updateStar();
  }

  updateStar() {
    const btn = this.element?.querySelector('.star-btn');
    if (!btn) return;
    const on = this.favorites.includes(this.key);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Прибрати з улюблених' : 'Додати до улюблених');
  }

  toggleFavorite() {
    if (!this.key) return;
    const index = this.favorites.indexOf(this.key);
    // feedback = the filled star + the "★ Улюблені · N" chip (no toast over the content)
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(this.key);
      Utils.vibrate([40, 30, 40]);
    }
    Store.set(CONFIG.FAVORITES_KEY, JSON.stringify(this.favorites)); // may fail silently: favourites just won't persist
    this.renderChips();
    this.updateStar();
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

class Toast {
  static show(message, type = 'info', duration = 2600) {
    const container = Utils.$('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}

// ============================================
// STATE MANAGER
// ============================================

class StateManager {
  constructor() {
    this.userId = Store.get(CONFIG.USER_ID_KEY) || this.createUserId();
    this.state = this.getDefaultState();
  }

  getDefaultState() {
    return {
      userId: this.userId,
      introStep: 0,
      introCompleted: false,
      stages: DATE_OPTIONS.stages.map(() => ({
        selectedIndex: null,
        confirmed: false,
        rerollsUsed: 0,
        rejectedIndex: null // the option given up via «Інший варіант» (for the memory replay)
      })),
      // waiting for: a stage index (opens it), 'farewell' (final screen) or null
      pendingStage: null,
      pendingUnlockTime: null,
      farewellReached: false,
      finishedAt: null,
      rating: null
    };
  }

  createUserId() {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    Store.set(CONFIG.USER_ID_KEY, id);
    return id;
  }

  load() {
    try {
      // States from older versions are not reused.
      CONFIG.LEGACY_STORAGE_KEYS.forEach(key => Store.remove(key));

      const saved = Store.get(CONFIG.STORAGE_KEY);
      if (!saved) return;

      const normalized = this.normalize(JSON.parse(saved));
      if (!normalized) {
        console.warn('Saved state does not match the current content, starting over');
        this.reset();
        return;
      }
      this.state = normalized;
    } catch (e) {
      console.error('Error loading state:', e);
      this.reset();
    }
  }

  // Validates a saved state against the current DATE_OPTIONS so that edited
  // content (fewer options, different stage count) can never crash the app.
  normalize(parsed) {
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.userId !== this.state.userId) return null;

    const stageDefs = DATE_OPTIONS.stages;
    if (!Array.isArray(parsed.stages) || parsed.stages.length !== stageDefs.length) return null;

    const defaults = this.getDefaultState();
    const stages = parsed.stages.map((saved, index) => {
      const s = saved && typeof saved === 'object' ? saved : {};
      const optionCount = stageDefs[index].options.length;
      const selectedIndex = Number.isInteger(s.selectedIndex) &&
        s.selectedIndex >= 0 && s.selectedIndex < optionCount ? s.selectedIndex : null;
      // older saves have no rejectedIndex → null (the replay just skips that line)
      const rejectedIndex = Number.isInteger(s.rejectedIndex) && s.rejectedIndex >= 0 &&
        s.rejectedIndex < optionCount && s.rejectedIndex !== selectedIndex ? s.rejectedIndex : null;
      return {
        selectedIndex,
        confirmed: Boolean(s.confirmed) && selectedIndex !== null,
        rerollsUsed: Number.isInteger(s.rerollsUsed) && s.rerollsUsed > 0 ? s.rerollsUsed : 0,
        rejectedIndex
      };
    });

    const allConfirmed = stages.every(s => s.confirmed);
    let pendingStage = null;
    if (parsed.pendingStage === 'farewell' && allConfirmed) {
      pendingStage = 'farewell';
    } else if (Number.isInteger(parsed.pendingStage) && parsed.pendingStage > 0 &&
      parsed.pendingStage < stages.length && stages[parsed.pendingStage - 1].confirmed &&
      !stages[parsed.pendingStage].confirmed) {
      pendingStage = parsed.pendingStage;
    }
    const pendingUnlockTime = pendingStage !== null && typeof parsed.pendingUnlockTime === 'number'
      ? parsed.pendingUnlockTime : null;

    const introCompleted = Boolean(parsed.introCompleted);
    const introStep = Number.isInteger(parsed.introStep) && parsed.introStep >= 0 ? parsed.introStep : 0;

    return {
      ...defaults,
      introStep,
      introCompleted,
      stages,
      pendingStage: pendingUnlockTime === null ? null : pendingStage,
      pendingUnlockTime,
      farewellReached: Boolean(parsed.farewellReached) && allConfirmed && introCompleted,
      finishedAt: typeof parsed.finishedAt === 'number' ? parsed.finishedAt : null,
      rating: typeof parsed.rating === 'string' ? parsed.rating : null
    };
  }

  save() {
    // `dirty` = the last write failed; pagehide retries it (flush) instead of
    // blindly rewriting, so a closing tab never undoes ?reset=1 or another tab.
    this.dirty = !Store.set(CONFIG.STORAGE_KEY, JSON.stringify(this.state));
    if (this.dirty && !this.warnedNoStorage) {
      this.warnedNoStorage = true;
      console.warn('Storage is unavailable: progress lives only in this tab');
    }
  }

  flush() {
    if (this.dirty) this.save();
  }

  reset() {
    this.state = this.getDefaultState();
    this.save();
  }

  update(changes) {
    this.state = { ...this.state, ...changes };
    this.save();
  }

  updateStage(index, changes) {
    const stages = [...this.state.stages];
    stages[index] = { ...stages[index], ...changes };
    this.update({ stages });
  }

  get(key) {
    return this.state[key];
  }

  getStage(index) {
    return this.state.stages[index];
  }

  getRerollsLeft(index) {
    const used = this.state.stages[index]?.rerollsUsed ?? 0;
    return Math.max(0, CONFIG.MAX_REROLLS - used);
  }

  areAllStagesConfirmed() {
    return this.state.stages.every(s => s.confirmed);
  }
}

// ============================================
// TIMER
// ============================================

class Timer {
  constructor() {
    this.intervalId = null;
    this.unlockTime = null;
    this.onComplete = null;
    this.onTick = null;
  }

  start(unlockTime, { onTick = null, onComplete = null } = {}) {
    this.stop();
    this.unlockTime = unlockTime;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.intervalId = setInterval(() => this.update(), 250);
    this.update();
  }

  isRunning() {
    return this.intervalId !== null;
  }

  // Re-check right away (e.g. when the tab becomes visible again).
  refresh() {
    if (this.isRunning()) this.update();
  }

  // Ends the wait now, through the same completion path as natural expiry.
  finishNow() {
    if (!this.isRunning()) return;
    this.complete();
  }

  complete() {
    const onComplete = this.onComplete;
    this.stop();
    if (onComplete) onComplete();
  }

  update() {
    const remaining = this.unlockTime - Date.now();
    if (remaining <= 0) {
      this.complete();
      return;
    }
    if (this.onTick) this.onTick(remaining);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onComplete = null;
    this.onTick = null;
  }
}

// ============================================
// ROULETTE — the visible draw over the pool of options
// ============================================
//
// All options of the current stage are shown as tiles. A spotlight runs
// round them clockwise, fast at first, slows down, "almost stops" on the
// neighbour of the winner, then creeps one more step onto it. The winner is
// decided (and saved) BEFORE the spin; the path is built backwards from it,
// so it always lands exactly there.

class Roulette {
  constructor(poolEl, sound) {
    this.el = poolEl;
    this.sound = sound;
    this.tiles = [...poolEl.querySelectorAll('.tile')];
    this.cols = Number(poolEl.dataset.cols) || 2;
    this.lit = null;
  }

  // Clockwise loop through the grid, limited to the tiles still in play.
  ringOrder(inPlay) {
    const n = this.tiles.length;
    const cols = this.cols;
    const rows = Math.ceil(n / cols);
    let ring;
    if (cols === 2) {
      // down the right column, back up the left one
      const right = [];
      const left = [];
      for (let i = 0; i < n; i++) (i % 2 ? right : left).push(i);
      ring = [left[0], ...right, ...left.slice(1).reverse()];
    } else {
      ring = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols && r * cols + c < n; c++) row.push(r * cols + c);
        ring.push(...(r % 2 ? row.reverse() : row));
      }
    }
    return ring.filter(i => inPlay.includes(i));
  }

  buildSequence(target, inPlay) {
    const ring = this.ringOrder(inPlay);
    const m = ring.length;
    const at = ring.indexOf(target);
    if (m <= 1 || at === -1) return [target];
    const hops = 3 * m + 3 + Math.floor(Math.random() * m); // a few laps
    const seq = [];
    for (let k = hops; k >= 0; k--) seq.push(ring[(((at - k) % m) + m) % m]);
    return seq; // seq[last] = winner, seq[last - 1] = its neighbour (near-miss)
  }

  // How long the spotlight stays on each position: accelerating ease-out
  // over ROLL_MS, then the long near-miss pause, then the final creep.
  buildWaits(count) {
    const run = Math.max(1, count - 2);
    const raw = [];
    for (let k = 0; k < run; k++) {
      const t = run > 1 ? k / (run - 1) : 1;
      raw.push(45 + 330 * Math.pow(t, 2.4));
    }
    const scale = CONFIG.ROLL_MS / raw.reduce((a, b) => a + b, 0);
    return [...raw.map(v => v * scale), CONFIG.NEAR_MISS_MS];
  }

  light(index, { creep = false } = {}) {
    if (this.lit !== null) this.tiles[this.lit].classList.remove('is-lit', 'is-teeter', 'is-creep');
    const tile = this.tiles[index];
    tile.classList.toggle('is-creep', creep);
    tile.classList.add('is-lit');
    this.lit = index;
  }

  async spin(target, inPlay) {
    const seq = this.buildSequence(target, inPlay);
    const waits = this.buildWaits(seq.length);
    this.el.classList.add('is-rolling');
    for (let k = 0; k < seq.length; k++) {
      const last = k === seq.length - 1;
      this.light(seq[k], { creep: last });
      if (k === seq.length - 2) this.tiles[seq[k]].classList.add('is-teeter');
      this.sound?.playSpin();
      Utils.vibrate(last ? 30 : 8);
      if (!last) await Utils.wait(waits[k]);
    }
  }

  // Lands straight on the winner (reduced motion / single option).
  settle(target) {
    this.el.classList.add('is-rolling');
    this.light(target);
  }

  reset() {
    this.el.classList.remove('is-rolling');
    this.lit = null;
    this.tiles.forEach(t => t.classList.remove('is-lit', 'is-teeter', 'is-creep', 'is-win', 'is-out'));
  }
}

// ============================================
// STORY IMAGE (1080×1920 PNG of the day)
// ============================================

class StoryImage {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  async ensureFonts() {
    if (!document.fonts?.load) return;
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('700 120px "Unbounded"', 'Цього дня'),
          document.fonts.load('700 52px "Unbounded"', 'Їжак ґанок є'),
          document.fonts.load('500 40px "Onest"', 'Їжак ґанок є'),
          document.fonts.load('600 40px "Onest"', 'Їжак ґанок є')
        ]),
        Utils.wait(3000)
      ]);
    } catch (e) {
      // fall back to system fonts
    }
  }

  loadForCanvas(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), 3000);
      img.onload = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = src;
    });
  }

  wrapLines(ctx, text, maxWidth, maxLines) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const attempt = line ? `${line} ${word}` : word;
      if (ctx.measureText(attempt).width <= maxWidth || !line) {
        line = attempt;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = `${kept[maxLines - 1]}…`;
      return kept;
    }
    return lines;
  }

  fitFont(ctx, text, weight, size, family, maxWidth, minSize) {
    let s = size;
    ctx.font = `${weight} ${s}px ${family}`;
    while (ctx.measureText(text).width > maxWidth && s > minSize) {
      s -= 2;
      ctx.font = `${weight} ${s}px ${family}`;
    }
    return s;
  }

  async render(date = new Date()) {
    await this.ensureFonts();

    const W = 1080;
    const H = 1920;
    const PAD = 96;
    const display = '"Unbounded", "Arial Black", sans-serif';
    const text = '"Onest", system-ui, -apple-system, "Segoe UI", sans-serif';
    const { ink, cream, accent } = PALETTE;
    const soft = Color.soft(cream, ink);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // Date
    ctx.fillStyle = soft;
    ctx.font = `500 40px ${text}`;
    const dateText = date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(dateText.charAt(0).toUpperCase() + dateText.slice(1), PAD, 210);

    // Title
    ctx.fillStyle = cream;
    this.fitFont(ctx, 'Цього дня', 700, 132, display, W - PAD * 2, 80);
    ctx.fillText('Цього дня', PAD - 6, 360);

    // Route
    const stages = DATE_OPTIONS.stages;
    const top = 500;
    const bottom = H - 280;
    const rowH = (bottom - top) / stages.length;
    const D = 150; // thumbnail diameter
    const cx = PAD + D / 2;
    const textX = PAD + D + 48;
    const textW = W - textX - PAD;

    // connecting line
    ctx.strokeStyle = Color.rgba(cream, 0.22);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, top + rowH / 2);
    ctx.lineTo(cx, top + rowH * (stages.length - 0.5));
    ctx.stroke();

    const images = await Promise.all(stages.map((stage, i) => {
      const st = this.stateManager.getStage(i);
      if (!st.confirmed || st.selectedIndex === null) return null;
      return this.loadForCanvas(stage.options[st.selectedIndex].image);
    }));

    stages.forEach((stage, i) => {
      const st = this.stateManager.getStage(i);
      const cy = top + rowH * (i + 0.5);
      const color = stageColor(i);

      // ring in the stage colour
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, D / 2 + 10, 0, Math.PI * 2);
      ctx.fill();

      const img = images[i];
      const chosen = st.selectedIndex !== null ? stage.options[st.selectedIndex] : null;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, D / 2, 0, Math.PI * 2);
      ctx.clip();
      if (img && chosen?.fit === 'contain') {
        // logos: whole picture on white, no crop
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
        const box = D * 0.74;
        const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      } else if (img) {
        const scale = Math.max(D / img.naturalWidth, D / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      } else {
        ctx.fillStyle = Color.mix(cream, color, 0.25);
        ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
        ctx.font = `72px ${text}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stage.emoji, cx, cy + 4);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();

      // label + name
      const name = st.confirmed && st.selectedIndex !== null ? stage.options[st.selectedIndex].text : '—';
      ctx.font = `700 52px ${display}`;
      const lines = this.wrapLines(ctx, name, textW, 2);
      const lineH = 62;
      const blockH = 48 + lines.length * lineH;
      let y = cy - blockH / 2 + 34;

      ctx.fillStyle = soft;
      ctx.font = `600 34px ${text}`;
      ctx.fillText(`${Utils.pad2(i + 1)}  ${stage.emoji}`, textX, y);

      ctx.fillStyle = cream;
      ctx.font = `700 52px ${display}`;
      y += 20;
      lines.forEach(line => {
        y += lineH;
        ctx.fillText(line, textX, y - 8);
      });
    });

    // Footer
    ctx.fillStyle = accent;
    ctx.font = `600 44px ${text}`;
    ctx.fillText('Дякую за чудовий день! 🎉', PAD, H - 150);

    return canvas;
  }

  fileName(date = new Date()) {
    return `roadmap-${Utils.localDateString(date)}.png`;
  }

  toFile(canvas, date = new Date()) {
    return new Promise(resolve => {
      try {
        canvas.toBlob(blob => {
          if (!blob) {
            resolve(null);
            return;
          }
          try {
            resolve(new File([blob], this.fileName(date), { type: 'image/png' }));
          } catch (e) {
            // Very old browsers without the File constructor
            blob.name = this.fileName(date);
            resolve(blob);
          }
        }, 'image/png');
      } catch (e) {
        console.error('Could not export the picture:', e);
        resolve(null);
      }
    });
  }

  canShareFile(file) {
    if (!file || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
      return false;
    }
    try {
      return navigator.canShare({ files: [file] });
    } catch (e) {
      return false;
    }
  }

  // On phones the share sheet is what actually lets you "Save Image"
  // (iOS ignores <a download>), so share when sharing files is supported,
  // otherwise download a PNG. Pass a ready file to keep the share call inside
  // the tap (browsers require that).
  async save(canvas, preparedFile = null, date = new Date()) {
    const file = preparedFile || await this.toFile(canvas, date);
    if (!file) {
      Toast.show('Не вдалося зберегти картинку 😔', 'error');
      return;
    }

    if (this.canShareFile(file)) {
      try {
        await navigator.share({ files: [file] });
        Toast.show('Готово! 🎉', 'success');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user closed the share sheet
        console.warn('Share failed, falling back to download:', err);
      }
    }

    this.downloadFile(file);
  }

  downloadFile(file) {
    try {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || this.fileName();
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      Toast.show('Картинку збережено! 🎉', 'success');
      Utils.vibrate([50, 30, 50]);
    } catch (error) {
      console.error('Error downloading the picture:', error);
      Toast.show('Не вдалося зберегти картинку 😔', 'error');
    }
  }
}

// ============================================
// MAIN APP — one full-screen scene at a time
// ============================================
//
// Scenes: intro (5 slides) → for each stage: question → draw/result → wait
// → (tap) next stage … → final. The scene is always derived from the saved
// state, so a reload lands exactly where Мері was.

const RATING_MESSAGES = {
  excited: 'У захваті? Оце я розумію — день вдався! 🤩',
  laughing: 'Класно, що було так весело! 😂',
  happy: 'Супер, радий, що тобі сподобалося! 😊',
  neutral: 'Дякую за чесність! Наступного разу буде ще краще 🙂',
  speechless: 'Без слів? Сподіваюся, це хороше «без слів» 😄',
  sad: 'Ой… Вибач, якщо щось пішло не так. Я все виправлю! 🙏'
};

const RATINGS = [
  ['excited', '🤩', 'У захваті'],
  ['laughing', '😂', 'Дуже весело'],
  ['happy', '😊', 'Добре'],
  ['neutral', '😐', 'Нормально'],
  ['speechless', '😶', 'Без слів'],
  ['sad', '😢', 'Сумно']
];

class DateRandomizerApp {
  constructor() {
    this.stateManager = new StateManager();
    this.soundManager = new SoundManager();
    this.timer = new Timer();
    this.conversationTopics = new ConversationTopics();
    this.storyImage = new StoryImage(this.stateManager);
    this.scenesEl = null;
    this.scene = null;
    this.roulette = null;
    this.busy = false;
    this.introCount = 0;
    this.preloadedImages = [];
    this.storyCanvas = null;
    this.storyFile = null;
    this.storyPromise = null;
    this.celebrateFinal = false;
    this.themeMeta = null;
    this.topicsForStage = null;
  }

  init() {
    try {
      this.stateManager.load();
      this.soundManager.init();

      this.scenesEl = Utils.$('#scenes');
      this.themeMeta = document.querySelector('meta[name="theme-color"]');
      this.introCount = Utils.$$('template[id^="tpl-intro-"]').length;

      this.setupHeader();
      this.setupRouteSheet();
      document.addEventListener('keydown', (e) => {
        if (this.scene?.type !== 'replay') return;
        if (e.key === 'ArrowRight') this.guard(() => this.replayStep(1));
        else if (e.key === 'ArrowLeft') this.guard(() => this.replayStep(-1));
        else if (e.key === 'Escape') this.guard(() => this.closeReplay());
      });

      this.show(this.sceneFromState(), { animate: false });

      // Re-fit headings once the web fonts have arrived, and on rotation
      if (document.fonts?.ready) document.fonts.ready.then(() => this.refit());
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.refit(), 150);
      });
    } catch (error) {
      console.error('❌ Error during initialization:', error);
    }
  }

  // ---------- state → scene ----------

  sceneFromState() {
    const s = this.stateManager.state;
    const last = STAGE_COUNT - 1;

    if (s.farewellReached) return { type: 'final' };
    if (!s.introCompleted) {
      return { type: 'intro', step: Math.min(s.introStep, Math.max(0, this.introCount - 1)) };
    }
    if (s.pendingStage !== null) {
      return { type: 'wait', stageIndex: s.pendingStage === 'farewell' ? last : s.pendingStage - 1 };
    }

    const current = s.stages.findIndex(st => !st.confirmed);
    if (current === -1) {
      // everything confirmed but nothing pending: the finale is ready
      this.stateManager.update({ pendingStage: 'farewell', pendingUnlockTime: Date.now() });
      return { type: 'wait', stageIndex: last };
    }
    return s.stages[current].selectedIndex === null
      ? { type: 'question', stageIndex: current }
      : { type: 'draw', stageIndex: current, mode: 'restore' };
  }

  // Runs a user action once; taps during a transition/draw are ignored.
  async guard(action) {
    if (this.busy) return;
    this.busy = true;
    try {
      await action();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      this.busy = false;
    }
  }

  async show(scene, { animate = true, back = false } = {}) {
    this.timer.stop();
    this.closeRoute();
    this.scene = scene;
    this.roulette = null;

    let view;
    switch (scene.type) {
      case 'intro': view = this.buildIntro(scene); break;
      case 'question':
      case 'draw': view = this.buildStage(scene); break;
      case 'wait': view = this.buildWait(scene); break;
      case 'replay': view = this.buildReplay(scene); break;
      default: view = this.buildFinal(scene);
    }

    this.applyChapter(scene);
    this.updateHeader(scene);
    // a finished day is marked in the browser tab too
    document.title = this.stateManager.get('farewellReached') ? `✓ ${BASE_TITLE}` : BASE_TITLE;
    await this.swap(view.el, animate, back);
    if (view.after) await view.after();
  }

  async swap(el, animate, back = false) {
    const old = [...this.scenesEl.querySelectorAll('.scene')];
    this.scenesEl.appendChild(el);
    this.refit(el);

    if (!animate || !old.length || Utils.reducedMotion()) {
      old.forEach(o => o.remove());
      return;
    }
    const inCls = back ? 'scene-in-back' : 'scene-in';
    old.forEach(o => o.classList.add(back ? 'scene-out-back' : 'scene-out'));
    el.classList.add(inCls);
    await Utils.wait(CONFIG.SCENE_MS);
    old.forEach(o => o.remove());
    el.classList.remove(inCls);
  }

  makeScene(kind) {
    const el = document.createElement('section');
    el.className = `scene scene-${kind}`;
    el.innerHTML = '<div class="scene-body"></div><div class="scene-actions"></div>';
    return { el, body: el.firstElementChild, actions: el.lastElementChild };
  }

  refit(root = this.scenesEl) {
    if (!root) return;
    root.querySelectorAll('.fit').forEach(el => Utils.fit(el, Number(el.dataset.fitMin) || 22));
    const stages = root.classList?.contains('scene-stage') ? [root] : root.querySelectorAll('.scene-stage');
    stages.forEach(s => this.layoutPool(s));
    const bodies = root.classList?.contains('scene-body') ? [root] : root.querySelectorAll('.scene-body');
    bodies.forEach(body => this.updateScrollHint(body));
  }

  // Fades the bottom edge while there is more content to scroll to.
  updateScrollHint(body) {
    if (!body.dataset.hint) {
      body.dataset.hint = '1';
      body.addEventListener('scroll', () => this.updateScrollHint(body), { passive: true });
    }
    const more = body.scrollHeight - body.clientHeight - body.scrollTop > 4;
    body.classList.toggle('is-scrollable', more);
  }

  // ---------- look: chapter colours, header ----------

  chapterFor(scene) {
    if (scene.type === 'replay') {
      return Color.chapter(scene.stageIndex === undefined ? PALETTE.cream : stageColor(scene.stageIndex));
    }
    if (scene.type === 'intro') return Color.chapter(PALETTE.cream);
    if (scene.type === 'final') return Color.chapter(PALETTE.ink);
    return Color.chapter(stageColor(scene.stageIndex));
  }

  applyChapter(scene) {
    const c = this.chapterFor(scene);
    const root = document.documentElement;
    const vars = {
      '--bg': c.bg,
      '--fg': c.fg,
      '--fg-soft': c.soft,
      '--surface': c.surface,
      '--surface-soft': c.surfaceSoft,
      '--btn-bg': c.btnBg,
      '--btn-fg': c.btnFg,
      '--track': c.track,
      '--line': c.line,
      '--accent': c.accent
    };
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.tone = c.dark ? 'dark' : 'light';
    root.dataset.chapter = ['intro', 'final', 'replay'].includes(scene.type) ? scene.type : 'stage';
    if (this.themeMeta) this.themeMeta.setAttribute('content', c.bg);
    this.chapter = c;
  }

  setupHeader() {
    const sound = Utils.$('#soundToggle');
    const syncSound = () => {
      sound.classList.toggle('is-muted', !this.soundManager.enabled);
      sound.setAttribute('aria-pressed', String(this.soundManager.enabled));
      sound.setAttribute('aria-label', this.soundManager.enabled ? 'Вимкнути звук' : 'Увімкнути звук');
    };
    syncSound();
    sound.addEventListener('click', () => {
      const enabled = this.soundManager.toggle();
      syncSound();
      if (enabled) this.soundManager.playClick();
    });

    Utils.$('#routeBtn').addEventListener('click', () => this.openRoute());
    Utils.$('#replayClose').addEventListener('click', () => this.guard(() => this.closeReplay()));
    Utils.$('#progress').addEventListener('click', () => {
      if (this.routeAvailable()) this.openRoute();
    });
  }

  routeAvailable() {
    return Boolean(this.scene) && ['question', 'draw', 'wait'].includes(this.scene.type);
  }

  updateHeader(scene) {
    const progress = Utils.$('#progress');
    const kicker = Utils.$('#kicker');
    const routeBtn = Utils.$('#routeBtn');
    const total = scene.type === 'intro' ? this.introCount
      : (scene.type === 'replay' ? this.replaySlides().length : STAGE_COUNT);

    if (progress.children.length !== total) {
      progress.innerHTML = Array.from({ length: total }, () => '<span class="seg"><i></i></span>').join('');
    }

    const states = Array.from({ length: total }, (_, i) => {
      if (scene.type === 'intro') return i < scene.step ? 'done' : (i === scene.step ? 'current' : '');
      if (scene.type === 'replay') return i < scene.slide ? 'done' : (i === scene.slide ? 'current' : '');
      if (scene.type === 'final') return 'done';
      if (scene.type === 'wait') {
        if (i <= scene.stageIndex) return 'done';
        return i === scene.stageIndex + 1 ? 'next' : '';
      }
      return i < scene.stageIndex ? 'done' : (i === scene.stageIndex ? 'current' : '');
    });
    [...progress.children].forEach((seg, i) => {
      seg.className = `seg ${states[i] ? `is-${states[i]}` : ''}`.trim();
      seg.style.setProperty('--fill', states[i] === 'done' || states[i] === 'current' ? '1' : '0');
    });

    const interactive = this.routeAvailable();
    progress.classList.toggle('is-interactive', interactive);
    progress.setAttribute('aria-disabled', String(!interactive));
    progress.tabIndex = interactive ? 0 : -1;
    routeBtn.hidden = !interactive;
    Utils.$('#replayClose').hidden = scene.type !== 'replay';
    kicker.classList.toggle('is-badge', scene.type === 'final');

    const n = `${Utils.pad2((scene.stageIndex ?? 0) + 1)} / ${Utils.pad2(STAGE_COUNT)}`;
    // Owner safety net: the 5-second test mode is visible in the label
    const tag = FAST_MODE ? 'тест' : 'пауза';
    let text = '';
    if (scene.type === 'final') text = `✓ Пройдено · ${this.finishedDateText()}`;
    else if (scene.type === 'replay') text = 'Спогад про день';
    else if (scene.type === 'wait') text = `Етап ${n} · ${tag}`;
    else if (scene.type !== 'intro') text = FAST_MODE ? `Етап ${n} · тест` : `Етап ${n}`;
    else if (FAST_MODE) text = 'Тестовий режим';
    kicker.textContent = text;
  }

  setNextSegmentFill(fraction) {
    const seg = Utils.$('#progress .seg.is-next');
    if (seg) seg.style.setProperty('--fill', String(Math.max(0, Math.min(1, fraction))));
  }

  // ---------- intro ----------

  buildIntro(scene) {
    const { el, body, actions } = this.makeScene('intro');
    const tpl = document.getElementById(`tpl-intro-${scene.step + 1}`);
    if (tpl) body.appendChild(tpl.content.cloneNode(true));
    const label = tpl?.dataset.button || 'Продовжити';
    actions.innerHTML = `<button class="btn" type="button">${Utils.escapeHtml(label)}${Utils.icon('arrow')}</button>`;
    actions.querySelector('.btn').addEventListener('click', () => this.guard(() => this.nextIntro()));
    return { el };
  }

  async nextIntro() {
    this.soundManager.playClick();
    Utils.vibrate(30);
    const step = this.scene.step;
    if (step < this.introCount - 1) {
      this.stateManager.update({ introStep: step + 1 });
      await this.show({ type: 'intro', step: step + 1 });
    } else {
      this.stateManager.update({ introCompleted: true });
      await this.show(this.sceneFromState());
    }
  }

  // ---------- stage: question → roulette → reveal (one scene) ----------
  //
  // Phases (class on the scene): phase-pool (question + all options),
  // phase-rolling (spotlight running), phase-revealed (big photo + name).
  // Scene type is 'question' before a pick and 'draw' once one is saved.

  buildStage(scene) {
    const i = scene.stageIndex;
    const stage = DATE_OPTIONS.stages[i];
    const n = stage.options.length;
    const cols = n <= 3 ? n : (n === 4 ? 2 : 3);
    const ratio = stageRatio(i);
    const { el, body } = this.makeScene('stage');
    el.dataset.ratio = String(ratio);

    body.innerHTML = `
      <p class="draw-question">${Utils.escapeHtml(stage.question)}</p>
      <h1 class="heading fit stage-head" data-fit-min="24">${Utils.headingHtml(stage.question)}</h1>
      <div class="pool-block">
        <p class="pool-label">${this.poolLabel(n)}</p>
        <div class="pool" role="list" data-cols="${cols}" style="--cols: ${cols}"></div>
      </div>
      <div class="reveal" style="--r: ${ratio}">
        <div class="hero-slot"></div>
        <p class="option-name" aria-live="polite"></p>
        <div class="map-slot"></div>
        <p class="draw-note"></p>
      </div>`;

    const pool = body.querySelector('.pool');
    stage.options.forEach((option, index) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.setAttribute('role', 'listitem');
      tile.dataset.index = String(index);
      const photo = createPhoto(option, stage);
      const cross = document.createElement('span');
      cross.className = 'tile-x';
      cross.innerHTML = Utils.icon('close');
      photo.appendChild(cross);
      const name = document.createElement('p');
      name.className = 'tile-name';
      name.textContent = option.text;
      tile.append(photo, name);
      pool.appendChild(tile);
    });
    this.roulette = new Roulette(pool, this.soundManager);
    this.preloadStageImages(i);

    const selected = this.stateManager.getStage(i).selectedIndex;
    if (scene.type === 'draw' && selected !== null) {
      // restore: straight to the result, no replay
      this.showResult(el, i, selected, { animate: false });
    } else {
      el.classList.add('phase-pool');
      this.renderPoolActions(el, i);
    }
    return { el };
  }

  poolLabel(count, again = false) {
    const word = Utils.plural(count, 'варіант', 'варіанти', 'варіантів');
    return again
      ? `Залишилось ${count} — доля обере ще раз`
      : `${count} ${word} — доля обере один`;
  }

  renderPoolActions(el, i) {
    const actions = el.querySelector('.scene-actions');
    actions.innerHTML = `<button class="btn" type="button" data-action="draw">${Utils.icon('shuffle')}<span>Обрати варіант</span></button>`;
    actions.querySelector('.btn').addEventListener('click', () => this.guard(() => this.startDraw(i)));
  }

  renderResultActions(el, i) {
    const actions = el.querySelector('.scene-actions');
    actions.innerHTML = `
      <button class="btn" type="button" data-action="confirm">${Utils.icon('check')}<span>Підтверджую!</span></button>
      <div class="quiet-row"></div>`;
    actions.querySelector('[data-action="confirm"]').addEventListener('click', () => this.guard(() => this.confirmStage(i)));
    this.renderRerollRow(el, i);
  }

  // Tile photo height: as large as the 4:3 / 2:3 / 1:1 shape allows, but
  // shrunk so the question, the pool and the button fit without scrolling.
  layoutPool(sceneEl) {
    const pool = sceneEl.querySelector('.pool');
    if (!pool || sceneEl.classList.contains('phase-revealed')) return;
    const body = sceneEl.querySelector('.scene-body');
    const head = sceneEl.querySelector('.stage-head');
    const label = sceneEl.querySelector('.pool-label');
    const block = sceneEl.querySelector('.pool-block');
    const first = pool.firstElementChild;
    if (!body || !head || !label || !block || !first) return;

    const cols = Number(pool.dataset.cols) || 2;
    const rows = Math.ceil(pool.children.length / cols);
    const ratio = Number(sceneEl.dataset.ratio) || 4 / 3;
    const ps = getComputedStyle(pool);
    const gapX = parseFloat(ps.columnGap) || 0;
    const gapY = parseFloat(ps.rowGap) || 0;
    const colW = (pool.clientWidth - gapX * (cols - 1)) / cols;
    const nameH = first.querySelector('.tile-name')?.offsetHeight || 36;
    const tileGap = parseFloat(getComputedStyle(first).rowGap) || 8;
    const bs = getComputedStyle(body);
    const inner = body.clientHeight - parseFloat(bs.paddingTop) - parseFloat(bs.paddingBottom);
    const used = head.offsetHeight + label.offsetHeight +
      parseFloat(getComputedStyle(label).marginBottom) + parseFloat(getComputedStyle(block).paddingTop);
    const room = (inner - used - gapY * (rows - 1)) / rows - nameH - tileGap;
    const h = Math.max(64, Math.min(colW / ratio, 236, room));
    pool.style.setProperty('--tile-h', `${Math.floor(h)}px`);
  }

  preloadStageImages(index) {
    DATE_OPTIONS.stages[index]?.options.forEach(option => {
      const img = new Image();
      img.src = option.image;
      this.preloadedImages.push(img);
    });
  }

  pickIndex(stageIndex, excludeIndex = null) {
    const all = DATE_OPTIONS.stages[stageIndex].options.map((_, i) => i);
    const pool = excludeIndex !== null && all.length > 1 ? all.filter(i => i !== excludeIndex) : all;
    return Utils.randomItem(pool);
  }

  // After bfcache / a long time in the background: the countdown is always
  // derived from the saved unlock time, so just re-check it now.
  resume() {
    this.timer.refresh();
    if (this.busy || this.scene?.type !== 'wait') return;
    const el = this.currentSceneEl();
    if (el && !el.classList.contains('is-done') && !this.timer.isRunning()) {
      this.show(this.sceneFromState(), { animate: false });
    }
  }

  currentSceneEl() {
    return this.scenesEl.querySelector('.scene:last-child');
  }

  async startDraw(i) {
    const st = this.stateManager.getStage(i);
    if (st.confirmed) return;
    const el = this.currentSceneEl();
    if (st.selectedIndex !== null) {
      this.showResult(el, i, st.selectedIndex, { animate: false });
      return;
    }
    // The result is decided and saved BEFORE the roulette, so a reload
    // mid-draw can't hand out a free extra draw.
    const target = this.pickIndex(i);
    this.stateManager.updateStage(i, { selectedIndex: target });
    this.scene = { type: 'draw', stageIndex: i };
    this.soundManager.playClick();
    await this.runDraw(el, i, target, null);
  }

  async runDraw(el, i, target, excluded) {
    const stage = DATE_OPTIONS.stages[i];
    this.setActionsVisible(el, false);
    el.classList.add('phase-rolling');

    // every picture should be in before the spotlight starts (they are
    // already on screen, so this is normally instant)
    await Promise.race([
      Promise.all(stage.options.map(o => Utils.loadImage(o.image))),
      Utils.wait(1500)
    ]);

    const inPlay = stage.options.map((_, k) => k).filter(k => k !== excluded);
    el.querySelector('.pool-label').textContent = excluded === null ? 'Доля обирає…' : 'Доля обирає ще раз…';
    if (Utils.reducedMotion() || inPlay.length <= 1) {
      this.roulette.settle(target);
    } else {
      await this.roulette.spin(target, inPlay);
    }
    await this.showResult(el, i, target, { animate: !Utils.reducedMotion() });
  }

  // Winner grows from its tile into the big photo (FLIP), losers drop away.
  async showResult(el, i, target, { animate = true } = {}) {
    const stage = DATE_OPTIONS.stages[i];
    const option = stage.options[target];
    const slot = el.querySelector('.hero-slot');
    const nameEl = el.querySelector('.option-name');
    const question = el.querySelector('.draw-question');

    const hero = createPhoto(option, stage, 'hero');
    slot.replaceChildren(hero);

    const tile = this.roulette?.tiles[target];
    let from = null;
    // (restore / reduced motion take the synchronous path: no awaits, no flash)
    if (animate && tile && !el.classList.contains('phase-revealed')) {
      this.setActionsVisible(el, false);
      const heroImg = hero.querySelector('img');
      const decoded = typeof heroImg.decode === 'function' ? heroImg.decode().catch(() => {}) : Promise.resolve();
      await Promise.race([decoded, Utils.wait(CONFIG.IMAGE_WAIT_MS)]);
      Utils.restartAnimation(tile, 'is-win');
      this.soundManager.playSuccess();
      Utils.vibrate([30, 50, 120]);
      await Utils.wait(300);
      this.roulette.tiles.forEach(t => { if (t !== tile) t.classList.add('is-out'); });
      el.querySelector('.stage-head')?.classList.add('is-out');
      el.querySelector('.pool-label')?.classList.add('is-out');
      await Utils.wait(260);
      from = tile.querySelector('.photo').getBoundingClientRect();
    }

    // The (taller) result controls are rendered only now, in the same frame
    // the pool is replaced, so nothing visible jumps.
    this.renderResultActions(el, i);
    if (from) this.setActionsVisible(el, false);
    el.classList.remove('phase-pool', 'phase-rolling');
    el.classList.add('phase-revealed');
    nameEl.textContent = option.text;
    Utils.fit(nameEl, 18);
    const mapSlot = el.querySelector('.map-slot');
    const mapLink = createMapLink(option);
    mapSlot.replaceChildren(...(mapLink ? [mapLink] : []));
    checkLowRes(hero); // now that the big photo has its real size

    if (from) {
      mapSlot.style.animationDelay = '260ms';
      Utils.restartAnimation(mapSlot, 'fade-up');
      const to = hero.getBoundingClientRect();
      const s = from.width / to.width;
      const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      const grow = hero.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }],
        { duration: 560, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' }
      );
      Utils.restartAnimation(question, 'fade-up');
      nameEl.style.animationDelay = '180ms';
      Utils.restartAnimation(nameEl, 'fade-up');
      await grow.finished.catch(() => {});
      const r = hero.getBoundingClientRect();
      this.burst(null, { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight });
    }

    this.setActionsVisible(el, true);
    if (from) Utils.restartAnimation(el.querySelector('.scene-actions'), 'fade-up');
    this.refit(el);
  }

  setActionsVisible(el, visible) {
    el.querySelector('.scene-actions')?.classList.toggle('is-hidden', !visible);
    el.querySelector('.draw-note')?.classList.toggle('is-hidden', !visible);
  }

  renderRerollRow(el, i) {
    const row = el.querySelector('.quiet-row');
    const note = el.querySelector('.draw-note');
    if (!row || !note) return;
    const left = this.stateManager.getRerollsLeft(i);
    if (left > 0) {
      row.innerHTML = `<button class="btn-quiet" type="button" data-action="reroll">${Utils.icon('refresh')}<span>Інший варіант</span></button>`;
      row.querySelector('button').addEventListener('click', () => this.guard(() => this.reroll(i)));
      note.textContent = left === 1
        ? 'Передумати можна лише раз 😉'
        : `Передумати можна ще ${left} ${Utils.plural(left, 'раз', 'рази', 'разів')} 😉`;
    } else {
      row.innerHTML = '<p class="quiet-line">🔮 Доля сказала своє слово!</p>';
      note.textContent = '';
    }
  }

  // "Інший варіант": limited by CONFIG.MAX_REROLLS, never returns the option
  // that was just rejected (it stays crossed out), saved before the roulette.
  async reroll(i) {
    const st = this.stateManager.getStage(i);
    if (st.confirmed || st.selectedIndex === null || !this.roulette) return;
    if (this.stateManager.getRerollsLeft(i) <= 0) return;

    const rejected = st.selectedIndex;
    const target = this.pickIndex(i, rejected);
    this.stateManager.updateStage(i, {
      selectedIndex: target,
      rerollsUsed: (st.rerollsUsed || 0) + 1,
      rejectedIndex: rejected
    });

    const el = this.currentSceneEl();
    await this.backToPool(el, i, rejected);
    await this.runDraw(el, i, target, rejected);
  }

  // Shrinks the big photo back into its tile, brings the others back and
  // crosses the rejected one out.
  async backToPool(el, i, rejected) {
    const stage = DATE_OPTIONS.stages[i];
    const animate = !Utils.reducedMotion();
    this.setActionsVisible(el, false);
    const heroEl = el.querySelector('.hero');
    const from = heroEl?.getBoundingClientRect();

    this.roulette.reset();
    const label = el.querySelector('.pool-label');
    label.textContent = this.poolLabel(stage.options.length - 1, true);
    el.querySelector('.stage-head')?.classList.remove('is-out');
    label.classList.remove('is-out');
    el.classList.remove('phase-revealed');
    el.classList.add('phase-pool');
    el.querySelector('.option-name').textContent = '';
    this.renderPoolActions(el, i);
    this.setActionsVisible(el, false);
    this.refit(el);

    const tile = this.roulette.tiles[rejected];
    if (animate && from && tile) {
      const photo = tile.querySelector('.photo');
      const to = photo.getBoundingClientRect();
      const s = from.width / to.width;
      const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      this.roulette.tiles.forEach(t => { if (t !== tile) Utils.restartAnimation(t, 'fade-up'); });
      await photo.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }],
        { duration: 460, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' }
      ).finished.catch(() => {});
      this.roulette.tiles.forEach(t => t.classList.remove('fade-up'));
    }
    tile?.classList.add('is-rejected');
    Utils.vibrate(20);
    if (animate) await Utils.wait(650);
  }

  async confirmStage(i) {
    const st = this.stateManager.getStage(i);
    if (st.confirmed || st.selectedIndex === null) return;

    const isLast = i === STAGE_COUNT - 1;
    const unlockTime = Date.now() + CONFIG.DELAY_MS;
    const stages = this.stateManager.get('stages').map((s, k) => (k === i ? { ...s, confirmed: true } : s));

    // One atomic state write, so a reload can never catch a half-done update
    this.stateManager.update({
      stages,
      pendingStage: isLast ? 'farewell' : i + 1,
      pendingUnlockTime: unlockTime
    });

    this.soundManager.playSuccess();
    Utils.vibrate([100, 50, 100]);
    this.burst();
    await this.show({ type: 'wait', stageIndex: i });
  }

  burst(colors, origin = { y: 0.72 }, count = 70) {
    if (typeof confetti !== 'function') return;
    const c = this.chapter || Color.chapter(PALETTE.cream);
    try {
      confetti({
        particleCount: count,
        spread: 70,
        startVelocity: 38,
        ticks: 150,
        scalar: 0.9,
        origin,
        colors: colors || [c.fg, c.dark ? PALETTE.cream : PALETTE.ink, PALETTE.accent, c.surface],
        disableForReducedMotion: true
      });
    } catch (e) {
      // confetti is decoration only
    }
  }

  // ---------- stage: wait ----------

  buildWait(scene) {
    const i = scene.stageIndex;
    const stage = DATE_OPTIONS.stages[i];
    const st = this.stateManager.getStage(i);
    const option = stage.options[st.selectedIndex] || stage.options[0];
    const isFarewell = this.stateManager.get('pendingStage') === 'farewell';
    const { el, body, actions } = this.makeScene('wait');

    body.innerHTML = `
      <div class="chosen">
        <div class="chosen-thumb"></div>
        <div class="chosen-text">
          <p class="chosen-label">Обрано ${stage.emoji}</p>
          <p class="chosen-name">${Utils.escapeHtml(option.text)}</p>
        </div>
      </div>
      <div class="countdown-block">
        <p class="countdown-label">${isFarewell ? 'До фіналу' : 'До наступного етапу'}</p>
        <p class="countdown" role="timer" aria-label="Зворотний відлік"></p>
      </div>`;
    body.querySelector('.chosen-thumb').appendChild(createPhoto(option, stage));
    // directions right where they set off
    const mapLink = createMapLink(option);
    if (mapLink) body.querySelector('.chosen-text').appendChild(mapLink);
    // a fresh question for every new pause; the same one after a reload/re-render
    const freshTopic = this.topicsForStage !== i;
    this.topicsForStage = i;
    body.appendChild(this.conversationTopics.render({ fresh: freshTopic }));

    actions.innerHTML = `
      <div class="teaser">${Utils.icon('lock')}<span>${isFarewell ? 'Далі — фінал' : 'Далі — секрет 🤫'}</span></div>`;

    const countdown = body.querySelector('.countdown');
    this.setupOwnerSkip(countdown);

    const after = async () => {
      const unlockTime = this.stateManager.get('pendingUnlockTime');
      if (Date.now() >= unlockTime) {
        this.setWaitDone(el, { silent: true });
        return;
      }
      this.timer.start(unlockTime, {
        onTick: (remaining) => {
          this.renderCountdown(countdown, remaining);
          this.setNextSegmentFill(1 - remaining / CONFIG.DELAY_MS);
        },
        onComplete: () => this.onWaitComplete(el)
      });
    };
    this.renderCountdown(countdown, Math.max(0, this.stateManager.get('pendingUnlockTime') - Date.now()));
    return { el, after };
  }

  renderCountdown(el, ms) {
    const text = Utils.formatTime(ms);
    if (el.textContent !== text) el.textContent = text;
  }

  // Natural expiry and the owner's long-press both end up here.
  onWaitComplete(el) {
    const unlockTime = this.stateManager.get('pendingUnlockTime');
    if (unlockTime !== null && unlockTime > Date.now()) {
      this.stateManager.update({ pendingUnlockTime: Date.now() });
    }
    this.setWaitDone(el, { silent: false });
  }

  setWaitDone(el, { silent }) {
    if (!el.isConnected || el.classList.contains('is-done')) return;
    const isFarewell = this.stateManager.get('pendingStage') === 'farewell';
    el.classList.add('is-done');
    el.querySelector('.countdown-label').textContent = isFarewell ? 'Фінал уже чекає!' : 'Час вийшов — можна далі!';
    this.renderCountdown(el.querySelector('.countdown'), 0);
    this.setNextSegmentFill(1);

    const actions = el.querySelector('.scene-actions');
    actions.innerHTML = `<button class="btn btn-pop" type="button">${isFarewell ? 'До фіналу' : 'Відкрити наступний етап'}${Utils.icon('arrow')}</button>`;
    actions.querySelector('.btn').addEventListener('click', () => this.guard(() => this.openNext()));

    // The new label + button popping in is the signal; no toast over the header.
    if (!silent) {
      this.soundManager.playUnlock();
      Utils.vibrate([80, 60, 80]);
    }
  }

  async openNext() {
    const pending = this.stateManager.get('pendingStage');
    const unlockTime = this.stateManager.get('pendingUnlockTime');
    if (pending === null || unlockTime === null || Date.now() < unlockTime) return;

    this.soundManager.playClick();
    if (pending === 'farewell') {
      this.stateManager.update({
        farewellReached: true,
        finishedAt: this.stateManager.get('finishedAt') || Date.now(),
        pendingStage: null,
        pendingUnlockTime: null
      });
      this.celebrateFinal = true;
      await this.show({ type: 'final' });
    } else {
      this.stateManager.update({ pendingStage: null, pendingUnlockTime: null });
      await this.show({ type: 'question', stageIndex: pending });
    }
  }

  // Hidden owner shortcut: hold the countdown for ~1.5 s to end the wait now.
  // Deliberately no visual hint.
  setupOwnerSkip(target) {
    let holdTimer = null;

    const cancel = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    target.addEventListener('pointerdown', (e) => {
      if (!this.timer.isRunning()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancel();
      holdTimer = setTimeout(() => {
        holdTimer = null;
        Utils.vibrate(30);
        this.timer.finishNow();
      }, CONFIG.OWNER_SKIP_HOLD_MS);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
      target.addEventListener(type, cancel);
    });

    // No text selection, magnifier or callout menu on long press (iOS/Android)
    target.addEventListener('touchstart', (e) => {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    target.addEventListener('selectstart', (e) => e.preventDefault());
  }

  // ---------- route (bottom sheet + final screen) ----------

  routeItems() {
    const s = this.stateManager.state;
    const openIndex = this.scene && ['question', 'draw'].includes(this.scene.type) ? this.scene.stageIndex : -1;
    return DATE_OPTIONS.stages.map((stage, i) => {
      const st = s.stages[i];
      if (st.confirmed && st.selectedIndex !== null) {
        return { state: 'done', stage, i, option: stage.options[st.selectedIndex] };
      }
      if (i === openIndex) return { state: 'current', stage, i };
      return { state: 'locked', i };
    });
  }

  buildRouteList(list, items) {
    list.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = `route-item is-${item.state}`;
      const thumb = document.createElement('div');
      thumb.className = 'route-thumb';
      const text = document.createElement('div');
      text.className = 'route-text';

      if (item.state === 'done') {
        thumb.appendChild(createPhoto(item.option, item.stage));
        text.innerHTML = `<p class="route-meta">${Utils.pad2(item.i + 1)} · ${item.stage.emoji}</p>
          <p class="route-name">${Utils.escapeHtml(item.option.text)}</p>`;
      } else if (item.state === 'current') {
        thumb.innerHTML = `<span class="route-emoji" aria-hidden="true">${item.stage.emoji}</span>`;
        text.innerHTML = `<p class="route-meta">${Utils.pad2(item.i + 1)} · ${item.stage.emoji}</p>
          <p class="route-name">Обираємо зараз</p>`;
      } else {
        thumb.innerHTML = Utils.icon('lock');
        text.innerHTML = `<p class="route-meta">${Utils.pad2(item.i + 1)}</p>
          <p class="route-name">Поки що секрет 🤫</p>`;
      }
      li.append(thumb, text);
      // directions only for places already chosen — never for a locked stage
      const pin = item.state === 'done' ? createMapLink(item.option, { compact: true }) : null;
      if (pin) li.appendChild(pin);
      list.appendChild(li);
    });
  }

  setupRouteSheet() {
    const sheet = Utils.$('#routeSheet');
    sheet.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => this.closeRoute()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeRoute();
    });
  }

  openRoute() {
    const sheet = Utils.$('#routeSheet');
    this.buildRouteList(Utils.$('#routeSheetList'), this.routeItems());
    sheet.hidden = false;
    Utils.vibrate(15);
    sheet.querySelector('.sheet-head .icon-btn')?.focus({ preventScroll: true });
  }

  closeRoute() {
    const sheet = Utils.$('#routeSheet');
    if (sheet && !sheet.hidden) sheet.hidden = true;
  }

  // ---------- final ----------

  buildFinal() {
    const { el, body, actions } = this.makeScene('final');
    body.innerHTML = `
      <h1 class="display fit" data-fit-min="30">Дякую, <span class="accent">Мері!</span></h1>
      <p class="lead final-lead">Дуже радий, що ми провели цей день разом!</p>
      <p class="section-label">Маршрут дня</p>
      <ol class="route final-route"></ol>
      <p class="section-label">Оціни цей день:</p>
      <div class="rating" role="group" aria-label="Оцінка дня">
        ${RATINGS.map(([id, emoji, label]) =>
          `<button class="rate-btn" type="button" data-rating="${id}" aria-label="${label}" aria-pressed="false">${emoji}</button>`).join('')}
      </div>`;
    actions.innerHTML = `
      <button class="btn" type="button" id="downloadRoadmap">${Utils.icon('download')}<span>Зберегти як картинку</span></button>
      <div class="quiet-row">
        <button class="btn-quiet" type="button" data-action="replay">${Utils.icon('play')}<span>Переглянути день знову</span></button>
      </div>`;

    this.buildRouteList(body.querySelector('.final-route'), this.routeItems());

    body.querySelectorAll('.rate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.dataset.rating;
        this.stateManager.update({ rating });
        this.applyRatingSelection(el, rating);
        Toast.show(RATING_MESSAGES[rating] || 'Дякую за оцінку!', 'success', 3600);
        this.soundManager.playSuccess();
        Utils.vibrate([60, 40, 60]);
      });
    });
    this.applyRatingSelection(el, this.stateManager.get('rating'));

    actions.querySelector('#downloadRoadmap').addEventListener('click', () => this.saveStory());
    actions.querySelector('[data-action="replay"]').addEventListener('click', () => this.guard(() => this.openReplay()));

    const after = async () => {
      if (this.celebrateFinal) {
        this.celebrateFinal = false;
        this.burst([PALETTE.accent, PALETTE.cream, ...PALETTE.stageFallback]);
        setTimeout(() => this.burst([PALETTE.accent, PALETTE.cream, ...PALETTE.stageFallback]), 450);
      }
      this.prepareStory();
    };
    return { el, after };
  }

  // ---------- memory replay (read-only: never writes state) ----------

  finishedDateText() {
    const d = this.storyDate();
    return `${d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} ${d.getFullYear()}`;
  }

  replaySlides() {
    const stages = this.stateManager.get('stages');
    return [
      { kind: 'intro' },
      ...DATE_OPTIONS.stages
        .map((_, i) => ({ kind: 'stage', i }))
        .filter(({ i }) => stages[i].confirmed && stages[i].selectedIndex !== null)
    ];
  }

  replayScene(slide) {
    const item = this.replaySlides()[slide];
    return { type: 'replay', slide, stageIndex: item?.kind === 'stage' ? item.i : undefined };
  }

  async openReplay() {
    if (!this.stateManager.get('farewellReached')) return;
    this.soundManager.playClick();
    await this.show(this.replayScene(0));
  }

  async replayStep(delta) {
    if (this.scene?.type !== 'replay') return;
    const count = this.replaySlides().length;
    const next = this.scene.slide + delta;
    if (next < 0) return;
    if (next >= count) {
      await this.closeReplay({ finished: true });
      return;
    }
    this.soundManager.playClick();
    Utils.vibrate(10);
    await this.show(this.replayScene(next), { back: delta < 0 });
  }

  async closeReplay({ finished = false } = {}) {
    if (this.scene?.type !== 'replay') return;
    await this.show({ type: 'final' }, { back: !finished });
    if (finished) this.burst([PALETTE.accent, PALETTE.cream, ...PALETTE.stageFallback], { y: 0.6 }, 40);
  }

  buildReplay(scene) {
    const slides = this.replaySlides();
    const item = slides[scene.slide] || slides[0];
    const isLast = scene.slide >= slides.length - 1;
    const { el, body, actions } = this.makeScene('replay');
    let hero = null;

    if (item.kind === 'intro') {
      // "Як усе починалось": the very first slide, as a memory
      const tpl = document.getElementById('tpl-intro-1');
      if (tpl) body.appendChild(tpl.content.cloneNode(true));
      const copy = body.querySelector('.intro-copy');
      const eyebrow = document.createElement('p');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = `Як усе починалось · ${this.finishedDateText()}`;
      copy?.prepend(eyebrow);
    } else {
      const i = item.i;
      const stage = DATE_OPTIONS.stages[i];
      const st = this.stateManager.getStage(i);
      const option = stage.options[st.selectedIndex];
      body.innerHTML = `
        <div class="memory-head">
          <p class="eyebrow">Етап ${Utils.pad2(i + 1)}</p>
          <p class="draw-question">${Utils.escapeHtml(stage.question)}</p>
        </div>
        <div class="memory" style="--r: ${stageRatio(i)}">
          <div class="hero-slot"></div>
          <p class="option-name">${Utils.escapeHtml(option.text)}</p>
          <div class="memory-extra"></div>
        </div>`;
      hero = createPhoto(option, stage, 'hero');
      body.querySelector('.hero-slot').appendChild(hero);
      const extra = body.querySelector('.memory-extra');
      const map = createMapLink(option);
      if (map) extra.appendChild(map);
      // the option given up via «Інший варіант» (older saves don't have it)
      const rejected = Number.isInteger(st.rejectedIndex) ? stage.options[st.rejectedIndex] : null;
      if (rejected) {
        const row = document.createElement('p');
        row.className = 'memory-rejected';
        const thumb = createPhoto(rejected, stage, 'memory-rejected-thumb');
        const x = document.createElement('span');
        x.className = 'tile-x';
        x.innerHTML = Utils.icon('close');
        thumb.appendChild(x);
        const label = document.createElement('span');
        label.append('передумали: ');
        const name = document.createElement('s');
        name.textContent = rejected.text;
        label.appendChild(name);
        row.append(thumb, label);
        extra.appendChild(row);
      }
    }

    actions.innerHTML = `
      <div class="replay-nav">
        <button class="nav-back" type="button" data-action="back" aria-label="Назад" ${scene.slide === 0 ? 'disabled' : ''}>${Utils.icon('arrow', 'flip')}</button>
        <button class="btn" type="button" data-action="next">${isLast ? 'До фіналу' : 'Далі'}${Utils.icon('arrow')}</button>
      </div>`;
    const tooSoon = () => performance.now() < (this.swipeUntil || 0);
    actions.querySelector('[data-action="next"]').addEventListener('click', () => { if (!tooSoon()) this.guard(() => this.replayStep(1)); });
    actions.querySelector('[data-action="back"]').addEventListener('click', () => { if (!tooSoon()) this.guard(() => this.replayStep(-1)); });

    // tap right half → forward, left half → back (links/buttons keep working)
    body.addEventListener('click', (e) => {
      if (tooSoon() || e.target.closest('a, button')) return;
      const r = el.getBoundingClientRect();
      this.guard(() => this.replayStep(e.clientX - r.left < r.width / 2 ? -1 : 1));
    });
    // swipe left/right
    let sx = null;
    let sy = null;
    el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    el.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        this.swipeUntil = performance.now() + 450;
        this.guard(() => this.replayStep(dx < 0 ? 1 : -1));
      }
    });
    el.addEventListener('pointercancel', () => { sx = null; });
    // a mouse drag on a photo would start a native image drag and swallow the swipe
    el.addEventListener('dragstart', (e) => e.preventDefault());

    const after = async () => {
      if (hero) checkLowRes(hero);
    };
    return { el, after };
  }

  applyRatingSelection(root, rating) {
    root.querySelectorAll('.rate-btn').forEach(btn => {
      const selected = rating !== null && btn.dataset.rating === rating;
      btn.setAttribute('aria-pressed', String(selected));
    });
  }

  storyDate() {
    const finishedAt = this.stateManager.get('finishedAt');
    return finishedAt ? new Date(finishedAt) : new Date();
  }

  // Draws the story picture in the background so the save tap can share at once.
  prepareStory() {
    if (this.storyPromise) return this.storyPromise;
    const date = this.storyDate();
    this.storyPromise = this.storyImage.render(date)
      .then(async canvas => {
        this.storyCanvas = canvas;
        this.storyFile = await this.storyImage.toFile(canvas, date);
        return canvas;
      })
      .catch(error => {
        console.error('Story picture failed:', error);
        this.storyPromise = null;
        return null;
      });
    return this.storyPromise;
  }

  saveStory() {
    if (!this.storyCanvas) {
      Toast.show('Картинка ще готується, спробуй за мить 🙂');
      this.prepareStory();
      return;
    }
    this.storyImage.save(this.storyCanvas, this.storyFile, this.storyDate());
  }
}

// ============================================
// OWNER TOOLS: ?reset=1
// ============================================

// Clears everything this app saved on the device and reloads on a clean URL
// (no query string), so the next visit starts from the very first screen.
function handleResetParam() {
  if (URL_PARAMS.get('reset') !== '1') return false;

  const keys = [
    CONFIG.STORAGE_KEY,
    ...CONFIG.LEGACY_STORAGE_KEYS,
    CONFIG.USER_ID_KEY,
    CONFIG.FAVORITES_KEY,
    CONFIG.SOUNDS_ENABLED_KEY,
    CONFIG.LEGACY_THEME_KEY
  ];
  keys.forEach(key => Store.remove(key));

  window.location.replace(window.location.pathname);
  return true;
}

// ============================================
// INITIALIZE APP
// ============================================

let app = null;

document.addEventListener('DOMContentLoaded', () => {
  if (handleResetParam()) return;
  app = new DateRandomizerApp();
  app.init();
});

// Timers are throttled in background tabs / on a locked phone, and frozen
// in the back/forward cache: recompute from the saved unlock time as soon as
// the page is visible again.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') app?.resume();
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) app?.resume();
});

// Last chance when the tab is closed or put away: every step (including the
// pick before a draw is revealed) is already saved; this only retries a
// write that failed.
window.addEventListener('pagehide', () => {
  app?.stateManager.flush();
});
