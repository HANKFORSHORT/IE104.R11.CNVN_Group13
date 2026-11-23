(function () {
  "use strict";

  // Demonstration records belong only to the existing test account (123 / 123).
  // Replace this data adapter with authenticated API responses when available.
  const DEMO_USER = "123";

  // Public sample records shared by Rankings and the public user pages.
  const stat = (a) => ({ rating: a[0], solved: a[1], change: a[2] });
  const person = (handle, initials, name, place, country, region, friend, s04, s03, all) => ({
    handle, initials, name, place, country, region, friend,
    stats: { s04: stat(s04), s03: stat(s03), all: stat(all) }
  });
  // [rating, solved, change]; change = null khi không có (All time)
  const COMPETITORS = [
    person('minhtriet', 'MT', 'Nguyen Minh Triet', 'Vietnam', 'Vietnam', 'apac', false, [2984, 212, 1], [2897, 228, 2], [3012, 934, null]),
    person('khangdev', 'KD', 'Tran Gia Khang', 'Vietnam', 'Vietnam', 'apac', true, [2741, 205, 0], [2788, 219, -1], [2830, 811, null]),
    person('lemontea', 'LT', 'Le Hoang Anh', 'Vietnam', 'Vietnam', 'apac', false, [2608, 198, 2], [2540, 190, 3], [2655, 742, null]),
    person('quangdo', 'QD', null, 'Da Nang, Vietnam', 'Vietnam', 'apac', true, [2487, 186, 3], [2455, 177, 1], [2519, 688, null]),
    person('huyanh', 'HA', null, 'Hanoi, Vietnam', 'Vietnam', 'apac', false, [2392, 174, 1], [2410, 181, -2], [2440, 655, null]),
    person('nami_t', 'NT', null, 'Ho Chi Minh City, Vietnam', 'Vietnam', 'apac', true, [2315, 168, -2], [2372, 172, 1], [2398, 630, null]),
    person('baolong', 'BL', null, 'Can Tho, Vietnam', 'Vietnam', 'apac', false, [2264, 159, 4], [2201, 150, 2], [2290, 598, null]),
    person('mkhanh', 'MK', null, 'Hai Phong, Vietnam', 'Vietnam', 'apac', false, [2187, 151, 2], [2160, 143, -1], [2215, 571, null]),
    person('sora_k', 'SK', null, 'Osaka, Japan', 'Japan', 'apac', true, [2104, 138, -1], [2131, 141, 0], [2160, 520, null]),
    person('minseo', 'MS', null, 'Seoul, South Korea', 'South Korea', 'apac', false, [2058, 131, 1], [2012, 126, 2], [2089, 497, null]),
    person('lintan', 'LT', null, 'Singapore', 'Singapore', 'apac', false, [1986, 122, 0], [1975, 120, -1], [2002, 468, null]),
    person('pawel_z', 'PZ', null, 'Warsaw, Poland', 'Poland', 'europe', false, [1921, 115, 2], [1890, 109, 1], [1950, 440, null]),
    person('arjun_r', 'AR', null, 'Bengaluru, India', 'India', 'apac', false, [1874, 108, 1], [1850, 104, 0], [1902, 410, null]),
    person('ploy_n', 'PN', null, 'Bangkok, Thailand', 'Thailand', 'apac', false, [1832, 101, -1], [1860, 106, 1], [1871, 395, null]),
    person('lena_b', 'LB', null, 'Berlin, Germany', 'Germany', 'europe', false, [1795, 97, 3], [1760, 92, 2], [1820, 372, null])
  ];

  // Round 118 standings provide contest results, not global ratings.
  const CONTEST_COMPETITORS = [
    { handle: "abakan", rank: 1, points: 10500, solved: 6 },
    { handle: "NHQ0914", rank: 2, points: 7500, solved: 5 },
    { handle: "Sherwin", rank: 3, points: 5000, solved: 4 },
    { handle: "Cerq", rank: 4, points: 5000, solved: 4 },
    { handle: "harryleee", rank: 5, points: 3000, solved: 3 },
    { handle: "tuongll", rank: 6, points: 3000, solved: 3 },
    { handle: "lenhanbo", rank: 7, points: 1500, solved: 2 },
    { handle: "minhanh_dev", rank: 8, points: 500, solved: 1 }
  ];

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


  function user(handle) {
    if (typeof handle !== "string" || !handle.trim()) return null;
    const requested = handle.trim().toLowerCase();
    const current = currentHandle();

    if (current && current.toLowerCase() === requested) {
      const own = profile();
      return {
        handle: current, name: "", location: "", kind: "account",
        rating: own.points, rank: typeof own.rank === "number" ? own.rank : null,
        solved: own.solved, detailsAvailable: true
      };
    }

    if (requested === DEMO_USER) {
      const accepted = solved(DEMO_USER);
      return {
        handle: DEMO_USER, name: "", location: "", kind: "account",
        rating: accepted.reduce((sum, row) => sum + row.score, 0),
        rank: 47158, solved: accepted.length, detailsAvailable: true
      };
    }

    const rankingIndex = COMPETITORS.findIndex((person) => person.handle.toLowerCase() === requested);
    if (rankingIndex !== -1) {
      const person = COMPETITORS[rankingIndex];
      return {
        handle: person.handle, name: person.name || "", location: person.place,
        kind: "ranking", rating: person.stats.s04.rating,
        rank: rankingIndex + 1, solved: person.stats.s04.solved,
        detailsAvailable: false
      };
    }

    const contestant = CONTEST_COMPETITORS.find((person) => person.handle.toLowerCase() === requested);
    if (contestant) {
      return {
        handle: contestant.handle, name: "", location: "Round 118 participant",
        kind: "contest", rating: contestant.points,
        rank: contestant.rank, solved: contestant.solved,
        detailsAvailable: false
      };
    }

    return null;
  }

  const dateTime = (value) => new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" });
  const runtime = (value) => value == null ? "—" : (value / 1000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + " s";
  const memory = (value) => value == null ? "—" : value.toFixed(2) + " MB";
  window.AstraData = Object.freeze({ submissions, solved, achievements, profile, user, competitors: COMPETITORS, dateTime, runtime, memory, demoUser: DEMO_USER });
})();
