(function () {
  "use strict";

  var EMBED = {
    "stats": [
      {
        "label": "Lapisan Peta",
        "value": 57
      },
      {
        "label": "Sumber Berita",
        "value": 461
      },
      {
        "label": "Penyedia Data",
        "value": 750
      },
      {
        "label": "Sumber Peringatan",
        "value": 5
      }
    ],
    "signals": [
      {
        "kicker": "LISTRIK",
        "title": "Pemakaian listrik naik 9% di tiga wilayah menjelang jam sibuk.",
        "src": "Data listrik",
        "ago": "2m"
      },
      {
        "kicker": "HARGA",
        "title": "Harga komoditas di Asia makin berjarak antara tawaran jual dan beli.",
        "src": "Data pasar",
        "ago": "4m"
      },
      {
        "kicker": "KAPAL",
        "title": "Lalu lintas kapal di selat meningkat; jalur pengiriman mulai padat.",
        "src": "Data kapal",
        "ago": "7m"
      },
      {
        "kicker": "CUACA",
        "title": "Badai tropis mendekati pesisir timur; peringatan banjir dan longsor dikeluarkan.",
        "src": "Data cuaca",
        "ago": "9m"
      },
      {
        "kicker": "LOGISTIK",
        "title": "Antrean truk di gerbang pelabuhan makin panjang; keterlambatan bertambah.",
        "src": "Data logistik",
        "ago": "11m"
      },
      {
        "kicker": "JARINGAN",
        "title": "Gangguan di salah satu jalur internet utama; penyedia mulai mengalihkan lalu lintas.",
        "src": "Data jaringan",
        "ago": "13m"
      }
    ],
    "sectors": [
      {
        "flag": "🇺🇦",
        "code": "UA",
        "val": 82
      },
      {
        "flag": "🇷🇺",
        "code": "RU",
        "val": 76
      },
      {
        "flag": "🇸🇾",
        "code": "SY",
        "val": 72
      },
      {
        "flag": "🇮🇷",
        "code": "IR",
        "val": 70
      },
      {
        "flag": "🇲🇽",
        "code": "MX",
        "val": 70
      }
    ],
    "chokepoints": [
      {
        "name": "Selat Lombok",
        "status": "tersendat",
        "val": 70
      },
      {
        "name": "Selat Sunda",
        "status": "tersendat",
        "val": 68
      },
      {
        "name": "Selat Malaka",
        "status": "waspada",
        "val": 48
      },
      {
        "name": "Selat Makassar",
        "status": "lancar",
        "val": 35
      },
      {
        "name": "Lintas Korea",
        "status": "waspada",
        "val": 45
      }
    ],
    "markets": [
      {
        "name": "IDX Composite",
        "cls": "saham",
        "val": 7651,
        "pct": 0.17
      },
      {
        "name": "Indeks Dolar",
        "cls": "kurs",
        "val": 156.99,
        "pct": -0.1
      },
      {
        "name": "Emas",
        "cls": "logam",
        "val": 4399,
        "pct": 0.58
      },
      {
        "name": "Minyak WTI",
        "cls": "energi",
        "val": 94,
        "pct": -2.16
      },
      {
        "name": "Bitcoin",
        "cls": "kripto",
        "val": 81451,
        "pct": 1.35
      }
    ]
  };

  var $ = function (id) { return document.getElementById(id); };

  function fmtVal(v) {
    return v.toLocaleString("id-ID");
  }

  function renderStats(list) {
    var nodes = document.querySelectorAll(".stat-value");
    if (!nodes.length) return;
    (list || []).forEach(function (s, i) {
      if (nodes[i]) nodes[i].textContent = fmtVal(s.value);
    });
  }

  function renderSignals(list) {
    var el = $("signals-list");
    if (!el) return;
    el.innerHTML = "";
    (list || []).forEach(function (s) {
      var li = document.createElement("li");
      var p = document.createElement("p");
      var kicker = document.createElement("span");
      var span = document.createElement("span");
      kicker.className = "sig-kicker";
      kicker.textContent = s.kicker;
      p.appendChild(kicker);
      p.appendChild(document.createTextNode(s.title));
      span.className = "sig-src";
      span.textContent = s.src + " · " + s.ago;
      li.appendChild(p);
      li.appendChild(span);
      el.appendChild(li);
    });
  }

  function renderSectors(list) {
    var el = $("sectors-list");
    if (!el) return;
    el.innerHTML = "";
    (list || []).forEach(function (s) {
      var li = document.createElement("li");
      var f = document.createElement("span");
      var c = document.createElement("span");
      var bar = document.createElement("span");
      var fill = document.createElement("span");
      var v = document.createElement("span");
      f.textContent = s.flag;
      c.className = "s-code";
      c.textContent = s.code;
      bar.className = "s-bar";
      fill.style.width = Math.min(100, Math.max(4, s.val)) + "%";
      bar.appendChild(fill);
      v.className = "s-val";
      v.textContent = s.val;
      li.appendChild(f);
      li.appendChild(c);
      li.appendChild(bar);
      li.appendChild(v);
      el.appendChild(li);
    });
  }

  function renderChokepoints(list) {
    var el = $("chokepoints-list");
    if (!el) return;
    el.innerHTML = "";
    (list || []).forEach(function (c) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      var wrap = document.createElement("span");
      var st = document.createElement("span");
      var val = document.createElement("span");
      name.textContent = c.name;
      st.className = "cp-status";
      st.textContent = c.status;
      if (c.status === "tersendat") st.classList.add("danger");
      else if (c.status === "waspada") st.classList.add("warn");
      else st.classList.add("ok");
      val.className = "cp-val";
      val.textContent = c.val;
      wrap.appendChild(st);
      wrap.appendChild(val);
      li.appendChild(name);
      li.appendChild(wrap);
      el.appendChild(li);
    });
  }

  function renderMarkets(list) {
    var el = $("markets-list");
    if (!el) return;
    el.innerHTML = "";
    (list || []).forEach(function (m) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      var cls = document.createElement("span");
      var val = document.createElement("span");
      var pct = document.createElement("span");
      name.className = "m-name";
      name.textContent = m.name;
      cls.className = "m-cls";
      cls.textContent = m.cls;
      val.className = "m-val";
      val.textContent = fmtVal(m.val);
      pct.className = "m-pct " + (m.pct >= 0 ? "up" : "down");
      pct.textContent = (m.pct >= 0 ? "+" : "") + m.pct.toFixed(2) + "%";
      li.appendChild(name);
      li.appendChild(cls);
      li.appendChild(val);
      li.appendChild(pct);
      el.appendChild(li);
    });
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var lastTicker = "";

  function groupHtml(list) {
    var h = "";
    list.forEach(function (s) {
      h += '<span class="ticker-hit">' + esc(s.kicker + " · " + s.title) + "</span>";
      h += '<span class="ticker-sep">◆</span>';
    });
    return '<span class="ticker-group">' + h + "</span>";
  }

  function renderTicker(list) {
    var el = $("ticker-items");
    if (!el || !list || !list.length) return;
    var key = JSON.stringify(list);
    if (key === lastTicker) return;
    lastTicker = key;
    el.innerHTML = groupHtml(list) + groupHtml(list);
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
  }

  function setPulse(d) {
    var t = $("pulse-top");
    if (t && d && d.updated) {
      var dt = new Date(d.updated);
      t.textContent = dt.toLocaleTimeString("id-ID", { hour12: false });
    }
  }

  function render(d, source) {
    renderStats(d.stats);
    renderSignals(d.signals);
    renderSectors(d.sectors);
    renderChokepoints(d.chokepoints);
    renderMarkets(d.markets);
    renderTicker(d.signals);
    setPulse(d);
  }

  var rendered = false;
  var poll = null;

  function load() {
    fetch("/api/monitor", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(function (d) {
        rendered = true;
        render(d, "api");
      })
      .catch(function () {
        if (rendered) return;
        render(EMBED, "fallback");
        if (poll) window.clearInterval(poll);
      });
  }

  load();
  poll = window.setInterval(function () {
    if (!document.hidden) load();
  }, 30000);
})();