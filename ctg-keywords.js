/* ═══════════════════════════════════════════════════════════════════════
   CTG — KEYWORD ABILITY DATA + GENERATOR
   ───────────────────────────────────────────────────────────────────────
   Single source of truth for the Keyword Ability Workshop (Page VII).
   Holds every keyword (category · name · AP cost · rulebook description),
   the "AI rules" that block impossible combinations, the AP tally, and the
   sentence generator that turns a set of picked keywords into written prose.

   To add a keyword later: drop it into the right category array below. The
   Workshop UI rebuilds itself from this data, so nothing else needs editing.
   Ordering of the categories mirrors the rulebook build order:
     Action · Target · Operation · Domain · Condition · Duration · Modifier
   with Debuffs / Buffs as an independent rider strip.
   ═══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── CATEGORY DATA ──────────────────────────────────────────────────
     select : 'single' | 'multi'
     max    : cap on picks for a multi-select category (optional)
     items  : { id, name, ap, desc, phrase?, clause?, physical? }
       phrase  — short generator clause (falls back to name)
       clause  — full sentence a Condition contributes to generated text
       physical— Domain only: false = abstract (stat / mind), true = tangible
  ─────────────────────────────────────────────────────────────────────── */
  var CATEGORIES = [
    {
      key: 'action', label: 'Action', icon: '⚡', select: 'single',
      note: 'What the ability costs to use — how much effort, how fast.',
      items: [
        { id: 'action', name: 'Action', ap: 1, desc: 'One of your two actions given to you per turn / round.' },
        { id: 'reaction', name: 'Reaction', ap: 2, desc: 'Your reaction given at the start of the round, or an unused action converted into a reaction.' },
        { id: 'twin', name: 'Twin Action', ap: 1, desc: 'Both of your two actions given to you per turn / round.' }
      ]
    },
    {
      key: 'target', label: 'Target', icon: '◎', select: 'multi', max: 2,
      note: 'Where it happens. You may stack up to two target modifiers.',
      items: [
        { id: 'self', name: 'Self', ap: 1, desc: 'Yourself / your own body.' },
        { id: 'touch', name: 'Touch', ap: 1, desc: 'You must touch the person or thing you are trying to affect. Close range.' },
        { id: 'medproj', name: 'Medium Projectile', ap: 1, desc: 'A ranged shot from medium range; any closer or further you roll with disadvantage.' },
        { id: 'longproj', name: 'Long Projectile', ap: 2, desc: 'A ranged shot from long range or more; any closer you roll with disadvantage.' },
        { id: 'trueproj', name: 'True Projectile', ap: 3, desc: 'A ranged shot from medium, long range or more with no penalty band.' },
        { id: 'object', name: 'Object', ap: 1, desc: 'You imbue an object or item with an effect.' },
        { id: 'area', name: 'Area', ap: 2, desc: 'An effect or attack on every enemy and ally in close range to you.' },
        { id: 'cone', name: 'Cone', ap: 3, desc: 'An effect or attack on every enemy and ally in medium range in front of you.' },
        { id: 'chain', name: 'Chain', ap: 3, desc: 'An effect that jumps to the next closest target, re-rolling until it fails or runs out of targets.' }
      ]
    },
    {
      key: 'operation', label: 'Operation', icon: '⚙', select: 'single',
      note: 'What the ability actually does — arguably the most important part.',
      items: [
        { id: 'damaging', name: 'Damaging', ap: 1, desc: 'An effect or attack made purely to harm or hurt the target.' },
        { id: 'move', name: 'Move', ap: 1, desc: 'Transfer or shift something to another location. Not within something else.' },
        { id: 'push', name: 'Push', ap: 1, desc: 'Push someone or something in the direction you are facing. Moves them 1 range further.' },
        { id: 'pull', name: 'Pull', ap: 1, desc: 'Pull someone or something toward you. Moves them 1 range closer.' },
        { id: 'increase', name: 'Increase', ap: 2, desc: 'Increase stat-related buffs or effects.' },
        { id: 'decrease', name: 'Decrease', ap: 2, desc: 'Reduce stat-related buffs or effects.' },
        { id: 'transform', name: 'Transform', ap: 2, desc: 'Alter the shape of an item, object, or your domain — e.g. making a key out of fire.' },
        { id: 'bind', name: 'Bind', ap: 2, desc: 'Create binding or welding to a surface, entrap something, seal fractures or close wounds.' },
        { id: 'release', name: 'Release', ap: 1, desc: 'Release non-physical bindings, debuffs, or chosen effects.' },
        { id: 'store', name: 'Store', ap: 1, desc: 'Store power or effects into someone or something for a chosen time before release.' },
        { id: 'transfer', name: 'Transfer', ap: 2, desc: 'Transfer effects, power, or damage to another willing person.' },
        { id: 'compress', name: 'Compress', ap: 2, desc: 'Reduce size or magnitude. Makes something physically smaller.' },
        { id: 'expand', name: 'Expand', ap: 2, desc: 'Amplify size or magnitude. Makes something physically bigger.' },
        { id: 'convert', name: 'Convert', ap: 1, desc: 'Change one thing into another.' },
        { id: 'divide', name: 'Divide', ap: 3, desc: 'Split something in half — doubling the physical effect into two, but not the damage or stat effect.' },
        { id: 'merge', name: 'Merge', ap: 2, desc: 'Combine two things into a single whole.' },
        { id: 'mark', name: 'Mark', ap: 1, desc: 'Place a mark on the target item or person it hits.' }
      ]
    },
    {
      key: 'domain', label: 'Domain', icon: '✦', select: 'single',
      note: 'What you are manipulating. Abstract domains have no physical form.',
      items: [
        { id: 'force', name: 'Force', ap: 5, physical: false, desc: 'Pure strength and power.' },
        { id: 'finesse', name: 'Finesse', ap: 5, physical: false, desc: 'Pure agility and reaction.' },
        { id: 'endurance', name: 'Endurance', ap: 5, physical: false, desc: 'Pure defence and stoutness.' },
        { id: 'logic', name: 'Logic', ap: 5, physical: false, desc: 'Pure intelligence and mind.' },
        { id: 'sense', name: 'Sense', ap: 3, physical: false, desc: 'Pure intuition and instinct.' },
        { id: 'velvet', name: 'Velvet', ap: 2, physical: false, desc: 'Pure charisma and charm.' },
        { id: 'shine', name: 'Shine', ap: 2, physical: false, desc: 'Pure luck and bedazzling.' },
        { id: 'memory', name: 'Memory', ap: 3, physical: false, desc: 'Stored thoughts — taking in, keeping, and recalling facts and past events.' },
        { id: 'fire', name: 'Fire', ap: 2, physical: true, desc: 'A burning blaze of combustion.' },
        { id: 'ice', name: 'Ice', ap: 2, physical: true, desc: 'A rigid, stone-like substance that is also slippery and wet.' },
        { id: 'water', name: 'Water', ap: 2, physical: true, desc: 'A flowing, clear, pure liquid.' },
        { id: 'sound', name: 'Sound', ap: 2, physical: true, desc: 'Vibration carried by the air, for messages or deafening.' },
        { id: 'gravity', name: 'Gravity', ap: 3, physical: true, desc: 'A constant force pulling everything toward the ground.' },
        { id: 'momentum', name: 'Momentum', ap: 2, physical: true, desc: 'Speed and acceleration made incarnate.' },
        { id: 'light', name: 'Light', ap: 3, physical: true, desc: 'A beautiful sheen of the heavens and what they hold.' },
        { id: 'shadow', name: 'Shadow', ap: 3, physical: true, desc: 'A dark shape on a surface, or a hidden influence.' },
        { id: 'flesh', name: 'Flesh', ap: 2, physical: true, desc: 'An amalgamation of muscle, skin, nerves, and body.' },
        { id: 'electricity', name: 'Electricity', ap: 2, physical: true, desc: 'A form of energy that moves through objects and flesh.' },
        { id: 'blood', name: 'Blood', ap: 3, physical: true, desc: 'The vital fluid circulating through living creatures.' },
        { id: 'air', name: 'Air', ap: 2, physical: true, desc: 'A mix of life itself, flowing through the smallest holes and filling the widest rooms.' },
        { id: 'metal', name: 'Metal', ap: 2, physical: true, desc: 'A hard, lustrous material — man’s true best friend.' },
        { id: 'space', name: 'Space', ap: 5, physical: true, desc: 'A combination of the cosmos themselves.' }
      ]
    },
    {
      key: 'condition', label: 'Condition', icon: '⌖', select: 'multi', discount: true,
      note: 'Where strategy comes from — accepting a drawback gives AP back.',
      items: [
        { id: 'onlymoving', name: 'Only While Moving', ap: 2, clause: 'It can only target a moving character.', desc: 'You can only target a moving character.' },
        { id: 'onlyinjured', name: 'Only While Injured', ap: 1, clause: 'It can only be used after you have taken damage.', desc: 'You can only activate the skill once you have taken damage.' },
        { id: 'reqsight', name: 'Requires Sight', ap: 1, clause: 'You must be able to see your target.', desc: 'You must be able to see your target.' },
        { id: 'reqspoken', name: 'Requires Spoken Word', ap: 1, clause: 'You must call out the ability’s name aloud, like in an anime.', desc: 'You have to say your ability name aloud.' },
        { id: 'clutch', name: 'Clutch', ap: 1, clause: 'You must take your time using it.', desc: 'You must take your time using your ability.' },
        { id: 'remainstill', name: 'Must Remain Still', ap: 1, clause: 'You cannot move while using it.', desc: 'You can’t move while using this.' },
        { id: 'reqhp', name: 'Requires HP', ap: 1, clause: 'It costs HP equal to one quarter of its total AP.', desc: 'Uses HP equal to ¼ of the AP used to make this skill.' },
        { id: 'reqmark', name: 'Requires Mark', ap: 2, clause: 'You must already have a mark placed to use it at the marked area.', desc: 'You must have a mark placed somewhere to use it at the marked area.' },
        { id: 'percent', name: 'Percent Chance', ap: 5, clause: 'Its success is rolled on a percentile dice, the odds scaling with its total AP.', desc: 'Roll a percentile dice; chance is set by AP used — 1–5: 90%, 5–10: 80%, 11–15: 60%, 16–20: 40%.' }
      ]
    },
    {
      key: 'duration', label: 'Duration', icon: '⧗', select: 'single',
      note: 'How long the ability or its conditions last.',
      items: [
        { id: 'immediate', name: 'Immediate', ap: 0, desc: 'Happens instantaneously.' },
        { id: 'endaction', name: 'Until End of Action', ap: 1, desc: 'Ends after you finish an action.' },
        { id: 'endturn', name: 'Until End of Turn', ap: 2, desc: 'Ends after you exhaust all your actions in the round.' },
        { id: 'endround', name: 'Until End of Round', ap: 3, desc: 'Ends after every player and enemy has exhausted their actions and reactions.' },
        { id: 'startnext', name: 'Until Start of Next Turn', ap: 5, desc: 'Lasts until your turn starts again on the next round.' }
      ]
    },
    {
      key: 'modifier', label: 'Modifier', icon: '🎲', select: 'single',
      note: 'How significantly the ability harms or how greatly it heals.',
      items: [
        { id: 'base', name: 'Blank', ap: 0, blank: true, desc: 'Whatever your character’s default / base damage is.' },
        { id: 'd4', name: '1d4', ap: 4, desc: 'The four-sided dice.' },
        { id: 'd6', name: '1d6', ap: 6, desc: 'The standard six-sided dice.' },
        { id: 'd8', name: '1d8', ap: 8, desc: 'The eight-sided dice.' },
        { id: 'd10', name: '1d10', ap: 10, desc: 'The ten-sided dice.' },
        { id: 'd12', name: '1d12', ap: 12, desc: 'The twelve-sided dice.' }
      ]
    },
    {
      key: 'effects', label: 'Debuffs / Buffs', icon: '☣', select: 'multi',
      note: 'The aftermath — riders the ability leaves on its target.',
      items: [
        { id: 'burning', name: 'Burning', ap: 2, kind: 'debuff', desc: 'Target takes 1 damage at the end of their turn; may roll an endurance check each turn, wearing off after 4 rounds.' },
        { id: 'freezing', name: 'Freezing', ap: 2, kind: 'debuff', desc: 'Target deals 1 less damage on their next attack; may roll an endurance check each turn, wearing off after 4 rounds.' },
        { id: 'shocked', name: 'Shocked', ap: 2, kind: 'debuff', desc: 'Target rolls with disadvantage on all checks that require sight; endurance check each turn, wearing off after 4 rounds.' },
        { id: 'blinded', name: 'Blinded', ap: 5, kind: 'debuff', desc: 'Target rolls with disadvantage on all checks that require sight; endurance check each turn, wearing off after 4 rounds.' },
        { id: 'stunned', name: 'Stunned', ap: 3, kind: 'debuff', desc: 'Target loses an action.' },
        { id: 'prone', name: 'Prone', ap: 3, kind: 'debuff', desc: 'The next attacks on the target are rolled with advantage until they stand up.' },
        { id: 'restrained', name: 'Restrained', ap: 3, kind: 'debuff', desc: 'Target can only attack close range; force check each turn, wearing off after 4 rounds.' },
        { id: 'breakthrough', name: 'Breakthrough', ap: 5, kind: 'buff', desc: 'Deals damage while ignoring EF (armour).' },
        { id: 'split', name: 'Split', ap: 5, kind: 'buff', desc: 'Split the d10 dice modifier used on this ability into 2× d10.' },
        { id: 'explode', name: 'Explode', ap: 2, kind: 'buff', desc: 'Re-roll the d10 dice modifier if the roll came up a natural 10.' }
      ]
    }
  ];

  /* ── LOOKUP MAPS ────────────────────────────────────────────────────── */
  var BY_CAT = {};      // catKey -> { itemId -> item }
  CATEGORIES.forEach(function (cat) {
    var m = {};
    cat.items.forEach(function (it) { it.cat = cat.key; m[it.id] = it; });
    BY_CAT[cat.key] = m;
  });
  function item(catKey, id) { return (BY_CAT[catKey] || {})[id] || null; }

  var PROJECTILES = ['medproj', 'longproj', 'trueproj'];

  /* ── VALIDATION — the "AI rules" ────────────────────────────────────────
     Given the current selection, return a human reason a keyword can't be
     picked (or null if it's fine). Selection shape:
       { action:id, target:[ids], operation:id, domain:id,
         condition:[ids], duration:id, modifier:id, effects:[ids] }
  ─────────────────────────────────────────────────────────────────────── */
  function ruleReason(catKey, it, sel) {
    sel = sel || {};
    var dom = sel.domain ? item('domain', sel.domain) : null;
    var targets = sel.target || [];
    var conds = sel.condition || [];

    // 1 · physical-plausibility gate — size/shape ops need a physical domain
    if (catKey === 'operation' && (it.id === 'expand' || it.id === 'compress' || it.id === 'transform')) {
      if (dom && dom.physical === false) {
        return dom.name + ' has no physical form to ' + it.name.toLowerCase() + '.';
      }
    }

    // 2 · hard no-match list
    if (catKey === 'condition' && it.id === 'onlymoving' && targets.indexOf('self') !== -1) {
      return 'Can’t combine with a Self target.';
    }
    if (catKey === 'target' && it.id === 'self' && conds.indexOf('onlymoving') !== -1) {
      return 'Can’t combine with “Only While Moving”.';
    }
    if (catKey === 'target' && PROJECTILES.indexOf(it.id) !== -1 && targets.indexOf('touch') !== -1) {
      return 'A projectile can’t combine with Touch.';
    }
    if (catKey === 'target' && it.id === 'touch') {
      for (var i = 0; i < targets.length; i++) {
        if (PROJECTILES.indexOf(targets[i]) !== -1) return 'Touch can’t combine with a projectile.';
      }
    }

    // 3 · required-pair gating for Debuffs / Buffs (+ elemental exclusions)
    if (catKey === 'effects') {
      var domId = dom ? dom.id : null;
      if (it.id === 'burning') {
        if (domId === 'ice') return 'Ice can’t induce Burning.';
        if (domId !== 'fire' && domId !== 'light') return 'Requires a Fire or Light domain.';
      }
      if (it.id === 'freezing') {
        if (domId === 'fire' || domId === 'light') return domId === 'fire' ? 'Fire can’t induce Freezing.' : 'Light can’t induce Freezing.';
        if (domId !== 'ice') return 'Requires an Ice domain.';
      }
      if (it.id === 'shocked' && domId !== 'electricity') return 'Requires an Electricity domain.';
      if (it.id === 'restrained' && sel.operation !== 'bind') return 'Requires the Bind operation.';
    }
    return null;
  }

  /* Remove selections that a later change has made invalid (mutates sel). */
  function prune(sel) {
    if (!sel) return sel;
    // single-selects
    ['operation'].forEach(function (k) {
      if (sel[k] && ruleReason(k, item(k, sel[k]), sel)) sel[k] = null;
    });
    // multi-selects
    ['target', 'condition', 'effects'].forEach(function (k) {
      if (Array.isArray(sel[k])) {
        sel[k] = sel[k].filter(function (id) { return !ruleReason(k, item(k, id), sel); });
      }
    });
    return sel;
  }

  /* ── AP TALLY ───────────────────────────────────────────────────────── */
  function totalAP(sel) {
    sel = sel || {};
    var t = 0;
    CATEGORIES.forEach(function (cat) {
      var sign = cat.discount ? -1 : 1;   // conditions are drawbacks — they give AP back
      var v = sel[cat.key];
      if (cat.select === 'single') { if (v) { var it = item(cat.key, v); if (it) t += sign * it.ap; } }
      else if (Array.isArray(v)) { v.forEach(function (id) { var it = item(cat.key, id); if (it) t += sign * it.ap; }); }
    });
    return Math.max(0, t);
  }

  /* ── SENTENCE GENERATOR ─────────────────────────────────────────────── */
  var OP_VERB = {
    damaging: 'strike and harm', move: 'move', push: 'push back', pull: 'pull in',
    increase: 'bolster', decrease: 'weaken', transform: 'reshape', bind: 'bind',
    release: 'release', store: 'store power within', transfer: 'transfer power to',
    compress: 'compress', expand: 'expand', convert: 'convert', divide: 'split apart',
    merge: 'merge', mark: 'mark'
  };
  var TGT_PHRASE = {
    self: 'yourself', touch: 'a target you touch', medproj: 'a target at medium range',
    longproj: 'a target at long range', trueproj: 'a target at any range',
    object: 'an object or item', area: 'every creature in close range',
    cone: 'every creature in a cone before you', chain: 'a target, leaping to the next nearest each time'
  };

  function joinList(arr) {
    if (!arr.length) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  function generate(sel) {
    sel = sel || {};
    var action = sel.action ? item('action', sel.action) : null;
    var op = sel.operation ? item('operation', sel.operation) : null;
    var dom = sel.domain ? item('domain', sel.domain) : null;
    var targets = (sel.target || []).map(function (id) { return item('target', id); }).filter(Boolean);
    var conds = (sel.condition || []).map(function (id) { return item('condition', id); }).filter(Boolean);
    var dur = sel.duration ? item('duration', sel.duration) : null;
    var mod = sel.modifier ? item('modifier', sel.modifier) : null;
    var effs = (sel.effects || []).map(function (id) { return item('effects', id); }).filter(Boolean);

    if (!action && !op && !dom && !targets.length && !conds.length && !dur && !mod && !effs.length) {
      return '';
    }

    var s = '';
    // opener + subject
    if (action) {
      s += (action.id === 'reaction' ? 'As a Reaction' :
            action.id === 'twin' ? 'Spending both your actions' : 'As an Action') + ', you ';
    } else {
      s += 'You ';
    }
    // verb (operation)
    s += op ? (OP_VERB[op.id] || op.name.toLowerCase()) : 'channel';
    // domain material
    if (dom) s += ' with ' + dom.name;
    // target(s)
    if (targets.length) {
      s += ', targeting ' + joinList(targets.map(function (t) { return TGT_PHRASE[t.id] || t.name.toLowerCase(); }));
    }
    s += '.';

    // modifier / dice
    if (mod && !mod.blank) s += ' It rolls ' + mod.name + ' for its effect.';

    // conditions
    if (conds.length) s += ' ' + conds.map(function (c) { return c.clause || c.desc; }).join(' ');

    // duration
    if (dur) {
      if (dur.id === 'immediate') s += ' The effect is immediate.';
      else s += ' The effect lasts ' + dur.name.toLowerCase().replace(/^until /, 'until ') + '.';
    }

    // debuffs / buffs
    if (effs.length) {
      var debuffs = effs.filter(function (e) { return e.kind === 'debuff'; }).map(function (e) { return e.name; });
      var buffs = effs.filter(function (e) { return e.kind === 'buff'; }).map(function (e) { return e.name; });
      if (debuffs.length) s += ' On a hit it inflicts ' + joinList(debuffs) + '.';
      if (buffs.length) s += ' It carries ' + joinList(buffs) + '.';
    }

    return s.trim();
  }

  /* ── FLAVOR QUIZ ────────────────────────────────────────────────────────
     An Akinator-style question flow. The options here are deterministic
     "flavour fragments" — no external AI, so it works on static hosting —
     that a composer stitches into evocative prose the player can then edit.
  ─────────────────────────────────────────────────────────────────────── */
  function cap1(s) { s = (s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  var STYLE_OPTIONS = [
    { label: 'Raw & overwhelming', adj: 'overwhelming', phrase: 'a raw, overwhelming surge of {d}' },
    { label: 'Precise & controlled', adj: 'precise', phrase: 'a precise, disciplined sliver of {d}' },
    { label: 'Wild & unpredictable', adj: 'volatile', phrase: 'a wild, crackling burst of {d}' },
    { label: 'Slow & creeping', adj: 'patient', phrase: 'a slow, creeping bloom of {d}' },
    { label: 'Quiet & surgical', adj: 'cold', phrase: 'a quiet, surgical thread of {d}' }
  ];
  var TONE_OPTIONS = [
    { label: 'Menacing', adj: 'menacing' },
    { label: 'Elegant', adj: 'elegant' },
    { label: 'Chaotic', adj: 'chaotic' },
    { label: 'Solemn', adj: 'solemn' },
    { label: 'Playful', adj: 'mischievous' }
  ];
  function deliveryOptions(sel) {
    var t = (sel && sel.target) || [];
    var has = function (id) { return t.indexOf(id) !== -1; };
    if (has('medproj') || has('longproj') || has('trueproj')) return [
      { label: 'Hurled like a spear', phrase: 'hurled across the gap like a thrown spear' },
      { label: 'Loosed like an arrow', phrase: 'loosed in a flat, screaming arc' },
      { label: 'Spat like a bullet', phrase: 'spat out faster than the eye can follow' }
    ];
    if (has('touch')) return [
      { label: 'A single deliberate touch', phrase: 'delivered through one deliberate touch' },
      { label: 'A crushing grip', phrase: 'forced through a crushing grip' }
    ];
    if (has('self')) return [
      { label: 'Wrapped around you', phrase: 'wrapping around your own body like a second skin' },
      { label: 'Surging from within', phrase: 'surging up from somewhere deep inside you' }
    ];
    if (has('area') || has('cone')) return [
      { label: 'Erupting outward', phrase: 'erupting outward to catch everything near you' },
      { label: 'Sweeping the field', phrase: 'sweeping across the ground in a wave' }
    ];
    if (has('object')) return [
      { label: 'Bound into an object', phrase: 'bound quietly into an object until its moment comes' }
    ];
    if (has('chain')) return [
      { label: 'Leaping mark to mark', phrase: 'leaping from one mark to the next, hungry for more' }
    ];
    return [
      { label: 'Released into the world', phrase: 'released into the world to do its work' },
      { label: 'Shaped in your hands', phrase: 'shaped patiently in your hands' }
    ];
  }

  function flavorText(sel, ans) {
    sel = sel || {}; ans = ans || {};
    var dom = sel.domain ? item('domain', sel.domain) : null;
    var domName = dom ? dom.name : 'raw power';
    var name = (ans.name || '').trim();
    var style = ans.style || null;
    var tone = ans.tone || null;
    var delivery = ans.delivery || null;
    var detail = (ans.detail || '').trim();

    var manifest = style ? style.phrase.replace('{d}', domName)
      : (dom ? ('a working of ' + domName) : 'raw, unnamed power');

    var s = (name ? name + ' — ' : '') + cap1(manifest);
    if (delivery) s += ', ' + delivery.phrase;
    s += '.';
    var vibe = [tone && tone.adj, style && style.adj].filter(Boolean);
    if (vibe.length) s += ' ' + cap1(joinList(vibe)) + (vibe.length > 1 ? ' in equal measure.' : ' to the core.');
    if (detail) s += ' ' + cap1(detail.replace(/[.!?]+$/, '')) + '.';

    // flavour only — the mechanical "plain rules" are shown in their own section
    return s;
  }

  /* Plain-language rules for the reference panel. */
  var AP_NOTE = 'Every keyword adds AP — except Conditions, which give AP back, since a drawback earns you room. Keep the running total at or under your cap. A higher total means a bigger, costlier ability.';
  var COMBINATION_RULES = [
    'Elements can’t contradict — Ice can’t inflict Burning, and Fire or Light can’t inflict Freezing.',
    'Size and shape need substance — Expand, Compress and Transform only work on a physical Domain, never an abstract one like Force, Logic or Memory.',
    'A target is one place at a time — Self can’t pair with “Only While Moving”, and Touch can’t pair with any Projectile.',
    'Riders need their source — Burning needs Fire or Light, Freezing needs Ice, Shocked needs Electricity, and Restrained needs the Bind operation.',
    'Conditions pay you back — each Condition you accept lowers the ability’s AP rather than raising it.'
  ];

  /* ── PUBLIC API ─────────────────────────────────────────────────────── */
  global.CTG_KEYWORDS = {
    categories: CATEGORIES,
    item: item,
    ruleReason: ruleReason,
    prune: prune,
    totalAP: totalAP,
    generate: generate,
    joinList: joinList,
    styleOptions: STYLE_OPTIONS,
    toneOptions: TONE_OPTIONS,
    deliveryOptions: deliveryOptions,
    flavorText: flavorText,
    apNote: AP_NOTE,
    combinationRules: COMBINATION_RULES
  };
})(window);
