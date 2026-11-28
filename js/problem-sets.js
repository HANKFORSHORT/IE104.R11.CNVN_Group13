(function () {
  "use strict";

  // Set membership is curated here; problem content always comes from /api/problems.
  // Replace these definitions with contest/training endpoints when they are available.
  const easy = ["a-plus-b", "lc-20-valid-parentheses", "lc-21-merge-two-sorted-lists", "lc-26-remove-duplicates-from-sorted-array", "lc-27-remove-element", "lc-28-find-first-occurrence"];
  const linkedLists = ["lc-21-merge-two-sorted-lists", "lc-24-swap-nodes-in-pairs", "lc-23-merge-k-sorted-lists", "lc-25-reverse-nodes-in-k-group"];
  const strings = ["lc-20-valid-parentheses", "lc-28-find-first-occurrence", "lc-22-generate-parentheses", "lc-30-substring-concatenation-all-words"];
  const round118 = ["a-plus-b", "lc-20-valid-parentheses", "lc-21-merge-two-sorted-lists", "lc-24-swap-nodes-in-pairs", "lc-22-generate-parentheses", "lc-23-merge-k-sorted-lists"];
  const round117 = ["lc-27-remove-element", "lc-26-remove-duplicates-from-sorted-array", "lc-28-find-first-occurrence", "lc-29-divide-two-integers", "lc-30-substring-concatenation-all-words", "lc-25-reverse-nodes-in-k-group"];

  const gyms = [
    { id: "regional-camp", title: "ICPC Regional Training Camp Vol. 3", duration: 300, level: "advanced", author: "NHQ0914", slugs: null },
    { id: "div2-warmup", title: "Div. 2 Warm-Up Mashup", duration: 120, level: "beginner", author: "Sherwin", slugs: easy },
    { id: "linked-lists", title: "Linked Lists Deep Dive", duration: 210, level: "advanced", author: "Cerq", slugs: linkedLists },
    { id: "beginner-bootcamp", title: "Beginner Bootcamp Week 1", duration: 240, level: "beginner", author: "harryleee", slugs: easy.slice().reverse() },
    { id: "math-sprint", title: "Math & Bit Manipulation Sprint", duration: 150, level: "intermediate", author: "tuongll", slugs: ["a-plus-b", "lc-29-divide-two-integers"] },
    { id: "strings-marathon", title: "Strings & Parentheses Marathon", duration: 270, level: "intermediate", author: "lenhanbo", slugs: strings }
  ];

  const contests = [
    { id: "round-118", title: "Astra Round 118 (Div. 1 + Div. 2)", duration: 120, startsAt: "2026-10-17T21:35:00+07:00", slugs: round118 },
    { id: "round-117", title: "Astra Round 117 (Div. 2)", duration: 120, startsAt: "2026-09-14T21:35:00+07:00", slugs: round117 },
    { id: "round-116", title: "Astra Round 116 (Div. 1)", duration: 180, startsAt: "2026-09-12T21:35:00+07:00", slugs: ["lc-24-swap-nodes-in-pairs", "lc-22-generate-parentheses", "lc-29-divide-two-integers", "lc-23-merge-k-sorted-lists", "lc-25-reverse-nodes-in-k-group", "lc-30-substring-concatenation-all-words"] },
    { id: "educational-94", title: "Educational Round 94", duration: 120, startsAt: "2026-09-08T21:35:00+07:00", rated: false, slugs: easy.concat(["lc-24-swap-nodes-in-pairs", "lc-22-generate-parentheses"]) },
    { id: "round-115", title: "Astra Round 115 (Div. 3)", duration: 135, startsAt: "2026-09-05T21:35:00+07:00", slugs: easy },
    { id: "round-114", title: "Astra Round 114 (Div. 2)", duration: 120, startsAt: "2026-08-29T21:35:00+07:00", rated: false, slugs: round117 },
    { id: "round-113", title: "Astra Round 113 (Div. 2)", duration: 120, startsAt: "2026-08-17T21:35:00+07:00", slugs: round118 }
  ];

  const params = new URLSearchParams(location.search);
  let catalogPromise;

  function getSet(kind, id) {
    const sets = kind === "gym" ? gyms : contests;
    return id ? sets.find(function (set) { return set.id === id; }) : sets[0];
  }

  function setUrl(page, kind, id, extra) {
    const query = new URLSearchParams(extra);
    query.set(kind, id);
    if (params.get("local") === "1") query.set("local", "1");
    return page + "?" + query.toString();
  }

  function problemUrl(problem, section) {
    const query = new URLSearchParams({ slug: problem.slug });
    if (params.get("local") === "1") query.set("local", "1");
    return "problem-detail.html?" + query.toString() + (section ? "#" + section : "");
  }

  function makeElement(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined && text !== null) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function normalizeProblem(item) {
    const rating = item.difficulty_rating ?? item.difficulty;
    const numeric = rating !== null && rating !== undefined && rating !== "" && Number.isFinite(Number(rating));
    const named = String(item.difficulty || "").toLowerCase();
    const level = numeric ? Number(rating) < 1400 ? "easy" : Number(rating) <= 2000 ? "medium" : "hard" :
      ["easy", "medium", "hard"].includes(named) ? named : "unknown";
    let topics = item.topics ?? item.tags ?? [];
    if (typeof topics === "string") {
      try { topics = JSON.parse(topics); } catch (error) { topics = []; }
    }
    return {
      slug: item.slug,
      title: item.title || item.name || item.slug,
      level,
      difficulty: numeric ? String(rating) : named ? named[0].toUpperCase() + named.slice(1) : "—",
      topics: Array.isArray(topics) ? topics.filter(Boolean).map(function (topic) {
        return typeof topic === "string" ? topic : topic.name || topic.slug || "";
      }).filter(Boolean) : []
    };
  }

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    catalogPromise = (async function () {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, CONFIG.REQUEST_TIMEOUT || 60000);
      try {
        const response = await fetch(CONFIG.API_BASE_URL + "/api/problems", {
          headers: { Accept: "application/json" }, signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Could not load the problem catalog.");
        }
        return result.data.filter(function (item) {
          return item && typeof item.slug === "string" && item.slug;
        }).map(normalizeProblem);
      } finally {
        clearTimeout(timer);
      }
    })();
    return catalogPromise;
  }

  function selectProblems(set, catalog) {
    if (!set.slugs) return catalog.slice();
    const bySlug = new Map(catalog.map(function (problem) { return [problem.slug, problem]; }));
    return set.slugs.map(function (slug) { return bySlug.get(slug); }).filter(Boolean);
  }

  async function loadSet(kind, id) {
    const set = getSet(kind, id);
    if (!set) throw new Error(kind === "gym" ? "Training set not found." : "Contest not found.");
    const catalog = await loadCatalog();
    const problems = selectProblems(set, catalog);
    const missing = set.slugs ? set.slugs.length - problems.length : 0;
    return { set, problems, missing };
  }

  function errorMessage(error) {
    return error.name === "AbortError" ? "Loading timed out. Please refresh to try again." :
      "Unable to load problems. " + error.message;
  }

  function durationLabel(minutes) {
    return Math.floor(minutes / 60) + ":" + String(minutes % 60).padStart(2, "0") + ":00";
  }

  function difficultyBadge(problem) {
    return makeElement("span", problem.difficulty, "pill" + (problem.level === "unknown" ? "" : " pill-" + problem.level));
  }

  function renderRows(tbody, problems) {
    tbody.replaceChildren();
    problems.forEach(function (problem, index) {
      const row = document.createElement("tr");
      row.appendChild(makeElement("td", String.fromCharCode(65 + index), "rank-cell"));
      const name = document.createElement("td");
      const link = makeElement("a", problem.title, "problem-link");
      link.href = problemUrl(problem);
      name.appendChild(link);
      const difficulty = document.createElement("td");
      difficulty.appendChild(difficultyBadge(problem));
      const topics = document.createElement("td");
      problem.topics.forEach(function (topic) { topics.appendChild(makeElement("span", topic, "tag")); });
      if (!problem.topics.length) topics.textContent = "—";
      row.append(name, difficulty, topics);
      tbody.appendChild(row);
    });
    if (!problems.length) {
      const cell = makeElement("td", "No problems are available in this set yet.");
      cell.colSpan = 4;
      const row = document.createElement("tr");
      row.appendChild(cell);
      tbody.appendChild(row);
    }
  }

  function setText(name, text) {
    document.querySelectorAll('[data-set-field="' + name + '"]').forEach(function (element) {
      element.textContent = text;
    });
  }

  async function initDetail(main) {
    const kind = main.dataset.problemSet;
    const id = params.get(kind);
    const status = document.getElementById("set-problems-status");
    const tbody = document.getElementById("set-problems");
    const set = getSet(kind, id);
    if (set) {
      document.title = set.title + " · Astra";
      setText("title", set.title);
      setText("duration", durationLabel(set.duration));
      setText("author", set.author || "Astra");
      setText("count", "—");
      if (kind === "contest") {
        const date = new Date(set.startsAt).toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" });
        setText("start", "Starts " + date + " ICT");
        setText("rating-policy", set.rated === false ? "Unrated round" : "Rated round");
      }
    }
    status.textContent = "Loading problems…";
    try {
      const result = await loadSet(kind, id);
      renderRows(tbody, result.problems);
      setText("count", result.problems.length);
      const levels = ["easy", "medium", "hard"].filter(function (level) {
        return result.problems.some(function (problem) { return problem.level === level; });
      });
      setText("difficulty", levels.map(function (level) { return level[0].toUpperCase() + level.slice(1); }).join(" / ") || "—");
      const workspaceUrl = setUrl("workspace.html", kind, result.set.id);
      document.querySelectorAll("[data-workspace-link]").forEach(function (link) {
        link.href = workspaceUrl;
        link.hidden = !result.problems.length;
      });
      const startButton = document.querySelector("[data-start-url]");
      if (startButton) {
        startButton.dataset.url = setUrl("workspace.html", kind, result.set.id, { start: "1" });
        startButton.disabled = !result.problems.length;
      }
      status.textContent = result.missing ? result.missing + " assigned problem(s) are currently unavailable." :
        result.problems.length ? "" : "No problems are available in this set yet.";
    } catch (error) {
      status.textContent = errorMessage(error);
      setText("count", "0");
      tbody.replaceChildren();
    }
  }

  async function initGymList() {
    const list = document.getElementById("trainingList");
    if (!list) return;
    const status = document.getElementById("gym-status");
    status.textContent = "Loading training sets…";
    try {
      const catalog = await loadCatalog();
      gyms.forEach(function (set) {
        const card = makeElement("div", null, "card");
        card.dataset.difficulty = set.level;
        card.dataset.duration = set.duration;
        card.appendChild(makeElement("h3", set.title));
        card.appendChild(makeElement("p", selectProblems(set, catalog).length + " problems · " + durationLabel(set.duration)));
        card.appendChild(makeElement("p", "Prepared by " + set.author));
        const link = makeElement("a", "View training", "btn btn-secondary btn-sm");
        link.href = setUrl("gym-detail.html", "gym", set.id);
        card.appendChild(link);
        list.insertBefore(card, list.querySelector("[data-filter-empty]"));
      });
      status.textContent = "";
      document.querySelector("[data-filter-apply]").click();
    } catch (error) {
      status.textContent = errorMessage(error);
      list.querySelector("[data-filter-empty]").hidden = true;
    }
  }

  window.AstraProblemSets = Object.freeze({
    getSet, loadSet, setUrl, problemUrl, makeElement, difficultyBadge, durationLabel, errorMessage
  });

  document.querySelectorAll("a[data-contest-id]").forEach(function (link) {
    link.href = setUrl("contest.html", "contest", link.dataset.contestId);
  });
  if (params.get("local") === "1") {
    document.querySelectorAll('main a[href="gym.html"], main a[href="contests.html"]').forEach(function (link) {
      link.href += "?local=1";
    });
  }
  const detail = document.querySelector("[data-problem-set]");
  if (detail) initDetail(detail);
  initGymList();
})();
