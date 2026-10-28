(function () {
  "use strict";

  const ROOT = new URL("../", document.currentScript.src);
  const THEME_KEY = "astra-theme";
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
    });
  }

  function savedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function toggleTheme() {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked */ }
    applyTheme(next);
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme() || (prefersDark ? "dark" : "light"));


  async function include(slot) {
    const url = new URL("components/" + slot.dataset.include + ".html", ROOT);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load " + url + " (" + res.status + ")");

    const text = (await res.text()).replace(
      /<!--\s*Code injected by live-server\s*-->\s*<script[\s\S]*?<\/script>/gi, ""
    );

    const tpl = document.createElement("template");
    tpl.innerHTML = text;
    tpl.content.querySelectorAll("[href], [src]").forEach((el) => {
      ["href", "src"].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) {
          el.setAttribute(attr, new URL(value, ROOT).href);
        }
      });
    });

    slot.replaceWith(tpl.content);
  }

  function markActiveLink() {
    const here = location.pathname.replace(/\/$/, "/index.html");
    document.querySelectorAll(".nav-links a").forEach((a) => {
      if (new URL(a.href).pathname === here) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await Promise.all([...document.querySelectorAll("[data-include]")].map(include));
    } catch (err) {
      console.error(err);
    }
    applyTheme(html.getAttribute("data-theme"));
    markActiveLink();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });

  function setMenu(open) {
    const links = document.querySelector(".nav-links");
    const burger = document.querySelector(".hamburger");
    if (!links || !burger) return;
    links.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".theme-toggle")) toggleTheme();
    else if (e.target.closest(".hamburger")) {
      setMenu(!document.querySelector(".nav-links").classList.contains("open"));
    } else if (e.target.closest(".nav-links a")) setMenu(false);
  });
})();
