# Design Document: Loading Screen

## Overview

The Loading Screen is a full-viewport branded splash overlay rendered on every initial page visit to the Collector's Paradise site. It plays a Pokémon TCG-inspired "Card Storm" animation — 14 cards flying in from all screen edges, snapping to a stack, fanning into an arc, and revealing the logo — then exits with a cinematic fade-and-scale transition once the app is hydrated and a minimum display threshold has elapsed.

The component is a Next.js `'use client'` component mounted directly in `app/layout.tsx`, so it wraps every route without blocking server-side rendering or hydration of the underlying page. A `sessionStorage` flag ensures the overlay is skipped on return visits within the same browser session.

All visual effects — card storm, holographic shimmer, progress bar — are implemented in pure CSS (keyframes + custom properties) with a scoped CSS Module. The logo is rendered via the Next.js `Image` component from `/images/logo.png`. No other external assets are fetched; the component relies only on fonts and tokens already present in `globals.css`.

---

## Architecture

```
app/layout.tsx
  └── <LoadingScreen />          ← 'use client', position: fixed, z-index: 9999
        ├── .overlay              ← full-viewport #2E2E2E background
        │     ├── .cardStage      ← 14 animated card elements
        │     │     ├── .card.card1   ← --start-x, --start-y, --start-rotate, --start-rotateY
        │     │     ├── .card.card2
        │     │     │   ...
        │     │     └── .card.card14
        │     ├── .logoWrap       ← fades in during Phase 3
        │     │     └── <Image>   ← /images/logo.png, ~180px wide
        │     └── .progressWrap
        │           ├── .progressLabel   ← "LOADING…" / timeout fallback
        │           └── .progressTrack
        │                 └── .progressFill  ← width driven by state
        └── aria-live region (sr-only)
```

### State Machine

```
IDLE (sessionStorage flag set)
  → render nothing

LOADING
  → overlay visible, cards animating, progress ticking
  → on (readyState + threshold elapsed): → EXITING

EXITING
  → progress fills to 100%, exit CSS class applied
  → on animationend: → DONE

DONE
  → overlay unmounted from DOM
```

### Integration with layout.tsx

`LoadingScreen` is added as the first child inside `<body>` in `app/layout.tsx`. Because it uses `position: fixed` and `z-index: 9999`, it visually covers the page without affecting document flow or blocking hydration of sibling components.

```tsx
// app/layout.tsx (after change)
<body>
  <LoadingScreen />
  <SmoothScroll>
    {children}
    <ChatWidget />
  </SmoothScroll>
</body>
```

---

## Components and Interfaces

### `LoadingScreen` (`components/LoadingScreen.tsx`)

**Props:** none — self-contained, reads session state internally.

**Key internal state:**

| State variable | Type | Purpose |
|---|---|---|
| `visible` | `boolean` | Whether the overlay is in the DOM |
| `exiting` | `boolean` | Whether the exit animation CSS class is active |
| `progress` | `number` (0–100) | Current progress bar fill percentage |
| `timedOut` | `boolean` | Whether 8 s elapsed without ready state |

**Card configuration:**

14 card elements are rendered. Each receives inline CSS custom properties (`--start-x`, `--start-y`, `--start-rotate`, `--start-rotateY`, `--storm-delay`, `--fan-x`, `--fan-rotate`) that encode their unique entry position, travel angle, and fan destination. These values are defined as a static array in the component file — no runtime randomisation — so the animation is deterministic and SSR-safe.

**Lifecycle:**

1. On mount: check `sessionStorage.getItem('cp_loaded')`. If set → `visible = false`, return early.
2. Start a `1500 ms` minimum-display timer and an `8000 ms` timeout timer.
3. Listen for `document.readyState === 'complete'` (via `readystatechange` event) and/or `window.load`.
4. When both ready state and minimum timer have fired: animate progress to 100 %, then set `exiting = true`.
5. On `transitionend` of the overlay: set `visible = false`, write `sessionStorage.setItem('cp_loaded', '1')`.

### `LoadingScreen.module.css`

All animation keyframes and component styles live in a single CSS Module file co-located with the component. This keeps the bundle self-contained and avoids polluting `globals.css`.

---

## Data Models

No server data is involved. The only persistent state is a single `sessionStorage` key:

| Key | Value | Lifetime |
|---|---|---|
| `cp_loaded` | `'1'` | Browser session (cleared on tab close) |

Progress is modelled as a plain integer 0–100 driven by a `setInterval` that increments at a rate calibrated to reach ~90 % by the time a typical page load completes, then jumps to 100 % when ready state fires.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Minimum display threshold is always respected

*For any* time `T` at which the site reaches Ready_State where `T < 1500ms`, the Loading_Screen overlay SHALL still be visible at time `T` and SHALL NOT begin its Exit_Animation until at least `1500ms` have elapsed since mount.

**Validates: Requirements 1.4**

### Property 2: Progress always reaches 100 before exit begins

*For any* Ready_State signal, the `progress` value SHALL equal `100` before the `exiting` flag is set to `true` and the Exit_Animation CSS class is applied.

**Validates: Requirements 3.3**

### Property 3: Progress bar aria-valuenow always reflects current progress

*For any* progress value `P` in the range `[0, 100]`, the `role="progressbar"` element's `aria-valuenow` attribute SHALL equal `P` at the same render cycle in which `progress` state is `P`.

**Validates: Requirements 5.5**

### Property 4: Session flag suppresses overlay on return visits

*For any* browser session in which `sessionStorage` contains the key `cp_loaded`, mounting `LoadingScreen` SHALL result in the overlay not being rendered into the DOM (the component returns `null` immediately).

**Validates: Requirements 6.5**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `sessionStorage` unavailable (private browsing restrictions) | Wrap access in `try/catch`; if it throws, treat as no flag set (show the screen) and silently skip the write. |
| `readystatechange` never fires (e.g. SSR-only render) | The `8000 ms` timeout fires the fallback label; the screen will still exit once `window.load` fires or the user navigates. |
| Exit `transitionend` event never fires (e.g. `display:none` applied externally) | A `setTimeout` safety net of `600 ms` (slightly longer than `--transition-slow: 0.5s`) unmounts the overlay regardless. |
| Reduced motion preference | Detected via `window.matchMedia('(prefers-reduced-motion: reduce)')` on mount; stored in a ref to avoid re-renders. All keyframe animation classes are conditionally omitted; exit uses a 200 ms opacity-only transition. |

---

## Testing Strategy

### Unit / Component Tests (Vitest + React Testing Library)

Focus on specific examples and edge cases. Property-based tests handle broad input coverage.

- Render with no session flag → overlay is present in DOM.
- Render with `cp_loaded` session flag → overlay is absent (`null` returned).
- After `1500 ms` + ready state → `exiting` class applied, `aria-hidden="true"` set.
- After exit transition → component unmounted, `cp_loaded` written to `sessionStorage`.
- At `8000 ms` without ready state → fallback label text rendered.
- With `prefers-reduced-motion: reduce` mocked → no animation classes on cards, exit duration 200 ms.
- `aria-live` region present with correct announcement text on mount.
- `aria-label="Loading screen"` on root element.
- Progress bar has `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`.

### Property-Based Tests (fast-check)

Each property test runs a minimum of **100 iterations**.

Tag format: `Feature: loading-screen, Property {N}: {property_text}`

**Property 1 — Minimum display threshold**
Generate a random ready-state signal time `T` in `[0, 1499]` ms. Advance fake timers to `T`, fire ready state, assert overlay is still visible. Advance to `1500 ms`, assert exit begins.
`// Feature: loading-screen, Property 1: minimum display threshold is always respected`

**Property 2 — Progress reaches 100 before exit**
Generate a random ready-state signal time `T` in `[0, 10000]` ms. Fire ready state at `T`, assert `progress === 100` before `exiting === true` in the same flush.
`// Feature: loading-screen, Property 2: progress always reaches 100 before exit begins`

**Property 3 — aria-valuenow mirrors progress**
Generate a random integer `P` in `[0, 100]`. Set `progress` state to `P`, assert `aria-valuenow` attribute equals `String(P)`.
`// Feature: loading-screen, Property 3: progress bar aria-valuenow always reflects current progress`

**Property 4 — Session flag suppresses overlay**
Generate a random truthy string value for `cp_loaded` in `sessionStorage`. Mount `LoadingScreen`, assert the overlay element is not in the document.
`// Feature: loading-screen, Property 4: session flag suppresses overlay on return visits`

### CSS / Visual Verification

- Snapshot test of the component's rendered HTML structure (cards, progress bar, aria attributes).
- Manual / Storybook review of holographic shimmer gradient and card fan animation at 1×, 0.5×, and 2× speed.
- Manual verification of `prefers-reduced-motion` fallback using browser DevTools emulation.

---

## Animation Design

### Overview: Card Storm

The animation is divided into five phases, all sequenced via CSS `animation-delay` chaining — no JS timers are used for animation sequencing. The background is `#2E2E2E` (dark) for maximum contrast against the holographic cards and logo.

```
Phase 1: Card Storm      0 – 1200ms   14 cards fly in from all screen edges
Phase 2: Snap to Stack   1200 – 1600ms  Cards snap to center with elastic bounce
Phase 3: Fan + Logo      1600 – 2200ms  Stack fans into arc, logo rises from behind
Phase 4: Hold            2200ms → ready  Logo + fan hold, progress bar fills
Phase 5: Exit            on ready state  Cards fold back, logo scales up, overlay fades
```

---

### Phase 1 — Card Storm (`@keyframes cardStorm`, 0–1200ms)

14 card elements fly in from all screen edges (top, bottom, left, right, and all four corners). Each card has its own entry position and angle encoded as CSS custom properties set inline on the element:

| Custom property | Purpose |
|---|---|
| `--start-x` | Horizontal entry offset (e.g. `-120vw`, `80vw`) |
| `--start-y` | Vertical entry offset (e.g. `-100vh`, `60vh`) |
| `--start-rotate` | Initial Z rotation, range `-45deg` to `+45deg` |
| `--start-rotateY` | Initial Y rotation for the flip effect |
| `--storm-delay` | `animation-delay` value, range `0ms` to `400ms` |

A single `@keyframes cardStorm` definition drives all 14 cards; per-card variation comes entirely from the custom properties:

```css
@keyframes cardStorm {
  0% {
    transform: translateX(var(--start-x)) translateY(var(--start-y))
               rotateZ(var(--start-rotate)) rotateY(var(--start-rotateY));
    opacity: 0;
  }
  20% { opacity: 1; }
  100% {
    transform: translateX(0) translateY(0) rotateZ(0deg) rotateY(0deg);
    opacity: 1;
  }
}
```

Cards spin with combined `rotateZ` + `rotateY` as they travel, giving the impression of tumbling through the air.

---

### Phase 2 — Snap to Stack (`@keyframes cardSnap`, 1200–1600ms)

All cards snap to center with an elastic bounce:

```css
@keyframes cardSnap {
  0%   { transform: translateX(0) translateY(0) scale(1); }
  60%  { transform: translateX(0) translateY(0) scale(1.05); }
  100% { transform: translateX(0) translateY(0) scale(1); }
}
```

A yellow glow ring pulses around the stack during this phase using a pseudo-element on `.cardStage`:

```css
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0px 0px rgba(244, 197, 66, 0); }
  50%       { box-shadow: 0 0 32px 16px rgba(244, 197, 66, 0.6); }
}
```

---

### Phase 3 — Fan + Logo Reveal (`@keyframes cardFanOut`, 1600–2200ms)

The stacked cards fan out into a wide arc. Each card's final fan position is encoded via `--fan-rotate` and `--fan-x` custom properties, spread symmetrically left and right:

```css
@keyframes cardFanOut {
  0%   { transform: translateX(0) rotateZ(0deg); }
  100% { transform: translateX(var(--fan-x)) rotateZ(var(--fan-rotate)); }
}
```

Simultaneously, the logo rises from behind the card arc:

```css
@keyframes logoReveal {
  0%   { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

The `.logoWrap` element is centered above the fan arc, containing a Next.js `<Image>` component pointing to `/images/logo.png` at `~180px` wide. The progress bar fades in below the fan during this phase.

---

### Phase 4 — Hold (2200ms → ready state)

Logo and card fan hold their positions. Cards shimmer continuously via the holographic shimmer animation (see below). The progress bar fills as load progresses.

---

### Phase 5 — Exit

Triggered by React state (`.exiting` class) once ready state + minimum threshold are met:

1. Cards fold back to stack via a reverse fan animation.
2. Logo scales up slightly (`scale(1.05)`).
3. The entire overlay fades out with `scale(1.04)`.

```css
.overlay.exiting {
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
}

.overlay.exiting .card {
  animation: cardFoldBack 0.3s ease forwards;
}

.overlay.exiting .logoWrap {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

@keyframes cardFoldBack {
  0%   { transform: translateX(var(--fan-x)) rotateZ(var(--fan-rotate)); }
  100% { transform: translateX(0) rotateZ(0deg); }
}
```

---

### Holographic Shimmer (`@keyframes shimmer`)

An absolutely-positioned pseudo-element on each `.card` cycles a yellow → blue → white gradient continuously:

```css
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: linear-gradient(
    115deg,
    transparent 20%,
    rgba(244, 197, 66, 0.45) 35%,   /* --color-yellow */
    rgba(92, 143, 201, 0.55) 50%,   /* --color-blue-primary */
    rgba(255, 255, 255, 0.6) 60%,   /* --color-white */
    transparent 75%
  );
  background-size: 200% 200%;
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

### Card Styling

All 14 cards share base styles consistent with the Design_System:

```css
.card {
  position: absolute;
  width: 70px;
  height: 98px;                          /* standard TCG aspect ratio */
  border: 2px solid #2E2E2E;             /* --color-dark */
  border-radius: 12px;                   /* --radius-md */
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  transform-style: preserve-3d;
  will-change: transform, opacity;
}
```

---

### Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
    transform: none;
    opacity: 1;
  }
  .card::after {
    animation: none;
  }
  .logoWrap {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .overlay.exiting {
    opacity: 0;
    transform: none;
    transition: opacity 0.2s ease;
  }
}
```
