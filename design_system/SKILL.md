---
name: sentbiz-design
description: Use this skill to generate well-branded interfaces and assets for SentBiz (SENTBE), the Korean cross-border B2B payments and FX platform — dashboards, admin tools, fintech prototypes, marketing moments. Contains colors, typography (Pretendard + GmarketSans), Pretendard OTF font files, logos, 40 core SVG icons, component specimens, and a full click-thru dashboard UI kit (Sidebar, TopBar, DataTable, Drawer, Modal, Button, Badge, Input).
user-invocable: true
---

# SentBiz design skill

Read the `README.md` file within this skill first — it's the source of truth for tone, visual foundations, and iconography. Then explore:

- `colors_and_type.css` — CSS variables + utility classes. Import this in every HTML artifact.
- `ICONOGRAPHY.md` — icon inventory, usage rules, and how to switch between outline/filled.
- `assets/logos/`, `assets/icons/` — real brand assets. **Copy them, don't redraw them.** Never generate SVG logos or icon lookalikes.
- `fonts/Pretendard-*.otf` — the brand typeface. `@font-face` rules already point to these in `colors_and_type.css`.
- `preview/*.html` — visual specimens for type, colors, spacing, shadows, components — useful as reference when composing layouts.
- `ui_kits/dashboard/` — the authoritative recreation of the SentBiz operator dashboard. When prototyping any SentBiz screen, **start here**: read the JSX components and lift their exact patterns (sidebar shape, table row height, badge variants, button sizing). Do not invent alternative treatments.

## Working with this brand

- Primary typeface is **Pretendard** (Korean-first). Use `var(--sb-font-sans)`.
- Display / marketing hero type is **GmarketSans** — reserve it for hero moments, not body UI.
- Anchor color is **`--sb-primary-normal` (#0746CA)**. Use sparingly on CTAs, active nav, and single-accent moments. The surface palette is slate-based; most of the UI is white/slate with one or two blue accents per screen.
- Radii are modest (`Corner8`/`Corner12` most common). Shadows are subtle and slate-tinted, not black. Cards carry a 1px `#E2E8F0` border more often than a drop shadow.
- Copy is direct, operator-oriented, mildly formal ("Review queue", "Settle 4 items", "Action needed"). Avoid exclamations and startup fluff. Sentence case. No emoji in product surfaces.
- Icons use **Phosphor Icons** (`@phosphor-icons/react`). Size is freely customizable via the `size` prop — match the design. Color `#293548` (`--fg-2`) as default. Use `weight="fill"` for status and active-nav states. Never use emoji or inline SVG as icon substitutes. See `ICONOGRAPHY.md` for the full SentBiz → Phosphor mapping table.

## Output modes

If the user asks for a **visual artifact** (slides, mocks, throwaway prototypes, design explorations), copy the needed fonts/logos/icons into the artifact directory, reference `colors_and_type.css`, and output static HTML. Use the `ui_kits/dashboard/` components as your source of patterns.

If the user asks for **production code**, read the rules in this skill to become an expert in the brand, then apply them directly to their codebase. The component implementations here are prototype-grade (plain JSX, inline styles) — the real codebase uses Emotion + a `#tokens` package; match their conventions, not mine.

If invoked without clear guidance, ask the user what they want to build, what surface it's for (dashboard, marketing, mobile), and whether fidelity is prototype-grade or production. Then act as an expert SentBiz designer and deliver either HTML artifacts or production code accordingly.
