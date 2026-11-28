/* =========================================================
   AUTH PAGES SCRIPTS (js/auth.js)
   Used by login.html, register.html and forgot-password.html.
   Each <form> declares its kind with data-auth-form:
   "login" | "register" | "forgot" | "reset".

   Theme switching is already handled by main.js.
   ========================================================= */

(function () {
  "use strict";


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

  function validateEmail(value) {
    if (!value.trim()) {
      return "Enter your email address.";
    }

    return AstraUI.isValidEmail(value.trim()) ? "" : "Enter a valid email address, like name@example.com.";
  }

  const RULES = {
    forgot: {
      email: validateEmail,
    },
    reset: {
      password: AstraUI.passwordRule,
      confirm: AstraUI.confirmRule,
    },

    login: {
      email: validateEmail,
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

        return AstraUI.isValidUsername(value.trim())
          ? ""
          : "Use 3–40 letters, numbers, underscores or hyphens.";
      },
      password: AstraUI.passwordRule,
      confirm: AstraUI.confirmRule,
      country: function (value) {
        return value ? "" : "Select your country or region.";
      },
    },
  };


  /* ---------------------------------------------------------
     Field errors (.has-error on the .auth-field wrapper)
     --------------------------------------------------------- */

  function validateField(input, form, kind) {
    const message = RULES[kind][input.name](input.value, form);

    AstraUI.setAuthFieldError(input, message);

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


  function destination() {
    const params = new URLSearchParams(location.search);
    return AstraAuth.safeNext(params.get("returnTo") || params.get("next") || "profile.html");
  }

  async function handleValidSubmit(kind, form) {
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (kind === "forgot") {
        await AstraAPI.request("/api/v1/auth/forgot-password", {
          method: "POST", body: { email: form.elements.email.value.trim() }
        });
        showBanner("If an account exists for that email, a reset link is on its way.");
        return;
      }
      if (kind === "reset") {
        const token = new URLSearchParams(location.search).get("token");
        if (!token) { showBanner("This reset link is missing its token."); return; }
        await AstraAPI.request("/api/v1/auth/reset-password", {
          method: "POST", body: { token, newPassword: form.elements.password.value }
        });
        location.href = "login.html?reset=1";
        return;
      }
      if (kind === "login") {
        await AstraAPI.request("/api/v1/auth/login", {
          method: "POST",
          body: {
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
          }
        });
      } else {
        await AstraAPI.request("/api/v1/auth/register", {
          method: "POST",
          body: {
            username: form.elements.username.value.trim(),
            email: form.elements.email.value.trim(),
            password: form.elements.password.value,
            country: form.elements.country.value,
            emailNotifications: form.elements.marketing.checked
          }
        });
      }
      await AstraAuth.refresh();
      if (!AstraAuth.isLoggedIn()) {
        showBanner("Sign-in succeeded, but the browser did not keep the session cookie. Allow cookies for this site and try again.");
        return;
      }
      const params = new URLSearchParams(location.search);
      if (kind === "login" && params.get("auth_error") === "ACCOUNT_LINK_REQUIRED" &&
          params.get("provider") === "facebook") {
        location.href = AstraAPI.oauthUrl("facebook", destination(), true);
      } else {
        location.href = destination();
      }
    } catch (error) {
      const field = {
        EMAIL_TAKEN: "email", INVALID_EMAIL: "email",
        USERNAME_TAKEN: "username", INVALID_USERNAME: "username",
        INVALID_PASSWORD: "password", INVALID_CREDENTIALS: "password"
      }[error.code];
      if (field && form.elements[field]) {
        AstraUI.setAuthFieldError(form.elements[field], error.message);
        form.elements[field].focus();
      } else showBanner(error.message);
    } finally {
      submit.disabled = false;
    }
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
        if (["register", "reset"].includes(kind) && input.name === "password" && form.elements.confirm.value) {
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

    const params = new URLSearchParams(location.search);
    if (params.get("auth_error") === "ACCOUNT_LINK_REQUIRED") {
      showBanner("This Facebook email matches an Astra account. Sign in with your Astra email and password to link Facebook.");
    } else if (params.has("auth_error")) {
      showBanner("Social sign-in could not be completed. Please try again.");
    }

    document.querySelectorAll("[data-auth-provider]").forEach(function (link) {
      link.href = AstraAPI.oauthUrl(link.dataset.authProvider, destination());
    });

    document.addEventListener("click", function (event) {
      const toggle = event.target.closest("[data-toggle-password]");

      if (toggle) {
        togglePassword(toggle);
      }
    });
  }


  AstraUI.ready.then(initAuthPage);
})();
