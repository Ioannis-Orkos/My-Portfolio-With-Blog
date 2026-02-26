(function () {
  const BLOG_DATA_URL = '/blogs/blog-data.json';
  const BLOG_SECTION_FALLBACK = 'blog';
  const HEIGHT_MESSAGE_TYPE = 'embedded-frame-height';

  let blogs = [];
  let filteredBlogs = [];
  let selectedCategories = new Set();
  let activeBlogFolder = null;
  let activeBlogIframe = null;

  let blogListEl;
  let blogSearchEl;
  let blogCategoriesEl;
  let mainContentEl;

  /**
   * Handles isKnownBlog.
   */
  function isKnownBlog(folder) {
    return blogs.some((blog) => blog.folder === folder);
  }

  /**
   * Handles createBlogIframe.
   */
  function createBlogIframe(folder) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const iframe = document.createElement('iframe');
    iframe.src = `/blogs/${folder}/index.html`;
    iframe.title = `Blog ${folder}`;
    iframe.loading = 'lazy';
    iframe.className = 'dynamic-embedded-page dynamic-blog-page';
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
   * Handles resizeBlogIframe.
   */
  function resizeBlogIframe(iframe, height) {
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
    if (!activeBlogIframe || event.source !== activeBlogIframe.contentWindow) return;

    resizeBlogIframe(activeBlogIframe, data.height);
  }

  /**
   * Handles getOrCreateBlogSection.
   */
  function getOrCreateBlogSection(folder) {
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
   * Handles clearBlogSection.
   */
  function clearBlogSection(folder) {
    const section = document.getElementById(folder);
    if (section) section.innerHTML = '';
  }

  /**
   * Handles unloadBlog.
   */
  function unloadBlog(folder) {
    clearBlogSection(folder);
    if (activeBlogFolder === folder) {
      activeBlogFolder = null;
      activeBlogIframe = null;
    }
  }

  /**
   * Handles unloadAllBlogsExcept.
   */
  function unloadAllBlogsExcept(folderToKeep) {
    blogs.forEach((blog) => {
      if (blog.folder !== folderToKeep) unloadBlog(blog.folder);
    });
  }

  /**
   * Handles navigateToBlog.
   */
  function navigateToBlog(folder, mode) {
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
   * Handles mountBlogIframe.
   */
  function mountBlogIframe(folder) {
    const section = getOrCreateBlogSection(folder);
    section.innerHTML = '';

    const iframe = createBlogIframe(folder);
    iframe.addEventListener('error', () => {
      section.innerHTML = '<p>Failed to load blog content. Please try again later.</p>';
      if (activeBlogIframe === iframe) activeBlogIframe = null;
    });
    iframe.addEventListener('load', () => {
      // Keep viewport-like layout immediately until async height messages arrive.
      resizeBlogIframe(iframe, window.innerHeight);
    });

    section.appendChild(iframe);
    activeBlogFolder = folder;
    activeBlogIframe = iframe;
  }

  /**
   * Handles loadBlog.
   */
  function loadBlog(folder, options = {}) {
    if (!isKnownBlog(folder)) return;

    const navigateMode = options.navigate || 'none';

    unloadAllBlogsExcept(folder);
    mountBlogIframe(folder);

    navigateToBlog(folder, navigateMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handles createBlogItem.
   */
  function createBlogItem(blog) {
    const item = document.createElement('div');
    item.classList.add('blog-item');

    const img = document.createElement('img');
    img.src = `/blogs/${blog.image}`;
    img.alt = blog.title;
    img.loading = 'lazy';

    const details = document.createElement('div');
    details.classList.add('blog-details');

    const title = document.createElement('h2');
    title.textContent = blog.title;

    const date = document.createElement('p');
    date.textContent = blog.date;
    date.classList.add('blog-date');

    const description = document.createElement('p');
    description.textContent = blog.description;
    description.classList.add('blog-description');

    const externalLink = blog.link || blog.url;
    details.appendChild(title);
    details.appendChild(date);
    details.appendChild(description);
    if (externalLink) {
      const actions = document.createElement('div');
      actions.classList.add('content-card-actions');
      const linkAnchor = document.createElement('a');
      linkAnchor.href = externalLink;
      linkAnchor.textContent = blog.linkLabel || 'Open Link';
      linkAnchor.className = 'content-card-link-only';
      linkAnchor.target = blog.linkTarget || '_blank';
      linkAnchor.rel = 'noopener noreferrer';
      linkAnchor.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      actions.appendChild(linkAnchor);
      details.appendChild(actions);
    }
    item.appendChild(img);
    item.appendChild(details);

    item.addEventListener('click', () => loadBlog(blog.folder, { navigate: 'push' }));
    return item;
  }

  /**
   * Handles listBlogs.
   */
  function listBlogs(dataArray) {
    blogListEl.innerHTML = '';
    if (!dataArray.length) {
      blogListEl.innerHTML = '<p>No blogs found.</p>';
      return;
    }

    dataArray.forEach((blog) => {
      blogListEl.appendChild(createBlogItem(blog));
    });
  }

  /**
   * Handles filterBlogsByCategories.
   */
  function filterBlogsByCategories(categories) {
    return blogs.filter((blog) => blog.categories.some((cat) => categories.includes(cat)));
  }

  /**
   * Handles displayCategories.
   */
  function displayCategories() {
    const categoryCounts = {};

    blogs.forEach((blog) => {
      blog.categories.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });

    blogCategoriesEl.innerHTML = '';

    Object.keys(categoryCounts).forEach((category) => {
      const button = document.createElement('button');
      button.textContent = category;
      button.classList.add('blog-category-button');

      const count = document.createElement('span');
      count.classList.add('blog-category-count');
      count.textContent = categoryCounts[category];
      button.appendChild(count);

      button.addEventListener('click', () => {
        if (selectedCategories.has(category)) {
          selectedCategories.delete(category);
          button.classList.remove('blog-category-active');
        } else {
          selectedCategories.add(category);
          button.classList.add('blog-category-active');
        }

        filteredBlogs = selectedCategories.size
          ? filterBlogsByCategories([...selectedCategories])
          : blogs;

        listBlogs(filteredBlogs);
      });

      blogCategoriesEl.appendChild(button);
    });
  }

  /**
   * Handles searchBlogs.
   */
  function searchBlogs(query) {
    const normalizedQuery = query.toLowerCase();
    if (!normalizedQuery) {
      listBlogs(filteredBlogs);
      return;
    }

    const searched = filteredBlogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(normalizedQuery) ||
        blog.description.toLowerCase().includes(normalizedQuery)
    );

    listBlogs(searched);
  }

  /**
   * Handles checkDirectBlogLoad.
   */
  function checkDirectBlogLoad() {
    const hashTarget = window.location.hash.replace('#', '') || 'home';
    if (isKnownBlog(hashTarget)) {
      loadBlog(hashTarget, { navigate: 'replace' });
    }
  }

  /**
   * Handles handlePageChange.
   */
  function handlePageChange(event) {
    const targetPage = event.detail?.page;
    if (!targetPage) return;

    if (isKnownBlog(targetPage)) {
      if (activeBlogFolder !== targetPage) {
        loadBlog(targetPage, { navigate: 'none' });
      }
      return;
    }

    unloadAllBlogsExcept(null);
  }

  /**
   * Handles fetchBlogData.
   */
  async function fetchBlogData() {
    const response = await fetch(BLOG_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load blogs: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Handles initBlogList.
   */
  async function initBlogList() {
    blogListEl = document.getElementById('blogs');
    blogSearchEl = document.getElementById('blog-search');
    blogCategoriesEl = document.getElementById('blog-categories');
    mainContentEl = document.getElementById('main-content');

    blogs = [];
    filteredBlogs = [];
    selectedCategories = new Set();
    activeBlogFolder = null;
    activeBlogIframe = null;

    if (!blogListEl || !blogSearchEl || !blogCategoriesEl || !mainContentEl) {
      console.error('[BlogModule] Missing required DOM elements.');
      return;
    }

    blogSearchEl.addEventListener('input', function () {
      searchBlogs(this.value);
    });

    window.addEventListener('pagechange', handlePageChange);
    window.addEventListener('message', handleIframeHeightMessage);

    try {
      blogs = await fetchBlogData();
      filteredBlogs = blogs;

      blogs.forEach((blog) => getOrCreateBlogSection(blog.folder));
      listBlogs(filteredBlogs);
      displayCategories();
      checkDirectBlogLoad();
    } catch (error) {
      console.error('[BlogModule] Error fetching blog data:', error);
      blogListEl.innerHTML = '<p>Failed to load blogs.</p>';

      const blogSection = document.getElementById(BLOG_SECTION_FALLBACK);
      if (blogSection) blogSection.classList.add('active');
    }
  }

  window.BlogModule = {
    initBlogList,
    loadBlog,
    unloadBlog,
  };
})();
