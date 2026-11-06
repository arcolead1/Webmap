(function () {
  "use strict";

  var badge = document.getElementById("live-state");
  if (typeof window.WebMapCharts === "undefined" || !badge) return;

  function setState(text, on) {
    badge.textContent = text;
    badge.setAttribute("data-state", on ? "on" : "sim");
  }

  var simOn = false;
  function startSim() {
    if (simOn) return;
    simOn = true;
    setState("● data contoh", false);
    var value = 62;
    window.setInterval(function () {
      value += (Math.random() - 0.48) * 8;
      value = Math.max(20, Math.min(100, value));
      window.WebMapCharts.pushLive(Math.round(value * 10) / 10);
    }, 2000);
  }

  var es = null;
  try {
    es = new EventSource("/api/stream");
  } catch (e) {
    es = null;
  }

  if (es) {
    es.onopen = function () {
      setState("● langsung", true);
    };
    es.onmessage = function (ev) {
      var d;
      try {
        d = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (typeof d.value === "number") window.WebMapCharts.pushLive(d.value);
    };
    es.addEventListener("error", function () {
      if (es.readyState === 2) {
        startSim();
      } else if (!simOn) {
        setState("● menyambung ulang…", false);
      }
    });
  } else {
    startSim();
  }
})();