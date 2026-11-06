(function () {
  "use strict";

  var header = document.querySelector(".nav");
  var menuBtn = document.getElementById("menu-toggle");
  var menu = document.getElementById("menu");

  function onScroll() {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 10 ? "0 4px 20px rgba(0,0,0,0.15)" : "none";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (!menu || !menuBtn) return;
    menu.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menuBtn.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  var revealables = document.querySelectorAll(".card, .section-title, .section-sub, .hero-content");
  if ("IntersectionObserver" in window) {
    revealables.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  var form = document.getElementById("contact-form");
  if (form) {
    var fields = {
      nama: { el: document.getElementById("nama"), test: function (v) { return v.trim().length >= 3; }, msg: "Nama minimal 3 karakter." },
      email: { el: document.getElementById("email"), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: "Format email tidak valid." },
      pesan: { el: document.getElementById("pesan"), test: function (v) { return v.trim().length >= 10; }, msg: "Pesan minimal 10 karakter." }
    };

    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      f.el.addEventListener("input", function () { validate(key); });
    });

    function validate(key) {
      var f = fields[key];
      var ok = f.test(f.el.value);
      f.el.closest(".field").classList.toggle("invalid", !ok);
      f.el.setAttribute("aria-invalid", String(!ok));
      f.el.closest(".field").querySelector(".err").textContent = ok ? "" : f.msg;
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = Object.keys(fields).map(validate).every(Boolean);
      var msg = form.querySelector(".form-msg");
      if (ok) {
        msg.hidden = false;
        msg.classList.remove("error");
        msg.textContent = "✅ Terima kasih! Ini hanya demo, jadi pesanmu belum dikirim ke mana pun.";
        form.reset();
        Object.keys(fields).forEach(function (k) {
          fields[k].el.closest(".field").classList.remove("invalid");
          fields[k].el.removeAttribute("aria-invalid");
          fields[k].el.closest(".field").querySelector(".err").textContent = "";
        });
      } else {
        msg.hidden = false;
        msg.classList.add("error");
        msg.textContent = "⚠️ Periksa kembali isian yang ditandai merah.";
        var bad = Object.keys(fields).filter(function (k) {
          return fields[k].el.getAttribute("aria-invalid") === "true";
        })[0];
        if (bad) fields[bad].el.focus();
      }
    });
  }
})();