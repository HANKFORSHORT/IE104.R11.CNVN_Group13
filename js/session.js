(function () {
  "use strict";

  // Frontend session only. A backend must authenticate and authorize API requests.
  const KEY = "astra-session";
  const ROOT = new URL("../", document.currentScript.src);
  const PRIVATE_PAGES = new Set([
    "profile.html", "settings.html", "notifications.html", "submissions.html", "workspace.html"
  ]);

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      if (value && typeof value.identifier === "string" && value.identifier.trim()) {
        return { identifier: value.identifier.trim() };
      }
    } catch (error) { /* Missing, blocked or invalid storage means signed out. */ }
    return null;
  }

  let session = read();
  const user = () => session ? { ...session } : null;
  const isLoggedIn = () => Boolean(session);
  const userKey = (base) => base + "." + encodeURIComponent(session ? session.identifier : "guest");

  function isPrivate(value = location.href) {
    const url = new URL(value, ROOT);
    if (url.origin !== ROOT.origin) return false;
    const name = url.pathname.split("/").pop();
    return PRIVATE_PAGES.has(name) ||
      (["solved.html", "achievements.html"].includes(name) && !url.searchParams.has("user"));
  }

  function safeNext(value) {
    try {
      const url = new URL(value || "index.html", ROOT);
      const name = url.pathname.slice(ROOT.pathname.length);
      if (url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname) &&
          /^[A-Za-z0-9_-]+\.html$/.test(name) && !["login.html", "register.html"].includes(name)) {
        return url.href;
      }
    } catch (error) { /* Ignore malformed return destinations. */ }
    return new URL("index.html", ROOT).href;
  }

  function sync() {
    document.documentElement.dataset.auth = isLoggedIn() ? "in" : "out";
    document.documentElement.dataset.privatePage = String(isPrivate());
  }

  function setSession(value) {
    try {
      if (value) localStorage.setItem(KEY, JSON.stringify({ identifier: value.identifier }));
      else localStorage.removeItem(KEY);
    } catch (error) {
      return false;
    }
    session = read();
    sync();
    document.dispatchEvent(new CustomEvent("astra:auth-change"));
    return value ? isLoggedIn() : !isLoggedIn();
  }

  function requireLogin(next = location.href) {
    if (isLoggedIn()) return true;
    document.dispatchEvent(new CustomEvent("astra:request-login", { detail: { next: safeNext(next) } }));
    return false;
  }

  function refresh() {
    const previous = session && session.identifier;
    session = read();
    sync();
    if (previous !== (session && session.identifier)) {
      // Reinitialize page data and clear any previous user's open dialogs/drafts.
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
      document.dispatchEvent(new CustomEvent("astra:auth-change"));
      location.reload();
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) refresh();
  });
  window.addEventListener("pageshow", (event) => { if (event.persisted) refresh(); });

  window.AstraAuth = Object.freeze({ user, isLoggedIn, userKey, isPrivate, safeNext, setSession, requireLogin });
  sync();
})();
