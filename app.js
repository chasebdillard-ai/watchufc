/* WatchUFC: home rails, events by number, years, type hubs, search, in-page player, Continue Watching. Data: inlined #data (short keys). */
(function () {
  "use strict";
  var doc = document, main = doc.getElementById("main");
  var RAW = {};
  try { RAW = JSON.parse(doc.getElementById("data").textContent || "{}"); } catch (e) { RAW = {}; }
  doc.getElementById("data").textContent = ""; // free the string
  var CHN = RAW.c || [], EVR = RAW.e || [], VR = RAW.v || [], GEN = RAW.g || "";
  RAW = null;
  var TN = { E: "Full Event", F: "Full Fight", P: "Press Conference", W: "Weigh-ins & Faceoffs", I: "Interview & Media Day", D: "Embedded & Docs", H: "Highlights & Recaps", O: "More" };
  var TPL = { E: "Full Events", F: "Full Fights & Free Fights", P: "Press Conferences", W: "Weigh-ins & Faceoffs", I: "Interviews & Media Day", D: "Embedded, Countdown & Docs", H: "Highlights & Recaps", O: "More Videos" };
  var TORDER = ["E", "F", "P", "W", "I", "D", "H", "O"];
  var KIND = { num: "Numbered Event", fn: "Fight Night", espn: "UFC on ESPN", fox: "UFC on Fox", abc: "UFC on ABC", fx: "UFC on FX", fuel: "UFC on Fuel TV", live: "UFC Live", tuf: "TUF Finale", dwcs: "Contender Series", bjj: "UFC BJJ", para: "UFC on Paramount+" };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* ---------- data model ---------- */
  // video: [id, title, minutes, type, eventIdx, year, channelIdx, upload yymmdd]
  var V = VR.map(function (r, i) { return { id: r[0], t: r[1], m: r[2], ty: r[3], e: r[4], y: r[5], c: r[6], u: r[7], i: i }; });
  VR = null;
  var E = EVR.map(function (r, i) { return { i: i, n: r[0], d: r[1], k: r[2], num: r[3], loc: r[4] || "", v: [] }; });
  V.forEach(function (v) { if (v.e >= 0 && E[v.e]) E[v.e].v.push(v); });
  var BYNUM = {}; E.forEach(function (e) { if (e.num) BYNUM[e.num] = e; });
  var TODAY0 = new Date().toISOString().slice(0, 10), MAXNUM = 0; E.forEach(function (e) { if (e.num && e.d && e.d <= TODAY0 && e.num > MAXNUM) MAXNUM = e.num; });
  var NUMS_ALL = (window.UFC_NUMS || null);
  var TODAY = new Date().toISOString().slice(0, 10);
  var byType = {}; TORDER.forEach(function (k) { byType[k] = []; });
  V.forEach(function (v) { (byType[v.ty] || byType.O).push(v); });
  function newest(a, b) { return b.u - a.u || a.i - b.i; }
  function oldest(a, b) { return (a.y || 9999) - (b.y || 9999) || a.u - b.u || a.i - b.i; }
  V.sort(newest); V.forEach(function (v, i) { v.i = i; });
  TORDER.forEach(function (k) { byType[k].sort(newest); });
  var YEARS = {}; V.forEach(function (v) { if (v.y) (YEARS[v.y] = YEARS[v.y] || []).push(v); });

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function thumb(id, q) { return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/" + (q || "mqdefault") + ".jpg"; }
  function hm(m) { m = m || 0; var h = Math.floor(m / 60), r = m % 60; return h ? h + "h" + (r ? " " + r + "m" : "") : r + "m"; }
  function fdate(d) { if (!d) return ""; var p = d.split("-"); return MON[+p[1] - 1] + " " + (+p[2]) + ", " + p[0]; }
  function n(x) { return Number(x).toLocaleString("en-US"); }
  function plural(k, one, many) { return n(k) + " " + (k === 1 ? one : (many || one + "s")); }
  function evShort(e) { var m = e.n.match(/^UFC (\d+)(?::\s*(.+))?$/); return m ? { a: "UFC " + m[1], b: m[2] || "" } : { a: e.n.replace(/^UFC Fight Night:\s*/, "Fight Night: "), b: "" }; }
  function evThumb(e) {
    if (!e.v.length) return "";
    var pick = null;
    ["E", "P", "W", "F", "D", "I", "H", "O"].some(function (t) { pick = e.v.filter(function (v) { return v.ty === t; })[0]; return !!pick; });
    return thumb((pick || e.v[0]).id, "hqdefault");
  }
  function past(e) { return e.d && e.d <= TODAY; }

  /* ---------- contexts for Up next ---------- */
  var CTX = {}, CTXN = 0;
  function ctx(list) { var k = "c" + (++CTXN); CTX[k] = list; return k; }
  var PLAY = '<svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>';
  function card(v, cx, pos, o) {
    o = o || {};
    var e = v.e >= 0 ? E[v.e] : null, meta = [];
    if (!o.noEv && e) meta.push(evShort(e).a);
    meta.push(TN[v.ty]);
    if (v.y && !o.noYear) meta.push(v.y);
    var tag = v.ty === "E" ? '<span class="tag">Full Event</span>' : v.ty === "F" ? '<span class="tag tag--gold">Full Fight</span>' : "";
    return '<button class="card' + (o.playing ? " is-playing" : "") + '" type="button" data-cx="' + cx + '" data-pos="' + pos + '" aria-label="' + esc("Play " + v.t + ", " + hm(v.m)) + '">' +
      '<span class="thumb"><img src="' + thumb(v.id) + '" alt="" loading="lazy" decoding="async" />' + (o.pin ? '<span class="tag tag--dark">' + esc(o.pin) + "</span>" : tag) +
      '<span class="dur">' + hm(v.m) + "</span></span><b>" + esc(v.t) + "</b><small>" + esc(meta.join(" · ")) + "</small></button>";
  }
  function cards(list, o) { var k = ctx(list); return list.map(function (v, i) { return card(v, k, i, o); }).join(""); }
  function evTile(e) {
    var s = evShort(e), th = evThumb(e), isNum = e.k === "num";
    return '<button class="ev' + (e.v.length ? "" : " ev--none") + '" type="button" data-ev="' + e.i + '" aria-label="' + esc(e.n + ", " + fdate(e.d) + ", " + plural(e.v.length, "video")) + '">' +
      (th ? '<img src="' + th + '" alt="" loading="lazy" decoding="async" />' : "") +
      (isNum ? '<span class="ev__num"><em>UFC</em>' + e.num + "</span>" : "") +
      '<span class="ev__name">' + esc(isNum ? s.b : s.a) + "</span>" +
      '<span class="ev__meta">' + esc([e.d ? e.d.slice(0, 4) : "", e.v.length ? plural(e.v.length, "video") : "No uploads yet"].filter(Boolean).join(" · ")) + "</span></button>";
  }
  function sec(title, inner, moreHref, extra) {
    return '<section class="sec"><div class="shead"><h2 class="h2">' + esc(title) + "</h2>" + (moreHref ? '<a class="more" href="' + moreHref + '">See all</a>' : "") + "</div>" + (extra || "") + inner + "</section>";
  }
  function rail(list, o) { return list.length ? '<div class="rail">' + cards(list, o) + "</div>" : ""; }

  /* ---------- batched grid (keeps DOM small on iPhone) ---------- */
  var BATCH = 36, io = null, pending = [];
  function batched(el, list, o) {
    var k = ctx(list), shown = 0, btn = doc.createElement("button");
    btn.className = "loadmore"; btn.type = "button";
    var grid = doc.createElement("div"); grid.className = "grid";
    el.appendChild(grid); el.appendChild(btn);
    function more() {
      var end = Math.min(list.length, shown + BATCH), h = "";
      for (var i = shown; i < end; i++) h += card(list[i], k, i, o);
      grid.insertAdjacentHTML("beforeend", h); shown = end;
      btn.hidden = shown >= list.length; btn.textContent = "Load more · " + n(list.length - shown) + " left";
    }
    btn.addEventListener("click", more); more();
    if (!list.length) grid.innerHTML = '<p class="empty">Nothing here yet.</p>';
    if ("IntersectionObserver" in window) {
      var ob = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting && !btn.hidden && btn.isConnected) more(); }); }, { rootMargin: "0px 0px 700px 0px" });
      ob.observe(btn); pending.push(ob);
    }
  }
  function clearObs() { pending.forEach(function (o) { try { o.disconnect(); } catch (e) {} }); pending = []; CTX = {}; CTXN = 0; }

  /* ---------- Continue Watching (this device, localStorage "ufc_cw") ---------- */
  var CWK = "ufc_cw", IDX = {};
  V.forEach(function (v) { IDX[v.id] = v; });
  function cwLoad() { try { var a = JSON.parse(localStorage.getItem(CWK) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function cwSave(a) { try { localStorage.setItem(CWK, JSON.stringify(a.slice(0, 20))); } catch (e) {} }
  function cwRecord(v) { var a = cwLoad(), old = null; a = a.filter(function (x) { if (x.id === v.id) { old = x; return false; } return true; }); a.unshift({ id: v.id, ts: Date.now(), prog: old ? old.prog || 0 : 0, dur: old && old.dur ? old.dur : v.m * 60 }); cwSave(a); }
  function cwProgress(id, t, d) { var a = cwLoad(), ch = false; a.forEach(function (x) { if (x.id === id) { if (d > 0) x.dur = Math.round(d); x.prog = d > 0 && t > d - 30 ? 0 : Math.round(t); ch = true; } }); if (ch) cwSave(a); }
  function cwStart(id) { var a = cwLoad(); for (var i = 0; i < a.length; i++) if (a[i].id === id) { var x = a[i]; if (!x.prog || x.prog <= 10 || (x.dur && x.prog >= x.dur - 30)) return 0; return x.prog; } return 0; }
  function cwRow() {
    var a = cwLoad().filter(function (x) { return IDX[x.id]; });
    if (!a.length) return "";
    var list = a.map(function (x) { return IDX[x.id]; }), k = ctx(list);
    return '<section class="sec" id="cw"><div class="shead"><h2 class="h2">Continue Watching</h2></div><div class="rail">' + a.map(function (x, i) {
      var v = IDX[x.id], d = x.dur || v.m * 60, pct = x.prog && d ? Math.max(3, Math.min(100, Math.round(x.prog / d * 100))) : 0;
      var h = card(v, k, i);
      if (pct) h = h.replace('<span class="dur">', '<span style="position:absolute;left:0;right:0;bottom:0;height:5px;background:#ffffff40"><span style="display:block;height:100%;width:' + pct + '%;background:#ff2a2a"></span></span><span class="dur" style="bottom:11px">');
      return '<div style="position:relative">' + h + '<button type="button" data-cwx="' + esc(x.id) + '" aria-label="Remove from Continue Watching" style="position:absolute;top:6px;right:6px;width:30px;height:30px;border-radius:50%;border:2px solid #fff;background:#000c;color:#fff;font:700 16px/1 sans-serif;cursor:pointer;padding:0">×</button></div>';
    }).join("") + "</div></section>";
  }
  var cwStop = function () {};
  function cwWatch(f, id) {
    var T = -1, D = 0, heard = false, saved = -1;
    function ping() { try { f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (x) {} }
    function onMsg(ev) {
      if (!f.contentWindow || ev.source !== f.contentWindow) return;
      var m = ev.data; if (typeof m === "string") { try { m = JSON.parse(m); } catch (x) { return; } }
      if (!m || !m.info) return; heard = true;
      if (typeof m.info.currentTime === "number") T = m.info.currentTime;
      if (typeof m.info.duration === "number" && m.info.duration > 0) D = m.info.duration;
    }
    function flush() { if (T >= 0 && Math.round(T) !== saved) { saved = Math.round(T); cwProgress(id, T, D); } }
    function onHide() { if (doc.visibilityState === "hidden") flush(); }
    window.addEventListener("message", onMsg); f.addEventListener("load", ping);
    var p = setInterval(function () { if (!heard) ping(); }, 2000), s = setInterval(flush, 15000);
    doc.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", flush);
    return function () { flush(); clearInterval(p); clearInterval(s); window.removeEventListener("message", onMsg); doc.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flush); };
  }

  /* ---------- player ---------- */
  var sheet = doc.getElementById("sheet"), stage = doc.getElementById("stage"), app = doc.getElementById("top"), lastFocus = null, SCTX = {};
  function openPlayer(list, pos, from) {
    var v = list && list[pos]; if (!v) return;
    if (sheet.hidden) lastFocus = from || doc.activeElement;
    try { cwStop(); } catch (x) {} cwStop = function () {};
    cwRecord(v);
    var start = cwStart(v.id), org = /^https?:/.test(location.origin || "") ? location.origin : "";
    stage.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + "?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1" +
      (org ? "&origin=" + encodeURIComponent(org) : "") + (start ? "&start=" + start : "") + '" title="' + esc(v.t) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    try { cwStop = cwWatch(stage.querySelector("iframe"), v.id); } catch (x) {}
    var e = v.e >= 0 ? E[v.e] : null;
    doc.getElementById("s-kick").textContent = [TN[v.ty], e ? evShort(e).a : "", CHN[v.c]].filter(Boolean).join(" · ");
    doc.getElementById("s-title").textContent = v.t;
    doc.getElementById("s-meta").textContent = [hm(v.m), v.y ? String(v.y) : "", e && e.d ? fdate(e.d) : ""].filter(Boolean).join(" · ");
    doc.getElementById("s-acts").innerHTML = (e ? '<a class="btn btn--gold" href="#e/' + e.i + '" data-close-sheet="1">' + esc(e.k === "num" ? "UFC " + e.num + " event page" : "Event page") + "</a>" : "") +
      (v.y ? '<a class="btn btn--ghost" href="#y/' + v.y + '" data-close-sheet="1">' + v.y + "</a>" : "") +
      '<a class="btn btn--ghost" href="https://www.youtube.com/watch?v=' + encodeURIComponent(v.id) + '" target="_blank" rel="noopener">YouTube ↗</a>';
    // up next: rest of this list, then wrap
    var nx = [], k = "next";
    for (var i = 1; i < list.length && nx.length < 14; i++) nx.push(list[(pos + i) % list.length]);
    SCTX.list = list; SCTX.pos = pos;
    var sx = ctx(nx);
    doc.getElementById("s-next").innerHTML = nx.map(function (x, j) { return card(x, sx, j); }).join("");
    doc.getElementById("s-next-sec").hidden = !nx.length;
    if (sheet.hidden) {
      sheet.hidden = false; app.inert = true; doc.documentElement.style.overflow = "hidden";
      try { history.pushState({ sheet: 1 }, "", location.hash || "#home"); } catch (x) {}
      doc.getElementById("sheet-close").focus();
    }
    doc.getElementById("sheet-scroll").scrollTop = 0;
  }
  function closePlayer(fromPop) {
    if (sheet.hidden) return;
    try { cwStop(); } catch (x) {} cwStop = function () {};
    sheet.hidden = true; stage.innerHTML = ""; app.inert = false; doc.documentElement.style.overflow = "";
    if (!fromPop) { try { if (history.state && history.state.sheet) history.back(); } catch (x) {} }
    if (current === "home") { var old = doc.getElementById("cw"), html = cwRow(), hero = main.querySelector(".hero"); if (old) old.outerHTML = html; else if (html && hero) hero.insertAdjacentHTML("afterend", html); }
    if (lastFocus && lastFocus.focus && doc.contains(lastFocus)) lastFocus.focus();
  }
  doc.getElementById("sheet-close").addEventListener("click", function () { closePlayer(false); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) closePlayer(false); });
  window.addEventListener("popstate", function () { if (!sheet.hidden) closePlayer(true); });

  /* ---------- views ---------- */
  var current = "home";
  function latestNumbered() { var best = null; E.forEach(function (e) { if (e.k === "num" && e.v.length && past(e) && (!best || e.num > best.num)) best = e; }); return best; }
  function homeView() {
    var h = "", ln = latestNumbered(), fe = byType.E, nEv = E.filter(function (e) { return e.v.length; }).length;
    var feat = ln ? '<button class="feat" type="button" data-ev="' + ln.i + '"><small>Latest numbered event</small><strong>' + esc(ln.n) + "</strong><span>" + esc(fdate(ln.d) + (ln.loc ? " · " + ln.loc : "") + " · " + plural(ln.v.length, "video")) + "</span></button>" : "";
    h += '<div class="hero"><img class="hero__bg" src="hero.jpg" alt="" fetchpriority="high" /><div class="hero__in">' +
      '<span class="eyebrow">Walk out. Lights up. Fight.</span><h1>Enter the <b>Octagon</b></h1>' +
      "<p>Every official UFC upload on YouTube, in one arena: full events, free fights, press conferences, weigh-ins and the stories behind them.</p>" +
      '<div class="stats"><span class="stat"><b>' + n(V.length) + "</b> videos</span><span class=\"stat\"><b>" + n(byType.F.length) + "</b> full fights</span><span class=\"stat\"><b>" + n(nEv) + "</b> events</span><span class=\"stat\">UFC <b>1–" + MAXNUM + "</b></span></div>" +
      feat + '<div class="btns">' + (ln ? '<button class="btn btn--red" type="button" data-play-ev="' + ln.i + '">' + PLAY + " Watch UFC " + ln.num + "</button>" : "") +
      '<a class="btn btn--ghost" href="#events">Browse events</a></div></div></div>';
    h += cwRow();
    h += sec("Latest", rail(V.slice(0, 20)), "#t/all");
    var feL = fe.filter(function (v) { return v.e >= 0; }).sort(function (a, b) { return (E[b.e].d || "") < (E[a.e].d || "") ? -1 : 1; });
    h += sec("Full Events", rail(feL.concat(fe.filter(function (v) { return v.e < 0; })).slice(0, 20)), "#t/E");
    h += sec("Free Fights", rail(byType.F.filter(function (v) { return v.c <= 1 && /full fight|free fight/i.test(v.t); }).slice(0, 20)), "#t/F");
    h += sec("Press Conferences", rail(byType.P.slice(0, 20)), "#t/P");
    var nums = E.filter(function (e) { return e.k === "num" && e.v.length && past(e); }).sort(function (a, b) { return b.num - a.num; }).slice(0, 18);
    h += sec("Numbered Events", '<div class="rail rail--ev">' + nums.map(evTile).join("") + "</div>", "#events");
    var fns = E.filter(function (e) { return e.k !== "num" && e.v.length && past(e) && e.k !== "dwcs" && e.k !== "bjj"; }).sort(function (a, b) { return a.d < b.d ? 1 : -1; }).slice(0, 18);
    h += sec("Fight Nights", '<div class="rail rail--ev">' + fns.map(evTile).join("") + "</div>", "#fightnights");
    h += sec("Interviews & Media Day", rail(byType.I.slice(0, 20)), "#t/I");
    h += sec("Embedded & Countdown", rail(byType.D.slice(0, 20)), "#t/D");
    h += sec("Weigh-ins & Faceoffs", rail(byType.W.slice(0, 20)), "#t/W");
    h += sec("Highlights & Recaps", rail(byType.H.slice(0, 20)), "#t/H");
    var yrs = Object.keys(YEARS).map(Number).sort(function (a, b) { return b - a; });
    h += sec("Browse by Year", '<div class="chips">' + yrs.map(function (y) { return '<a class="chip" href="#y/' + y + '">' + y + "<small>" + n(YEARS[y].length) + "</small></a>"; }).join("") + "</div>", "#years");
    main.innerHTML = '<div class="view">' + h + "</div>";
  }
  function eventsView() {
    var nums = [], hi = 0; E.forEach(function (e) { if (e.num && e.num > hi && past(e)) hi = e.num; });
    for (var i = 1; i <= hi; i++) nums.push(i);
    var has = nums.filter(function (i) { return BYNUM[i] && BYNUM[i].v.length; }).length;
    var h = '<div class="page-h"><h1 class="h1">Events by <em>Number</em></h1><p class="sub">UFC 1 to UFC ' + hi + ". <b style=\"color:var(--gold2)\">" + has + "</b> numbered events have official videos. Tap a number.</p></div>";
    h += '<div class="chips"><a class="chip" href="#events" aria-pressed="true">Numbered</a><a class="chip" href="#fightnights">Fight Nights & TV</a><a class="chip" href="#series">Contender Series, TUF & BJJ</a><a class="chip" href="#years">By year</a></div>';
    var dec = {};
    nums.forEach(function (i) { var b = Math.floor((i - 1) / 50); (dec[b] = dec[b] || []).push(i); });
    Object.keys(dec).map(Number).sort(function (a, b) { return b - a; }).forEach(function (b) {
      var L = dec[b].slice().reverse();
      h += '<section class="sec"><h2 class="h2">UFC ' + (b * 50 + 1) + "–" + Math.min(hi, b * 50 + 50) + '</h2><div class="nums">' + L.map(function (i) {
        var e = BYNUM[i], c = e ? e.v.length : 0;
        return '<button class="num ' + (c ? "num--has" : "num--none") + '" type="button" data-ev="' + (e ? e.i : -1) + '" data-num="' + i + '" aria-label="UFC ' + i + (c ? ", " + plural(c, "video") : ", no official uploads") + '">' + i + (c ? "<small>" + c + "</small>" : "") + "</button>";
      }).join("") + "</div></section>";
    });
    main.innerHTML = '<div class="view">' + h + "</div>";
  }
  function listEventsView(title, sub, filter, chip) {
    var L = E.filter(filter).sort(function (a, b) { return (b.d || "") < (a.d || "") ? -1 : 1; });
    var h = '<div class="page-h"><h1 class="h1">' + title + '</h1><p class="sub">' + sub + " · " + plural(L.length, "event") + "</p></div>";
    h += '<div class="chips"><a class="chip" href="#events">Numbered</a><a class="chip" href="#fightnights" aria-pressed="' + (chip === 1) + '">Fight Nights & TV</a><a class="chip" href="#series" aria-pressed="' + (chip === 2) + '">Contender Series, TUF & BJJ</a><a class="chip" href="#years">By year</a></div>';
    var by = {}; L.forEach(function (e) { var y = e.d ? e.d.slice(0, 4) : "Other"; (by[y] = by[y] || []).push(e); });
    Object.keys(by).sort().reverse().forEach(function (y) { h += '<section class="sec"><h2 class="h2">' + y + '</h2><div class="grid grid--ev">' + by[y].map(evTile).join("") + "</div></section>"; });
    main.innerHTML = '<div class="view">' + h + "</div>";
  }
  function yearsView() {
    var yrs = Object.keys(YEARS).map(Number).sort(function (a, b) { return b - a; });
    var h = '<div class="page-h"><h1 class="h1">Browse by <em>Year</em></h1><p class="sub">From UFC 1 in 1993 to tonight. Each year opens its events and every video from that year.</p></div><div class="years">';
    h += yrs.map(function (y) {
      var evs = E.filter(function (e) { return e.d && +e.d.slice(0, 4) === y && e.v.length; }).length;
      return '<a class="yr" href="#y/' + y + '"><strong>' + y + "</strong><span>" + plural(evs, "event") + " · " + plural(YEARS[y].length, "video") + "</span></a>";
    }).join("") + "</div>";
    main.innerHTML = '<div class="view">' + h + "</div>";
  }
  function yearView(y) {
    var L = YEARS[y] || [], evs = E.filter(function (e) { return e.d && +e.d.slice(0, 4) === y && (e.v.length || e.k === "num"); }).sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    var h = '<div class="page-h"><a class="back" href="#years">‹ All years</a><h1 class="h1"><em>' + y + '</em> in the Octagon</h1><p class="sub">' + plural(evs.filter(function (e) { return e.v.length; }).length, "event") + " with videos · " + plural(L.length, "video") + "</p></div>";
    if (evs.length) h += sec("Events of " + y, '<div class="grid grid--ev">' + evs.map(evTile).join("") + "</div>");
    main.innerHTML = '<div class="view">' + h + '<section class="sec"><div class="bar"><h2 class="h2">Every video from ' + y + '</h2></div><div class="chips" id="ych"></div><div id="ylist" class="sec"></div></section></div>';
    var counts = {}; L.forEach(function (v) { counts[v.ty] = (counts[v.ty] || 0) + 1; });
    var ych = doc.getElementById("ych"), cur = "all";
    function draw() {
      ych.innerHTML = ['<button class="chip" type="button" data-f="all" aria-pressed="' + (cur === "all") + '">All<small>' + n(L.length) + "</small></button>"].concat(TORDER.filter(function (t) { return counts[t]; }).map(function (t) {
        return '<button class="chip" type="button" data-f="' + t + '" aria-pressed="' + (cur === t) + '">' + esc(TPL[t]) + "<small>" + n(counts[t]) + "</small></button>";
      })).join("");
      var el = doc.getElementById("ylist"); el.innerHTML = "";
      batched(el, cur === "all" ? L : L.filter(function (v) { return v.ty === cur; }), { noYear: true });
    }
    ych.addEventListener("click", function (ev) { var b = ev.target.closest("[data-f]"); if (!b) return; cur = b.getAttribute("data-f"); draw(); });
    draw();
  }
  function eventView(i) {
    var e = E[i]; if (!e) return homeView();
    var s = evShort(e), th = evThumb(e);
    var prev = e.num ? BYNUM[e.num - 1] : null, next = e.num ? BYNUM[e.num + 1] : null;
    var h = '<div class="evhero">' + (th ? '<img src="' + th + '" alt="" />' : "") + '<div class="page-h"><a class="back" href="' + (e.k === "num" ? "#events" : "#fightnights") + '">‹ ' + (e.k === "num" ? "All numbered events" : "Fight Nights") + "</a>" +
      '<span class="eyebrow">' + esc(KIND[e.k] || "Event") + "</span>" +
      '<h1 class="h1">' + (e.num ? "UFC <em>" + e.num + "</em>" : esc(s.a)) + "</h1>" + (e.num && s.b ? '<p class="sub" style="font:700 22px/1.1 var(--cond);color:#fff;text-transform:uppercase;letter-spacing:.02em">' + esc(s.b) + "</p>" : "") +
      '<p class="sub">' + esc([fdate(e.d), e.loc].filter(Boolean).join(" · ")) + " · " + plural(e.v.length, "video") + "</p>" +
      (e.v.length ? '<div class="btns"><button class="btn btn--red" type="button" data-play-ev="' + e.i + '">' + PLAY + " Play</button>" +
        (e.d ? '<a class="btn btn--ghost" href="#y/' + e.d.slice(0, 4) + '">' + e.d.slice(0, 4) + "</a>" : "") + "</div>" : "") +
      (e.num ? '<div class="btns">' + (prev ? '<a class="btn btn--ghost" href="#e/' + prev.i + '">‹ UFC ' + prev.num + "</a>" : "") + (next ? '<a class="btn btn--ghost" href="#e/' + next.i + '">UFC ' + next.num + " ›</a>" : "") + "</div>" : "") +
      "</div></div>";
    if (!e.v.length) h += '<p class="empty">UFC has no official uploads tagged to this event on YouTube yet. Try the Free Fights hub or search for the fighters.</p>';
    var g = {}; e.v.forEach(function (v) { (g[v.ty] = g[v.ty] || []).push(v); });
    TORDER.forEach(function (t) {
      if (!g[t]) return;
      var L = g[t].slice().sort(t === "F" || t === "I" ? function (a, b) { return a.u - b.u || a.i - b.i; } : newest);
      h += '<section class="sec"><div class="shead"><h2 class="h2">' + esc(TPL[t]) + '</h2><span class="count"><b>' + L.length + "</b></span></div>" + (L.length > 8 ? '<div class="rail">' + cards(L, { noEv: true }) + "</div>" : '<div class="grid">' + cards(L, { noEv: true }) + "</div>") + "</section>";
    });
    main.innerHTML = '<div class="view">' + h + "</div>";
  }
  function typeView(t) {
    var L = t === "all" ? V : (byType[t] || []), dir = "new";
    var title = t === "all" ? "Everything, newest first" : TPL[t];
    var chs = {}; L.forEach(function (v) { chs[v.c] = (chs[v.c] || 0) + 1; });
    var ck = Object.keys(chs).map(Number).sort(function (a, b) { return chs[b] - chs[a]; }), cf = -1;
    var h = '<div class="page-h"><h1 class="h1">' + esc(title) + '</h1><p class="count" id="tcount"></p></div>' +
      '<div class="chips">' + ["all"].concat(TORDER).map(function (k) { return '<a class="chip" href="#t/' + k + '" aria-pressed="' + (k === t) + '">' + esc(k === "all" ? "All" : TPL[k]) + "</a>"; }).join("") + "</div>" +
      '<div class="bar"><div class="chips" id="tch" style="margin:0;padding:0;flex:1"></div><div class="sort" id="tsort"><button type="button" data-d="new" aria-pressed="true">Newest</button><button type="button" data-d="old" aria-pressed="false">Oldest</button></div></div><div id="tlist" class="sec"></div>';
    main.innerHTML = '<div class="view">' + h + "</div>";
    function draw() {
      var X = cf < 0 ? L : L.filter(function (v) { return v.c === cf; });
      X = X.slice().sort(dir === "new" ? newest : oldest);
      doc.getElementById("tcount").innerHTML = "<b>" + n(X.length) + "</b> videos" + (cf >= 0 ? " from " + esc(CHN[cf]) : "");
      doc.getElementById("tch").innerHTML = ck.length > 1 ? ['<button class="chip" type="button" data-c="-1" aria-pressed="' + (cf < 0) + '">All channels</button>'].concat(ck.map(function (c) { return '<button class="chip" type="button" data-c="' + c + '" aria-pressed="' + (cf === c) + '">' + esc(CHN[c]) + "<small>" + n(chs[c]) + "</small></button>"; })).join("") : "";
      [].forEach.call(doc.querySelectorAll("#tsort button"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-d") === dir)); });
      var el = doc.getElementById("tlist"); el.innerHTML = ""; batched(el, X);
    }
    doc.getElementById("tch").addEventListener("click", function (ev) { var b = ev.target.closest("[data-c]"); if (!b) return; cf = +b.getAttribute("data-c"); draw(); });
    doc.getElementById("tsort").addEventListener("click", function (ev) { var b = ev.target.closest("[data-d]"); if (!b) return; dir = b.getAttribute("data-d"); draw(); });
    draw();
  }

  /* ---------- search ---------- */
  var sBtn = doc.getElementById("search-btn"), sRow = doc.getElementById("search-row"), sIn = doc.getElementById("search-input");
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  var QI = null;
  function buildQ() { if (QI) return; QI = V.map(function (v) { var e = v.e >= 0 ? E[v.e] : null; return " " + norm(v.t + " " + (e ? e.n + " " + (e.num ? "ufc" + e.num : "") + " " + e.loc : "") + " " + (v.y || "") + " " + TN[v.ty] + " " + CHN[v.c]) + " "; }); }
  var sT = 0;
  function runSearch() {
    var q = norm(sIn.value); if (!q) { route(); return; }
    buildQ();
    var w = q.split(" "), hits = [];
    for (var i = 0; i < V.length; i++) { var s = QI[i], ok = true; for (var j = 0; j < w.length; j++) if (s.indexOf(w[j]) < 0) { ok = false; break; } if (ok) hits.push(V[i]); }
    var m = q.match(/^ufc ?(\d{1,3})$/), evHit = m && BYNUM[+m[1]];
    var evs = E.filter(function (e) { return e.v.length && w.every(function (x) { return norm(e.n + " " + e.loc + " " + (e.num ? "ufc " + e.num : "")).indexOf(x) >= 0; }); }).slice(0, 12);
    clearObs();
    main.innerHTML = '<div class="view"><div class="page-h"><h1 class="h1">Search</h1><p class="count"><b>' + n(hits.length) + "</b> videos for “" + esc(sIn.value.trim()) + "”</p></div>" +
      (evs.length ? sec("Events", '<div class="rail rail--ev">' + evs.map(evTile).join("") + "</div>") : "") + '<div id="slist" class="sec"></div></div>';
    if (hits.length) batched(doc.getElementById("slist"), hits); else doc.getElementById("slist").innerHTML = '<p class="empty">Nothing matches. Try a fighter, an event like “UFC 300”, or a year.</p>';
  }
  function openSearch() { sRow.hidden = false; sBtn.setAttribute("aria-expanded", "true"); sIn.focus(); }
  function closeSearch() { sRow.hidden = true; sBtn.setAttribute("aria-expanded", "false"); if (sIn.value) { sIn.value = ""; route(); } }
  sBtn.addEventListener("click", function () { if (sRow.hidden) openSearch(); else closeSearch(); });
  doc.getElementById("search-close").addEventListener("click", closeSearch);
  sIn.addEventListener("input", function () { clearTimeout(sT); sT = setTimeout(runSearch, 160); });
  sIn.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSearch(); if (e.key === "Enter") { sIn.blur(); } });

  /* ---------- routing ---------- */
  function route() {
    clearObs();
    var h = (location.hash || "#home").slice(1), p = h.split("/"), tab = "home";
    try {
      if (p[0] === "events") { eventsView(); tab = "events"; current = "events"; }
      else if (p[0] === "fightnights") { listEventsView("Fight <em>Nights</em> & TV", "Fight Nights and UFC on Fox, ESPN, ABC, FX and Fuel TV", function (e) { return e.v.length && ["fn", "espn", "fox", "abc", "fx", "fuel", "live", "para"].indexOf(e.k) >= 0; }, 1); tab = "events"; current = "fn"; }
      else if (p[0] === "series") { listEventsView("Contender Series, <em>TUF</em> & BJJ", "Dana White's Contender Series, The Ultimate Fighter finales and UFC BJJ", function (e) { return e.v.length && ["tuf", "dwcs", "bjj"].indexOf(e.k) >= 0; }, 2); tab = "events"; current = "series"; }
      else if (p[0] === "years") { yearsView(); tab = "years"; current = "years"; }
      else if (p[0] === "y" && p[1]) { yearView(+p[1]); tab = "years"; current = "y"; }
      else if (p[0] === "e" && p[1]) { eventView(+p[1]); tab = E[+p[1]] && E[+p[1]].k === "num" ? "events" : "events"; current = "e"; }
      else if (p[0] === "t" && p[1]) { typeView(p[1]); tab = p[1] === "F" ? "fights" : "home"; current = "t"; }
      else { homeView(); current = "home"; }
    } catch (err) { main.innerHTML = '<div class="view"><p class="empty">Something went wrong drawing this page.</p></div>'; }
    [].forEach.call(doc.querySelectorAll(".tab[data-tab]"), function (t) { if (t.getAttribute("data-tab") === tab) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function () { if (sIn.value) { sIn.value = ""; sRow.hidden = true; sBtn.setAttribute("aria-expanded", "false"); } route(); });

  /* ---------- clicks ---------- */
  function playEvent(e) {
    var L = e.v.slice(), pick = null;
    ["E", "F", "P", "W", "D", "I", "H", "O"].some(function (t) { pick = L.filter(function (v) { return v.ty === t; }); return pick.length; });
    var order = []; TORDER.forEach(function (t) { L.forEach(function (v) { if (v.ty === t) order.push(v); }); });
    openPlayer(order, order.indexOf(pick[0]));
  }
  doc.addEventListener("click", function (ev) {
    var t = ev.target;
    var x = t.closest && t.closest("[data-cwx]");
    if (x) { ev.preventDefault(); ev.stopPropagation(); var id = x.getAttribute("data-cwx"); cwSave(cwLoad().filter(function (y) { return y.id !== id; })); var old = doc.getElementById("cw"); if (old) old.outerHTML = cwRow(); return; }
    var c = t.closest && t.closest("[data-cx]");
    if (c) { ev.preventDefault(); var L = CTX[c.getAttribute("data-cx")]; openPlayer(L, +c.getAttribute("data-pos"), c); return; }
    var pe = t.closest && t.closest("[data-play-ev]");
    if (pe) { ev.preventDefault(); playEvent(E[+pe.getAttribute("data-play-ev")]); return; }
    var e = t.closest && t.closest("[data-ev]");
    if (e) { ev.preventDefault(); var i = +e.getAttribute("data-ev"); if (i >= 0) location.hash = "#e/" + i; return; }
    var cs = t.closest && t.closest("[data-close-sheet]");
    if (cs) { var href = cs.getAttribute("href"); ev.preventDefault(); closePlayer(false); setTimeout(function () { location.hash = href; }, 60); return; }
    var lv = t.closest && t.closest("[data-live],#live-btn");
    if (lv) { ev.preventDefault(); if (window.__lvOpen) window.__lvOpen(); return; }
  });

  if (GEN) doc.getElementById("gen").textContent = "Catalog updated " + GEN.slice(0, 4) + "-" + GEN.slice(4, 6) + "-" + GEN.slice(6, 8) + ".";
  route();
  window.UFC_TOTAL = { videos: V.length, events: E.length };
})();
