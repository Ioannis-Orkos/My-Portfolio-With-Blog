document.addEventListener('DOMContentLoaded', function () {
    
    const header = document.querySelector('header');
    const mobileNav = document.querySelector('.mobile-nav');
    const burgerMenu = document.getElementById('h-burger-menu');
    
    const MOBILE_BREAKPOINT = 768; // Define the mobile screen width threshold

    // Function to toggle mobile navigation
    function toggleMobileNavigation() {
        burgerMenu.classList.toggle('active');
        mobileNav.classList.toggle('active');
        if (mobileNav.classList.contains('active')) {
            header.classList.add('fixed'); // Prevent header from moving when mobile nav is active
        } else {
            header.classList.remove('fixed'); // Allow header to move normally
        }
    }
    burgerMenu.addEventListener('click', toggleMobileNavigation);

    // Function to close the mobile navigation when resizing to a larger screen
    function closeMobileNavOnResize() {
        if (window.innerWidth > MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
            burgerMenu.classList.remove('active');
            mobileNav.classList.remove('active');
            header.classList.remove('fixed');
        }
    }
    window.addEventListener('resize', closeMobileNavOnResize);

    // Hide the header when scrolling down and show it when scrolling up
    const initialHeaderHeight = header.offsetHeight;
    const SCROLL_THRESHOLD = window.innerHeight * 0.25; // 25% of the viewport height
    let lastScrollY = 0;

    function handleScroll() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD && !mobileNav.classList.contains('active')) {
            // If scrolling down past the threshold and mobile nav is not active, hide the header
            header.style.transform = `translateY(-${initialHeaderHeight}px)`;
        } else if (currentScrollY < lastScrollY && !mobileNav.classList.contains('active')) {
            // If scrolling up, show the header
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    }
    window.addEventListener('scroll', handleScroll);

    // Prevent background from scrolling when mobile navigation is active
    function preventBackgroundScroll() {
        if (mobileNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
    mobileNav.addEventListener('transitionend', preventBackgroundScroll);

});
