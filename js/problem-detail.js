(function () {
  "use strict";

  const MAX_BYTES = 256 * 1024;
  const LANGUAGES = {
    cpp20: { label: "C++20", extension: ".cpp" },
    python3: { label: "Python 3", extension: ".py" },
    java21: { label: "Java 21", extension: ".java" },
    rust: { label: "Rust", extension: ".rs" }
  };
  const FILE_LANGUAGES = { cpp: "cpp20", cc: "cpp20", cxx: "cpp20", py: "python3", java: "java21", rs: "rust" };
  const source = document.getElementById("pd-source");
  const language = document.getElementById("pd-language");
  const lineNumbers = document.getElementById("pd-line-numbers");
  const sourceError = document.getElementById("pd-source-error");
  const draftStatus = document.getElementById("pd-draft-status");
  const submitStatus = document.getElementById("pd-submit-status");
  const historyStatus = document.getElementById("pd-history-status");
  const fileInput = document.getElementById("pd-source-file");
  const fileStatus = document.getElementById("pd-file-status");
  let draftTimer;
  let draftDirty = false;
  let releaseTab = false;
  let loadingFile = false;

  function readStore(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  const session = AstraAuth.user();
  const owner = session ? session.identifier : "guest";
  const storePrefix = "astra.problem.2264F." + encodeURIComponent(owner);
  const DRAFT_KEY = storePrefix + ".draft";
  const SUBMISSIONS_KEY = storePrefix + ".submissions";

  function byteLength(text) {
    return new Blob([text]).size;
  }

  function showSourceError(message) {
    sourceError.textContent = message;
    sourceError.hidden = !message;
    source.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function updateEditor() {
    const lines = source.value.split("\n");
    lineNumbers.textContent = lines.map(function (_, index) { return index + 1; }).join("\n");
    lineNumbers.scrollTop = source.scrollTop;
    const bytes = byteLength(source.value);
    document.getElementById("pd-code-size").textContent = (bytes < 1024 ? bytes + " B" : (bytes / 1024).toFixed(1) + " KB") + " / 256 KB";
    updateCursor();
  }

  function updateCursor() {
    const beforeCaret = source.value.slice(0, source.selectionStart).split("\n");
    document.getElementById("pd-cursor").textContent = "Ln " + beforeCaret.length + ", Col " + (beforeCaret[beforeCaret.length - 1].length + 1);
  }

  function saveDraft() {
    clearTimeout(draftTimer);
    if (!draftDirty || !AstraAuth.isLoggedIn()) return;
    if (byteLength(source.value) > MAX_BYTES) {
      draftStatus.textContent = "Draft not saved: code exceeds 256 KB.";
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ code: source.value, language: language.value }));
      draftDirty = false;
      draftStatus.textContent = "Draft saved on this device.";
    } catch (error) {
      draftStatus.textContent = "Draft could not be saved. Download a copy of your code.";
    }
  }

  function scheduleDraft() {
    draftDirty = true;
    clearTimeout(draftTimer);
    draftStatus.textContent = "Saving draft…";
    draftTimer = setTimeout(saveDraft, 400);
  }

  function codeChanged() {
    updateEditor();
    showSourceError(byteLength(source.value) > MAX_BYTES ? "Source code must be 256 KB or smaller." : "");
    submitStatus.textContent = "";
    scheduleDraft();
  }

  function showSection(shouldFocus) {
    const name = location.hash.slice(1);
    let section = ["statement", "submit", "submissions", "editorial"].includes(name) ? name : "statement";
    if (["submit", "submissions"].includes(section) && !AstraAuth.isLoggedIn()) {
      const next = location.href;
      section = "statement";
      history.replaceState(null, "", location.pathname + location.search + "#statement");
      AstraAuth.requireLogin(next);
    }
    document.querySelectorAll("[data-problem-panel]").forEach(function (panel) {
      panel.hidden = panel.id !== section;
    });
    document.querySelectorAll("[data-problem-nav]").forEach(function (link) {
      if (link.dataset.problemNav === section) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (section === "submissions") renderSubmissions();
    if (shouldFocus) {
      const heading = document.querySelector("#" + section + " h2");
      heading.focus({ preventScroll: true });
      document.querySelector(".pd-tabs").scrollIntoView({ block: "start" });
    }
  }

  function readSubmissions() {
    if (!AstraAuth.isLoggedIn()) return [];
    const stored = readStore(SUBMISSIONS_KEY, []);
    if (!Array.isArray(stored)) return [];
    return stored.filter(function (item) {
      return item && Object.hasOwn(LANGUAGES, item.language) && typeof item.code === "string" &&
        byteLength(item.code) <= MAX_BYTES && Number.isFinite(item.createdAt) &&
        !Number.isNaN(new Date(item.createdAt).getTime());
    }).slice(0, 20);
  }

  function downloadCode(code, languageId) {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "2264F" + LANGUAGES[languageId].extension;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderSubmissions() {
    const submissions = readSubmissions();
    const list = document.getElementById("pd-submission-list");
    list.replaceChildren();
    document.getElementById("pd-submissions-empty").hidden = submissions.length > 0;
    document.getElementById("pd-submissions-table").hidden = submissions.length === 0;

    submissions.forEach(function (submission) {
      const row = document.createElement("tr");
      const timeCell = document.createElement("td");
      const time = document.createElement("time");
      time.dateTime = new Date(submission.createdAt).toISOString();
      time.textContent = new Date(submission.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      timeCell.appendChild(time);
      const languageCell = document.createElement("td");
      languageCell.textContent = LANGUAGES[submission.language].label;
      const statusCell = document.createElement("td");
      statusCell.textContent = "Saved locally · not judged";
      const sourceCell = document.createElement("td");
      const download = document.createElement("button");
      download.type = "button";
      download.className = "pd-text-button";
      download.textContent = "Download";
      download.setAttribute("aria-label", "Download " + LANGUAGES[submission.language].label + " source submitted " + time.textContent);
      download.addEventListener("click", function () { downloadCode(submission.code, submission.language); });
      sourceCell.appendChild(download);
      row.append(timeCell, languageCell, statusCell, sourceCell);
      list.appendChild(row);
    });
  }

  // TODO: send the validated source to a judging API when the backend exists.
  // Local records deliberately have no Accepted/Wrong answer verdict or score.
  document.getElementById("pd-submit-form").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!AstraAuth.requireLogin(location.pathname + location.search + "#submit")) return;
    if (loadingFile) {
      submitStatus.textContent = "Wait for the source file to finish loading.";
      return;
    }
    const message = !source.value.trim() ? "Write your solution or load a source file before submitting." :
      byteLength(source.value) > MAX_BYTES ? "Source code must be 256 KB or smaller." : "";
    showSourceError(message);
    if (message) {
      source.focus();
      return;
    }

    const submissions = readSubmissions();
    submissions.unshift({ language: language.value, code: source.value, createdAt: Date.now() });
    try {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions.slice(0, 20)));
    } catch (error) {
      submitStatus.textContent = "Your submission could not be saved. Browser storage may be unavailable or full. Download your source code to keep a copy.";
      return;
    }
    saveDraft();
    historyStatus.textContent = "Submission saved on this device. It has not been sent for judging.";
    location.hash = "submissions";
  });

  fileInput.addEventListener("change", async function () {
    const file = fileInput.files[0];
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    const detectedLanguage = FILE_LANGUAGES[extension];
    if (!Object.hasOwn(FILE_LANGUAGES, extension)) {
      fileStatus.textContent = "Choose a C++, Python, Java or Rust source file.";
      fileInput.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      fileStatus.textContent = "This file exceeds 256 KB. Your current code has been kept.";
      fileInput.value = "";
      return;
    }
    loadingFile = true;
    const codeBeforeRead = source.value;
    fileStatus.textContent = "Reading source file…";
    document.getElementById("pd-submit-button").disabled = true;
    fileInput.disabled = true;
    try {
      const text = await file.text();
      if (text.includes("\0") || byteLength(text) > MAX_BYTES) {
        fileStatus.textContent = "Choose a plain text source file of 256 KB or smaller. Your current code has been kept.";
        return;
      }
      if (source.value !== codeBeforeRead) {
        fileStatus.textContent = "Your code changed while the file was loading. Choose the file again to replace it.";
        return;
      }
      source.value = text.replace(/\r\n?/g, "\n");
      language.value = detectedLanguage;
      codeChanged();
      saveDraft();
      fileStatus.textContent = "Loaded " + file.name + " · " + LANGUAGES[detectedLanguage].label + ". You can edit the code before submitting.";
    } catch (error) {
      fileStatus.textContent = "The file could not be read. Try selecting it again.";
    } finally {
      loadingFile = false;
      fileInput.disabled = false;
      fileInput.value = "";
      document.getElementById("pd-submit-button").disabled = false;
    }
  });

  source.addEventListener("input", codeChanged);
  source.addEventListener("scroll", function () { lineNumbers.scrollTop = source.scrollTop; });
  ["click", "keyup", "select"].forEach(function (type) {
    source.addEventListener(type, updateCursor);
  });
  source.addEventListener("blur", function () { releaseTab = false; });
  source.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      releaseTab = true;
      return;
    }
    if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
    if (releaseTab) {
      releaseTab = false;
      return;
    }
    event.preventDefault();
    if (event.shiftKey) {
      const start = source.selectionStart;
      const lineStart = source.value.slice(0, start).lastIndexOf("\n") + 1;
      const indent = source.value.slice(lineStart).match(/^( {1,2}|\t)/);
      if (indent) {
        const end = source.selectionEnd;
        source.setRangeText("", lineStart, lineStart + indent[0].length, "start");
        source.setSelectionRange(Math.max(lineStart, start - indent[0].length), Math.max(lineStart, end - indent[0].length));
      }
    } else {
      source.setRangeText("  ", source.selectionStart, source.selectionEnd, "end");
    }
    codeChanged();
  });

  language.addEventListener("change", scheduleDraft);
  document.getElementById("pd-download-code").addEventListener("click", function () {
    if (!source.value.trim()) {
      showSourceError("Write or load source code before downloading.");
      source.focus();
      return;
    }
    downloadCode(source.value, language.value);
  });

  document.querySelectorAll("[data-copy-sample]").forEach(function (button) {
    button.addEventListener("click", async function () {
      const status = document.getElementById("pd-copy-status");
      try {
        await navigator.clipboard.writeText(document.getElementById(button.dataset.copySample).textContent + "\n");
        status.textContent = button.textContent.replace("Copy", "Copied") + ".";
      } catch (error) {
        status.textContent = "Clipboard access is unavailable. Select and copy the sample text manually.";
      }
    });
  });

  window.addEventListener("hashchange", function () { showSection(true); });
  window.addEventListener("pagehide", saveDraft);
  document.addEventListener("visibilitychange", function () { if (document.hidden) saveDraft(); });

  const draft = readStore(DRAFT_KEY, null);
  if (draft && typeof draft.code === "string" && byteLength(draft.code) <= MAX_BYTES) {
    source.value = draft.code;
    if (Object.hasOwn(LANGUAGES, draft.language)) language.value = draft.language;
    draftStatus.textContent = "Draft restored from this device.";
  }
  updateEditor();
  showSection(false);
})();
