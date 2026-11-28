(function () {
  "use strict";

  const PAGE_SIZE = 20;
  const apiBase = window.CONFIG.API_BASE_URL;
  const requestTimeout = window.CONFIG.REQUEST_TIMEOUT || 60000;
  const isLocal = new URLSearchParams(location.search).get("local") === "1";

  const tbody = document.getElementById("problems-tbody");
  const statusEl = document.getElementById("problems-status");
  const countEl = document.getElementById("problems-count");
  const filterForm = document.getElementById("problems-filter-form");
  const searchInput = document.getElementById("filter-search");
  const topicSelect = document.getElementById("filter-topic");
  const minRatingInput = document.getElementById("filter-min-rating");
  const maxRatingInput = document.getElementById("filter-max-rating");
  const prevBtn = document.getElementById("btn-prev-page");
  const nextBtn = document.getElementById("btn-next-page");

  let allProblems = [];
  let filteredProblems = [];
  let currentPage = 1;

  function makeEl(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined && text !== null) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function normalizeTopics(rawTopics) {
    if (Array.isArray(rawTopics)) return rawTopics;
    if (typeof rawTopics === "string") {
      try {
        const parsed = JSON.parse(rawTopics);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function buildDetailUrl(slug) {
    const params = new URLSearchParams();
    params.set("slug", slug);
    if (isLocal) params.set("local", "1");
    return "problem-detail.html?" + params.toString();
  }

  function getDifficultyBadge(difficulty) {
    const num = Number(difficulty);
    if (Number.isFinite(num)) {
      const cls = num < 1400 ? "pill-easy" : num <= 2000 ? "pill-medium" : "pill-hard";
      return makeEl("span", String(num), "pill " + cls);
    }
    const label = String(difficulty || "—");
    const lower = label.toLowerCase();
    const cls = lower === "easy" ? "pill-easy" : lower === "hard" ? "pill-hard" : "pill-medium";
    return makeEl("span", label, "pill " + cls);
  }

  function populateTopicDropdown(problems) {
    const topicMap = new Map();
    problems.forEach(function (prob) {
      prob.topics.forEach(function (t) {
        if (t && t.slug && !topicMap.has(t.slug)) {
          topicMap.set(t.slug, t.name || t.slug);
        }
      });
    });

    topicSelect.replaceChildren(makeEl("option", "All topics", ""));
    topicSelect.firstChild.value = "";

    Array.from(topicMap.entries())
      .sort(function (a, b) { return a[1].localeCompare(b[1]); })
      .forEach(function (entry) {
        const opt = makeEl("option", entry[1]);
        opt.value = entry[0];
        topicSelect.appendChild(opt);
      });
  }

  function renderTable() {
    tbody.replaceChildren();
    const total = filteredProblems.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredProblems.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      const tr = document.createElement("tr");
      const td = makeEl("td", "No problems match your filters.");
      td.colSpan = 5;
      td.style.textAlign = "center";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      pageItems.forEach(function (prob) {
        const tr = document.createElement("tr");

        tr.appendChild(makeEl("td", prob.number));

        const nameTd = document.createElement("td");
        const link = makeEl("a", prob.name, "problem-link");
        link.href = buildDetailUrl(prob.slug);
        nameTd.appendChild(link);
        tr.appendChild(nameTd);

        const topicsTd = document.createElement("td");
        prob.topics.forEach(function (t) {
          topicsTd.appendChild(makeEl("span", t.name, "tag"));
        });
        tr.appendChild(topicsTd);

        const diffTd = document.createElement("td");
        diffTd.appendChild(getDifficultyBadge(prob.difficulty));
        tr.appendChild(diffTd);

        const rate = Number(prob.solve_rate);
        tr.appendChild(makeEl("td", (Number.isFinite(rate) ? rate.toFixed(1) : "0.0") + "%"));

        tbody.appendChild(tr);
      });
    }

    const from = total === 0 ? 0 : start + 1;
    const to = Math.min(start + PAGE_SIZE, total);
    countEl.textContent = "Showing " + from + "–" + to + " of " + total + " problems";
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const selectedTopic = topicSelect.value;
    const minRating = minRatingInput.value !== "" ? Number(minRatingInput.value) : null;
    const maxRating = maxRatingInput.value !== "" ? Number(maxRatingInput.value) : null;

    filteredProblems = allProblems.filter(function (prob) {
      if (keyword) {
        const matchName = String(prob.name || "").toLowerCase().includes(keyword);
        const matchNumber = String(prob.number || "").toLowerCase().includes(keyword);
        const matchSlug = String(prob.slug || "").toLowerCase().includes(keyword);
        if (!matchName && !matchNumber && !matchSlug) return false;
      }

      if (selectedTopic) {
        const hasTopic = prob.topics.some(function (t) { return t.slug === selectedTopic; });
        if (!hasTopic) return false;
      }

      const rating = Number(prob.difficulty);
      if (minRating !== null && Number.isFinite(rating) && rating < minRating) return false;
      if (maxRating !== null && Number.isFinite(rating) && rating > maxRating) return false;

      return true;
    });

    currentPage = 1;
    renderTable();
  }

  filterForm.addEventListener("submit", function (e) {
    e.preventDefault();
    applyFilters();
  });

  prevBtn.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  nextBtn.addEventListener("click", function () {
    const totalPages = Math.ceil(filteredProblems.length / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  async function loadProblems() {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, requestTimeout);
    statusEl.textContent = "Loading problems...";
    statusEl.style.color = "";

    try {
      const response = await fetch(apiBase + "/api/problems", {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "HTTP " + response.status);
      }

      allProblems = (result.data || []).map(function (item) {
        return {
          ...item,
          number: item.number ?? item.problem_id ?? item.slug,
          name: item.name ?? item.title ?? item.slug,
          difficulty: item.difficulty_rating ?? item.difficulty,
          topics: normalizeTopics(item.topics)
        };
      });

      populateTopicDropdown(allProblems);
      filteredProblems = allProblems.slice();
      renderTable();
      statusEl.textContent = "";
    } catch (error) {
      statusEl.style.color = "var(--danger, crimson)";
      statusEl.textContent = error.name === "AbortError"
        ? "Request timed out. Server might be waking up, please refresh."
        : "Failed to load problems: " + error.message;
      console.error("Load problems error:", error);
    } finally {
      clearTimeout(timer);
    }
  }

  loadProblems();
})();
