/* =========================================================
   FAQ PAGE SCRIPTS (js/faq.js)
   ========================================================= */

(function () {
  "use strict";


  function initFaqAccordion() {
    const accordion = document.getElementById("faqAccordion");

    if (!accordion) {
      return;
    }

    accordion.addEventListener("click", function (event) {
      const trigger = event.target.closest(".faq-trigger");

      if (!trigger) {
        return;
      }

      const currentItem = trigger.closest(".faq-item");
      const isAlreadyOpen = currentItem.classList.contains("open");

      closeAllItems(accordion);

      if (!isAlreadyOpen) {
        currentItem.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  }


  function closeAllItems(accordion) {
    const openItems = accordion.querySelectorAll(".faq-item.open");

    openItems.forEach(function (item) {
      item.classList.remove("open");

      const button = item.querySelector(".faq-trigger");
      if (button) {
        button.setAttribute("aria-expanded", "false");
      }
    });
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFaqAccordion);
  } else {
    initFaqAccordion();
  }
})();
