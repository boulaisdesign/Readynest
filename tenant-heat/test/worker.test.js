import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { _resetCerts } from "../src/auth.js";
import { _resetWeather } from "../src/weather.js";

// A fake Google (sign-in keys, OAuth, Nest API) and fake weather, so the Worker runs without real accounts.
const b64u = (b) => Buffer.from(b).toString("base64url");
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true, ["sign", "verify"],
);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "k1", alg: "RS256", use: "sig" };

async function idToken(claims = {}, kid = "k1") {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: "RS256", kid, typ: "JWT" }));
  const p = b64u(JSON.stringify({
    iss: "https://accounts.google.com", aud: "client-123", email: "tenant@gmail.com",
    email_verified: true, iat: now, exp: now + 3600, ...claims,
  }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64u(sig)}`;
}

let nest, commands, env, weatherCalls;
function kv() {
  const m = new Map();
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, String(v)), delete: async (k) => void m.delete(k) };
}
beforeEach(() => {
  _resetCerts(); _resetWeather();
  nest = { room: 20.3, set: 21, mode: "HEAT", eco: "OFF", hvac: "OFF" };
  commands = []; weatherCalls = 0;
  env = {
    MIN_C: "19", MAX_C: "23", BOOST_HOURS: "2", LAT: "45.5", LON: "-73.6", PLACE: "Suite 2",
    CLIENT_ID: "client-123", CLIENT_SECRET: "s", REFRESH_TOKEN: "r", PROJECT_ID: "p", DEVICE_ID: "d",
    ALLOWED_EMAILS: "Tenant@gmail.com, other@gmail.com",
    SESSION_SECRET: "x".repeat(40),
    STATE: kv(),
  };
  globalThis.fetch = async (url, init = {}) => {
    url = String(url);
    if (url === "https://www.googleapis.com/oauth2/v3/certs") return Response.json({ keys: [jwk] });
    if (url.startsWith("https://oauth2.googleapis.com/token")) return Response.json({ access_token: "tok" });
    if (url.startsWith("https://api.open-meteo.com/")) {
      weatherCalls++;
      return Response.json({ current: { temperature_2m: 3.6, weather_code: 71 }, daily: { temperature_2m_max: [5.2], temperature_2m_min: [-1.4] } });
    }
    if (url.endsWith(":executeCommand")) {
      const b = JSON.parse(init.body);
      commands.push(b.params.heatCelsius);
      nest.set = b.params.heatCelsius;
      return Response.json({});
    }
    if (url.includes("/devices/d")) {
      return Response.json({ traits: {
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: nest.room },
        "sdm.devices.traits.ThermostatTemperatureSetpoint": { heatCelsius: nest.set },
        "sdm.devices.traits.ThermostatMode": { mode: nest.mode },
        "sdm.devices.traits.ThermostatEco": { mode: nest.eco },
        "sdm.devices.traits.ThermostatHvac": { status: nest.hvac },
      } });
    }
    throw new Error("unexpected fetch " + url);
  };
});

const post = (path, body = {}, cookie = "", headers = {}) =>
  worker.fetch(new Request("https://heat.dev" + path, {
    method: "POST", body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...headers },
  }), env);

async function signIn(claims) {
  const r = await post("/api/login", { credential: await idToken(claims) });
  const c = r.headers.get("Set-Cookie") || "";
  return { r, cookie: c.split(";")[0] };
}

test("serves the page with the Google client ID filled in", async () => {
  const r = await worker.fetch(new Request("https://heat.dev/"), env);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /Suite heat/);
  assert.match(html, /CLIENT_ID = "client-123"/);
});

test("nothing works without signing in", async () => {
  assert.equal((await post("/api/status")).status, 401);
  assert.equal((await post("/api/set", { target: 23 })).status, 401);
  assert.deepEqual(commands, []);
});

test("an allowed Google account signs in and gets a secure cookie", async () => {
  const { r, cookie } = await signIn();
  assert.equal(r.status, 200);
  assert.match(r.headers.get("Set-Cookie"), /HttpOnly; Secure; SameSite=Lax/);
  const j = await (await post("/api/status", {}, cookie)).json();
  assert.equal(j.email, "tenant@gmail.com");
  assert.equal(j.room, 20.3);
});

test("sign-in is refused for bad tokens", async () => {
  const bad = async (claims, kid) => (await post("/api/login", { credential: await idToken(claims, kid) })).status;
  assert.equal(await bad({ email: "stranger@gmail.com" }), 401);            // not on the list
  assert.equal(await bad({ aud: "someone-elses-app" }), 401);               // made for another app
  assert.equal(await bad({ exp: Math.floor(Date.now() / 1000) - 10 }), 401); // expired
  assert.equal(await bad({ email_verified: false }), 401);
  assert.equal(await bad({ iss: "https://evil.example" }), 401);
  assert.equal(await bad({}, "unknown-key"), 401);
  const t = await idToken();
  const tampered = t.split(".");
  tampered[1] = b64u(JSON.stringify({ ...JSON.parse(Buffer.from(tampered[1], "base64url")), email: "other@gmail.com" }));
  assert.equal((await post("/api/login", { credential: tampered.join(".") })).status, 401); // forged
  assert.equal((await post("/api/login", { credential: "garbage" })).status, 401);
});

test("a forged or revoked session cookie is refused", async () => {
  const { cookie } = await signIn();
  const [name, rest] = cookie.split("=");
  assert.equal((await post("/api/status", {}, name + "=" + rest.slice(0, -2) + "AA")).status, 401);
  env.ALLOWED_EMAILS = "other@gmail.com"; // landlord removes the tenant
  assert.equal((await post("/api/status", {}, cookie)).status, 401);
});

test("requests from other websites are blocked", async () => {
  const { cookie } = await signIn();
  assert.equal((await post("/api/set", { target: 23 }, cookie, { Origin: "https://evil.example" })).status, 403);
  assert.deepEqual(commands, []);
});

test("sign out clears the cookie", async () => {
  const r = await post("/api/logout");
  assert.match(r.headers.get("Set-Cookie"), /Max-Age=0/);
});

test("status includes outdoor weather, cached between requests", async () => {
  const { cookie } = await signIn();
  const j = await (await post("/api/status", {}, cookie)).json();
  assert.deepEqual(j.weather, { now: 3.6, high: 5.2, low: -1.4, text: "Light snow" });
  assert.equal(j.place, "Suite 2");
  await post("/api/status", {}, cookie);
  assert.equal(weatherCalls, 1);
});

test("no location means no weather, and the page still works", async () => {
  delete env.LAT;
  const { cookie } = await signIn();
  const r = await post("/api/status", {}, cookie);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).weather, null);
});

test("set clamps to the limits and rounds to half degrees", async () => {
  const { cookie } = await signIn();
  let j = await (await post("/api/set", { target: 30 }, cookie)).json();
  assert.equal(j.set, 23);
  j = await (await post("/api/set", { target: 10 }, cookie)).json();
  assert.equal(j.set, 19);
  j = await (await post("/api/set", { target: 21.3 }, cookie)).json();
  assert.equal(j.set, 21.5);
  assert.deepEqual(commands, [23, 19, 21.5]);
  assert.ok(j.until > Date.now());
  assert.equal(await env.STATE.get("before"), "21");
});

test("refuses when heating is off or in Eco", async () => {
  const { cookie } = await signIn();
  nest.mode = "OFF";
  assert.equal((await post("/api/set", { target: 22 }, cookie)).status, 409);
  nest.mode = "HEAT"; nest.eco = "MANUAL_ECO";
  assert.equal((await post("/api/set", { target: 22 }, cookie)).status, 409);
  assert.deepEqual(commands, []);
});

test("timer puts the old setting back once the boost runs out", async () => {
  const { cookie } = await signIn();
  await post("/api/set", { target: 23 }, cookie);
  await worker.scheduled({}, env);
  assert.equal(nest.set, 23);
  await env.STATE.put("revertAt", String(Date.now() - 1));
  await worker.scheduled({}, env);
  assert.equal(nest.set, 21);
  assert.equal(await env.STATE.get("revertAt"), null);
  assert.equal(await env.STATE.get("before"), null);
});

test("timer just clears the boost if heating was turned off", async () => {
  const { cookie } = await signIn();
  await post("/api/set", { target: 23 }, cookie);
  nest.mode = "OFF";
  await env.STATE.put("revertAt", String(Date.now() - 1));
  await worker.scheduled({}, env);
  assert.deepEqual(commands, [23]);
  assert.equal(await env.STATE.get("revertAt"), null);
});
