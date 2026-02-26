/**
 * Contact Module
 * Handles contact form validation, submission, and modal behaviors.
 */

(function () {
  const EMAIL_SERVICE_ID = "service_3tkfh67";
  const EMAIL_TEMPLATE_ID = "template_55tr6up";
  const EMAIL_PUBLIC_KEY = "0CfalwA7NXSuNVflV";

  const MODAL_HASHES = new Set(["#contact", "#login"]);
  const state = {
    lastPageHash: "#home",
  };

  const dom = {
    modal: null,
    modalContent: null,
    closeBtn: null,

    form: null,
    status: null,
    thankYou: null,
    submitBtn: null,

    cookieBanner: null,
    cookieAcceptBtn: null,
  };

  /**
   * Handles setStatus.
   */
  function setStatus(message, color = "") {
    if (!dom.status) return;
    dom.status.textContent = message;
    dom.status.style.color = color;
  }

  /**
   * Handles clearErrors.
   */
  function clearErrors() {
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
    });
    setStatus("");
  }

  /**
   * Handles showError.
   */
  function showError(id, message) {
    const errorEl = document.getElementById(id);
    if (errorEl) errorEl.textContent = message;
  }

  /**
   * Handles validateForm.
   */
  function validateForm() {
    let valid = true;

    const name = document.getElementById("name").value.trim();
    if (!name) {
      showError("name-error", "Name is required.");
      valid = false;
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(name)) {
      showError("name-error", "Name must be 2-50 letters.");
      valid = false;
    }

    const email = document.getElementById("email").value.trim();
    if (!email) {
      showError("email-error", "Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email-error", "Invalid email format.");
      valid = false;
    }

    const subject = document.getElementById("subject").value.trim();
    if (!subject) {
      showError("subject-error", "Subject is required.");
      valid = false;
    } else if (subject.length < 5 || subject.length > 100) {
      showError("subject-error", "Subject must be between 5 and 100 characters.");
      valid = false;
    }

    const message = document.getElementById("message").value.trim();
    if (!message) {
      showError("message-error", "Message is required.");
      valid = false;
    } else if (message.length < 10 || message.length > 1000) {
      showError("message-error", "Message must be between 10 and 1000 characters.");
      valid = false;
    }

    return valid;
  }

  /**
   * Handles resetFormState.
   */
  function resetFormState() {
    dom.form.style.display = "block";
    dom.thankYou.style.display = "none";
    dom.form.reset();
    dom.form.querySelectorAll("input, textarea, button").forEach((el) => {
      el.disabled = false;
    });
    setStatus("");
  }

  /**
   * Handles closeModal.
   */
  function closeModal() {
    dom.modal.classList.remove("active");
    resetFormState();
    if (window.location.hash === "#contact") {
      const targetHash = state.lastPageHash || "#home";
      const targetPage = targetHash.replace("#", "") || "home";
      history.replaceState({ page: targetPage }, "", targetHash);
      const navLinks = document.querySelectorAll("nav ul li a[data-target]");
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("data-target") === targetPage;
        link.classList.toggle("active", isActive);
      });
    }
  }

  /**
   * Handles sendEmail.
   */
  async function sendEmail() {
    if (typeof emailjs === "undefined") {
      setStatus("EmailJS is not loaded. Please check your internet connection.", "red");
      return;
    }

    dom.submitBtn.disabled = true;
    dom.submitBtn.textContent = "Sending...";

    const payload = {
      user_name: document.getElementById("name").value.trim(),
      user_email: document.getElementById("email").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      message: document.getElementById("message").value.trim(),
    };

    try {
      await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, payload);
      dom.form.style.display = "none";
      dom.thankYou.style.display = "block";
      dom.form.querySelectorAll("input, textarea, button").forEach((el) => {
        el.disabled = true;
      });
    } catch (error) {
      console.error("EmailJS Error:", error);
      setStatus("Failed to send the message. Please try again later.", "red");
    } finally {
      dom.submitBtn.disabled = false;
      dom.submitBtn.textContent = "Send Message";
    }
  }

  /**
   * Handles bindFormEvents.
   */
  function bindFormEvents() {
    dom.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearErrors();
      if (!validateForm()) return;
      await sendEmail();
    });
  }

  /**
   * Handles bindModalEvents.
   */
  function bindModalEvents() {
    dom.closeBtn?.addEventListener("click", closeModal);

    // Close when clicking anywhere outside contact modal content.
    document.addEventListener("mousedown", (event) => {
      if (!dom.modal.classList.contains("active")) return;
      if (dom.modalContent && !dom.modalContent.contains(event.target)) {
        closeModal();
      }
    });
  }

  /**
   * Handles initCookieBanner.
   */
  function initCookieBanner() {
    if (!dom.cookieBanner || !dom.cookieAcceptBtn) return;

    if (!localStorage.getItem("cookiesAccepted")) {
      dom.cookieBanner.classList.add("show");
    }

    dom.cookieAcceptBtn.addEventListener("click", () => {
      localStorage.setItem("cookiesAccepted", "true");
      dom.cookieBanner.classList.remove("show");
    });
  }

  /**
   * Handles cacheDom.
   */
  function cacheDom() {
    dom.modal = document.getElementById("contact");
    dom.modalContent = dom.modal?.querySelector(".contact-form-container");
    dom.closeBtn = document.querySelector("#contact .modal-close");

    dom.form = document.getElementById("contact-form");
    dom.status = document.getElementById("form-status");
    dom.thankYou = document.getElementById("thank-you-message");
    dom.submitBtn = document.getElementById("submit-button");

    dom.cookieBanner = document.getElementById("cookie-consent");
    dom.cookieAcceptBtn = document.getElementById("accept-cookies");
  }

  /**
   * Handles initContactForm.
   */
  function initContactForm() {
    cacheDom();
    if (!dom.modal || !dom.form) return;

    bindFormEvents();
    bindModalEvents();
    initCookieBanner();

    const initialHash = window.location.hash || "#home";
    if (!MODAL_HASHES.has(initialHash)) {
      state.lastPageHash = initialHash;
    }

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash || "#home";
      if (!MODAL_HASHES.has(hash)) {
        state.lastPageHash = hash;
      }
    });

    window.addEventListener("pagechange", (event) => {
      const page = event.detail?.page;
      if (!page) return;
      const hash = `#${page}`;
      if (!MODAL_HASHES.has(hash)) {
        state.lastPageHash = hash;
      }
    });

    emailjs.init(EMAIL_PUBLIC_KEY);
  }

  window.ContactModule = {
    initContactForm,
  };
})();
