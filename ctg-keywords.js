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
        { id: 'twin', name: 'Twin Action', ap: 0, desc: 'Both of your two actions given to you per turn / round.' }
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
      key: 'operation', label: 'Operation', icon: '⚙', select: 'multi', max: 2,
      note: 'What the ability actually does — arguably the most important part. Stack up to two.',
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
        { id: 'mark', name: 'Mark', ap: 1, desc: 'Place a mark on the target item or person it hits.' }
      ]
    },
    {
      key: 'domain', label: 'Domain', icon: '✦', select: 'multi', max: 2,
      note: 'What you are manipulating. Abstract domains have no physical form. Blend up to two.',
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
      key: 'condition', label: 'Condition', icon: '⌖', select: 'single', discount: true,
      note: 'Where strategy comes from — accepting one drawback gives AP back.',
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
  function asList(v) { return Array.isArray(v) ? v : (v ? [v] : []); }

  function ruleReason(catKey, it, sel) {
    sel = sel || {};
    var doms = asList(sel.domain).map(function (id) { return item('domain', id); }).filter(Boolean);
    var domIds = doms.map(function (d) { return d.id; });
    var ops = asList(sel.operation);
    var targets = asList(sel.target);
    var conds = asList(sel.condition);

    // 1 · physical-plausibility gate — size/shape ops need at least one physical domain
    if (catKey === 'operation' && (it.id === 'expand' || it.id === 'compress' || it.id === 'transform')) {
      if (doms.length && !doms.some(function (d) { return d.physical === true; })) {
        return (doms.length === 1 ? doms[0].name + ' has' : 'Your domains have') + ' no physical form to ' + it.name.toLowerCase() + '.';
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
      if (it.id === 'burning') {
        if (domIds.indexOf('ice') !== -1) return 'Ice can’t induce Burning.';
        if (domIds.indexOf('fire') === -1 && domIds.indexOf('light') === -1) return 'Requires a Fire or Light domain.';
      }
      if (it.id === 'freezing') {
        if (domIds.indexOf('fire') !== -1) return 'Fire can’t induce Freezing.';
        if (domIds.indexOf('light') !== -1) return 'Light can’t induce Freezing.';
        if (domIds.indexOf('ice') === -1) return 'Requires an Ice domain.';
      }
      if (it.id === 'shocked' && domIds.indexOf('electricity') === -1) return 'Requires an Electricity domain.';
      if (it.id === 'restrained' && ops.indexOf('bind') === -1) return 'Requires the Bind operation.';
    }
    return null;
  }

  /* Remove selections that a later change has made invalid (mutates sel). */
  function prune(sel) {
    if (!sel) return sel;
    CATEGORIES.forEach(function (cat) {
      var k = cat.key;
      if (cat.select === 'single') {
        if (sel[k] && ruleReason(k, item(k, sel[k]), sel)) sel[k] = null;
      } else if (Array.isArray(sel[k])) {
        sel[k] = sel[k].filter(function (id) { return !ruleReason(k, item(k, id), sel); });
      }
    });
    return sel;
  }

  /* Coerce a stored selection to each category's current select type, so a
     draft saved when (say) Condition was multi still loads cleanly now that
     it is single. Returns a fresh, correctly-shaped selection object. */
  function normalizeSel(raw) {
    raw = raw || {};
    var out = {};
    CATEGORIES.forEach(function (cat) {
      var k = cat.key, v = raw[k];
      if (cat.select === 'single') {
        if (Array.isArray(v)) v = v.length ? v[0] : null;
        out[k] = (v === undefined || v === '') ? null : v;
      } else {
        var arr = Array.isArray(v) ? v.slice() : (v ? [v] : []);
        if (cat.max) arr = arr.slice(0, cat.max);
        out[k] = arr;
      }
    });
    return out;
  }

  /* ── AP TALLY ───────────────────────────────────────────────────────── */
  function totalAP(sel) {
    sel = sel || {};
    var t = 0;
    CATEGORIES.forEach(function (cat) {
      var sign = cat.discount ? -1 : 1;   // conditions are drawbacks — they give AP back
      asList(sel[cat.key]).forEach(function (id) { var it = item(cat.key, id); if (it) t += sign * it.ap; });
    });
    return Math.max(0, t);
  }

  /* ── RULE-TEXT GENERATOR ────────────────────────────────────────────────
     Composes the picked keywords into one flowing "rulebook" sentence, e.g.
     "As an Action, You may Bind any Target Creature or Object in Close range
      with Blood. It costs 4 HP to use. On Success it inflicts Restrained,
      which lasts until the start of the target's next turn."
  ─────────────────────────────────────────────────────────────────────── */
  function joinList(arr) {
    if (!arr.length) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  var ACTION_OPENER = { action: 'As an Action, ', reaction: 'As a Reaction, ', twin: 'Spending both your actions, ' };
  // the operation verb, capitalised to read like the rulebook examples
  var OP_RULE = {
    damaging: 'Attack', move: 'Move', push: 'Push', pull: 'Pull', increase: 'Boost',
    decrease: 'Weaken', transform: 'Transform', bind: 'Bind', release: 'Release',
    store: 'Store power in', transfer: 'Transfer power to', compress: 'Compress',
    expand: 'Expand', convert: 'Convert', divide: 'Split', mark: 'Mark'
  };
  var RANGE_WORD = { touch: 'Close', medproj: 'Medium', longproj: 'Long', trueproj: 'Any' };
  var DUR_RULE = {
    immediate: '', endturn: 'until the end of your turn', endround: 'until the end of the round',
    startnext: "until the start of the target's next turn"
  };
  function conditionRule(c, ap) {
    switch (c.id) {
      case 'reqhp': return 'It costs ' + Math.max(1, Math.ceil(ap / 4)) + ' HP to use.';
      case 'onlymoving': return 'You may only use it against a moving creature.';
      case 'onlyinjured': return 'You may only use it after you have taken damage.';
      case 'reqsight': return 'You must be able to see your target.';
      case 'reqspoken': return 'You must call out the ability aloud to use it.';
      case 'clutch': return 'You must take your time to use it.';
      case 'remainstill': return 'You cannot move while using it.';
      case 'reqmark': return 'You must have a mark already placed to use it there.';
      case 'percent': return 'Its success is decided by a percentile roll, the odds scaling with its AP.';
      default: return c.desc;
    }
  }
  function buffRule(b) {
    switch (b.id) {
      case 'breakthrough': return 'Its damage ignores EF (armour).';
      case 'split': return 'You may split its d10 modifier into two d10.';
      case 'explode': return 'You may reroll its d10 modifier on a natural 10.';
      default: return b.desc;
    }
  }

  function generate(sel) {
    sel = sel || {};
    var action = sel.action ? item('action', sel.action) : null;
    var ops = asList(sel.operation).map(function (id) { return item('operation', id); }).filter(Boolean);
    var doms = asList(sel.domain).map(function (id) { return item('domain', id); }).filter(Boolean);
    var targets = asList(sel.target).map(function (id) { return item('target', id); }).filter(Boolean);
    var cond = asList(sel.condition).map(function (id) { return item('condition', id); }).filter(Boolean)[0] || null;
    var dur = sel.duration ? item('duration', sel.duration) : null;
    var mod = sel.modifier ? item('modifier', sel.modifier) : null;
    var effs = asList(sel.effects).map(function (id) { return item('effects', id); }).filter(Boolean);

    if (!action && !ops.length && !doms.length && !targets.length && !cond && !dur && !mod && !effs.length) return '';

    var tids = targets.map(function (t) { return t.id; });
    function hasT(id) { return tids.indexOf(id) !== -1; }

    // opener + operation verb
    var s = (action ? ACTION_OPENER[action.id] : '');
    var verb = ops.length ? ops.map(function (o) { return OP_RULE[o.id] || o.name; }).join(' and ') : 'affect';
    s += 'You may ' + verb;

    // target subject
    var subject = '';
    if (targets.length) {
      if (hasT('self')) subject = 'yourself';
      else if (hasT('area')) subject = 'every creature and ally in Close range';
      else if (hasT('cone')) subject = 'every creature and ally in a Cone at Medium range';
      else if (hasT('object') && !hasT('touch') && !hasT('medproj') && !hasT('longproj') && !hasT('trueproj') && !hasT('chain')) subject = 'a Target Object or Item';
      else subject = (hasT('touch') ? 'any Target Creature or Object' : 'a Target Creature or Object');
    }
    var rangeId = ['trueproj', 'longproj', 'medproj', 'touch'].filter(hasT)[0];
    var rangeWord = rangeId ? RANGE_WORD[rangeId] : null;
    var chain = hasT('chain');
    if (subject) {
      s += ' ' + subject;
      if (rangeWord && !chain && !hasT('self') && !hasT('area') && !hasT('cone')) {
        s += (rangeId === 'touch' ? ' in ' : ' at ') + rangeWord + ' range';
      }
    }

    // domain
    if (doms.length) s += ' with ' + joinList(doms.map(function (d) { return d.name; }));
    // chain rider
    if (chain) s += ', on Success it jumps to the nearest creature' + (rangeWord ? ' at ' + rangeWord + ' range' : '');
    // modifier / dice
    if (mod && !mod.blank) s += ', dealing ' + mod.name + ' Additional Damage on Success';
    s += '.';

    // condition (single drawback)
    if (cond) s += ' ' + conditionRule(cond, totalAP(sel));

    // debuffs + duration
    var debuffs = effs.filter(function (e) { return e.kind === 'debuff'; });
    var buffs = effs.filter(function (e) { return e.kind === 'buff'; });
    if (debuffs.length) {
      s += ' On Success it inflicts ' + joinList(debuffs.map(function (e) { return e.name; }));
      var durP = dur ? DUR_RULE[dur.id] : '';
      if (durP) s += ', which lasts ' + durP;
      s += '.';
    } else if (dur && DUR_RULE[dur.id]) {
      s += ' The effect lasts ' + DUR_RULE[dur.id] + '.';
    }
    // buffs
    buffs.forEach(function (b) { s += ' ' + buffRule(b); });

    return s.trim();
  }

  /* ── FLAVOR QUIZ ────────────────────────────────────────────────────────
     An Akinator-style question flow. The options here are deterministic
     "flavour fragments" — no external AI, so it works on static hosting —
     that a composer stitches into evocative prose the player can then edit.
  ─────────────────────────────────────────────────────────────────────── */
  function cap1(s) { s = (s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // Each quiz question is a bank of options. Choice options carry a fragment
  // the composer stitches in; any question can be skipped. {d} = the domain,
  // optionally tinted by the chosen colour.
  var STYLE_OPTIONS = [
    { label: 'Raw & overwhelming', adj: 'overwhelming', phrase: 'a raw, overwhelming surge of {d}' },
    { label: 'Precise & controlled', adj: 'precise', phrase: 'a precise, disciplined lance of {d}' },
    { label: 'Wild & unpredictable', adj: 'volatile', phrase: 'a wild, crackling burst of {d}' },
    { label: 'Slow & creeping', adj: 'patient', phrase: 'a slow, creeping bloom of {d}' },
    { label: 'Quiet & surgical', adj: 'cold', phrase: 'a quiet, surgical thread of {d}' },
    { label: 'Ancient & ritual', adj: 'arcane', phrase: 'an old, ritual weave of {d}' },
    { label: 'Explosive & sudden', adj: 'violent', phrase: 'a sudden detonation of {d}' },
    { label: 'Graceful & flowing', adj: 'fluid', phrase: 'a flowing ribbon of {d}' },
    { label: 'Relentless & grinding', adj: 'relentless', phrase: 'a relentless, grinding torrent of {d}' },
    { label: 'Delicate & intricate', adj: 'intricate', phrase: 'a delicate, intricate lattice of {d}' },
    { label: 'Feral & hungry', adj: 'ravenous', phrase: 'a feral, hungry swell of {d}' },
    { label: 'Heavy & crushing', adj: 'crushing', phrase: 'a heavy, crushing weight of {d}' },
    { label: 'Shimmering & unreal', adj: 'uncanny', phrase: 'a shimmering, half-real veil of {d}' },
    { label: 'Coiled & waiting', adj: 'tense', phrase: 'a coiled, waiting knot of {d}' },
    { label: 'Blinding & instant', adj: 'blinding', phrase: 'a blinding, instant flash of {d}' }
  ];
  var COLOUR_OPTIONS = [
    { label: 'Crimson red', adj: 'crimson' },
    { label: 'Cobalt blue', adj: 'cobalt' },
    { label: 'Violet', adj: 'violet' },
    { label: 'Emerald green', adj: 'emerald' },
    { label: 'Golden', adj: 'golden' },
    { label: 'Sickly green', adj: 'sickly green' },
    { label: 'Bone white', adj: 'bone-white' },
    { label: 'Pitch black', adj: 'pitch-black' },
    { label: 'Prismatic', adj: 'prismatic' },
    { label: 'Molten orange', adj: 'molten orange' },
    { label: 'Silver', adj: 'silver' },
    { label: 'Blood red', adj: 'blood-red' },
    { label: 'Ashen grey', adj: 'ashen grey' },
    { label: 'Neon pink', adj: 'neon pink' },
    { label: 'Deep indigo', adj: 'deep indigo' },
    { label: 'Sea green', adj: 'sea-green' },
    { label: 'Rust brown', adj: 'rust-brown' },
    { label: 'Unseen / ultraviolet', adj: 'unseen, ultraviolet' }
  ];
  var ORIGIN_OPTIONS = [
    { label: 'Your open hands', sentence: 'It erupts from your open hands.' },
    { label: 'Your eyes / gaze', sentence: 'It kindles behind your eyes and pours out with your gaze.' },
    { label: 'Your breath', sentence: 'You breathe it out in a slow exhale.' },
    { label: 'Your weapon', sentence: 'It races down the length of your weapon.' },
    { label: 'Your shadow', sentence: 'It peels up out of your own shadow.' },
    { label: 'A drawn sigil', sentence: 'It unspools from a sigil you trace in the air.' },
    { label: 'Your voice', sentence: 'It rides out on the sound of your voice.' },
    { label: 'The ground beneath', sentence: 'It tears its way up out of the ground beneath you.' },
    { label: 'Your heartbeat', sentence: 'It pulses out in time with your heartbeat.' },
    { label: 'Your fingertips', sentence: 'It sparks to life at your fingertips.' },
    { label: 'The air around you', sentence: 'It condenses straight out of the air around you.' },
    { label: 'Your own blood', sentence: 'It wells up from your own blood.' },
    { label: 'A held stillness', sentence: 'It gathers in a held, perfect stillness before release.' },
    { label: 'Your footsteps', sentence: 'It trails up from where your feet strike the ground.' },
    { label: 'Cracks in the world', sentence: 'It bleeds through hairline cracks in the world itself.' }
  ];
  var SOUND_OPTIONS = [
    { label: 'A low hum', sentence: 'A low hum builds in the air as it forms.' },
    { label: 'A shrieking whine', sentence: 'It comes with a rising, shrieking whine.' },
    { label: 'Dead silence', sentence: 'It moves in utter, unsettling silence.' },
    { label: 'A thunderous crack', sentence: 'It lands with a thunderous crack.' },
    { label: 'A soft chime', sentence: 'A soft chime rings out as it takes shape.' },
    { label: 'A guttural roar', sentence: 'It announces itself with a guttural roar.' },
    { label: 'A crackling snap', sentence: 'It crackles and snaps like a live wire.' },
    { label: 'A deep bass throb', sentence: 'A deep bass throb rolls out ahead of it.' },
    { label: 'Ringing bells', sentence: 'Distant bells seem to ring as it forms.' },
    { label: 'A wet tearing sound', sentence: 'It comes with a wet, tearing sound.' },
    { label: 'A whispering chorus', sentence: 'A whispering chorus rises around it.' },
    { label: 'Howling wind', sentence: 'Howling wind kicks up as it gathers.' }
  ];
  var TONE_OPTIONS = [
    { label: 'Menacing', adj: 'menacing' },
    { label: 'Elegant', adj: 'elegant' },
    { label: 'Chaotic', adj: 'chaotic' },
    { label: 'Solemn', adj: 'solemn' },
    { label: 'Playful', adj: 'mischievous' },
    { label: 'Regal', adj: 'regal' },
    { label: 'Feral', adj: 'feral' },
    { label: 'Mournful', adj: 'mournful' },
    { label: 'Serene', adj: 'serene' },
    { label: 'Vicious', adj: 'vicious' },
    { label: 'Triumphant', adj: 'triumphant' },
    { label: 'Coldly detached', adj: 'coldly detached' },
    { label: 'Reverent', adj: 'reverent' },
    { label: 'Manic', adj: 'manic' },
    { label: 'Weary', adj: 'weary' },
    { label: 'Proud', adj: 'proud' }
  ];
  var AFTERMATH_OPTIONS = [
    { label: 'Scorched ruin', sentence: 'It leaves scorched, blackened ruin behind.' },
    { label: 'Creeping frost', sentence: 'A rime of frost creeps out from where it struck.' },
    { label: 'Crackling static', sentence: 'The air stays charged with crackling static afterward.' },
    { label: 'An eerie hush', sentence: 'An eerie hush lingers once it fades.' },
    { label: 'A strange scent', sentence: 'A strange scent hangs in the air afterward.' },
    { label: 'Nothing at all', sentence: 'It vanishes without a trace, as if it were never there.' },
    { label: 'A lingering glow', sentence: 'A faint glow lingers where it passed.' },
    { label: 'Shattered ground', sentence: 'It leaves the ground cracked and shattered.' },
    { label: 'Drifting motes', sentence: 'Drifting motes hang in the air long after.' },
    { label: 'A sudden chill', sentence: 'A sudden chill settles over everything nearby.' },
    { label: 'Wilted, dead growth', sentence: 'Plants wilt and blacken where it touched.' },
    { label: 'A ringing in the ears', sentence: 'It leaves a ringing that takes minutes to fade.' },
    { label: 'Burnt sigils', sentence: 'Faint burnt sigils are seared into the nearest surface.' }
  ];
  function deliveryOptions(sel) {
    var t = (sel && sel.target) || [];
    var has = function (id) { return t.indexOf(id) !== -1; };
    if (has('medproj') || has('longproj') || has('trueproj')) return [
      { label: 'Hurled like a spear', phrase: 'hurled across the gap like a thrown spear' },
      { label: 'Loosed like an arrow', phrase: 'loosed in a flat, screaming arc' },
      { label: 'Spat like a bullet', phrase: 'spat out faster than the eye can follow' },
      { label: 'A slow, guided drift', phrase: 'drifting toward its mark with eerie, guided patience' },
      { label: 'A curving, homing arc', phrase: 'curving through the air to chase its mark' },
      { label: 'Raining from above', phrase: 'falling from directly above like a verdict' }
    ];
    if (has('touch')) return [
      { label: 'A single deliberate touch', phrase: 'delivered through one deliberate touch' },
      { label: 'A crushing grip', phrase: 'forced through a crushing grip' },
      { label: 'A glancing brush', phrase: 'passed on with the lightest brush of contact' },
      { label: 'A sudden seizing grab', phrase: 'delivered the instant your grip closes' }
    ];
    if (has('self')) return [
      { label: 'Wrapped around you', phrase: 'wrapping around your own body like a second skin' },
      { label: 'Surging from within', phrase: 'surging up from somewhere deep inside you' },
      { label: 'Sinking into your skin', phrase: 'sinking quietly beneath your own skin' }
    ];
    if (has('area') || has('cone')) return [
      { label: 'Erupting outward', phrase: 'erupting outward to catch everything near you' },
      { label: 'Sweeping the field', phrase: 'sweeping across the ground in a wave' },
      { label: 'A slow-spreading tide', phrase: 'spreading out in a slow, inexorable tide' },
      { label: 'A shockwave ring', phrase: 'blasting outward in a violent ring' }
    ];
    if (has('object')) return [
      { label: 'Bound into an object', phrase: 'bound quietly into an object until its moment comes' },
      { label: 'Fused in seamlessly', phrase: 'fused seamlessly into the object, invisible until it triggers' }
    ];
    if (has('chain')) return [
      { label: 'Leaping mark to mark', phrase: 'leaping from one mark to the next, hungry for more' },
      { label: 'Arcing hungrily', phrase: 'arcing hungrily between everything within reach' }
    ];
    return [
      { label: 'Released into the world', phrase: 'released into the world to do its work' },
      { label: 'Shaped in your hands', phrase: 'shaped patiently in your hands' },
      { label: 'Willed into being', phrase: 'called into being by will alone' }
    ];
  }

  function flavorText(sel, ans) {
    sel = sel || {}; ans = ans || {};
    var doms = asList(sel.domain).map(function (id) { return item('domain', id); }).filter(Boolean);
    var dom = doms[0] || null;
    var domName = doms.length ? joinList(doms.map(function (d) { return d.name; })) : 'raw power';
    var name = (ans.name || '').trim();
    var colour = ans.colour || null;
    var style = ans.style || null;
    var origin = ans.origin || null;
    var delivery = ans.delivery || null;
    var sound = ans.sound || null;
    var tone = ans.tone || null;
    var aftermath = ans.aftermath || null;
    var detail = (ans.detail || '').trim();

    // colour tints the element inside the manifestation phrase
    var dfill = colour ? (colour.adj + ' ' + domName) : domName;
    var manifest = style ? style.phrase.replace('{d}', dfill)
      : (dom ? ('a surge of ' + dfill) : 'raw, unnamed power');

    var parts = [];
    parts.push((name ? name + ' — ' : '') + cap1(manifest) + (delivery ? ', ' + delivery.phrase : '') + '.');
    if (origin) parts.push(origin.sentence);
    if (sound) parts.push(sound.sentence);
    if (tone) parts.push(cap1(tone.adj) + ' in character.');
    if (aftermath) parts.push(aftermath.sentence);
    if (detail) parts.push(cap1(detail.replace(/[.!?]+$/, '')) + '.');

    // flavour only — the mechanical "plain rules" are shown in their own section
    return parts.join(' ');
  }

  /* Plain-language rules for the reference panel. */
  var AP_NOTE = 'Every keyword adds AP — except Conditions, which give AP back, since a drawback earns you room. Keep the running total at or under your cap. A higher total means a bigger, costlier ability.';
  var COMBINATION_RULES = [
    'Elements can’t contradict — Ice can’t inflict Burning, and Fire or Light can’t inflict Freezing.',
    'Size and shape need substance — Expand, Compress and Transform need at least one physical Domain, never only an abstract one like Force, Logic or Memory.',
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
    normalizeSel: normalizeSel,
    totalAP: totalAP,
    generate: generate,
    joinList: joinList,
    styleOptions: STYLE_OPTIONS,
    colourOptions: COLOUR_OPTIONS,
    originOptions: ORIGIN_OPTIONS,
    soundOptions: SOUND_OPTIONS,
    toneOptions: TONE_OPTIONS,
    aftermathOptions: AFTERMATH_OPTIONS,
    deliveryOptions: deliveryOptions,
    flavorText: flavorText,
    apNote: AP_NOTE,
    combinationRules: COMBINATION_RULES
  };
})(window);
