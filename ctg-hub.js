// Persona 5 hub animations — index.html word-pile only
(function () {
  const pile = document.getElementById('pile');
  if (!pile) return;

  const words = Array.from(pile.querySelectorAll('.word'));
  if (!words.length) return;

  // ── sound hooks ────────────────────────────────────────────────
  function onHoverEnter(word) { CTGSound.play('hover'); }
  function onSelect(word)     { CTGSound.play('select'); }
  function onConfirm(href)    { /* reserved — transition sound fires in wipeExit */ }
  function onBack()           { CTGSound.play('back'); } // no back nav on hub — hook ready

  words.forEach(w => {
    w.setAttribute('data-sound-hover',  'hub-word-hover');
    w.setAttribute('data-sound-select', 'hub-word-select');
  });

  // ── capture resting rotation from CSS before GSAP touches it ──
  // DOMMatrix extracts the angle from the computed transform matrix
  const restRot = new Map();
  words.forEach(w => {
    const raw = getComputedStyle(w).transform;
    if (!raw || raw === 'none') { restRot.set(w, 0); return; }
    const m = new DOMMatrix(raw);
    restRot.set(w, Math.round(Math.atan2(m.b, m.a) * (180 / Math.PI) * 10) / 10);
  });

  // ── 1. Entrance: alternating left/right, skewX overshoot ──────
  // Words enter from opposite sides with skewX punch, 0.08s stagger.
  // Total: 0.12 + (n-1)*0.08 + 0.45 ≈ 0.97s for 6 words → under 1s.
  gsap.from(words, {
    x:       (i) => i % 2 === 0 ? -90 : 90,
    skewX:   (i) => i % 2 === 0 ? -14 : 14,
    opacity: 0,
    duration: 0.45,
    ease: 'back.out(1.5)',
    stagger: 0.08,
    delay: 0.12,
    clearProps: 'x,skewX,opacity',
  });

  // ── 4. Ambient idle: subtle ±1–2° oscillation per word ────────
  function startIdle(w) {
    const base = restRot.get(w) || 0;
    const amp  = 1 + Math.random();          // 1–2°
    const dur  = 2.8 + Math.random() * 1.6;  // 2.8–4.4s half-cycle
    gsap.to(w, {
      rotation: base + amp,
      duration: dur,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 2.5,
      overwrite: 'auto',
    });
  }

  // Wait for entrance to finish before starting idle
  const ENTRANCE_MS = (0.12 + (words.length - 1) * 0.08 + 0.45 + 0.15) * 1000;
  const idleTimer = setTimeout(() => words.forEach(startIdle), ENTRANCE_MS);

  // ── 2. Hover: scale + un-tilt, 150–200ms snappy ───────────────
  words.forEach(w => {
    w.addEventListener('mouseenter', () => {
      onHoverEnter(w);
      gsap.killTweensOf(w);
      gsap.to(w, {
        scale: 1.05,
        rotation: 0,
        skewX: 0,
        duration: 0.16,
        ease: 'power3.out',
        overwrite: true,
      });
    });

    w.addEventListener('mouseleave', () => {
      gsap.killTweensOf(w);
      gsap.to(w, {
        scale: 1,
        rotation: restRot.get(w) || 0,
        skewX: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => startIdle(w),
      });
    });
  });

  // ── 3. Click: punch + color-panel wipe to dark purple ─────────
  // Called by ctg-motion.js capture listener when on the hub.
  window.CTGHub = {
    wipeExit(href) {
      const target = pile.querySelector(`[href="${href}"]`);
      if (target) {
        onSelect(target);
        gsap.killTweensOf(target);
        gsap.timeline()
          .to(target, { scale: 1.2,  duration: 0.07, ease: 'power3.out' })
          .to(target, { scale: 0.88, duration: 0.13, ease: 'power4.in' });
      }
      onConfirm(href);

      // Color-panel wipe: dark purple slab sweeps left → right
      let wipe = document.getElementById('hub-wipe');
      if (!wipe) {
        wipe = document.createElement('div');
        wipe.id = 'hub-wipe';
        Object.assign(wipe.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '999',
          background: 'var(--purple-dim, #4a0fa8)',
          pointerEvents: 'none',
        });
        document.body.appendChild(wipe);
      }

      // Tell destination page to enter from the right (all hub nav is "forward")
      sessionStorage.setItem('ctg-nav-entry-x', '48');

      gsap.set(wipe, { xPercent: -110, skewX: -8 });
      gsap.to(wipe, {
        xPercent: 0,
        duration: 0.22,
        ease: 'power4.in',
        onStart()    { CTGSound.play('transition'); },
        onComplete() { location.href = href; },
      });
    },
  };
})();
