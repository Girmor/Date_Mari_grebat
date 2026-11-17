/**
 * Date Randomizer - Modern ES6+ Implementation
 * Інтерактивний рандомізатор подій для веселого дня
 */

// ============================================
// CONFIGURATION
// ============================================

// Службові параметри адреси (для репетиції власником):
//   ?fast=1  — пауза між етапами 5 секунд замість 15 хвилин;
//   ?reset=1 — стерти збережений прогрес і почати з чистого аркуша.
const URL_PARAMS = new URLSearchParams(window.location.search);
const FAST_MODE = URL_PARAMS.get('fast') === '1';

const CONFIG = {
  DELAY_MS: FAST_MODE ? 5 * 1000 : 15 * 60 * 1000, // пауза між етапами
  MAX_REROLLS: 1, // скільки разів на етапі можна натиснути «Інший варіант»
  OWNER_SKIP_HOLD_MS: 1500, // утримання таймера, щоб одразу завершити очікування
  IMAGE_WAIT_MS: 4000, // скільки максимум чекати картинку перед переворотом карти
  STORAGE_KEY: 'dateRandomizerState_v3',
  LEGACY_STORAGE_KEYS: ['dateRandomizerState_v2', 'dateRandomizerState'],
  USER_ID_KEY: 'dateRandomizerUserId',
  FAVORITES_KEY: 'favoriteTopics',
  SPIN_DURATION: 2500,
  SPIN_INTERVAL: 80,
  SOUNDS_ENABLED_KEY: 'soundsEnabled',
  THEME_KEY: 'dateRandomizerTheme'
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
      options: [
        { text: "Parcoffka", image: "images/Kava_Parcoffka.jpg" },
        { text: "Кав'ярня «Кориця»", image: "images/Kava_koriza.jpg" },
        { text: "Бар «HIWAY»", image: "images/Kava_near_bik.jpg" },
        { text: "Вільна зона", image: "images/Kava_vilna_zona.jpg" }
      ]
    },
    {
      id: 'walk',
      question: "Прогуляємося? Обирай маршрут:",
      icon: "fa-person-walking",
      emoji: "🚶",
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
      options: [
        { text: "Buon Fratelli", image: "images/Rest_Bioni.jpg" },
        { text: "BROOKS eats & drinks", image: "images/Rest_brooks.jpg" },
        { text: "Flip NEO", image: "images/Rest_flipneo.jpg" },
        { text: "Giannivino", image: "images/Rest_Giannivino.jpg" }
      ]
    },
    {
      id: 'movie',
      question: "Може, глянемо фільм?",
      icon: "fa-film",
      emoji: "🎬",
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
// UTILITIES
// ============================================

class Utils {
  static generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  static $(selector) {
    return document.querySelector(selector);
  }

  static $$(selector) {
    return document.querySelectorAll(selector);
  }

  static vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  static formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  static async preloadImage(src) {
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

  static easeOutQuad(t) {
    return t * (2 - t);
  }
}

// ============================================
// SOUND MANAGER
// ============================================

class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem(CONFIG.SOUNDS_ENABLED_KEY) !== 'false';
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
    localStorage.setItem(CONFIG.SOUNDS_ENABLED_KEY, this.enabled);
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

  playMystic() {
    if (!this.enabled || !this.isReady()) return;

    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Містичний sweep effect
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Mystic sound playback failed:', e);
    }
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
// THEME MANAGER
// ============================================

const THEMES = {
  light: {
    name: 'Світла',
    icon: '☀️',
    primary: '#ff6b81',
    secondary: '#9c27b0',
    accent: '#ffd700',
    bgGradientStart: '#fce4ec',
    bgGradientMiddle: '#f8bbd0',
    bgGradientEnd: '#f3e5f5',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    textPrimary: '#2d1b3e',
    textSecondary: '#666'
  },
  dark: {
    name: 'Темна',
    icon: '🌙',
    primary: '#ff6b81',
    secondary: '#bb86fc',
    accent: '#ffd700',
    bgGradientStart: '#1a1a2e',
    bgGradientMiddle: '#16213e',
    bgGradientEnd: '#0f0f23',
    glassBg: 'rgba(30, 30, 50, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#e0e0e0',
    textSecondary: '#b0b0b0'
  },
  sunset: {
    name: 'Захід',
    icon: '🌅',
    primary: '#FF6B6B',
    secondary: '#FFD93D',
    accent: '#6C5CE7',
    bgGradientStart: '#FF6B6B',
    bgGradientMiddle: '#FFB347',
    bgGradientEnd: '#FFD93D',
    glassBg: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.4)',
    textPrimary: '#2d1b3e',
    textSecondary: '#555'
  },
  ocean: {
    name: 'Океан',
    icon: '🌊',
    primary: '#4ECDC4',
    secondary: '#556FB5',
    accent: '#44A08D',
    bgGradientStart: '#e0f7fa',
    bgGradientMiddle: '#80deea',
    bgGradientEnd: '#b2dfdb',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    textPrimary: '#1a3a52',
    textSecondary: '#4a6b7c'
  },
  lavender: {
    name: 'Лаванда',
    icon: '💜',
    primary: '#9D84B7',
    secondary: '#C5A3FF',
    accent: '#E0BBE4',
    bgGradientStart: '#f4e7ff',
    bgGradientMiddle: '#e5d4ff',
    bgGradientEnd: '#d1b3ff',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    textPrimary: '#3d2951',
    textSecondary: '#6d5b7b'
  },
  roseGold: {
    name: 'Рожеве золото',
    icon: '✨',
    primary: '#E8B4B8',
    secondary: '#D4A5A5',
    accent: '#F5CBA7',
    bgGradientStart: '#ffeef0',
    bgGradientMiddle: '#ffe4e6',
    bgGradientEnd: '#ffd6d9',
    glassBg: 'rgba(255, 255, 255, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.6)',
    textPrimary: '#5d3a3a',
    textSecondary: '#8a6969'
  },
  midnight: {
    name: 'Опівніч',
    icon: '🌌',
    primary: '#667EEA',
    secondary: '#764BA2',
    accent: '#F093FB',
    bgGradientStart: '#0f0c29',
    bgGradientMiddle: '#302b63',
    bgGradientEnd: '#24243e',
    glassBg: 'rgba(20, 20, 40, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    textPrimary: '#e8e8ff',
    textSecondary: '#b8b8d0'
  },
  mystic: {
    name: 'Місячна магія',
    icon: '🔮',
    primary: '#B565D8',
    secondary: '#FFD700',
    accent: '#E0C3FC',
    bgGradientStart: '#2D1B40',
    bgGradientMiddle: '#6B2E8C',
    bgGradientEnd: '#2D1B40',
    glassBg: 'rgba(181, 101, 216, 0.15)',
    glassBorder: 'rgba(181, 101, 216, 0.35)',
    textPrimary: '#F0E6FF',
    textSecondary: '#C8B8D4',
    glow: '0 0 25px rgba(181, 101, 216, 0.6), 0 0 50px rgba(181, 101, 216, 0.4)',
    particleColor: '#FFD700'
  }
};

class ThemeManager {
  constructor() {
    const savedTheme = localStorage.getItem(CONFIG.THEME_KEY);

    // Migrate from old light/dark system
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme;
    } else if (savedTheme && THEMES[savedTheme]) {
      this.currentTheme = savedTheme;
    } else {
      this.currentTheme = 'mystic';
    }

    // Legacy support
    this.isDark = this.currentTheme === 'dark' || this.currentTheme === 'midnight' || this.currentTheme === 'mystic';
  }

  init() {
    this.apply();
  }

  toggle() {
    // Simple toggle between light and dark for backward compatibility
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.isDark = this.currentTheme === 'dark';
    localStorage.setItem(CONFIG.THEME_KEY, this.currentTheme);
    this.apply();
    return this.isDark;
  }

  setTheme(themeName) {
    if (!THEMES[themeName]) {
      console.error('Theme not found:', themeName);
      return false;
    }

    this.currentTheme = themeName;
    this.isDark = themeName === 'dark' || themeName === 'midnight' || themeName === 'mystic';
    localStorage.setItem(CONFIG.THEME_KEY, themeName);
    this.apply();
    return true;
  }

  apply() {
    const theme = THEMES[this.currentTheme];
    if (!theme) return;

    // Apply data-theme attribute with actual theme name for mystic styles
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    // Apply CSS variables for the selected theme
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--bg-gradient-start', theme.bgGradientStart);
    root.style.setProperty('--bg-gradient-middle', theme.bgGradientMiddle);
    root.style.setProperty('--bg-gradient-end', theme.bgGradientEnd);
    root.style.setProperty('--glass-bg', theme.glassBg);
    root.style.setProperty('--glass-border', theme.glassBorder);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);

    // Apply mystic-specific properties if they exist
    if (theme.glow) {
      root.style.setProperty('--mystic-glow', theme.glow);
    }
    if (theme.particleColor) {
      root.style.setProperty('--mystic-particle-color', theme.particleColor);
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeList() {
    return Object.entries(THEMES).map(([key, theme]) => ({
      key,
      name: theme.name,
      icon: theme.icon
    }));
  }
}

// ============================================
// PARTICLES EFFECT
// ============================================

class ParticlesEffect {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.animationId = null;
    this.mousePos = { x: -1000, y: -1000 };
    this.setupMouseTracking();
  }

  init() {
    this.createParticles(30);
    this.animate();
  }

  setupMouseTracking() {
    // Skip on touch devices for performance
    if ('ontouchstart' in window) return;

    document.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
      this.updateParticlePositions();
    });
  }

  updateParticlePositions() {
    this.particles.forEach((particle, index) => {
      const rect = particle.getBoundingClientRect();
      const particleX = rect.left + rect.width / 2;
      const particleY = rect.top + rect.height / 2;

      const distance = Math.hypot(
        this.mousePos.x - particleX,
        this.mousePos.y - particleY
      );

      const interactionRadius = 150;

      if (distance < interactionRadius) {
        const angle = Math.atan2(
          particleY - this.mousePos.y,
          particleX - this.mousePos.x
        );
        const force = (interactionRadius - distance) / interactionRadius;
        const offsetX = Math.cos(angle) * force * 40;
        const offsetY = Math.sin(angle) * force * 40;
        const scale = 1 + force * 0.5;

        particle.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        particle.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      } else {
        particle.style.transform = '';
        particle.style.transition = 'transform 0.5s ease-out';
      }
    });
  }

  createParticles(count) {
    const symbols = ['✨', '💫', '⭐', '🌟', '🎈', '🎀', '🌸'];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particle.textContent = Utils.randomItem(symbols);
      particle.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 5}s;
        animation-duration: ${5 + Math.random() * 10}s;
        font-size: ${0.8 + Math.random() * 1.2}rem;
        opacity: ${0.3 + Math.random() * 0.4};
      `;
      this.container.appendChild(particle);
      this.particles.push(particle);
    }
  }

  animate() {
    // Particles are animated via CSS, this method is just a placeholder
    // to satisfy the init() call
  }

  destroy() {
    this.particles.forEach(p => p.remove());
    this.particles = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// ============================================
// TRANSITION MANAGER
// ============================================

class TransitionManager {
  static async transition(fromElement, toElement, type = 'slide') {
    if (!fromElement || !toElement) return;

    const duration = 600; // ms

    // Apply exit animation
    fromElement.classList.add(`transition-${type}-out`);

    await this.wait(duration / 2);

    // Switch visibility
    fromElement.classList.remove('active');
    toElement.classList.add('active');

    // Apply enter animation
    toElement.classList.add(`transition-${type}-in`);

    await this.wait(duration / 2);

    // Cleanup
    fromElement.classList.remove(`transition-${type}-out`);
    toElement.classList.remove(`transition-${type}-in`);
  }

  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getRandomTransition() {
    const types = ['slide', 'fade', 'zoom', 'flip'];
    return types[Math.floor(Math.random() * types.length)];
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
// CONVERSATION TOPICS COMPONENT
// ============================================

class ConversationTopics {
  constructor() {
    this.element = null;
    this.currentCategory = 'fun';
    this.currentTopicIndex = 0;
    this.favorites = this.loadFavorites();
    this.usedTopics = new Set();
  }

  // Favourites are stored as "category-index" keys; drop any that no longer
  // point at an existing topic (e.g. the removed category) or are corrupted.
  loadFavorites() {
    try {
      const raw = JSON.parse(localStorage.getItem(CONFIG.FAVORITES_KEY) || '[]');
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

  render() {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'topics-toggle-btn';
    toggleBtn.innerHTML = '💬';
    toggleBtn.setAttribute('aria-label', 'Ідеї для розмови');

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'conversation-topics glass-card';
    panel.innerHTML = `
      <div class="topics-header">
        <h3 class="topics-title">💬 Ідеї для розмови</h3>
        <p class="topics-subtitle">Якщо раптом не знаєте, про що поговорити…</p>
      </div>

      <div class="topics-categories">
        <button class="topic-category-btn active" data-category="fun">
          😄 Веселі
        </button>
        <button class="topic-category-btn" data-category="deep">
          💭 Глибокі
        </button>
        <button class="topic-category-btn" data-category="unusual">
          🎲 Незвичайні
        </button>
        <button class="topic-category-btn" data-category="icebreakers">
          🧊 Для початку
        </button>
      </div>

      <div class="topic-card-container">
        <div class="topic-card mystic-card">
          <div class="topic-content">
            <p class="topic-text"></p>
          </div>
          <button class="topic-favorite-btn" aria-label="Додати до улюблених">
            <i class="fas fa-star"></i>
          </button>
        </div>
      </div>

      <div class="topics-actions">
        <button class="btn btn-outline topic-next-btn">
          <i class="fas fa-sync-alt"></i>
          <span>Наступна тема</span>
        </button>
        <button class="btn btn-secondary topic-favorites-btn">
          <i class="fas fa-star"></i>
          <span>Улюблені (<span class="favorites-count">0</span>)</span>
        </button>
      </div>
    `;

    // Create wrapper with proper styling
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'flex-end';
    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(panel);

    this.element = panel;
    this.toggleBtn = toggleBtn;

    // Toggle button click handler
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('open');
      Utils.vibrate(30);
    });

    this.bindEvents();
    this.showRandomTopic();
    this.updateFavoritesCount();

    return wrapper;
  }

  bindEvents() {
    // Category buttons
    const categoryBtns = this.element.querySelectorAll('.topic-category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category;
        this.showRandomTopic();
      });
    });

    // Next topic button
    const nextBtn = this.element.querySelector('.topic-next-btn');
    nextBtn.addEventListener('click', () => {
      this.showRandomTopic();
      Utils.vibrate(30);
    });

    // Favorite button
    const favBtn = this.element.querySelector('.topic-favorite-btn');
    favBtn.addEventListener('click', () => {
      this.toggleFavorite();
    });

    // Favorites button
    const favsBtn = this.element.querySelector('.topic-favorites-btn');
    favsBtn.addEventListener('click', () => {
      this.showFavorites();
    });
  }

  showRandomTopic() {
    const category = this.currentCategory;
    const topics = CONVERSATION_TOPICS[category];
    const allIndexes = topics.map((_, index) => index);
    let availableIndexes = allIndexes.filter(index =>
      !this.usedTopics.has(`${category}-${index}`)
    );

    // Якщо всі теми категорії вже були, починаємо коло спочатку
    if (availableIndexes.length === 0) {
      allIndexes.forEach(index => this.usedTopics.delete(`${category}-${index}`));
      availableIndexes = allIndexes;
    }

    const randomIndex = Utils.randomItem(availableIndexes);
    const topic = topics[randomIndex];

    this.usedTopics.add(`${this.currentCategory}-${randomIndex}`);
    this.currentTopicIndex = randomIndex;

    const topicText = this.element.querySelector('.topic-text');
    const topicCard = this.element.querySelector('.topic-card');

    // Анімація зміни тексту
    topicCard.style.opacity = '0';
    topicCard.style.transform = 'scale(0.95)';

    setTimeout(() => {
      topicText.textContent = topic;
      topicCard.style.opacity = '1';
      topicCard.style.transform = 'scale(1)';
      this.updateFavoriteButton();
    }, 200);
  }

  toggleFavorite() {
    const topic = CONVERSATION_TOPICS[this.currentCategory][this.currentTopicIndex];
    const favoriteKey = `${this.currentCategory}-${this.currentTopicIndex}`;

    const index = this.favorites.indexOf(favoriteKey);
    if (index > -1) {
      this.favorites.splice(index, 1);
      Toast.show('Видалено з улюблених', 'info');
    } else {
      this.favorites.push(favoriteKey);
      Toast.show('Додано до улюблених!', 'success');
      Utils.vibrate([50, 30, 50]);
    }

    localStorage.setItem(CONFIG.FAVORITES_KEY, JSON.stringify(this.favorites));
    this.updateFavoriteButton();
    this.updateFavoritesCount();
  }

  updateFavoriteButton() {
    const favoriteKey = `${this.currentCategory}-${this.currentTopicIndex}`;
    const isFavorite = this.favorites.includes(favoriteKey);
    const favBtn = this.element.querySelector('.topic-favorite-btn');

    if (isFavorite) {
      favBtn.classList.add('active');
      favBtn.innerHTML = '<i class="fas fa-star"></i>';
    } else {
      favBtn.classList.remove('active');
      favBtn.innerHTML = '<i class="far fa-star"></i>';
    }
  }

  updateFavoritesCount() {
    const countEl = this.element.querySelector('.favorites-count');
    countEl.textContent = this.favorites.length;
  }

  showFavorites() {
    if (this.favorites.length === 0) {
      Toast.show('Улюблених тем поки немає — тисни ⭐ біля питання', 'info');
      return;
    }

    // Показати модальне вікно з улюбленими темами
    const favoritesHtml = this.favorites.map(key => {
      const [category] = key.split('-');
      const topic = this.getTopicByKey(key);
      if (topic === null) return '';
      return `<div class="favorite-item">
        <span class="favorite-emoji">${this.getCategoryEmoji(category)}</span>
        <p>${topic}</p>
      </div>`;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'topics-modal';
    modal.innerHTML = `
      <div class="topics-modal-content glass-card">
        <button class="topics-modal-close">&times;</button>
        <h3>⭐ Улюблені теми</h3>
        <div class="favorites-list">${favoritesHtml}</div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    modal.querySelector('.topics-modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }
    });
  }

  getCategoryEmoji(category) {
    const emojis = {
      fun: '😄',
      deep: '💭',
      unusual: '🎲',
      icebreakers: '🧊'
    };
    return emojis[category] || '💬';
  }

  show() {
    const container = Utils.$('#conversationTopicsContainer');
    if (container) {
      container.classList.add('visible');
    }
  }

  hide() {
    const container = Utils.$('#conversationTopicsContainer');
    if (container) {
      container.classList.remove('visible');
    }
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

class Toast {
  static show(message, type = 'info', duration = 3000) {
    const container = Utils.$('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle'
    };

    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// ============================================
// STATE MANAGER
// ============================================

class StateManager {
  constructor() {
    this.state = this.getDefaultState();
    this.listeners = new Set();
  }

  getDefaultState() {
    return {
      userId: localStorage.getItem(CONFIG.USER_ID_KEY) || this.createUserId(),
      currentStep: 'intro-1',
      introCompleted: false,
      stages: DATE_OPTIONS.stages.map((_, index) => ({
        selectedIndex: null,
        confirmed: false,
        unlockTime: index === 0 ? 0 : null,
        rerollsUsed: 0
      })),
      lastActiveStage: 0,
      pendingStage: null,
      pendingUnlockTime: null,
      farewellReached: false,
      finishedAt: null,
      rating: null
    };
  }

  createUserId() {
    const id = Utils.generateId();
    localStorage.setItem(CONFIG.USER_ID_KEY, id);
    return id;
  }

  load() {
    try {
      // States from older versions are not reused.
      CONFIG.LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
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
      return {
        selectedIndex,
        confirmed: Boolean(s.confirmed) && selectedIndex !== null,
        unlockTime: typeof s.unlockTime === 'number' ? s.unlockTime : defaults.stages[index].unlockTime,
        rerollsUsed: Number.isInteger(s.rerollsUsed) && s.rerollsUsed > 0 ? s.rerollsUsed : 0
      };
    });

    const pendingStage = parsed.pendingStage === 'farewell' ||
      (Number.isInteger(parsed.pendingStage) && parsed.pendingStage > 0 && parsed.pendingStage < stages.length)
      ? parsed.pendingStage : null;
    const pendingUnlockTime = pendingStage !== null && typeof parsed.pendingUnlockTime === 'number'
      ? parsed.pendingUnlockTime : null;

    return {
      ...defaults,
      currentStep: typeof parsed.currentStep === 'string' ? parsed.currentStep : defaults.currentStep,
      introCompleted: Boolean(parsed.introCompleted),
      stages,
      lastActiveStage: Number.isInteger(parsed.lastActiveStage) ? parsed.lastActiveStage : 0,
      pendingStage: pendingUnlockTime === null ? null : pendingStage,
      pendingUnlockTime,
      farewellReached: Boolean(parsed.farewellReached),
      finishedAt: typeof parsed.finishedAt === 'number' ? parsed.finishedAt : null,
      rating: typeof parsed.rating === 'string' ? parsed.rating : null
    };
  }

  save() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error('Error saving state:', e);
    }
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

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  get(key) {
    return this.state[key];
  }

  getStage(index) {
    return this.state.stages[index];
  }

  isStageConfirmed(index) {
    return this.state.stages[index]?.confirmed ?? false;
  }

  getRerollsLeft(index) {
    const used = this.state.stages[index]?.rerollsUsed ?? 0;
    return Math.max(0, CONFIG.MAX_REROLLS - used);
  }

  isStageUnlocked(index) {
    const stage = this.state.stages[index];
    if (!stage) return false;
    if (index === 0) return true;
    if (stage.unlockTime === null) return false;
    return Date.now() >= stage.unlockTime;
  }

  getNextUnconfirmedStage() {
    return this.state.stages.findIndex(s => !s.confirmed);
  }

  areAllStagesConfirmed() {
    return this.state.stages.every(s => s.confirmed);
  }

  clearAll() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    this.reset();
  }
}

// ============================================
// PROGRESS BAR
// ============================================

class ProgressBar {
  constructor(container, stageCount) {
    this.container = container;
    this.stageCount = stageCount;
    this.steps = [];
  }

  init() {
    this.container.innerHTML = '<div class="progress-line"></div>';
    
    for (let i = 0; i < this.stageCount; i++) {
      const step = document.createElement('div');
      step.className = 'progress-step';
      step.dataset.index = i;
      step.innerHTML = `
        <div class="step-circle">
          <span class="step-number">${i + 1}</span>
          <i class="fas fa-check step-check"></i>
        </div>
        <span class="step-label">🔒</span>
      `;
      this.container.appendChild(step);
      this.steps.push(step);
    }
  }

  // Locked stages stay a secret: the stage emoji is shown only once unlocked.
  revealStep(index) {
    const label = this.steps[index]?.querySelector('.step-label');
    if (label) label.textContent = DATE_OPTIONS.stages[index].emoji;
  }

  updateStep(index, completed) {
    const step = this.steps[index];
    if (step) {
      step.classList.toggle('completed', completed);
    }
  }

  show() {
    this.container.classList.add('visible');
  }

  hide() {
    this.container.classList.remove('visible');
  }
}

// ============================================
// TIMER
// ============================================

class Timer {
  constructor(element, conversationTopics = null) {
    this.element = element;
    this.textElement = element.querySelector('.timer-text');
    this.labelElement = element.querySelector('.timer-label');
    this.intervalId = null;
    this.unlockTime = null;
    this.onComplete = null;
    this.conversationTopics = conversationTopics;
  }

  start(unlockTime, onComplete, label = '') {
    this.stop();
    this.unlockTime = unlockTime;
    this.onComplete = onComplete;
    if (this.labelElement) this.labelElement.textContent = label;

    this.element.classList.add('active');

    // Show conversation topics when timer starts
    if (this.conversationTopics) {
      this.conversationTopics.show();
    }

    this.intervalId = setInterval(() => this.update(), 1000);
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

    this.textElement.textContent = Utils.formatTime(remaining);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onComplete = null;
    this.element.classList.remove('active');

    // Hide conversation topics when timer stops
    if (this.conversationTopics) {
      this.conversationTopics.hide();
    }
  }
}

// ============================================
// GRID STAGE COMPONENT (Новий дизайн з сіткою)
// ============================================

class GridStageComponent {
  constructor(stageData, index, options = {}) {
    this.data = stageData;
    this.index = index;
    this.options = options;
    this.element = null;
    this.selectedIndex = null;
  }

  render() {
    const stage = document.createElement('section');
    stage.className = 'stage-card glass-card locked grid-mode';
    stage.dataset.index = this.index;
    stage.id = `stage-${this.index}`;

    stage.innerHTML = `
      <div class="card-glow"></div>

      <header class="stage-header modern">
        <div class="stage-icon-wrapper">
          <div class="stage-icon modern">
            <i class="fas ${this.data.icon}"></i>
          </div>
          <span class="stage-emoji-large">${this.data.emoji}</span>
        </div>
        <div class="stage-title-wrapper">
          <h2 class="stage-title modern">${this.data.question}</h2>
          <p class="stage-subtitle">Обери один варіант:</p>
        </div>
      </header>

      <div class="stage-content grid-content">
        <div class="options-grid">
          ${this.renderOptionsGrid()}
        </div>

        <div class="stage-actions modern">
          <button class="btn btn-confirm-modern" disabled>
            <i class="fas fa-check-circle"></i>
            <span>Підтвердити вибір</span>
          </button>
        </div>
      </div>

      <div class="stage-lock-overlay">
        <i class="fas fa-lock"></i>
        <p>Очікування...</p>
      </div>
    `;

    this.element = stage;
    this.bindEvents();
    return stage;
  }

  renderOptionsGrid() {
    return this.data.options.map((option, index) => `
      <div class="option-card" data-index="${index}">
        <div class="option-card-inner">
          <div class="option-image-wrapper">
            <img src="${option.image}" alt="${option.text}" class="option-image">
            <div class="option-overlay">
              <i class="fas fa-check-circle option-check"></i>
            </div>
          </div>
          <div class="option-info">
            <h3 class="option-title">${option.text}</h3>
            <div class="option-badge">
              <i class="fas fa-heart"></i>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  bindEvents() {
    const optionCards = this.element.querySelectorAll('.option-card');
    const confirmBtn = this.element.querySelector('.btn-confirm-modern');

    optionCards.forEach((card, index) => {
      card.addEventListener('click', () => {
        if (this.element.classList.contains('locked')) return;

        this.selectOption(index);
        this.options.soundManager?.playClick();
        Utils.vibrate(50);
      });
    });

    confirmBtn.addEventListener('click', () => {
      if (this.selectedIndex !== null) {
        this.confirm();
      }
    });
  }

  selectOption(index) {
    this.selectedIndex = index;

    // Remove selection from all cards
    const cards = this.element.querySelectorAll('.option-card');
    cards.forEach(card => card.classList.remove('selected'));

    // Add selection to clicked card
    cards[index].classList.add('selected');

    // Enable confirm button
    const confirmBtn = this.element.querySelector('.btn-confirm-modern');
    confirmBtn.disabled = false;

    // Save to state
    if (this.options.onSpin) {
      this.options.onSpin(this.index, index);
    }
  }

  confirm() {
    const { onConfirm, soundManager } = this.options;

    this.element.classList.add('confirmed');
    soundManager?.playSuccess();
    Utils.vibrate([100, 50, 100]);

    // Trigger confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ff6b81', '#ffd700', '#9c27b0', '#ff9ff3']
      });
    }

    if (onConfirm) {
      onConfirm(this.index);
    }
  }

  unlock() {
    this.element.classList.remove('locked');
    this.element.classList.add('unlocked');

    // Animate cards appearing
    const cards = this.element.querySelectorAll('.option-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('appear');
      }, index * 100);
    });

    this.options.soundManager?.playUnlock();
  }

  lock() {
    this.element.classList.add('locked');
    this.element.classList.remove('unlocked');
  }

  setSelected(selectedIndex) {
    if (selectedIndex !== null) {
      this.selectOption(selectedIndex);
    }
  }

  isLocked() {
    return this.element?.classList.contains('locked') ?? true;
  }
}

// ============================================
// STAGE COMPONENT (Old design - kept for reference)
// ============================================

class StageComponent {
  constructor(stageData, index, options = {}) {
    this.data = stageData;
    this.index = index;
    this.options = options;
    this.element = null;
    this.isSpinning = false;
  }

  render() {
    const stage = document.createElement('section');
    stage.className = 'stage-card glass-card locked';
    stage.dataset.index = this.index;
    stage.id = `stage-${this.index}`;

    stage.innerHTML = `
      <div class="card-glow"></div>
      <header class="stage-header">
        <div class="stage-icon">
          <i class="fas ${this.data.icon}"></i>
        </div>
        <h2 class="stage-title">${this.data.question}</h2>
      </header>

      <div class="stage-content">
        <div class="option-display">
          <div class="option-image-container">
            <img class="option-image" src="" alt="Обрана опція">
            <div class="image-overlay"></div>
          </div>
          <p class="option-name"></p>
        </div>

        <div class="stage-actions">
          <button class="btn btn-primary btn-spin">
            <i class="fas fa-dice"></i>
            <span>Обрати варіант</span>
          </button>

          <div class="confirm-actions">
            <button class="btn btn-success btn-confirm">
              <i class="fas fa-check"></i>
              <span>Підтверджую!</span>
            </button>
            <button class="btn btn-outline btn-retry">
              <i class="fas fa-redo"></i>
              <span>Інший варіант</span>
            </button>
          </div>
        </div>
      </div>

      <div class="stage-lock-overlay">
        <i class="fas fa-lock"></i>
        <p>Очікування...</p>
      </div>
    `;

    this.element = stage;
    this.bindEvents();
    return stage;
  }

  bindEvents() {
    const spinBtn = this.element.querySelector('.btn-spin');
    const confirmBtn = this.element.querySelector('.btn-confirm');
    const retryBtn = this.element.querySelector('.btn-retry');

    spinBtn.addEventListener('click', () => this.spin());
    confirmBtn.addEventListener('click', () => this.confirm());
    retryBtn.addEventListener('click', () => this.retry());
  }

  async spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    const { onSpin, soundManager } = this.options;
    const display = this.element.querySelector('.option-display');
    const img = this.element.querySelector('.option-image');
    const name = this.element.querySelector('.option-name');
    const confirmActions = this.element.querySelector('.confirm-actions');
    const spinBtn = this.element.querySelector('.btn-spin');

    spinBtn.disabled = true;
    display.classList.add('visible', 'spinning');
    confirmActions.classList.remove('visible');

    Utils.vibrate([50, 30, 50]);

    const options = this.data.options;
    const cycles = Math.floor(CONFIG.SPIN_DURATION / CONFIG.SPIN_INTERVAL);
    let count = 0;

    await new Promise(resolve => {
      const interval = setInterval(() => {
        const opt = options[count % options.length];
        img.src = opt.image;
        name.textContent = opt.text;
        
        soundManager?.playSpin();
        
        count++;
        
        if (count >= cycles) {
          clearInterval(interval);
          resolve();
        }
      }, CONFIG.SPIN_INTERVAL);
    });

    // Final selection
    const selectedIndex = Math.floor(Math.random() * options.length);
    const selected = options[selectedIndex];
    
    img.src = selected.image;
    name.textContent = selected.text;
    
    display.classList.remove('spinning');
    confirmActions.classList.add('visible');
    spinBtn.disabled = false;
    this.isSpinning = false;

    soundManager?.playSuccess();
    Utils.vibrate(100);

    if (onSpin) {
      onSpin(this.index, selectedIndex);
    }
  }

  confirm() {
    const { onConfirm, soundManager } = this.options;
    const confirmActions = this.element.querySelector('.confirm-actions');
    const spinBtn = this.element.querySelector('.btn-spin');

    confirmActions.classList.remove('visible');
    spinBtn.classList.add('hidden');
    this.element.classList.add('confirmed');

    soundManager?.playSuccess();
    Utils.vibrate([100, 50, 100]);

    // Trigger confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b81', '#ffd700', '#9c27b0', '#ff9ff3']
      });
    }

    if (onConfirm) {
      onConfirm(this.index);
    }
  }

  retry() {
    const { onRetry } = this.options;
    const display = this.element.querySelector('.option-display');
    const confirmActions = this.element.querySelector('.confirm-actions');
    const spinBtn = this.element.querySelector('.btn-spin');

    display.classList.remove('visible');
    confirmActions.classList.remove('visible');
    spinBtn.disabled = false;

    if (onRetry) {
      onRetry(this.index);
    }
  }

  unlock() {
    this.element.classList.remove('locked');

    // Add 3D flip animation
    this.element.style.transformStyle = 'preserve-3d';
    this.element.classList.add('card-flipping');

    setTimeout(() => {
      this.element.classList.add('unlocked');
      this.element.classList.remove('card-flipping');
    }, 400);

    this.options.soundManager?.playUnlock();
  }

  lock() {
    this.element.classList.add('locked');
    this.element.classList.remove('unlocked');
  }

  setSelected(selectedIndex) {
    if (selectedIndex === null) return;
    
    const opt = this.data.options[selectedIndex];
    const display = this.element.querySelector('.option-display');
    const img = this.element.querySelector('.option-image');
    const name = this.element.querySelector('.option-name');
    
    img.src = opt.image;
    name.textContent = opt.text;
    display.classList.add('visible');
  }

  setConfirmed() {
    const spinBtn = this.element.querySelector('.btn-spin');
    spinBtn.classList.add('hidden');
    this.element.classList.add('confirmed');
  }
}

// ============================================
// MYSTIC STAGE COMPONENT - Tarot Card Carousel
// ============================================

class MysticStageComponent extends StageComponent {
  constructor(stageData, index, options = {}) {
    super(stageData, index, options);
    this.selectedIndex = null;
    this.isConfirmed = false;
    this.revealed = false;
    this.els = {};
  }

  // A locked stage is a secret: its question, icon and emoji are NOT put into
  // the DOM until reveal() runs on unlock. Only a lock and a teaser are shown.
  render() {
    const stage = document.createElement('section');
    stage.className = 'stage-card mystic-tarot-card glass-card locked';
    stage.dataset.index = this.index;
    stage.id = `stage-${this.index}`;

    const stageNumber = this.index + 1;

    stage.innerHTML = `
      <div class="card-glow"></div>

      <div class="floating-stars-container">
        ${this.generateStars()}
      </div>

      <header class="stage-header mystic-header">
        <div class="stage-icon mystic-icon">
          <i class="fas fa-lock"></i>
        </div>
        <h2 class="stage-title mystic-title">Етап ${stageNumber}</h2>
      </header>

      <div class="stage-content mystic-content">
        <div class="mystic-carousel-container">
          <div class="option-display mystic-display">
            <div class="mystic-card-wrapper">
              <div class="mystic-card-inner">
                <div class="mystic-card-front">
                  <div class="card-back-pattern">🔮</div>
                </div>
                <div class="mystic-card-back">
                  <img class="option-image mystic-image" alt="">
                  <div class="image-placeholder" aria-hidden="true"></div>
                  <div class="image-mystic-frame"></div>
                </div>
              </div>
            </div>
            <p class="option-name mystic-name"></p>
          </div>
        </div>

        <div class="stage-actions mystic-actions">
          <button class="btn btn-primary btn-spin mystic-btn">
            <div class="magic-circle"></div>
            <i class="fas fa-hand-sparkles"></i>
            <span>Обрати варіант</span>
          </button>

          <div class="confirm-actions">
            <button class="btn btn-success btn-confirm">
              <i class="fas fa-check"></i>
              <span>Підтверджую!</span>
            </button>
            <button class="btn btn-outline btn-retry">
              <i class="fas fa-redo"></i>
              <span>Інший варіант</span>
            </button>
            <p class="reroll-note"></p>
          </div>
        </div>
      </div>

      <div class="stage-lock-overlay">
        <i class="fas fa-lock"></i>
        <p class="lock-title">Етап ${stageNumber}</p>
        <p class="lock-teaser">Поки що це секрет 🤫</p>
      </div>
    `;

    this.element = stage;
    const q = (selector) => stage.querySelector(selector);
    this.els = {
      display: q('.option-display'),
      cardWrapper: q('.mystic-card-wrapper'),
      cardBack: q('.mystic-card-back'),
      img: q('.option-image'),
      placeholder: q('.image-placeholder'),
      name: q('.option-name'),
      title: q('.stage-title'),
      icon: q('.stage-icon i'),
      spinBtn: q('.btn-spin'),
      confirmActions: q('.confirm-actions'),
      confirmBtn: q('.btn-confirm'),
      retryBtn: q('.btn-retry'),
      rerollNote: q('.reroll-note')
    };
    this.bindEvents();
    return stage;
  }

  generateStars() {
    let stars = '';
    for (let i = 0; i < 8; i++) {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      stars += `<div class="floating-star" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s;">✨</div>`;
    }
    return stars;
  }

  bindEvents() {
    const { img, cardBack, spinBtn, confirmBtn, retryBtn } = this.els;

    // Broken/missing image -> neat placeholder with the stage emoji
    img.addEventListener('load', () => cardBack.classList.remove('image-failed'));
    img.addEventListener('error', () => {
      if (img.getAttribute('src')) cardBack.classList.add('image-failed');
    });

    spinBtn.addEventListener('click', () => this.spin());
    confirmBtn.addEventListener('click', () => this.confirm());
    retryBtn.addEventListener('click', () => this.reroll());
  }

  getRerollsLeft() {
    return this.options.getRerollsLeft ? this.options.getRerollsLeft(this.index) : 0;
  }

  pickIndex(excludeIndex = null) {
    const all = this.data.options.map((_, i) => i);
    const pool = excludeIndex !== null && all.length > 1
      ? all.filter(i => i !== excludeIndex)
      : all;
    return Utils.randomItem(pool);
  }

  showOption(index) {
    const opt = this.data.options[index];
    const { img, cardBack, name } = this.els;
    cardBack.classList.remove('image-failed');
    img.alt = opt.text;
    img.src = opt.image;
    name.textContent = opt.text;
  }

  async spin({ excludeIndex = null, isReroll = false } = {}) {
    if (this.isSpinning || this.isConfirmed || this.isLocked()) return;
    this.isSpinning = true;

    const { onSpin, soundManager } = this.options;
    const { display, cardWrapper, cardBack, img, name } = this.els;

    // Result is decided (and saved) up front, so a reload mid-spin
    // cannot hand out a free extra spin.
    const selectedIndex = this.pickIndex(excludeIndex);
    const selected = this.data.options[selectedIndex];
    this.selectedIndex = selectedIndex;
    if (onSpin) onSpin(this.index, selectedIndex, isReroll);

    // Start loading the picture now; the card flips only once it is ready.
    const imageReady = Utils.loadImage(selected.image);

    this.updateActions();

    // Hide the previous picture while the card turns face down again
    cardBack.classList.add('is-loading');
    cardWrapper.classList.remove('flipped');
    cardWrapper.style.transform = '';
    name.textContent = '';

    // Містичний ефект та звук
    this.element.classList.add('mystic-spinning');
    soundManager?.playMystic?.();

    Utils.vibrate([50, 30, 50]);

    display.classList.add('visible');

    // Короткий spin ефект з обертанням
    const cycles = 20; // Менше циклів для швидшого ефекту
    let count = 0;

    await new Promise(resolve => {
      const interval = setInterval(() => {
        // Обертання картки
        cardWrapper.style.transform = `rotateY(${count * 30}deg)`;
        soundManager?.playSpin();
        count++;

        if (count >= cycles) {
          clearInterval(interval);
          resolve();
        }
      }, 50); // Швидше обертання
    });

    // Чекаємо картинку (з обмеженням), щоб не показати її напівзавантаженою
    await Promise.race([imageReady, Utils.wait(CONFIG.IMAGE_WAIT_MS)]);
    this.showOption(selectedIndex);
    if (typeof img.decode === 'function') {
      await Promise.race([img.decode().catch(() => {}), Utils.wait(600)]);
    }
    cardBack.classList.remove('is-loading');

    // Фінальний flip щоб показати картинку
    cardWrapper.style.transform = '';
    cardWrapper.classList.add('flipped');

    this.element.classList.remove('mystic-spinning');
    this.isSpinning = false;
    this.updateActions();

    soundManager?.playSuccess();
    // Сильна вібрація при показі результату
    Utils.vibrate([200, 100, 200]);
  }

  // "Інший варіант": limited by CONFIG.MAX_REROLLS, never returns the option
  // that was just rejected, and spins right away.
  reroll() {
    if (this.isSpinning || this.isConfirmed || this.selectedIndex === null) return;
    if (this.getRerollsLeft() <= 0) {
      this.updateActions();
      return;
    }
    this.spin({ excludeIndex: this.selectedIndex, isReroll: true });
  }

  updateActions() {
    const { spinBtn, confirmActions, retryBtn, rerollNote } = this.els;

    if (this.isConfirmed) {
      spinBtn.classList.add('hidden');
      confirmActions.classList.remove('visible');
      return;
    }

    if (this.isSpinning) {
      spinBtn.classList.add('hidden');
      confirmActions.classList.remove('visible');
      return;
    }

    if (this.selectedIndex === null) {
      spinBtn.classList.remove('hidden');
      spinBtn.disabled = false;
      confirmActions.classList.remove('visible');
      return;
    }

    const left = this.getRerollsLeft();
    spinBtn.classList.add('hidden');
    retryBtn.classList.toggle('hidden', left <= 0);
    if (left <= 0) {
      rerollNote.textContent = '🔮 Доля сказала своє слово!';
    } else if (left === 1) {
      rerollNote.textContent = 'Передумати можна лише раз 😉';
    } else {
      rerollNote.textContent = `Передумати можна ще ${left} ${left >= 5 ? 'разів' : 'рази'} 😉`;
    }
    confirmActions.classList.add('visible');
  }

  confirm() {
    if (this.isConfirmed || this.isSpinning || this.selectedIndex === null) return;
    const { onConfirm, soundManager } = this.options;

    this.isConfirmed = true;
    this.updateActions();
    this.element.classList.add('confirmed');

    soundManager?.playSuccess();
    Utils.vibrate([100, 50, 100]);

    // Trigger confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9D84FF', '#FFD700', '#E0C3FC', '#ff9ff3']
      });
    }

    if (onConfirm) {
      onConfirm(this.index);
    }
  }

  retry() {
    this.reroll();
  }

  // Puts the real question/icon/emoji into the card (only on unlock).
  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.els.icon.className = `fas ${this.data.icon}`;
    this.els.title.textContent = this.data.question;
    this.els.placeholder.textContent = this.data.emoji;
  }

  isLocked() {
    return this.element?.classList.contains('locked') ?? true;
  }

  unlock({ silent = false } = {}) {
    this.reveal();
    if (!this.isLocked()) return;
    this.element.classList.remove('locked');
    this.element.classList.add('unlocked');
    this.updateActions();
    if (!silent) this.options.soundManager?.playUnlock();
  }

  lock() {
    this.element.classList.add('locked');
    this.element.classList.remove('unlocked');
  }

  // Restores a saved (possibly unconfirmed) selection after a reload.
  setSelected(selectedIndex) {
    if (selectedIndex === null || selectedIndex === undefined) {
      this.updateActions();
      return;
    }

    this.selectedIndex = selectedIndex;
    this.showOption(selectedIndex);
    this.els.cardBack.classList.remove('is-loading');
    this.els.display.classList.add('visible');
    this.els.cardWrapper.classList.add('flipped');
    this.updateActions();
  }

  setConfirmed() {
    this.isConfirmed = true;
    this.element.classList.add('confirmed');
    this.updateActions();
  }
}

// ============================================
// ROADMAP GENERATOR
// ============================================

class RoadmapGenerator {
  constructor(stages, stateManager) {
    this.stages = stages;
    this.stateManager = stateManager;
  }

  async generate(container, date = new Date()) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const confirmedStages = this.stages.filter((_, i) =>
      this.stateManager.isStageConfirmed(i)
    );

    if (confirmedStages.length === 0) {
      console.warn('No confirmed stages to display!');
      return null;
    }

    // Make sure the web fonts are used on the canvas when available
    try {
      if (document.fonts?.ready) {
        await Promise.race([document.fonts.ready, Utils.wait(1500)]);
      }
    } catch (e) {
      // fonts are optional
    }

    const width = 500; // Зменшено з 600
    const stageHeight = 110; // Зменшено з 140 для компактності
    const height = confirmedStages.length * stageHeight + 100; // Менший відступ

    // Draw at 2x so the saved picture stays sharp on a phone screen
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#fce4ec');
    gradient.addColorStop(0.5, '#f8bbd0');
    gradient.addColorStop(1, '#f3e5f5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative pattern
    ctx.strokeStyle = 'rgba(255, 107, 129, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Title
    ctx.font = 'bold 22px "Playfair Display", serif'; // Зменшено з 28px
    ctx.fillStyle = '#2d1b3e';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Цього дня ✨', width / 2, 35); // Менший відступ

    // Date
    ctx.font = '13px "Montserrat", sans-serif'; // Зменшено з 16px
    ctx.fillStyle = '#666';
    ctx.fillText(date.toLocaleDateString('uk-UA', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), width / 2, 60); // Зменшено відступ

    // Path line
    const pathX = width / 2;
    let currentY = 80; // Менший початковий відступ

    // Спочатку порахуємо скільки підтверджених стадій
    let stageIndex = 0;

    ctx.strokeStyle = '#ff6b81';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(pathX, currentY);
    ctx.lineTo(pathX, height - 20); // Скоректована кінцева точка
    ctx.stroke();
    ctx.setLineDash([]);

    // Load and draw stages
    for (let i = 0; i < this.stages.length; i++) {
      const stageState = this.stateManager.getStage(i);
      if (!stageState.confirmed || stageState.selectedIndex === null) continue;

      const stage = this.stages[i];
      const option = stage.options[stageState.selectedIndex];
      const y = currentY + (stageIndex === 0 ? 20 : 0); // Менший відступ для першого елемента

      // Завантажити і намалювати міні-фото
      const imgSize = 50;
      const imgX = pathX - 100;
      const imgY = y - imgSize / 2;

      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        let imageLoaded = false;

        await new Promise((resolve) => {
          img.onload = () => {
            imageLoaded = true;
            resolve();
          };
          img.onerror = () => {
            console.warn('Image failed:', option.image);
            resolve();
          };
          img.src = option.image;
          setTimeout(resolve, 2000);
        });

        if (imageLoaded) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          // Placeholder
          ctx.beginPath();
          ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(181, 101, 216, 0.3)';
          ctx.fill();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.font = '24px serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stage.emoji, imgX + imgSize / 2, imgY + imgSize / 2);
        }
      } catch (e) {
        console.warn('Error:', e);
      }

      // Stage circle з емоджі
      ctx.beginPath();
      ctx.arc(pathX, y, 16, 0, Math.PI * 2); // Зменшено з 20 до 16
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#ff6b81';
      ctx.lineWidth = 2; // Тонша рамка
      ctx.stroke();

      // Emoji
      ctx.font = '16px serif'; // Зменшено з 20px
      ctx.fillStyle = '#2d1b3e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stage.emoji, pathX, y + 1);

      // Text box
      const text = option.text;
      ctx.font = 'bold 14px "Montserrat", sans-serif'; // Зменшено з 16px
      const textWidth = ctx.measureText(text).width;
      const boxWidth = textWidth + 30; // Менший padding
      const boxHeight = 30; // Менша висота
      const boxX = pathX - boxWidth / 2;
      const boxY = y + 25; // Менший відступ

      // Box background з кращим контрастом
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; // Більш непрозорий фон
      this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3; // Товща рамка
      ctx.stroke();

      // Text з тінню для кращої читабельності
      ctx.fillStyle = '#1a0933'; // Темніший фіолетовий
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Додаємо тінь для чіткості
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.fillText(text, pathX, boxY + boxHeight / 2);

      // Скидаємо тінь
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      currentY += stageHeight;
      stageIndex++; // Збільшуємо індекс підтверджених стадій
    }

    // Footer
    ctx.font = 'italic 12px "Montserrat", sans-serif'; // Зменшено
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉 Дякую за чудовий день! 🎉', width / 2, height - 15);

    container.innerHTML = '';
    canvas.style.width = `${width}px`;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.borderRadius = '15px';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Карта нашого дня');
    container.appendChild(canvas);

    return canvas;
  }

  // ---- Saving the picture (one implementation for the one button) ----

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
        console.error('Could not export the roadmap:', e);
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
      console.error('Error downloading roadmap:', error);
      Toast.show('Не вдалося зберегти картинку 😔', 'error');
    }
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// ============================================
// MAIN APP
// ============================================

class DateRandomizerApp {
  constructor() {
    this.stateManager = new StateManager();
    this.soundManager = new SoundManager();
    this.themeManager = new ThemeManager();
    this.particles = null;
    this.progressBar = null;
    this.timer = null;
    this.stageComponents = [];
    this.roadmapGenerator = null;
    this.canvas = null;
    this.roadmapFile = null;
    this.conversationTopics = null;
    this.isNavigating = false;
    this.finalShown = false;
    this.preloadedImages = [];
  }

  async init() {
    try {
      // Initialize managers
      this.stateManager.load();
      this.soundManager.init();
      this.themeManager.init();

      // Initialize particles
      const particlesContainer = Utils.$('#particles');
      if (particlesContainer) {
        this.particles = new ParticlesEffect(particlesContainer);
        this.particles.init();
      }

      // Initialize progress bar
      const progressBarElement = Utils.$('#progressBar');
      if (progressBarElement) {
        this.progressBar = new ProgressBar(progressBarElement, DATE_OPTIONS.stages.length);
        this.progressBar.init();
      }

      // Initialize conversation topics first
      const topicsContainer = Utils.$('#conversationTopicsContainer');
      if (topicsContainer) {
        this.conversationTopics = new ConversationTopics();
        topicsContainer.appendChild(this.conversationTopics.render());
      }

      // Initialize timer with conversation topics reference
      const timerElement = Utils.$('#globalTimer');
      if (timerElement) {
        this.timer = new Timer(timerElement, this.conversationTopics);
        this.setupOwnerSkip(timerElement);
      }

      // Initialize roadmap generator
      this.roadmapGenerator = new RoadmapGenerator(DATE_OPTIONS.stages, this.stateManager);

      // Setup UI
      this.setupThemeToggle();
      this.setupSoundToggle();
      this.setupIntroNavigation();
      this.setupStages();
      this.setupFinalScreen();

      // Restore state
      this.restoreState();
    } catch (error) {
      console.error('❌ Error during initialization:', error);
    }
  }

  // Hidden owner shortcut: hold the countdown for ~1.5 s to end the wait now.
  // Deliberately no visual hint.
  setupOwnerSkip(timerElement) {
    let holdTimer = null;

    const cancel = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    timerElement.addEventListener('pointerdown', (e) => {
      if (!this.timer?.isRunning()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancel();
      holdTimer = setTimeout(() => {
        holdTimer = null;
        Utils.vibrate(30);
        this.timer.finishNow();
      }, CONFIG.OWNER_SKIP_HOLD_MS);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
      timerElement.addEventListener(type, cancel);
    });

    // No text selection, magnifier or callout menu on long press (iOS/Android)
    timerElement.addEventListener('touchstart', (e) => {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    timerElement.addEventListener('contextmenu', (e) => e.preventDefault());
    timerElement.addEventListener('selectstart', (e) => e.preventDefault());
  }

  setupThemeToggle() {
    const toggle = Utils.$('#themeToggle');
    if (!toggle) return;

    toggle.classList.toggle('dark', this.themeManager.isDark);

    let longPressTimer = null;
    let isLongPress = false;

    const handlePress = (e) => {
      isLongPress = false;
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        Utils.vibrate([50, 30, 50]);
        this.showThemePicker();
      }, 500); // 500ms for long press
    };

    const handleRelease = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (!isLongPress) {
        // Normal click - toggle light/dark
        const isDark = this.themeManager.toggle();
        toggle.classList.toggle('dark', isDark);
        this.soundManager.playClick();
      }
    };

    // Mouse events
    toggle.addEventListener('mousedown', handlePress);
    toggle.addEventListener('mouseup', handleRelease);
    toggle.addEventListener('mouseleave', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    // Touch events
    toggle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handlePress();
    });
    toggle.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleRelease();
    });
  }

  showThemePicker() {
    // Check if theme picker already exists
    let picker = Utils.$('#themePicker');

    if (picker) {
      // If it exists, just show it
      picker.classList.add('visible');
      return;
    }

    // Create theme picker modal
    picker = document.createElement('div');
    picker.id = 'themePicker';
    picker.className = 'theme-picker';
    picker.innerHTML = `
      <div class="theme-picker-overlay"></div>
      <div class="theme-picker-content glass-card">
        <div class="card-glow"></div>
        <button class="theme-picker-close" aria-label="Закрити">
          <i class="fas fa-times"></i>
        </button>
        <h3 class="theme-picker-title">Обери тему</h3>
        <div class="theme-grid"></div>
      </div>
    `;

    document.body.appendChild(picker);

    const grid = picker.querySelector('.theme-grid');
    const themes = this.themeManager.getThemeList();
    const currentTheme = this.themeManager.getCurrentTheme();

    themes.forEach(({ key, name, icon }) => {
      const card = document.createElement('button');
      card.className = 'theme-card';
      card.dataset.theme = key;
      if (key === currentTheme) {
        card.classList.add('active');
      }

      card.innerHTML = `
        <span class="theme-icon">${icon}</span>
        <span class="theme-name">${name}</span>
        <div class="theme-preview" style="background: linear-gradient(135deg,
          ${THEMES[key].bgGradientStart},
          ${THEMES[key].bgGradientMiddle},
          ${THEMES[key].bgGradientEnd})">
        </div>
      `;

      card.addEventListener('click', () => {
        this.themeManager.setTheme(key);

        // Update UI
        const toggle = Utils.$('#themeToggle');
        if (toggle) {
          toggle.classList.toggle('dark', this.themeManager.isDark);
        }

        // Update active state
        picker.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.soundManager.playSuccess();
        Utils.vibrate(100);

        // Close picker after a short delay
        setTimeout(() => {
          this.hideThemePicker();
        }, 300);
      });

      grid.appendChild(card);
    });

    // Setup close handlers
    const closeBtn = picker.querySelector('.theme-picker-close');
    const overlay = picker.querySelector('.theme-picker-overlay');

    closeBtn.addEventListener('click', () => this.hideThemePicker());
    overlay.addEventListener('click', () => this.hideThemePicker());

    // Show picker with animation
    requestAnimationFrame(() => {
      picker.classList.add('visible');
    });

    this.soundManager.playClick();
  }

  hideThemePicker() {
    const picker = Utils.$('#themePicker');
    if (!picker) return;

    picker.classList.remove('visible');
    setTimeout(() => {
      picker.remove();
    }, 300);
  }

  setupSoundToggle() {
    const toggle = Utils.$('#soundToggle');
    if (!toggle) return;

    toggle.classList.toggle('muted', !this.soundManager.enabled);

    toggle.addEventListener('click', () => {
      const enabled = this.soundManager.toggle();
      toggle.classList.toggle('muted', !enabled);
      if (enabled) this.soundManager.playClick();
    });
  }

  setupIntroNavigation() {
    const buttons = Utils.$$('[data-next]');

    buttons.forEach(btn => {
      const nextStep = btn.dataset.next;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Ignore taps while a screen transition is still running
        if (this.isNavigating) return;
        this.isNavigating = true;

        // Add ripple effect
        this.createRipple(e, btn);

        this.soundManager.playClick();
        Utils.vibrate(50);

        try {
          if (nextStep === 'stages') {
            await this.startStages();
          } else {
            await this.navigateToScreen(nextStep);
          }
        } catch (error) {
          console.error('Navigation failed:', error);
        } finally {
          this.isNavigating = false;
        }
      });
    });
  }

  createRipple(event, button) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  async navigateToScreen(screenId) {
    const currentScreen = Utils.$('.screen.active');
    const nextScreen = Utils.$(`#${screenId}`);

    if (!nextScreen) {
      console.error('Screen not found:', screenId);
      return;
    }

    if (currentScreen && currentScreen !== nextScreen) {
      // Use different transition types for variety
      const transitionType = TransitionManager.getRandomTransition();
      await TransitionManager.transition(currentScreen, nextScreen, transitionType);
    } else {
      nextScreen.classList.add('active');
    }

    this.stateManager.update({ currentStep: screenId });
  }

  setupStages() {
    const container = Utils.$('#stagesContainer');
    if (!container) return;

    DATE_OPTIONS.stages.forEach((stageData, index) => {
      const component = new MysticStageComponent(stageData, index, {
        soundManager: this.soundManager,
        onSpin: (idx, selectedIndex, isReroll) => {
          const stage = this.stateManager.getStage(idx);
          this.stateManager.updateStage(idx, {
            selectedIndex,
            rerollsUsed: (stage.rerollsUsed || 0) + (isReroll ? 1 : 0)
          });
        },
        getRerollsLeft: (idx) => this.stateManager.getRerollsLeft(idx),
        onConfirm: (idx) => this.handleStageConfirm(idx)
      });

      container.appendChild(component.render());
      this.stageComponents.push(component);
    });
  }

  handleStageConfirm(index) {
    const isLast = index === DATE_OPTIONS.stages.length - 1;
    const unlockTime = Date.now() + CONFIG.DELAY_MS;

    // One atomic state write, so a reload can never catch a half-done update
    const stages = this.stateManager.get('stages').map((stage, i) => {
      if (i === index) return { ...stage, confirmed: true };
      if (!isLast && i === index + 1) return { ...stage, unlockTime };
      return stage;
    });

    this.stateManager.update(isLast
      ? { stages, pendingStage: 'farewell', pendingUnlockTime: unlockTime }
      : { stages, pendingStage: index + 1, pendingUnlockTime: unlockTime, lastActiveStage: index + 1 });

    this.progressBar.updateStep(index, true);
    this.startWait(unlockTime);
  }

  // Countdown for whatever is pending (next stage or the final screen).
  startWait(unlockTime) {
    const pending = this.stateManager.get('pendingStage');
    const label = pending === 'farewell' ? 'До фіналу' : 'До наступного етапу';
    this.timer.start(unlockTime, () => this.completeWait(), label);
  }

  // Single completion path for a wait: natural expiry, the owner's long-press
  // skip, and "time already passed" on reload all end up here.
  completeWait({ silent = false } = {}) {
    const pending = this.stateManager.get('pendingStage');

    if (pending === 'farewell') {
      this.showFinalScreen();
      return;
    }
    if (!Number.isInteger(pending)) return;

    const now = Date.now();
    const stage = this.stateManager.getStage(pending);
    const stages = this.stateManager.get('stages').map((s, i) =>
      i === pending && (s.unlockTime === null || s.unlockTime > now) ? { ...s, unlockTime: now } : s
    );
    this.stateManager.update({ stages, pendingStage: null, pendingUnlockTime: null });

    this.unlockStage(pending, { scroll: !silent, silent });
    if (!silent && stage) {
      Toast.show('Новий етап розблоковано! 🎉', 'success');
    }
  }

  unlockStage(index, { scroll = false, silent = false } = {}) {
    const component = this.stageComponents[index];
    if (!component) return;

    this.preloadStageImages(index);
    this.progressBar?.revealStep(index);
    component.unlock({ silent });

    if (scroll) {
      this.scrollToStage(index, true);
    }
  }

  preloadStageImages(index) {
    const stage = DATE_OPTIONS.stages[index];
    if (!stage) return;
    stage.options.forEach(option => {
      const img = new Image();
      img.src = option.image;
      this.preloadedImages.push(img);
    });
  }

  scrollToStage(index, smooth = true) {
    const element = this.stageComponents[index]?.element;
    if (!element) return;
    // Wait a frame so the unlocked card has its final layout
    requestAnimationFrame(() => {
      try {
        element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      } catch (e) {
        element.scrollIntoView(true);
      }
    });
  }

  async startStages() {
    const currentScreen = Utils.$('.intro-screen.active');
    const stagesContainer = Utils.$('#stagesContainer');

    this.stateManager.update({
      introCompleted: true,
      currentStep: 'stages'
    });

    if (currentScreen && stagesContainer) {
      await TransitionManager.transition(currentScreen, stagesContainer, 'fade');
    } else if (stagesContainer) {
      stagesContainer.classList.add('active');
    }

    // Make sure no intro screen stays active underneath
    Utils.$$('.intro-screen').forEach(screen => {
      screen.classList.remove('active');
    });

    this.progressBar.show();

    // Small pause so the unlock animation is visible
    await Utils.wait(250);
    this.unlockStage(0);
  }

  // Idempotent: safe to call again (reload, timer, restore) without replaying
  // the celebration or duplicating anything.
  showFinalScreen() {
    if (this.finalShown) return;
    this.finalShown = true;

    const stagesContainer = Utils.$('#stagesContainer');
    const finalScreen = Utils.$('#final');

    Utils.$$('.intro-screen').forEach(screen => screen.classList.remove('active'));
    if (stagesContainer) stagesContainer.classList.remove('active');
    if (finalScreen) finalScreen.classList.add('active');

    this.progressBar.hide();
    this.timer.stop();

    const firstArrival = !this.stateManager.get('farewellReached');
    const finishedAt = this.stateManager.get('finishedAt') || Date.now();

    this.stateManager.update({
      farewellReached: true,
      finishedAt,
      pendingStage: null,
      pendingUnlockTime: null
    });

    this.applyRatingSelection(this.stateManager.get('rating'));

    // Generate roadmap (and prepare the PNG for the save button)
    const roadmapContainer = Utils.$('#roadmapContainer');
    if (roadmapContainer) {
      const date = new Date(finishedAt);
      this.roadmapGenerator.generate(roadmapContainer, date)
        .then(async canvas => {
          if (!canvas) return;
          this.canvas = canvas;
          this.roadmapFile = await this.roadmapGenerator.toFile(canvas, date);
        })
        .catch(error => console.error('Roadmap generation failed:', error));
    }

    // Celebration confetti — only the first time, not on every reload
    if (firstArrival && typeof confetti === 'function') {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b81', '#ffd700', '#9c27b0']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b81', '#ffd700', '#9c27b0']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }

  // Bound once at start-up (never from showFinalScreen).
  setupFinalScreen() {
    const saveBtn = Utils.$('#downloadRoadmap');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveRoadmap());
    }
    this.setupEmojiRating();
  }

  saveRoadmap() {
    if (!this.canvas) {
      Toast.show('Картинка ще малюється, спробуй за мить 🙂', 'info');
      return;
    }
    const finishedAt = this.stateManager.get('finishedAt');
    const date = finishedAt ? new Date(finishedAt) : new Date();
    this.roadmapGenerator.save(this.canvas, this.roadmapFile, date);
  }

  setupEmojiRating() {
    const buttons = Utils.$$('.emoji-btn');

    const messages = {
      excited: 'У захваті? Оце я розумію — день вдався! 🤩',
      laughing: 'Класно, що було так весело! 😂',
      happy: 'Супер, радий, що тобі сподобалося! 😊',
      neutral: 'Дякую за чесність! Наступного разу буде ще краще 🙂',
      speechless: 'Без слів? Сподіваюся, це хороше «без слів» 😄',
      sad: 'Ой… Вибач, якщо щось пішло не так. Я все виправлю! 🙏'
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.dataset.rating;
        const message = messages[rating] || 'Дякую за оцінку!';

        this.stateManager.update({ rating });
        this.applyRatingSelection(rating);

        Toast.show(message, 'success', 4000);
        this.soundManager.playSuccess();
        Utils.vibrate([100, 50, 100, 50, 100]);
      });
    });
  }

  applyRatingSelection(rating) {
    Utils.$$('.emoji-btn').forEach(btn => {
      const selected = rating !== null && btn.dataset.rating === rating;
      btn.classList.toggle('selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
  }

  restoreState() {
    const state = this.stateManager.state;

    // If farewell reached, show final screen
    if (state.farewellReached && this.stateManager.areAllStagesConfirmed()) {
      this.showFinalScreen();
      return;
    }

    // If intro completed, show stages
    if (state.introCompleted) {
      Utils.$$('.intro-screen').forEach(screen => {
        screen.classList.remove('active');
      });

      const stagesContainer = Utils.$('#stagesContainer');
      if (stagesContainer) stagesContainer.classList.add('active');

      this.progressBar.show();

      // Restore stage states
      this.stageComponents.forEach((component, index) => {
        const stageState = state.stages[index];

        if (stageState.confirmed) {
          this.progressBar.updateStep(index, true);
          this.progressBar.revealStep(index);
          component.unlock({ silent: true });
          component.setSelected(stageState.selectedIndex);
          component.setConfirmed();
        } else if (state.pendingStage !== index && this.stateManager.isStageUnlocked(index)) {
          this.unlockStage(index, { silent: true });
          component.setSelected(stageState.selectedIndex);
        }
      });

      // Resume pending countdown
      if (state.pendingStage !== null && state.pendingUnlockTime) {
        if (state.pendingUnlockTime - Date.now() > 0) {
          this.startWait(state.pendingUnlockTime);
        } else {
          // Time already passed while the page was closed
          this.completeWait({ silent: true });
          if (this.finalShown) return;
        }
      }

      // Bring the current step into view: the stage to play now, or the
      // last confirmed one while waiting.
      const stages = this.stateManager.get('stages');
      const pending = this.stateManager.get('pendingStage');
      let current = stages.findIndex(s => !s.confirmed);
      if (pending === 'farewell') current = stages.length - 1;
      else if (Number.isInteger(pending)) current = pending - 1;
      if (current > 0) this.scrollToStage(current, false);

      return;
    }

    // First time - just show intro-1 (it's already active in HTML)
    const intro1 = Utils.$('#intro-1');
    if (intro1 && !intro1.classList.contains('active')) {
      intro1.classList.add('active');
    }
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
    CONFIG.THEME_KEY
  ];
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // storage unavailable — nothing to clear
    }
  });

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

// Timers are throttled in background tabs / on a locked phone:
// re-check the countdown as soon as the page is visible again.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    app?.timer?.refresh();
  }
});

window.addEventListener('pageshow', () => {
  app?.timer?.refresh();
});
