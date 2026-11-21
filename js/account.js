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

  const ACCOUNT_KEY = "astra-account";
  const READ_KEY = "astra-notifications-read";

  // TODO: replace with the signed-in user once login talks to a backend.
  const CURRENT_USER = "oppixelnew246";

  // TODO: sample data that matches rankings.html / profile.js. Replace with API calls.
  const USERS = {
    oppixelnew246: { name: "", location: "", rating: 0, rank: 47158, solved: 0 },
    minhtriet: { name: "Nguyen Minh Triet", location: "Vietnam", rating: 2984, rank: 1, solved: 212 },
    khangdev: { name: "Tran Gia Khang", location: "Vietnam", rating: 2741, rank: 2, solved: 205 },
    lemontea: { name: "Le Hoang Anh", location: "Vietnam", rating: 2608, rank: 3, solved: 198 },
    quangdo: { name: "", location: "Da Nang, Vietnam", rating: 2487, rank: 4, solved: 186 },
    huyanh: { name: "", location: "Hanoi, Vietnam", rating: 2392, rank: 5, solved: 174 },
    nami_t: { name: "", location: "Ho Chi Minh City, Vietnam", rating: 2315, rank: 6, solved: 168 },
    baolong: { name: "", location: "Can Tho, Vietnam", rating: 2264, rank: 7, solved: 159 },
    mkhanh: { name: "", location: "Hai Phong, Vietnam", rating: 2187, rank: 8, solved: 151 },
  };

  // TODO: sample problems that match problems.html. A real user's list comes from the API.
  const SAMPLE_SOLVED = [
    { id: "2264A", name: "Rumb Needs a Hand", topics: ["implementation", "two pointers"], rating: 900, level: "easy" },
    { id: "2264B", name: "Knife's Pill Farm", topics: ["data structures", "greedy"], rating: 1300, level: "easy" },
    { id: "2264C", name: "Madamant's Skating Dynasty", topics: ["combinatorics", "sortings"], rating: 1600, level: "medium" },
    { id: "2264D", name: "Dr. Agos's Dark Mode", topics: ["brute force", "strings"], rating: 1400, level: "medium" },
    { id: "2264E1", name: "A Prime Flood (Easy Version)", topics: ["combinatorics", "dp"], rating: 2100, level: "hard" },
    { id: "2264F", name: "Deranged Calculator", topics: ["math", "constructive"], rating: 1900, level: "medium" },
  ];


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

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

  function passwordRule(value) {
    if (!value) {
      return "Enter a password.";
    }

    const isStrongEnough = value.length >= 8 && /\d/.test(value) && /[a-z]/.test(value);

    return isStrongEnough ? "" : "Use at least 8 characters, including a number and a lowercase letter.";
  }

  function confirmRule(value, form) {
    if (!value) {
      return "Re-type your password.";
    }

    return value === form.elements.password.value ? "" : "Passwords don't match.";
  }

  function requestedUser() {
    const handle = new URLSearchParams(window.location.search).get("user") || CURRENT_USER;
    const key = Object.keys(USERS).find(function (name) {
      return name.toLowerCase() === handle.toLowerCase();
    });

    return key ? { handle: key, data: USERS[key] } : null;
  }


  /* ---------------------------------------------------------
     settings.html
     --------------------------------------------------------- */

  function initSettings() {
    const profileForm = document.getElementById("profile-form");
    const passwordForm = document.getElementById("password-form");
    const preferencesForm = document.getElementById("preferences-form");
    const saved = readStore(ACCOUNT_KEY, {});

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

          return isValidEmail(value.trim()) ? "" : "Enter a valid email address, like name@example.com.";
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
        password: passwordRule,
        confirm: confirmRule,
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

      if (!validateForm(form, { password: passwordRule, confirm: confirmRule })) {
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

    const fields = {
      handle: user.handle,
      name: user.data.name,
      location: user.data.location,
      rating: user.data.rating.toLocaleString("en-US"),
      rank: "#" + user.data.rank.toLocaleString("en-US"),
      solved: user.data.solved,
      initials: user.handle.slice(0, 2),
      subtitle: [user.data.name, user.data.location].filter(Boolean).join(" · ") || "Astra competitor",
    };

    document.querySelectorAll("[data-user-field]").forEach(function (element) {
      element.textContent = fields[element.dataset.userField];
    });

    // Links to other per-user pages keep the same ?user=
    document.querySelectorAll("[data-user-link]").forEach(function (link) {
      link.href = link.getAttribute("href").split("?")[0] + "?user=" + encodeURIComponent(user.handle);
    });

    document.title = user.handle + " · Astra";
    profile.hidden = false;

    if (document.body.querySelector("[data-account-page='solved']")) {
      renderSolved(user.data.solved);
    }
  }

  function renderSolved(solvedCount) {
    const list = document.getElementById("solved-list");
    const shown = SAMPLE_SOLVED.slice(0, solvedCount);

    shown.forEach(function (problem) {
      const row = document.createElement("tr");
      const idCell = document.createElement("td");
      const nameCell = document.createElement("td");
      const topicsCell = document.createElement("td");
      const levelCell = document.createElement("td");
      const link = document.createElement("a");
      const pill = document.createElement("span");

      idCell.textContent = problem.id;

      link.className = "problem-link";
      link.href = "problem-detail.html";
      link.textContent = problem.name;
      nameCell.appendChild(link);

      problem.topics.forEach(function (topic) {
        const tag = document.createElement("span");

        tag.className = "tag";
        tag.textContent = topic;
        topicsCell.appendChild(tag);
      });

      pill.className = "pill pill-" + problem.level;
      pill.textContent = problem.rating;
      levelCell.appendChild(pill);

      [idCell, nameCell, topicsCell, levelCell].forEach(function (cell) {
        row.appendChild(cell);
      });
      list.appendChild(row);
    });

    document.querySelector("[data-solved-empty]").hidden = shown.length > 0;
    document.querySelector("[data-solved-table]").hidden = shown.length === 0;
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

    if (!page) {
      return;
    }

    const initializers = {
      settings: initSettings,
      "reset-password": initResetPassword,
      "public-profile": initUserPages,
      solved: initUserPages,
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
