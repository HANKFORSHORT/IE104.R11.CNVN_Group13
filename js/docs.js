/* =========================================================
   DOCUMENTATION PAGE SCRIPTS (js/docs.js)
   ========================================================= */

(function () {
  "use strict";


  function initDocsPage() {
    const navButtons = document.querySelectorAll("[data-doc-target]");
    const panels = document.querySelectorAll("[data-doc-panel]");

    if (!navButtons.length || !panels.length) {
      return;
    }

    function activateSection(sectionId, shouldScrollTop) {
      let matched = false;

      panels.forEach(function (panel) {
        const isMatch = panel.getAttribute("data-doc-panel") === sectionId;
        panel.hidden = !isMatch;

        if (isMatch) {
          matched = true;
        }
      });

      if (!matched) {
        return;
      }

      navButtons.forEach(function (btn) {
        const isBtnMatch = btn.getAttribute("data-doc-target") === sectionId;

        if (btn.classList.contains("docs-nav-btn") || btn.classList.contains("docs-nav-overview")) {
          btn.classList.toggle("active", isBtnMatch);
          btn.setAttribute("aria-current", isBtnMatch ? "true" : "false");
        }
      });

      if (shouldScrollTop !== false) {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    }

    navButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const targetId = button.getAttribute("data-doc-target");

        if (targetId) {
          activateSection(targetId, true);
          history.replaceState(null, "", "#" + targetId);
        }
      });
    });

    const initialHash = window.location.hash.replace("#", "");

    if (initialHash) {
      const panelPrefix = initialHash.split("-")[0];
      activateSection(panelPrefix, false);
    }
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDocsPage);
  } else {
    initDocsPage();
  }
})();
