(function () {
  "use strict";
  if (!AstraAuth.isLoggedIn()) return;

  const Data = AstraData;
  const list = document.getElementById("submission-list");
  const dialog = document.getElementById("submissionDialog");
  const rows = Data.submissions();
  let selected = null;
  const problemFilter = document.querySelector('[data-filter="problem"]');
  const problems = new Map(rows.map((row) => [row.problem, row.title]));
  problems.forEach((title, id) => {
    problemFilter.add(new Option(title, id));
  });

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

  function showSubmission(submission, trigger) {
    selected = submission;
    document.getElementById("submissionTitle").textContent = submission.title;
    document.getElementById("submissionOrigin").textContent = submission.sample
      ? "Sample submission · demonstration result"
      : "Saved on this device · no judging result yet";
    const overall = document.getElementById("submissionOverall");
    overall.replaceChildren(
      cell("Accuracy", submission.tests ? Math.round(submission.passed / submission.tests * 100) + "%" : "—"),
      cell("Attained score", submission.attained ?? "—"),
      cell("Max score", submission.maximum ?? "—")
    );
    const metrics = document.getElementById("submissionMetrics");
    metrics.replaceChildren(
      cell("Submit time", Data.dateTime(submission.submittedAt)),
      cell("CPU runtime", Data.runtime(submission.runtime)),
      cell("Peak memory", Data.memory(submission.memory)),
      cell("Language", submission.language),
      cell("Verdict", submission.verdict),
      cell("Tests passed", submission.tests ? submission.passed + " / " + submission.tests : "—"),
      cell("Source size", submission.size + " B"),
      cell("Submission ID", submission.id)
    );
    document.getElementById("submissionCopyStatus").textContent = "";
    AstraUI.openDialog(dialog, trigger);
  }

  const empty = list.querySelector("[data-filter-empty]");
  rows.forEach((submission) => {
    const row = document.createElement("li");
    row.className = "submission-row";
    row.dataset.problem = submission.problem;
    row.dataset.verdict = submission.verdict;
    const description = document.createElement("div");
    const link = document.createElement("a");
    link.className = "submission-title";
    link.href = "problem-detail.html?problem=" + encodeURIComponent(submission.problem);
    link.textContent = submission.title;
    const meta = document.createElement("p");
    meta.className = "submission-meta";
    meta.textContent = submission.language + " · " + submission.verdict + " · " + Data.dateTime(submission.submittedAt);
    description.append(link, meta);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "submission-score";
    button.dataset.verdict = submission.verdict;
    button.textContent = submission.score == null ? "—" : submission.score;
    button.setAttribute("aria-label", "View evaluation for " + submission.title + ", " + (submission.score == null ? "not judged" : submission.score + " points"));
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => showSubmission(submission, button));
    row.append(description, button);
    list.insertBefore(row, empty);
  });
  document.getElementById("submissionCount").textContent = rows.length + " submission" + (rows.length === 1 ? "" : "s");
  document.querySelector("[data-sample-note]").hidden = !rows.some((row) => row.sample);

  document.getElementById("copySubmission").addEventListener("click", async () => {
    if (!selected) return;
    const text = selected.title + "\n" + [...dialog.querySelectorAll("tbody tr")].map((row) =>
      [...row.children].map((item) => item.textContent).join(": ")).join("\n");
    const status = document.getElementById("submissionCopyStatus");
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Evaluation copied.";
    } catch (error) {
      status.textContent = "Clipboard unavailable. Select and copy the evaluation text manually.";
    }
  });
})();
