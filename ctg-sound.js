// CTG hub audio system
// Adjust this one constant to change global SFX volume (0–1)
const SOUND_VOLUME = 0.45;

const CTGSound = (() => {
  const MUTE_KEY = 'ctg-muted';
  let muted = localStorage.getItem(MUTE_KEY) === '1';

  // Preload all clips up front so first trigger is instant
  const clips = {};
  ['hover', 'select', 'transition', 'back'].forEach(name => {
    const a = new Audio('sounds/' + name + '.mp3');
    a.volume = SOUND_VOLUME;
    a.preload = 'auto';
    clips[name] = a;
  });

  function play(name) {
    if (muted) return;
    const c = clips[name];
    if (!c) return;
    // pause + reset before replay so rapid hovers never stack
    c.pause();
    c.currentTime = 0;
    c.play().catch(() => {}); // swallow autoplay policy errors silently
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

  // Sync button label immediately (script runs after DOM body is parsed)
  syncUI();

  return { play, toggleMuteUI, isMuted: () => muted };
})();
