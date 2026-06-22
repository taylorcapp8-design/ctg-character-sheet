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

// Entry: run immediately (DOM is ready since we're at end of body)
(function _enterPage() {
  const wrap = _navWrap();
  if (!wrap) return;
  const raw = sessionStorage.getItem('ctg-nav-entry-x');
  const entryX = raw !== null ? Number(raw) : 48; // default: slide in from right
  sessionStorage.removeItem('ctg-nav-entry-x');
  gsap.from(wrap, {
    x: entryX,
    opacity: 0,
    scale: 0.96,
    skewX: entryX > 0 ? -2 : 2, // lean into the direction of travel
    duration: CTGMotion.duration.base,
    ease: CTGMotion.ease.enter,
  });
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
