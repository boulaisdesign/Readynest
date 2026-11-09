// Google sign-in: verify the ID token the "Sign in with Google" button gives the page,
// then keep the tenant signed in with our own signed, HttpOnly session cookie.

const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];
export const SESSION_DAYS = 30;
const enc = new TextEncoder();

const b64urlToBytes = (s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const bytesToB64url = (b) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decodeJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

// Google's public keys, kept in memory for an hour.
let certs = { at: 0, keys: [] };
async function googleKeys(force = false) {
  if (!force && Date.now() - certs.at < 3600e3 && certs.keys.length) return certs.keys;
  const r = await fetch(CERTS_URL);
  if (!r.ok) throw new Error("Couldn't reach Google");
  certs = { at: Date.now(), keys: (await r.json()).keys || [] };
  return certs.keys;
}
export const _resetCerts = () => (certs = { at: 0, keys: [] });

export const allowedEmails = (env) =>
  String(env.ALLOWED_EMAILS || "")
    .split(/[\s,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Returns the verified, allowed email from a Google ID token, or throws. */
export async function verifyGoogleToken(idToken, env) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new Error("Sign-in failed");
  const [h, p, sig] = parts;
  const header = decodeJson(h);
  if (header.alg !== "RS256") throw new Error("Sign-in failed");

  let jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid); // keys rotated
  if (!jwk) throw new Error("Sign-in failed");

  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
  );
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(sig), enc.encode(`${h}.${p}`));
  if (!ok) throw new Error("Sign-in failed");

  const c = decodeJson(p);
  const now = Date.now() / 1000;
  const clientId = env.SIGNIN_CLIENT_ID || env.CLIENT_ID;
  if (!ISSUERS.includes(c.iss) || c.aud !== clientId || !(c.exp > now) || (c.iat && c.iat > now + 300)) {
    throw new Error("Sign-in failed");
  }
  const email = String(c.email || "").toLowerCase();
  if (!email || c.email_verified !== true) throw new Error("Sign-in failed");
  if (!allowedEmails(env).includes(email)) throw new Error("This Google account isn't on the list");
  return email;
}

async function hmacKey(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function makeSessionCookie(email, env) {
  const payload = bytesToB64url(enc.encode(JSON.stringify({ email, exp: Date.now() + SESSION_DAYS * 864e5 })));
  const sig = bytesToB64url(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(payload)));
  return `sess=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
export const clearSessionCookie = "sess=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

/** Returns the signed-in email if the session cookie is valid and still allowed, else null. */
export async function sessionEmail(req, env) {
  const m = /(?:^|;\s*)sess=([\w-]+)\.([\w-]+)/.exec(req.headers.get("Cookie") || "");
  if (!m) return null;
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(env), b64urlToBytes(m[2]), enc.encode(m[1]));
  if (!ok) return null;
  const s = decodeJson(m[1]);
  if (!(s.exp > Date.now())) return null;
  // Re-checked every time, so removing someone from ALLOWED_EMAILS locks them out right away.
  return allowedEmails(env).includes(s.email) ? s.email : null;
}
