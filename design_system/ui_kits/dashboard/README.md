# SentBiz Dashboard — UI Kit

A high-fidelity recreation of the SentBiz operator dashboard, drawn from the `design-system/` codebase tokens and components.

## What's here

- `index.html` — click-thru prototype. Left nav, top bar, a Transactions screen with filter chips, a data table and row drawer, plus a Settle modal.
- `Sidebar.jsx` — LNB with foldable state, active nav item treatment.
- `TopBar.jsx` — breadcrumbs, search, notifications, avatar.
- `PageHeader.jsx` — screen title + primary/secondary actions.
- `Filters.jsx` — chip row + date range placeholder.
- `DataTable.jsx` — striped-not header, 48px rows, status badges, right-aligned amounts.
- `Drawer.jsx` — side drawer for row detail + Approve/Reject.
- `Modal.jsx` — centered dialog with Pretendard heading + split buttons.
- `Primitives.jsx` — Button, Badge, Input, Avatar, Icon.

## Covered screens

1. **Dashboard** (default) — three KPI cards + a recent activity list.
2. **Transactions** — table + filter chips + row drawer.
3. **Settlements** — same table pattern with a Settle action that opens the modal.

## Not covered

- Login / onboarding
- FX rate management, counterparty CRUD (would reuse the same primitives)
- Charts — the codebase doesn't ship a chart component; left as placeholder boxes with accent color hints.
- Real data fetching, permissions, i18n — the kit is pure visual/interaction fidelity.
