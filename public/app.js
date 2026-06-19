(function () {
  "use strict";

  // ---- time helpers (all trip logic is Europe/Madrid, CEST +02:00 in June) ----
  var MADRID_YMD = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
  var MADRID_HM = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false });

  function mDate(d) { return MADRID_YMD.format(d); }            // YYYY-MM-DD in Madrid, device-tz independent
  function madridMinutes(d) {                                    // minutes from local midnight in Madrid
    var h = 0, m = 0;
    MADRID_HM.formatToParts(d).forEach(function (p) { if (p.type === "hour") h = +p.value; else if (p.type === "minute") m = +p.value; });
    return h * 60 + m;
  }
  function now() {
    var p = new URLSearchParams(location.search).get("now");
    if (!p) return new Date();
    p = p.trim();
    // A literal "+02:00" in the query is decoded by URLSearchParams to " 02:00"; restore the sign.
    p = p.replace(/ (\d\d:?\d\d)$/, "+$1");
    // A bare datetime (no offset) would parse in the device tz; force Madrid CEST so previews are stable everywhere.
    if (!/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(p)) p += "+02:00";
    var d = new Date(p);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // ---- trip timeline (phase boundaries, explicit +02:00) ----
  var B = {
    depart: new Date("2026-06-19T23:00:00+02:00"),
    arriveBilbao: new Date("2026-06-20T07:00:00+02:00"),
    checkin: new Date("2026-06-20T14:00:00+02:00"),
    leaveLaga: new Date("2026-06-23T17:00:00+02:00"),
    returnDepart: new Date("2026-06-24T10:30:00+02:00"),
    returnArrive: new Date("2026-06-24T18:00:00+02:00")
  };
  var TRIP_START = B.depart, TRIP_END = B.returnArrive;
  var RIBBON_DAY0 = Date.UTC(2026, 5, 19);   // ribbon spans the 6 calendar days Jun 19..24

  var Q = "https://www.google.com/maps/search/?api=1&query=";
  var CTA = {
    bcnNord: [Q + "Estaci%C3%B3+d%27Autobusos+Barcelona+Nord%2C+C%2F+Al%C3%AD+Bei+80%2C+08013+Barcelona", "Barcelona Nord"],
    bilbao: [Q + "Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao", "Bilbao Intermodal"],
    rutaLaga: ["https://www.google.com/maps/dir/?api=1&origin=Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao&destination=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde&travelmode=transit", "Ruta a Laga"],
    playa: [Q + "Playa+de+Laga%2C+Ibarrangelu%2C+Bizkaia", "Playa de Laga"],
    cascoViejo: [Q + "Casco+Viejo%2C+Bilbao", "Casco Viejo"]
  };

  function delta(ms) {
    if (ms < 0) ms = 0;
    var m = Math.floor(ms / 6e4), d = Math.floor(m / 1440); m -= d * 1440;
    var h = Math.floor(m / 60); m -= h * 60;
    var o = [];
    if (d) o.push(d + "d");
    if (d || h) o.push(h + "h");
    o.push(m + "min");
    return o.join(" ");
  }

  function lagaDay(n) {
    var d0 = Date.UTC(2026, 5, 20);
    var dn = Date.parse(mDate(n) + "T00:00:00Z");
    return Math.max(1, Math.min(4, Math.floor((dn - d0) / 864e5) + 1));
  }

  function phase(n) {
    if (n < B.depart) {
      var depDay = Date.UTC(2026, 5, 19);
      var today = Date.parse(mDate(n) + "T00:00:00Z");
      var days = Math.round((depDay - today) / 864e5);
      if (days > 0) return { title: "Faltan " + days + (days === 1 ? " día" : " días"), sub: "El bus nocturno sale el viernes a las 23:00", next: "Sale el bus", at: B.depart, cta: CTA.bcnNord };
      return { title: "Hoy salimos", sub: "Bus nocturno desde Barcelona Nord, 23:00", next: "Sale el bus", at: B.depart, cta: CTA.bcnNord };
    }
    if (n < B.arriveBilbao) return { title: "Rumbo al norte", sub: "En el bus nocturno hacia Bilbao", next: "Llegada a Bilbao", at: B.arriveBilbao, cta: CTA.bilbao };
    if (n < B.checkin) return { title: "Casi en Laga", sub: "Coge el A3513, check-in a las 14:00", next: "Check-in en Laga", at: B.checkin, cta: CTA.rutaLaga };
    if (n < B.leaveLaga) return { title: "En el agua", sub: "Día " + lagaDay(n) + " de 4 en Laga", next: "Salida hacia Bilbao", at: B.leaveLaga, cta: CTA.playa };
    if (n < B.returnDepart) return { title: "Noche de San Juan", sub: "Pintxos y hogueras en Bilbao", next: "Bus de vuelta", at: B.returnDepart, cta: CTA.cascoViejo };
    if (n < B.returnArrive) return { title: "De vuelta", sub: "Rumbo a Barcelona", next: "Llegada a Sants", at: B.returnArrive, cta: null };
    return { title: "Hasta la próxima", sub: "El viaje ha terminado", next: null, at: null, cta: null };
  }

  function legState(el, n) {
    var s = new Date(el.getAttribute("data-start")), e = new Date(el.getAttribute("data-end"));
    return n >= e ? "past" : (n >= s ? "active" : "future");
  }
  var SL = { past: "Hecho", active: "Ahora", future: "Próximo" };

  // ---- Surf data-viz: tide curve + wave bars ----
  // Tide extremes per day (CEST). [minutesFromMidnight, heightM, kind] kind: "B" bajamar / "P" pleamar.
  var TIDES = {
    "2026-06-20": [[137, 0.17, "B"], [517, 3.38, "P"], [870, 0.44, "B"], [1256, 3.67, "P"]],
    "2026-06-21": [[191, 0.36, "B"], [571, 3.20, "P"], [923, 0.62, "B"], [1311, 3.46, "P"]],
    "2026-06-22": [[246, 0.57, "B"], [627, 3.03, "P"], [980, 0.80, "B"], [1369, 3.24, "P"]],
    "2026-06-23": [[304, 0.75, "B"], [687, 2.91, "P"], [1042, 0.95, "B"], [1430, 3.05, "P"]],
    "2026-06-24": [[363, 0.89, "B"], [750, 2.85, "P"], [1107, 1.03, "B"]]
  };
  var SUNRISE = 390, SUNSET = 1310;              // ~06:30 / ~21:50 in minutes
  var TIDE_HMAX = 3.8;                           // y-axis ceiling (m)
  var VB_W = 720, VB_H = 250, PAD_T = 30, PAD_B = 26;
  var PLOT_H = VB_H - PAD_T - PAD_B;
  var tideSel = "2026-06-20";

  function tX(min) { return min / 1440 * VB_W; }
  function tY(h) { return PAD_T + (1 - Math.min(h, TIDE_HMAX) / TIDE_HMAX) * PLOT_H; }
  function hhmm(min) { var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
  function nf1(x) { return x.toFixed(1).replace(".", ","); }   // es decimal comma

  // Phantom anchors before first / after last extreme so the curve flows past 00:00 and 24:00.
  function tideAnchors(ex) {
    var a = ex.slice();
    var g0 = a[1][0] - a[0][0]; a.unshift([a[0][0] - g0, a[1][1]]);
    var m = a.length, gN = a[m - 1][0] - a[m - 2][0]; a.push([a[m - 1][0] + gN, a[m - 2][1]]);
    return a;
  }
  function tideHeight(anch, min) {
    for (var i = 0; i < anch.length - 1; i++) {
      var A = anch[i], Bp = anch[i + 1];
      if (min >= A[0] && min <= Bp[0]) { var f = (min - A[0]) / (Bp[0] - A[0]); return A[1] + (Bp[1] - A[1]) * (1 - Math.cos(f * Math.PI)) / 2; }
    }
    return min < anch[0][0] ? anch[0][1] : anch[anch.length - 1][1];
  }

  function renderTide(dateStr) {
    var ex = TIDES[dateStr]; if (!ex) return;
    tideSel = dateStr;
    var anch = tideAnchors(ex), svg = document.getElementById("tideSvg");
    document.querySelectorAll(".tide-day").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-tdate") === dateStr ? "true" : "false"); });

    var pts = [], step = 12;
    for (var min = 0; min <= 1440; min += step) pts.push([tX(min), tY(tideHeight(anch, min))]);
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = line + " L" + VB_W + " " + (PAD_T + PLOT_H) + " L0 " + (PAD_T + PLOT_H) + " Z";

    var hs = ex.map(function (e) { return e[1]; }), midY = tY((Math.min.apply(null, hs) + Math.max.apply(null, hs)) / 2);

    var s = "";
    s += '<rect class="tide-night" x="0" y="' + PAD_T + '" width="' + tX(SUNRISE) + '" height="' + PLOT_H + '"/>';
    s += '<rect class="tide-night" x="' + tX(SUNSET) + '" y="' + PAD_T + '" width="' + (VB_W - tX(SUNSET)) + '" height="' + PLOT_H + '"/>';
    [0, 6, 12, 18, 24].forEach(function (h) {
      var x = tX(h * 60);
      if (h > 0 && h < 24) s += '<line class="tide-grid" x1="' + x + '" y1="' + PAD_T + '" x2="' + x + '" y2="' + (PAD_T + PLOT_H) + '"/>';
      var anchor = h === 0 ? "start" : h === 24 ? "end" : "middle";
      s += '<text class="tide-axis" x="' + x + '" y="' + (VB_H - 8) + '" text-anchor="' + anchor + '">' + (h < 10 ? "0" : "") + h + ":00</text>";
    });
    s += '<line class="tide-mid" x1="0" y1="' + midY.toFixed(1) + '" x2="' + VB_W + '" y2="' + midY.toFixed(1) + '"/>';
    s += '<path class="tide-fill" d="' + area + '"/>';
    s += '<path class="tide-curve" d="' + line + '"/>';

    var desc = [];
    ex.forEach(function (e) {
      var x = tX(e[0]), y = tY(e[1]), high = e[2] === "P";
      var ax = x < 70 ? "start" : x > VB_W - 70 ? "end" : "middle";
      // Two stacked label rows on the open side of the dot (below a peak, above a trough) so they never overlap.
      var lTime = high ? (y + 18) : (y - 30);
      var lKind = high ? (y + 33) : (y - 15);
      s += '<circle class="tide-dot" cx="' + x + '" cy="' + y.toFixed(1) + '" r="4"/>';
      s += '<text class="tide-lbl" x="' + x + '" y="' + lTime.toFixed(1) + '" text-anchor="' + ax + '">' + hhmm(e[0]) + "</text>";
      s += '<text class="tide-extkind" x="' + x + '" y="' + lKind.toFixed(1) + '" text-anchor="' + ax + '">' + (high ? "P" : "B") + " " + nf1(e[1]) + " m</text>";
      desc.push((high ? "pleamar" : "bajamar") + " a las " + hhmm(e[0]) + " de " + nf1(e[1]) + " metros");
    });
    s += '<g id="tideNow" style="display:none"><line class="tide-now-line" x1="0" y1="' + PAD_T + '" x2="0" y2="' + (PAD_T + PLOT_H) + '"/><circle class="tide-now-dot" cx="0" cy="' + (PAD_T + PLOT_H) + '" r="4.5"/></g>';

    svg.innerHTML = s;
    document.getElementById("tideDesc").textContent = "Marea en Laga el " + dateStr + ": " + desc.join(", ") + ".";
  }

  function renderTideLive(n) {
    var ds = mDate(n), inWindow = (n >= TRIP_START && n <= TRIP_END);
    // First paint: draw the default day BEFORE querying #tideNow (which only exists once a curve is drawn).
    if (!renderTideLive._init) {
      renderTideLive._init = true;
      renderTide((inWindow && TIDES[ds]) ? ds : "2026-06-20");
    }
    var g = document.getElementById("tideNow"); if (!g) return;
    // The live "you are here" marker only belongs on today's curve; browsing another day hides it by design.
    if (inWindow && tideSel === ds && TIDES[ds]) {
      var min = madridMinutes(n);
      var anch = tideAnchors(TIDES[ds]), x = tX(min), y = tY(tideHeight(anch, min));
      g.style.display = "";
      var ln = g.querySelector("line"); ln.setAttribute("x1", x.toFixed(1)); ln.setAttribute("x2", x.toFixed(1));
      var dot = g.querySelector("circle"); dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", y.toFixed(1));
    } else g.style.display = "none";
  }

  var WAVES = [
    { d: "2026-06-20", lbl: "Sáb", v: 0.7 }, { d: "2026-06-21", lbl: "Dom", v: 0.7 },
    { d: "2026-06-22", lbl: "Lun", v: 0.5 }, { d: "2026-06-23", lbl: "Mar", v: 0.4 },
    { d: "2026-06-24", lbl: "Mié", v: null }
  ];
  function renderWaves(todayStr) {
    var box = document.getElementById("waveBars"); if (!box) return;
    var max = 1.0;
    box.innerHTML = WAVES.map(function (w) {
      var today = w.d === todayStr;
      if (w.v == null) return '<div class="bar-col na' + (today ? " today" : "") + '">' +
        '<div class="bar-na">vuelta</div><div class="bar-track"><div class="bar-fill" style="height:0"></div></div>' +
        '<div class="bar-day">' + w.lbl + "</div></div>";
      var pct = Math.round(Math.min(w.v / max, 1) * 100);
      return '<div class="bar-col' + (today ? " today" : "") + '">' +
        '<div class="bar-val">' + nf1(w.v) + ' m</div>' +
        '<div class="bar-track"><div class="bar-fill" style="height:' + pct + '%"></div></div>' +
        '<div class="bar-day">' + w.lbl + "</div></div>";
    }).join("");
  }

  // ---- main render (idempotent; skips DOM work when the minute-level signature is unchanged) ----
  function render() {
    var n = now(), ph = phase(n), ds = mDate(n), mins = madridMinutes(n);
    var sig = ph.title + "|" + ph.sub + "|" + ds + "|" + mins + "|" + tideSel + "|" + (navigator.onLine ? 1 : 0);
    if (sig === render._last) return;
    render._last = sig;

    // hero
    document.getElementById("heroTitle").textContent = ph.title;
    document.getElementById("heroSub").textContent = ph.sub;
    var cdt = document.getElementById("heroCdText");
    if (ph.at && ph.next) cdt.innerHTML = "<b>" + ph.next + "</b> · <span class='mono'>" + delta(ph.at - n) + "</span>";
    else cdt.textContent = "Hasta el próximo viaje";

    // rail mini status
    document.getElementById("railNow").textContent = ph.title;
    var rn = document.getElementById("railNext");
    rn.innerHTML = (ph.at && ph.next) ? ("<svg class='ic'><use href='#i-clock'/></svg> " + delta(ph.at - n)) : "";

    // ribbon day states
    document.querySelectorAll(".rday").forEach(function (c) {
      var d = c.getAttribute("data-date");
      c.classList.remove("past", "today");
      if (d === ds) c.classList.add("today"); else if (d < ds) c.classList.add("past");
    });
    // now-line positioned by calendar day index (6 equal cells Jun 19..24) + fraction through the Madrid day
    var nl = document.getElementById("nowLine");
    var dayIndex = Math.round((Date.parse(ds + "T00:00:00Z") - RIBBON_DAY0) / 864e5);
    if (dayIndex >= 0 && dayIndex <= 5) { nl.style.display = "block"; nl.style.left = ((dayIndex + mins / 1440) / 6 * 100) + "%"; }
    else nl.style.display = "none";

    // today card
    document.getElementById("todayH").textContent = ph.title;
    document.getElementById("todayWhere").textContent = ph.sub;
    var strip = document.getElementById("todayStrip");
    var row = document.querySelector('.fday[data-date="' + ds + '"]');
    if (row) {
      var t = row.querySelector(".fd-t").textContent, rows = row.querySelectorAll(".fd-row");
      strip.innerHTML = '<span class="tag accent"><svg class="ic"><use href="#i-thermo"/></svg>' + t + "</span>" +
        Array.prototype.map.call(rows, function (r) { return '<span class="tag">' + r.innerHTML + "</span>"; }).join("");
    } else {
      strip.innerHTML = '<span class="tag"><svg class="ic"><use href="#i-cal"/></svg>20–24 junio · Urdaibai</span>';
    }
    var cta = document.getElementById("todayCta");
    if (ph.cta) { cta.href = ph.cta[0]; document.getElementById("todayCtaText").textContent = ph.cta[1]; cta.style.display = ""; }
    else cta.style.display = "none";

    // legs
    var anyPast = false;
    document.querySelectorAll(".leg").forEach(function (el) {
      var s = legState(el, n);
      el.classList.remove("past", "active", "future"); el.classList.add(s);
      if (s === "past") anyPast = true;
      var t = el.querySelector("[data-state]"); if (t) t.textContent = SL[s];
    });
    document.getElementById("togglePast").style.display = anyPast ? "inline-flex" : "none";
    var lw = document.getElementById("lagaWhere");
    if (lw && n >= B.checkin && n < B.leaveLaga) lw.textContent = "Día " + lagaDay(n) + " de 4 · surf y playa";

    // forecast strip today/past
    document.querySelectorAll(".fday").forEach(function (c) {
      var d = c.getAttribute("data-date");
      c.classList.remove("today", "past");
      if (d === ds) c.classList.add("today"); else if (d < ds) c.classList.add("past");
    });

    // surf diagrams
    renderTideLive(n);
    renderWaves(ds);

    // footer clock
    document.getElementById("clock").textContent = n.toLocaleString("es-ES", { timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  // ---- tabs: view switcher with roving tabindex + arrow-key nav ----
  var TABS = ["hoy", "ruta", "surf", "despensa", "mapa"];
  var views = document.querySelectorAll(".view");

  function selectTab(tab) {
    views.forEach(function (v) { v.classList.toggle("active", v.id === "view-" + tab); });
    document.querySelectorAll("[data-tab]").forEach(function (b) {
      var on = b.getAttribute("data-tab") === tab;
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      b.tabIndex = on ? 0 : -1;
    });
    window.scrollTo({ top: 0 });
    if (history.replaceState) history.replaceState(null, "", "#" + tab);
  }

  document.querySelectorAll("[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () { selectTab(b.getAttribute("data-tab")); });
  });

  function setupArrowNav(container) {
    if (!container) return;
    container.addEventListener("keydown", function (e) {
      var btns = Array.prototype.slice.call(container.querySelectorAll("[data-tab]"));
      var i = btns.indexOf(document.activeElement); if (i < 0) return;
      var to = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (i + 1) % btns.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (i - 1 + btns.length) % btns.length;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = btns.length - 1;
      else return;
      e.preventDefault();
      btns[to].focus();
      selectTab(btns[to].getAttribute("data-tab"));
    });
  }
  setupArrowNav(document.querySelector(".rail"));
  setupArrowNav(document.querySelector(".tabbar"));

  var initial = (location.hash || "").replace("#", "");
  selectTab(TABS.indexOf(initial) >= 0 ? initial : "hoy");

  // toggle past legs
  document.getElementById("togglePast").addEventListener("click", function () {
    var on = document.body.classList.toggle("show-past");
    this.lastChild.textContent = on ? " Ocultar lo pasado" : " Ver también lo ya pasado";
  });

  // tide day selector
  document.querySelectorAll(".tide-day").forEach(function (b) {
    b.addEventListener("click", function () { renderTide(b.getAttribute("data-tdate")); renderTideLive(now()); });
  });

  // offline banner. Keep the class toggle HERE, not inside render(): render() early-returns on an
  // unchanged minute signature, so it cannot own state that must flip the instant connectivity changes.
  function net() { document.body.classList.toggle("is-offline", !navigator.onLine); render(); }
  addEventListener("online", net); addEventListener("offline", net); net();

  // ---- live updates: minute-granularity, so a 30s tick plus focus/visibility is plenty ----
  render();
  setInterval(render, 30000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) render(); });
  window.addEventListener("focus", render);

  // drop hero boot animation class after it runs so re-selects do not replay it
  setTimeout(function () { var h = document.querySelector(".hero"); if (h) h.classList.remove("boot"); }, 1200);

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("/sw.js").catch(function () { });
  }
})();
