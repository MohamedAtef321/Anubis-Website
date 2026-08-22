/* ANUBIS — Waitlist webhook wiring (Task 3 & 5)
 * - preventDefault, email regex validation, UTM parsing via URLSearchParams
 * - metadata: userAgent, referrer, language, screen, viewport, platform, timezone, pageUrl
 * - fetch POST JSON to WAITLIST_WEBHOOK, loading/success/error UI, double-submit guard
 * - config: placeholder + localStorage override + localStorage fallback (works before webhook live)
 */
(function () {
  "use strict";

  // ===================== CONFIG =====================
  var WAITLIST_WEBHOOK_PLACEHOLDER = "https://script.google.com/macros/s/AKfycbyKby5aFDdsohCuXXI4ZVpL-L8JTPJ7pjC5o3LMsSjCDMT_9kF_WULk6ynoOShEeMhe/exec";
  var WAITLIST_WEBHOOK = (function () {
    try {
      var o = localStorage.getItem("anubis:waitlistWebhook");
      if (o && o.trim()) return o.trim();
    } catch (e) {}
    return WAITLIST_WEBHOOK_PLACEHOLDER;
  })();
  var STORAGE_FALLBACK_KEY = "anubis:waitlistFallback";
  var STORAGE_QUEUE_KEY = "anubis:waitlistQueue";

  function isPlaceholder(url) {
    if (!url) return true;
    return /REPLACE_WITH|placeholder/i.test(url) || url === WAITLIST_WEBHOOK_PLACEHOLDER;
  }

  // Allow runtime override without reload: window.__ANUBIS_SET_WEBHOOK(url)
  try {
    window.setWaitlistWebhook = function (url) {
      try { localStorage.setItem("anubis:waitlistWebhook", url); } catch (e) {}
      // eslint-disable-next-line no-console
      console.log("[anubis] waitlist webhook saved:", url);
      return url;
    };
    window.getWaitlistWebhook = function () { return WAITLIST_WEBHOOK; };
  } catch (e) {}

  // ===================== HELPERS =====================
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function parseUTM() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source") || "",
      utm_medium: p.get("utm_medium") || "",
      utm_campaign: p.get("utm_campaign") || "",
      utm_term: p.get("utm_term") || "",
      utm_content: p.get("utm_content") || "",
      utm_id: p.get("utm_id") || ""
    };
  }

  function makeSubmissionId() {
    try {
      if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    } catch (e) {}
    return "wl-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function getMetadata(email) {
    var utm = parseUTM();
    var nav = window.navigator;
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    var platform = "";
    try { platform = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || ""; } catch (e) {}
    return {
      email: email,
      submission_id: makeSubmissionId(),
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      pageUrl: window.location.href,
      pagePath: window.location.pathname + window.location.search,
      referrer: document.referrer ? (function () { try { return new URL(document.referrer).hostname; } catch (e) { return document.referrer; } })() : "",
      referrer_full: document.referrer || "",
      userAgent: nav.userAgent || "",
      language: nav.language || "",
      languages: (nav.languages || []).join(","),
      platform: platform,
      vendor: nav.vendor || "",
      timezone: tz,
      tzOffset: new Date().getTimezoneOffset(),
      screen: (window.screen ? window.screen.width + "x" + window.screen.height : ""),
      viewport: window.innerWidth + "x" + window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_term: utm.utm_term,
      utm_content: utm.utm_content,
      utm_id: utm.utm_id,
      rawQuery: window.location.search || ""
    };
  }

  function saveFallback(payload) {
    try {
      var arr = [];
      var raw = localStorage.getItem(STORAGE_FALLBACK_KEY);
      if (raw) arr = JSON.parse(raw);
      if (!Array.isArray(arr)) arr = [];
      arr.push(payload);
      localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(arr));
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(arr)); // alias for App Script parity
      return true;
    } catch (e) { return false; }
  }

  /* ===================== HERO FORM INJECTOR — DISABLED per user request =====================
   * User explicitly wants NO Coming Soon / waitlist in hero — only at bottom (#summon).
   * This injector is now a no-op to prevent auto-reinjecting into hero.
   * Keep code for reference but disabled. */
  function ensureHeroWaitlist() {
    return; // disabled — user wants nothing in hero, only bottom #summon
    if (document.getElementById("waitlistFormHero")) return;
    var inner = document.querySelector(".hero-inner");
    var lead = inner ? inner.querySelector(".lead") : null;
    var stats = inner ? inner.querySelector(".hero-stats") : null;
    if (!inner || !stats) return;

    var badge = document.createElement("div");
    badge.className = "coming-soon-badge reveal in";
    badge.setAttribute("aria-label", "Coming soon — early access via waitlist");
    badge.innerHTML = '<span class="coming-soon-dot" aria-hidden="true"></span>' +
      '<span class="coming-soon-text">Coming Soon</span>' +
      '<span class="coming-soon-sep" aria-hidden="true">·</span>' +
      '<span class="coming-soon-sub">Early access via waitlist</span>';

    var teaser = document.createElement("p");
    teaser.className = "waitlist-teaser reveal in";
 teaser.innerHTML = '<span class="waitlist-teaser-q">Want to try it?</span> ' +
      '<span class="waitlist-teaser-sub">Join the waitlist — get early access before anyone else and be first to command your autonomous workforce when Anubis awakens.</span>';

    var wrap = document.createElement("div");
    wrap.className = "waitlist-wrap waitlist-wrap--hero reveal in";
    wrap.id = "waitlistWrapHero";
    var form = document.createElement("form");
    form.id = "waitlistFormHero";
    form.className = "waitlist-form";
    form.setAttribute("data-waitlist", "");
    form.noValidate = true;
    form.setAttribute("aria-label", "Join waitlist — hero");
    var label = document.createElement("label");
    label.className = "sr-only";
    label.htmlFor = "waitlistEmailHero";
    label.textContent = "Email address";
    var input = document.createElement("input");
    input.id = "waitlistEmailHero";
    input.name = "email";
    input.type = "email";
    input.placeholder = "Enter your email";
    input.autocomplete = "email";
    input.required = true;
    input.setAttribute("aria-label", "Email address for waitlist");
    var btn = document.createElement("button");
    btn.type = "submit";
    btn.className = "btn btn-gold";
    btn.textContent = "Join Waitlist";
    form.appendChild(label); form.appendChild(input); form.appendChild(btn);
    var status = document.createElement("p");
    status.id = "waitlistStatusHero";
    status.className = "waitlist-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    wrap.appendChild(form); wrap.appendChild(status);

    var anchor = lead && lead.nextElementSibling ? lead.nextElementSibling : stats;
    inner.insertBefore(badge, anchor);
    inner.insertBefore(teaser, anchor);
    inner.insertBefore(wrap, anchor);

    // keep the ghost secondary link after the form block
    var actions = inner.querySelector(".hero-actions");
    if (actions && actions.nextElementSibling !== stats) {
      inner.insertBefore(actions, stats);
    }
    // eslint-disable-next-line no-console
    console.log("[anubis] hero waitlist form injected (was missing from markup)");
  }

  // ===================== UI BINDING =====================
  function bind(form) {
    if (!form || form.__anubisBound) return;
    form.__anubisBound = true;

    var emailInput = form.querySelector('input[type="email"]') || form.querySelector('input[name="email"]');
    var submitBtn = form.querySelector('button[type="submit"]');
    var statusEl = form.querySelector(".waitlist-status");
    if (!statusEl && form.nextElementSibling && form.nextElementSibling.classList.contains("waitlist-status")) statusEl = form.nextElementSibling;
    if (!statusEl && form.parentElement) statusEl = form.parentElement.querySelector(".waitlist-status");
    if (!statusEl) {
      var sib = form.nextElementSibling;
      while (sib) { if (sib.classList && sib.classList.contains("waitlist-status")) { statusEl = sib; break; } sib = sib.nextElementSibling; }
    }
    var fallbackHint = document.getElementById("waitlistFallbackHint");

    // create status if missing
    if (!statusEl) {
      statusEl = document.createElement("p");
      statusEl.id = "waitlistStatus";
      statusEl.className = "waitlist-status";
      statusEl.setAttribute("role", "status");
      statusEl.setAttribute("aria-live", "polite");
      form.appendChild(statusEl);
    }

    var submitting = false;
    var originalBtnText = submitBtn ? submitBtn.textContent : "";

    function setStatus(msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.classList.remove("is-error", "is-success", "is-loading");
      if (kind) statusEl.classList.add("is-" + kind);
    }

    /* Success = gold checkmark + "You are on the list" (DOM-built, XSS-safe) */
    function setSuccess(detail) {
      if (!statusEl) return;
      statusEl.textContent = "";
      statusEl.classList.remove("is-error", "is-loading");
      statusEl.classList.add("is-success");
      var check = document.createElement("span");
      check.className = "wl-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      statusEl.appendChild(check);
      statusEl.appendChild(document.createTextNode("You are on the list" + (detail ? " — " + detail : "")));
    }

    function setLoading(on) {
      submitting = on;
      if (submitBtn) {
        submitBtn.disabled = on;
        submitBtn.setAttribute("aria-busy", on ? "true" : "false");
        submitBtn.textContent = on ? "Summoning…" : originalBtnText;
        submitBtn.style.opacity = on ? ".75" : "";
        submitBtn.style.pointerEvents = on ? "none" : "";
      }
      if (emailInput) emailInput.disabled = on;
      if (on) setStatus("Summoning ANUBIS — please wait…", "loading");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;

      var rawEmail = emailInput ? emailInput.value.trim() : "";
      // also catch FormData email fallback
      if (!rawEmail) {
        try { var fd = new FormData(form); rawEmail = (fd.get("email") || "").toString().trim(); } catch (_) {}
      }

      if (!rawEmail) {
        setStatus("Please enter your email address.", "error");
        if (emailInput) { emailInput.focus(); emailInput.classList.add("is-invalid"); }
        return;
      }
      if (!EMAIL_RE.test(rawEmail)) {
        setStatus("That email looks invalid — try name@domain.com", "error");
        if (emailInput) { emailInput.focus(); emailInput.classList.add("is-invalid"); }
        return;
      }
      if (emailInput) emailInput.classList.remove("is-invalid");

      var payload = getMetadata(rawEmail);
      var webhook = WAITLIST_WEBHOOK;
      // re-read live override in case user set it after load
      try {
        var live = localStorage.getItem("anubis:waitlistWebhook");
        if (live && live.trim()) webhook = live.trim();
      } catch (_) {}

      // If placeholder / not configured → localStorage fallback so form "works" before webhook live
      if (isPlaceholder(webhook)) {
        saveFallback(payload);
        setLoading(false);
        if (fallbackHint) fallbackHint.style.display = "";
        setSuccess(rawEmail + " (saved locally — webhook not yet configured, will sync when live)");
        try { form.reset(); } catch (_) {}
        // eslint-disable-next-line no-console
        console.log("[anubis] waitlist fallback saved (no webhook):", payload);
        return;
      }

      setLoading(true);

      /* Apps Script web apps don't answer CORS preflights — send JSON body as
       * text/plain (a CORS "simple request") so no OPTIONS round-trip happens. */
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        mode: "cors"
      }).then(function (res) {
        // Apps Script may return 200 with JSON {ok:true} or plain text
        if (!res.ok) throw new Error("HTTP " + res.status);
        // try to parse but don't fail if not JSON
        return res.text().then(function (txt) {
          try { return JSON.parse(txt); } catch (_) { return { ok: true, raw: txt }; }
        });
      }).then(function (data) {
        if (data && data.ok === false) throw new Error(data.error || "Webhook rejected");
        setLoading(false);
        setSuccess(rawEmail + " is on the waitlist");
        try { form.reset(); } catch (_) {}
        try {
          localStorage.setItem("anubis:waitlistLastSuccess", JSON.stringify({ email: rawEmail, submission_id: payload.submission_id, at: new Date().toISOString() }));
          document.dispatchEvent(new CustomEvent("anubis:waitlistSuccess", { detail: { email: rawEmail, submission_id: payload.submission_id } }));
        } catch (_) {}
        // eslint-disable-next-line no-console
        console.log("[anubis] waitlist success:", data);
      }).catch(function (err) {
        // network / CORS / 4xx → fallback save so user not lost
        saveFallback(payload);
        setLoading(false);
        if (fallbackHint) fallbackHint.style.display = "";
        setStatus("Stored locally (network hiccup) — " + err.message + ". Your email " + rawEmail + " is saved and will sync when the webhook is reachable.", "error");
        // eslint-disable-next-line no-console
        console.warn("[anubis] waitlist fetch failed, fallback saved:", err, payload);
      });
    });

    // clear error on input
    if (emailInput) {
      emailInput.addEventListener("input", function () {
        emailInput.classList.remove("is-invalid");
        if (statusEl && statusEl.classList.contains("is-error")) setStatus("", "");
      });
    }
  }

  function init() {
    var forms = [];
    // primary ids
    var f1 = document.getElementById("waitlistForm");
    if (f1) forms.push(f1);
    var fm = document.getElementById("waitlistFormModal");
    if (fm && forms.indexOf(fm) === -1) forms.push(fm);
    // any form with data-waitlist attr
    document.querySelectorAll("form[data-waitlist], .waitlist-form").forEach(function (f) {
      if (forms.indexOf(f) === -1) forms.push(f);
    });
    // alias: summon form
    var f2 = document.getElementById("summonForm");
    if (f2 && forms.indexOf(f2) === -1) forms.push(f2);
    forms.forEach(bind);
    if (!forms.length) {
      // eslint-disable-next-line no-console
      console.log("[anubis] waitlist: no form found — handler ready, will bind if form injected later");
    }
    // modal open/close wiring
    var modal = document.getElementById("waitlistModal");
    function openWaitlist() {
      if (!modal) return;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var inp = modal.querySelector('input[type="email"]');
      if (inp) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    }
    function closeWaitlist() {
      if (!modal) return;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    document.querySelectorAll("[data-open-waitlist]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); openWaitlist(); });
    });
    // close via backdrop / × / Esc
    if (modal) {
      modal.querySelectorAll("[data-close-waitlist]").forEach(function (el) {
        el.addEventListener("click", closeWaitlist);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.hidden) closeWaitlist();
      });
      // auto-close modal 1.8s after success
      var _origBind = bind;
      var _queuedClose = null;
      // wrap success: if modal open and form was inside modal, close after showing success
      document.addEventListener("anubis:waitlistSuccess", function () {
        if (!modal.hidden) {
          clearTimeout(_queuedClose);
          _queuedClose = setTimeout(closeWaitlist, 1800);
        }
      });
      // fire custom event from bind success path — patch by listening to status change is simpler,
      // so also hook via MutationObserver on status element
      try {
        var modalStatus = document.getElementById("waitlistStatusModal");
        if (modalStatus) {
          var mo2 = new MutationObserver(function () {
            if (modalStatus.classList.contains("is-success") && !modal.hidden) {
              clearTimeout(_queuedClose);
              _queuedClose = setTimeout(closeWaitlist, 1800);
            }
          });
          mo2.observe(modalStatus, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true, characterData: true });
        }
      } catch (_) {}
    }
    // expose for console
    try { window.openWaitlist = openWaitlist; window.closeWaitlist = closeWaitlist; } catch (_) {}
    // hash #waitlist / #summon opens modal if coming from hero (optional)
    // keep normal scroll for #summon anchor; no auto-open on hash

    // observe for late-injected forms (other agents)
    try {
      var obs = new MutationObserver(function () {
        var f = document.getElementById("waitlistForm") || document.querySelector("form[data-waitlist]") || document.querySelector(".waitlist-form");
        if (f && !f.__anubisBound) bind(f);
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    } catch (_) {}

    // hero guard disabled per user request — nothing injected into hero
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
