// CTG audio system — hub + all sheet pages
// Adjust this one constant to change global SFX volume (0–1)
const SOUND_VOLUME = 0.45;

const CTGSound = (() => {
  const MUTE_KEY = 'ctg-muted';
  let muted = localStorage.getItem(MUTE_KEY) === '1';

  // All clips keyed by logical name → file path
  const CLIP_MAP = {
    // Hub (mp3, original)
    'hover':       'sounds/hover.mp3',
    'select':      'sounds/select.mp3',
    'transition':  'sounds/transition.mp3',
    'back':        'sounds/back.mp3',
    // Sheet interactions (wav pack)
    'stat-up':     'sounds/positive.wav',
    'stat-down':   'sounds/negative.wav',
    'pip':         'sounds/click.wav',
    'click':       'sounds/click_2.wav',
    'add':         'sounds/misc_menu_2.wav',
    'delete':      'sounds/negative_2.wav',
    'open':        'sounds/misc_menu.wav',
    'close':       'sounds/misc_menu_3.wav',
    'save':        'sounds/save.wav',
    'panel-open':  'sounds/misc_menu_4.wav',
    'panel-close': 'sounds/misc_sound.wav',
    'page':        'sounds/sharp_echo.wav',
  };

  const clips = {};
  Object.entries(CLIP_MAP).forEach(([name, src]) => {
    const a = new Audio(src);
    a.volume = SOUND_VOLUME;
    a.preload = 'auto';
    clips[name] = a;
  });

  function play(name) {
    if (muted) return;
    const c = clips[name];
    if (!c) return;
    // pause + reset before replay — rapid triggers never stack
    c.pause();
    c.currentTime = 0;
    c.play().catch(() => {});
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

  // Button delegation — catches pips, counters, add, delete
  document.addEventListener('click', e => {
    if (e.target.closest('.hp-seg'))                                 { play('pip');    return; }
    if (e.target.closest('.counter-btn'))                            { play('click');  return; }
    if (e.target.closest('.add-btn'))                                { play('add');    return; }
    if (e.target.closest('.del-x, .inv-del, .card-del, .mini-del')) { play('delete'); return; }
  });

  // Collapsible <details> — toggle event doesn't bubble so wire directly
  document.querySelectorAll('details').forEach(d => {
    d.addEventListener('toggle', () => play(d.open ? 'open' : 'close'));
  });

  // Save flash — watch for the 'show' class appearing on .save-flash
  const flashEl = document.getElementById('save-flash');
  if (flashEl) {
    new MutationObserver(() => {
      if (flashEl.classList.contains('show')) play('save');
    }).observe(flashEl, { attributes: true, attributeFilter: ['class'] });
  }

  return { play, toggleMuteUI, isMuted: () => muted };
})();
