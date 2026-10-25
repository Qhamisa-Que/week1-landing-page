/* =========================================================
   Rhadebe Digital — interactions
   No libraries. Everything degrades gracefully.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- helpers ---------- */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* =========================================================
     1. CUSTOM CURSOR (desktop only)
     ========================================================= */
  function initCursor() {
    if (reduceMotion || !finePointer) return;

    var cursor = document.querySelector(".cursor");
    var dot = document.querySelector(".cursor__dot");
    var ring = document.querySelector(".cursor__ring");
    if (!cursor || !dot || !ring) return;

    var dotX = window.innerWidth / 2, dotY = window.innerHeight / 2;
    var ringX = dotX, ringY = dotY;
    var raf = null;

    document.documentElement.classList.add("has-custom-cursor");

    document.addEventListener("mousemove", function (event) {
      dotX = event.clientX;
      dotY = event.clientY;
      if (!raf) raf = window.requestAnimationFrame(render);
    });

    function render() {
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;
      dot.style.transform = "translate3d(" + dotX + "px," + dotY + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0) translate(-50%,-50%)";
      raf = ringX.toFixed(1) === dotX.toFixed(1) && ringY.toFixed(1) === dotY.toFixed(1) ? null : window.requestAnimationFrame(render);
    }

    document.addEventListener("mouseleave", function () {
      document.documentElement.classList.add("cursor-hidden");
    });
    document.addEventListener("mouseenter", function () {
      document.documentElement.classList.remove("cursor-hidden");
    });

    var hoverTargets = document.querySelectorAll("a, button, [data-tilt]");
    hoverTargets.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        document.documentElement.classList.add("cursor-hover");
      });
      el.addEventListener("mouseleave", function () {
        document.documentElement.classList.remove("cursor-hover");
      });
    });

    var fields = document.querySelectorAll("input, textarea");
    fields.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        document.documentElement.classList.add("cursor-hidden");
      });
      el.addEventListener("mouseleave", function () {
        document.documentElement.classList.remove("cursor-hidden");
      });
    });
  }

  /* =========================================================
     2. SCROLL PROGRESS + STICKY HEADER
     ========================================================= */
  function initScroll() {
    var bar = document.querySelector(".scroll-progress__bar");
    var header = document.getElementById("site-header");
    var queued = false;

    function update() {
      queued = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (bar) bar.style.transform = "scaleX(" + progress + ")";
      if (header) header.classList.toggle("is-stuck", window.scrollY > 10);
    }

    window.addEventListener("scroll", function () {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* =========================================================
     3. MOBILE NAV
     ========================================================= */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) close();
    });
  }

  /* =========================================================
     4. HERO TITLE WORD REVEAL
     ========================================================= */
  function initTitle() {
    var title = document.querySelector("[data-split]");
    if (!title) return;

    var words = title.textContent.trim().split(/\s+/);
    title.textContent = "";

    words.forEach(function (word, index) {
      var outer = document.createElement("span");
      outer.className = "word";
      var inner = document.createElement("span");
      inner.textContent = word;
      inner.style.transitionDelay = (index * 55) + "ms";
      outer.appendChild(inner);
      title.appendChild(outer);
      if (index < words.length - 1) title.appendChild(document.createTextNode(" "));
    });

    if (reduceMotion) {
      title.classList.add("is-revealed");
      return;
    }

    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        title.classList.add("is-revealed");
      }, 120);
    });
  }

  /* =========================================================
     5. SECTION REVEALS
     ========================================================= */
  function initReveals() {
    var pending = Array.prototype.slice.call(document.querySelectorAll(".section"));
    if (!pending.length) return;

    if (reduceMotion) {
      pending.forEach(function (section) { section.classList.add("visible"); });
      return;
    }

    pending.forEach(function (section) { section.classList.add("reveal"); });

    var queued = false;

    function check() {
      queued = false;
      var trigger = window.innerHeight * 0.88;

      pending = pending.filter(function (section) {
        if (section.getBoundingClientRect().top < trigger) {
          section.classList.add("visible");
          return false; // done, drop it from the list
        }
        return true;
      });

      if (!pending.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }

    function onScroll() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(check);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check();
  }

  /* =========================================================
     6. 3D TILT CARDS + PHONE (desktop only)
     ========================================================= */
  function initTilt() {
    if (reduceMotion || !finePointer) return;

    var maxTilt = 8;

    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (event) {
        var rect = el.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform =
          "perspective(900px) rotateY(" + (px * maxTilt * 2).toFixed(2) + "deg) rotateX(" +
          (-py * maxTilt * 2).toFixed(2) + "deg) translateZ(0)";
      });

      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* =========================================================
     7. MAGNETIC BUTTONS (desktop only)
     ========================================================= */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;

    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (event) {
        var rect = el.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = "translate(" + (px * 10).toFixed(1) + "px," + (py * 8 - 3).toFixed(1) + "px)";
      });

      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* =========================================================
     8. HERO PARTICLE CANVAS
     ========================================================= */
  function initParticles() {
    var canvas = document.querySelector(".hero__canvas");
    if (!canvas || reduceMotion) return;
    if (!canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var nodes = [];
    var width = 0, height = 0, dpr = 1, raf = null, running = false;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = clamp(Math.floor(width / 30), 14, 46);
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.6 + 0.8
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 197, 253, 0.65)";
        ctx.fill();

        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x;
          var dy = n.y - m.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = "rgba(96, 165, 250, " + (0.22 * (1 - dist / 120)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      raf = window.requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
    }

    resize();
    window.addEventListener("resize", function () {
      resize();
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0 });
      observer.observe(canvas);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* =========================================================
     9. FLOATING CONTACT BUTTON
     ========================================================= */
  function initFab() {
    var toggle = document.querySelector(".fab__toggle");
    var menu = document.getElementById("fab-menu");
    if (!toggle || !menu) return;

    function close() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!menu.hidden && !menu.contains(event.target) && event.target !== toggle) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  /* ---------- boot ---------- */
  onReady(function () {
    initCursor();
    initScroll();
    initNav();
    initTitle();
    initReveals();
    initTilt();
    initMagnetic();
    initParticles();
    initFab();
  });

})();


/* ===== CONTACT FORM VALIDATION ===== */
(function () {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const fields = Array.from(form.querySelectorAll("#name, #email, #message"));

  if (fields.length !== 3 || fields.some(function (field) {
    return !form.querySelector(`#${field.id}-error`);
  })) return;

  function errorFor(field) {
    const value = field.value.trim();

    if (!value) {
      const messages = {
        name: "Please enter your name.",
        email: "Please enter your email address.",
        message: "Please tell me what you need help with."
      };
      return messages[field.id];
    }

    if (field.id === "name" && value.length < 2) {
      return "Please enter at least 2 characters for your name.";
    }

    if (field.id === "email" && field.validity.typeMismatch) {
      return "Please enter a valid email address, for example name@example.com.";
    }

    if (field.id === "message" && value.length < 10) {
      return "Please add a little more detail (at least 10 characters).";
    }

    if (field.maxLength > 0 && value.length > field.maxLength) {
      return `Please use no more than ${field.maxLength} characters.`;
    }

    return "";
  }

  function validateField(field) {
    const error = errorFor(field);
    form.querySelector(`#${field.id}-error`).textContent = error;
    field.setAttribute("aria-invalid", String(Boolean(error)));
    return error === "";
  }

  fields.forEach(function (field) {
    field.addEventListener("blur", function () {
      validateField(field);
    });

    field.addEventListener("change", function () {
      validateField(field);
    });

    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", function (event) {
    const invalidFields = fields.filter(function (field) {
      return !validateField(field);
    });

    if (invalidFields.length > 0) {
      event.preventDefault();
      invalidFields[0].focus();
      return;
    }

    fields.forEach(function (field) {
      field.value = field.value.trim();
    });
  });

  form.noValidate = true;
})();
