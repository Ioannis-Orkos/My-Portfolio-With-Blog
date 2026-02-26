(function () {
  const API_BASE = window.AUTH_API_BASE || 'http://localhost:4001';
  const TOKEN_KEY = 'portfolio_auth_token';

  const actionButton = document.querySelector('.blog-action-button');
  const scrollTopButton = document.querySelector('.blog-scroll-top-button');
  const authStatus = document.getElementById('blog1-auth-status');
  const loadProjectsBtn = document.getElementById('blog1-load-projects');
  const projectsList = document.getElementById('blog1-projects');

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  function setAuthStatus(message, isError) {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.style.color = isError ? '#b00020' : '';
  }

  function renderProjects(projects) {
    if (!projectsList) return;
    projectsList.innerHTML = '';

    if (!projects || !projects.length) {
      const li = document.createElement('li');
      li.textContent = 'No protected projects returned.';
      projectsList.appendChild(li);
      return;
    }

    projects.forEach((project) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = project.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = project.name;
      li.appendChild(a);
      projectsList.appendChild(li);
    });
  }

  async function checkMainLoginSession() {
    const token = getToken();
    if (!token) {
      setAuthStatus('Not logged in on main app.');
      if (loadProjectsBtn) loadProjectsBtn.disabled = true;
      renderProjects([]);
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) {
        setAuthStatus('Token found but session is invalid.', true);
        if (loadProjectsBtn) loadProjectsBtn.disabled = true;
        renderProjects([]);
        return false;
      }

      const payload = await response.json();
      const name = payload?.user?.name || payload?.user?.email || 'user';
      setAuthStatus(`Logged in as ${name}.`);
      if (loadProjectsBtn) loadProjectsBtn.disabled = false;
      return true;
    } catch {
      setAuthStatus('Auth server unavailable.', true);
      if (loadProjectsBtn) loadProjectsBtn.disabled = true;
      return false;
    }
  }

  async function loadProtectedProjects() {
    const token = getToken();
    if (!token) {
      setAuthStatus('No login token found. Please login from main app.', true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/projects/links`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) {
        setAuthStatus('Failed to load protected projects.', true);
        renderProjects([]);
        return;
      }

      const payload = await response.json();
      renderProjects(payload?.projects || []);
    } catch {
      setAuthStatus('Could not connect to auth server.', true);
    }
  }

  if (actionButton) {
    actionButton.addEventListener('click', () => {
      alert('Button clicked!');
    });
  }

  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (loadProjectsBtn) {
    loadProjectsBtn.addEventListener('click', loadProtectedProjects);
  }

  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) checkMainLoginSession();
  });

  checkMainLoginSession();
})();
