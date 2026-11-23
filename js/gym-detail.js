
(function () {
  "use strict";

  // Same rule as USERNAME_PATTERN in auth.js
  const USERNAME_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

  const DIALOG_IDS = {
    "#start": "start-dialog",
    "#race": "race-dialog",
  };


  /* ---------------------------------------------------------
     Open / close
     --------------------------------------------------------- */

  function openFromHash() {
    const dialog = document.getElementById(DIALOG_IDS[window.location.hash]);

    if (!dialog || dialog.open) {
      return;
    }

    // Signed-out visitors are handled by main.js (data-requires-auth)
    if (document.documentElement.dataset.auth !== "in") {
      return;
    }

    dialog.showModal();

    const firstField = dialog.querySelector("input");

    if (firstField) {
      firstField.focus();
    }
  }


  // Remove the hash so pressing the same button again opens the popup again
  function clearHash() {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }


  function initDialog(dialog) {
    dialog.addEventListener("close", clearHash);

    // Click on the backdrop (the dialog element itself) closes it
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    dialog.querySelectorAll("[data-dialog-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        dialog.close();
      });
    });
  }


  /* ---------------------------------------------------------
     Race a friend form
     --------------------------------------------------------- */

  function validateHandle(value) {
    if (!value.trim()) {
      return "Enter your friend's username.";
    }

    return USERNAME_PATTERN.test(value.trim())
      ? ""
      : "Use only letters, numbers, and single hyphens. Don't start or end with a hyphen.";
  }


  function setFieldError(input, message) {
    const wrapper = input.closest(".auth-field");

    wrapper.querySelector(".auth-error").textContent = message;
    wrapper.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }


  function initRaceForm(form) {
    const input = form.elements.handle;
    const status = form.querySelector("[data-race-status]");

    input.addEventListener("input", function () {
      status.textContent = "";

      if (input.getAttribute("aria-invalid") === "true") {
        setFieldError(input, validateHandle(input.value));
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const message = validateHandle(input.value);

      setFieldError(input, message);

      if (message) {
        input.focus();
        return;
      }

      // TODO: call the invite API once the backend exists. Until then nothing
      // is sent, so say so instead of pretending the invite went out.
      status.textContent = "Invite for " + input.value.trim() + " is ready, but sending isn't connected to a server yet.";
    });
  }


  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */

  function initGymDetail() {
    document.querySelectorAll(".site-dialog").forEach(initDialog);

    const raceForm = document.querySelector("[data-race-form]");

    if (raceForm) {
      initRaceForm(raceForm);
    }

    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGymDetail);
  } else {
    initGymDetail();
  }
})();