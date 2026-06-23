// CTG Character Sheet — shared GSAP motion config
// Durations: fast for small UI, base for panel transitions
// Easings: game-menu-ish with punch and slight overshoot

const CTGMotion = {
  duration: {
    fast: 0.2,  // toggles, checkboxes, inline elements
    base: 0.4,  // panel transitions, drawers, collapsibles
  },
  ease: {
    enter: 'back.out(1.4)',  // slight overshoot on appear
    exit:  'power4.in',      // snappy disappear
    move:  'power4.inOut',   // punchy repositions and slides
  },

  fadeIn(target, vars = {}) {
    return gsap.from(target, { opacity: 0, duration: this.duration.base, ease: this.ease.enter, ...vars });
  },

  fadeOut(target, vars = {}) {
    return gsap.to(target, { opacity: 0, duration: this.duration.fast, ease: this.ease.exit, ...vars });
  },

  slideIn(target, vars = {}) {
    return gsap.from(target, { y: 10, opacity: 0, duration: this.duration.base, ease: this.ease.enter, ...vars });
  },

  popIn(target, vars = {}) {
    return gsap.from(target, { scale: 0.88, opacity: 0, duration: this.duration.fast, ease: this.ease.enter, ...vars });
  },

  // JRPG-style stat update: scale punch + color flash
  // dir: 'up' (heal/gain) | 'down' (damage/loss) | 'neutral'
  statPop(el, dir = 'neutral') {
    gsap.killTweensOf(el); // cancel any in-progress pop
    const flashColor = dir === 'up' ? '#22c451' : dir === 'down' ? '#d8143a' : null;
    const origColor  = getComputedStyle(el).color;

    // Scale: punch up to 1.15, settle back with overshoot (~0.32s total)
    gsap.timeline()
      .to(el, { scale: 1.15, duration: 0.1,  ease: 'power3.out' })
      .to(el, { scale: 1,    duration: 0.22, ease: 'back.out(2.5)' });

    // Color: snap to flash, hold briefly, fade back
    if (flashColor) {
      gsap.timeline()
        .set(el, { color: flashColor })
        .to(el, { color: origColor, duration: 0.3, ease: 'power2.out' }, '+=0.06');
    }
  },
};

// ─── Page nav transitions ─────────────────────────────────────
// Page order determines left/right direction for the slide.
const _NAV_PAGES = ['index.html','p1.html','p2.html','p3.html','p4.html','p5.html','p6.html'];

function _navWrap() {
  return document.getElementById('page-wrap') || document.getElementById('hub');
}

function _currentPage() {
  return location.pathname.split('/').pop() || 'index.html';
}

// Returns the elements to cascade on entry, per page structure:
//   sheet pages  → direct children of .sheet (header + blocks)
//   index (hub)  → named interactive sections, skipping decorative bg divs
//   p5 / other   → direct children of #page-wrap
function _cascadePanels(wrap) {
  const sheet = Array.from(wrap.children).find(el => el.classList.contains('sheet'));
  if (sheet) return Array.from(sheet.children);
  if (wrap.id === 'hub') {
    // #pile excluded — ctg-hub.js runs its own entrance on individual words
    return Array.from(wrap.querySelectorAll('.hub-top, .hub-char, .hub-hud, .hub-btns, .data-dots'));
  }
  return Array.from(wrap.children);
}

// Entry: run immediately (DOM + inline scripts already complete; we're at end of body)
(function _enterPage() {
  const wrap = _navWrap();
  if (!wrap) return;
  const raw = sessionStorage.getItem('ctg-nav-entry-x');
  const entryX = raw !== null ? Number(raw) : 48;
  sessionStorage.removeItem('ctg-nav-entry-x');

  // Page-level: directional slide + scale only.
  // Opacity is intentionally omitted — blocks own their own fade so there's
  // no double-fade (fading container × fading children = muddy timing).
  gsap.from(wrap, {
    x: entryX,
    scale: 0.97,
    skewX: entryX > 0 ? -1.5 : entryX < 0 ? 1.5 : 0,
    duration: CTGMotion.duration.base,
    ease: CTGMotion.ease.enter,
  });

  // Panel cascade: header first, then sections in DOM order.
  // 0.3s per panel + 0.07s stagger → worst case (10 panels) = 0.93s total.
  const panels = _cascadePanels(wrap);
  if (panels.length) {
    gsap.from(panels, {
      y: 14,
      opacity: 0,
      duration: 0.3,
      ease: CTGMotion.ease.enter,
      stagger: 0.07,
      clearProps: 'transform,opacity',
    });
  }
}());

// Exit: capture-phase listener fires BEFORE the existing per-page handlers,
// stopPropagation() prevents the event from reaching the <a> element at all.
document.addEventListener('click', function(e) {
  const a = e.target.closest('[data-nav]');
  if (!a) return;

  const href = a.getAttribute('href');
  if (!href) return;

  e.preventDefault();
  e.stopPropagation(); // kills the old handler — it never receives the click

  // Hub page: delegate to Persona 5 wipe exit in ctg-hub.js
  if (document.getElementById('hub') && window.CTGHub) {
    window.CTGHub.wipeExit(href);
    return;
  }

  const fromIdx = _NAV_PAGES.indexOf(_currentPage());
  const toIdx   = _NAV_PAGES.indexOf(href);
  const forward = toIdx >= fromIdx;
  const exitX   = forward ? -40 : 40;
  const entryX  = forward ?  48 : -48;

  sessionStorage.setItem('ctg-nav-entry-x', String(entryX));

  const wrap = _navWrap();
  if (!wrap) { location.href = href; return; }

  gsap.to(wrap, {
    x: exitX,
    opacity: 0,
    scale: 0.96,
    skewX: exitX < 0 ? 2 : -2,
    duration: CTGMotion.duration.fast,
    ease: CTGMotion.ease.exit,
    onComplete() { location.href = href; },
  });
}, true); // true = capture phase
