/* =========================================================================
   GLADIATOR GUTTERS — script.js
   Vanilla JS, no dependencies. Handles:
   1. Sticky header state on scroll
   2. Mobile nav (toggle + accordion submenus)
   3. Scroll-reveal animations (IntersectionObserver)
   4. Animated stat counters
   5. Testimonials carousel
   6. Quote form: validation + email delivery via Web3Forms (see note below)
   7. Footer year
   8. Floating call button

   ---------------------------------------------------------------------
   EMAIL DELIVERY NOTE FOR THE DEVELOPER / CLIENT
   ---------------------------------------------------------------------
   This site is 100% static (no server, no database). Quote-form
   submissions are delivered by Web3Forms (https://web3forms.com) — a
   free form-backend service. The visible contact email on the page
   (sales@gladiatorgutters.com) is NOT changed by this — Web3Forms just
   routes submissions to whatever inbox the access key is tied to.

   Setup required (one-time, ~2 minutes):
     1. Go to https://web3forms.com and create a free access key using
        sales@gladiatorgutters.com (no account needed).
     2. In index.html, find the quote form and replace
        YOUR_ACCESS_KEY_HERE (in the hidden "access_key" input) with the
        real key Web3Forms gives you.
     3. That's it — submissions will start arriving by email immediately,
        no confirmation-click step required.

   The <form> tag also carries action="https://api.web3forms.com/submit"
   method="POST" directly, so it still works as a plain HTML form even if
   JavaScript fails to load. When JS is available, the code below
   intercepts the submit and sends it via fetch() instead, so the page
   never navigates away — the success/error message appears inline.

   To use a different provider instead, change FORM_ENDPOINT below,
   update the response handling in initQuoteForm(), and swap the hidden
   fields in the form markup for that provider's required fields.
   ========================================================================= */

(function () {
  "use strict";

  const FORM_ENDPOINT = "https://api.web3forms.com/submit";

  // This single script.js is shared by index.html (lang="en") and es.html
  // (lang="es"). All user-facing form strings are picked from this table
  // based on <html lang="..."> so each page speaks its own language.
  const LANG = document.documentElement.lang === "es" ? "es" : "en";
  const STRINGS = {
    en: {
      nameError: "Please enter your full name.",
      phoneError: "Please enter a valid phone number.",
      emailError: "Please enter a valid email address.",
      zipError: "Please enter your address or ZIP code.",
      messageError: "Please add a short description.",
      formInvalid: "Please check the highlighted fields before continuing.",
      sending: "Sending...",
      success: "Thank you! Your quote request has been received. A specialist will contact you within 24 hours.",
      error: "We couldn't submit the form. Please call us directly at (817) 744-9446 and we'll be glad to help.",
    },
    es: {
      nameError: "Ingresa tu nombre completo.",
      phoneError: "Ingresa un tel\u00e9fono v\u00e1lido.",
      emailError: "Ingresa un correo electr\u00f3nico v\u00e1lido.",
      zipError: "Ingresa tu direcci\u00f3n o c\u00f3digo postal.",
      messageError: "Cu\u00e9ntanos brevemente qu\u00e9 necesitas.",
      formInvalid: "Revisa los campos marcados en rojo antes de continuar.",
      sending: "Enviando...",
      success: "\u00a1Gracias! Recibimos tu solicitud y un especialista te contactar\u00e1 en menos de 24 horas.",
      error: "No pudimos enviar el formulario. Ll\u00e1manos directamente al (817) 744-9446 y con gusto te atendemos.",
    },
  };
  const T = STRINGS[LANG];

  document.addEventListener("DOMContentLoaded", () => {
    initHeaderScroll();
    initMobileNav();
    initScrollReveal();
    initStatCounters();
    initTestimonialCarousel();
    initQuoteForm();
    initFooterYear();
    initFloatingCallButton();
    initGalleryFilter();
    initGalleryLightbox();
    initImageFallback();
  });

  /* ---------------------------------------------------------------------
     1. Sticky header shadow/border once the page scrolls
     --------------------------------------------------------------------- */
  function initHeaderScroll() {
    const header = document.querySelector(".header");
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------
     2. Mobile nav: hamburger toggle + accordion for Services/Areas
     --------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const panel = document.querySelector(".mobile-nav");
    if (!toggle || !panel) return;

    const closeMobileNav = () => {
      toggle.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      document.body.style.overflow = "";
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMobileNav();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        panel.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }
    });

    panel.querySelectorAll("[data-accordion-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const sub = trigger.nextElementSibling;
        if (!sub) return;
        const isOpen = sub.classList.contains("is-open");
        panel.querySelectorAll(".mobile-sub.is-open").forEach((el) => el.classList.remove("is-open"));
        if (!isOpen) sub.classList.add("is-open");
      });
    });

    // Close the panel when a real link inside it is followed
    panel.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", closeMobileNav);
    });

    // The header's own "Free Quote" button sits outside the mobile-nav panel
    // (next to the hamburger). If the menu is open and this is tapped, the
    // page jumps to #quote but the panel used to stay open on top of it —
    // close it here too, same as any in-panel link would.
    const headerQuoteBtn = document.querySelector(".header__actions .btn--accent");
    if (headerQuoteBtn) {
      headerQuoteBtn.addEventListener("click", () => {
        if (panel.classList.contains("is-open")) closeMobileNav();
      });
    }
  }

  /* ---------------------------------------------------------------------
     3. Scroll reveal
     --------------------------------------------------------------------- */
  function initScrollReveal() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     4. Animated stat counters (e.g. "25+ Years")
     --------------------------------------------------------------------- */
  function initStatCounters() {
    const counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      const suffix = el.getAttribute("data-count-suffix") || "";
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     5. Testimonials carousel
     --------------------------------------------------------------------- */
  function initTestimonialCarousel() {
    const track = document.querySelector("[data-testi-track]");
    const wrap = document.querySelector("[data-testi-wrap]");
    if (!track || !wrap) return;

    const cards = Array.from(track.children);
    const prevBtn = document.querySelector("[data-testi-prev]");
    const nextBtn = document.querySelector("[data-testi-next]");
    const dotsWrap = document.querySelector("[data-testi-dots]");
    let index = 0;
    let perView = getPerView();
    let autoTimer = null;

    function getPerView() {
      const w = window.innerWidth;
      if (w >= 1080) return 3;
      if (w >= 720) return 2;
      return 1;
    }

    function maxIndex() {
      return Math.max(cards.length - perView, 0);
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex(); i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir al testimonio " + (i + 1));
        if (i === index) dot.classList.add("is-active");
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    }

    function update() {
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      }
    }

    function goTo(i) {
      index = Math.min(Math.max(i, 0), maxIndex());
      update();
    }

    function next() {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
    }

    function prev() {
      index = index <= 0 ? maxIndex() : index - 1;
      update();
    }

    function restartAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(next, 6000);
    }

    nextBtn && nextBtn.addEventListener("click", () => { next(); restartAuto(); });
    prevBtn && prevBtn.addEventListener("click", () => { prev(); restartAuto(); });

    window.addEventListener("resize", () => {
      const newPerView = getPerView();
      if (newPerView !== perView) {
        perView = newPerView;
        index = 0;
        buildDots();
      }
      update();
    });

    buildDots();
    update();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) restartAuto();

    wrap.addEventListener("mouseenter", () => autoTimer && clearInterval(autoTimer));
    wrap.addEventListener("mouseleave", restartAuto);
  }

  /* ---------------------------------------------------------------------
     6. Quote form — validation + submission
     --------------------------------------------------------------------- */
  function initQuoteForm() {
    const form = document.querySelector("[data-quote-form]");
    if (!form) return;

    const statusBox = form.querySelector("[data-form-status]");
    const submitBtn = form.querySelector("[data-form-submit]");

    const rules = {
      name: (v) => v.trim().length >= 2 || T.nameError,
      phone: (v) => /^[\d\s()+\-]{7,20}$/.test(v.trim()) || T.phoneError,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || T.emailError,
      zip: (v) => v.trim().length >= 4 || T.zipError,
      message: (v) => v.trim().length >= 8 || T.messageError,
    };

    function validateField(field) {
      const rule = rules[field.name];
      if (!rule) return true;
      const result = rule(field.value);
      const wrapper = field.closest(".field");
      if (result === true) {
        wrapper.classList.remove("has-error");
        return true;
      }
      wrapper.classList.add("has-error");
      const errorEl = wrapper.querySelector(".field__error");
      if (errorEl) errorEl.textContent = result;
      return false;
    }

    form.querySelectorAll("input[name], textarea[name]").forEach((field) => {
      if (!rules[field.name]) return;
      field.addEventListener("blur", () => validateField(field));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Honeypot spam trap — if filled, silently drop.
      const honey = form.querySelector('input[name="botcheck"]');
      if (honey && honey.value) return;

      let isValid = true;
      form.querySelectorAll("input[name], textarea[name]").forEach((field) => {
        if (rules[field.name] && !validateField(field)) isValid = false;
      });

      if (!isValid) {
        showStatus(statusBox, "error", T.formInvalid);
        return;
      }

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      setLoading(submitBtn, true);
      hideStatus(statusBox);

      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data && data.success) {
          showStatus(statusBox, "success", T.success);
          form.reset();
        } else {
          throw new Error((data && data.message) || "Bad response");
        }
      } catch (err) {
        showStatus(statusBox, "error", T.error);
      } finally {
        setLoading(submitBtn, false);
      }
    });

    function setLoading(btn, isLoading) {
      if (!btn) return;
      btn.disabled = isLoading;
      btn.textContent = isLoading ? T.sending : btn.getAttribute("data-default-label") || btn.textContent;
    }

    function showStatus(box, type, message) {
      if (!box) return;
      box.textContent = message;
      box.classList.remove("is-success", "is-error");
      box.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
    }

    function hideStatus(box) {
      if (!box) return;
      box.classList.remove("is-visible");
    }

    const submitLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) submitBtn.setAttribute("data-default-label", submitLabel);
  }

  /* ---------------------------------------------------------------------
     7. Footer year
     --------------------------------------------------------------------- */
  function initFooterYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     8. Floating call button — appears once the visitor scrolls past the
        hero, stays fixed bottom-right, never covers the header/nav.
     --------------------------------------------------------------------- */
  function initFloatingCallButton() {
    const fab = document.querySelector("[data-fab-call]");
    if (!fab) return;

    const showAfter = 420; // px scrolled before the button appears
    let ticking = false;

    const update = () => {
      fab.classList.toggle("is-visible", window.scrollY > showAfter);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ---------------------------------------------------------------------
     9. Gallery category filter (gallery.html) — toggles which tiles are
        visible based on the selected pill; purely additive, no-ops on
        pages that don't have the filter bar.
     --------------------------------------------------------------------- */
  function initGalleryFilter() {
    const bar = document.querySelector("[data-gallery-filters]");
    const tiles = document.querySelectorAll("[data-gallery-grid] [data-category]");
    if (!bar || !tiles.length) return;

    const buttons = bar.querySelectorAll("[data-filter]");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");

        buttons.forEach((b) => b.classList.toggle("is-active", b === btn));

        tiles.forEach((tile) => {
          const show = filter === "all" || tile.getAttribute("data-category") === filter;
          tile.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     10. Gallery lightbox (gallery.html only) — clicking a photo opens it
         at full size with its category tag and caption. Prev/Next cycle
         through whichever tiles are currently visible (respecting the
         active filter pill), not the full unfiltered set.
     --------------------------------------------------------------------- */
  function initGalleryLightbox() {
    const grid = document.querySelector("[data-gallery-grid]");
    const lightbox = document.querySelector("[data-lightbox]");
    if (!grid || !lightbox) return;

    const tiles = Array.from(grid.querySelectorAll(".gallery-tile"));
    const imgEl = lightbox.querySelector("[data-lightbox-img]");
    const tagEl = lightbox.querySelector("[data-lightbox-tag]");
    const captionEl = lightbox.querySelector("[data-lightbox-caption]");
    const closeBtn = lightbox.querySelector("[data-lightbox-close]");
    const prevBtn = lightbox.querySelector("[data-lightbox-prev]");
    const nextBtn = lightbox.querySelector("[data-lightbox-next]");

    let currentIndex = -1;

    function visibleTiles() {
      return tiles.filter((t) => t.style.display !== "none");
    }

    function openAt(tile) {
      const list = visibleTiles();
      currentIndex = list.indexOf(tile);
      render();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("lightbox-open");
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function render() {
      const list = visibleTiles();
      const tile = list[currentIndex];
      if (!tile) return;
      const img = tile.querySelector("img");
      const tag = tile.querySelector(".gallery-tile__tag");
      const caption = tile.querySelector(".gallery-tile__caption");
      imgEl.src = img ? img.src : "";
      imgEl.alt = img ? img.alt : "";
      imgEl.style.visibility = ""; // clear any stale hidden state from a prior load
      tagEl.textContent = tag ? tag.textContent : "";
      tagEl.style.display = tag ? "" : "none";
      captionEl.textContent = caption ? caption.textContent : "";
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("lightbox-open");
      document.body.classList.remove("lightbox-open");
    }

    function step(delta) {
      const list = visibleTiles();
      if (!list.length) return;
      currentIndex = (currentIndex + delta + list.length) % list.length;
      render();
    }

    tiles.forEach((tile) => {
      tile.setAttribute("tabindex", "0");
      tile.setAttribute("role", "button");
      tile.addEventListener("click", () => openAt(tile));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAt(tile);
        }
      });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }

  /* ---------------------------------------------------------------------
     11. Image fallback — if a photo hasn't been added to /images/ yet (or
         fails to load for any reason), hide the browser's native
         broken-image glyph so the tile just shows its clean neutral
         background instead of a stray icon floating over the card.
     --------------------------------------------------------------------- */
  function initImageFallback() {
    document.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) return; // nothing loaded yet — not a broken image
      // Catches images that are already broken by the time this runs.
      if (img.complete && img.naturalWidth === 0) {
        img.style.visibility = "hidden";
      }
      img.addEventListener(
        "error",
        () => {
          img.style.visibility = "hidden";
        },
        { once: true }
      );
    });
  }
})();
