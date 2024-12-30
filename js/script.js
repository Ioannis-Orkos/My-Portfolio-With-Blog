const header = document.querySelector('header');
const mobileNav = document.getElementById('mobile-nav');
const burgerMenu = document.getElementById('h-burger-menu');
const themeToggles = document.querySelectorAll('.theme-toggle');
const MOBILE_BREAKPOINT = 768;

let lastScrollY = window.scrollY;
const SCROLL_THRESHOLD = window.innerHeight * 0.25;
const initialHeaderHeight = header.offsetHeight;

document.addEventListener('DOMContentLoaded', () => {
    initResponsivness();
    initControls();
    initThemeToggle();
    initNavigation();
});


function initResponsivness() {
    // Toggle Mobile Navigation
    const toggleMobileNav = () => {
        const isActive = burgerMenu.classList.toggle('active');
        mobileNav.classList.toggle('active');
        burgerMenu.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
        
        if (isActive) {
            // Trap focus within mobile navigation
            const firstFocusable = mobileNav.querySelector('a, button');
            firstFocusable && firstFocusable.focus();
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
}

function initControls() {

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
}

function initThemeToggle() {
    
    const updateThemeIcons = (theme) => {
        const icon = theme === 'light' ? '🌙' : '☀️';
        themeToggles.forEach(toggle => {
            const iconElement = toggle.querySelector('span');
            if (iconElement) iconElement.textContent = icon;
        });
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcons(newTheme);
        localStorage.setItem('theme', newTheme);
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
}

function initNavigation() {
    const navLinks = document.querySelectorAll('nav ul li a[data-target]');

    let currentPage = '';
    let pages = document.querySelectorAll('.page');


    // Navigation Functions

    // Update Active Navigation Link
    function updateActiveNav(target) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === target) {
                link.classList.add('active');
            }
        });
    }

    // Display Title Function (Optional: If you have a dynamic title)
    function displayTitle(target) {
        // Example: Update document title based on the active page
        const titles = {
            home: 'Home',
            about: 'About - Ioannis',
            portfolio: 'Portfolio',
            blog: 'Blog',
            contact: 'Contact',
            login: 'Login'
        };
        document.title = titles[target] || 'Ioannis - Personal Website';
    }

    // Show Page with Animation
    function showPage(target) {
        displayTitle(target);
        pages.forEach(page => {
            page.classList.remove('active', 'animate-left', 'animate-right', 'animate-zoom');
            if (page.id === target) {
                page.classList.add('active');

                // Add specific animations based on the section
                if (target === 'about') {
                    page.classList.add('animate-left');
                } else if (target === 'portfolio') {
                    page.classList.add('animate-right');
                } else if (target === 'blog') {
                    page.classList.add('animate-zoom');
                }
            }
        });
        updateActiveNav(target); // Highlight the active menu item
    }

    // Navigate to a specific page
    function navigateTo(target) {
        if (target !== currentPage) { // Only navigate if the target page is different
            showPage(target);
            history.pushState({ page: target }, '', `#${target}`);
            currentPage = target;
            if (window.innerWidth <= MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
                toggleMobileNav(); // Close mobile nav after navigating only on mobile
            }
        } else {
            if (window.innerWidth <= MOBILE_BREAKPOINT) { // Only toggle the menu on mobile
                toggleMobileNav(); // Close the menu if clicking the same page on mobile
            }
        }
    }

    // Navigate to a specific page on load
    function navigateToLoad(target) {
        showPage(target);
        history.pushState({ page: target }, '', `#${target}`);
        currentPage = target;
    }

    // Handle Popstate Event (Back/Forward Browser Buttons)
    window.addEventListener('popstate', function (e) {
        if (e.state && e.state.page) {
            showPage(e.state.page);
            currentPage = e.state.page; // Update current page on popstate
        } else {
            showPage('home'); // Fallback to home if no state is available
            currentPage = 'home';
        }
    });

    // On initial load, check the URL hash
    const initialPage = window.location.hash.replace('#', '') || 'home';
    showPage(initialPage);
    currentPage = initialPage;
    if (initialPage !== 'home') {
        history.replaceState({ page: initialPage }, '', `#${initialPage}`);
    } else {
        history.replaceState({ page: 'home' }, '', '#home');
    }

    // Add Event Listeners to Navigation Links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            navigateTo(target);
        });
    });
}