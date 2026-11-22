(function () {
  "use strict";

  const ROOT = new URL("../", document.currentScript.src);
  const THEME_KEY = "astra-theme";
  const html = document.documentElement;
  const Auth = window.AstraAuth;
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });
  const returnFocus = new WeakMap();

  function openDialog(dialog, trigger = document.activeElement) {
    if (!dialog || dialog.open) return;
    returnFocus.set(dialog, trigger);
    dialog.showModal();
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) dialog.close();
  }

  window.AstraUI = Object.freeze({ ready, openDialog, closeDialog });

  async function requestLogin(next) {
    await ready;
    if (Auth.isLoggedIn()) return;
    const dialog = document.getElementById("authDialog");
    if (!dialog) return;
    const login = new URL("login.html", ROOT);
    const target = new URL(Auth.safeNext(next));
    login.searchParams.set("next", target.pathname.slice(ROOT.pathname.length) + target.search + target.hash);
    dialog.querySelector("[data-auth-signin]").href = login.href;
    openDialog(dialog);
  }

  document.addEventListener("astra:request-login", (event) => requestLogin(event.detail.next));

  function fillUser() {
    const user = Auth.user();
    document.querySelectorAll("[data-current-user]").forEach((element) => {
      element.textContent = user ? user.identifier : "";
    });
    document.querySelectorAll("[data-current-user-row]").forEach((element) => {
      element.dataset.handle = user ? user.identifier : "";
    });
  }

  // Capture before page handlers so a guest action cannot write local account data.
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-requires-auth], a[href]");
    if (!target || Auth.isLoggedIn()) return;
    const link = target.closest("a[href]");
    const next = target.dataset.authNext || (link ? link.href : location.href);
    if (target.hasAttribute("data-requires-auth") || (link && Auth.isPrivate(link.href))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      Auth.requireLogin(next);
    }
  }, true);

  document.addEventListener("submit", (event) => {
    if (!Auth.isLoggedIn() && (event.target.matches("[data-requires-auth]") || Auth.isPrivate())) {
      event.preventDefault();
      event.stopImmediatePropagation();
      Auth.requireLogin();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dialog-close]");
    if (button) closeDialog(button.closest("dialog"));
    if (event.target.matches("dialog.site-dialog")) {
      const rect = event.target.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        closeDialog(event.target);
      }
    }
  });

  document.addEventListener("close", (event) => {
    const trigger = returnFocus.get(event.target);
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  }, true);

  document.addEventListener("astra:auth-change", fillUser);


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


  const READ_KEY = Auth.userKey("astra-notifications-read");

  function readReadIds() {
    try {
      const ids = JSON.parse(localStorage.getItem(READ_KEY));
      return Array.isArray(ids) ? ids : [];
    } catch (error) { return []; }
  }

  async function requestLogout(trigger) {
    await ready;
    if (!Auth.isLoggedIn()) return;
    const dialog = document.getElementById("logoutDialog");
    const returnTo = document.querySelector(trigger.closest(".nav-only-mobile") ? ".hamburger" : ".profile-toggle");
    closePopups();
    setMenu(false);
    document.getElementById("logoutStatus").textContent = "";
    openDialog(dialog, returnTo);
  }

  function logout() {
    if (!document.getElementById("logoutDialog").open) return;
    if (Auth.setSession(null)) location.href = new URL("index.html", ROOT).href;
    else document.getElementById("logoutStatus").textContent = "Could not log out. Please try again.";
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
    if (!Auth.isLoggedIn() || !document.querySelector("[data-notification-list]")) return;

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


  const includes = new Map();

  async function include(slot) {
    const url = new URL("components/" + slot.dataset.include + ".html", ROOT);
    if (!includes.has(url.href)) {
      includes.set(url.href, fetch(url).then((res) => {
        if (!res.ok) throw new Error("Could not load " + url + " (" + res.status + ")");
        return res.text();
      }));
    }
    const text = (await includes.get(url.href)).replace(
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

    if (slot.dataset.include === "back-link") {
      const link = tpl.content.querySelector("a");
      link.href = new URL(slot.dataset.href || "index.html", ROOT).href;
      link.setAttribute("aria-label", "Back " + (slot.dataset.label || "to main page"));
      link.querySelector(".back-extra").textContent = slot.dataset.label || "to main page";
      if (slot.hasAttribute("data-fixed")) link.classList.add("back-link-fixed");
    }
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
    resolveReady();
    fillUser();
    if (Auth.isPrivate() && !Auth.isLoggedIn()) {
      const template = document.getElementById("authGateTemplate");
      if (template) {
        document.querySelector("main").appendChild(template.content.cloneNode(true));
        await Promise.all([...document.querySelectorAll(".auth-gate [data-include]")].map(include));
      }
      Auth.requireLogin();
    }
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
    } else if (e.target.closest("[data-logout]")) requestLogout(e.target.closest("[data-logout]"));
    else if (e.target.closest("[data-confirm-logout]")) logout();
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
