(async function () {
  await AstraAuth.ready;
  "use strict";
  if (!AstraAuth.isLoggedIn()) return;

  const sets = AstraProblemSets;
  const params = new URLSearchParams(location.search);
  const kind = params.has("gym") ? "gym" : "contest";
  const set = sets.getSet(kind, params.get(kind));
  const $ = (id) => document.getElementById(id);
  const make = sets.makeElement;
  const REGISTERED_KEY = AstraAuth.userKey("astra-registered-contests");
  const owner = encodeURIComponent(AstraAuth.user().identifier);
  let problems = [];
  let attempted = 0;
  let saved = 0;

  function readStore(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (error) { return fallback; }
  }

  if (!set) {
    $("wsProblemsStatus").textContent = "This problem set was not found.";
    $("wsRegister").disabled = true;
    return;
  }

  const KEY = AstraAuth.userKey("astra." + kind + "." + set.id + ".workspace");
  const stored = readStore(KEY, {});
  let startedAt = Number.isFinite(stored?.startedAt) && stored.startedAt > 0 ? stored.startedAt : null;
  const duration = set.duration * 60000;
  const officialStart = Date.parse(set.startsAt);
  const preview = params.get("state");
  const offsets = {
    upcoming: officialStart - 3600e3 * 26 - Date.now(),
    running: officialStart + 47 * 60e3 - Date.now(),
    ended: officialStart + duration + 3600e3 - Date.now()
  };
  const offset = Object.hasOwn(offsets, preview) ? offsets[preview] : 0;

  function startRun() {
    startedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify({ startedAt }));
      $("wsPartMsg").textContent = "Practice timer started.";
    } catch (error) {
      $("wsPartMsg").textContent = "The timer started, but could not be saved for your next visit.";
    }
  }

  if (params.get("start") === "1" && kind === "gym") {
    startRun();
    params.delete("start");
    history.replaceState(null, "", location.pathname + "?" + params.toString() + location.hash);
  }

  function isRegistered() {
    const list = readStore(REGISTERED_KEY, []);
    return Array.isArray(list) && list.includes(set.id);
  }

  function phase() {
    if (kind === "gym" || startedAt) {
      if (!startedAt) return "ready";
      return Date.now() < startedAt + duration ? "running" : "ended";
    }
    const now = Date.now() + offset;
    return now < officialStart ? "upcoming" : now < officialStart + duration ? "running" : "ended";
  }

  function blocked() {
    const state = phase();
    return !problems.length || state === "ready" || state === "upcoming" ||
      (state === "running" && !startedAt && !isRegistered());
  }

  function formatTime(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
      .map(function (value) { return String(value).padStart(2, "0"); }).join(":");
  }

  function renderClock() {
    const state = phase();
    const start = startedAt || officialStart;
    const now = (startedAt || kind === "gym") ? Date.now() : Date.now() + offset;
    $("wsState").dataset.state = state === "ready" ? "upcoming" : state;
    $("wsState").textContent = { ready: "Ready to practice", upcoming: "Not started", running: "Running", ended: "Finished" }[state];
    $("wsClockLabel").textContent = state === "ready" ? "Duration" : state === "upcoming" ? "Starts in" : state === "running" ? "Time left" : "Session ended";
    $("wsClock").textContent = formatTime(state === "ready" ? duration : state === "upcoming" ? start - now : state === "running" ? start + duration - now : 0);
    const progress = state === "ended" ? 100 : state === "running" ? Math.min(100, Math.max(0, (now - start) / duration * 100)) : 0;
    $("wsBar").style.width = progress + "%";
  }

  function readSubmissions(problem) {
    const key = "astra.problem." + encodeURIComponent(problem.slug) + "." + owner + ".submissions";
    const stored = readStore(key, []);
    if (!Array.isArray(stored)) return [];
    return stored.filter(function (submission) {
      return submission && typeof submission.language === "string" && typeof submission.code === "string" &&
        Number.isFinite(submission.createdAt) && !Number.isNaN(new Date(submission.createdAt).getTime());
    }).slice(0, 20).map(function (submission) { return { ...submission, problem }; });
  }

  function openEditor(slug) {
    if (!AstraAuth.requireLogin() || blocked()) return;
    const problem = problems.find(function (item) { return item.slug === slug; });
    if (problem) location.href = sets.problemUrl(problem, "submit");
  }

  function renderProblems() {
    const selected = $("wsProblemSel").value;
    $("wsProblems").replaceChildren();
    $("wsProblemSel").replaceChildren();
    problems.forEach(function (problem, index) {
      const label = String.fromCharCode(65 + index);
      const row = document.createElement("tr");
      const name = document.createElement("td");
      const link = make("a", problem.title, "problem-link");
      link.href = sets.problemUrl(problem);
      name.appendChild(link);
      const difficulty = document.createElement("td");
      difficulty.appendChild(sets.difficultyBadge(problem));
      const status = make("td", readSubmissions(problem).length ? "Saved locally" : "Not attempted");
      const actions = document.createElement("td");
      const submit = make("button", "Submit", "btn btn-secondary btn-sm");
      submit.type = "button";
      submit.disabled = blocked();
      submit.addEventListener("click", function () { openEditor(problem.slug); });
      actions.appendChild(submit);
      row.append(make("td", label, "rank-cell"), name, difficulty, status, actions);
      $("wsProblems").appendChild(row);
      const option = make("option", label + ". " + problem.title);
      option.value = problem.slug;
      $("wsProblemSel").appendChild(option);
    });
    if (problems.some(function (problem) { return problem.slug === selected; })) $("wsProblemSel").value = selected;
    $("wsProblemCount").textContent = problems.length;
  }

  function renderSubmissions() {
    const rows = problems.flatMap(readSubmissions).sort(function (a, b) { return b.createdAt - a.createdAt; });
    attempted = new Set(rows.map(function (submission) { return submission.problem.slug; })).size;
    saved = rows.length;
    $("wsSubs").replaceChildren();
    rows.slice(0, 20).forEach(function (submission) {
      const row = document.createElement("tr");
      const action = document.createElement("td");
      const link = make("a", "View", "problem-link");
      link.href = sets.problemUrl(submission.problem, "submissions");
      action.appendChild(link);
      row.append(
        make("td", new Date(submission.createdAt).toLocaleString()),
        make("td", submission.problem.title), make("td", submission.language),
        make("td", "Saved locally · not judged"), action
      );
      $("wsSubs").appendChild(row);
    });
    if (!rows.length) {
      const row = document.createElement("tr");
      const cell = make("td", "No submissions yet. Open a problem's editor to save your solution.");
      cell.colSpan = 5;
      row.appendChild(cell);
      $("wsSubs").appendChild(row);
    }
    $("wsAttempted").textContent = attempted;
    $("wsSaved").textContent = saved;
  }

  function renderParticipation() {
    const state = phase();
    const practice = kind === "gym" || startedAt || state === "ended";
    $("wsPart").textContent = practice ? state === "ready" ? "Not started" : state === "running" ? "Virtual practice" : "Practice available" : isRegistered() ? "Registered" : "Not registered";
    const button = $("wsRegister");
    button.textContent = practice ? startedAt ? "Restart virtual run" : "Start virtual run" : isRegistered() ? "Cancel registration" : "Register for round";
    button.disabled = !problems.length || (!practice && state === "running");
    if (practice) {
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", "wsVirtualDialog");
    } else {
      button.removeAttribute("aria-haspopup");
      button.removeAttribute("aria-controls");
    }
    $("wsSubmit").disabled = blocked();
    $("wsProblemSel").disabled = blocked();
    $("wsMsg").textContent = !problems.length ? "Load this set's problems before opening the editor." :
      state === "ready" ? "Start a virtual run to open the submission editor." :
      state === "upcoming" ? "Submissions open when the round starts." :
      blocked() ? "Registration is closed for this round. Practice will open after it ends." :
      "Your solution opens in the same editor used by the problemset.";
  }

  function refresh() {
    renderProblems();
    renderSubmissions();
    renderParticipation();
    renderClock();
  }

  $("wsTitle").textContent = set.title;
  document.title = "Workspace · " + set.title + " · Astra";
  $("wsCollectionLink").textContent = kind === "gym" ? "Gym" : "Contests";
  $("wsCollectionLink").href = kind === "gym" ? "gym.html" : "contests.html";
  if (params.get("local") === "1") $("wsCollectionLink").href += "?local=1";
  $("wsSetLink").textContent = set.title;
  $("wsSetLink").href = sets.setUrl(kind === "gym" ? "gym-detail.html" : "contest.html", kind, set.id);
  $("wsForm").addEventListener("submit", function (event) {
    event.preventDefault();
    openEditor($("wsProblemSel").value);
  });
  $("wsRegister").addEventListener("click", function () {
    if (!AstraAuth.requireLogin()) return;
    if (kind === "gym" || startedAt || phase() === "ended") {
      $("wsVirtualTitle").textContent = startedAt ? "Restart virtual run?" : "Start virtual run?";
      $("wsVirtualDescription").textContent = (startedAt ? "Restart" : "Start") + " a " + sets.durationLabel(set.duration) + " practice session for " + set.title + ". Your saved code is kept.";
      AstraUI.openDialog($("wsVirtualDialog"), $("wsRegister"));
      return;
    }
    const stored = readStore(REGISTERED_KEY, []);
    const list = Array.isArray(stored) ? stored : [];
    try {
      localStorage.setItem(REGISTERED_KEY, JSON.stringify(isRegistered() ? list.filter(function (id) { return id !== set.id; }) : list.concat(set.id)));
      refresh();
    } catch (error) {
      $("wsPartMsg").textContent = "Registration could not be saved in this browser.";
    }
  });
  $("wsVirtualConfirm").addEventListener("click", function () {
    startRun();
    AstraUI.closeDialog($("wsVirtualDialog"));
    refresh();
  });
  window.addEventListener("pageshow", refresh);
  window.addEventListener("storage", function (event) {
    if (event.key === REGISTERED_KEY || event.key === null || event.key.startsWith("astra.problem.")) refresh();
  });

  let previousPhase = phase();
  refresh();
  setInterval(function () {
    renderClock();
    if (phase() !== previousPhase) {
      previousPhase = phase();
      refresh();
    }
  }, 1000);

  sets.loadSet(kind, set.id).then(function (result) {
    problems = result.problems;
    $("wsProblemsStatus").textContent = result.missing ? result.missing + " assigned problem(s) are currently unavailable." :
      problems.length ? "" : "No problems are available in this set yet.";
    refresh();
  }).catch(function (error) {
    $("wsProblemsStatus").textContent = sets.errorMessage(error);
    refresh();
  });
})();
