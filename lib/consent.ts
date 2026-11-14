/**
 * Cookie consent: what a visitor allowed, stored in a first-party cookie.
 *
 * Essential storage (the admin login session, security) is always on.
 * Optional categories default to off until the visitor chooses:
 *   preferences — remembering choices such as a dismissed ticket popup
 *   analytics   — usage measurement (none runs today; anything added later
 *                 must check `hasConsent('analytics')` before loading)
 *
 * Kept free of runtime imports so Node's test runner can load it directly.
 */

export type ConsentCategory = 'preferences' | 'analytics';

export type ConsentState = {
  /** Bumped when the categories change, so visitors are asked again. */
  version: number;
  preferences: boolean;
  analytics: boolean;
  /** When the choice was made, ms since epoch. */
  decidedAt: number;
};

export const CONSENT_COOKIE = 'cp_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
export const CONSENT_CHANGE_EVENT = 'cp:consent-change';
export const CONSENT_OPEN_EVENT = 'cp:open-cookie-settings';

/** Reads the consent cookie value; null when missing, malformed or out of date. */
export function parseConsent(value: string | null | undefined): ConsentState | null {
  if (!value) return null;
  try {
    const data = JSON.parse(decodeURIComponent(value)) as Partial<ConsentState>;
    if (data.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      preferences: data.preferences === true,
      analytics: data.analytics === true,
      decidedAt: typeof data.decidedAt === 'number' ? data.decidedAt : 0,
    };
  } catch {
    return null;
  }
}

export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function makeConsent(choices: Record<ConsentCategory, boolean>, now = Date.now()): ConsentState {
  return { version: CONSENT_VERSION, preferences: choices.preferences, analytics: choices.analytics, decidedAt: now };
}

/** Finds one cookie in a `document.cookie` string. */
export function readCookie(cookieString: string, name: string): string | null {
  for (const part of cookieString.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

// Browser helpers -----------------------------------------------------------

export function getConsent(): ConsentState | null {
  if (typeof document === 'undefined') return null;
  return parseConsent(readCookie(document.cookie, CONSENT_COOKIE));
}

export function hasConsent(category: ConsentCategory): boolean {
  return getConsent()?.[category] === true;
}

export function saveConsent(choices: Record<ConsentCategory, boolean>): ConsentState {
  const state = makeConsent(choices);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(state)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  // Withdrawn preferences: forget what was remembered under them.
  if (!state.preferences) {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('cp-ticket-invite-dismissed')) window.localStorage.removeItem(key);
      }
    } catch {
      // Storage can be unavailable (private mode); nothing to clear then.
    }
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: state }));
  return state;
}

/** Reopens the cookie settings panel from anywhere (footer, privacy page). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/**
 * Storage for "remember this" choices: kept across visits only with
 * preferences consent, otherwise for this browser session.
 */
export function preferenceStorage(): Storage | null {
  try {
    return hasConsent('preferences') ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}
