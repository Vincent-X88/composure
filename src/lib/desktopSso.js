import { supabase } from './supabase';

const SSO_KEYS = ['sb_at', 'sb_rt', 'sb_dest'];

/**
 * If the URL fragment carries a desktop SSO payload (sb_at + sb_rt), hydrate
 * the Supabase client with that session so the user appears signed in
 * immediately, then strip the tokens out of the address bar / history.
 *
 * The optional `sb_dest` value is preserved as the new fragment (e.g.
 * `#pricing`) and we trigger a manual scroll to that anchor since
 * history.replaceState doesn't fire the browser's hash-anchor behaviour.
 *
 * Returns true if a session was applied. Should be awaited before the regular
 * auth bootstrap reads supabase.auth.getSession() so the first render already
 * sees the signed-in user.
 */
export async function consumeDesktopSso() {
  if (!supabase || typeof window === 'undefined') {
    return false;
  }

  const hash = window.location.hash;
  if (!hash || hash.length < 2) {
    return false;
  }

  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('sb_at');
  const refreshToken = params.get('sb_rt');

  if (!accessToken || !refreshToken) {
    return false;
  }

  try {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error('[desktopSso] setSession failed:', error);
  }

  // Strip the SSO tokens out of the URL so they don't linger in the address
  // bar, browser history, or any pasted/shared link. Preserve any unrelated
  // fragment params and surface the desired destination as the new anchor.
  const dest = params.get('sb_dest');
  SSO_KEYS.forEach((key) => params.delete(key));
  const remaining = params.toString();
  const newHash = dest
    ? remaining
      ? `#${dest}&${remaining}`
      : `#${dest}`
    : remaining
      ? `#${remaining}`
      : '';

  const newUrl = `${window.location.pathname}${window.location.search}${newHash}`;
  window.history.replaceState(null, '', newUrl);

  // history.replaceState doesn't trigger anchor scrolling, so do it ourselves
  // once the page has had a chance to render the target section.
  if (dest) {
    requestAnimationFrame(() => {
      const target = document.getElementById(dest);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  return true;
}
