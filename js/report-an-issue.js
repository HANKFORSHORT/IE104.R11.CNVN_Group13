/* =========================================================
   REPORT AN ISSUE PAGE SCRIPTS (js/report-an-issue.js)
   ========================================================= */

(function () {
  "use strict";


  const REQUIRED_FIELDS = ["fname", "lname", "email", "message"];


  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }


  function initReportForm() {
    const form = document.getElementById("reportForm");
    const banner = document.getElementById("successBanner");

    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let isFormValid = true;

      clearAllErrors();

      REQUIRED_FIELDS.forEach(function (fieldId) {
        const input = document.getElementById(fieldId);
        const wrapper = document.getElementById("wrap-" + fieldId);

        if (!input || !wrapper) {
          return;
        }

        const value = input.value.trim();

        if (!value) {
          wrapper.classList.add("has-error");
          isFormValid = false;
          return;
        }

        if (fieldId === "email" && !isValidEmail(value)) {
          wrapper.classList.add("has-error");
          isFormValid = false;
        }
      });

      if (isFormValid) {
        form.reset();

        if (banner) {
          banner.classList.add("show");

          setTimeout(function () {
            banner.classList.remove("show");
          }, 5000);
        }
      }
    });

    bindLiveInputCleanup(form);
  }


  function clearAllErrors() {
    REQUIRED_FIELDS.forEach(function (fieldId) {
      const wrapper = document.getElementById("wrap-" + fieldId);

      if (wrapper) {
        wrapper.classList.remove("has-error");
      }
    });
  }


  function bindLiveInputCleanup(form) {
    const controls = form.querySelectorAll(".form-control");

    controls.forEach(function (control) {
      control.addEventListener("input", function () {
        const wrapper = document.getElementById("wrap-" + control.id);

        if (wrapper) {
          wrapper.classList.remove("has-error");
        }
      });
    });
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReportForm);
  } else {
    initReportForm();
  }
})();
