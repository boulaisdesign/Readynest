// The tenant-facing page. Plain HTML/CSS/JS, served by the Worker at "/".
// Note: the client script below avoids backticks and "${" so it can live in this template literal.
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f7f4f1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Heat">
<title>Heat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f7f4f1; --ink:#161616; --ink-2:#5c5a57; --ink-3:#9a9792; --line:#161616;
  --warm:1; /* 0..1, how far the setpoint sits between the limits; drives the glow */
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%}
body{
  font-family:Inter,system-ui,-apple-system,"Helvetica Neue",sans-serif;color:var(--ink);background:var(--bg);
  min-height:100dvh;overflow-x:hidden;display:flex;justify-content:center;
}
.screen{position:relative;width:100%;max-width:440px;min-height:100dvh;display:flex;flex-direction:column;
  padding:max(20px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom))}
/* Warm glow, like heat haze, stronger as the setting goes up */
.glow{position:fixed;inset:0;z-index:-2;pointer-events:none;
  background:
    radial-gradient(42% 30% at 72% 22%, rgba(240,78,40,calc(.45 + .5*var(--warm))) 0%, transparent 100%),
    radial-gradient(48% 34% at 42% 32%, rgba(247,150,40,calc(.35 + .5*var(--warm))) 0%, transparent 100%),
    radial-gradient(60% 40% at 55% 30%, rgba(250,190,150,.55) 0%, transparent 100%);
  filter:blur(30px);transition:background .6s ease}
/* Film grain over the glow */
.grain{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.22;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
header{display:flex;justify-content:space-between;align-items:flex-start}
.when{font-size:13px;color:var(--ink-2);margin:0}
.where{font-size:14px;font-weight:600;margin:2px 0 0}
.lockbtn{border:0;background:none;padding:6px;margin:-6px;cursor:pointer;color:var(--ink)}
.lockbtn svg{display:block}
.spacer{flex:1;min-height:180px}
.temp{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.big{display:flex;align-items:flex-end;line-height:.8}
.big b{font-weight:700;font-size:clamp(110px,34vw,150px);letter-spacing:-.06em}
.big span{font-weight:300;font-size:30px;margin:0 0 4px 10px}
.range{display:flex;flex-direction:column;justify-content:space-between;gap:30px;font-size:15px;color:var(--ink-2);padding-bottom:4px;text-align:right}
.rule{height:3px;background:var(--line);margin:16px 0 12px;border-radius:2px}
.state{font-size:26px;font-weight:300;letter-spacing:-.01em;margin:0}
.note{font-size:14px;color:var(--ink-2);margin:6px 0 0;min-height:18px}
.err{color:#c2410c}
/* Strip of settings, like an hourly forecast */
.strip{display:flex;gap:4px;overflow-x:auto;scroll-snap-type:x proximity;margin:26px -20px 0;padding:4px 20px 8px;scrollbar-width:none}
.strip::-webkit-scrollbar{display:none}
.opt{flex:0 0 54px;scroll-snap-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;
  padding:10px 0 12px;border:0;border-radius:16px;background:none;color:var(--ink);font:inherit;cursor:pointer}
.opt .v{font-size:12px;font-weight:600}
.opt .l{font-size:12px;color:var(--ink-3)}
.opt svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.opt.lit svg .f{fill:currentColor}
.opt.sel{background:var(--ink);color:#fff}
.opt.sel .l{color:rgba(255,255,255,.7)}
.opt:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
/* Sign-in screen */
.signin{min-height:44px;margin-top:18px}
.who{font-size:12px;color:var(--ink-3);margin-top:14px}
.out{font-size:13px;color:var(--ink-2);margin:2px 0 0;min-height:16px}
.range small{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-bottom:-24px}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="glow"></div><div class="grain"></div>

<main class="screen" id="lock">
  <header><div><p class="when" data-now></p><p class="where">Suite heat</p></div></header>
  <div class="spacer"></div>
  <div class="temp"><div class="big"><b>Hi</b></div></div>
  <div class="rule"></div>
  <p class="state">Sign in to change the heat</p>
  <p class="note">Use the Google account your landlord added.</p>
  <div class="signin" id="gbtn"></div>
  <p class="note err" id="msg1"></p>
</main>

<main class="screen" id="main" hidden>
  <header>
    <div><p class="when" data-now></p><p class="where" id="place">Suite heat</p><p class="out" id="outside"></p></div>
    <button class="lockbtn" id="out" aria-label="Sign out" title="Sign out">
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 2h24M2 10h24M2 18h24"/></svg>
    </button>
  </header>
  <div class="spacer"></div>

  <div class="temp">
    <div class="big" aria-label="Room temperature"><b id="room">&ndash;</b><span>&deg;C</span></div>
    <div class="range" id="range" hidden><small>Outside</small><span>&uarr;<span id="hi"></span>&deg;C</span><span>&darr;<span id="lo"></span>&deg;C</span></div>
  </div>
  <div class="rule"></div>
  <p class="state" id="state">Loading&hellip;</p>
  <p class="note" id="note"></p>

  <div class="strip" id="strip" role="radiogroup" aria-label="Heat setting"></div>
  <p class="who" id="who"></p>
</main>

<script>
var CLIENT_ID = "__GOOGLE_CLIENT_ID__", signedIn = false;
var S = { min: 19, max: 23, set: null }, shown = null, timer = null;
var $ = function (id) { return document.getElementById(id); };
function r0(v) { return String(Math.round(v)).replace("-", "\u2212"); }
function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
function deg(v) { return (v % 1 ? fmt(v) : String(v)) + "\\u00b0"; }

// Header clock, like "11:30 am, Fri Jan 4"
function tick() {
  var d = new Date();
  var t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
  var day = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
  [].forEach.call(document.querySelectorAll("[data-now]"), function (el) { el.textContent = t + ", " + day; });
}
tick(); setInterval(tick, 15000);

// Flame icon; the inner part fills in for settings at or below the chosen one.
var FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.2 4.8 5.6 4.8 10.4A4.8 4.8 0 0 1 7.2 13c0-2.2 1.1-3.6 2.3-4.8.3 1.6 1 2.6 2 3.1C11 8.6 11 5.3 12 2.5Z"/><path class="f" d="M12 21.2a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.4-2.4 2.6-4 1.2 1.6 2.6 2.4 2.6 4a2.6 2.6 0 0 1-2.6 2.6Z"/></svg>';

function buildStrip() {
  var html = "";
  for (var v = S.min; v <= S.max + 1e-9; v += 0.5) {
    var label = v === S.min ? "min" : v === S.max ? "max" : "";
    html += '<button class="opt" role="radio" data-v="' + v + '" aria-label="' + fmt(v) + ' degrees">' +
      '<span class="v">' + deg(v) + 'C</span>' + FLAME + '<span class="l">' + (label || "&nbsp;") + '</span></button>';
  }
  $("strip").innerHTML = html;
}

function draw(v) {
  shown = v;
  var sel = null;
  [].forEach.call(document.querySelectorAll(".opt"), function (b) {
    var bv = Number(b.dataset.v), on = Math.abs(bv - v) < 1e-9;
    b.classList.toggle("sel", on); b.classList.toggle("lit", bv <= v);
    b.setAttribute("aria-checked", on); b.tabIndex = on ? 0 : -1;
    if (on) { b.querySelector(".l").textContent = "set"; sel = b; }
    else b.querySelector(".l").innerHTML = bv === S.min ? "min" : bv === S.max ? "max" : "&nbsp;";
  });
  if (sel) sel.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  $("state").textContent = (S.hvac === "HEATING" ? "Heating to " : "Heat set to ") + deg(v);
  document.documentElement.style.setProperty("--warm", ((v - S.min) / (S.max - S.min)).toFixed(2));
}

function render(j) {
  var first = S.set === null;
  S = j;
  if (first) buildStrip();
  $("room").textContent = j.room == null ? "\\u2013" : Math.round(j.room);
  if (!timer) draw(j.set);
  var w = j.weather;
  $("place").textContent = j.place ? j.place : "Suite heat";
  $("outside").textContent = w && w.now != null ? "Outside " + r0(w.now) + "\u00b0C" + (w.text ? ", " + w.text.toLowerCase() : "") : "";
  if (w && w.high != null) { $("hi").textContent = r0(w.high); $("lo").textContent = r0(w.low); $("range").hidden = false; }
  else $("range").hidden = true;
  $("who").textContent = "Signed in as " + j.email;
  var n = $("note"); n.classList.remove("err");
  n.textContent = j.until
    ? "Back to normal at " + new Date(j.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase()
    : "Tap a setting below to change it";
}

function showLock(text) { $("lock").hidden = false; $("main").hidden = true; $("msg1").textContent = text || ""; }
function showErr(text) { var n = $("note"); n.textContent = text; n.classList.add("err"); }

function call(path, extra) {
  var body = {}; for (var k in extra || {}) body[k] = extra[k];
  return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(function (r) { return r.json().catch(function () { return { error: "Something went wrong" }; }).then(function (j) { return [r, j]; }); })
    .then(function (rj) {
      var r = rj[0], j = rj[1];
      if (r.status === 401) { signedIn = false; showLock(extra ? j.error : ""); return; }
      signedIn = true; $("lock").hidden = true; $("main").hidden = false;
      if (j.error) { if (S.set !== null) draw(S.set); showErr(j.error); return; }
      render(j);
    })
    .catch(function () { showErr("No connection. Try again."); });
}

// Wait a moment so a few quick taps send only one change.
function choose(v) {
  v = Math.min(S.max, Math.max(S.min, Math.round(v * 2) / 2));
  if (v === shown) return;
  draw(v);
  clearTimeout(timer);
  timer = setTimeout(function () { timer = null; call("/api/set", { target: v }); }, 700);
}

$("strip").addEventListener("click", function (e) {
  var b = e.target.closest(".opt"); if (b) choose(Number(b.dataset.v));
});
$("strip").addEventListener("keydown", function (e) {
  if (shown === null) return;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { choose(shown + 0.5); e.preventDefault(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { choose(shown - 0.5); e.preventDefault(); }
  var s = document.querySelector(".opt.sel"); if (s) s.focus();
});
$("out").onclick = function () {
  fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    .finally(function () { signedIn = false; if (window.google) google.accounts.id.disableAutoSelect(); showLock(); });
};

// "Sign in with Google": Google hands the page a signed token; the server checks it and sets a session cookie.
function gsiReady() {
  if (!CLIENT_ID || CLIENT_ID.indexOf("__") === 0) { $("msg1").textContent = "Sign-in isn't set up yet."; return; }
  google.accounts.id.initialize({ client_id: CLIENT_ID, callback: onGoogle, auto_select: true, itp_support: true });
  google.accounts.id.renderButton($("gbtn"), { theme: "filled_black", shape: "pill", size: "large", text: "signin_with" });
}
function onGoogle(res) {
  fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential: res.credential }) })
    .then(function (r) { return r.json(); })
    .then(function (j) { if (j.error) { $("msg1").textContent = j.error; return; } $("msg1").textContent = ""; call("/api/status"); })
    .catch(function () { $("msg1").textContent = "No connection. Try again."; });
}

call("/api/status");
// Keep the reading fresh while the page is open.
setInterval(function () { if (signedIn && !document.hidden && !timer) call("/api/status"); }, 60000);
</script>
<script src="https://accounts.google.com/gsi/client" async defer onload="gsiReady()"></script>
</body>
</html>`;
