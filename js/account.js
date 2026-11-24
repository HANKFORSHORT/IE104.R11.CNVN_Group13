/* =========================================================
   ACCOUNT PAGES SCRIPTS (js/account.js)
   Used by settings.html, reset-password.html, public-profile.html,
   solved.html and notifications.html. Each page declares itself with
   <main data-account-page="...">.

   Submissions filtering reuses js/table-filter.js.
   Theme switching is already handled by main.js.

   There is no backend yet. Anything stored here lives in this browser's
   localStorage, and every place that needs the server is marked TODO.
   ========================================================= */

(function () {
  "use strict";

  const ACCOUNT_KEY = AstraAuth.userKey("astra-account");
  const READ_KEY = AstraAuth.userKey("astra-notifications-read");

  const CURRENT_USER = AstraAuth.user() ? AstraAuth.user().identifier : null;



  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */

  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false; // storage blocked
    }
  }

  function setStatus(form, message) {
    const status = form.querySelector("[data-form-status]");

    if (status) {
      status.textContent = message;
    }
  }

  // Each input has a sibling message element whose id is "<input id>-error".
  function setFieldError(input, message) {
    const errorElement = document.getElementById(input.id + "-error");

    if (errorElement) {
      errorElement.textContent = message;
    }

    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  // Runs every rule, shows the messages and focuses the first invalid field.
  function validateForm(form, rules) {
    let firstInvalid = null;

    Object.keys(rules).forEach(function (name) {
      const input = form.elements[name];
      const message = rules[name](input.value, form);

      setFieldError(input, message);

      if (message && !firstInvalid) {
        firstInvalid = input;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return !firstInvalid;
  }

  function clearErrorsOnInput(form) {
    form.addEventListener("input", function (event) {
      if (event.target.getAttribute && event.target.getAttribute("aria-invalid") === "true") {
        setFieldError(event.target, "");
      }
    });
  }

  function requestedUser() {
    const handle = new URLSearchParams(window.location.search).get("user");
    return AstraData.user(handle);
  }


  /* ---------------------------------------------------------
     settings.html
     --------------------------------------------------------- */

  function initSettings() {
    const profileForm = document.getElementById("profile-form");
    const passwordForm = document.getElementById("password-form");
    const preferencesForm = document.getElementById("preferences-form");
    const saved = readStore(ACCOUNT_KEY, {});
    profileForm.elements.username.value = CURRENT_USER;

    profileForm.elements.displayName.value = saved.displayName || "";
    profileForm.elements.email.value = saved.email || "you@example.com";
    profileForm.elements.bio.value = saved.bio || "";

    ["emailNotifications", "publicSolved"].forEach(function (name) {
      if (typeof saved[name] === "boolean") {
        preferencesForm.elements[name].checked = saved[name];
      }
    });

    [profileForm, passwordForm].forEach(clearErrorsOnInput);

    profileForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const valid = validateForm(profileForm, {
        email: function (value) {
          if (!value.trim()) {
            return "Enter your email address.";
          }

          return AstraUI.isValidEmail(value.trim()) ? "" : "Enter a valid email address, like name@example.com.";
        },
        displayName: function (value) {
          return value.length <= 40 ? "" : "Use 40 characters or fewer.";
        },
        bio: function (value) {
          return value.length <= 200 ? "" : "Use 200 characters or fewer.";
        },
      });

      if (!valid) {
        setStatus(profileForm, "");
        return;
      }

      // TODO: send to the API. For now the profile is only kept in this browser.
      const stored = writeStore(ACCOUNT_KEY, Object.assign(readStore(ACCOUNT_KEY, {}), {
        displayName: profileForm.elements.displayName.value.trim(),
        email: profileForm.elements.email.value.trim(),
        bio: profileForm.elements.bio.value.trim(),
      }));

      setStatus(profileForm, stored
        ? "Profile saved in this browser. It will sync once the backend exists."
        : "Could not save: browser storage is blocked.");
    });

    passwordForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const valid = validateForm(passwordForm, {
        current: function (value) {
          return value ? "" : "Enter your current password.";
        },
        password: AstraUI.passwordRule,
        confirm: AstraUI.confirmRule,
      });

      if (!valid) {
        setStatus(passwordForm, "");
        return;
      }

      // TODO: call the change-password API. Nothing is sent or changed yet.
      passwordForm.reset();
      setStatus(passwordForm, "The new password is valid, but it was not changed: changing passwords needs the backend, which is not connected yet.");
    });

    preferencesForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const stored = writeStore(ACCOUNT_KEY, Object.assign(readStore(ACCOUNT_KEY, {}), {
        emailNotifications: preferencesForm.elements.emailNotifications.checked,
        publicSolved: preferencesForm.elements.publicSolved.checked,
      }));

      setStatus(preferencesForm, stored
        ? "Preferences saved in this browser."
        : "Could not save: browser storage is blocked.");
    });
  }


  /* ---------------------------------------------------------
     reset-password.html  (link looks like reset-password.html?token=...)
     --------------------------------------------------------- */

  function initResetPassword() {
    const form = document.querySelector("[data-reset-form]");
    const invalidBox = document.querySelector("[data-reset-invalid]");
    const token = new URLSearchParams(window.location.search).get("token");

    // TODO: the server must verify the token. Here we only reject a missing one.
    if (!token || !token.trim()) {
      invalidBox.hidden = false;
      return;
    }

    form.hidden = false;
    clearErrorsOnInput(form);

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!validateForm(form, { password: AstraUI.passwordRule, confirm: confirmRule })) {
        return;
      }

      // TODO: send { token, password } to the API and handle an expired token.
      window.location.href = "login.html?reset=1";
    });
  }


  /* ---------------------------------------------------------
     public-profile.html and solved.html  (?user=handle)
     --------------------------------------------------------- */

  function initUserPages() {
    const user = requestedUser();
    const notFound = document.querySelector("[data-user-notfound]");
    const profile = document.querySelector("[data-user-profile]");

    if (!user) {
      notFound.hidden = false;
      return;
    }

    const format = (value) => typeof value === "number" ? value.toLocaleString("en-US") : "—";
    const isContest = user.kind === "contest";
    const isAccount = user.kind === "account";
    const fields = {
      handle: user.handle,
      rating: format(user.rating),
      rank: user.rank == null ? "—" : "#" + format(user.rank),
      solved: format(user.solved),
      ratingLabel: isContest ? "Contest points" : isAccount ? "Total points" : "Rating",
      rankLabel: isContest ? "Contest rank" : isAccount ? "Rank by points" : "Rank",
      solvedLabel: isContest ? "Contest problems solved" : "Problems solved",
      initials: user.handle.slice(0, 2).toUpperCase(),
      subtitle: [user.name, user.location].filter(Boolean).join(" · ") || "Astra competitor",
    };

    document.querySelectorAll("[data-user-field]").forEach(function (element) {
      element.textContent = fields[element.dataset.userField];
    });

    // Links to other per-user pages keep the same ?user=
    document.querySelectorAll("[data-user-link]").forEach(function (link) {
      const url = new URL(link.href);
      url.searchParams.set("user", user.handle);
      link.href = url.href;
    });

    document.querySelectorAll("[data-owner-only]").forEach((element) => {
      element.hidden = user.handle !== CURRENT_USER;
    });
    document.title = user.handle + " · Astra";
    profile.hidden = false;

  }

  function initSolved() {
    const query = new URLSearchParams(location.search);
    const hasRequestedUser = query.has("user");
    const requested = hasRequestedUser ? query.get("user") : CURRENT_USER;
    const user = AstraData.user(requested);
    if (!user) {
      if (hasRequestedUser) {
        document.getElementById("solvedContent").hidden = true;
        document.getElementById("solvedNotfound").hidden = false;
      }
      return;
    }

    const handle = user.handle;
    const own = CURRENT_USER && CURRENT_USER.toLowerCase() === handle.toLowerCase();
    const rows = user.detailsAvailable ? AstraData.solved(handle) : [];
    const parent = document.getElementById("solvedParent");
    parent.href = own ? "profile.html" : "public-profile.html?user=" + encodeURIComponent(handle);
    parent.textContent = own ? "Account" : handle;
    document.querySelector("[data-solved-owner]").textContent = handle;
    document.querySelector("[data-solved-count]").textContent = user.detailsAvailable ? rows.length : user.solved;
    document.querySelector("[data-sample-note]").hidden = handle !== AstraData.demoUser;
    document.title = handle + " · Solved problems · Astra";
    const list = document.getElementById("solved-list");
    rows.forEach((submission) => {
      const row = document.createElement("li");
      row.className = "solved-row";
      const score = document.createElement("div");
      score.className = "solved-score";
      const points = document.createElement("strong");
      points.textContent = submission.score + " / 100";
      const verdict = document.createElement("small");
      verdict.textContent = "AC | " + submission.language;
      score.append(points, verdict);
      const description = document.createElement("div");
      description.className = "solved-description";
      const link = document.createElement("a");
      link.className = "solved-title";
      link.href = "problem-detail.html?problem=" + encodeURIComponent(submission.problem);
      link.textContent = submission.title;
      const meta = document.createElement("p");
      meta.className = "submission-meta";
      meta.textContent = handle + " · " + AstraData.dateTime(submission.submittedAt);
      description.append(link, meta);
      const metrics = document.createElement("div");
      metrics.className = "solved-metrics";
      const runtime = document.createElement("strong");
      runtime.textContent = AstraData.runtime(submission.runtime);
      const memory = document.createElement("span");
      memory.textContent = AstraData.memory(submission.memory);
      metrics.append(runtime, memory);
      row.append(score, description, metrics);
      list.appendChild(row);
    });
    document.querySelector("[data-solved-empty]").hidden = rows.length > 0;
    list.hidden = rows.length === 0;
    if (!user.detailsAvailable) {
      document.getElementById("solvedEmptyTitle").textContent = "Solution details unavailable";
      document.getElementById("solvedEmptyText").textContent =
        "This profile has summary stats, but no individual accepted solutions.";
      document.getElementById("solvedEmptyAction").hidden = true;
    }
    AstraUI.ready.then(() => {
      if (!own) {
        const back = document.querySelector(".actions .back-link");
        back.href = "public-profile.html?user=" + encodeURIComponent(handle);
        back.setAttribute("aria-label", "Back to " + handle + "'s profile");
        back.querySelector(".back-extra").textContent = "to " + handle + "'s profile";
      }
    });
  }

  /* ---------------------------------------------------------
     notifications.html
     --------------------------------------------------------- */

  function initNotifications() {
    const items = Array.from(document.querySelectorAll("[data-notification-id]"));
    const countElement = document.querySelector("[data-unread-count]");
    const markAllButton = document.querySelector("[data-mark-all-read]");
    let readIds = readStore(READ_KEY, []);

    function render() {
      items.forEach(function (item) {
        const isRead = readIds.indexOf(item.dataset.notificationId) !== -1;

        item.dataset.read = String(isRead);
        item.querySelector("[data-notification-status]").textContent = isRead ? "Read" : "New";
        item.querySelector("[data-mark-read]").hidden = isRead;
      });

      const unread = items.filter(function (item) {
        return readIds.indexOf(item.dataset.notificationId) === -1;
      }).length;

      countElement.textContent = unread
        ? unread + " unread notification" + (unread === 1 ? "" : "s") + "."
        : "You're all caught up.";
      markAllButton.disabled = unread === 0;
    }

    function markRead(ids) {
      readIds = Array.from(new Set(readIds.concat(ids)));
      writeStore(READ_KEY, readIds); // TODO: persist on the server
      render();
      document.dispatchEvent(new CustomEvent("astra:notifications-read")); // header bell listens
    }

    document.addEventListener("click", function (event) {
      const single = event.target.closest("[data-mark-read]");

      if (single) {
        markRead([single.closest("[data-notification-id]").dataset.notificationId]);
      } else if (event.target.closest("[data-mark-all-read]")) {
        markRead(items.map(function (item) {
          return item.dataset.notificationId;
        }));
      }
    });

    render();
  }


  function initAccountPage() {
    const page = document.querySelector("[data-account-page]");

    if (!page || (AstraAuth.isPrivate() && !AstraAuth.isLoggedIn())) {
      return;
    }

    const initializers = {
      settings: initSettings,
      "reset-password": initResetPassword,
      "public-profile": initUserPages,
      solved: initSolved,
      notifications: initNotifications,
    };

    const init = initializers[page.dataset.accountPage];

    if (init) {
      init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccountPage);
  } else {
    initAccountPage();
  }
})();
