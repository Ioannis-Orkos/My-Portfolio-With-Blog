// -------------------------------
// Global Constants & Variables
// -------------------------------
const MOBILE_BREAKPOINT = 768;
const initialPage       = window.location.hash.replace('#', '') || 'home';
let   currentPage       = 'home';

// -------------------------------
// Common DOM Cache
// -------------------------------
const body         = document.body;
const mobileNav    = document.getElementById('mobile-nav');
const burgerMenu   = document.getElementById('h-burger-menu');
const skipLink     = document.querySelector('.skip-link');
const header       = document.querySelector('header');
const mainContent  = document.getElementById('main-content');
const blogListEl   = document.getElementById('blogs');
const blogSearch   = document.getElementById('blog-search');
const blogCatsEl   = document.getElementById('blog-categories');

// -------------------------------
// Toggle Mobile Navigation
// -------------------------------
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

// -------------------------------
// Handle Responsive Resizing
// -------------------------------
function initResponsivness() {
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

// -------------------------------
// Header Scroll & Accessibility
// -------------------------------
function initControls() {
  const initialHeaderHeight = header.offsetHeight;
  const threshold           = window.innerHeight * 0.25; // 25% of viewport

  let lastScrollY = window.scrollY;

  // Hide/Show/Partially Hide Header on Scroll
  function handleScroll() {
    const currentScrollY = window.scrollY;
    if (currentScrollY > threshold && !mobileNav.classList.contains('active')) {
      header.style.transform = `translateY(-${initialHeaderHeight}px)`;
    } else if (currentScrollY < lastScrollY && !mobileNav.classList.contains('active')) {
      header.style.transform = 'translateY(0)';
    } else if (currentScrollY <= threshold && !mobileNav.classList.contains('active')) {
      const translateValue = Math.min(currentScrollY, threshold) * (initialHeaderHeight / threshold);
      header.style.transform = `translateY(-${translateValue}px)`;
    }
    lastScrollY = currentScrollY;
  }
  window.addEventListener('scroll', handleScroll);

  // Trap Focus in Mobile Nav
  document.addEventListener('keydown', (e) => {
    if (!mobileNav.classList.contains('active')) return;
    const focusable = mobileNav.querySelectorAll('a, button');
    const firstElem = focusable[0];
    const lastElem  = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElem) {
        e.preventDefault();
        lastElem.focus();
      } else if (!e.shiftKey && document.activeElement === lastElem) {
        e.preventDefault();
        firstElem.focus();
      }
    } else if (e.key === 'Escape') {
      toggleMobileNav();
      burgerMenu.focus();
    }
  });

  // Skip Link for Screen Readers
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    mainContent.focus();
  });
}

// -------------------------------
// Theme Toggle (Light/Dark)
// -------------------------------
function initThemeToggle() {
  const themeToggle       = document.getElementById('theme-toggle');
  const themeIcon         = document.getElementById('theme-icon');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const themeIconMobile   = document.getElementById('theme-icon-mobile');

  function toggleTheme(isMobile = false) {
    const iconElem    = isMobile ? themeIconMobile : themeIcon;
    const currentTheme= document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme    = currentTheme === 'dark' ? 'light' : 'dark';

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

  themeToggle.addEventListener('click', () => toggleTheme(false));
  themeToggleMobile.addEventListener('click', () => toggleTheme(true));

  // Initialize theme from localStorage or OS preference
  (function initializeTheme() {
    const savedTheme  = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme       = savedTheme || (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.textContent       = '🌙';
      themeIconMobile.textContent = '🌙';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.textContent       = '🌞';
      themeIconMobile.textContent = '🌞';
    }
  })();
}

// -------------------------------
// Single-Page Navigation
// -------------------------------
function initNavigation(blog) {
  const navLinks = document.querySelectorAll('nav ul li a[data-target]');

  function displayTitle(target) {
    const titles = {
      home: 'Home',
      about: 'About - Ioannis',
      portfolio: 'Portfolio',
      blog: 'Blog',
      contact: 'Contact',
      login: 'Login',
    };
    document.title = titles[target] || target;
  }

  function updateActiveNav(target) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-target') === target) {
        link.classList.add('active');
      }
    });
  }

  function showPage(target) {
    displayTitle(target);
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.classList.remove('active','animate-left','animate-right','animate-zoom');
      if (page.id === target) {
        page.classList.add('active');
        if      (target === 'about')     page.classList.add('animate-left');
        else if (target === 'portfolio') page.classList.add('animate-right');
        else if (target === 'blog')      page.classList.add('animate-zoom');
      }
    });
    updateActiveNav(target);
  }

  function navigateTo(target) {
    if (target !== currentPage) {
      showPage(target);
      history.pushState({ page: target }, '', `#${target}`);
      currentPage = target;
      if (window.innerWidth <= MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
        burgerMenu.click(); // close mobile nav
      }
    } else {
      if (window.innerWidth <= MOBILE_BREAKPOINT && mobileNav.classList.contains('active')) {
        burgerMenu.click();
      }
    }
  }

  function navigateToLoad(target) {
    showPage(target);
    history.replaceState({ page: target }, '', `#${target}`);
    currentPage = target;
  }

  // Listen for browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      showPage(e.state.page);
      currentPage = e.state.page;
    } else {
      showPage('home');
      currentPage = 'home';
    }
  });

  // If we're loading a direct blog, handle that
  if (blog) {
    if (blog === initialPage) navigateToLoad(blog);
    else navigateTo(blog);
    return;
  }

  // Otherwise, normal load
  showPage(initialPage);
  updateActiveNav(initialPage);
  navigateToLoad(initialPage);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.getAttribute('data-target'));
    });
  });
}

// -------------------------------
// Load Individual Blog (Shadow DOM)
// -------------------------------
async function loadBlog(blogFolder) {
  async function resourceExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  function stripHeaderFooter(html) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('header').forEach(h => h.remove());
    doc.querySelectorAll('footer').forEach(f => f.remove());
    return doc.body.innerHTML;
  }

  async function fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch content: ${response.statusText}`);
    return response.text();
  }

  const blogSection = document.getElementById(blogFolder);
  if (!blogSection) {
    console.error(`Section with id "${blogFolder}" not found.`);
    return;
  }

  const shadowRoot = blogSection.shadowRoot || blogSection.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = '';

  try {
    const cssContent   = await fetchText(`blogs/${blogFolder}/styles.css`);
    const htmlContent  = await fetchText(`blogs/${blogFolder}/index.html`);
    const cleanedHTML  = stripHeaderFooter(htmlContent);

    const styleEl = document.createElement('style');
    styleEl.textContent = cssContent;
    shadowRoot.appendChild(styleEl);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = cleanedHTML;
    shadowRoot.appendChild(wrapper);

    initNavigation(blogFolder);  // re-init nav for blog
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const scriptPath = `${window.location.origin}/blogs/${blogFolder}/script.js`;
    if (await resourceExists(scriptPath)) {
      const module = await import(scriptPath);
      if (module.initShadowBlog) module.initShadowBlog(shadowRoot);
    }
  } catch (err) {
    console.error(`Error loading blog "${blogFolder}":`, err);
    shadowRoot.innerHTML = `<p>Failed to load blog content. Please try again later.</p>`;
  }
}

// -------------------------------
// Blog List & Search/Filter
// -------------------------------
function initBlogList() {
  let blogs         = [];
  let filteredBlogs = [];
  let selectedCats  = new Set();

  function createBlogItem(blog) {
    const item = document.createElement('div');
    item.classList.add('blog-item');

    const img = document.createElement('img');
    img.src   = `blogs/${blog.image}`;
    img.alt   = blog.title;
    img.loading = 'lazy';

    const details = document.createElement('div');
    details.classList.add('blog-details');

    const title = document.createElement('h2');
    title.textContent = blog.title;

    const date = document.createElement('p');
    date.textContent = blog.date;
    date.classList.add('blog-date');

    const desc = document.createElement('p');
    desc.textContent = blog.description;
    desc.classList.add('blog-description');

    details.appendChild(title);
    details.appendChild(date);
    details.appendChild(desc);
    item.appendChild(img);
    item.appendChild(details);

    item.addEventListener('click', () => loadBlog(blog.folder));
    return item;
  }

  function listBlogs(dataArray) {
    blogListEl.innerHTML = '';
    if (!dataArray.length) {
      blogListEl.innerHTML = `<p>No blogs found.</p>`;
      return;
    }
    dataArray.forEach(b => blogListEl.appendChild(createBlogItem(b)));
  }

  function filterBlogsByCats(cats) {
    return blogs.filter(b => b.categories.some(cat => cats.includes(cat)));
  }

  function displayCategories() {
    const catCounts = {};
    blogs.forEach(b => {
      b.categories.forEach(c => catCounts[c] = (catCounts[c] || 0) + 1);
    });
    blogCatsEl.innerHTML = '';

    Object.keys(catCounts).forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.classList.add('blog-category-button');

      const count = document.createElement('span');
      count.classList.add('blog-category-count');
      count.textContent = catCounts[cat];
      btn.appendChild(count);

      btn.addEventListener('click', () => {
        if (selectedCats.has(cat)) {
          selectedCats.delete(cat);
          btn.classList.remove('blog-category-active');
        } else {
          selectedCats.add(cat);
          btn.classList.add('blog-category-active');
        }
        filteredBlogs = selectedCats.size
          ? filterBlogsByCats([...selectedCats])
          : blogs;
        listBlogs(filteredBlogs);
      });
      blogCatsEl.appendChild(btn);
    });
  }

  function addBlogSection(folder) {
    if (!document.getElementById(folder)) {
      const sec = document.createElement('section');
      sec.id    = folder;
      sec.className = 'page';
      mainContent.appendChild(sec);
    }
  }

  function checkDirectBlogLoad() {
    blogs.forEach(b => {
      if (b.folder === initialPage) loadBlog(b.folder);
    });
  }

  function searchBlogs(query) {
    const q = query.toLowerCase();
    if (!q) {
      listBlogs(filteredBlogs);
      return;
    }
    const searched = filteredBlogs.filter(b =>
      b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    );
    listBlogs(searched);
  }

  blogSearch.addEventListener('input', function() {
    searchBlogs(this.value);
  });

  (function(){
    fetch('blogs/blog-data.json')
      .then(r => r.ok ? r.json() : Promise.reject('Network error'))
      .then(data => {
        blogs         = data;
        filteredBlogs = data;
        blogs.forEach(b => addBlogSection(b.folder));
        listBlogs(filteredBlogs);
        displayCategories();
        checkDirectBlogLoad();
      })
      .catch(err => {
        console.error('Error fetching blog data:', err);
        blogListEl.innerHTML = `<p>Failed to load blogs.</p>`;
      });
  })();
}

// -------------------------------
// Initialize Everything on DOM Load
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initResponsivness();
  initControls();
  initThemeToggle();
  initNavigation();
  initBlogList();
});
