// The tenant-facing page. Plain HTML/CSS/JS, served by the Worker at "/".
// Note: the client script below avoids backticks and "${" so it can live in this template literal.
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1d2a30">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Heat">
<title>Heat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@200;300;400;500&display=swap" rel="stylesheet">
<style>
:root{
  --ink:#fff; --ink-2:rgba(255,255,255,.72); --ink-3:rgba(255,255,255,.45);
  --glass:rgba(255,255,255,.12); --glass-2:rgba(255,255,255,.2); --edge:rgba(255,255,255,.28);
  --warm:1; /* 0..1, how far the setpoint sits between the limits; drives the glow */
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%}
body{
  font-family:"Inter Tight",system-ui,-apple-system,sans-serif;color:var(--ink);
  background:#1d2a30;min-height:100dvh;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;overflow-x:hidden;
  padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));
}
/* Blurred backdrop: dusk teal sky with a warm glow that grows with the setpoint */
.sky{position:fixed;inset:-20%;z-index:-1;filter:blur(40px);
  background:
    radial-gradient(45% 35% at 55% 62%, rgba(255,110,40,calc(.35 + .55*var(--warm))) 0%, transparent 70%),
    radial-gradient(60% 45% at 30% 75%, rgba(255,170,70,calc(.15 + .45*var(--warm))) 0%, transparent 70%),
    radial-gradient(70% 40% at 70% 90%, rgba(230,120,140,.35) 0%, transparent 70%),
    linear-gradient(180deg,#3d6670 0%,#5b8a8f 35%,#7f6a66 65%,#2a2523 100%);
  transition:background .6s ease;
}
.card{
  width:min(380px,100%);border-radius:40px;padding:26px 22px 22px;
  background:var(--glass);border:1px solid var(--edge);
  backdrop-filter:blur(28px) saturate(140%);-webkit-backdrop-filter:blur(28px) saturate(140%);
  box-shadow:0 30px 60px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.25);
}
h1{font-weight:400;font-size:26px;letter-spacing:-.01em;margin:0}
.sub{color:var(--ink-2);font-size:15px;margin:4px 0 0;min-height:20px}
.dial{position:relative;margin:14px auto 0;width:100%;max-width:320px;aspect-ratio:300/250;touch-action:none;user-select:none}
.dial svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.track{fill:none;stroke:rgba(255,255,255,.22);stroke-width:4;stroke-linecap:round}
.fill{fill:none;stroke:url(#g);stroke-width:5;stroke-linecap:round}
.dot{fill:rgba(255,255,255,.5)} .dot.on{fill:#fff}
.knob{fill:rgba(255,255,255,.25);stroke:#fff;stroke-width:3;cursor:grab}
.lim{fill:var(--ink-2);font:400 13px "Inter Tight",system-ui,sans-serif}
.hub{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);
  width:42%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;
  background:radial-gradient(circle at 50% 35%,rgba(255,255,255,.38),rgba(255,255,255,.12) 70%);
  border:1px solid var(--edge);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  box-shadow:0 0 60px rgba(255,170,90,calc(.15 + .35*var(--warm)))}
.num{font-weight:200;font-size:56px;line-height:1;letter-spacing:-.03em}
.num small{font-size:20px;font-weight:300;vertical-align:top;margin-left:2px;position:relative;top:6px}
.cap{font-size:12px;color:var(--ink-2);margin-top:4px;letter-spacing:.04em;text-transform:uppercase}
.pill{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;
  background:var(--glass);border:1px solid var(--edge);font-size:14px;color:var(--ink)}
.status{display:flex;justify-content:center;margin:6px 0 18px;min-height:40px}
.status .pill:empty{display:none}
.row{display:flex;gap:12px}
.btn{flex:1;display:flex;align-items:center;gap:12px;padding:8px 18px 8px 8px;border-radius:999px;
  background:var(--glass-2);border:1px solid var(--edge);color:var(--ink);font:inherit;font-size:16px;cursor:pointer}
.btn:active{transform:scale(.97)} .btn:disabled{opacity:.45}
.btn i{width:40px;height:40px;border-radius:50%;background:#fff;color:#2a2523;display:grid;place-items:center;
  font-style:normal;font-size:22px;font-weight:400;line-height:1}
#msg{text-align:center;color:#ffd7c2;font-size:14px;min-height:20px;margin-top:14px}
/* PIN screen */
.pinrow{display:flex;gap:10px;margin-top:22px}
input{flex:1;min-width:0;width:100%;font:inherit;font-size:22px;letter-spacing:.3em;text-align:center;color:#fff;
  padding:14px;border-radius:999px;border:1px solid var(--edge);background:var(--glass);outline:none}
input:focus{border-color:#fff}
.go{width:56px;height:56px;border-radius:50%;border:0;background:#fff;color:#2a2523;font-size:22px;cursor:pointer}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="sky"></div>

<section class="card" id="lock">
  <h1>Suite heat</h1>
  <p class="sub">Enter the PIN you were given.</p>
  <form class="pinrow" onsubmit="go(event)">
    <input id="pin" type="password" inputmode="numeric" autocomplete="current-password" aria-label="PIN">
    <button class="go" aria-label="Unlock">&rarr;</button>
  </form>
  <div id="msg1" class="sub" style="color:#ffd7c2;margin-top:14px"></div>
</section>

<section class="card" id="main" hidden>
  <h1>Suite heat</h1>
  <p class="sub" id="sub">Loading&hellip;</p>

  <div class="dial" id="dial" role="slider" tabindex="0" aria-label="Heat setting" aria-valuemin="19" aria-valuemax="23">
    <svg viewBox="0 0 300 250" aria-hidden="true">
      <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffc65c"/></linearGradient></defs>
      <g id="dots"></g>
      <path class="track" id="track"/>
      <path class="fill" id="fill"/>
      <text class="lim" id="lmin" text-anchor="middle"></text>
      <text class="lim" id="lmax" text-anchor="middle"></text>
      <circle class="knob" id="knob" r="11"/>
    </svg>
    <div class="hub"><div><div class="num" id="num">&ndash;</div><div class="cap">Heat set</div></div></div>
  </div>

  <div class="status"><span class="pill" id="until"></span></div>

  <div class="row">
    <button class="btn" id="down" aria-label="Cooler"><i>&minus;</i>Cooler</button>
    <button class="btn" id="up" aria-label="Warmer"><i>+</i>Warmer</button>
  </div>
  <div id="msg"></div>
</section>

<script>
var pin = ""; try { pin = localStorage.getItem("pin") || ""; } catch (e) {}
var S = { min: 19, max: 23, set: null }, shown = null, timer = null, dragging = false;
var $ = function (id) { return document.getElementById(id); };

// Dial geometry: a 240 degree arc, angles measured clockwise from 12 o'clock.
var CX = 150, CY = 150, R = 118, A0 = -120, A1 = 120;
function pt(a, r) { var t = a * Math.PI / 180; return [CX + r * Math.sin(t), CY - r * Math.cos(t)]; }
function arc(a, b) {
  var p = pt(a, R), q = pt(b, R), big = (b - a) > 180 ? 1 : 0;
  return "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " A" + R + " " + R + " 0 " + big + " 1 " + q[0].toFixed(1) + " " + q[1].toFixed(1);
}
function angleOf(v) { return A0 + (v - S.min) / (S.max - S.min) * (A1 - A0); }
function snap(v) { return Math.min(S.max, Math.max(S.min, Math.round(v * 2) / 2)); }
function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }

function buildDial() {
  $("track").setAttribute("d", arc(A0, A1));
  var g = $("dots"), html = "";
  for (var v = S.min; v <= S.max + 1e-9; v += 0.5) {
    var p = pt(angleOf(v), R + 18), whole = Math.abs(v - Math.round(v)) < 1e-9;
    html += '<circle class="dot" data-v="' + v + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (whole ? 2.6 : 1.6) + '"/>';
  }
  g.innerHTML = html;
  var a = pt(A0, R + 4), b = pt(A1, R + 4);
  $("lmin").setAttribute("x", a[0] - 4); $("lmin").setAttribute("y", a[1] + 26); $("lmin").textContent = S.min + "\\u00b0";
  $("lmax").setAttribute("x", b[0] + 4); $("lmax").setAttribute("y", b[1] + 26); $("lmax").textContent = S.max + "\\u00b0";
  $("dial").setAttribute("aria-valuemin", S.min); $("dial").setAttribute("aria-valuemax", S.max);
}

function draw(v) {
  shown = v;
  var a = angleOf(v), k = pt(a, R);
  $("fill").setAttribute("d", v > S.min ? arc(A0, a) : "");
  $("knob").setAttribute("cx", k[0]); $("knob").setAttribute("cy", k[1]);
  var whole = Math.floor(v), half = v - whole >= 0.5;
  $("num").innerHTML = whole + "<small>" + (half ? ".5" : "") + "\\u00b0</small>";
  [].forEach.call(document.querySelectorAll(".dot"), function (d) { d.classList.toggle("on", Number(d.dataset.v) <= v); });
  $("dial").setAttribute("aria-valuenow", v);
  $("dial").setAttribute("aria-valuetext", fmt(v) + " degrees");
  $("down").disabled = v <= S.min; $("up").disabled = v >= S.max;
  document.documentElement.style.setProperty("--warm", ((v - S.min) / (S.max - S.min)).toFixed(2));
}

function render(j) {
  var first = S.set === null;
  S = j;
  if (first) buildDial();
  if (!dragging && !timer) draw(j.set);
  var parts = [];
  if (j.room != null) parts.push("Room is " + fmt(j.room) + "\\u00b0");
  if (j.hvac === "HEATING") parts.push("heating now");
  $("sub").textContent = parts.join(" \\u00b7 ") || "Connected";
  $("until").innerHTML = j.until
    ? "&#9719; Back to normal at " + new Date(j.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";
}

function showLock(text) { $("lock").hidden = false; $("main").hidden = true; $("msg1").textContent = text || ""; }

function call(path, extra) {
  var body = { pin: pin }; for (var k in extra || {}) body[k] = extra[k];
  return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(function (r) { return r.json().catch(function () { return { error: "Something went wrong" }; }).then(function (j) { return [r, j]; }); })
    .then(function (rj) {
      var r = rj[0], j = rj[1];
      if (r.status === 401 || r.status === 429) { try { localStorage.removeItem("pin"); } catch (e) {} showLock(j.error); return; }
      $("lock").hidden = true; $("main").hidden = false;
      try { localStorage.setItem("pin", pin); } catch (e) {}
      if (j.error) { $("msg").textContent = j.error; if (S.set !== null) draw(S.set); return; }
      $("msg").textContent = "";
      render(j);
    })
    .catch(function () { $("msg").textContent = "No connection. Try again."; });
}

// Wait until the tenant stops fiddling, then send one change.
function choose(v) {
  v = snap(v);
  if (v === shown) return;
  draw(v);
  clearTimeout(timer);
  timer = setTimeout(function () { timer = null; call("/api/set", { target: v }); }, 700);
}

function fromPointer(e) {
  var box = $("dial").getBoundingClientRect(), s = box.width / 300;
  var x = (e.clientX - box.left) / s - CX, y = (e.clientY - box.top) / s - CY;
  var a = Math.atan2(x, -y) * 180 / Math.PI;
  // Below the arc: snap to whichever end is nearer.
  if (a > A1) a = A1; else if (a < A0) a = A0;
  return S.min + (a - A0) / (A1 - A0) * (S.max - S.min);
}
var dial = $("dial");
dial.addEventListener("pointerdown", function (e) { if (S.set === null) return; dragging = true; dial.setPointerCapture(e.pointerId); choose(fromPointer(e)); });
dial.addEventListener("pointermove", function (e) { if (dragging) choose(fromPointer(e)); });
dial.addEventListener("pointerup", function () { dragging = false; });
dial.addEventListener("pointercancel", function () { dragging = false; });
dial.addEventListener("keydown", function (e) {
  if (shown === null) return;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { choose(shown + 0.5); e.preventDefault(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { choose(shown - 0.5); e.preventDefault(); }
});
$("up").onclick = function () { if (shown !== null) choose(shown + 0.5); };
$("down").onclick = function () { if (shown !== null) choose(shown - 0.5); };

function go(e) { e.preventDefault(); pin = $("pin").value.trim(); if (pin) call("/api/status"); }
if (pin) call("/api/status"); else showLock();
// Keep the reading fresh while the page is open.
setInterval(function () { if (pin && !$("main").hidden && !document.hidden && !timer && !dragging) call("/api/status"); }, 60000);
</script>
</body>
</html>`;
