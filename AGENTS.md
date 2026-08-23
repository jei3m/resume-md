# AGENTS.md

Resume.md — a React Router 7 SPA that turns a Markdown resume into paginated
A4/Letter preview and PDF export.

## Commands
- `npm run dev` — dev server. Uses `react-router dev`, not plain `vite`.
- `npm run typecheck` — runs `react-router typegen && tsc`. Always run typegen
  first; bare `tsc` fails (missing generated `.react-router/types`).
- `npm run build` — `react-router build`.
- `npm run format` — Prettier over `**/*.{ts,tsx}` (prettier-plugin-tailwindcss).
  Run before committing.

## Stack / architecture
- React Router 7, SPA mode (`react-router.config.ts`: `ssr: false`). Single route
  `app/routes/home.tsx`, declared in `app/routes.ts`.
- React 19 + TypeScript.
- Tailwind CSS v4 via `@tailwindcss/vite`. All global styles/theme tokens live in
  `app/app.css` (`@import "tailwindcss"`, `@theme inline`). No `tailwind.config.js`.
- UI primitives (shadcn-style) in `app/components/ui`; feature components in
  `app/components/custom`.

## Gotchas
- Resume page-break measurement (`app/components/custom/resume-preview.tsx`):
  reads `.resume-content` children to split blocks across pages. Use
  `offsetTop`/`offsetHeight` (layout values), NOT `getBoundingClientRect()` —
  the preview is wrapped in `transform: scale(zoom)`, so getBoundingClientRect()
  returns zoom-scaled sizes and breaks become zoom-dependent. Cast
  `querySelector(...).children` to `HTMLElement[]` before reading `offsetTop`
  (`Element` has no `offsetTop` in TS).
- Preview centering: the preview pane is flex + `overflow-auto`. Do NOT center
  with flex `justify-center` (clips the off-screen left edge, makes horizontal
  scroll unreachable). Center via `margin-inline: auto` on `.resume-zoom-wrapper`.
- Resume text is persisted to `localStorage` key `open-resume-md`; "Export PDF"
  calls `window.print()` (print rules in `app/app.css` `@media print`, paper size
  via `--print-paper-size`).
