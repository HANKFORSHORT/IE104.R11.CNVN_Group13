/* =========================================================
   CONTACT PAGE SCRIPTS (js/contact.js)
   ========================================================= */

(function () {
  "use strict";


  function initContactPage() {
    const copyButtons = document.querySelectorAll("[data-copy-email]");

    if (!copyButtons.length) {
      return;
    }

    copyButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const email = button.getAttribute("data-copy-email");
        const originalText = button.textContent;

        if (!email) {
          return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            showCopiedState(button, originalText);
          });
        } else {
          showCopiedState(button, originalText);
        }
      });
    });
  }


  function showCopiedState(button, originalText) {
    button.textContent = "Copied!";
    button.classList.add("is-copied");

    setTimeout(function () {
      button.textContent = originalText;
      button.classList.remove("is-copied");
    }, 2000);
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactPage);
  } else {
    initContactPage();
  }
})();
