/* ANUBIS AI v2 — interactions (no dependencies) */
(function () {
  "use strict";

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  var toggle = document.getElementById("theme-toggle") || document.getElementById("themeToggle");
  function setTheme(t) {
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("anubis-theme", t); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue("--theme-meta").trim();
    setTimeout(function () { root.classList.remove("theme-anim"); }, 550);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("nav-burger") || document.getElementById("burger");
  var menu = document.getElementById("mobile-menu") || document.getElementById("mobileMenu");
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false);
    });
  }

  /* ---------- Scroll progress + nav state ---------- */
  var progress = document.getElementById("progress");
  var nav = document.getElementById("nav");
  function onScroll() {
    var h = document.documentElement;
    if (progress) {
      var max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    if (nav) nav.classList.toggle("scrolled", h.scrollTop > 12);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Stagger grids ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (grid) {
    Array.prototype.forEach.call(grid.children, function (child, i) {
      if (child.classList.contains("reveal")) {
        child.style.transitionDelay = 80 + i * 90 + "ms";
      }
    });
  });

  /* ---------- Active nav link ---------- */
  var links = document.querySelectorAll(".nav-link");
  var sections = [];
  links.forEach(function (l) {
    var href = l.getAttribute("href") || "";
    if (href.charAt(0) !== "#") return;
    var sec = document.querySelector(href);
    if (sec) sections.push({ link: l, sec: sec });
  });
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          sections.forEach(function (s) {
            s.link.classList.toggle("active", s.sec === en.target);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navIO.observe(s.sec); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target || reduceMotion) { el.textContent = target; return; }
    var dur = 1400, start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cIO.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cIO.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* ---------- Doctrine carousel (4 chapters, arrows + dots + drag/swipe + keys) ---------- */
  var carousel = document.getElementById("doctrineCarousel");
  if (carousel) {
    var slides = carousel.querySelectorAll(".doctrine-slide");
    var prev = document.getElementById("doctrinePrev");
    var next = document.getElementById("doctrineNext");
    var dotsWrap = document.getElementById("doctrineDots");
    var status = document.getElementById("doctrineStatus");
    var idx = 0;

    if (slides.length) {
      function slideName(s) {
        var k = s ? s.querySelector(".kicker") : null;
        return k ? k.textContent.replace(/\s+/g, " ").trim() : "";
      }
      function render() {
        slides.forEach(function (s, i) {
          s.classList.toggle("is-active", i === idx);
          s.setAttribute("aria-hidden", i === idx ? "false" : "true");
        });
        if (dotsWrap) {
          var dots = dotsWrap.querySelectorAll(".doctrine-dot");
          dots.forEach(function (d, i) {
            d.classList.toggle("is-active", i === idx);
            d.setAttribute("aria-selected", i === idx ? "true" : "false");
          });
        }
        if (status) {
          status.textContent = slideName(slides[idx]) + " — chapter " + (idx + 1) + " of " + slides.length;
        }
      }
      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "doctrine-dot" + (i === 0 ? " is-active" : "");
          b.setAttribute("role", "tab");
          b.setAttribute("aria-label", slideName(slides[i]) || "Chapter " + (i + 1));
          b.setAttribute("aria-selected", i === 0 ? "true" : "false");
          b.addEventListener("click", function () { idx = i; render(); });
          dotsWrap.appendChild(b);
        });
      }
      function go(d) { idx = (idx + d + slides.length) % slides.length; render(); }
      if (prev) prev.addEventListener("click", function () { go(-1); });
      if (next) next.addEventListener("click", function () { go(1); });

      /* Keyboard: left/right when focus is anywhere inside the carousel */
      carousel.setAttribute("tabindex", "0");
      carousel.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      });

      /* Drag (mouse) + swipe (touch) via Pointer Events, touch fallback */
      var sx = 0, tracking = false, moved = false;
      function endSwipe(x) {
        var dx = x - sx;
        tracking = false;
        if (Math.abs(dx) > 40 && !moved) { moved = true; setTimeout(function () { moved = false; }, 300); go(dx < 0 ? 1 : -1); }
      }
      if (window.PointerEvent) {
        carousel.addEventListener("pointerdown", function (e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          sx = e.clientX; tracking = true;
        }, { passive: true });
        carousel.addEventListener("pointerup", function (e) {
          if (tracking) endSwipe(e.clientX);
        }, { passive: true });
        carousel.addEventListener("pointercancel", function () { tracking = false; }, { passive: true });
      } else {
        carousel.addEventListener("touchstart", function (e) {
          sx = e.touches[0].clientX; tracking = true;
        }, { passive: true });
        carousel.addEventListener("touchend", function (e) {
          if (tracking) endSwipe(e.changedTouches[0].clientX);
        }, { passive: true });
      }
      carousel.addEventListener("dragstart", function (e) { e.preventDefault(); });

      render();
    }
  }
})();
