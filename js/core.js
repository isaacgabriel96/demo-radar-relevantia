/**
 * core.js — Radar Relevantia shared utilities
 *
 * Include this before any page-specific script:
 *   <script src="/js/core.js"></script>
 *
 * Provides: SUPABASE_URL, SUPABASE_KEY, showToast, getSession,
 *           clearSession, requireAuth, getCurrentUser, sbFetch
 */

const SUPABASE_URL = 'https://bzckerazidgrkbpgqqee.supabase.co';
const SUPABASE_KEY = 'sb_publishable_23vtXVo1wT1gFhNaOw8fpA_M2AwRbgR';

// localStorage key mapping — DO NOT rename these keys, they would log out existing users.
// See GLOSSARY.md for meaning of each key.
const SESSION_KEYS = {
  rightsholder: 'sb_detentor_session',   // detentor = rights holder
  brand:        'sb_marca_session',       // marca = brand
  admin:        'sb_admin_session'
};

/**
 * Display a toast notification at the bottom of the page.
 * @param {string} msg   — message text
 * @param {string} type  — 'success' | 'error' | '' (neutral)
 */
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

/**
 * Read a stored session from localStorage.
 * @param {'brand'|'rightsholder'|'admin'} role
 * @returns {object|null} parsed session object, or null if missing/expired
 */
function getSession(role) {
  const key = SESSION_KEYS[role];
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && now >= session.expires_at) {
      localStorage.removeItem(key);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Remove a stored session from localStorage.
 * @param {'brand'|'rightsholder'|'admin'} role
 */
function clearSession(role) {
  const key = SESSION_KEYS[role];
  if (key) localStorage.removeItem(key);
}

/**
 * Detect current user's role from any active session.
 * @returns {'brand'|'rightsholder'|'admin'|null}
 */
function getCurrentRole() {
  if (getSession('brand'))        return 'brand';
  if (getSession('rightsholder')) return 'rightsholder';
  if (getSession('admin'))        return 'admin';
  return null;
}

/**
 * Return the current user's session data (any role).
 * @returns {object|null}
 */
function getCurrentUser() {
  return getSession('brand') || getSession('rightsholder') || getSession('admin') || null;
}

/**
 * Guard a page: redirect to login if no valid session for the given role.
 * Call this in init() before rendering anything.
 * @param {'brand'|'rightsholder'|'admin'} role
 * @param {string} [redirectTo='login.html']
 */
function requireAuth(role, redirectTo = 'login.html') {
  if (!getSession(role)) {
    window.location.href = redirectTo;
  }
}

/**
 * Authenticated fetch wrapper for Supabase REST API.
 * Automatically includes apikey and Authorization headers.
 * @param {string} path   — path after SUPABASE_URL (e.g. '/rest/v1/table_name')
 * @param {string} token  — access_token from session
 * @param {object} [opts] — fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
function sbFetch(path, token, opts = {}) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  return fetch(SUPABASE_URL + path, { ...opts, headers });
}
