import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

// A fake thermostat and Google API, so the Worker can be tested without real accounts.
let nest, commands;
function kv() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => void m.set(k, String(v)),
    delete: async (k) => void m.delete(k),
    _m: m,
  };
}
let env;
beforeEach(() => {
  nest = { room: 20.3, set: 21, mode: "HEAT", eco: "OFF", hvac: "OFF" };
  commands = [];
  env = {
    MIN_C: "19", MAX_C: "23", BOOST_HOURS: "2", PIN: "4821",
    CLIENT_ID: "c", CLIENT_SECRET: "s", REFRESH_TOKEN: "r", PROJECT_ID: "p", DEVICE_ID: "d",
    STATE: kv(),
  };
  globalThis.fetch = async (url, init = {}) => {
    url = String(url);
    if (url.startsWith("https://oauth2.googleapis.com/token")) return Response.json({ access_token: "tok" });
    if (url.endsWith(":executeCommand")) {
      const b = JSON.parse(init.body);
      commands.push(b.params.heatCelsius);
      nest.set = b.params.heatCelsius;
      return Response.json({});
    }
    if (url.includes("/devices/d")) {
      return Response.json({
        traits: {
          "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: nest.room },
          "sdm.devices.traits.ThermostatTemperatureSetpoint": { heatCelsius: nest.set },
          "sdm.devices.traits.ThermostatMode": { mode: nest.mode },
          "sdm.devices.traits.ThermostatEco": { mode: nest.eco },
          "sdm.devices.traits.ThermostatHvac": { status: nest.hvac },
        },
      });
    }
    throw new Error("unexpected fetch " + url);
  };
});

const post = (path, body) =>
  worker.fetch(new Request("https://x.dev" + path, { method: "POST", body: JSON.stringify(body) }), env);

test("serves the page", async () => {
  const r = await worker.fetch(new Request("https://x.dev/"), env);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Suite heat/);
});

test("wrong PIN is refused and eventually locks out", async () => {
  for (let i = 0; i < 10; i++) assert.equal((await post("/api/status", { pin: "0000" })).status, 401);
  assert.equal((await post("/api/status", { pin: "4821" })).status, 429);
});

test("status returns the reading", async () => {
  const j = await (await post("/api/status", { pin: "4821" })).json();
  assert.equal(j.room, 20.3);
  assert.equal(j.set, 21);
  assert.equal(j.min, 19);
  assert.equal(j.until, null);
});

test("set clamps to the limits and rounds to half degrees", async () => {
  let j = await (await post("/api/set", { pin: "4821", target: 30 })).json();
  assert.equal(j.set, 23);
  j = await (await post("/api/set", { pin: "4821", target: 10 })).json();
  assert.equal(j.set, 19);
  j = await (await post("/api/set", { pin: "4821", target: 21.3 })).json();
  assert.equal(j.set, 21.5);
  assert.deepEqual(commands, [23, 19, 21.5]);
  assert.ok(j.until > Date.now());
  assert.equal(await env.STATE.get("before"), "21"); // remembers the original, not the in-between values
});

test("refuses when heating is off or in Eco", async () => {
  nest.mode = "OFF";
  assert.equal((await post("/api/set", { pin: "4821", target: 22 })).status, 409);
  nest.mode = "HEAT"; nest.eco = "MANUAL_ECO";
  assert.equal((await post("/api/set", { pin: "4821", target: 22 })).status, 409);
  assert.deepEqual(commands, []);
});

test("timer puts the old setting back once the boost runs out", async () => {
  await post("/api/set", { pin: "4821", target: 23 });
  await worker.scheduled({}, env); // not yet due
  assert.equal(nest.set, 23);
  await env.STATE.put("revertAt", String(Date.now() - 1));
  await worker.scheduled({}, env);
  assert.equal(nest.set, 21);
  assert.equal(await env.STATE.get("revertAt"), null);
  assert.equal(await env.STATE.get("before"), null);
});

test("timer just clears the boost if heating was turned off", async () => {
  await post("/api/set", { pin: "4821", target: 23 });
  nest.mode = "OFF";
  await env.STATE.put("revertAt", String(Date.now() - 1));
  await worker.scheduled({}, env);
  assert.deepEqual(commands, [23]);
  assert.equal(await env.STATE.get("revertAt"), null);
});
