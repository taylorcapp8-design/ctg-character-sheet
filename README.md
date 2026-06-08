```
 ██████╗████████╗ ██████╗
██╔════╝╚══██╔══╝██╔════╝
██║        ██║   ██║  ███╗
██║        ██║   ██║   ██║
╚██████╗   ██║   ╚██████╔╝
 ╚═════╝   ╚═╝    ╚═════╝

C A L L   T O   G A L L A H A D
◈ · OPERATIVE CHARACTER DOSSIER · ◈
```

A six-page TTRPG character sheet for the homebrew system **Call To Gallahad**.  
Dark-themed, fully browser-based — no build step, no dependencies, no server required.

---

## Setup

1. Open `ctg-character-sheet-site/index.html` in any modern browser.
2. That's it. All data saves automatically to your browser's `localStorage`.

To use on multiple devices, export a save code from the hub page and paste it on the other device.

---

## File Map

```
ctg-character-sheet-site/
├── index.html          Hub page — character name, page cards, export/import
├── p1.html             Page I   — Identity, Stats, Harth, EF, Equipment
├── p2.html             Page II  — Inventory, Armour, Charms, Mula
├── p3.html             Page III — Core Faculties & Tunings
├── p4.html             Page IV  — Arsenal, Weapons, Provisions
├── p5.html             Page V   — Skill Tree (6 columns, budget tracked)
├── 404.html            Error page (matches site aesthetic)
├── ctg-themes.css      8 visual themes (Gallahad, Umbra, Ember, Deep,
│                         Scorch, Arcane, Verdant, Slate)
└── ctg-theme.js        Theme switcher — injects dot picker into every nav bar
```

---

## Features

| Feature | Pages |
|---------|-------|
| Auto-save to `localStorage` | All |
| Character name synced across all pages | All |
| 8 switchable colour themes | All |
| Floating dice roller (D4–D20) | All |
| Print stylesheet — clean black-on-white | All |
| Mobile-responsive layout | All |
| Skill tree with budget tracking | P5 |
| Skill tree per-column reset | P5 |
| Node select animation + connector shimmer | P5 |
| Last-edited timestamp + session counter | Index |
| Page data indicator dots | Index |
| Export / import save code | Index |

---

## Themes

Pick from 8 themes using the diamond-dot row in the nav bar.  
Selection persists across all pages via `localStorage('ctg-theme')`.

| Dot | Name | Palette | Identity |
|-----|------|---------|----------|
| 🟡 | Gallahad | Olive / Gold | Default — field operator |
| ⬜ | Umbra | Slate Silver | Shadow ops / noir |
| 🔴 | Ember | Blood Red | Front-line combat |
| 🔵 | Deep | Navy Cyan | Naval intelligence |
| 🟠 | Scorch | Amber Rust | Wasteland survivor |
| 🟣 | Arcane | Void Purple | Forbidden tech |
| 🟢 | Verdant | Forest Green | Jungle ops |
| 🩵 | Slate | Industrial Teal | Encrypted HQ |

---

## localStorage Keys

| Key | Content |
|-----|---------|
| `ctg-char-name` | Character name string |
| `ctg-p1` | JSON — stats, harth, EF, equipment, field notes |
| `ctg-p1-portrait` | Base64 portrait image |
| `ctg-p2` | JSON — armour, charms, inventory, mula |
| `ctg-faculties` | JSON — active faculties + tuning selections |
| `ctg-p4` | JSON — provision charge states |
| `ctg-skills` | JSON array — selected skill IDs |
| `ctg-last-updated` | ISO timestamp of last save |
| `ctg-edit-count` | Integer — cumulative save count |
| `ctg-theme` | Active theme class string |

---

## Credits

Homebrew system design — **Call To Gallahad**  
Character sheet design & implementation — Claude Sonnet 4.6 + operator  
Fonts — [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue), [Cinzel](https://fonts.google.com/specimen/Cinzel), [Rajdhani](https://fonts.google.com/specimen/Rajdhani), [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) via Google Fonts

---

*♠ ♣ ♥ ♦ — CALL TO GALLAHAD*
