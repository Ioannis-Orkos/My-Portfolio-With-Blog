(function () {
  const API_BASE = window.AUTH_API_BASE || "http://localhost:4001";
  const TOKEN_KEY = "portfolio_auth_token";

  const state = {
    isAdmin: false,
    currentUser: null,
    loading: false,
    activeTab: "users",
    projects: [],
  };

  const dom = {
    navAdminItem: null,
    mobileNavAdminItem: null,
    navAdminLink: null,
    mobileNavAdminLink: null,
    status: null,
    tabButtons: null,
    panelUsers: null,
    panelProjects: null,
    panelRequests: null,
    usersBody: null,
    refreshUsersBtn: null,
    refreshProjectsBtn: null,
    refreshRequestsBtn: null,
    projectForm: null,
    projectList: null,
    requestList: null,
    requestFilter: null,
  };

  /**
   * Handles getToken.
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  /**
   * Handles apiFetch.
   */
  async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers,
      ...options,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    return { response, payload };
  }

  /**
   * Handles setStatus.
   */
  function setStatus(message, isError = false) {
    if (!dom.status) return;
    dom.status.textContent = message || "";
    dom.status.classList.toggle("admin-status-error", Boolean(isError));
  }

  /**
   * Handles setAdminNavVisible.
   */
  function setAdminNavVisible(visible) {
    [dom.navAdminItem, dom.mobileNavAdminItem, dom.navAdminLink, dom.mobileNavAdminLink].forEach((el) => {
      if (!el) return;
      el.hidden = !visible;
      el.setAttribute("aria-hidden", visible ? "false" : "true");
    });
  }

  /**
   * Handles redirectHomeIfOnAdmin.
   */
  function redirectHomeIfOnAdmin() {
    if (window.location.hash !== "#admin") return;
    window.location.hash = "#home";
  }

  /**
   * Handles clearAdminViews.
   */
  function clearAdminViews() {
    if (dom.usersBody) dom.usersBody.innerHTML = "";
    if (dom.projectList) dom.projectList.innerHTML = "";
    if (dom.requestList) dom.requestList.innerHTML = "";
  }

  /**
   * Handles renderUsers.
   */
  function renderUsers(users) {
    if (!dom.usersBody) return;
    dom.usersBody.innerHTML = "";

    if (!users.length) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="5">No users found.</td>`;
      dom.usersBody.appendChild(row);
      return;
    }

    users.forEach((user) => {
      const row = document.createElement("tr");
      const isSelf = state.currentUser && Number(state.currentUser.id) === Number(user.id);
      const disableDemoteSelf = isSelf && user.role === "admin";
      row.innerHTML = `
        <td data-label="ID">${user.id}</td>
        <td data-label="Email">${user.email || "-"}</td>
        <td data-label="Name">${user.name || "-"}</td>
        <td data-label="Role">
          <select class="admin-role-select" data-user-id="${user.id}">
            <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
        <td data-label="Action">
          <button class="admin-btn admin-role-save" data-user-id="${user.id}" ${
            disableDemoteSelf ? "title=\"You cannot demote yourself\"" : ""
          }>Save</button>
        </td>
      `;
      dom.usersBody.appendChild(row);
    });
  }

  /**
   * Handles renderProjects.
   */
  function renderProjects(projects) {
    if (!dom.projectList) return;
    dom.projectList.innerHTML = "";
    state.projects = projects || [];

    if (!state.projects.length) {
      const li = document.createElement("li");
      li.textContent = "No projects found.";
      dom.projectList.appendChild(li);
      return;
    }

    state.projects.forEach((project) => {
      const li = document.createElement("li");
      const activeLabel = project.isActive ? "active" : "inactive";
      li.innerHTML = `
        <div class="admin-row-text"><strong>${project.key}</strong> | ${project.title} | ${activeLabel} | ${project.url || "-"}</div>
        <div class="admin-row-inline">
          <button type="button" class="admin-btn admin-project-edit" data-project-key="${project.key}">Edit</button>
        </div>
      `;
      dom.projectList.appendChild(li);
    });
  }

  /**
   * Handles renderRequests.
   */
  function renderRequests(requests) {
    if (!dom.requestList) return;
    dom.requestList.innerHTML = "";

    if (!requests.length) {
      const li = document.createElement("li");
      li.textContent = "No requests found.";
      dom.requestList.appendChild(li);
      return;
    }

    requests.forEach((request) => {
      const li = document.createElement("li");
      let requestActions = "";
      if (request.status === "pending") {
        requestActions = `<div class="admin-row-inline">
               <button class="admin-btn admin-request-action" data-action="approve" data-request-id="${request.id}">Approve</button>
               <button class="admin-btn admin-btn-danger admin-request-action" data-action="decline" data-request-id="${request.id}">Decline</button>
             </div>`;
      } else if (request.status === "approved") {
        requestActions = `<div class="admin-row-inline">
              <button class="admin-btn admin-btn-danger admin-request-action" data-action="revoke" data-request-id="${request.id}">Revoke</button>
            </div>`;
      }
      li.innerHTML = `
        <div class="admin-row-text"><strong>#${request.id}</strong> | ${request.user.email} | ${request.project.title} | <span class="admin-pill admin-pill-${request.status}">${request.status}</span></div>
        ${requestActions}
      `;
      dom.requestList.appendChild(li);
    });
  }

  /**
   * Handles loadUsers.
   */
  async function loadUsers() {
    const { response, payload } = await apiFetch("/api/admin/users", { method: "GET" });
    if (!response.ok) throw new Error(payload?.error || "Failed to load users");
    renderUsers(payload?.users || []);
  }

  /**
   * Handles loadProjects.
   */
  async function loadProjects() {
    const { response, payload } = await apiFetch("/api/access/projects", { method: "GET" });
    if (!response.ok) throw new Error(payload?.error || "Failed to load projects");
    renderProjects(payload?.projects || []);
  }

  /**
   * Handles loadRequests.
   */
  async function loadRequests() {
    const status = dom.requestFilter?.value || "pending";
    const { response, payload } = await apiFetch(
      `/api/access/admin/requests?status=${encodeURIComponent(status)}`,
      { method: "GET" }
    );
    if (!response.ok) throw new Error(payload?.error || "Failed to load requests");
    renderRequests(payload?.requests || []);
  }

  /**
   * Handles refreshAll.
   */
  async function refreshAll() {
    if (!state.isAdmin || state.loading) return;
    state.loading = true;
    setStatus("Loading admin data...");
    try {
      if (state.activeTab === "users") {
        await loadUsers();
      } else if (state.activeTab === "projects") {
        await loadProjects();
      } else if (state.activeTab === "requests") {
        await loadRequests();
      }
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Failed to load admin data.", true);
    } finally {
      state.loading = false;
    }
  }

  /**
   * Handles onSaveRole.
   */
  async function onSaveRole(event) {
    const button = event.target.closest(".admin-role-save");
    if (!button) return;

    const userId = Number(button.dataset.userId);
    const select = dom.usersBody?.querySelector(`.admin-role-select[data-user-id="${userId}"]`);
    if (!select) return;

    const role = String(select.value || "user");
    button.disabled = true;
    try {
      const { response, payload } = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        throw new Error(payload?.error || "Role update failed");
      }
      setStatus(`Updated user ${userId} role to ${role}.`);
      await loadUsers();
    } catch (error) {
      setStatus(error.message || "Role update failed.", true);
    } finally {
      button.disabled = false;
    }
  }

  /**
   * Handles onProjectSubmit.
   */
  async function onProjectSubmit(event) {
    event.preventDefault();
    if (!dom.projectForm) return;

    const formData = new FormData(dom.projectForm);
    const body = {
      projectKey: String(formData.get("projectKey") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      projectUrl: String(formData.get("projectUrl") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      isActive: Boolean(formData.get("isActive")),
    };

    if (!body.projectKey || !body.title) {
      setStatus("Project key and title are required.", true);
      return;
    }

    try {
      const { response, payload } = await apiFetch("/api/access/admin/project", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(payload?.error || "Failed to save project");
      setStatus(`Project ${body.projectKey} saved.`);
      await loadProjects();
    } catch (error) {
      setStatus(error.message || "Failed to save project.", true);
    }
  }

  /**
   * Handles onRequestAction.
   */
  async function onRequestAction(event) {
    const button = event.target.closest(".admin-request-action");
    if (!button) return;

    const requestId = Number(button.dataset.requestId);
    const action = ["approve", "decline", "revoke"].includes(button.dataset.action)
      ? button.dataset.action
      : "decline";
    button.disabled = true;

    try {
      const { response, payload } = await apiFetch(
        `/api/access/admin/requests/${requestId}/${action}`,
        { method: "POST", body: JSON.stringify({}) }
      );
      if (!response.ok) throw new Error(payload?.error || `Failed to ${action} request`);
      const actionWord = action === "revoke" ? "revoked" : `${action}d`;
      setStatus(`Request #${requestId} ${actionWord}.`);
      await loadRequests();
      if (state.activeTab === "projects") await loadProjects();
    } catch (error) {
      setStatus(error.message || "Request update failed.", true);
    } finally {
      button.disabled = false;
    }
  }

  /**
   * Handles onProjectEdit.
   */
  function onProjectEdit(event) {
    const button = event.target.closest(".admin-project-edit");
    if (!button || !dom.projectForm) return;
    const key = button.dataset.projectKey;
    const project = state.projects.find((entry) => entry.key === key);
    if (!project) return;

    const setValue = (name, value) => {
      const input = dom.projectForm.elements.namedItem(name);
      if (input && "value" in input) input.value = value || "";
    };

    setValue("projectKey", project.key);
    setValue("title", project.title);
    setValue("projectUrl", project.url || "");
    setValue("description", project.description || "");

    const activeInput = dom.projectForm.elements.namedItem("isActive");
    if (activeInput && "checked" in activeInput) {
      activeInput.checked = Boolean(project.isActive);
    }
    setStatus(`Loaded ${project.key} into form.`);
  }

  /**
   * Handles setActiveTab.
   */
  async function setActiveTab(tab) {
    const nextTab = ["users", "projects", "requests"].includes(tab) ? tab : "users";
    state.activeTab = nextTab;

    dom.tabButtons?.forEach((button) => {
      const active = button.dataset.adminTab === nextTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    dom.panelUsers?.classList.toggle("admin-hidden", nextTab !== "users");
    dom.panelProjects?.classList.toggle("admin-hidden", nextTab !== "projects");
    dom.panelRequests?.classList.toggle("admin-hidden", nextTab !== "requests");

    if (!state.isAdmin) return;
    if (nextTab === "users") {
      await loadUsers();
      return;
    }
    if (nextTab === "projects") {
      await loadProjects();
      return;
    }
    if (nextTab === "requests") {
      await loadRequests();
    }
  }

  /**
   * Handles applyAuthState.
   */
  function applyAuthState(user) {
    state.currentUser = user || null;
    state.isAdmin = Boolean(user && user.role === "admin");
    setAdminNavVisible(state.isAdmin);

    if (!state.isAdmin) {
      clearAdminViews();
      redirectHomeIfOnAdmin();
      return;
    }

    if (window.location.hash === "#admin") {
      refreshAll();
    }
  }

  /**
   * Handles cacheDom.
   */
  function cacheDom() {
    dom.navAdminItem = document.getElementById("nav-admin-item");
    dom.mobileNavAdminItem = document.getElementById("mobile-nav-admin-item");
    dom.navAdminLink = document.getElementById("nav-admin-link");
    dom.mobileNavAdminLink = document.getElementById("mobile-nav-admin-link");
    dom.status = document.getElementById("admin-status");
    dom.tabButtons = document.querySelectorAll("[data-admin-tab]");
    dom.panelUsers = document.getElementById("admin-panel-users");
    dom.panelProjects = document.getElementById("admin-panel-projects");
    dom.panelRequests = document.getElementById("admin-panel-requests");
    dom.usersBody = document.getElementById("admin-users-body");
    dom.refreshUsersBtn = document.getElementById("admin-refresh-users");
    dom.refreshProjectsBtn = document.getElementById("admin-refresh-projects");
    dom.refreshRequestsBtn = document.getElementById("admin-refresh-requests");
    dom.projectForm = document.getElementById("admin-project-form");
    dom.projectList = document.getElementById("admin-project-list");
    dom.requestList = document.getElementById("admin-request-list");
    dom.requestFilter = document.getElementById("admin-request-filter");
  }

  /**
   * Handles bindEvents.
   */
  function bindEvents() {
    dom.refreshUsersBtn?.addEventListener("click", loadUsers);
    dom.refreshProjectsBtn?.addEventListener("click", loadProjects);
    dom.refreshRequestsBtn?.addEventListener("click", loadRequests);
    dom.requestFilter?.addEventListener("change", loadRequests);
    dom.projectForm?.addEventListener("submit", onProjectSubmit);
    dom.projectList?.addEventListener("click", onProjectEdit);
    dom.usersBody?.addEventListener("click", onSaveRole);
    dom.requestList?.addEventListener("click", onRequestAction);
    dom.tabButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab(button.dataset.adminTab || "users");
      });
    });

    window.addEventListener("pagechange", (event) => {
      if (event.detail?.page === "admin" && state.isAdmin) {
        refreshAll();
      }
    });

    window.addEventListener("auth:state", (event) => {
      applyAuthState(event.detail?.user || null);
    });
  }

  /**
   * Handles initAdmin.
   */
  function initAdmin() {
    cacheDom();
    if (!dom.status) return;
    setAdminNavVisible(false);
    setActiveTab("users");
    bindEvents();

    const initialUser = window.AuthModule?.getCurrentUser?.() || null;
    applyAuthState(initialUser);
  }

  window.AdminModule = {
    initAdmin,
  };
})();
