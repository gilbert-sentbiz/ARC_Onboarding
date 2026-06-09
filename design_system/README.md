# SentBiz Design System

A design system distilled from the SentBiz Dashboard codebase. SentBiz (SENTBE) is a Korean B2B cross‑border payments and FX platform; this design system powers the operator/admin dashboards and marketing surfaces for the product.

> 대시보드를 위한 디자인 시스템. Built on React + Emotion, tokenized via an internal `#tokens` package, and paired with Figma libraries "Zeus" (Governance) and "Gaia" (Dashboard).

---

## Sources

This design system was reverse‑engineered from:

- **Codebase** — `design-system/` (attached read-only). The upstream repository is `SENTBIZ/SentBiz-Dashboard-Frontend` on an internal SentBe GitHub enterprise instance. Key files consulted:
  - `src/tokens/colors.ts` — legacy palette
  - `src/tokens/new/colors.ts` — current palette (slate‑based)
  - `src/tokens/new/typography.ts` — current type scale
  - `src/tokens/{spacing,border,shadow}.ts` + `src/tokens/new/*`
  - `src/styles/fonts.ts` — @font-face definitions for Pretendard + GmarketSans
  - `src/components/ui/*` — Button, Badge, Input, Dialog, DataTable, etc.
  - `src/icons/svg/*` — 100+ outline and filled SVG icons (`Si*`, `SiFill*`)
  - `src/logos/src/*` — LogoDark, LogoLight, SentBizWhite wordmark
  - `src/stories/foundation/*` — Storybook MDX documentation
- **Dev dashboard** — https://dev-dashboard-design.sentbiz.kr/ (not accessible from this environment; flagged)
- **Figma libraries** (not accessible from this environment; flagged):
  - https://www.figma.com/file/tyVjar3T7ehDinakz5qXSU/SDSG---Zeus-for-Governance
  - https://www.figma.com/file/wsC7nZWRcov3H044R06LY4/Gaia-for-DashBoard
  - IA spreadsheet: https://docs.google.com/spreadsheets/d/13jZ2Al69vFU-wf9IA7hRaSHdGFGTzHvfWnWh4F2pr9Y

---

## Product context

SentBiz Dashboard is the operator console for SentBiz's cross-border payments product. The interface is **Korean‑first, English‑friendly**, and optimized for financial operators working with:

- **Remittance / transaction tables** — high‑density data views, sortable columns, pagination
- **Settlement & FX rate management** — forms, calendars, date‑range pickers, numeric inputs with units
- **Customer & corporate account management** — avatars, KYC state badges, modals for document review
- **Role‑based governance ("Zeus")** — permissions, audit log, multi‑tenant switching

The tone is professional banking/fintech. Visual vocabulary leans on a **deep royal blue** (`#0746CA`), slate neutrals, and generous white space. Accents are used almost exclusively for status (positive/warning/negative/progress). There is a tertiary **warm orange** (`#FF7B0A`) reserved for marketing moments and promotional CTAs.

---

## Content Fundamentals

How SentBiz writes copy. Observed from the codebase README, Storybook MDX, and component labels.

- **Language** — Primary: **Korean (존댓말 / polite form)**. English is used alongside Korean for technical labels, currencies, country codes. Example from Storybook: *"디자인의 핵심 요소를 체계화하여 일관된 디자인 언어를 유지합니다."*
- **Person** — Neutral/institutional. Rarely uses "I"; addresses the operator as an implicit subject. English-side follows the same convention — descriptive sentence fragments over conversational "you/we" unless onboarding.
- **Casing** — Titles use **Title Case** in English, natural sentence form in Korean. Button labels are always concise verbs/verb‑phrases (`Save`, `Delete`, `Add member`, `저장`, `삭제하기`). No ALL‑CAPS; no sentence‑case-only.
- **Tone** — Calm, precise, slightly clinical. Think Stripe or Toss in Korean tonality — not playful, not stiff. Confirmations say what just happened, not what the user did.
- **Emoji** — **None**, ever. Emoji are out of place in a payments/compliance surface. Reach for a filled status icon (`SiFillCheck`, `SiFillError`) instead.
- **Iconography in copy** — Unicode symbols (✓, →) are avoided in body copy. Always use an SVG icon component.
- **Numbers & currency** — Right‑aligned in tables, thin‑space thousand separators, ISO currency codes appended (`1,250.00 USD`). The legacy design system reserved `Input` with a `unit` suffix for numeric fields — follow that pattern.
- **Error messaging** — Specific + actionable. "잘못된 계좌번호입니다. 다시 입력해주세요." / "Invalid account number. Please re‑enter." Not "Oops!" or "Something went wrong."
- **Empty states** — One‑line description + optional subdued CTA. No illustration unless already supplied by design.

**Examples (from codebase + Storybook):**
- "디자인의 핵심 요소를 체계화하여 일관된 디자인 언어를 유지합니다."
- "색상 범위를 정의하는 Base Color Set과 역할과 의미에 따른 Semantic Color를 제공합니다."
- Button variants are named `primary`, `secondary`, `negative`, `negative_light` — intentionally functional, not editorial ("Danger", "Ghost" etc. are not used).

---

## Visual Foundations

### Color

Two coexisting token systems:

- **`tokens/new/`** — current direction, slate-based (`#0F172A`, `#293548`, `#64748B`, `#94A3B8`, `#CBD5E1` for labels; `#F8FAFC → #E2E8F0` for backgrounds). Brand anchor: `#0746CA`.
- **`tokens/` (legacy)** — neutral grays (`#303030 → #FAFAFA`), used where components haven't yet migrated.

When building new work, reach for the **new system** first. The legacy palette stays for backwards compatibility.

Accent colors (`Purple #915FFF`, `Green #5AEDA4`, `Turquoise #28E1E5`, `LightBlue #40A9FF`, `Yellow #FFD452`) are **illustration/chart‑only** — never interactive chrome.

### Typography

- **Primary UI font — `Pretendard`** (Korean‑first sans‑serif, extremely popular in Korean product design). Weights loaded: 300/400/500/600/700/800.
- **Display font — `GmarketSans`** — a slightly more editorial geometric sans used for hero/marketing moments. Loaded weights: 300/500/700.

Scale is clearly tiered:
- Display 1–2 (40/32px, 800) for marketing
- Heading 1–3 (26/24/22px, 700) for app chrome
- Subtitle 1–4 (20/18/16/14px, 600) for section labels
- Body R1–R4 + M1–M4 (16→12px, 400/500) for tables and forms
- Button 1–3 (14/12/11px, 600)
- Caption 1 (11px, 400, wider tracking 0.55px)

### Spacing

4px grid with specific steps: **2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 40, 48** (+ 56, 80 from legacy). Use `space-12` and `space-16` for component internals; `space-24`/`space-32` for page sections.

### Radii

**2, 4, 6, 8, 10, 12, 16, 20, 999**. Canonical usage:
- **4px** — buttons, chips (note: buttons are *tightly* rounded — not pills)
- **8px** — inputs, small cards
- **12px** — standard cards
- **16px** — large cards, modals, dialog surfaces
- **999px (pill)** — badges and avatars only

### Shadows

A five-step slate-tinted elevation scale (`rgba(15, 23, 42, 0.08–0.40)`). Shadows are **always slate-tinted**, never pure black, to sit correctly on the `#F8FAFC` surfaces. Use sparingly — the system leans on borders and background contrast for hierarchy rather than heavy elevation.

- `Shadow100` — subtle card lift
- `Shadow200` — floating panel (filter popover)
- `Shadow300` — dropdown, menu
- `Shadow400+` — modal / dialog

### Backgrounds & imagery

- **No full-bleed photography, no repeating patterns, no hand-drawn illustrations** in the product UI. Marketing surfaces may use flat illustration, but the dashboard is resolutely content‑first.
- Surface layering goes: `White (Surface0) → #F8FAFC (Normal) → #EAEFF5 (Strong) → #E2E8F0 (Heavy)`. The app shell is `#F8FAFC`, content cards sit on white.
- **No gradients** inside product chrome. Hero marketing sections may use flat blue fields; loaders use a single-color spinner.
- **Transparency & blur** — Backdrop blur of `4px` (`--blur-bg`) is used on overlay/scrim surfaces. Dim scrims: `rgba(0,0,0,0.3)` (standard modal), `rgba(0,0,0,0.5)` (fullscreen viewer).

### Animation

- Transitions are **all‑in one line**: `transition: all 0.2s ease-in-out;` — the codebase's own Button uses this exact value.
- **No bouncy springs.** Ease-out / ease-in-out over 120–200ms. Modals fade + subtle scale (0.98 → 1). Toasts slide up 12px + fade.
- **No celebratory animation** (no confetti, no mascot).

### Interaction states

- **Hover** — lighter surface for secondary/ghost buttons (`Surface100 → Surface200`); for primary, shift to `#1A1A1A` (Brand) or `--sb-primary-strong`.
- **Active/press** — no explicit scale‑down in the codebase; rely on a slight darken.
- **Focus** — 1px `--border-focus` (primary blue) ring on inputs; primary-tinted outline (`#0746CA` @ 24%) for buttons via box-shadow.
- **Disabled** — foreground `Gray400`/`LabelDisable`; background `Gray100`/`Surface200`; **no reduced opacity**, always explicit token swap.

### Borders

- Default border: `1px solid #E0E0E0` (`--border-default`).
- Subtle divider inside cards: `1px solid #EEEEEE` (`--border-subtle`).
- Input uses 1px, thickens to `Gray900` on focus (not a colored glow) in legacy; the new system uses `--sb-primary-normal`.

### Cards

The canonical card is:

```
background:    #FFFFFF;
border:        1px solid #E0E0E0;
border-radius: 12px;
box-shadow:    none;              /* or Shadow100 for pulled-forward cards */
padding:       24px;
```

Shadow is opt‑in, not default. Filled accent cards (status surfaces) use the light token of the status color + a matching border.

### Layout rules

- Dashboard shell: **left nav (LNB) 240px** (foldable to 64px via `LNBFold`/`LNBUnfold` icons) + top header 56–64px + scrollable content.
- Content max‑width usually ~1280px with `padding: 32px 40px`.
- Table rows: 48px default, 40px compact, 56px with avatar.

---

## Iconography

See [ICONOGRAPHY.md](./ICONOGRAPHY.md) for the full breakdown. Short version:

- **Primary library: [Phosphor Icons](https://phosphoricons.com)** — install via `npm install @phosphor-icons/react`.
- Import components directly: `import { MagnifyingGlass, CheckCircle } from '@phosphor-icons/react'`
- Size is freely customizable via `size` prop. Default color `currentColor` / `--fg-2` (`#293548`).
- Use `weight="regular"` (default) for UI chrome; `weight="fill"` for status and active states.
- `ICONOGRAPHY.md` contains the full mapping table from SentBiz custom icons (`Si*`) to Phosphor equivalents.
- **No inline SVG, no emoji, no unicode icon characters.**
- Logos in `assets/logos/` — rounded‑square **mark** (dark or light variant) + a `sentbiz` **wordmark** (white or dark). Logos are not replaceable with Phosphor.

---

## Index

```
SentBiz Design System
│
├ README.md                  ← you are here
├ ICONOGRAPHY.md             ← icon usage + inventory
├ SKILL.md                   ← agent skill manifest
├ colors_and_type.css        ← CSS variables + type utilities + @font-face
│
├ assets/
│ ├ logos/                   ← mark (dark/light) + wordmark (dark/white)
│ └ icons/                   ← 40 core SVG icons (outline + filled)
│
├ fonts/                     ← Pretendard OTF (all 9 weights, brand-supplied)
│
├ preview/                   ← design-system card specimens
│
├ ui_kits/
│ └ dashboard/               ← SentBiz Dashboard UI kit
│   ├ index.html             ← click-thru dashboard prototype
│   ├ README.md
│   └ *.jsx                  ← Sidebar, TopBar, DataTable, etc.
│
└ slides/                    ← (not present — no slide template supplied)
```

---

## Flags / known gaps

- **Pretendard is now local** — 9 weight OTF files live in `./fonts/` and are wired up via `@font-face` in `colors_and_type.css`. **GmarketSans is still CDN-loaded** (community mirror); drop local `.woff2` files and swap the rule if you need airtight offline fidelity.
- **Fonts served as OTF, not WOFF2.** OTF files are ~3× larger than WOFF2 — fine for design prototypes but convert to WOFF2 before shipping to production.
- **Figma libraries (Zeus / Gaia) were not accessible** from this environment. Visual foundations were derived from tokens + component source. If the Figma is reopened, double-check specifically: hero marketing layouts, illustration style, chart palette use.
- **Marketing site / mobile app** — this system covers the **dashboard** product only. If SentBiz has a separate marketing site or mobile app we should recreate, attach the codebase/design and a second UI kit can be added.
- No slide template was supplied, so `slides/` is intentionally absent.
