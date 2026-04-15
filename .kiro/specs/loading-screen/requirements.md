# Requirements Document

## Introduction

The Loading Screen feature provides a branded, full-screen splash experience shown to users while the Collector's Paradise website performs its initial load. The screen uses Pokémon TCG-inspired animations — card flips, card fans, and holographic shimmer effects — rendered entirely in CSS/JS to avoid heavy asset dependencies. Once the site is ready, the loading screen fades out and the main content becomes interactive. The experience must feel cohesive with the site's brutalist design system (bold outlines, yellow accents, Baloo/Montserrat typography) and must not block perceived performance beyond a minimum display threshold.

---

## Glossary

- **Loading_Screen**: The full-screen overlay component displayed during initial page load.
- **Splash_Animation**: The CSS/JS-driven card animation sequence shown inside the Loading_Screen.
- **Progress_Indicator**: The visual element that communicates load progress to the user.
- **Site**: The Collector's Paradise Next.js web application.
- **Ready_State**: The condition where the Next.js app has hydrated and all critical above-the-fold assets have loaded.
- **Dismiss_Threshold**: The minimum duration the Loading_Screen is displayed, regardless of how fast the Site reaches Ready_State.
- **Exit_Animation**: The transition sequence that removes the Loading_Screen from view once the Ready_State is reached and the Dismiss_Threshold has elapsed.
- **Reduced_Motion_Preference**: The operating system or browser setting `prefers-reduced-motion: reduce`.
- **Design_System**: The shared visual tokens defined in `globals.css` — colors, fonts, spacing, border radii, and transitions.

---

## Requirements

### Requirement 1: Loading Screen Display on Initial Load

**User Story:** As a visitor, I want to see a branded loading screen when I first open the site, so that I have an engaging experience while the page loads rather than a blank or partially rendered screen.

#### Acceptance Criteria

1. WHEN the Site begins its initial page load, THE Loading_Screen SHALL render as a full-viewport overlay before any main page content is visible.
2. THE Loading_Screen SHALL use `--color-cream` (`#F3EFE6`) as its background color to match the site's Design_System.
3. THE Loading_Screen SHALL display the Collector's Paradise logo or wordmark centered on screen using the `Baloo` font family.
4. THE Loading_Screen SHALL remain visible for a minimum Dismiss_Threshold of 1500ms, even if the Site reaches Ready_State sooner.
5. WHEN the Site reaches Ready_State AND the Dismiss_Threshold has elapsed, THE Loading_Screen SHALL begin its Exit_Animation.
6. WHEN the Exit_Animation completes, THE Loading_Screen SHALL be removed from the DOM so it no longer affects layout or accessibility.

---

### Requirement 2: Pokémon TCG Card Animation

**User Story:** As a visitor, I want to see a Pokémon TCG-themed animation during the loading screen, so that the experience feels on-brand and exciting before I enter the site.

#### Acceptance Criteria

1. THE Splash_Animation SHALL display a sequence of stylised trading card shapes rendered using CSS and inline SVG — no external image assets are required for the animation to function.
2. THE Splash_Animation SHALL animate at least three card elements using a fan-spread or flip sequence that evokes the feel of drawing cards from a deck.
3. THE Splash_Animation SHALL apply a holographic shimmer effect to card surfaces using a CSS gradient animation cycling through `--color-yellow` (`#F4C542`), `--color-blue-primary` (`#5C8FC9`), and `--color-white` (`#FFFFFF`).
4. THE Splash_Animation SHALL use card border styling consistent with the Design_System: `2px solid --color-dark` (`#2E2E2E`) with `--radius-md` (`12px`) border radius.
5. THE Splash_Animation SHALL complete one full animation cycle within 2000ms so it does not outlast a typical fast load.
6. WHEN the Exit_Animation begins, THE Splash_Animation SHALL freeze or gracefully conclude its current cycle rather than cutting off abruptly.

---

### Requirement 3: Progress Indication

**User Story:** As a visitor, I want to see some indication that the site is loading, so that I know the page is working and I am not stuck on a broken screen.

#### Acceptance Criteria

1. THE Loading_Screen SHALL display a Progress_Indicator that is visible throughout the loading period.
2. THE Progress_Indicator SHALL use a design consistent with the Design_System — specifically a pill-shaped bar (`--radius-pill`) with `--color-yellow` fill on a `--color-dark` track, bordered with `2px solid --color-dark`.
3. WHEN the Site reaches Ready_State, THE Progress_Indicator SHALL animate to 100% fill before the Exit_Animation begins.
4. THE Progress_Indicator SHALL display a short uppercase label in `Montserrat` font (e.g., "LOADING…") positioned above or below the bar.
5. IF the Site has not reached Ready_State within 8000ms, THEN THE Loading_Screen SHALL display a fallback message reading "TAKING LONGER THAN EXPECTED…" in place of the standard label, while continuing to wait for Ready_State.

---

### Requirement 4: Exit Transition

**User Story:** As a visitor, I want the loading screen to disappear smoothly when the site is ready, so that the transition into the main content feels polished and intentional.

#### Acceptance Criteria

1. WHEN the Exit_Animation is triggered, THE Loading_Screen SHALL fade out using a CSS opacity transition over 400ms.
2. WHEN the Exit_Animation is triggered, THE Loading_Screen SHALL simultaneously scale up slightly (to `scale(1.04)`) to create a cinematic reveal effect.
3. THE Exit_Animation SHALL use the `--transition-slow` timing token (`0.5s ease`) as its maximum duration.
4. WHEN the Exit_Animation completes, THE Loading_Screen SHALL have `display: none` or be unmounted so it is not reachable by keyboard navigation or screen readers.

---

### Requirement 5: Accessibility and Reduced Motion

**User Story:** As a visitor with motion sensitivity, I want the loading screen to respect my system preferences, so that I am not exposed to animations that could cause discomfort.

#### Acceptance Criteria

1. WHEN the Reduced_Motion_Preference is active, THE Loading_Screen SHALL display a static version of the branded screen with no keyframe animations or transitions on the Splash_Animation.
2. WHEN the Reduced_Motion_Preference is active, THE Exit_Animation SHALL use a simple opacity fade of 200ms instead of the scale-and-fade sequence.
3. THE Loading_Screen SHALL include an `aria-live="polite"` region that announces "Loading Collector's Paradise" to screen readers when the Loading_Screen mounts.
4. THE Loading_Screen SHALL include an `aria-label` of "Loading screen" on its root element.
5. THE Progress_Indicator SHALL expose its current state via `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` attributes kept up to date throughout the loading period.

---

### Requirement 6: Performance and Integration Constraints

**User Story:** As a developer, I want the loading screen to integrate cleanly with the Next.js app router and not degrade Core Web Vitals, so that the feature ships without harming SEO or performance scores.

#### Acceptance Criteria

1. THE Loading_Screen SHALL be implemented as a client component rendered inside the root layout so it is present on every initial page visit.
2. THE Loading_Screen SHALL NOT block the Next.js hydration process — it SHALL overlay the page visually while hydration proceeds underneath.
3. THE Loading_Screen SHALL NOT load any external network resources (fonts, images, scripts) that are not already part of the Site's existing asset bundle.
4. THE Loading_Screen SHALL be hidden from search engine crawlers by setting `aria-hidden="true"` on the overlay when the Exit_Animation completes, prior to DOM removal.
5. WHEN the Loading_Screen has been shown once per browser session, THE Loading_Screen SHALL NOT be shown again on subsequent same-session navigations within the Site.
6. THE Loading_Screen component bundle size SHALL NOT exceed 15KB (uncompressed JS + CSS) to avoid measurable impact on Time to Interactive.
