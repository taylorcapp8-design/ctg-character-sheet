// CTG audio system — hub + all sheet pages
const SOUND_VOLUME = 0.45;

const CTGSound = (() => {
  const MUTE_KEY = 'ctg-muted';
  let muted = localStorage.getItem(MUTE_KEY) === '1';

  // rate: playback speed / pitch shift. maxMs: hard stop (only for wav pack sounds).
  // BetterSFX entries have no maxMs — let them play to their natural end.
  const CLIP_MAP = {
    // Hub
    'hover':       { src: 'sounds/hover.mp3' },
    'select':      { src: 'sounds/BetterSFX/futuristic-ui-digital-click-davies-aguirre-1-00-00.mp3' },
    'transition':  { src: 'sounds/transition.mp3' },
    'back':        { src: 'sounds/back.mp3' },
    // Stat changes — BetterSFX futuristic UI (play to natural end, no cutoff)
    'stat-up':     { src: 'sounds/BetterSFX/futuristic-ui-positive-selection-davies-aguirre-2-2-00-00.mp3' },
    'stat-down':   { src: 'sounds/BetterSFX/futuristic-ui-negative-selection-davies-aguirre-1-00-00.mp3' },
    // Page nav — transition.mp3 pitched down slightly so it's a softer version of the hub wipe
    'page':        { src: 'sounds/transition.mp3', rate: 0.82 },
    // Sheet UI (wav pack — capped so they stay punchy)
    'click':       { src: 'sounds/click_2.wav',     rate: 1.1, maxMs: 160 },
    'add':         { src: 'sounds/misc_menu_2.wav',            maxMs: 380 },
    'delete':      { src: 'sounds/negative_2.wav',  rate: 1.2, maxMs: 260 },
    'open':        { src: 'sounds/misc_menu.wav',   rate: 1.1, maxMs: 340 },
    'close':       { src: 'sounds/misc_menu_3.wav', rate: 1.2, maxMs: 260 },
    'panel-open':  { src: 'sounds/misc_menu_4.wav',            maxMs: 440 },
    'panel-close': { src: 'sounds/misc_sound.wav',  rate: 1.3, maxMs: 260 },
  };

  // Pre-create 3 genuine Audio instances per clip — rotating through them
  // on rapid triggers avoids the pause/reset race condition entirely.
  // (cloneNode was discarded: clones don't share preloaded buffer data.)
  const POOL = 3;
  const pools = {};
  const heads = {};
  Object.entries(CLIP_MAP).forEach(([name, conf]) => {
    pools[name] = Array.from({ length: POOL }, () => {
      const a = new Audio(conf.src);
      a.preload = 'auto';
      return a;
    });
    heads[name] = 0;
  });

  function play(name) {
    if (muted) return;
    const conf = CLIP_MAP[name];
    const pool = pools[name];
    if (!conf || !pool) return;

    const i = heads[name];
    heads[name] = (i + 1) % POOL;

    const a = pool[i];
    a.pause();
    a.currentTime = 0;
    a.volume = SOUND_VOLUME;
    a.playbackRate = conf.rate ?? 1;
    a.play().catch(() => {});
    if (conf.maxMs) setTimeout(() => a.pause(), conf.maxMs);
  }

  function syncUI() {
    const btn = document.getElementById('mute-toggle');
    if (!btn) return;
    btn.textContent = muted ? '✕ SFX' : '♪ SFX';
    btn.classList.toggle('muted', muted);
  }

  function toggleMuteUI() {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    syncUI();
  }

  syncUI();

  // ── Sheet-wide hooks ─────────────────────────────────────────

  // Button delegation — counter buttons, add, delete
  document.addEventListener('click', e => {
    if (e.target.closest('.counter-btn'))                            { play('click');  return; }
    if (e.target.closest('.add-btn'))                                { play('add');    return; }
    if (e.target.closest('.del-x, .inv-del, .card-del, .mini-del')) { play('delete'); return; }
  });

  // Collapsible <details> — toggle doesn't bubble, wire directly
  document.querySelectorAll('details').forEach(d => {
    d.addEventListener('toggle', () => play(d.open ? 'open' : 'close'));
  });

  // NOTE: save-flash observer removed — it fired on every stat change
  // (saveVitals → flashSaved) and was the source of the constant chime.

  return { play, toggleMuteUI, isMuted: () => muted };
})();
