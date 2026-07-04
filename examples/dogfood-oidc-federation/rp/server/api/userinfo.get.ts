// RP `/api/userinfo` endpoint — returns the userinfo stored on the session
// cookie during `/api/callback`. The index page hits this after a successful
// sign-in to render the "signed in as" panel.

interface UserinfoResponse {
  sub: string;
  name?: string;
  email?: string;
}

export default defineEventHandler((event) => {
  const raw = getCookie(event, 'rp_userinfo');
  if (raw === undefined) {
    throw createError({ statusCode: 401, statusMessage: 'no active RP session' });
  }
  try {
    return JSON.parse(raw) as UserinfoResponse;
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'rp_userinfo cookie corrupted' });
  }
});
