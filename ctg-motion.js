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

  // Fade in from transparent (enter)
  fadeIn(target, vars = {}) {
    return gsap.from(target, {
      opacity: 0,
      duration: this.duration.base,
      ease: this.ease.enter,
      ...vars,
    });
  },

  // Fade out to transparent (exit)
  fadeOut(target, vars = {}) {
    return gsap.to(target, {
      opacity: 0,
      duration: this.duration.fast,
      ease: this.ease.exit,
      ...vars,
    });
  },

  // Slide up + fade in (panel appear)
  slideIn(target, vars = {}) {
    return gsap.from(target, {
      y: 10,
      opacity: 0,
      duration: this.duration.base,
      ease: this.ease.enter,
      ...vars,
    });
  },

  // Scale + fade in (pop effect for small UI)
  popIn(target, vars = {}) {
    return gsap.from(target, {
      scale: 0.88,
      opacity: 0,
      duration: this.duration.fast,
      ease: this.ease.enter,
      ...vars,
    });
  },
};
