// CTG audio system — hub + all sheet pages
// Adjust this one constant to change global SFX volume (0–1)
const SOUND_VOLUME = 0.45;

const CTGSound = (() => {
  const MUTE_KEY = 'ctg-muted';
  let muted = localStorage.getItem(MUTE_KEY) === '1';

  // Per-clip config:
  //   rate   — playback speed (also shifts pitch: >1 = higher/brighter, <1 = lower/darker)
  //   maxMs  — hard stop after this many ms, trims long files to punchy hits
  const CLIP_MAP = {
    // Hub
    'hover':       { src: 'sounds/hover.mp3' },
    'select':      { src: 'sounds/select.mp3' },
    'transition':  { src: 'sounds/transition.mp3' },
    'back':        { src: 'sounds/back.mp3' },
    // Stat changes — same pack files but distinct rates make them feel different
    'stat-up':     { src: 'sounds/positive.wav',    rate: 1.35, maxMs: 380 },
    'stat-down':   { src: 'sounds/negative.wav',    rate: 0.72, maxMs: 500 },
    // Sheet UI
    'click':       { src: 'sounds/click_2.wav',     rate: 1.1,  maxMs: 160 },
    'add':         { src: 'sounds/misc_menu_2.wav', rate: 1.0,  maxMs: 380 },
    'delete':      { src: 'sounds/negative_2.wav',  rate: 1.2,  maxMs: 260 },
    'open':        { src: 'sounds/misc_menu.wav',   rate: 1.1,  maxMs: 340 },
    'close':       { src: 'sounds/misc_menu_3.wav', rate: 1.2,  maxMs: 260 },
    'save':        { src: 'sounds/save.wav',        rate: 1.0,  maxMs: 520 },
    'panel-open':  { src: 'sounds/misc_menu_4.wav', rate: 1.0,  maxMs: 440 },
    'panel-close': { src: 'sounds/misc_sound.wav',  rate: 1.3,  maxMs: 260 },
    // Page transition: fast rate on sharp_echo turns it into a brief whoosh
    'page':        { src: 'sounds/sharp_echo.wav',  rate: 1.9,  maxMs: 240 },
  };

  // Preload via Audio elements used as templates — each play() clones from these
  // so there are no state conflicts and rapid triggers never block each other
  const templates = {};
  Object.entries(CLIP_MAP).forEach(([name, conf]) => {
    const a = new Audio(conf.src);
    a.preload = 'auto';
    templates[name] = a;
  });

  function play(name) {
    if (muted) return;
    const conf = CLIP_MAP[name];
    const tmpl = templates[name];
    if (!conf || !tmpl) return;

    const a = tmpl.cloneNode();
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

  // Click delegation — counter buttons, add, delete
  // hp-seg intentionally excluded: statPop already covers those via stat-up/down
  document.addEventListener('click', e => {
    if (e.target.closest('.counter-btn'))                            { play('click');  return; }
    if (e.target.closest('.add-btn'))                                { play('add');    return; }
    if (e.target.closest('.del-x, .inv-del, .card-del, .mini-del')) { play('delete'); return; }
  });

  // Collapsible <details> — toggle event doesn't bubble so wire directly
  document.querySelectorAll('details').forEach(d => {
    d.addEventListener('toggle', () => play(d.open ? 'open' : 'close'));
  });

  // Save flash — fires when #save-flash gains the 'show' class
  const flashEl = document.getElementById('save-flash');
  if (flashEl) {
    new MutationObserver(() => {
      if (flashEl.classList.contains('show')) play('save');
    }).observe(flashEl, { attributes: true, attributeFilter: ['class'] });
  }

  return { play, toggleMuteUI, isMuted: () => muted };
})();
