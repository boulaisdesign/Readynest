import { PAGE } from "./page.js";

const API = "https://smartdevicemanagement.googleapis.com/v1";
const T = "sdm.devices.traits.";
const MAX_BAD_PINS = 10; // wrong PINs allowed per lockout window
const LOCKOUT_MINUTES = 15;

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

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// Constant-time string compare so the PIN can't be guessed by timing.
function sameText(a, b) {
  const x = new TextEncoder().encode(String(a ?? ""));
  const y = new TextEncoder().encode(String(b ?? ""));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export const clampHalf = (v, min, max) => Math.min(max, Math.max(min, Math.round(v * 2) / 2));

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "GET") {
      if (url.pathname !== "/") return new Response("Not found", { status: 404 });
      return new Response(PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
    if (req.method !== "POST" || !["/api/status", "/api/set"].includes(url.pathname)) {
      return json({ error: "Not found" }, 404);
    }

    // Slow down PIN guessing: too many wrong PINs locks the page for a while.
    const bad = Number(await env.STATE.get("badPins")) || 0;
    if (bad >= MAX_BAD_PINS) return json({ error: "Too many wrong PINs. Try again later." }, 429);

    const body = await req.json().catch(() => ({}));
    if (!sameText(body.pin, env.PIN)) {
      await env.STATE.put("badPins", String(bad + 1), { expirationTtl: LOCKOUT_MINUTES * 60 });
      return json({ error: "Wrong PIN" }, 401);
    }

    const min = Number(env.MIN_C), max = Number(env.MAX_C);
    try {
      const t = await token(env);
      const s = await status(env, t);

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
      return json({ ...s, until: until ? Number(until) : null, min, max });
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
