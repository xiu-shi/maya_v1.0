// --- Theme ---
function initializeTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateThemeIcon(next);
      this.style.transform = "rotate(360deg)";
      setTimeout(() => (this.style.transform = "rotate(0deg)"), 300);
    });
  }
}
function updateThemeIcon(theme) {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const icon = themeToggle.querySelector(".theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
    themeToggle.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} mode`
    );
  }
}

// --- Navigation ---
function initializeNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
      const targetId = this.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  window.addEventListener("scroll", updateActiveNavLink);
}
function updateActiveNavLink() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  let current = "";
  sections.forEach((section) => {
    const top = section.offsetTop;
    if (window.pageYOffset >= top - 200) current = section.id;
  });
  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${current}`
    );
  });
}

// --- Hero Slideshow (scoped & compatible with inline onclick) ---
let slideIndex = 0;
let slideCount = 0;

function initializeSlideshow() {
  const slides = document.querySelectorAll(".hero-slideshow .slide");
  const indicators = document.querySelectorAll(".slide-indicators .indicator");
  slideCount = slides.length;
  if (!slideCount) return;

  function apply() {
    slides.forEach((s, i) => s.classList.toggle("active", i === slideIndex));
    indicators.forEach((b, i) =>
      b.classList.toggle("active", i === slideIndex)
    );
  }

  // keep inline onclicks working
  window.changeSlide = function (dir) {
    slideIndex = (slideIndex + dir + slideCount) % slideCount;
    apply();
  };
  window.currentSlide = function (n) {
    const idx = (n | 0) - 1;
    slideIndex = Math.max(0, Math.min(slideCount - 1, idx));
    apply();
  };

  // allow clicking dots too
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      slideIndex = index;
      apply();
    });
  });

  apply();
  setInterval(() => window.changeSlide(1), 5000);
}

// --- Minimal gallery stubs (prevents errors; visuals deferred) ---
function openGallery(/* id */) {
  // Optional: toast/alert; keeping it silent for now
  const overlay = document.getElementById("galleryOverlay");
  if (overlay) overlay.classList.remove("active"); // ensure hidden
}
function closeGallery() {
  const overlay = document.getElementById("galleryOverlay");
  if (overlay) overlay.classList.remove("active");
}

function addYouTubeVideo() {}
function removeGalleryItem() {}
function viewFullSizeImage() {}
function playYouTubeVideo(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}
window.openGallery = openGallery;
window.closeGallery = closeGallery;
window.addYouTubeVideo = addYouTubeVideo;
window.removeGalleryItem = removeGalleryItem;
window.playYouTubeVideo = playYouTubeVideo;

// --- Carousel (fixed version) ---
let carouselCurrentSlide = 0;
let carouselTotalSlides = 0;

function initializeCarousel() {
  const track = document.getElementById("carouselTrack");
  if (!track) return;
  const slides = track.querySelectorAll(".carousel-slide");
  carouselTotalSlides = slides.length;
  if (!carouselTotalSlides) return;

  function updateCarouselDisplay() {
    const translateX = -carouselCurrentSlide * 100;
    track.style.transform = `translateX(${translateX}%)`;
    document.querySelectorAll(".carousel-indicator").forEach((ind, i) => {
      ind.classList.toggle("active", i === carouselCurrentSlide);
    });
  }

  window.carouselNextSlide = function () {
    carouselCurrentSlide = (carouselCurrentSlide + 1) % carouselTotalSlides;
    updateCarouselDisplay();
  };
  window.carouselPrevSlide = function () {
    carouselCurrentSlide =
      (carouselCurrentSlide - 1 + carouselTotalSlides) % carouselTotalSlides;
    updateCarouselDisplay();
  };
  window.carouselGoToSlide = function (i) {
    carouselCurrentSlide = i;
    updateCarouselDisplay();
  };

  // touch swipe
  let sx = 0,
    ex = 0;
  track.addEventListener(
    "touchstart",
    (e) => (sx = e.changedTouches[0].screenX),
    { passive: true }
  );
  track.addEventListener(
    "touchend",
    (e) => {
      ex = e.changedTouches[0].screenX;
      const diff = sx - ex;
      if (Math.abs(diff) > 50)
        diff > 0 ? window.carouselNextSlide() : window.carouselPrevSlide();
    },
    { passive: true }
  );

  // autoplay + hover pause
  let auto;
  const start = () => (auto = setInterval(window.carouselNextSlide, 5000));
  const stop = () => clearInterval(auto);
  start();
  const container = document.querySelector(".carousel-container");
  if (container) {
    container.addEventListener("mouseenter", stop);
    container.addEventListener("mouseleave", start);
  }

  updateCarouselDisplay();
}

// --- Contact form ---
function initializeContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    portfolio: document.getElementById("portfolio"),
    linkedin: document.getElementById("linkedin"),
    github: document.getElementById("github"),
    message: document.getElementById("message"),
    humanVerification: document.getElementById("humanVerification"),
  };
  const errors = {
    name: document.getElementById("nameError"),
    email: document.getElementById("emailError"),
    portfolio: document.getElementById("portfolioError"),
    linkedin: document.getElementById("linkedinError"),
    github: document.getElementById("githubError"),
    message: document.getElementById("messageError"),
    verification: document.getElementById("verificationError"),
  };
  const counter = document.getElementById("messageCounter");
  const submitBtn = document.getElementById("submitBtn");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidURL = (v) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  };

  function validate() {
    let ok = true;

    // name
    if (!fields.name.value.trim()) {
      errors.name.textContent = "Name is required";
      ok = false;
    } else if (fields.name.value.length > 40) {
      errors.name.textContent = "Maximum 40 characters";
      ok = false;
    } else {
      errors.name.textContent = "";
    }

    // email
    const ev = fields.email.value.trim();
    if (!ev || !isValidEmail(ev) || ev.length > 40) {
      errors.email.textContent = "Enter a valid email (≤ 40 chars)";
      ok = false;
    } else {
      errors.email.textContent = "";
    }

    // urls (optional)
    ["portfolio", "linkedin", "github"].forEach((k) => {
      const raw = fields[k].value.trim();
      if (!raw) {
        errors[k].textContent = "";
        return;
      }
      const val = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const tooLong =
        (k === "portfolio" && val.length > 90) ||
        ((k === "linkedin" || k === "github") && val.length > 60);
      if (!isValidURL(val) || tooLong) {
        errors[k].textContent = "Please enter a valid URL";
        ok = false;
      } else {
        errors[k].textContent = "";
        fields[k].value = val;
      }
    });

    // message
    if (fields.message.value.length > 150) {
      errors.message.textContent = "Message must be 150 characters or less";
      ok = false;
    } else {
      errors.message.textContent = "";
    }

    // human
    if (!fields.humanVerification.checked) {
      errors.verification.textContent = "Please confirm you are human";
      ok = false;
    } else {
      errors.verification.textContent = "";
    }

    submitBtn.disabled = !ok;
    return ok;
  }

  Object.values(fields).forEach(
    (el) => el && el.addEventListener("input", validate)
  );
  fields.humanVerification &&
    fields.humanVerification.addEventListener("change", validate);
  if (counter && fields.message) {
    fields.message.addEventListener(
      "input",
      () => (counter.textContent = fields.message.value.length)
    );
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;
    submitBtn.disabled = true;

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      portfolio: fields.portfolio.value.trim(),
      linkedin: fields.linkedin.value.trim(),
      github: fields.github.value.trim(),
      message: fields.message.value.trim(),
      humanVerification: true,
    };

    try {
      const res = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {}

      if (res.ok) {
        alert("Thanks! Your message was sent.");
        form.reset();
        if (counter) counter.textContent = "0";
      } else {
        alert(
          (data && data.error) ||
            "Sorry, something went wrong sending your message."
        );
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// --- Boot ---
document.addEventListener("DOMContentLoaded", function () {
  initializeTheme();
  initializeNavigation();
  initializeSlideshow();
  initializeCarousel();
  initializeContactForm();
});

// [UPDATE 2025-08-18]: Helper for hero slideshow images
// - Logs natural image dimensions in console for verification.
// - Supports optional per-image focal point via data-focus-x / data-focus-y (e.g., data-focus-x="50%" data-focus-y="30%").
document.addEventListener("DOMContentLoaded", function () {
  try {
    var heroImgs = document.querySelectorAll(".slideshow-container img");
    heroImgs.forEach(function (img) {
      // Apply optional focal point if provided
      var fx = img.getAttribute("data-focus-x");
      var fy = img.getAttribute("data-focus-y");
      if (fx || fy) {
        img.style.objectPosition = (fx || "50%") + " " + (fy || "50%");
      }
      // Log natural size for quick QA
      if (img.complete) {
        console.log(
          "[hero]",
          img.currentSrc || img.src,
          "natural=",
          img.naturalWidth + "x" + img.naturalHeight
        );
      } else {
        img.addEventListener(
          "load",
          function () {
            console.log(
              "[hero]",
              img.currentSrc || img.src,
              "natural=",
              img.naturalWidth + "x" + img.naturalHeight
            );
          },
          { once: true }
        );
      }
    });
  } catch (e) {
    // No-op if hero not present on this page
  }
});

// =============================================================
// Contact Form Validation & Submit (Desktop + Mobile, Light + Dark)
// Version: 23 Aug 2025 (v7.4 - single controlled submit, no double-send)
//
// ─────────────────────────────────────────────────────────────
// LOGICAL FLOW (high-level):
// 1) Boot & Discover forms (desktop + mobile):
//    • Wait for DOMContentLoaded; find ALL forms (#contactForm or .contact-form).
//    • Bind each form once; watch DOM with a MutationObserver for late/injected
//      mobile variants and bind them too (per-form scoping).
//
// 2) Per-form setup (scoped to that one form):
//    • Resolve inputs/spans INSIDE the form (ID or name fallback).
//    • Define patterns and helpers; setError() FORCES error text visible so
//      theme CSS (light/dark) can’t hide it.
//    • Live validators (input/blur) for instant feedback.
//    • Submit button gating via quick, side-effect-free checks.
//
// 3) Submission hardening (❗ key change to stop double emails):
//    • We handle submission in ONE place: a CAPTURE-PHASE 'submit' handler
//      that ALWAYS calls preventDefault() + stopImmediatePropagation().
//      - If INVALID → show errors + focus first problem, STOP.
//      - If VALID   → send via fetch() exactly once.
//    • Add an in-flight flag to block rapid double-clicks/taps.
//    • Override form.submit() to call requestSubmit(), so programmatic
//      submits also flow through our single handler (no bypass).
//    • Guards for Enter/“Go” key (mobile keyboards) and submit button clicks.
//
// 4) Controlled send:
//    • Optional dev-mode guard (file://, localhost).
//    • POST JSON payload; handle server errors; reset UI on success.
//
// Works across desktop & mobile (multiple form instances) and
// light/dark themes (forced error visibility).
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("[contactForm] loaded v7.4");

  // ── DESKTOP + MOBILE: find all potential forms now and later
  const selectors = "#contactForm, form.contact-form";

  // Bind forms present at DOMContentLoaded
  Array.from(document.querySelectorAll(selectors))
    .filter((el, i, arr) => arr.indexOf(el) === i)
    .forEach(bindFormSafely);

  // Bind any that appear after window load (e.g., accordions)
  window.addEventListener(
    "load",
    () => {
      document.querySelectorAll(selectors).forEach(bindFormSafely);
    },
    { once: true }
  );

  // Observe DOM for injected mobile forms (SPA/responsive swaps)
  const mo = new MutationObserver(() => {
    document.querySelectorAll(selectors).forEach(bindFormSafely);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Ensure each form is only bound once
  function bindFormSafely(form) {
    if (!form || form.dataset.vHandlerBound === "1") return;
    bindForm(form);
    form.dataset.vHandlerBound = "1";
  }

  // ── DESKTOP + MOBILE: per-form binding (scoped queries)
  function bindForm(form) {
    // ===== Config =====
    const MIN_MESSAGE = 20;
    const MIN_NAME_LETTERS = 5;

    // ===== Scoped Elements (ID first, then name fallback; keeps desktop/mobile isolated) =====
    const nameInput = form.querySelector('#name, [name="name"]');
    const emailInput = form.querySelector('#email, [name="email"]');
    const messageInput = form.querySelector('#message, [name="message"]');
    const verification = form.querySelector(
      '#humanVerification, [name="humanVerification"], #humanCheck, [name="humanCheck"]'
    );

    const portfolioInput = form.querySelector('#portfolio, [name="portfolio"]');
    const linkedinInput = form.querySelector('#linkedin, [name="linkedin"]');
    const githubInput = form.querySelector('#github, [name="github"]');

    const nameError = form.querySelector(
      '#nameError, .nameError, [data-error-for="name"]'
    );
    const emailError = form.querySelector(
      '#emailError, .emailError, [data-error-for="email"]'
    );
    const messageError = form.querySelector(
      '#messageError, .messageError, [data-error-for="message"]'
    );
    const verificationError = form.querySelector(
      '#verificationError, .verificationError, [data-error-for="humanVerification"]'
    );
    const portfolioError = form.querySelector(
      '#portfolioError, .portfolioError, [data-error-for="portfolio"]'
    );
    const linkedinError = form.querySelector(
      '#linkedinError, .linkedinError, [data-error-for="linkedin"]'
    );
    const githubError = form.querySelector(
      '#githubError, .githubError, [data-error-for="github"]'
    );

    const messageCounter = form.querySelector(
      "#messageCounter, .messageCounter"
    );
    const submitBtn = form.querySelector('#submitBtn, [type="submit"]');

    // ===== Patterns =====
    const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/; // letters/spaces/hyphens/apostrophes
    const EMAIL_REGEX =
      /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/; // starts with a letter
    const URL_GENERIC =
      /^(https?:\/\/)(www\.)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i;
    const URL_LINKEDIN =
      /^(https?:\/\/)(www\.)?linkedin\.com\/(in|company|school|pub)\/[A-Za-z0-9_-]+(\/.*)?$/i;
    const URL_GITHUB =
      /^(https?:\/\/)(www\.)?github\.com\/[A-Za-z0-9-]+(\/[A-Za-z0-9_.-]+(\/)?)?$/i;

    // ===== Helpers (force error visibility in light/dark) =====
    const countLetters = (s) =>
      (s || "").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").length;

    function setError(field, errorEl, msg) {
      if (field) {
        field.classList.remove("valid");
        field.classList.add("error");
        field.setAttribute("aria-invalid", "true");
      }
      if (errorEl) {
        errorEl.textContent = msg || "";
        errorEl.style.display = "block"; // override any theme hiding
        errorEl.removeAttribute("hidden");
        errorEl.classList.add("visible"); // optional CSS hook
        errorEl.setAttribute("role", "status");
        errorEl.setAttribute("aria-live", "polite");
      }
    }
    function clearError(field, errorEl) {
      if (field) {
        field.classList.remove("error");
        field.classList.add("valid");
        field.removeAttribute("aria-invalid");
      }
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = ""; // revert to CSS default
        errorEl.setAttribute("hidden", "true");
        errorEl.classList.remove("visible");
      }
    }
    function clearNeutral(field, errorEl) {
      if (field) {
        field.classList.remove("error", "valid");
        field.removeAttribute("aria-invalid");
      }
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "";
        errorEl.setAttribute("hidden", "true");
        errorEl.classList.remove("visible");
      }
    }

    // ===== Quick checks (used for enabling submit only; no side effects) =====
    const isNameValidQuick = () => {
      const v = (nameInput?.value || "").trim();
      return NAME_REGEX.test(v) && countLetters(v) >= MIN_NAME_LETTERS;
    };
    const isEmailValidQuick = () =>
      EMAIL_REGEX.test((emailInput?.value || "").trim());
    const isMessageValidQuick = () =>
      (messageInput?.value || "").trim().length >= MIN_MESSAGE;
    const isOptUrlValidQuick = (input, rx) => {
      if (!input) return true;
      const v = (input.value || "").trim();
      return !v || rx.test(v); // empty optional = OK
    };

    // ===== Full validators (show messages + classes) =====
    function validateName() {
      const v = (nameInput?.value || "").trim();
      if (!v) {
        setError(nameInput, nameError, "Please enter your name.");
        return false;
      }
      if (!NAME_REGEX.test(v)) {
        setError(
          nameInput,
          nameError,
          "Name can include letters (A–Z, accents), spaces, hyphens, and apostrophes (e.g., O’Connor). Please remove numbers or symbols like the backtick (`)."
        );
        return false;
      }
      if (countLetters(v) < MIN_NAME_LETTERS) {
        setError(
          nameInput,
          nameError,
          `Please enter at least ${MIN_NAME_LETTERS} letters in your name.`
        );
        return false;
      }
      clearError(nameInput, nameError);
      return true;
    }
    function validateEmail() {
      const v = (emailInput?.value || "").trim();
      if (!EMAIL_REGEX.test(v)) {
        setError(
          emailInput,
          emailError,
          "Please enter a valid email that starts with a letter (e.g., alice.smith@example.com)."
        );
        return false;
      }
      clearError(emailInput, emailError);
      return true;
    }
    function validateMessage() {
      const v = (messageInput?.value || "").trim();
      if (v.length < MIN_MESSAGE) {
        setError(
          messageInput,
          messageError,
          `Please add at least ${MIN_MESSAGE} characters (you have ${v.length}).`
        );
        return false;
      }
      clearError(messageInput, messageError);
      return true;
    }
    function validateHuman() {
      if (!verification?.checked) {
        setError(
          verification,
          verificationError,
          "Please confirm you are not a bot."
        );
        return false;
      }
      clearError(verification, verificationError);
      return true;
    }
    function validateOptionalUrl(field, errorEl, label, regex, example) {
      if (!field) return true;
      const v = (field.value || "").trim();
      if (!v) {
        clearNeutral(field, errorEl);
        return true;
      } // not required
      const ok = regex.test(v);
      if (!ok) {
        setError(
          field,
          errorEl,
          `${label} should be in the format: ${example}`
        );
        return false;
      }
      clearError(field, errorEl);
      return true;
    }
    const validatePortfolio = () =>
      validateOptionalUrl(
        portfolioInput,
        portfolioError,
        "Portfolio URL",
        URL_GENERIC,
        "https://yourdomain.com/page"
      );
    const validateLinkedIn = () =>
      validateOptionalUrl(
        linkedinInput,
        linkedinError,
        "LinkedIn URL",
        URL_LINKEDIN,
        "https://www.linkedin.com/in/your-handle"
      );
    const validateGitHub = () =>
      validateOptionalUrl(
        githubInput,
        githubError,
        "GitHub URL",
        URL_GITHUB,
        "https://github.com/username  or  https://github.com/username/repo"
      );

    // ===== Live handlers (Desktop + Mobile) =====
    nameInput?.addEventListener("input", validateName);
    nameInput?.addEventListener("blur", validateName);
    function handleMessageInput() {
      const v = (messageInput?.value || "").trim();
      if (messageCounter) messageCounter.textContent = v.length;
      if (v.length === 0) clearNeutral(messageInput, messageError);
      else if (v.length < MIN_MESSAGE)
        setError(
          messageInput,
          messageError,
          `Please add at least ${MIN_MESSAGE} characters (you have ${v.length}).`
        );
      else clearError(messageInput, messageError);
    }
    messageInput?.addEventListener("input", handleMessageInput);
    messageInput?.addEventListener("blur", handleMessageInput);
    handleMessageInput();
    portfolioInput?.addEventListener("input", validatePortfolio);
    portfolioInput?.addEventListener("blur", validatePortfolio);
    linkedinInput?.addEventListener("input", validateLinkedIn);
    linkedinInput?.addEventListener("blur", validateLinkedIn);
    githubInput?.addEventListener("input", validateGitHub);
    githubInput?.addEventListener("blur", validateGitHub);

    // ===== Submit button gating (Desktop + Mobile) =====
    function updateSubmitDisabled() {
      const ready =
        isNameValidQuick() &&
        isEmailValidQuick() &&
        isMessageValidQuick() &&
        (verification ? verification.checked : true) &&
        isOptUrlValidQuick(portfolioInput, URL_GENERIC) &&
        isOptUrlValidQuick(linkedinInput, URL_LINKEDIN) &&
        isOptUrlValidQuick(githubInput, URL_GITHUB);
      if (submitBtn) submitBtn.disabled = !ready;
    }
    form.addEventListener("input", updateSubmitDisabled);
    updateSubmitDisabled();

    // ===== Prevent bypass paths =====
    // Kill inline onsubmit (older templates)
    try {
      form.onsubmit = null;
    } catch (_) {}

    // Programmatic submit → funnel through our handler via requestSubmit()
    const origSubmit = HTMLFormElement.prototype.submit;
    form.submit = function patchedSubmit() {
      // Validate first; if valid, trigger the 'submit' event pipeline we control
      if (!runAllValidators()) return;
      if (typeof this.requestSubmit === "function") {
        this.requestSubmit();
      } else {
        // Fallback for very old browsers
        const tmp = document.createElement("button");
        tmp.type = "submit";
        tmp.style.display = "none";
        this.appendChild(tmp);
        tmp.click();
        this.removeChild(tmp);
      }
    };

    // Consolidated validator
    function runAllValidators() {
      return Boolean(
        validateName() &
          validateEmail() &
          validateMessage() &
          validateHuman() &
          validatePortfolio() &
          validateLinkedIn() &
          validateGitHub()
      );
    }

    // MOBILE KEYBOARD: block Enter/“Go” if invalid
    form.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
          if (!runAllValidators()) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }
      },
      true
    );

    // ===== Single, controlled submit (CAPTURE PHASE) to prevent double-send =====
    let isSubmitting = false; // in-flight guard for double taps/clicks

    form.addEventListener(
      "submit",
      async (e) => {
        // OWN the submit lifecycle no matter what other scripts do
        e.preventDefault();
        e.stopImmediatePropagation(); // critical: nothing else gets to run

        // Validate
        if (!runAllValidators()) {
          const firstError =
            form.querySelector(".error-message:not(:empty)")
              ?.previousElementSibling ||
            form.querySelector('.error, [aria-invalid="true"]');
          if (firstError && typeof firstError.focus === "function")
            firstError.focus();
          return;
        }

        // Block rapid re-submits
        if (isSubmitting) return;
        isSubmitting = true;
        if (submitBtn) submitBtn.disabled = true;

        // Dev-mode: avoid network/CORS while testing locally
        const DEV_MODE =
          location.protocol === "file:" ||
          location.hostname === "localhost" ||
          location.hostname === "127.0.0.1";
        if (DEV_MODE) {
          alert("Form validated. Skipping network call in local preview.");
          isSubmitting = false;
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        // Build payload
        const payload = {
          name: (nameInput?.value || "").trim(),
          email: (emailInput?.value || "").trim(),
          message: (messageInput?.value || "").trim(),
          humanVerification: verification ? !!verification.checked : true,
          portfolio: (portfolioInput?.value || "").trim(),
          linkedin: (linkedinInput?.value || "").trim(),
          github: (githubInput?.value || "").trim(),
        };

        try {
          const res = await fetch("https://janetxiushi.me/api/contact.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            mode: "cors",
            credentials: "omit",
          });

          if (!res.ok) {
            setError(
              messageInput,
              messageError,
              `Server error (${res.status}). Please try again later.`
            );
            messageInput?.focus();
            return;
          }

          const data = await res.json().catch(() => ({}));
          if (data && data.success === false) {
            setError(
              messageInput,
              messageError,
              data.error || "Submission failed on server. Please try again."
            );
            messageInput?.focus();
            return;
          }

          // Success UX & reset
          clearError(messageInput, messageError);
          alert("Thanks! Your message has been sent.");
          form.reset();

          // Reset visuals & counter
          [
            nameInput,
            emailInput,
            messageInput,
            verification,
            portfolioInput,
            linkedinInput,
            githubInput,
          ]
            .filter(Boolean)
            .forEach((el) => {
              el.classList.remove("error", "valid");
              el.removeAttribute("aria-invalid");
            });
          [
            nameError,
            emailError,
            messageError,
            verificationError,
            portfolioError,
            linkedinError,
            githubError,
          ]
            .filter(Boolean)
            .forEach((el) => (el.textContent = ""));
          updateSubmitDisabled();
          if (messageCounter) messageCounter.textContent = 0;
        } catch (err) {
          setError(
            messageInput,
            messageError,
            "Network/CORS error. If you are testing locally, open the live site to submit."
          );
          messageInput?.focus();
        } finally {
          isSubmitting = false;
          if (submitBtn)
            submitBtn.disabled = !(
              isNameValidQuick() &&
              isEmailValidQuick() &&
              isMessageValidQuick() &&
              (verification ? verification.checked : true) &&
              isOptUrlValidQuick(portfolioInput, URL_GENERIC) &&
              isOptUrlValidQuick(linkedinInput, URL_LINKEDIN) &&
              isOptUrlValidQuick(githubInput, URL_GITHUB)
            );
        }
      },
      true
    ); // CAPTURE PHASE (own it)
  }
});
