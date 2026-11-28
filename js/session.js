(function () {
  "use strict";

  const ROOT = new URL("../", document.currentScript.src);
  const PRIVATE_PAGES = new Set([
    "profile.html", "settings.html", "notifications.html", "submissions.html", "workspace.html"
  ]);
  let session = null;
  let error = null;

  const user = () => session ? { ...session, identifier: session.username } : null;
  const isLoggedIn = () => Boolean(session);
  const userKey = (base) => base + "." + encodeURIComponent(session ? session.username : "guest");

  function isPrivate(value = location.href) {
    const url = new URL(value, ROOT);
    if (url.origin !== ROOT.origin) return false;
    const name = url.pathname.split("/").pop();
    return PRIVATE_PAGES.has(name) ||
      (["solved.html", "achievements.html"].includes(name) &&
        !url.searchParams.has("user") && !url.searchParams.has("u"));
  }

  function safeNext(value) {
    try {
      const url = new URL(value || "index.html", ROOT);
      const name = url.pathname.slice(ROOT.pathname.length);
      if (url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname) &&
          /^[A-Za-z0-9_-]+\.html$/.test(name) &&
          !["login.html", "register.html"].includes(name)) {
        return url.href;
      }
    } catch { /* Invalid destinations return to the home page. */ }
    return new URL("index.html", ROOT).href;
  }

  function sync() {
    document.documentElement.dataset.auth = session ? "in" : "out";
    document.documentElement.dataset.privatePage = String(isPrivate());
    document.dispatchEvent(new CustomEvent("astra:auth-change"));
  }

  async function refresh() {
    try {
      session = await window.AstraAPI.request("/api/v1/auth/me");
      error = null;
    } catch (issue) {
      session = null;
      error = issue.status === 401 ? null : issue;
    }
    sync();
    return user();
  }

  function requireLogin(next = location.href) {
    if (session) return true;
    document.dispatchEvent(new CustomEvent("astra:request-login", {
      detail: { next: safeNext(next) }
    }));
    return false;
  }

  document.documentElement.dataset.auth = "pending";
  document.documentElement.dataset.privatePage = String(isPrivate());
  const ready = refresh();
  window.AstraAuth = Object.freeze({
    user, isLoggedIn, userKey, isPrivate, safeNext, requireLogin, refresh, ready,
    get error() { return error; }
  });
})();
