/**
 * Navigation Module
 * Handles single-page application navigation, URL management, and page transitions
 */

const MOBILE_BREAKPOINT = 768;
let currentPage = 'home';

// DOM Cache
let body, mobileNav, burgerMenu;

/**
 * Handles toggleMobileNav.
 */
function toggleMobileNav() {
  burgerMenu.classList.toggle('active');
  mobileNav.classList.toggle('active');
  const isActive = mobileNav.classList.contains('active');
  burgerMenu.setAttribute('aria-expanded', isActive);
  body.style.overflow = isActive ? 'hidden' : '';

  if (isActive) {
    const firstFocusable = mobileNav.querySelector('a, button');
    if (firstFocusable) firstFocusable.focus();
  }
}

/**
 * Handles initResponsiveness.
 */
function initResponsiveness() {
  // Initialize DOM elements
  body = document.body;
  mobileNav = document.getElementById('mobile-nav');
  burgerMenu = document.getElementById('h-burger-menu');

  burgerMenu.addEventListener('click', toggleMobileNav);

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
      burgerMenu.classList.remove('active');
      mobileNav.classList.remove('active');
      burgerMenu.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    }
  });
}

/**
 * Updates the document title based on the current page
 * @param {string} target - The target page identifier
 */
/**
 * Handles updateDocumentTitle.
 */
function updateDocumentTitle(target) {
  const titles = {
    home: 'Home',
    about: 'About - Ioannis',
    portfolio: 'Portfolio',
    blog: 'Blog',
    admin: 'Admin',
    contact: 'Contact',
    login: 'Login',
  };
  document.title = titles[target] || target;
}

/**
 * Updates active navigation link styling
 * @param {string} target - The target page identifier
 */
/**
 * Handles updateActiveNavLink.
 */
function updateActiveNavLink(target) {
  const navLinks = document.querySelectorAll('nav ul li a[data-target]');
  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('data-target') === target) {
      link.classList.add('active');
    }
  });
}

/**
 * Shows the specified page and handles animations
 * @param {string} target - The target page identifier
 */
/**
 * Handles showPage.
 */
function showPage(target) {
  updateDocumentTitle(target);

  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => {
    page.classList.remove('active', 'animate-left', 'animate-right', 'animate-zoom');
    if (page.id === target) {
      page.classList.add('active');
      if (target === 'about') page.classList.add('animate-left');
      else if (target === 'portfolio') page.classList.add('animate-right');
      else if (target === 'blog') page.classList.add('animate-zoom');
    }
  });

  updateActiveNavLink(target);
  window.dispatchEvent(new CustomEvent('pagechange', { detail: { page: target } }));
}

/**
 * Navigates to a specific page
 * @param {string} target - The target page identifier
 */
/**
 * Handles navigateTo.
 */
function navigateTo(target) {
  if (target !== currentPage) {
    showPage(target);
    history.pushState({ page: target }, '', `#${target}`);
    currentPage = target;

    // Close mobile nav if open
    if (window.innerWidth <= MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
      burgerMenu.click();
    }
  } else {
    // Close mobile nav even if same page
    if (window.innerWidth <= MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
      burgerMenu.click();
    }
  }
}

/**
 * Navigates to a page without updating history (for initial load)
 * @param {string} target - The target page identifier
 */
/**
 * Handles navigateToLoad.
 */
function navigateToLoad(target) {
  showPage(target);
  history.replaceState({ page: target }, '', `#${target}`);
  currentPage = target;
}

/**
 * Handles handleHashRouteChange.
 */
function handleHashRouteChange() {
  const target = window.location.hash.replace('#', '') || 'home';
  if (target === currentPage) return;
  if (target === 'contact' || target === 'login') {
    const modal = document.getElementById(target);
    if (modal) modal.classList.add('active');
    showPage('home');
    currentPage = 'home';
    return;
  }
  showPage(target);
  currentPage = target;
}

/**
 * Handles initNavigation.
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('nav ul li a[data-target]');
  const initialPage = window.location.hash.replace('#', '') || 'home';
  const closeAllModals = () => {
    const contactModal = document.getElementById('contact');
    const loginModal = document.getElementById('login');
    if (contactModal) contactModal.classList.remove('active');
    if (loginModal) loginModal.classList.remove('active');
  };

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      if (e.state.page === 'contact' || e.state.page === 'login') {
        closeAllModals();
        const modal = document.getElementById(e.state.page);
        if (modal) modal.classList.add('active');
        showPage('home');
        currentPage = 'home';
      } else {
        closeAllModals();
        showPage(e.state.page);
        currentPage = e.state.page;
      }
    } else {
      closeAllModals();
      showPage('home');
      currentPage = 'home';
    }
  });

  window.addEventListener('hashchange', handleHashRouteChange);

  // Normal load
  if (initialPage === 'contact' || initialPage === 'login') {
    navigateToLoad('home');
    const modal = document.getElementById(initialPage);
    if (modal) modal.classList.add('active');
  } else {
    navigateToLoad(initialPage);
  }

  // Add click listeners to navigation links
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (target === 'contact' || target === 'login') {
        const modal = document.getElementById('contact');
        const authModal = document.getElementById('login');
        closeAllModals();
        if (target === 'contact' && modal) modal.classList.add('active');
        if (target === 'login' && authModal) authModal.classList.add('active');
        updateActiveNavLink(target);
        history.pushState({ page: target }, '', `#${target}`);
        if (window.innerWidth <= MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
          burgerMenu.click();
        }
      } else {
        navigateTo(target);
      }
    });
  });
}

// Export functions for use in other modules
window.NavigationModule = {
  initResponsiveness,
  initNavigation,
  navigateTo,
  navigateToLoad,
  showPage,
};
