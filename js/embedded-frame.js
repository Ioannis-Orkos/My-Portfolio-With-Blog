(function () {
  const MESSAGE_TYPE = 'embedded-frame-height';

  /**
   * Handles measureHeight.
   */
  function measureHeight() {
    const body = document.body;
    const html = document.documentElement;
    return Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.clientHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0
    );
  }

  /**
   * Handles postHeight.
   */
  function postHeight() {
    if (window.parent === window) return;
    window.parent.postMessage(
      {
        type: MESSAGE_TYPE,
        href: window.location.href,
        height: measureHeight(),
      },
      '*'
    );
  }

  /**
   * Handles init.
   */
  function init() {
    postHeight();

    const observer = new ResizeObserver(() => postHeight());
    if (document.body) observer.observe(document.body);
    if (document.documentElement) observer.observe(document.documentElement);

    window.addEventListener('load', postHeight);
    window.addEventListener('resize', postHeight);

    // Fallback for dynamic content changes without resize events.
    setInterval(postHeight, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
