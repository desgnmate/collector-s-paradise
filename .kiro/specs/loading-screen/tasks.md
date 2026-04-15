# Implementation Plan: Loading Screen

## Overview

Three-file implementation: the CSS Module with all keyframes and styles, the client component with all logic, and a one-line update to `app/layout.tsx` to mount it.

## Tasks

- [x] 1. Create `components/LoadingScreen.module.css`
  - Define `.overlay` (fixed, full-viewport, `--color-cream` background, `z-index: 9999`)
  - Define `.wordmark` (Baloo font, centered)
  - Define `.cardStage`, `.card`, `.card1`, `.card2`, `.card3` with inline CSS custom properties `--fan-rotate`, `--fan-x`, `--fan-y` per card
  - Define `@keyframes cardFan` (fan-spread + `rotateY` flip sequence, 1800 ms)
  - Define `.shimmer` pseudo-element with holographic gradient and `@keyframes shimmer` (1.8 s infinite)
  - Define `.progressWrap`, `.progressLabel`, `.progressTrack`, `.progressFill` (pill shape, `--color-yellow` fill, `--color-dark` track, `2px solid --color-dark` border)
  - Define `.exiting` modifier: `opacity: 0; transform: scale(1.04); transition: opacity 0.4s ease, transform 0.4s ease; pointer-events: none`
  - Define `@media (prefers-reduced-motion: reduce)` block: disable card and shimmer animations, override `.exiting` to `opacity: 0; transform: none; transition: opacity 0.2s ease`
  - _Requirements: 1.2, 2.1, 2.3, 2.4, 2.5, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 2. Create `components/LoadingScreen.tsx`
  - [x] 2.1 Scaffold the component shell
    - Add `'use client'` directive
    - Import CSS Module and React hooks (`useState`, `useEffect`, `useRef`)
    - Define state: `visible`, `exiting`, `progress`, `timedOut`
    - Return `null` when `!visible`; otherwise render overlay JSX with `aria-label="Loading screen"`, `role="progressbar"` on the fill element, and an `aria-live="polite"` sr-only region announcing "Loading Collector's Paradise"
    - _Requirements: 1.1, 5.3, 5.4, 5.5, 6.1_

  - [x] 2.2 Implement session storage guard
    - On mount, wrap `sessionStorage.getItem('cp_loaded')` in `try/catch`; if flag is set, set `visible = false` and return early
    - On successful exit, wrap `sessionStorage.setItem('cp_loaded', '1')` in `try/catch` and silently ignore errors
    - _Requirements: 6.5_

  - [x] 2.3 Implement reduced-motion detection
    - On mount, read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` into a ref
    - Use the ref to conditionally omit animation class names from cards and to choose exit transition duration (200 ms vs 400 ms)
    - _Requirements: 5.1, 5.2_

  - [x] 2.4 Implement progress ticker and ready-state logic
    - Start a `setInterval` that increments `progress` toward ~90 % at a rate that reaches 90 % around 1400 ms
    - Listen for `document.readyState === 'complete'` via `readystatechange` and `window` `load` event
    - Start a 1500 ms minimum-display timer and an 8000 ms timeout timer (sets `timedOut = true` for fallback label)
    - When both ready state and minimum timer have fired: clear interval, set `progress` to 100, then set `exiting = true`
    - _Requirements: 1.4, 1.5, 3.1, 3.3, 3.5_

  - [x] 2.5 Implement exit and unmount logic
    - On `transitionend` of the overlay element, set `visible = false` and write the session flag
    - Add a 600 ms `setTimeout` safety net that also sets `visible = false` in case `transitionend` never fires
    - Before unmounting, set `aria-hidden="true"` on the overlay element
    - _Requirements: 1.6, 4.4, 6.4_

  - [ ]* 2.6 Write property test: minimum display threshold (Property 1)
    - **Property 1: Minimum display threshold is always respected**
    - Generate ready-state signal time `T` in `[0, 1499]` ms with fast-check; advance fake timers to `T`, assert overlay still visible; advance to 1500 ms, assert exit begins
    - **Validates: Requirements 1.4**

  - [ ]* 2.7 Write property test: progress reaches 100 before exit (Property 2)
    - **Property 2: Progress always reaches 100 before exit begins**
    - Generate ready-state signal time `T` in `[0, 10000]` ms; fire ready state at `T`, assert `progress === 100` before `exiting === true`
    - **Validates: Requirements 3.3**

  - [ ]* 2.8 Write property test: aria-valuenow mirrors progress (Property 3)
    - **Property 3: Progress bar aria-valuenow always reflects current progress**
    - Generate integer `P` in `[0, 100]`; set `progress` state to `P`, assert `aria-valuenow` attribute equals `String(P)`
    - **Validates: Requirements 5.5**

  - [ ]* 2.9 Write property test: session flag suppresses overlay (Property 4)
    - **Property 4: Session flag suppresses overlay on return visits**
    - Generate a random truthy string for `cp_loaded` in `sessionStorage`; mount `LoadingScreen`, assert overlay element is not in the document
    - **Validates: Requirements 6.5**

  - [ ]* 2.10 Write unit tests for LoadingScreen
    - No session flag → overlay present in DOM with correct aria attributes
    - `cp_loaded` set → component returns null
    - After 1500 ms + ready state → `.exiting` class applied, `aria-hidden="true"` set
    - After exit transition → component unmounted, `cp_loaded` written
    - At 8000 ms without ready state → fallback label "TAKING LONGER THAN EXPECTED…" rendered
    - `prefers-reduced-motion: reduce` mocked → no animation classes on cards
    - _Requirements: 1.1, 1.4, 1.6, 3.5, 5.1, 6.5_

- [x] 3. Checkpoint — ensure the component renders and types check cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update `app/layout.tsx` to mount `<LoadingScreen />`
  - Import `LoadingScreen` from `@/components/LoadingScreen`
  - Add `<LoadingScreen />` as the first child inside `<body>`, before `<SmoothScroll>`
  - _Requirements: 6.1, 6.2_

- [x] 5. Final checkpoint — full integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests require `fast-check` and Vitest fake timers
- The CSS Module is intentionally created first so the component can import it immediately in task 2
- The 600 ms `transitionend` safety net (task 2.5) must be slightly longer than the 0.5 s `--transition-slow` token
