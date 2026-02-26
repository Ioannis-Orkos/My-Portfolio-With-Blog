/**
 * Theme Module
 * Handles light/dark theme switching and persistence
 */

/**
 * Toggles between light and dark themes
 * @param {boolean} isMobile - Whether the toggle is from mobile navigation
 */
/**
 * Handles toggleTheme.
 */
function toggleTheme(isMobile = false) {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const themeIconMobile = document.getElementById('theme-icon-mobile');

  const iconElem = isMobile ? themeIconMobile : themeIcon;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  if (newTheme === 'dark') {
    iconElem.textContent = '🌙';
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    iconElem.textContent = '🌞';
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
}

/**
 * Handles initThemeToggle.
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle'); // eslint-disable-line no-unused-vars
  const themeToggleMobile = document.getElementById('theme-toggle-mobile'); // eslint-disable-line no-unused-vars

  // Add event listeners
  themeToggle.addEventListener('click', () => toggleTheme(false));
  themeToggleMobile.addEventListener('click', () => toggleTheme(true));

  // Initialize theme from localStorage or OS preference
  (function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    const themeIcon = document.getElementById('theme-icon');
    const themeIconMobile = document.getElementById('theme-icon-mobile');

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '🌙';
      themeIconMobile.textContent = '🌙';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.textContent = '🌞';
      themeIconMobile.textContent = '🌞';
    }
  })();
}

// Export for use in other modules
window.ThemeModule = {
  initThemeToggle,
};
