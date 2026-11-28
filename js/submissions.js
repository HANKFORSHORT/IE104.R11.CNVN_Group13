(function () {
  "use strict";
  const verdicts = {
    AC: "Accepted", WA: "Wrong answer", TLE: "Time limit exceeded",
    MLE: "Memory limit exceeded", OLE: "Output limit exceeded",
    CE: "Compilation error", RE: "Runtime error", IE: "Internal error"
  };
  const list = document.getElementById("submission-list");
  const empty = list.querySelector("[data-filter-empty]");
  const dialog = document.getElementById("submissionDialog");
  const problemFilter = document.querySelector('[data-filter="problem"]');
  const knownProblems = new Set();
  let selected = null;
  let cursor = null;
  let total = 0;

  function cell(label, value) {
    const row = document.createElement("tr");
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = label;
    const result = document.createElement("td");
    result.textContent = value;
    row.append(name, result);
    return row;
  }
  const date = (value) => new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium", timeStyle: "short"
  });
  function showSubmission(item, trigger) {
    selected = item;
    document.getElementById("submissionTitle").textContent = item.problemTitle;
    document.getElementById("submissionOrigin").textContent = "Astra submission";
    document.getElementById("submissionOverall").replaceChildren(
      cell("Score", item.score == null ? "—" : item.score),
      cell("Status", item.status),
      cell("Verdict", item.verdict ? verdicts[item.verdict] || item.verdict : "Not judged")
    );
    document.getElementById("submissionMetrics").replaceChildren(
      cell("Submitted", date(item.submittedAt)),
      cell("Language", item.language),
      cell("Source size", item.sizeBytes + " B"),
      cell("Submission ID", item.id)
    );
    document.getElementById("submissionCopyStatus").textContent = "";
    AstraUI.openDialog(dialog, trigger);
  }

  function append(item) {
    const verdict = item.verdict ? verdicts[item.verdict] || item.verdict : "Not judged";
    if (!knownProblems.has(item.problemSlug)) {
      knownProblems.add(item.problemSlug);
      problemFilter.add(new Option(item.problemTitle, item.problemSlug));
    }
    const row = document.createElement("li");
    row.className = "submission-row";
    row.dataset.problem = item.problemSlug;
    row.dataset.verdict = verdict;
    const description = document.createElement("div");
    const link = document.createElement("a");
    link.className = "submission-title";
    link.href = "problem-detail.html?problem=" + encodeURIComponent(item.problemSlug);
    link.textContent = item.problemTitle;
    const meta = document.createElement("p");
    meta.className = "submission-meta";
    meta.textContent = item.language + " · " + verdict + " · " + date(item.submittedAt);
    description.append(link, meta);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "submission-score";
    button.dataset.verdict = verdict;
    button.textContent = item.score == null ? "—" : item.score;
    button.setAttribute("aria-label", "View evaluation for " + item.problemTitle);
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => showSubmission(item, button));
    row.append(description, button);
    list.insertBefore(row, empty);
  }

  async function init() {
    await AstraAuth.ready;
    if (!AstraAuth.isLoggedIn()) return;
    document.querySelector("[data-sample-note]").hidden = true;
    const more = document.createElement("button");
    more.type = "button";
    more.className = "btn btn-secondary btn-sm";
    more.textContent = "Load more";
    more.hidden = true;
    list.after(more);
    async function load() {
      more.disabled = true;
      document.getElementById("submissionCount").textContent = "Loading…";
      try {
        const path = "/api/v1/me/submissions" +
          (cursor ? "?cursor=" + encodeURIComponent(cursor) : "");
        const page = await AstraAPI.request(path);
        page.items.forEach(append);
        total += page.items.length;
        cursor = page.nextCursor;
        more.hidden = !cursor;
        empty.hidden = total > 0;
        document.getElementById("submissionCount").textContent =
          total + " submission" + (total === 1 ? "" : "s") + (cursor ? " loaded" : "");
      } catch (error) {
        empty.hidden = false;
        empty.querySelector("p").textContent = error.message;
        document.getElementById("submissionCount").textContent = "Could not load submissions";
      } finally { more.disabled = false; }
    }
    more.addEventListener("click", load);
    await load();
  }
  document.getElementById("copySubmission").addEventListener("click", async () => {
    if (!selected) return;
    const result = selected.problemTitle + "\n" +
      [...dialog.querySelectorAll("tbody tr")].map((row) =>
        [...row.children].map((node) => node.textContent).join(": ")).join("\n");
    const status = document.getElementById("submissionCopyStatus");
    try {
      await navigator.clipboard.writeText(result);
      status.textContent = "Evaluation copied.";
    } catch {
      status.textContent = "Clipboard unavailable. Select and copy the evaluation manually.";
    }
  });
  init();
})();
