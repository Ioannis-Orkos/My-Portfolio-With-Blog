(function () {
  const API_BASE = window.AUTH_API_BASE || "http://localhost:4001";
  const TOKEN_KEY = "portfolio_auth_token";
  const LOGIN_AUTOCLOSE_MS = 3000;
  const MODAL_HASHES = new Set(["#login", "#contact"]);

  const state = {
    loginCloseTimer: null,
    lastPageHash: "#home",
    currentUser: null,
  };

  const dom = {
    modal: null,
    modalContent: null,
    closeBtn: null,

    loginForm: null,
    signupForm: null,
    loginStatus: null,
    signupStatus: null,
    loginSubmitBtn: null,
    signupSubmitBtn: null,

    userState: null,
    protectedProjectsTitle: null,
    projectsList: null,
    logoutBtn: null,

    googleBtn: null,
    githubBtn: null,

    tabLoginBtn: null,
    tabSignupBtn: null,
    showSignupBtn: null,
    showLoginBtn: null,

    viewLogin: null,
    viewSignup: null,
    viewWelcome: null,
    authSwitch: null,
    authSocialBlock: null,

    navLoginLink: null,
    mobileNavLoginLink: null,
  };

  /**
   * Handles getToken.
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  /**
   * Handles saveToken.
   */
  function saveToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Handles clearToken.
   */
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Handles clearLoginCloseTimer.
   */
  function clearLoginCloseTimer() {
    if (!state.loginCloseTimer) return;
    clearTimeout(state.loginCloseTimer);
    state.loginCloseTimer = null;
  }

  /**
   * Handles apiFetch.
   */
  async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers,
      ...options,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return { response, payload };
  }

  /**
   * Handles statusMessage.
   */
  function statusMessage(status, fallback) {
    if (status === 401) return "Invalid credentials. Check email and password.";
    if (status === 409) return "Email already exists. Try login instead.";
    if (status === 429) return "Too many attempts. Please try again later.";
    return fallback || "Request failed. Please try again.";
  }

  /**
   * Handles setLoading.
   */
  function setLoading(button, isLoading, busyText, idleText) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? busyText : idleText;
  }

  /**
   * Handles setStatus.
   */
  function setStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("auth-status-error", Boolean(isError));
  }

  /**
   * Handles setHeaderAuthLabel.
   */
  function setHeaderAuthLabel(user) {
    const label = user ? user.name || user.email || "Account" : "Login";
    if (dom.navLoginLink) dom.navLoginLink.textContent = label;
    if (dom.mobileNavLoginLink) dom.mobileNavLoginLink.textContent = label;
  }

  /**
   * Handles emitAuthState.
   */
  function emitAuthState(user) {
    window.dispatchEvent(
      new CustomEvent("auth:state", {
        detail: {
          authenticated: Boolean(user),
          user: user || null,
        },
      })
    );
  }

  /**
   * Handles setView.
   */
  function setView(mode) {
    const isLogin = mode === "login";
    const isSignup = mode === "signup";
    const isWelcome = mode === "welcome";

    dom.viewLogin?.classList.toggle("auth-hidden", !isLogin);
    dom.viewSignup?.classList.toggle("auth-hidden", !isSignup);
    dom.viewWelcome?.classList.toggle("auth-hidden", !isWelcome);

    dom.tabLoginBtn?.classList.toggle("active", isLogin);
    dom.tabSignupBtn?.classList.toggle("active", isSignup);

    dom.authSwitch?.classList.toggle("auth-hidden", isWelcome);
    dom.authSocialBlock?.classList.toggle("auth-hidden", isWelcome);
  }

  /**
   * Handles renderProjects.
   */
  function renderProjects(projects) {
    if (!dom.projectsList) return;

    dom.projectsList.innerHTML = "";
    if (!projects || !projects.length) return;

    projects.forEach((project) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = project.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = project.name;
      li.appendChild(a);
      dom.projectsList.appendChild(li);
    });
  }

  /**
   * Handles loadProtectedProjects.
   */
  async function loadProtectedProjects() {
    const { response, payload } = await apiFetch("/projects/links", { method: "GET" });
    if (!response.ok) return renderProjects([]);
    renderProjects(payload?.projects || []);
  }

  /**
   * Handles resetLoggedOutUI.
   */
  function resetLoggedOutUI() {
    state.currentUser = null;
    setHeaderAuthLabel(null);
    if (dom.userState) dom.userState.textContent = "Welcome";
    if (dom.protectedProjectsTitle) dom.protectedProjectsTitle.classList.remove("auth-hidden");
    if (dom.projectsList) dom.projectsList.classList.remove("auth-hidden");
    renderProjects([]);
    setView("login");
    setStatus(dom.loginStatus, "");
    setStatus(dom.signupStatus, "");
    emitAuthState(null);
  }

  /**
   * Handles checkSession.
   */
  async function checkSession() {
    try {
      if (!getToken()) {
        resetLoggedOutUI();
        return false;
      }

      const { response, payload } = await apiFetch("/auth/me", { method: "GET" });
      if (!response.ok || !payload?.user) {
        clearToken();
        resetLoggedOutUI();
        return false;
      }

      const user = payload.user;
      state.currentUser = user;
      setHeaderAuthLabel(user);
      if (dom.userState) dom.userState.textContent = `Welcome ${user.name || user.email}`;
      const isAdmin = user.role === "admin";
      if (dom.protectedProjectsTitle) {
        dom.protectedProjectsTitle.classList.toggle("auth-hidden", isAdmin);
      }
      if (dom.projectsList) {
        dom.projectsList.classList.toggle("auth-hidden", isAdmin);
      }
      setView("welcome");
      if (!isAdmin) {
        await loadProtectedProjects();
      } else {
        renderProjects([]);
      }
      emitAuthState(user);
      return true;
    } catch {
      resetLoggedOutUI();
      setStatus(dom.loginStatus, "Auth server unavailable.", true);
      return false;
    }
  }

  /**
   * Handles closeModal.
   */
  function closeModal() {
    clearLoginCloseTimer();
    if (!dom.modal) return;

    dom.modal.classList.remove("active");
    dom.modal.setAttribute("aria-hidden", "true");

    if (window.location.hash === "#login") {
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
   * Handles openModal.
   */
  function openModal() {
    clearLoginCloseTimer();
    if (!dom.modal) return;

    const currentHash = window.location.hash || "#home";
    if (!MODAL_HASHES.has(currentHash)) {
      state.lastPageHash = currentHash;
    }

    dom.modal.classList.add("active");
    dom.modal.setAttribute("aria-hidden", "false");
    checkSession();
  }

  /**
   * Handles scheduleModalAutoCloseAfterLogin.
   */
  function scheduleModalAutoCloseAfterLogin() {
    clearLoginCloseTimer();
    if (!dom.modal?.classList.contains("active")) return;

    state.loginCloseTimer = setTimeout(() => {
      closeModal();
    }, LOGIN_AUTOCLOSE_MS);
  }

  /**
   * Handles onLoginSubmit.
   */
  async function onLoginSubmit(event) {
    event.preventDefault();

    const formData = new FormData(dom.loginForm);
    const email = String(formData.get("email") || formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setStatus(dom.loginStatus, "Email and password are required.", true);
      return;
    }

    setLoading(dom.loginSubmitBtn, true, "Signing in...", "Login");
    setStatus(dom.loginStatus, "Signing in...");

    try {
      const { response, payload } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setStatus(dom.loginStatus, statusMessage(response.status, payload?.error), true);
        return;
      }

      if (payload?.token) saveToken(payload.token);
      setStatus(dom.loginStatus, "Login successful.");
      dom.loginForm.reset();

      await checkSession();
      scheduleModalAutoCloseAfterLogin();
    } catch {
      setStatus(dom.loginStatus, "Auth server is unavailable.", true);
    } finally {
      setLoading(dom.loginSubmitBtn, false, "Signing in...", "Login");
    }
  }

  /**
   * Handles onSignupSubmit.
   */
  async function onSignupSubmit(event) {
    event.preventDefault();

    const formData = new FormData(dom.signupForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || formData.get("new-password") || "");
    const confirm = String(
      formData.get("passwordConfirm") || formData.get("new-password-confirm") || ""
    );

    if (!email || !password) {
      setStatus(dom.signupStatus, "Email and password are required.", true);
      return;
    }
    if (password !== confirm) {
      setStatus(dom.signupStatus, "Passwords do not match.", true);
      return;
    }

    setLoading(dom.signupSubmitBtn, true, "Creating...", "Create Account");
    setStatus(dom.signupStatus, "Creating account...");

    try {
      const { response, payload } = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        setStatus(dom.signupStatus, statusMessage(response.status, payload?.error), true);
        return;
      }

      if (payload?.token) saveToken(payload.token);
      setStatus(dom.signupStatus, "Account created.");
      dom.signupForm.reset();
      await checkSession();
    } catch {
      setStatus(dom.signupStatus, "Auth server is unavailable.", true);
    } finally {
      setLoading(dom.signupSubmitBtn, false, "Creating...", "Create Account");
    }
  }

  /**
   * Handles onLogout.
   */
  async function onLogout() {
    clearToken();
    resetLoggedOutUI();

    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
  }

  /**
   * Handles bindSocialButtons.
   */
  function bindSocialButtons() {
    dom.googleBtn?.addEventListener("click", () => {
      window.location.href = `${API_BASE}/auth/google`;
    });
    dom.githubBtn?.addEventListener("click", () => {
      window.location.href = `${API_BASE}/auth/github`;
    });
  }

  /**
   * Handles bindModalOutsideClickClose.
   */
  function bindModalOutsideClickClose() {
    document.addEventListener("mousedown", (event) => {
      if (!dom.modal?.classList.contains("active")) return;

      const target = event.target;
      if (target.closest("#nav-login-link, #mobile-nav-login-link, [data-target='login']")) return;
      if (dom.modalContent && !dom.modalContent.contains(target)) closeModal();
    });
  }

  /**
   * Handles cacheDom.
   */
  function cacheDom() {
    dom.modal = document.getElementById("login");
    dom.modalContent = dom.modal?.querySelector(".auth-modal");
    dom.closeBtn = document.getElementById("login-modal-close");

    dom.loginForm = document.getElementById("login-form");
    dom.signupForm = document.getElementById("signup-form");
    dom.loginStatus = document.getElementById("login-status");
    dom.signupStatus = document.getElementById("signup-status");
    dom.loginSubmitBtn = dom.loginForm?.querySelector('button[type="submit"]');
    dom.signupSubmitBtn = dom.signupForm?.querySelector('button[type="submit"]');

    dom.userState = document.getElementById("auth-user-state");
    dom.protectedProjectsTitle = document.getElementById("protected-projects-title");
    dom.projectsList = document.getElementById("protected-projects");
    dom.logoutBtn = document.getElementById("logout-btn");

    dom.googleBtn = document.getElementById("google-login-btn");
    dom.githubBtn = document.getElementById("github-login-btn");

    dom.tabLoginBtn = document.getElementById("auth-tab-login");
    dom.tabSignupBtn = document.getElementById("auth-tab-signup");
    dom.showSignupBtn = document.getElementById("show-signup-btn");
    dom.showLoginBtn = document.getElementById("show-login-btn");

    dom.viewLogin = document.getElementById("auth-view-login");
    dom.viewSignup = document.getElementById("auth-view-signup");
    dom.viewWelcome = document.getElementById("auth-view-welcome");
    dom.authSwitch = document.getElementById("auth-switch");
    dom.authSocialBlock = document.getElementById("auth-social-block");

    dom.navLoginLink = document.getElementById("nav-login-link");
    dom.mobileNavLoginLink = document.getElementById("mobile-nav-login-link");
  }

  /**
   * Handles bindEvents.
   */
  function bindEvents() {
    dom.loginForm?.addEventListener("submit", onLoginSubmit);
    dom.signupForm?.addEventListener("submit", onSignupSubmit);
    dom.logoutBtn?.addEventListener("click", onLogout);

    dom.tabLoginBtn?.addEventListener("click", () => setView("login"));
    dom.tabSignupBtn?.addEventListener("click", () => setView("signup"));
    dom.showSignupBtn?.addEventListener("click", () => setView("signup"));
    dom.showLoginBtn?.addEventListener("click", () => setView("login"));

    dom.closeBtn?.addEventListener("click", closeModal);
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#login") openModal();
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

    bindSocialButtons();
    bindModalOutsideClickClose();
  }

  /**
   * Handles initAuth.
   */
  function initAuth() {
    cacheDom();
    if (!dom.modal || !dom.loginForm || !dom.signupForm) return;

    const initialHash = window.location.hash || "#home";
    if (!MODAL_HASHES.has(initialHash)) {
      state.lastPageHash = initialHash;
    }

    bindEvents();
    resetLoggedOutUI();
    checkSession();
  }

  window.AuthModule = {
    initAuth,
    checkSession,
    openModal,
    closeModal,
    getToken,
    getCurrentUser: () => state.currentUser,
  };
})();
