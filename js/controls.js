(function () {
  (function () {
    /**
     * Controls Module
     * Handles header scroll behavior, accessibility features, and UI controls
     */

    // DOM Cache
    let header, skipLink, mainContent;

    /**
     * Handles initControls.
     */
    function initControls() {
      // Initialize DOM elements
      header = document.querySelector('header');
      skipLink = document.querySelector('.skip-link');
      mainContent = document.getElementById('main-content');

      const initialHeaderHeight = header.offsetHeight;
      const threshold = window.innerHeight * 0.25; // 25% of viewport

      let lastScrollY = window.scrollY;

      // Hide/Show/Partially Hide Header on Scroll
      /**
       * Handles handleScroll.
       */
      function handleScroll() {
        const currentScrollY = window.scrollY;
        document.documentElement.style.setProperty('--scroll-y', currentScrollY);

        if (currentScrollY > threshold) {
          header.style.transform = `translateY(-${initialHeaderHeight}px)`;
        } else if (currentScrollY < lastScrollY) {
          header.style.transform = 'translateY(0)';
        } else if (currentScrollY <= threshold) {
          const translateValue =
            Math.min(currentScrollY, threshold) * (initialHeaderHeight / threshold);
          header.style.transform = `translateY(-${translateValue}px)`;
        }

        lastScrollY = currentScrollY;
      }

      window.addEventListener('scroll', handleScroll);

      // Trap Focus in Mobile Nav (handled in navigation.js)

      // Skip Link for Screen Readers
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        mainContent.focus();
      });
    }

    // Export for use in other modules
    window.ControlsModule = {
      initControls,
    };
  })();
})();
