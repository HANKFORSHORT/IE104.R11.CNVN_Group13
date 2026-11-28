(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const text = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
  const date = (value) => value ? new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium", timeStyle: "short"
  }) : "";
  const current = () => AstraAuth.user();
  const requested = () => {
    const query = new URLSearchParams(location.search);
    return query.get("u") || query.get("user");
  };

  function status(form, message) {
    const node = form.querySelector("[data-form-status]");
    if (node) node.textContent = message;
  }
  function fieldError(input, message) {
    const node = document.getElementById(input.id + "-error");
    if (node) node.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
  function errorIn(form, error) {
    const name = {
      USERNAME_TAKEN: "username", INVALID_USERNAME: "username",
      INVALID_DISPLAY_NAME: "displayName", INVALID_BIO: "bio",
      INVALID_AVATAR_URL: "avatarUrl", INVALID_COUNTRY: "country"
    }[error.code];
    if (name && form.elements[name]) {
      fieldError(form.elements[name], error.message);
      form.elements[name].focus();
    } else status(form, error.message);
  }
  function pageError(message) {
    const main = $("main");
    const box = document.createElement("p");
    box.setAttribute("role", "alert");
    box.className = "container";
    box.textContent = message;
    main.appendChild(box);
  }

  async function settings() {
    const profileForm = $("#profile-form");
    const passwordForm = $("#password-form");
    const preferencesForm = $("#preferences-form");
    let profile;
    try { profile = await AstraAPI.request("/api/v1/me"); }
    catch (error) { pageError(error.message); return; }
    profileForm.elements.username.value = profile.username;
    profileForm.elements.displayName.value = profile.displayName || "";
    profileForm.elements.email.value = profile.email || "";
    profileForm.elements.bio.value = profile.bio || "";
    profileForm.elements.avatarUrl.value = profile.avatarUrl || "";
    profileForm.elements.country.value = profile.country || "";
    preferencesForm.elements.emailNotifications.checked =
      profile.settings.isEmailNotificationEnabled;
    preferencesForm.elements.publicProfile.checked = profile.settings.isProfilePublic;

    profileForm.addEventListener("input", (event) => {
      if (event.target.id) fieldError(event.target, "");
    });
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = {
        username: profileForm.elements.username.value.trim(),
        displayName: profileForm.elements.displayName.value.trim() || null,
        bio: profileForm.elements.bio.value.trim() || null,
        avatarUrl: profileForm.elements.avatarUrl.value.trim() || null,
        country: profileForm.elements.country.value.trim().toUpperCase() || null
      };
      const button = profileForm.querySelector('[type="submit"]');
      button.disabled = true;
      status(profileForm, "Saving…");
      try {
        profile = await AstraAPI.request("/api/v1/me", { method: "PATCH", body: values });
        await AstraAuth.refresh();
        status(profileForm, "Profile saved.");
      } catch (error) { errorIn(profileForm, error); }
      finally { button.disabled = false; }
    });

    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const currentPassword = passwordForm.elements.current.value;
      const newPassword = passwordForm.elements.password.value;
      const confirm = passwordForm.elements.confirm.value;
      if (!currentPassword) {
        fieldError(passwordForm.elements.current, "Enter your current password.");
        return;
      }
      const issue = AstraUI.passwordRule(newPassword);
      if (issue) { fieldError(passwordForm.elements.password, issue); return; }
      if (newPassword !== confirm) {
        fieldError(passwordForm.elements.confirm, "Passwords do not match.");
        return;
      }
      const button = passwordForm.querySelector('[type="submit"]');
      button.disabled = true;
      status(passwordForm, "Updating…");
      try {
        await AstraAPI.request("/api/v1/auth/change-password", {
          method: "POST", body: { currentPassword, newPassword }
        });
        passwordForm.reset();
        status(passwordForm, "Password updated. Other sessions were signed out.");
      } catch (error) { status(passwordForm, error.message); }
      finally { button.disabled = false; }
    });

    preferencesForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = preferencesForm.querySelector('[type="submit"]');
      button.disabled = true;
      status(preferencesForm, "Saving…");
      try {
        await AstraAPI.request("/api/v1/me/settings", {
          method: "PATCH",
          body: {
            isEmailNotificationEnabled: preferencesForm.elements.emailNotifications.checked,
            isProfilePublic: preferencesForm.elements.publicProfile.checked
          }
        });
        status(preferencesForm, "Preferences saved.");
      } catch (error) { status(preferencesForm, error.message); }
      finally { button.disabled = false; }
    });
  }

  async function publicProfile() {
    const username = requested();
    const loading = $("[data-user-loading]");
    const found = $("[data-user-profile]");
    const missing = $("[data-user-notfound]");
    if (!username) {
      loading.hidden = true;
      missing.hidden = false;
      return;
    }
    let profile;
    try {
      profile = await AstraAPI.request("/api/v1/users/" + encodeURIComponent(username));
    } catch (error) {
      loading.hidden = true;
      missing.hidden = false;
      if (error.status !== 404) {
        missing.querySelector("h1").textContent = "Profile unavailable";
        missing.querySelector(".page-header p").textContent = error.message;
      }
      return;
    }
    const owner = current() && current().username.toLowerCase() === profile.username.toLowerCase();
    if (profile.avatarUrl) {
      $("[data-user-avatar]").src = profile.avatarUrl;
      $("[data-user-avatar]").hidden = false;
      $("[data-user-field=initials]").hidden = true;
    }
    const values = {
      handle: profile.username,
      subtitle: [profile.displayName, profile.country].filter(Boolean).join(" · "),
      bio: profile.bio || "",
      initials: profile.username.slice(0, 2).toUpperCase(),
      rating: Number(profile.rating).toLocaleString("en-US"),
      rank: profile.rank ? "#" + Number(profile.rank).toLocaleString("en-US") : "—", solved: Number(profile.solvedCount).toLocaleString("en-US"),
      ratingLabel: "Rating", rankLabel: "Rank", solvedLabel: "Problems solved"
    };
    document.querySelectorAll("[data-user-field]").forEach((node) => {
      node.textContent = values[node.dataset.userField] || "";
      if (node.dataset.userField === "bio") node.hidden = !profile.bio;
    });
    document.querySelectorAll("[data-user-link]").forEach((link) => {
      const url = new URL(link.href);
      if (!owner) url.searchParams.set("u", profile.username);
      link.href = url.href;
    });
    document.querySelectorAll("[data-owner-only], [data-edit-profile]").forEach((node) => {
      node.hidden = !owner;
    });
    document.title = profile.username + " · Astra";
    loading.hidden = true;
    found.hidden = false;
  }

  async function solved() {
    const name = requested();
    const own = !name || current() && current().username.toLowerCase() === name.toLowerCase();
    if (own && !current()) return;
    let profile;
    try {
      profile = await AstraAPI.request(own ? "/api/v1/me" :
        "/api/v1/users/" + encodeURIComponent(name));
    } catch (error) {
      $("#solvedContent").hidden = true;
      $("#solvedNotfound").hidden = false;
      if (error.status !== 404) $("#solvedNotfound p").textContent = error.message;
      return;
    }
    const username = profile.username;
    const parent = $("#solvedParent");
    parent.href = own ? "profile.html" : "public-profile.html?u=" + encodeURIComponent(username);
    parent.textContent = own ? "Account" : username;
    text("[data-solved-owner]", username);
    text("[data-solved-count]", profile.solvedCount);
    $("[data-sample-note]").hidden = true;
    const list = $("#solved-list");
    const empty = $("[data-solved-empty]");
    const more = document.createElement("button");
    more.type = "button";
    more.className = "btn btn-secondary btn-sm";
    more.textContent = "Load more";
    more.hidden = true;
    list.after(more);
    let cursor = null;
    async function load() {
      more.disabled = true;
      try {
        const url = (own ? "/api/v1/me/solved" :
          "/api/v1/users/" + encodeURIComponent(username) + "/solved") +
          (cursor ? "?cursor=" + encodeURIComponent(cursor) : "");
        const page = await AstraAPI.request(url);
        page.items.forEach((item) => {
          const row = document.createElement("li");
          row.className = "solved-row";
          const score = document.createElement("div");
          score.className = "solved-score";
          const label = document.createElement("strong");
          label.textContent = item.difficulty;
          score.appendChild(label);
          const description = document.createElement("div");
          description.className = "solved-description";
          const link = document.createElement("a");
          link.className = "solved-title";
          link.href = "problem-detail.html?problem=" + encodeURIComponent(item.problemSlug);
          link.textContent = item.title;
          const meta = document.createElement("p");
          meta.className = "submission-meta";
          meta.textContent = "First accepted " + date(item.firstAcceptedAt);
          description.append(link, meta);
          row.append(score, description);
          list.appendChild(row);
        });
        cursor = page.nextCursor;
        more.hidden = !cursor;
        empty.hidden = list.children.length > 0;
      } catch (error) {
        empty.hidden = false;
        text("#solvedEmptyTitle", "Could not load solved problems");
        text("#solvedEmptyText", error.message);
      } finally { more.disabled = false; }
    }
    more.addEventListener("click", load);
    await load();
    AstraUI.ready.then(() => {
      if (!own) {
        const back = $(".actions .back-link");
        if (back) back.href = parent.href;
      }
    });
  }

  function safeLink(path) {
    if (!path || !/^[A-Za-z0-9_-]+\.html(?:[?#][A-Za-z0-9_=&%.-]*)?$/.test(path)) {
      return "notifications.html";
    }
    return path;
  }

  async function notifications() {
    const list = $("#notification-list");
    const markAll = $("[data-mark-all-read]");
    const count = $("[data-unread-count]");
    let items = [];
    let cursor = null;
    const more = document.createElement("button");
    more.type = "button";
    more.className = "btn btn-secondary btn-sm";
    more.textContent = "Load more";
    more.hidden = true;
    list.after(more);
    async function load() {
      more.disabled = true;
      try {
        const path = "/api/v1/me/notifications?limit=100" +
          (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
        const page = await AstraAPI.request(path);
        items.push(...page.items);
        cursor = page.nextCursor;
        more.hidden = !cursor;
        render();
      } catch (error) {
        count.textContent = error.message;
        if (!items.length) markAll.disabled = true;
      } finally { more.disabled = false; }
    }
    more.addEventListener("click", load);
    function render() {
      list.replaceChildren();
      items.forEach((item) => {
        const row = document.createElement("li");
        row.className = "notice";
        row.dataset.read = String(Boolean(item.readAt));
        const icon = document.createElement("span");
        icon.className = "notice-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = item.type.slice(0, 1).toUpperCase();
        const content = document.createElement("div");
        const meta = document.createElement("span");
        meta.className = "notice-meta";
        meta.textContent = item.type + " · " + date(item.createdAt);
        const title = document.createElement("h2");
        title.className = "notice-title";
        title.textContent = item.title;
        const body = document.createElement("p");
        body.className = "notice-text";
        body.textContent = item.body;
        const link = document.createElement("a");
        link.className = "notice-link";
        link.href = safeLink(item.linkPath);
        link.textContent = "Open →";
        content.append(meta, title, body, link);
        const side = document.createElement("div");
        side.className = "notice-side";
        const state = document.createElement("span");
        state.className = "notice-status";
        state.textContent = item.readAt ? "Read" : "New";
        side.appendChild(state);
        if (!item.readAt) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "btn btn-secondary btn-sm";
          button.textContent = "Mark as read";
          button.addEventListener("click", async () => {
            button.disabled = true;
            try {
              await AstraAPI.request("/api/v1/me/notifications/" + encodeURIComponent(item.id),
                { method: "PATCH", body: {} });
              item.readAt = new Date().toISOString();
              render();
              document.dispatchEvent(new CustomEvent("astra:notifications-read"));
            } catch (error) {
              button.disabled = false;
              count.textContent = error.message;
            }
          });
          side.appendChild(button);
        }
        row.append(icon, content, side);
        list.appendChild(row);
      });
      const unread = items.filter((item) => !item.readAt).length;
      count.textContent = items.length
        ? unread + " unread notification" + (unread === 1 ? "" : "s") + "."
        : "No notifications yet.";
      markAll.disabled = unread === 0;
    }
    markAll.addEventListener("click", async () => {
      markAll.disabled = true;
      try {
        await AstraAPI.request("/api/v1/me/notifications/read-all", { method: "POST" });
        items.forEach((item) => { item.readAt = item.readAt || new Date().toISOString(); });
        render();
        document.dispatchEvent(new CustomEvent("astra:notifications-read"));
      } catch (error) {
        count.textContent = error.message;
        markAll.disabled = false;
      }
    });
    await load();
  }

  async function init() {
    const page = $("[data-account-page]");
    if (!page) return;
    await AstraAuth.ready;
    if (AstraAuth.isPrivate() && !AstraAuth.isLoggedIn()) return;
    const handlers = {
      settings, "public-profile": publicProfile, solved, notifications
    };
    if (handlers[page.dataset.accountPage]) await handlers[page.dataset.accountPage]();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
