/**
 * ACE GLOBAL LOGISTICS — CENTRALIZED API CONFIGURATION & LOCAL PORT COORDINATOR
 * 
 * Automatically discovers, caches, and synchronizes with the active Express backend port
 * (5000, 5001, 5002, etc.) during local development, while preserving strict production
 * isolation for Vercel -> Render deployments.
 */

// In-memory cache for the discovered local backend origin
let activeLocalApiBase = null;
let resolvePromise = null;

/**
 * Checks whether the application is running in a production environment.
 * In the browser, any localhost / 127.0.0.1 domain is strictly treated as local development.
 * In SSR / Node.js, Vercel deployments (VERCEL=1) are strictly treated as production.
 */
export const isProduction = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Localhost, 127.0.0.1, or IPv6 loopback is always local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.local')) {
      return false;
    }
    // Any other domain (e.g. *.vercel.app, ace-logistics.com) is production
    return true;
  }
  // Server-side (Node.js / SSR): Vercel sets VERCEL="1"
  if (process.env.VERCEL === '1') {
    return true;
  }
  return process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_DISCOVERY;
};

/**
 * Synchronously retrieves the current base API URL without trailing slashes.
 * In production: strictly returns the deployed Render backend URL.
 * In local development: returns the actively discovered port (or cached / fallback).
 */
export const getApiBase = () => {
  // 1. Production strictly targets the configured Render backend
  if (isProduction()) {
    return (process.env.NEXT_PUBLIC_API_URL || 'https://ace-global-logistics.onrender.com').replace(/\/+$/, '');
  }

  // 2. Local development: in-memory cache
  if (activeLocalApiBase) {
    return activeLocalApiBase;
  }

  // 3. Local development: check browser sessionStorage if available
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('ace_active_api_base');
      if (stored && stored.startsWith('http')) {
        activeLocalApiBase = stored.replace(/\/+$/, '');
        return activeLocalApiBase;
      }
    } catch {}
  }

  // 4. Fallback: if NEXT_PUBLIC_API_URL explicitly specifies localhost port, use it, else default to 5000
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
};

/**
 * Manually or programmatically sets the active local API base URL.
 */
export const setApiBase = (url) => {
  if (!url) return;
  const cleanUrl = url.replace(/\/+$/, '');
  activeLocalApiBase = cleanUrl;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('ace_active_api_base', cleanUrl);
      window.dispatchEvent(new CustomEvent('ace_api_base_changed', { detail: { url: cleanUrl } }));
    } catch {}
  }
  return cleanUrl;
};

/**
 * Asynchronously discovers and verifies the active local backend port.
 * 1. Checks the Next.js dev route (/api/dev/backend-port) which inspects descriptors and scans ports.
 * 2. Checks static descriptor (/.active-port.json) and verifies health.
 * 3. Fast probe across standard ports (5000-5005) as client fallback.
 */
export const resolveApiBase = async ({ force = false } = {}) => {
  if (isProduction()) {
    return (process.env.NEXT_PUBLIC_API_URL || 'https://ace-global-logistics.onrender.com').replace(/\/+$/, '');
  }

  if (activeLocalApiBase && !force) {
    return activeLocalApiBase;
  }

  if (resolvePromise && !force) {
    return resolvePromise;
  }

  resolvePromise = (async () => {
    if (typeof window !== 'undefined') {
      // Step 1: Query Next.js dev API route which verifies health & scans ports 5000-5020
      try {
        const res = await fetch(`/api/dev/backend-port?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            setApiBase(data.url);
            return activeLocalApiBase;
          }
        }
      } catch {}

      // Step 2: In case Next.js dev API route is not available (e.g. running Vite), check static descriptor
      try {
        const res = await fetch(`/.active-port.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            try {
              const ping = await fetch(`${data.url}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout ? AbortSignal.timeout(500) : undefined
              });
              if (ping.ok) {
                setApiBase(data.url);
                return activeLocalApiBase;
              }
            } catch {}
          }
        }
      } catch {}

      // Step 3: Fast browser-side probe across common ports as fallback
      for (const p of [5000, 5001, 5002, 5003, 5004, 5005]) {
        try {
          const ping = await fetch(`http://localhost:${p}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout ? AbortSignal.timeout(300) : undefined
          });
          if (ping.ok) {
            setApiBase(`http://localhost:${p}`);
            return activeLocalApiBase;
          }
        } catch {}
      }
    }

    return getApiBase();
  })();

  try {
    return await resolvePromise;
  } finally {
    resolvePromise = null;
  }
};

/**
 * Resilient fetch wrapper for API endpoints.
 * Automatically resolves the backend port if not yet known,
 * prepends the correct base URL, and retries once with auto-rediscovery
 * if a network failure occurs (e.g., local backend switched ports).
 */
export const apiFetch = async (endpoint, options = {}) => {
  // If running locally and port is not yet resolved, resolve before sending
  if (!isProduction() && !activeLocalApiBase) {
    try {
      await resolveApiBase();
    } catch {}
  }

  const isRelative = typeof endpoint === 'string' && endpoint.startsWith('/api/');
  let targetUrl = endpoint;

  if (isRelative) {
    targetUrl = `${getApiBase()}${endpoint}`;
  } else if (typeof endpoint === 'string' && !isProduction() && endpoint.startsWith('http://localhost:')) {
    const activeBase = getApiBase();
    targetUrl = endpoint.replace(/^http:\/\/localhost:\d+/, activeBase);
  }

  try {
    return await fetch(targetUrl, options);
  } catch (err) {
    // If in local development and network error occurred (e.g. backend restarted or switched ports)
    if (!isProduction() && typeof window !== 'undefined') {
      console.warn(`⚠️ Network call failed to ${targetUrl}. Attempting automatic port re-discovery...`);
      try {
        const refreshedBase = await resolveApiBase({ force: true });
        let retryUrl = targetUrl;
        if (isRelative) {
          retryUrl = `${refreshedBase}${endpoint}`;
        } else if (typeof endpoint === 'string' && endpoint.includes('localhost:')) {
          retryUrl = endpoint.replace(/http:\/\/localhost:\d+/, refreshedBase);
        }
        console.log(`🔄 Retrying request with discovered backend at: ${retryUrl}`);
        return await fetch(retryUrl, options);
      } catch (retryErr) {
        throw retryErr;
      }
    }
    throw err;
  }
};

// Automatic background port re-discovery when switching back to browser tab
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    if (!isProduction()) {
      resolveApiBase({ force: true }).catch(() => {});
    }
  });
}
