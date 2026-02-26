(function () {
  function initBlog4Page(root) {
    const testBtn1 = root.querySelector('#test-btn-1');
    const testBtn2 = root.querySelector('#test-btn-2');
    const output = root.querySelector('#output');

    if (testBtn1 && output) {
      testBtn1.addEventListener('click', () => {
        output.textContent = `Button 1 clicked at ${new Date().toLocaleTimeString()} - Blog 4 test`;
        output.style.backgroundColor = '#e8f5e8';
        output.style.color = '#2e7d32';
      });
    }

    if (testBtn2 && output) {
      testBtn2.addEventListener('click', () => {
        output.textContent = `Button 2 clicked at ${new Date().toLocaleTimeString()} - Blog 4 unique action`;
        output.style.backgroundColor = '#fff3e0';
        output.style.color = '#e65100';
      });
    }

    const allButtons = root.querySelectorAll('.blog4-button');
    allButtons.forEach((btn, index) => {
      btn.addEventListener('mouseenter', () => {
        console.log(`[blog4] hover button ${index + 1}`);
      });
    });

    setTimeout(() => {
      if (output) {
        output.innerHTML += '<br><small>Blog 4 loaded successfully</small>';
      }
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initBlog4Page(document));
  } else {
    initBlog4Page(document);
  }
})();
