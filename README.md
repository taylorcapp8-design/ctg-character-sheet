# CTG — Call To Gallahad · Operative Dossier

A six-page digital character sheet for the homebrew TTRPG system **Call To Gallahad**.  
Browser-based, no build step, no server required. Cloud sync via Supabase.

---

## Quick Start

1. Open `index.html` in any modern browser.
2. Log in or create an account on the hub page to enable cloud sync.
3. All changes auto-save locally and sync to the cloud every 30 seconds.

---

## File Map

```
ctg-character-sheet/
├── index.html          Hub — login, character overview, session management
├── p1.html             Page I   — Identity, Stats, HP, Hearth, Carry
├── p3.html             Page II  — Core Faculties & Tunings
├── p4.html             Page III — Arsenal & Gear: Weapons / Accessories tabs, Carry, Mula, Catalog, Glossary
├── p5.html             Page IV  — Skill Tree
├── p6.html             Page V   — Combat: vitals, attack calculator, skills, buffs
├── p7.html             Page VI  — Specials (4 face-card slots) + Keyword Ability Workshop
├── ctg-keywords.js     Keyword data, combination rules & ability-text generator (Page VII)
├── supabase/functions/flavor/  Optional AI-flavour edge function (free LLM proxy) — see its README
├── ctg.css             Main stylesheet
├── ctg-themes.css      8 visual themes
├── ctg-theme.js        Theme switcher (injects dot picker into every nav bar)
├── ctg-sync.js         Supabase cloud sync — login, push, pull, collision guard
└── 404.html            Error page
```

---

## Features

| Feature | Where |
|---------|-------|
| Auto-save to `localStorage` | All pages |
| Cloud sync (Supabase) with session collision guard | All pages |
| 8 switchable colour themes | All pages |
| Character name synced across all pages | All pages |
| HP, Hearth (mana) & EF (armour) trackers with pip display | P1, P6 |
| Core Faculties + Tuning selection (max 2 active) | P3 |
| Weapon catalog with stat/dice/quirk editor | P4 |
| Accessories — equip up to 4, each can grant a stat bonus | P4 |
| Skill Tree with point budget | P5 |
| Combat page — conditions (with round countdown), damage calc, attack rolls, buffs | P6 |
| Stat modifiers with source breakdown (buffs + accessories + specials) | P1, P6 |
| Milestone bonuses — every 3 attribute points past the standard array = +1 attack dmg / range dmg / health | P1, P6 |
| Temp buffs with multi-stat support and presets | P6 |
| Specials — 4 face-card ability slots (J/Q/K/A) with freeform / workshop toggle + optional stat buff | P7 |
| Specials loadouts — save the whole four-card hand as a preset, swap all cards at once | P7 |
| Keyword Ability Workshop — combine keywords into an auto-written, editable ability | P7 |
| Flavour Quiz (built-in) + optional **AI Flavour** via a free-LLM edge function | P7 |
| Card → dice cheat sheet (collapsible) + live card-value lookup | P6 |
| Cross-tab localStorage sync | P1 ↔ P4 ↔ P6 ↔ P7 |

---

## Cloud Sync

Handled by `ctg-sync.js`. Each user logs in with a **username + PIN**. Data is stored in a single Supabase row keyed by username.

**Collision guard:** before every push, the sync module reads the server's `updated_at` timestamp and session ID. If another session wrote more recently than your last sync, the push is aborted and you're alerted to reload first.

---

## Specials — Activation

Each of the four face-card specials (Page VI) can be toggled **In Use**. While a special is active, any stat buff it grants is applied to the character's stats (Page I) and combat rolls (Page V), and removed when deactivated.

---

## Themes

8 themes via the dot row in every nav bar. Persists across pages in `localStorage`.

| Name | Palette |
|------|---------|
| Gallahad | Olive / Gold (default) |
| Umbra | Slate Silver |
| Ember | Blood Red |
| Deep | Navy Cyan |
| Scorch | Amber Rust |
| Arcane | Void Purple |
| Verdant | Forest Green |
| Slate | Industrial Teal |

---

## localStorage Keys

| Key | Content |
|-----|---------|
| `ctg-f-name` | Character name |
| `ctg-f-code` | Code name |
| `ctg-f-level` | Level |
| `ctg-stats` | JSON array — attribute names, icons, scores |
| `ctg-milestones` | JSON — milestone points assigned to `atk` / `rng` / `hp` (health is banked straight into Max HP) |
| `ctg-harth-cur` | Current HP |
| `ctg-harth-max` | Max HP |
| `ctg-harth-temp` | Temp HP |
| `ctg-hearth-cur` | Current Hearth (mana) |
| `ctg-hearth-max` | Max Hearth |
| `ctg-hearth-name` | Custom display name for the Hearth resource (e.g. Haki, Chakra) |
| `ctg-ef` | EF (armour) value — edited on the Stats page |
| `ctg-accessories` | JSON — accessories list (name/effect/equipped + optional stat mod, max 4 equipped) |
| `ctg-inventory` | JSON — carry list |
| `ctg-mula` | Currency amount |
| `ctg-weapons` | JSON — weapon list with slot/stat/dice/quirk |
| `ctg-catalog` | JSON — weapon catalog |
| `ctg-item-catalog` | JSON — gear/consumable item catalog |
| `ctg-faculties` | JSON — active faculties + tuning selections |
| `ctg-skills` | JSON array — purchased skill IDs |
| `ctg-custom-abilities` | JSON — custom ability entries |
| `ctg-specials` | JSON — 4 face-card special ability slots (J/Q/K/A), each with an optional stat buff |
| `ctg-spec-loadouts` | JSON — saved specials loadouts (snapshots of all 4 cards) + which one is live |
| `ctg-ability-workshop` | JSON — workshop draft + saved ability library |
| `ctg-temp-buffs` | JSON — active temp stat buffs |
| `ctg-buff-presets` | JSON — saved buff presets |
| `ctg-combat-notes` | Combat notes textarea |
| `ctg-theme` | Active theme name |
| `ctg-portrait` | Base64 portrait image |
| `ctg-last-edit` | Timestamp of last local save |

---

*♠ ♣ ♥ ♦ — CALL TO GALLAHAD*
