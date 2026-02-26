/**
 * Main Application Script
 * Initializes all modules and handles DOM ready event
 */

// -------------------------------
// Module Imports (loaded via script tags in HTML)
// -------------------------------
// Modules are loaded in the HTML file:
// - navigation.js
// - theme.js
// - controls.js
// - blog.js
// - portfolio.js
// - auth.js
// - contact.js
// - typing.js

// -------------------------------
// Application Initialization
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  if (window.NavigationModule) {
    window.NavigationModule.initResponsiveness();
    window.NavigationModule.initNavigation();
  }

  if (window.ControlsModule) {
    window.ControlsModule.initControls();
  }

  if (window.ThemeModule) {
    window.ThemeModule.initThemeToggle();
  }

  if (window.BlogModule) {
    window.BlogModule.initBlogList();
  }

  if (window.PortfolioModule) {
    window.PortfolioModule.initPortfolioList();
  }

  if (window.AuthModule) {
    window.AuthModule.initAuth();
  }

  if (window.AdminModule) {
    window.AdminModule.initAdmin();
  }

  if (window.ContactModule) {
    window.ContactModule.initContactForm();
  }

  if (window.TypingModule) {
    window.TypingModule.initTypingAnimation();
  }
});
