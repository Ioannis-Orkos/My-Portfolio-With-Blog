document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const mobileNav = document.getElementById('mobile-nav');
    const burgerMenu = document.getElementById('h-burger-menu');
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const MOBILE_BREAKPOINT = 768;

    let lastScrollY = window.scrollY;
    const SCROLL_THRESHOLD = window.innerHeight * 0.25;
    const initialHeaderHeight = header.offsetHeight;

    // Toggle Mobile Navigation
    const toggleMobileNav = () => {
        const isActive = burgerMenu.classList.toggle('active');
        mobileNav.classList.toggle('active');
        burgerMenu.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
        
        if (isActive) {
            // Trap focus within mobile navigation
            mobileNav.querySelector('a, button').focus();
        }
    };

    burgerMenu.addEventListener('click', toggleMobileNav);

    // Close Mobile Nav on Resize
    const handleResize = () => {
        if (window.innerWidth > MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
            burgerMenu.classList.remove('active');
            mobileNav.classList.remove('active');
            burgerMenu.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    };

    window.addEventListener('resize', handleResize);

    // Hide/Show Header on Scroll
    const handleScroll = () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD && !mobileNav.classList.contains('active')) {
            // Scrolling Down
            header.style.transform = `translateY(-${initialHeaderHeight}px)`;
        } else if (currentScrollY < lastScrollY && !mobileNav.classList.contains('active')) {
            // Scrolling Up
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    // Theme Toggle Functionality
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcons(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const updateThemeIcons = (theme) => {
        const icon = theme === 'light' ? '🌙' : '☀️';
        themeToggles.forEach(toggle => {
            const iconElement = toggle.querySelector('span');
            if (iconElement) iconElement.textContent = icon;
        });
    };

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleTheme);
    });

    // Initialize Theme Based on User Preference or Local Storage
    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcons(theme);
    };

    initializeTheme();

    // Accessibility: Trap Focus within Mobile Navigation when active
    const focusableElementsSelector = 'a, button';
    let focusableElements = mobileNav.querySelectorAll(focusableElementsSelector);
    focusableElements = Array.prototype.slice.call(focusableElements);

    const trapFocus = (e) => {
        if (!mobileNav.classList.contains('active')) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.key === 'Tab') {
            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        } else if (e.key === 'Escape') {
            toggleMobileNav();
            burgerMenu.focus();
        }
    };

    document.addEventListener('keydown', trapFocus);

    // Smooth Scroll for Skip Navigation Link
    const skipLink = document.querySelector('.skip-link');
    skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        mainContent.focus();
    });
});