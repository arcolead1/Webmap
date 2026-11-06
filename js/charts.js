(function () {
  "use strict";

  var DPR_MAX = 2;
  var lineCanvas = document.getElementById("chart-line");
  var barCanvas = document.getElementById("chart-bar");
  var donutCanvas = document.getElementById("chart-donut");

  var LINE_DATA = [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 48 },
    { label: "Mar", value: 45 },
    { label: "Apr", value: 61 },
    { label: "Mei", value: 58 },
    { label: "Jun", value: 73 },
    { label: "Jul", value: 81 },
    { label: "Agu", value: 78 },
    { label: "Sep", value: 92 }
  ];

  var BAR_DATA = [
    { label: "Q1", value: 34 },
    { label: "Q2", value: 52 },
    { label: "Q3", value: 61 },
    { label: "Q4", value: 78 }
  ];

  var DONUT_DATA = [
    { label: "Pencarian", value: 46, color: "#7c5cff" },
    { label: "Langsung", value: 27, color: "#22d3ee" },
    { label: "Tautan", value: 17, color: "#34d399" },
    { label: "Media sosial", value: 10, color: "#f472b6" }
  ];

  var LIVE_BUFFER = [];
  var LIVE_MAX = 40;

  function setup(canvas) {
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    var w = rect.width || canvas.clientWidth || 300;
    var h = rect.height || canvas.clientHeight || 260;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
  }

  function themeColor(name, fallback) {
    var c = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return c || fallback;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawLine(data) {
    var series = data || LINE_DATA;
    var s = setup(lineCanvas);
    if (!s || !series.length) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var accent = themeColor("--accent", "#7c5cff");
    var accent2 = themeColor("--accent-2", "#22d3ee");
    var muted = themeColor("--muted", "#9aa0b5");
    var grid = themeColor("--border", "#2a2a44");

    var pad = { l: 34, r: 12, t: 14, b: 26 };
    var innerW = w - pad.l - pad.r;
    var innerH = h - pad.t - pad.b;
    var max = Math.max.apply(null, series.map(function (d) { return d.value; })) * 1.15;
    var min = Math.min.apply(null, series.map(function (d) { return d.value; }));
    if (!max) return;
    if (min < 0 || max - min < 30) max = min + 30;
    var n = series.length;

    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = pad.t + (innerH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(w - pad.r, gy);
      ctx.stroke();
    }

    var pts = series.map(function (d, i) {
      var x = pad.l + (innerW * i) / (n - 1);
      var y = pad.t + innerH - (d.value / max) * innerH;
      return { x: x, y: y };
    });

    var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + innerH);
    grad.addColorStop(0, hexA(accent, 0.35));
    grad.addColorStop(1, hexA(accent, 0));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pad.t + innerH);
    pts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
    ctx.lineTo(pts[n - 1].x, pad.t + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pts.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        var prev = pts[i - 1];
        var mx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(mx, prev.y, mx, p.y, p.x, p.y);
      }
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    pts.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = accent2;
      ctx.strokeStyle = themeColor("--card", "#16162a");
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = muted;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    var step = Math.max(1, Math.ceil((n - 1) / 6));
    for (var li = 0; li < n; li += step) {
      ctx.fillText(series[li].label, pts[li].x, h - 8);
    }
    if ((n - 1) % step !== 0) {
      ctx.fillText(series[n - 1].label, pts[n - 1].x, h - 8);
    }
  }

  function drawBar() {
    var s = setup(barCanvas);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var accent = themeColor("--accent", "#7c5cff");
    var muted = themeColor("--muted", "#9aa0b5");
    var grid = themeColor("--border", "#2a2a44");

    var pad = { l: 34, r: 12, t: 14, b: 26 };
    var innerW = w - pad.l - pad.r;
    var innerH = h - pad.t - pad.b;
    var max = Math.max.apply(null, BAR_DATA.map(function (d) { return d.value; })) * 1.15;
    var n = BAR_DATA.length;
    var bw = Math.min(46, (innerW / n) * 0.55);

    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = pad.t + (innerH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(w - pad.r, gy);
      ctx.stroke();
    }

    BAR_DATA.forEach(function (d, i) {
      var x = pad.l + (innerW / n) * i + (innerW / n - bw) / 2;
      var bh = (d.value / max) * innerH;
      var y = pad.t + innerH - bh;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.65 + 0.35 * (i / (n - 1));
      roundRect(ctx, x, y, bw, bh, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = muted;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.label, x + bw / 2, h - 8);
      ctx.fillText(d.value, x + bw / 2, y - 5);
    });
  }

  function drawDonut() {
    var s = setup(donutCanvas);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var text = themeColor("--text", "#eaeaf2");
    var muted = themeColor("--muted", "#9aa0b5");

    var cx = w / 2;
    var cy = h / 2 - 12;
    var radius = Math.min(w, h) / 2 - 20;
    var thickness = Math.min(22, radius * 0.3);
    var total = DONUT_DATA.reduce(function (a, d) { return a + d.value; }, 0);
    var start = -Math.PI / 2;

    DONUT_DATA.forEach(function (d) {
      var angle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + angle);
      ctx.arc(cx, cy, radius - thickness, start + angle, start, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      start += angle;
    });

    ctx.fillStyle = text;
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(total) + "k", cx, cy - 2);
    ctx.fillStyle = muted;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("total", cx, cy + 14);

    var legendY = h - 8;
    ctx.textAlign = "left";
    DONUT_DATA.forEach(function (d, i) {
      var lx = cx - 60 + (i % 2) * 90;
      var ly = legendY - Math.floor(i / 2) * 16;
      ctx.fillStyle = d.color;
      ctx.fillRect(lx, ly - 8, 9, 9);
      ctx.fillStyle = muted;
      ctx.font = "10.5px system-ui, sans-serif";
      ctx.fillText(d.label + " " + d.value + "%", lx + 13, ly - 1);
    });
  }

  function hexA(hex, a) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
    var r = parseInt(hex.slice(0, 2), 16);
    var g = parseInt(hex.slice(2, 4), 16);
    var b = parseInt(hex.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function render() {
    drawLine();
    drawBar();
    drawDonut();
  }

  window.WebMapCharts = {
    pushLive: function (value) {
      if (typeof value !== "number") return;
      LIVE_BUFFER.push({ label: "", value: value });
      if (LIVE_BUFFER.length > LIVE_MAX) LIVE_BUFFER.shift();
      LIVE_BUFFER[LIVE_BUFFER.length - 1].label =
        new Date().toLocaleTimeString("id-ID", { hour12: false });
      drawLine(LIVE_BUFFER);
    }
  };

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });

  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();