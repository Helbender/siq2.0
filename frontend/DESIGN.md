# Design System: SIQ 2.0 — Glass Admin

**Project:** Sistema Integrado de Qualificações — Esquadra 502, Portuguese Air Force
**Design Theme:** Glass Admin — Emerald & Gold Luxury Glassmorphism
**Component Framework:** Chakra UI v3 with custom recipe system (`src/theme2/`)

---

## 1. Visual Theme & Atmosphere

**Mood:** Sophisticated, Operational, Luminous

SIQ 2.0 uses a **glassmorphism aesthetic** that blends the precision of a military command interface with the elegance of a luxury admin dashboard. The design communicates trustworthiness and operational authority while remaining visually refined.

In **dark mode**, the application feels like a deep forest command center at night: a rich gradient background ranging from near-black forest green (`#0a0f0d`) through dark jungle tones (`#0d1a14`, `#132419`, `#1a2e23`). Three large, blurred floating orbs in emerald, gold, and coral drift slowly across the background, casting organic color washes behind frosted-glass surfaces.

In **light mode**, the atmosphere shifts to a bright, airy canvas: a soft sage-white gradient (`#f3fbf6` → `#ecf7f1` → `#f7fbff`) with translucent glass surfaces resting on a nearly-white base. The orbs persist at reduced opacity (22%), lending gentle warmth without overwhelming.

All interactive surfaces — cards, sidebar, inputs, dialogs — are **frosted glass**: semi-transparent backgrounds with `backdrop-filter: blur(20px)`, allowing the animated background to show through. A delicate single-pixel top highlight line on every card (`linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`) simulates light catching a glass edge.

**Keywords:** Glassmorphism, Deep Forest, Luminous Emerald, Military Precision, Luxury Dashboard.

---

## 2. Color Palette & Roles

### Brand Colors (Primary Accent System)

| Descriptive Name    | Hex       | Role                                                                 |
| ------------------- | --------- | -------------------------------------------------------------------- |
| Vivid Emerald Green | `#34d399` | Primary interactive highlight, glow effects, active state indicators |
| Forest Emerald Core | `#059669` | Primary action buttons, logo gradient start, avatar background       |
| Deep Forest Emerald | `#047857` | Active nav items, button hover states, brand-600                     |
| Darkest Forest      | `#064e3b` | Deep brand contexts, brand-900                                       |

### Accent Colors (Secondary System)

| Descriptive Name  | Hex       | Role                                                          |
| ----------------- | --------- | ------------------------------------------------------------- |
| Warm Antique Gold | `#d4a574` | Edit actions, gradient partner to emerald in logos and badges |
| Burnished Gold    | `#e8c9a0` | Lighter gold for subtle accent surfaces                       |
| Deep Amber Cognac | `#b45309` | Warning states, amber-500 semantic token                      |
| Sunlit Amber      | `#f59e0b` | Warning badge glow, amber-400                                 |
| Muted Coral       | `#e07a5f` | Third orb color, minor accent use                             |

### Background Palette — Dark Mode

| Descriptive Name  | Hex       | Role                                     |
| ----------------- | --------- | ---------------------------------------- |
| Midnight Forest   | `#0a0f0d` | Page canvas base (bgDark)                |
| Dark Jungle       | `#0d1a14` | Gradient layer 1                         |
| Deep Canopy       | `#132419` | Gradient layer 2 / surface (bgGradient2) |
| Forest Understory | `#1a2e23` | Gradient layer 3                         |

### Background Palette — Light Mode

| Descriptive Name | Hex       | Role                       |
| ---------------- | --------- | -------------------------- |
| Sage Canvas      | `#f3fbf6` | Page canvas base (bgLight) |
| Soft Mint Wash   | `#ecf7f1` | Surface / gradient layer 1 |
| Ice Blue Tint    | `#f7fbff` | Gradient layer 2           |

### Glass Surfaces (Semantic)

| Token           | Light Value             | Dark Value               | Role                                            |
| --------------- | ----------------------- | ------------------------ | ----------------------------------------------- |
| `bg.card`       | `rgba(255,255,255,0.6)` | `rgba(255,255,255,0.05)` | Primary glass surfaces (cards, sidebar, modals) |
| `bg.cardSubtle` | `rgba(255,255,255,0.3)` | `rgba(255,255,255,0.08)` | Hover states, nested panels, tab backgrounds    |
| `bg.surface`    | Soft Mint Wash          | Dark Canopy              | Secondary page surfaces                         |

### Text Colors (Semantic)

| Token            | Light                | Dark                    | Role                                         |
| ---------------- | -------------------- | ----------------------- | -------------------------------------------- |
| `text.primary`   | `#000000`            | `#f5f5f4`               | Headings, primary labels                     |
| `text.secondary` | `rgba(26,26,26,0.7)` | `rgba(245,245,244,0.7)` | Body copy, table cell data                   |
| `text.muted`     | `rgba(26,26,26,0.5)` | `rgba(245,245,244,0.4)` | Section titles, placeholders, column headers |

### Border Colors (Semantic)

| Token           | Light                     | Dark                     | Role                                            |
| --------------- | ------------------------- | ------------------------ | ----------------------------------------------- |
| `border.subtle` | `rgba(0,0,0,0.1)`         | `rgba(255,255,255,0.1)`  | Card borders, dividers, sidebar lines           |
| `border.strong` | `rgba(0,0,0,0.15)`        | `rgba(255,255,255,0.15)` | Emphasized separators                           |
| `border.focus`  | `#34d399` (Vivid Emerald) | `#34d399`                | Focus rings, active tab underlines, input focus |

### Status Colors

| State               | Solid                      | Subtle Background        | Usage                                        |
| ------------------- | -------------------------- | ------------------------ | -------------------------------------------- |
| Success / Completed | `#22c55e` (Luminous Green) | `rgba(34,197,94,0.15)`   | Active qualifications, completed flights     |
| Warning / Pending   | `#f59e0b` (Sunlit Amber)   | `rgba(234,179,8,0.15)`   | Expiring qualifications, pending items       |
| Danger / Error      | `#dc2626` (Alert Red)      | `rgba(255,107,107,0.15)` | Anomalies, dangerous actions, logout hover   |
| Info / Processing   | `#0ea5e9` (Sky Blue)       | `rgba(59,130,246,0.15)`  | Informational indicators, in-progress states |
| Edit                | `#d4a574` (Warm Gold)      | `#b45309` (Deep Amber)   | Edit action buttons and badges               |

---

## 3. Typography Rules

### Typefaces

- **UI Font:** `Outfit` (sans-serif) — used for all labels, body text, navigation, headings, and button text. Outfit brings a modern geometric quality that feels both professional and approachable, suited to an operational dashboard.
- **Data/Mono Font:** `Space Mono` (monospace) — used selectively for numerical data, statistics, and code-like displays where mechanical precision should be telegraphed visually.

### Weight Usage

| Weight         | Context                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| 500 (Medium)   | Body text, button labels, navigation items, table cell data                   |
| 600 (Semibold) | Card titles, section headings, form labels, sidebar logo text, column headers |
| 700 (Bold)     | Logo mark, high-emphasis numeric values                                       |

### Letter Spacing

- **Section labels and column headers:** `uppercase` + `letter-spacing: 0.5px–wider` — creates a military/operational hierarchy feel and visually separates navigation structure from content.
- **General body text:** Default tracking — no modification for readability at small sizes.

### Size Scale Guidance

- `2xs` / `xs`: Section titles in sidebar, table column headers, badge labels
- `sm`: Table cell data, button text (md/sm size), input text, nav item labels
- `md`/`lg`: Card titles, modal headings, top bar content
- `xl`: Sidebar "SIQ 2.0" logotype text

---

## 4. Component Stylings

### Buttons

Shape: **Gently rounded corners** (12px radius — `border-radius: button`). Never pill-shaped for actions; pills are reserved for status badges.

| Variant              | Background                                   | Text                    | Hover Behavior                                                      |
| -------------------- | -------------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `solid` (Primary)    | Emerald gradient via `brand.600`             | White                   | Lifts 2px with expanded emerald shadow glow (`rgba(5,150,105,0.4)`) |
| `subtle` (Secondary) | Frosted glass (`bg.card`) with subtle border | `text.default`          | Border shifts to emerald focus color, background deepens            |
| `ghost` (Tertiary)   | Transparent                                  | `text.secondary`        | Background fills to `bg.cardSubtle`, text brightens                 |
| `danger`             | Alert Red (`#dc2626`)                        | White                   | Deepens to `red.700`                                                |
| `success`            | Luminous Green (`#22c55e`)                   | White                   | Deepens to `green.500`                                              |
| `edit`               | Warm Antique Gold (`#d4a574`)                | Near-black (`gray.900`) | Lightens to `gold.100`                                              |

Focus state: 2px solid emerald ring (`border.focus`) on keyboard focus — no outline for mouse interaction.

Sizes: sm (32px tall), md (40px tall — default), lg (48px tall).

---

### Cards / Containers

Shape: **Generously rounded corners** (20px radius — `border-radius: card`). Cards have soft, organic presence.

- **Background:** Frosted glass — semi-transparent white on both light (`rgba(255,255,255,0.6)`) and dark (`rgba(255,255,255,0.05)`) modes, with `backdrop-filter: blur(20px)`.
- **Border:** 1px solid subtle translucent line (`border.subtle`) — barely visible, reinforces the glass edge.
- **Top Highlight:** A 1px gradient line across the card top (`transparent → rgba(255,255,255,0.2) → transparent`) simulates a light catch on a glass surface.
- **Shadow:** Deep ambient shadow (`0 25px 50px -12px rgba(0,0,0,0.3)`) combined with a faint emerald glow (`0 0 40px rgba(52,211,153,0.08)`) — creates depth without heaviness.
- **Hover:** Background subtly darkens/shifts, shadow intensifies to `floating` level (same formula, stronger glow at `0.1`).

Card variants:

- `outline` (default): Standard glass with border
- `subtle`: Reduced opacity glass, no border
- `elevated`: Adds 2px upward lift on hover
- `glass`: Extra blur emphasis on hover glow
- `glass-3d`: Subtle 3D perspective tilt on hover (5deg rotation) — for hero or dashboard highlight cards

---

### Inputs / Forms

Shape: **Gently rounded corners** (12px radius — `border-radius: input`).

- **Background:** Frosted glass (`bg.card`) with `backdrop-filter: blur(10px)`.
- **Border:** 1px solid `border.subtle` at rest.
- **Focus:** Border shifts to Vivid Emerald (`#34d399`), plus a diffuse emerald glow ring (`0 0 20px rgba(52,211,153,0.2)`).
- **Placeholder:** Muted (`text.muted`) — unobtrusive hint text.
- **Read-only:** Disabled glass (`bg.disabled`) with `cursor: not-allowed`.

Sizes: sm (32px tall), md (40px tall — default), lg (48px tall).

---

### Status Badges

Shape: **Pill-shaped** (`border-radius: full`). Badges are the only pill-shaped component — their rounded capsule form signals "status label" vs. "action."

Every badge has a small 6px **glowing dot** on the left (matching the badge's status color), created via `::before` pseudo-element with a matching `box-shadow` glow. This dot pulses visually as a status indicator.

Text: `xs`, weight `500`, uppercase implied by context. Padding: `px-3 py-1.5`.

Variants map to semantic states: `success/completed`, `warning/pending`, `error`, `info/processing`, `edit`, `gold`.

---

### Sidebar

Width: 280px. Full-height frosted glass panel (`blur(20px)`) with a right-edge border (`border.subtle`).

**Logo area:** 45×45px tile with an emerald-to-gold diagonal gradient and white letter mark. The "SIQ 2.0" wordmark beside it uses the same gradient applied as a `background-clip: text` effect — the text appears to be filled with the emerald-gold gradient.

**Navigation items:** 14px text, medium weight, `text.secondary` at rest. On hover/active: background fills to `bg.cardSubtle` and text becomes `text.primary`. Active items get a solid `brand.600` fill with white text. Icons are 22×22px, 80% opacity at rest, full opacity when active.

**Section titles:** `2xs`, `uppercase`, widely letter-spaced (`wider`), `text.muted` — divides nav sections visually.

**User footer:** Avatar tile (42×42px, same emerald-gold gradient as logo) shows user initials. Username in `sm`/`500` weight; role in `xs`/`muted`. The whole block is clickable with a hover fill.

---

### Tables

**No grid lines** between columns. Structure is defined purely by spacing and the subtle row separator (`rgba(255,255,255,0.03)` — nearly invisible).

- **Column headers:** `xs`, `uppercase`, `letter-spacing: 0.5px`, `text.muted` — creates clear hierarchy between header and data without harsh borders.
- **Data cells:** `sm`, `text.secondary`, comfortable padding (`px-4 py-4`).
- **Row hover:** `bg.cardSubtle` fill — glass-feel highlight on interaction.
- **Table container:** Horizontal scroll on overflow, with negative margin compensation to allow full-width feel within padded containers.

---

### Dialogs / Modals

Background: Frosted glass panel (same recipe as cards), rendered over a backdrop blur. Border radius matches card convention (20px). Transitions use `0.3s ease`.

---

## 5. Layout Principles

### Structural Layout

The application uses a **fixed sidebar + flexible main area** structure:

- Left: 280px frosted-glass sidebar, full viewport height, always visible
- Right: Flexible column containing a TopBar, a scrollable content area (`p-6`), and a Footer
- The background (gradient + orbs) is rendered via a React portal directly on `<body>` so it is never clipped by the layout's `overflow: hidden`

### Whitespace Philosophy

**Generous internal spacing.** Cards use `p-6` (24px) internal padding. Navigation items use `px-4 py-3.5`. Sections are separated by `mb-6` (24px) margins. This breathing room reinforces the premium, unhurried aesthetic — data is given room to be read rather than packed together.

### Grid & Alignment

- Content sections are left-aligned with consistent horizontal padding
- Table wrappers use overflow-x with a subtle margin compensation (`margin: 0 -10px; padding: 0 10px`) to maintain edge-to-edge table width inside padded cards
- Forms use a `FormGrid` component (shared) for consistent multi-column field layout

### Interaction Motion

All transitions use `all 0.2s ease` for micro-interactions (hover states, color changes, border transitions) and `all 0.3s ease` for structural changes (card hover depth, sidebar transitions). The 3D card variant uses a longer `0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)` for a spring-like feel.

The floating background orbs animate with a `float` keyframe animation on a 20-second loop, staggered by `-5s` and `-10s` offsets for organic, non-synchronized movement.

### Color Mode

The design fully supports both light and dark modes via Chakra UI's semantic token system. All color tokens resolve to the appropriate value at render time. The background gradient, orb colors, and all surface transparencies have dedicated light and dark values. The overall feel shifts from _airy sage canvas_ (light) to _deep emerald night_ (dark) while maintaining the same glassmorphism language.
