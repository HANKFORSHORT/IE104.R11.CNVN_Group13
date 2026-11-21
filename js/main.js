(function () {
  "use strict";

  const ROOT = new URL("../", document.currentScript.src);
  const THEME_KEY = "astra-theme";
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
    });
  }

  function savedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function toggleTheme() {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked */ }
    applyTheme(next);
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme() || (prefersDark ? "dark" : "light"));


  /* ---------------------------------------------------------
     Login state
     TODO: replace with a real session from the backend. Until then
     js/auth.js saves { identifier } under SESSION_KEY after a valid login.
     <html data-auth="in|out"> drives data-auth-only="in|out" in style.css.
     --------------------------------------------------------- */

  const SESSION_KEY = "astra-session";
  const READ_KEY = "astra-notifications-read"; // same key js/account.js uses

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function readReadIds() {
    try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) { return []; }
  }

  const session = readSession();
  const isLoggedIn = Boolean(session && session.identifier);
  html.setAttribute("data-auth", isLoggedIn ? "in" : "out");

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* storage blocked */ }
    location.href = new URL("index.html", ROOT).href;
  }

  function fillUserInitials() {
    if (!isLoggedIn) return;
    const initials = String(session.identifier).replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
    document.querySelectorAll("[data-user-initials]").forEach((el) => {
      el.textContent = initials;
    });
  }


  /* ---------------------------------------------------------
     Notifications popup (bell)
     --------------------------------------------------------- */

  let notifications = [];

  function textOf(parent, selector) {
    const el = parent.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  async function loadNotifications() {
    if (!isLoggedIn || !document.querySelector("[data-notification-list]")) return;

    try {
      // TODO: replace with an API call. For now notifications.html is the only copy of the list.
      const url = new URL("notifications.html", ROOT);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load " + url + " (" + res.status + ")");

      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      notifications = [...doc.querySelectorAll("[data-notification-id]")].map((item) => {
        const link = item.querySelector(".notice-link");
        return {
          id: item.dataset.notificationId,
          meta: textOf(item, ".notice-meta"),
          title: textOf(item, ".notice-title"),
          href: link ? link.getAttribute("href") : "notifications.html",
        };
      });
    } catch (err) {
      console.error(err);
    }
    renderNotifications();
  }

  function renderNotifications() {
    const list = document.querySelector("[data-notification-list]");
    const label = document.querySelector("[data-unread-label]");
    const dot = document.querySelector("[data-unread-dot]");
    if (!list) return;

    const readIds = readReadIds();
    list.replaceChildren();

    notifications.forEach((item) => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      const meta = document.createElement("span");
      const title = document.createElement("span");

      link.className = "nav-popup-item";
      link.href = new URL(item.href, ROOT).href;
      link.dataset.read = String(readIds.includes(item.id));
      meta.className = "nav-popup-meta";
      meta.textContent = item.meta;
      title.className = "nav-popup-title";
      title.textContent = item.title;

      link.append(meta, title);
      row.appendChild(link);
      list.appendChild(row);
    });

    if (!notifications.length) {
      const empty = document.createElement("li");
      empty.className = "nav-popup-empty";
      empty.textContent = "No notifications.";
      list.appendChild(empty);
    }

    const unread = notifications.filter((item) => !readIds.includes(item.id)).length;
    if (label) label.textContent = unread ? unread + " unread" : "All caught up";
    if (dot) dot.hidden = unread === 0;
  }

  // account.js fires this after "Mark as read"; "storage" covers other tabs.
  document.addEventListener("astra:notifications-read", renderNotifications);
  window.addEventListener("storage", (e) => {
    if (e.key === READ_KEY) renderNotifications();
  });


  async function include(slot) {
    const url = new URL("components/" + slot.dataset.include + ".html", ROOT);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load " + url + " (" + res.status + ")");

    const text = (await res.text()).replace(
      /<!--\s*Code injected by live-server\s*-->\s*<script[\s\S]*?<\/script>/gi, ""
    );

    const tpl = document.createElement("template");
    tpl.innerHTML = text;
    tpl.content.querySelectorAll("[href], [src]").forEach((el) => {
      ["href", "src"].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) {
          el.setAttribute(attr, new URL(value, ROOT).href);
        }
      });
    });

    slot.replaceWith(tpl.content);
  }

  function markActiveLink() {
    const here = location.pathname.replace(/\/$/, "/index.html");
    document.querySelectorAll(".nav-links a").forEach((a) => {
      if (new URL(a.href).pathname === here) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await Promise.all([...document.querySelectorAll("[data-include]")].map(include));
    } catch (err) {
      console.error(err);
    }
    applyTheme(html.getAttribute("data-theme"));
    markActiveLink();
    fillUserInitials();
    loadNotifications();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });

  function setMenu(open) {
    const links = document.querySelector(".nav-links");
    const burger = document.querySelector(".hamburger");
    if (!links || !burger) return;
    links.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  }

  // Shows or hides the element a toggle controls (popup or expanding section).
  function setExpanded(toggle, open) {
    const target = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!target) return;
    target.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }

  function closePopups(except) {
    document.querySelectorAll("[data-popup-toggle][aria-expanded='true']").forEach((toggle) => {
      if (toggle !== except) setExpanded(toggle, false);
    });
  }

  document.addEventListener("click", (e) => {
    const popupToggle = e.target.closest("[data-popup-toggle]");
    const collapseToggle = e.target.closest("[data-collapse-toggle]");

    // A click anywhere outside an open popup closes it
    if (!e.target.closest(".nav-popup")) closePopups(popupToggle);

    if (e.target.closest(".theme-toggle")) toggleTheme();
    else if (popupToggle) {
      setExpanded(popupToggle, popupToggle.getAttribute("aria-expanded") !== "true");
    } else if (collapseToggle) {
      setExpanded(collapseToggle, collapseToggle.getAttribute("aria-expanded") !== "true");
    } else if (e.target.closest("[data-logout]")) logout();
    else if (e.target.closest(".hamburger")) {
      setMenu(!document.querySelector(".nav-links").classList.contains("open"));
    } else if (e.target.closest(".nav-links a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openToggle = document.querySelector("[data-popup-toggle][aria-expanded='true']");
    if (!openToggle) return;
    setExpanded(openToggle, false);
    openToggle.focus();
  });
})();
