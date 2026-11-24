(function () {
  "use strict";
  if (!AstraAuth.isLoggedIn()) return;
  const PROBLEMS = [
    { id: "A", name: "Warm-Up Signal",       diff: 800,  cls: "easy" },
    { id: "B", name: "Orbit Pairs",          diff: 1100, cls: "easy" },
    { id: "C", name: "Deranged Calculator",  diff: 1900, cls: "medium" },
    { id: "D", name: "Star Chart Reassembly",diff: 2200, cls: "hard" },
    { id: "E", name: "Meteor Shower DP",     diff: 2600, cls: "hard" },
    { id: "F", name: "Nebula Segment Tree",  diff: 3000, cls: "hard" }
  ];
  // 17 Oct 2026, 21:35 ICT (UTC+7), 2 hours
  const START = new Date("2026-10-17T21:35:00+07:00").getTime();
  const END = START + 2 * 3600 * 1000;
  const KEY = AstraAuth.userKey("astra.r118.workspace");
  const $ = (id) => document.getElementById(id);

  // ?state=upcoming|running|ended lets you preview each state while developing
  const forced = new URLSearchParams(location.search).get("state");
  const demoOffset = { upcoming: START - 3600e3 * 26 - Date.now(), running: START + 47 * 60e3 - Date.now(), ended: END + 3600e3 - Date.now() }[forced] || 0;
  const now = () => Date.now() + demoOffset;

  let data = { registered: false, subs: [] };
  try { data = Object.assign(data, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  const phase = () => (now() < START ? "upcoming" : now() < END ? "running" : "ended");
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function problemStatus(id) {
    const mine = data.subs.filter((s) => s.problem === id);
    if (!mine.length) return "none";
    return mine.some((s) => s.verdict === "Accepted") ? "solved" : "attempted";
  }

  function stats() {
    let solved = 0, penalty = 0;
    PROBLEMS.forEach((p) => {
      const mine = data.subs.filter((s) => s.problem === p.id && s.virtual !== true).sort((a, b) => a.at - b.at);
      const ac = mine.find((s) => s.verdict === "Accepted");
      if (ac) {
        solved++;
        const wrong = mine.filter((s) => s.at < ac.at).length;
        penalty += Math.floor((ac.at - START) / 60000) + wrong * 10;
      }
    });
    return { solved, penalty };
  }

  function renderClock() {
    const p = phase(), t = now();
    const st = $("wsState");
    st.dataset.state = p;
    st.textContent = { upcoming: "Not started", running: "Running", ended: "Finished" }[p];
    if (p === "upcoming") { $("wsClockLabel").textContent = "Starts in"; $("wsClock").textContent = fmt(START - t); $("wsBar").style.width = "0%"; }
    else if (p === "running") { $("wsClockLabel").textContent = "Time left"; $("wsClock").textContent = fmt(END - t); $("wsBar").style.width = ((t - START) / (END - START) * 100).toFixed(1) + "%"; }
    else { $("wsClockLabel").textContent = "Round ended"; $("wsClock").textContent = "00:00:00"; $("wsBar").style.width = "100%"; }
  }

  function renderParticipation() {
    const p = phase();
    const btn = $("wsRegister"), msg = $("wsPartMsg");
    if (p === "ended") {
      $("wsPart").textContent = data.registered ? "Participated" : "Virtual participation";
      btn.textContent = "Practice in virtual mode";
      btn.disabled = false;
      msg.textContent = "Submissions are not rated after the round.";
    } else if (data.registered) {
      $("wsPart").textContent = p === "running" ? "Competing" : "Registered";
      btn.textContent = p === "running" ? "Registered" : "Cancel registration";
      btn.disabled = p === "running";
      msg.textContent = p === "upcoming" ? "Registration closes 5 minutes before the start." : "";
    } else {
      $("wsPart").textContent = "Not registered";
      btn.textContent = "Register for round";
      btn.disabled = p === "running";
      msg.textContent = p === "running" ? "Registration is closed for this round." : "Registration closes 5 minutes before the start.";
    }
    const s = stats();
    $("wsSolved").textContent = s.solved;
    $("wsPenalty").textContent = s.penalty;
  }

  function renderProblems() {
    $("wsProblems").innerHTML = PROBLEMS.map((p) => {
      const s = problemStatus(p.id);
      const label = { none: "Not attempted", attempted: "Attempted", solved: "Solved" }[s];
      return '<tr><td class="rank-cell">' + p.id + '</td>' +
        '<td><a class="problem-link" href="problem-detail.html">' + esc(p.name) + '</a></td>' +
        '<td><span class="pill pill-' + p.cls + '">' + p.diff + '</span></td>' +
        '<td><span class="ws-status" data-s="' + s + '">' + label + '</span></td>' +
        '<td><button type="button" class="btn btn-sm btn-secondary" data-pick="' + p.id + '">Submit</button></td></tr>';
    }).join("");
    $("wsProblemSel").innerHTML = PROBLEMS.map((p) => '<option value="' + p.id + '">' + p.id + ". " + esc(p.name) + "</option>").join("");
  }

  let tab = "all";
  function renderSubs() {
    const rows = data.subs.slice().sort((a, b) => b.at - a.at).filter((s) =>
      tab === "all" ? true : tab === "Accepted" ? s.verdict === "Accepted" : s.verdict !== "Accepted" && s.verdict !== "Pending");
    $("wsSubs").innerHTML = rows.length ? rows.map((s) =>
      "<tr><td>#" + s.id + "</td><td>" + new Date(s.at).toLocaleTimeString("en-GB", { hour12: false }) + "</td><td>" + esc(s.problem) + "</td><td>" + esc(s.lang) + '</td><td><span class="ws-verdict" data-v="' + esc(s.verdict) + '">' + esc(s.verdict) + (s.virtual ? " (virtual)" : "") + "</span></td></tr>").join("")
      : '<tr><td colspan="5" style="text-align:center;padding:1.5rem;">No submissions yet. Pick a problem and submit your first solution.</td></tr>';
  }

  function renderAll() { renderProblems(); renderSubs(); renderParticipation(); applyFormState(); }

  function applyFormState() {
    const p = phase();
    const blocked = p === "upcoming" || (p === "running" && !data.registered);
    ["wsProblemSel", "wsLang", "wsCode", "wsSubmit"].forEach((id) => ($(id).disabled = blocked));
    $("wsMsg").textContent = blocked
      ? (p === "upcoming" ? "Submissions open when the round starts." : "Register for the round to submit.")
      : "";
  }

  $("wsRegister").addEventListener("click", () => {
    if (!AstraAuth.requireLogin()) return;
    const p = phase();
    if (p === "ended") { $("wsPartMsg").textContent = "Virtual mode on: submit solutions below to practice."; return; }
    data.registered = !data.registered;
    save(); renderAll();
  });

  $("wsProblems").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    $("wsProblemSel").value = b.dataset.pick;
    $("wsCode").focus();
  });

  document.querySelector(".ws-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    document.querySelectorAll(".ws-tabs button").forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
    renderSubs();
  });

  $("wsForm").addEventListener("submit", (event) => event.preventDefault());

  $("wsSubmit").addEventListener("click", () => {
    if (!AstraAuth.requireLogin()) return;
    const code = $("wsCode").value.trim();
    if (!code) { $("wsMsg").textContent = "Paste your source code before submitting."; return; }
    const sub = { id: 100000 + data.subs.length + 1, at: now(), problem: $("wsProblemSel").value, lang: $("wsLang").value, verdict: "Pending", code: code, virtual: phase() === "ended" };
    data.subs.push(sub); save();
    $("wsCode").value = "";
    $("wsMsg").textContent = "Submission #" + sub.id + " received. Judging…";
    renderAll();
    // TODO: replace with a real API call, then update sub.verdict from the response
    setTimeout(() => {

      sub.verdict = /\bAC\b/.test(sub.code) ? "Accepted" : /\bRE\b/.test(sub.code) ? "Runtime error" : "Wrong answer";
      save();
      $("wsMsg").textContent = "Submission #" + sub.id + ": " + sub.verdict + ".";
      renderAll();
    }, 1200);
  });

  let last = phase();
  renderAll(); renderClock();
  setInterval(() => {
    renderClock();
    if (phase() !== last) { last = phase(); renderAll(); }
  }, 1000);
})();
