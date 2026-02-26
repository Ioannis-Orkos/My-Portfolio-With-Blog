(function () {
  const PORTFOLIO_DATA_URL = '/portfolio/portfolio-data.json';
  const PORTFOLIO_SECTION_FALLBACK = 'portfolio';
  const HEIGHT_MESSAGE_TYPE = 'embedded-frame-height';
  const AUTH_API_BASE = window.AUTH_API_BASE || 'http://localhost:4001';
  const TOKEN_KEY = 'portfolio_auth_token';

  let portfolios = [];
  let filteredPortfolios = [];
  let selectedCategories = new Set();
  let activePortfolioFolder = null;
  let activePortfolioIframe = null;
  let accessState = {
    loaded: false,
    allowedKeys: new Set(),
  };

  let portfolioListEl;
  let portfolioSearchEl;
  let portfolioCategoriesEl;
  let mainContentEl;
  let portfolioStatusEl;
  let lockedAccessModalEl;

  /**
   * Handles getToken.
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  /**
   * Handles setPortfolioStatus.
   */
  function setPortfolioStatus(message, isError = false) {
    if (!portfolioStatusEl) return;
    portfolioStatusEl.textContent = message || '';
    portfolioStatusEl.style.color = isError ? 'var(--error-color)' : '';
  }

  /**
   * Handles requestAccess.
   */
  async function requestAccess(projectKey) {
    const token = getToken();
    if (!token) {
      setPortfolioStatus('Login first to request access.', true);
      window.location.hash = '#login';
      return;
    }

    try {
      const response = await fetch(`${AUTH_API_BASE}/api/access/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ projectKey }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok) {
        setPortfolioStatus(`Access request sent for ${projectKey}.`);
        return;
      }

      if (response.status === 409) {
        setPortfolioStatus(payload?.error || 'You already have access or a pending request.', true);
        return;
      }

      setPortfolioStatus(payload?.error || 'Failed to submit access request.', true);
    } catch {
      setPortfolioStatus('Auth server unavailable. Try again later.', true);
    }
  }

  /**
   * Handles openAuthModal.
   */
  function openAuthModal(view) {
    window.location.hash = '#login';
    window.setTimeout(() => {
      if (view === 'signup') {
        document.getElementById('auth-tab-signup')?.click();
      } else {
        document.getElementById('auth-tab-login')?.click();
      }
    }, 40);
  }

  /**
   * Handles closeLockedAccessModal.
   */
  function closeLockedAccessModal() {
    if (!lockedAccessModalEl) return;
    lockedAccessModalEl.classList.remove('active');
    lockedAccessModalEl.setAttribute('aria-hidden', 'true');
  }

  /**
   * Handles ensureLockedAccessModal.
   */
  function ensureLockedAccessModal() {
    if (lockedAccessModalEl) return lockedAccessModalEl;

    const modal = document.createElement('div');
    modal.className = 'locked-access-modal-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="locked-access-modal" role="dialog" aria-modal="true" aria-labelledby="locked-access-title">
        <h3 id="locked-access-title">Project Access Required</h3>
        <p id="locked-access-text">This project is locked. Create account and request access.</p>
        <div class="locked-access-actions">
          <button type="button" class="locked-access-btn" data-action="signup">Create Account</button>
          <button type="button" class="locked-access-btn" data-action="login">Login</button>
          <button type="button" class="locked-access-btn locked-access-btn-primary" data-action="request">Request Access</button>
          <button type="button" class="locked-access-btn locked-access-btn-danger" data-action="close">Close</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      const target = event.target;
      if (target === modal) closeLockedAccessModal();
    });

    modal.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const projectKey = modal.dataset.projectKey || '';

      if (action === 'close') {
        closeLockedAccessModal();
        return;
      }
      if (action === 'signup') {
        closeLockedAccessModal();
        openAuthModal('signup');
        return;
      }
      if (action === 'login') {
        closeLockedAccessModal();
        openAuthModal('login');
        return;
      }
      if (action === 'request') {
        await requestAccess(projectKey);
        closeLockedAccessModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLockedAccessModal();
    });

    document.body.appendChild(modal);
    lockedAccessModalEl = modal;
    return modal;
  }

  /**
   * Handles openLockedAccessModal.
   */
  function openLockedAccessModal(portfolio) {
    const modal = ensureLockedAccessModal();
    const text = modal.querySelector('#locked-access-text');
    if (text) {
      text.textContent = `"${portfolio.title}" is locked. Create account and request access.`;
    }
    modal.dataset.projectKey = portfolio.folder;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  /**
   * Handles loadAccessState.
   */
  async function loadAccessState() {
    const token = getToken();
    accessState = { loaded: true, allowedKeys: new Set() };
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_API_BASE}/api/access/my`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return;

      const keys = new Set();
      (payload?.access || []).forEach((project) => {
        if (project?.projectKey) keys.add(project.projectKey);
      });
      accessState.allowedKeys = keys;
    } catch {}
  }

  /**
   * Handles isKnownPortfolio.
   */
  function isKnownPortfolio(folder) {
    return portfolios.some((portfolio) => portfolio.folder === folder);
  }

  /**
   * Handles createPortfolioIframe.
   */
  function createPortfolioIframe(folder) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const iframe = document.createElement('iframe');
    iframe.src = `/portfolio/${folder}/index.html`;
    iframe.title = `Portfolio ${folder}`;
    iframe.loading = 'lazy';
    iframe.className = 'dynamic-embedded-page dynamic-portfolio-page';
    iframe.style.display = 'block';
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.minHeight = '100vh';
    iframe.style.transition = prefersReducedMotion ? 'none' : 'height 220ms ease';
    iframe.style.border = '0';
    iframe.style.background = 'transparent';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute(
      'sandbox',
      'allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads'
    );
    return iframe;
  }

  /**
   * Handles resizePortfolioIframe.
   */
  function resizePortfolioIframe(iframe, height) {
    const numericHeight = Number(height);
    if (!Number.isFinite(numericHeight) || numericHeight <= 0) return;
    const nextHeight = Math.max(numericHeight, window.innerHeight);
    iframe.style.height = `${nextHeight}px`;
  }

  /**
   * Handles handleIframeHeightMessage.
   */
  function handleIframeHeightMessage(event) {
    const data = event.data;
    if (!data || data.type !== HEIGHT_MESSAGE_TYPE) return;
    if (!activePortfolioIframe || event.source !== activePortfolioIframe.contentWindow) return;

    resizePortfolioIframe(activePortfolioIframe, data.height);
  }

  /**
   * Handles getOrCreatePortfolioSection.
   */
  function getOrCreatePortfolioSection(folder) {
    let section = document.getElementById(folder);
    if (!section) {
      section = document.createElement('section');
      section.id = folder;
      section.className = 'page';
      mainContentEl.appendChild(section);
    }
    return section;
  }

  /**
   * Handles clearPortfolioSection.
   */
  function clearPortfolioSection(folder) {
    const section = document.getElementById(folder);
    if (section) section.innerHTML = '';
  }

  /**
   * Handles unloadPortfolio.
   */
  function unloadPortfolio(folder) {
    clearPortfolioSection(folder);
    if (activePortfolioFolder === folder) {
      activePortfolioFolder = null;
      activePortfolioIframe = null;
    }
  }

  /**
   * Handles unloadAllPortfoliosExcept.
   */
  function unloadAllPortfoliosExcept(folderToKeep) {
    portfolios.forEach((portfolio) => {
      if (portfolio.folder !== folderToKeep) unloadPortfolio(portfolio.folder);
    });
  }

  /**
   * Handles navigateToPortfolio.
   */
  function navigateToPortfolio(folder, mode) {
    if (!window.NavigationModule) return;
    if (mode === 'replace' && typeof window.NavigationModule.navigateToLoad === 'function') {
      window.NavigationModule.navigateToLoad(folder);
      return;
    }
    if (mode === 'push' && typeof window.NavigationModule.navigateTo === 'function') {
      window.NavigationModule.navigateTo(folder);
    }
  }

  /**
   * Handles mountPortfolioIframe.
   */
  function mountPortfolioIframe(folder) {
    const section = getOrCreatePortfolioSection(folder);
    section.innerHTML = '';

    const iframe = createPortfolioIframe(folder);
    iframe.addEventListener('error', () => {
      section.innerHTML = '<p>Failed to load portfolio content. Please try again later.</p>';
      if (activePortfolioIframe === iframe) activePortfolioIframe = null;
    });
    iframe.addEventListener('load', () => {
      resizePortfolioIframe(iframe, window.innerHeight);
    });

    section.appendChild(iframe);
    activePortfolioFolder = folder;
    activePortfolioIframe = iframe;
  }

  /**
   * Handles loadPortfolio.
   */
  function loadPortfolio(folder, options = {}) {
    if (!isKnownPortfolio(folder)) return;

    const navigateMode = options.navigate || 'none';

    unloadAllPortfoliosExcept(folder);
    mountPortfolioIframe(folder);

    navigateToPortfolio(folder, navigateMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handles createPortfolioItem.
   */
  function createPortfolioItem(portfolio) {
    const item = document.createElement('div');
    item.classList.add('portfolio-item');
    const isLocked = Boolean(portfolio.locked);
    const hasAccess = !isLocked || accessState.allowedKeys.has(portfolio.folder);
    const lockedForUser = isLocked && !hasAccess;
    if (lockedForUser) item.classList.add('portfolio-item-locked');

    const img = document.createElement('img');
    img.src = `/portfolio/${portfolio.image}`;
    img.alt = portfolio.title;
    img.loading = 'lazy';

    const details = document.createElement('div');
    details.classList.add('portfolio-details');

    const title = document.createElement('h2');
    title.textContent = portfolio.title;

    const date = document.createElement('p');
    date.textContent = portfolio.date;
    date.classList.add('portfolio-date');

    const description = document.createElement('p');
    description.textContent = portfolio.description;
    description.classList.add('portfolio-description');

    const externalLink = portfolio.link || portfolio.url;
    details.appendChild(title);
    details.appendChild(date);
    details.appendChild(description);
    if (lockedForUser) {
      const lockNote = document.createElement('p');
      lockNote.className = 'portfolio-lock-note';
      lockNote.textContent = 'Locked project. Request access to open.';
      details.appendChild(lockNote);
    }
    if (externalLink && !lockedForUser) {
      const actions = document.createElement('div');
      actions.classList.add('content-card-actions');
      const linkAnchor = document.createElement('a');
      linkAnchor.href = externalLink;
      linkAnchor.textContent = portfolio.linkLabel || 'Open Link';
      linkAnchor.className = 'content-card-link-only';
      linkAnchor.target = portfolio.linkTarget || '_blank';
      linkAnchor.rel = 'noopener noreferrer';
      linkAnchor.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      actions.appendChild(linkAnchor);
      details.appendChild(actions);
    }

    if (lockedForUser) {
      const requestBtn = document.createElement('button');
      requestBtn.type = 'button';
      requestBtn.className = 'portfolio-request-icon';
      requestBtn.title = 'Request Access';
      requestBtn.setAttribute('aria-label', `Request access for ${portfolio.title}`);
      requestBtn.textContent = '🔐';
      requestBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        requestAccess(portfolio.folder);
      });
      item.appendChild(requestBtn);
    }

    item.appendChild(img);
    item.appendChild(details);

    item.addEventListener('click', () => {
      if (lockedForUser) {
        openLockedAccessModal(portfolio);
        return;
      }
      loadPortfolio(portfolio.folder, { navigate: 'push' });
    });
    return item;
  }

  /**
   * Handles listPortfolios.
   */
  function listPortfolios(dataArray) {
    portfolioListEl.innerHTML = '';
    if (!dataArray.length) {
      portfolioListEl.innerHTML = '<p>No portfolios found.</p>';
      return;
    }

    dataArray.forEach((portfolio) => {
      portfolioListEl.appendChild(createPortfolioItem(portfolio));
    });
  }

  /**
   * Handles filterPortfoliosByCategories.
   */
  function filterPortfoliosByCategories(categories) {
    return portfolios.filter((portfolio) =>
      portfolio.categories.some((cat) => categories.includes(cat))
    );
  }

  /**
   * Handles displayCategories.
   */
  function displayCategories() {
    const categoryCounts = {};

    portfolios.forEach((portfolio) => {
      portfolio.categories.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });

    portfolioCategoriesEl.innerHTML = '';

    Object.keys(categoryCounts).forEach((category) => {
      const button = document.createElement('button');
      button.textContent = category;
      button.classList.add('portfolio-category-button');

      const count = document.createElement('span');
      count.classList.add('portfolio-category-count');
      count.textContent = categoryCounts[category];
      button.appendChild(count);

      button.addEventListener('click', () => {
        if (selectedCategories.has(category)) {
          selectedCategories.delete(category);
          button.classList.remove('portfolio-category-active');
        } else {
          selectedCategories.add(category);
          button.classList.add('portfolio-category-active');
        }

        filteredPortfolios = selectedCategories.size
          ? filterPortfoliosByCategories([...selectedCategories])
          : portfolios;

        listPortfolios(filteredPortfolios);
      });

      portfolioCategoriesEl.appendChild(button);
    });
  }

  /**
   * Handles searchPortfolios.
   */
  function searchPortfolios(query) {
    const normalizedQuery = query.toLowerCase();
    if (!normalizedQuery) {
      listPortfolios(filteredPortfolios);
      return;
    }

    const searched = filteredPortfolios.filter(
      (portfolio) =>
        portfolio.title.toLowerCase().includes(normalizedQuery) ||
        portfolio.description.toLowerCase().includes(normalizedQuery)
    );

    listPortfolios(searched);
  }

  /**
   * Handles checkDirectPortfolioLoad.
   */
  function checkDirectPortfolioLoad() {
    const hashTarget = window.location.hash.replace('#', '') || 'home';
    if (isKnownPortfolio(hashTarget)) {
      loadPortfolio(hashTarget, { navigate: 'replace' });
    }
  }

  /**
   * Handles handlePageChange.
   */
  function handlePageChange(event) {
    const targetPage = event.detail?.page;
    if (!targetPage) return;

    if (isKnownPortfolio(targetPage)) {
      if (activePortfolioFolder !== targetPage) {
        loadPortfolio(targetPage, { navigate: 'none' });
      }
      return;
    }

    unloadAllPortfoliosExcept(null);
  }

  /**
   * Handles handleAuthStateChange.
   */
  async function handleAuthStateChange() {
    await loadAccessState();
    listPortfolios(filteredPortfolios);
  }

  /**
   * Handles fetchPortfolioData.
   */
  async function fetchPortfolioData() {
    const response = await fetch(PORTFOLIO_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load portfolios: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Handles initPortfolioList.
   */
  async function initPortfolioList() {
    portfolioListEl = document.getElementById('portfolios');
    portfolioSearchEl = document.getElementById('portfolio-search');
    portfolioCategoriesEl = document.getElementById('portfolio-categories');
    mainContentEl = document.getElementById('main-content');
    portfolioStatusEl = document.getElementById('portfolio-status');

    portfolios = [];
    filteredPortfolios = [];
    selectedCategories = new Set();
    activePortfolioFolder = null;
    activePortfolioIframe = null;

    if (!portfolioListEl || !portfolioSearchEl || !portfolioCategoriesEl || !mainContentEl) {
      console.error('[PortfolioModule] Missing required DOM elements.');
      return;
    }

    portfolioSearchEl.addEventListener('input', function () {
      searchPortfolios(this.value);
    });

    window.addEventListener('pagechange', handlePageChange);
    window.addEventListener('message', handleIframeHeightMessage);
    window.addEventListener('auth:state', handleAuthStateChange);

    try {
      portfolios = await fetchPortfolioData();
      await loadAccessState();
      filteredPortfolios = portfolios;

      portfolios.forEach((portfolio) => getOrCreatePortfolioSection(portfolio.folder));
      listPortfolios(filteredPortfolios);
      displayCategories();
      checkDirectPortfolioLoad();
    } catch (error) {
      console.error('[PortfolioModule] Error fetching portfolio data:', error);
      portfolioListEl.innerHTML = '<p>Failed to load portfolios.</p>';

      const portfolioSection = document.getElementById(PORTFOLIO_SECTION_FALLBACK);
      if (portfolioSection) portfolioSection.classList.add('active');
    }
  }

  window.PortfolioModule = {
    initPortfolioList,
    loadPortfolio,
    unloadPortfolio,
  };
})();
