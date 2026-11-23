(function () {
  "use strict";

  // Demonstration records belong only to the existing test account (123 / 123).
  // Replace this data adapter with authenticated API responses when available.
  const DEMO_USER = "123";
  const SAMPLES = [
    { id: "sample-106", problem: "olp25-tree", title: "Olympic Sinh Viên 2025 - Siêu cúp - Tối ưu độ trễ", language: "C++17", submittedAt: "2026-11-21T04:17:56+07:00", verdict: "Accepted", score: 100, attained: 16, maximum: 16, passed: 16, tests: 16, runtime: 740, memory: 67.86, size: 1840 },
    { id: "sample-105", problem: "voi26-b4", title: "VOI 26 Bài 4 - Tất niên", language: "C++20", submittedAt: "2026-11-21T04:15:15+07:00", verdict: "Accepted", score: 100, attained: 20, maximum: 20, passed: 20, tests: 20, runtime: 850, memory: 27.38, size: 2160 },
    { id: "sample-104", problem: "2264A", title: "Rumb Needs a Hand", language: "C++17", submittedAt: "2026-11-18T21:04:00+07:00", verdict: "Accepted", score: 100, attained: 12, maximum: 12, passed: 12, tests: 12, runtime: 46, memory: 3.1, size: 632 },
    { id: "sample-103", problem: "2264B", title: "Knife’s Pill Farm", language: "Python 3", submittedAt: "2026-11-18T20:41:00+07:00", verdict: "Wrong answer", score: 40, attained: 8, maximum: 20, passed: 8, tests: 20, runtime: 112, memory: 9.8, size: 482 },
    { id: "sample-102", problem: "2264D", title: "Dr. Agos’s Dark Mode", language: "Python 3", submittedAt: "2026-11-17T19:12:00+07:00", verdict: "Time limit exceeded", score: 0, attained: 0, maximum: 15, passed: 0, tests: 15, runtime: 2000, memory: 14.2, size: 945 },
    { id: "sample-101", problem: "2264F", title: "Deranged Calculator", language: "C++20", submittedAt: "2026-11-07T09:04:00+07:00", verdict: "Accepted", score: 100, attained: 30, maximum: 30, passed: 30, tests: 30, runtime: 331, memory: 18.4, size: 1256 }
  ];
  const EARNED = [
    { id: "first-light", name: "First Light", image: "images/badge-first-light.svg", description: "Every journey starts with one accepted solution.", requirement: "Receive your first Accepted verdict on a practice problem.", earnedAt: "2026-11-07T09:04:00+07:00", evidence: "Deranged Calculator · first accepted solution" },
    { id: "quickdraw", name: "Quickdraw", image: "images/badge-quickdraw.svg", description: "A clear idea. A quick solution.", requirement: "Solve a practice problem within five minutes of starting your attempt.", earnedAt: "2026-11-18T21:04:00+07:00", evidence: "Rumb Needs a Hand · solved in 4 minutes" }
  ];

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) { return fallback; }
  }

  function currentHandle() {
    const user = AstraAuth.user();
    return user ? user.identifier : null;
  }

  function submissions(handle = currentHandle()) {
    if (!handle) return [];
    const rows = handle === DEMO_USER ? SAMPLES.map((row) => ({ ...row, owner: handle, sample: true })) : [];
    if (handle !== currentHandle()) return rows;
    const key = "astra.problem.2264F." + encodeURIComponent(handle) + ".submissions";
    const local = read(key, []);
    const labels = { cpp20: "C++20", python3: "Python 3", java21: "Java 21", rust: "Rust" };
    if (Array.isArray(local)) {
      local.forEach((row, index) => {
        if (!row || typeof row.code !== "string" || !Number.isFinite(row.createdAt) ||
            Number.isNaN(new Date(row.createdAt).getTime()) || !Object.hasOwn(labels, row.language)) return;
        rows.push({
          id: "local-" + row.createdAt + "-" + index, owner: handle, problem: "2264F", title: "Deranged Calculator",
          language: labels[row.language], submittedAt: new Date(row.createdAt).toISOString(),
          verdict: "Not judged", score: null, runtime: null, memory: null, size: new Blob([row.code]).size, sample: false
        });
      });
    }
    const workspace = read(AstraAuth.userKey("astra.r118.workspace"), {});
    if (workspace && Array.isArray(workspace.subs)) {
      const names = { A: "Warm-Up Signal", B: "Orbit Pairs", C: "Deranged Calculator", D: "Star Chart Reassembly", E: "Meteor Shower DP", F: "Nebula Segment Tree" };
      workspace.subs.forEach((row, index) => {
        if (!row || !Number.isFinite(row.at) || Number.isNaN(new Date(row.at).getTime()) || typeof row.code !== "string") return;
        rows.push({
          id: "workspace-" + row.id + "-" + index, owner: handle, problem: "R118-" + row.problem,
          title: names[row.problem] || "Round 118 problem", language: row.lang, submittedAt: new Date(row.at).toISOString(),
          verdict: "Not judged", score: null, runtime: null, memory: null, size: new Blob([row.code]).size, sample: false
        });
      });
    }
    return rows.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  function solved(handle = currentHandle()) {
    const seen = new Set();
    return submissions(handle).filter((row) => {
      if (row.verdict !== "Accepted" || seen.has(row.problem)) return false;
      seen.add(row.problem);
      return true;
    });
  }

  function achievements(handle = currentHandle()) {
    return handle === DEMO_USER ? EARNED.filter((badge) => badge.earnedAt).map((badge) => ({ ...badge })) : [];
  }

  function profile() {
    const handle = currentHandle();
    const saved = read(AstraAuth.userKey("astra-account"), {});
    const activity = {};
    submissions().forEach((row) => {
      const date = new Date(row.submittedAt);
      const day = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
      activity[day] = (activity[day] || 0) + 1;
    });
    return {
      handle: handle || "", email: typeof saved.email === "string" ? saved.email : "you@example.com",
      bio: typeof saved.bio === "string" ? saved.bio : "", solved: solved().length,
      rank: handle === DEMO_USER ? 47158 : "—", points: solved().reduce((sum, row) => sum + row.score, 0),
      contribution: 0, submissions: activity,
      badges: achievements(),
      achievements: achievements().map((badge) => ({ name: badge.name, date: badge.earnedAt, href: "achievements.html?tab=achievements&achievement=" + badge.id }))
    };
  }

  const dateTime = (value) => new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" });
  const runtime = (value) => value == null ? "—" : (value / 1000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + " s";
  const memory = (value) => value == null ? "—" : value.toFixed(2) + " MB";
  window.AstraData = Object.freeze({ submissions, solved, achievements, profile, dateTime, runtime, memory, demoUser: DEMO_USER });
})();
