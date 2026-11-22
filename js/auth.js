/* =========================================================
   AUTH PAGES SCRIPTS (js/auth.js)
   Used by login.html, register.html and forgot-password.html.
   Each <form> declares its kind with data-auth-form:
   "login" | "register" | "forgot".

   Theme switching is already handled by main.js.
   ========================================================= */

(function () {
  "use strict";


  const USERNAME_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

  // TODO: temporary test account so the logged-in header can be tried without a backend.
  const TEMP_ACCOUNT = { username: "123", password: "123" };

  const COUNTRY_CODES = (
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
    "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
    "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
    "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
    "UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW"
  ).split(" ");


  /* ---------------------------------------------------------
     Validation rules
     Each rule returns "" when valid, or the error message.
     Keys are the inputs' name attributes.
     --------------------------------------------------------- */

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateEmail(value) {
    if (!value.trim()) {
      return "Enter your email address.";
    }

    return isValidEmail(value.trim()) ? "" : "Enter a valid email address, like name@example.com.";
  }

  const RULES = {
    forgot: {
      email: validateEmail,
    },

    login: {
      identifier: function (value) {
        return value.trim() ? "" : "Enter your username or email address.";
      },
      password: function (value) {
        return value ? "" : "Enter your password.";
      },
    },

    register: {
      email: validateEmail,
      username: function (value) {
        if (!value.trim()) {
          return "Choose a username.";
        }

        return USERNAME_PATTERN.test(value.trim())
          ? ""
          : "Use only letters, numbers, and single hyphens. Don't start or end with a hyphen.";
      },
      password: function (value) {
        if (!value) {
          return "Enter a password.";
        }

        const isStrongEnough = value.length >= 8 && /\d/.test(value) && /[a-z]/.test(value);

        return isStrongEnough ? "" : "Use at least 8 characters, including a number and a lowercase letter.";
      },
      confirm: function (value, form) {
        if (!value) {
          return "Re-type your password.";
        }

        return value === form.elements.password.value ? "" : "Passwords don't match.";
      },
      country: function (value) {
        return value ? "" : "Select your country or region.";
      },
    },
  };


  /* ---------------------------------------------------------
     Field errors (.has-error on the .auth-field wrapper)
     --------------------------------------------------------- */

  function setFieldError(input, message) {
    const wrapper = input.closest(".auth-field");
    const errorMessage = wrapper.querySelector(".auth-error");

    errorMessage.textContent = message;
    wrapper.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }


  function validateField(input, form, kind) {
    const message = RULES[kind][input.name](input.value, form);

    setFieldError(input, message);

    return !message;
  }


  /* ---------------------------------------------------------
     Banner (.auth-banner)
     --------------------------------------------------------- */

  function showBanner(message) {
    const banner = document.querySelector("[data-auth-banner]");

    if (!banner) {
      return;
    }

    banner.querySelector("span").textContent = message;
    banner.classList.add("show");
  }


  /* ---------------------------------------------------------
     Show / hide password
     --------------------------------------------------------- */

  function togglePassword(button) {
    const input = button.closest(".auth-password").querySelector("input");
    const shouldShow = input.type === "password";

    input.type = shouldShow ? "text" : "password";
    button.setAttribute("aria-pressed", String(shouldShow));
    button.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
  }


  /* ---------------------------------------------------------
     Country list (names come from the browser via Intl.DisplayNames)
     --------------------------------------------------------- */

  function populateCountries(select) {
    let displayNames = null;

    try {
      displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch (error) {
      // Older browser: fall back to the country codes
    }

    const countries = COUNTRY_CODES
      .map(function (code) {
        return { code: code, name: (displayNames && displayNames.of(code)) || code };
      })
      .filter(function (country) {
        return !displayNames || country.name !== country.code;
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name, "en");
      });

    countries.forEach(function (country) {
      const option = document.createElement("option");

      option.value = country.code;
      option.textContent = country.name;
      select.appendChild(option);
    });

    preselectCountry(select, countries);
  }


  function preselectCountry(select, countries) {
    try {
      const region = new Intl.Locale(navigator.language).region;

      if (region && countries.some(function (country) { return country.code === region; })) {
        select.value = region;
      }
    } catch (error) {
      // No region information: leave the placeholder selected
    }
  }


  /* ---------------------------------------------------------
     Submit
     TODO: replace the redirects below with real API calls once the
     backend exists. For now the forms only validate on the client.
     --------------------------------------------------------- */

  function handleValidSubmit(kind, form) {
    if (kind === "forgot") {
      // Same message whether or not the email exists
      showBanner("If an account exists for that email, we've sent a password reset link.");
      return;
    }

    if (kind === "login") {
      const identifier = form.elements.identifier.value.trim();

      // TODO: remove TEMP_ACCOUNT once login is checked by the backend.
      if (identifier !== TEMP_ACCOUNT.username || form.elements.password.value !== TEMP_ACCOUNT.password) {
        setFieldError(form.elements.password, "Incorrect username or password.");
        form.elements.password.focus();
        return;
      }

      if (!AstraAuth.setSession({ identifier: identifier })) {
        showBanner("Sign in could not be saved. Allow browser storage and try again.");
        return;
      }
    }

    let target = kind === "register" ? "login.html?registered=1" : "index.html";

    if (kind === "login") {
      const next = new URLSearchParams(window.location.search).get("next");
      target = AstraAuth.safeNext(next);
    }

    window.location.href = target;
  }


  function initAuthForm(form) {
    const kind = form.dataset.authForm;

    if (!RULES[kind]) {
      return;
    }

    const inputs = Array.from(form.elements).filter(function (element) {
      return RULES[kind][element.name];
    });

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value || input.getAttribute("aria-invalid") === "true") {
          validateField(input, form, kind);
        }
      });

      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
          validateField(input, form, kind);
        }

        // Changing the password re-checks the confirmation if it was filled in
        if (kind === "register" && input.name === "password" && form.elements.confirm.value) {
          validateField(form.elements.confirm, form, kind);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const invalidInputs = inputs.filter(function (input) {
        return !validateField(input, form, kind);
      });

      if (invalidInputs.length) {
        invalidInputs[0].focus();
        return;
      }

      handleValidSubmit(kind, form);
    });
  }


  function initAuthPage() {
    document.querySelectorAll("[data-auth-form]").forEach(initAuthForm);

    const countrySelect = document.querySelector("[data-country-select]");

    if (countrySelect) {
      populateCountries(countrySelect);
    }

    if (new URLSearchParams(window.location.search).get("registered") === "1") {
      showBanner("Account created. Sign in to continue.");
    }

    if (new URLSearchParams(window.location.search).get("reset") === "1") {
      showBanner("Password updated. Sign in with your new password.");
    }

    document.addEventListener("click", function (event) {
      const toggle = event.target.closest("[data-toggle-password]");

      if (toggle) {
        togglePassword(toggle);
      }
    });
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuthPage);
  } else {
    initAuthPage();
  }
})();
