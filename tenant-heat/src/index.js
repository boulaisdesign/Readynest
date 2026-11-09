import { PAGE } from "./page.js";
import { verifyGoogleToken, makeSessionCookie, clearSessionCookie, sessionEmail } from "./auth.js";
import { outdoor } from "./weather.js";

const API = "https://smartdevicemanagement.googleapis.com/v1";
const T = "sdm.devices.traits.";

const dev = (env) => `${API}/enterprises/${env.PROJECT_ID}/devices/${env.DEVICE_ID}`;

async function token(env) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
      refresh_token: env.REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("Google sign-in failed");
  return j.access_token;
}

async function status(env, t) {
  const r = await fetch(dev(env), { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error("Couldn't reach the thermostat");
  const tr = (await r.json()).traits || {};
  return {
    room: tr[T + "Temperature"]?.ambientTemperatureCelsius ?? null,
    set: tr[T + "ThermostatTemperatureSetpoint"]?.heatCelsius ?? null,
    mode: tr[T + "ThermostatMode"]?.mode ?? null,
    eco: tr[T + "ThermostatEco"]?.mode === "MANUAL_ECO",
    hvac: tr[T + "ThermostatHvac"]?.status ?? null,
  };
}

async function setHeat(env, t, c) {
  const r = await fetch(`${dev(env)}:executeCommand`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      command: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
      params: { heatCelsius: c },
    }),
  });
  if (!r.ok) throw new Error("Thermostat refused the change");
}

const json = (o, s = 200, extra = {}) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });

const ROUTES = ["/api/login", "/api/logout", "/api/status", "/api/set"];

export const clampHalf = (v, min, max) => Math.min(max, Math.max(min, Math.round(v * 2) / 2));

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "GET") {
      if (url.pathname !== "/") return new Response("Not found", { status: 404 });
      const page = PAGE.replace("__GOOGLE_CLIENT_ID__", String(env.SIGNIN_CLIENT_ID || env.CLIENT_ID || "").replace(/[^\w.-]/g, ""));
      return new Response(page, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer-when-downgrade", // Google's button needs the origin
          "X-Frame-Options": "DENY",
        },
      });
    }
    if (req.method !== "POST" || !ROUTES.includes(url.pathname)) return json({ error: "Not found" }, 404);

    // Only accept requests made by this page (blocks other sites posting with the tenant's cookie).
    const origin = req.headers.get("Origin");
    if (origin && origin !== url.origin) return json({ error: "Not allowed" }, 403);

    const body = await req.json().catch(() => ({}));

    if (url.pathname === "/api/login") {
      try {
        const email = await verifyGoogleToken(body.credential, env);
        return json({ email }, 200, { "Set-Cookie": await makeSessionCookie(email, env) });
      } catch (e) {
        return json({ error: e.message }, 401);
      }
    }
    if (url.pathname === "/api/logout") return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie });

    const email = await sessionEmail(req, env).catch(() => null);
    if (!email) return json({ error: "Please sign in" }, 401, { "Set-Cookie": clearSessionCookie });

    const min = Number(env.MIN_C), max = Number(env.MAX_C);
    try {
      const t = await token(env);
      const [s, weather] = await Promise.all([status(env, t), outdoor(env)]);

      if (url.pathname === "/api/set") {
        if (s.mode !== "HEAT") return json({ error: "Heating is off right now" }, 409);
        if (s.eco) return json({ error: "The thermostat is in Eco mode" }, 409);
        const target = Number(body.target);
        if (!Number.isFinite(target)) return json({ error: "Pick a temperature" }, 400);
        const next = clampHalf(target, min, max);
        if (next !== s.set) {
          if (!(await env.STATE.get("before"))) await env.STATE.put("before", String(s.set));
          await env.STATE.put("revertAt", String(Date.now() + Number(env.BOOST_HOURS) * 3600e3));
          await setHeat(env, t, next);
          s.set = next;
        }
      }

      const until = await env.STATE.get("revertAt");
      return json({ ...s, until: until ? Number(until) : null, min, max, email, weather, place: env.PLACE || "" });
    } catch (e) {
      return json({ error: e.message }, 502);
    }
  },

  async scheduled(_evt, env) {
    const at = Number(await env.STATE.get("revertAt"));
    if (!at || Date.now() < at) return;
    const before = Number(await env.STATE.get("before"));
    try {
      const t = await token(env);
      const s = await status(env, t);
      // Only put the old value back if heating is still on; otherwise just clear the boost.
      if (before && s.mode === "HEAT" && !s.eco) await setHeat(env, t, before);
    } finally {
      await env.STATE.delete("revertAt");
      await env.STATE.delete("before");
    }
  },
};
