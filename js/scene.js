var THREE, OrbitControls;

(function () {
  "use strict";

  var DPR_MAX = 2;
  var heroCanvas = document.getElementById("gl-scene");
  var dataCanvas = document.getElementById("gl-data");
  var scenes = [];
  var rafId = 0;

  function cssVar(name, fallback) {
    var c = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return c || fallback;
  }

  function themeColors() {
    return {
      accent: new THREE.Color(cssVar("--accent", "#7c5cff")),
      accent2: new THREE.Color(cssVar("--accent-2", "#22d3ee")),
      muted: new THREE.Color(cssVar("--muted", "#9aa0b5"))
    };
  }

  function fitCanvas(canvas) {
    if (!canvas || !canvas.parentElement) return;
    var w = canvas.clientWidth || canvas.parentElement.clientWidth;
    var h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    return { w: w, h: h, dpr: dpr };
  }

  function buildHero() {
    if (!heroCanvas) return;
    var box = fitCanvas(heroCanvas);
    var renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(box ? box.dpr : 1);
    renderer.setSize(box ? box.w : 0, box ? box.h : 0, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.z = 22;

    var colors = themeColors();
    var COUNT = 900;
    var positions = new Float32Array(COUNT * 3);
    var baseY = new Float32Array(COUNT);
    var speeds = new Float32Array(COUNT);
    var offsets = new Float32Array(COUNT);
    for (var i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      baseY[i] = positions[i * 3 + 1];
      speeds[i] = 0.6 + Math.random() * 1.4;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: colors.accent,
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var points = new THREE.Points(geo, mat);
    scene.add(points);

    var wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(7, 1),
      new THREE.MeshBasicMaterial({ color: colors.accent2, wireframe: true, transparent: true, opacity: 0.12 })
    );
    scene.add(wire);

    scenes.push({ scene: scene, camera: camera, renderer: renderer, geo: geo, baseY: baseY, speeds: speeds, offsets: offsets, points: points, wire: wire, hero: true });

    fitCameraAspect(scenes[scenes.length - 1]);
  }

  function buildBarChart() {
    if (!dataCanvas) return;
    var box = fitCanvas(dataCanvas);
    var renderer = new THREE.WebGLRenderer({ canvas: dataCanvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(box ? box.dpr : 1);
    renderer.setSize(box ? box.w : 0, box ? box.h : 0, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(cssVar("--bg", "#0f0f1a"));

    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(14, 12, 14);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(8, 16, 6);
    scene.add(dir);

    var colors = themeColors();
    var values = [3, 5, 2, 7, 4, 6, 8, 5, 6, 9, 4, 7, 8, 6, 9, 5, 7, 6, 8, 4, 6, 7, 5, 8];
    var cols = 6;
    var rows = 4;
    var gap = 1.9;
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(cols * gap + 0.8, 0.25, rows * gap + 0.8),
      new THREE.MeshStandardMaterial({ color: cssVar("--border", "#2a2a44"), roughness: 0.9 })
    );
    base.position.y = -0.125;
    scene.add(base);

    var bars = [];
    values.forEach(function (v, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var height = 0.4 + v * 0.55;
      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, height, 1.05),
        new THREE.MeshStandardMaterial({ color: colors.accent.clone().lerp(colors.accent2, col / (cols - 1)), roughness: 0.35, metalness: 0.1 })
      );
      bar.position.set((col - (cols - 1) / 2) * gap, height / 2, (row - (rows - 1) / 2) * gap);
      scene.add(bar);
      bars.push(bar);
    });

    var controls = new OrbitControls(camera, dataCanvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = false;
    controls.target.set(0, 2, 0);
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 6;
    controls.maxDistance = 40;

    scenes.push({ scene: scene, camera: camera, renderer: renderer, controls: controls, wires: bars, hero: false });
    fitCameraAspect(scenes[scenes.length - 1]);
  }

  function fitCameraAspect(entry) {
    if (!entry.renderer.domElement) return;
    var w = entry.renderer.domElement.clientWidth || entry.renderer.domElement.width;
    var h = entry.renderer.domElement.clientHeight || entry.renderer.domElement.height;
    if (w === 0 || h === 0) return;
    entry.camera.aspect = w / h;
    entry.camera.updateProjectionMatrix();
  }

  function resizeAll() {
    scenes.forEach(function (e) {
      var box = fitCanvas(e.renderer.domElement);
      if (!box) return;
      e.renderer.setSize(box.w, box.h, false);
      e.camera.aspect = box.w / box.h;
      e.camera.updateProjectionMatrix();
    });
  }

  function themeScenes() {
    var colors = themeColors();
    scenes.forEach(function (e) {
      if (e.hero) {
        e.points.material.color.copy(colors.accent);
        e.wire.material.color.copy(colors.accent2);
      } else {
        e.scene.background.set(cssVar("--bg", "#0f0f1a"));
        e.wires.forEach(function (bar, i) {
          var col = i % 6;
          bar.material.color.copy(colors.accent.clone().lerp(colors.accent2, col / 5));
        });
      }
    });
  }

  var last = 0;
  function animate(time) {
    rafId = requestAnimationFrame(animate);
    var dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    scenes.forEach(function (e) {
      if (e.hero) {
        var pos = e.geo.attributes.position.array;
        for (var i = 0; i < e.speeds.length; i++) {
          pos[i * 3 + 1] = e.baseY[i] + Math.sin(time * 0.001 * e.speeds[i] + e.offsets[i]) * 2.2;
        }
        e.geo.attributes.position.needsUpdate = true;
        e.wire.rotation.y += dt * 0.25;
        e.wire.rotation.x += dt * 0.1;
        e.camera.position.x = Math.sin(time * 0.0002) * 4;
        e.camera.position.y = Math.cos(time * 0.00018) * 2.5;
        e.camera.lookAt(0, 0, 0);
      } else {
        if (e.paused) return;
        e.wires.forEach(function (bar) {
          bar.rotation.y += dt * 0.05;
        });
        e.controls.update();
      }
      e.renderer.render(e.scene, e.camera);
    });
  }

  function pauseOnHidden() {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        last = performance.now();
        rafId = requestAnimationFrame(animate);
      }
    });
  }

  function no3D() {
    var card = dataCanvas && dataCanvas.parentElement;
    if (!card) return;
    card.classList.add("no-3d");
    var hint = card.querySelector(".hint");
    if (hint) hint.textContent = "Tampilan 3D tidak tersedia di perangkat atau koneksi ini.";
  }

  function start() {
    try { buildHero(); } catch (e) {}
    try { buildBarChart(); } catch (e) { no3D(); }
    if (scenes.length === 0) return;
    resizeAll();
    window.addEventListener("resize", resizeAll);
    new MutationObserver(themeScenes).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
    pauseOnHidden();
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.__sceneEntry.paused = !entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      scenes.forEach(function (e) {
        if (!e.hero && e.renderer.domElement) {
          e.renderer.domElement.__sceneEntry = e;
          io.observe(e.renderer.domElement);
        }
      });
    }
    last = performance.now();
    rafId = requestAnimationFrame(animate);
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }

  Promise.all([import("three"), import("three/addons/controls/OrbitControls.js")])
    .then(function (m) {
      THREE = m[0];
      OrbitControls = m[1].OrbitControls;
      init();
    })
    .catch(no3D);
})();