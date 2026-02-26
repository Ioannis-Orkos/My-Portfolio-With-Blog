# Ioannis.work - Project Documentation

This document explains how the website is built, how the modules work together, and how to debug or modify behavior without any AI context.

## 1. Project Purpose

This repository is a modular single-page website with:
- Public sections: Home, About, Portfolio, Blog, Contact
- Authentication modal: local login/signup + OAuth hooks
- Admin panel: manage users, projects, and access requests
- Embedded content loading for portfolio/blog detail pages
- Theme toggle, typing animation, and responsive navigation

The frontend is plain HTML/CSS/JavaScript (no framework).

## 2. High-Level Architecture

Core principle: the main page (`index.html`) loads small JavaScript modules from `js/`, and each module manages one feature area.

Main flow:
1. `index.html` loads all scripts.
2. `js/script.js` runs on `DOMContentLoaded`.
3. Each module initializes itself and binds listeners.
4. Navigation changes page visibility using hash + history state.

### Frontend modules (root `js/`)

- `script.js`: bootstraps all modules.
- `navigation.js`: SPA-style section switching and modal route behavior.
- `theme.js`: dark/light theme persistence.
- `controls.js`: UX helpers (header behavior, skip link handling).
- `blog.js`: loads blog JSON list, filtering/search, opens blog pages in iframe sections.
- `portfolio.js`: loads portfolio JSON list, filtering/search, locked-project logic, request access flow.
- `auth.js`: login/signup/logout/session UI and API calls.
- `admin.js`: admin tabs (users/projects/requests), role updates, request approvals/revoke.
- `contact.js`: contact modal and EmailJS submission.
- `typing.js`: hero typing effect.
- `embedded-frame.js`: iframe content height reporting helper.

## 3. Directory Structure

- `index.html`: main page layout, modals, section containers.
- `css/styles.css`: global styles and responsive behavior.
- `blogs/blog-data.json`: blog list metadata.
- `portfolio/portfolio-data.json`: portfolio list metadata (includes `locked`).
- `blogs/*/index.html`: blog detail pages.
- `portfolio/*/index.html`: project detail pages.
- `js/*.js`: feature modules.
- `server/`: local helper server artifacts in this repo.

Related backend used by this frontend:
- `../ioannis.work-servers/auth-backend`: auth + access-control API.

## 4. Routing and Navigation Model

The app uses hash routing (`#home`, `#portfolio`, `#blog`, etc.).

- Standard pages are shown via `.page.active`.
- Contact/Login are modal routes (`#contact`, `#login`).
- Closing modals now removes modal route state from history with `history.replaceState(...)` and restores the correct active nav link.

Debug tip:
- If a nav item stays highlighted incorrectly, inspect `closeModal()` in `js/auth.js` and `js/contact.js`.

## 5. Authentication Model (Frontend)

Token storage:
- JWT is stored in `localStorage` key: `portfolio_auth_token`.

Auth API base:
- `window.AUTH_API_BASE` if provided, otherwise `http://localhost:4001`.

Main frontend auth endpoints:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /projects/links`

UI behavior:
- Logged-out users see login/signup views.
- Logged-in users see welcome view.
- Admin users do not see the protected links list in welcome view.

Password-manager compatibility:
- Login email uses `autocomplete="username"`.
- Login password uses `autocomplete="current-password"`.
- Signup email uses `autocomplete="email"`.
- Signup password uses `autocomplete="new-password"`.

## 6. Portfolio Lock / Access Request Flow

Source of truth for list items:
- `portfolio/portfolio-data.json`

Per-item lock flag:
- `"locked": true | false`

Behavior:
- If locked and user has no access, card is gray and not openable.
- Clicking locked card opens a modal with actions:
  - Create Account
  - Login
  - Request Access
- Request action calls:
  - `POST /api/access/request` with `{ projectKey }`

Access determination:
- Frontend calls `GET /api/access/my` and compares granted `projectKey` values with portfolio `folder` values.

Important:
- `portfolio.folder` must match backend `projects.project_key`.

## 7. Admin Panel Behavior

Admin page contains tabs:
- Users
- Projects
- Requests

Users tab:
- Loads `GET /api/admin/users`
- Role update via `PATCH /api/admin/users/:id/role`

Projects tab:
- Loads editable project list from backend `GET /api/access/projects`
- `Edit` loads item into form
- Save via `POST /api/access/admin/project`

Requests tab:
- Loads by status via `GET /api/access/admin/requests?status=...`
- Pending: Approve / Decline
- Approved: Revoke
- Revoke endpoint: `POST /api/access/admin/requests/:id/revoke`

## 8. Contact Modal Behavior

Contact modal:
- Uses EmailJS in `js/contact.js`
- Validates fields client-side
- On close, route stack is normalized and active nav state is restored.

Responsive notes:
- Overlay is darker for readability.
- Modal uses max-height and internal scrolling to avoid clipping on tablet/mobile.

## 9. Styling System

`css/styles.css` uses CSS variables for theme values.

Major areas:
- Header/nav/burger styles
- Modal overlays and modal card styles
- Auth/admin/portfolio/blog cards
- Responsive breakpoints at `768px`, `600px`, etc.

If content is clipped:
- Check modal `max-height`, `overflow-y`, and `top/bottom` values.

## 10. Data Contracts

### `portfolio/portfolio-data.json` item

- `folder` (string, required): maps to `/portfolio/<folder>/index.html` and backend `project_key`
- `title` (string)
- `date` (string)
- `description` (string)
- `image` (string)
- `categories` (array)
- `locked` (boolean)
- `link`, `linkLabel`, `linkTarget` (optional)

### `blogs/blog-data.json` item

- `folder`, `title`, `date`, `description`, `image`, `categories`
- optional external link fields

## 11. Local Development

Frontend:
1. Serve this directory with a local static server.
2. Open the served URL.

Backend (required for auth/admin/access features):
1. Go to `../ioannis.work-servers/auth-backend`
2. Install deps: `npm install`
3. Configure `.env`
4. Start: `npm run dev`

## 12. Troubleshooting

### Password suggestions not appearing
- Hard refresh page (`Ctrl+F5`).
- Ensure browser password manager is enabled.
- Confirm input `name` + `autocomplete` values match expectations.

### Locked project request says project not found
- Ensure backend has project row where `project_key == portfolio folder`.

### Modal closes but wrong nav item remains active
- Inspect `closeModal()` in `js/auth.js` or `js/contact.js`.

### Admin tabs show no data
- Verify JWT belongs to admin role.
- Verify backend is reachable at `AUTH_API_BASE`.

### Embedded page height/scroll issues
- Check iframe message handling in `blog.js` / `portfolio.js` and helper in `embedded-frame.js`.

## 13. Maintenance Checklist

When adding a new portfolio project:
1. Add item to `portfolio/portfolio-data.json`
2. Create `portfolio/<folder>/index.html` (+ assets)
3. If access-controlled, set `locked: true`
4. Ensure backend has matching `project_key`

When adding a new blog:
1. Add item to `blogs/blog-data.json`
2. Create `blogs/<folder>/index.html` (+ assets)

When changing auth:
1. Update field names/autocomplete carefully
2. Verify login + signup + autofill on desktop/mobile browsers

## 14. Notes for Future Refactor

Current code is modular but global (`window.ModuleName`) and event-driven.
A future migration path can be:
- TypeScript + strict interfaces for API payloads
- Central state store for auth/access
- Reusable modal service
- Unit tests for parsing/filtering/state transitions

---

If you are debugging a user issue, start from:
- `js/navigation.js` (routing)
- `js/auth.js` (session/UI)
- `js/portfolio.js` (access lock flow)
- `js/admin.js` (admin actions)

Those four files cover most production behavior.
