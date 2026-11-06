(function () {
  "use strict";

  var EMBED = [
    { id: "jakarta", nama: "Jakarta Pusat", lat: -6.2088, lon: 106.8456, tag: "Kantor Pusat", users: 38, trend: 12.4 },
    { id: "bandung", nama: "Bandung", lat: -6.9175, lon: 107.6191, tag: "Riset", users: 21, trend: 8.1 },
    { id: "yogyakarta", nama: "Yogyakarta", lat: -7.7971, lon: 110.3708, tag: "Kampus", users: 15, trend: -2.3 },
    { id: "surabaya", nama: "Surabaya", lat: -7.2575, lon: 112.7521, tag: "Penjualan", users: 18, trend: 5.9 },
    { id: "makassar", nama: "Makassar", lat: -5.1477, lon: 119.4327, tag: "Pertemuan", users: 8, trend: 9.7 }
  ];

  var el = document.getElementById("map");
  if (!el || typeof window.L === "undefined") return;

  var ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  var PROVIDERS = {
    dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", opt: { attribution: ATTRIB, subdomains: "abcd", maxZoom: 19 } },
    light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", opt: { attribution: ATTRIB, subdomains: "abcd", maxZoom: 19 } }
  };

  function isdark() {
    return document.documentElement.getAttribute("data-theme") !== "light";
  }

  var map = L.map(el, { scrollWheelZoom: false, worldCopyJump: true }).setView([-2.9, 118.0], 5);
  var currentLayer = null;
  var group = L.layerGroup().addTo(map);
  var currentList = [];

  function tileLayer(dark) {
    var p = PROVIDERS[dark ? "dark" : "light"];
    return L.tileLayer(p.url, p.opt);
  }

  function applyTheme() {
    if (currentLayer) map.removeLayer(currentLayer);
    currentLayer = tileLayer(isdark());
    currentLayer.addTo(map);
    if (currentList.length) addPoints(currentList, true);
  }

  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  function accentColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7c5cff";
  }

  function setSource(txt) {
    var s = document.getElementById("map-source");
    if (s) s.textContent = txt;
  }

  function addPoints(list, keepView) {
    currentList = list;
    group.clearLayers();
    var accent = accentColor();
    list.forEach(function (p) {
      var mk = L.circleMarker([p.lat, p.lon], {
        radius: 9,
        color: accent,
        weight: 2,
        fillColor: accent,
        fillOpacity: 0.35
      });
      var arrow = p.trend >= 0 ? "▲" : "▼";
      var box = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = p.nama;
      box.appendChild(title);
      box.appendChild(document.createElement("br"));
      box.appendChild(document.createTextNode(p.tag + " · " + p.users + "k pengguna"));
      box.appendChild(document.createElement("br"));
      box.appendChild(document.createTextNode(arrow + " " + Math.abs(p.trend) + "% vs bulan lalu"));
      mk.bindPopup(box);
      group.addLayer(mk);
    });
    var count = document.getElementById("map-count");
    if (count) count.textContent = String(list.length);
    if (list.length && !keepView) map.fitBounds(group.getBounds(), { padding: [30, 30] });
  }

  var pulseTimer = null;
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function startPulse() {
    if (pulseTimer || reduceMotion) return;
    var t0 = performance.now();
    pulseTimer = window.setInterval(function () {
      var t = (performance.now() - t0) / 480;
      group.getLayers().forEach(function (mk, i) {
        mk.setRadius(8 + Math.round(Math.abs(Math.sin(t + i * 1.7)) * 4) + 1);
      });
    }, 240);
  }
  function stopPulse() {
    if (pulseTimer) {
      window.clearInterval(pulseTimer);
      pulseTimer = null;
    }
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopPulse();
    else if (shown) startPulse();
  });

  applyTheme();

  fetch("/api/locations")
    .then(function (r) {
      if (!r.ok) throw new Error("api");
      return r.json();
    })
    .then(function (d) {
      if (!d.locations || !d.locations.length) throw new Error("kosong");
      addPoints(d.locations);
      setSource("Data dari server · " + d.total + " titik");
    })
    .catch(function () {
      addPoints(EMBED);
      setSource("Data contoh (server tidak aktif)");
    });

  var fitBtn = document.getElementById("map-fit");
  if (fitBtn) {
    fitBtn.addEventListener("click", function () {
      if (currentList.length) map.fitBounds(group.getBounds(), { padding: [30, 30] });
    });
  }

  var shown = false;
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !shown) {
          shown = true;
          map.invalidateSize();
          startPulse();
        }
      });
    });
    io.observe(el);
  } else {
    shown = true;
    startPulse();
  }
  window.addEventListener("resize", function () {
    if (shown) map.invalidateSize();
  });
})();