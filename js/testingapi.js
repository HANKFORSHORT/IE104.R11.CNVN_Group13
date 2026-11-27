(function () {
  const slug = new URLSearchParams(location.search).get("slug") || "a-plus-b";
  const BASE = window.CONFIG?.API_BASE_URL || "https://ie104-r11-cnvn-group13-be.onrender.com";
  const TIMEOUT = window.CONFIG?.REQUEST_TIMEOUT || 60000;

  const $ = (id) => document.getElementById(id);

  
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  // The API returns problem statements with lightweight Markdown such as **a**.
  // Render just strong emphasis while keeping the content as text nodes (no raw HTML).
  function setInlineMarkdown(node, text) {
    node.replaceChildren();
    const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        node.appendChild(el("strong", part.slice(2, -2)));
      } else if (part) {
        node.appendChild(document.createTextNode(part));
      }
    });
  }

  function setStatus(text, isError = false) {
    const statusEl = $("pd-api-status");
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? "var(--danger, crimson)" : "";
  }

  function formatTimeLimit(ms) {
    if (!ms) return "—";
    return ms >= 1000 ? `${ms / 1000} seconds` : `${ms} ms`;
  }

  function render(p) {
    const code = p.code || p.slug?.toUpperCase() || "PROB";
    document.title = `${p.title} · Astra`;

    $("pd-breadcrumb-code").textContent = code;
    $("pd-source").textContent = `${p.source || "Astra Archive"} · ${p.difficulty || ""}`;
    $("pd-title").textContent = p.title || "";
    $("pd-rating").textContent = p.difficulty_rating ?? p.difficulty ?? "—";
    $("pd-submit-problem-label").textContent = `${code} · ${p.title}`;

    // Header meta
    const langNames = (p.languages || []).map((l) => l.name).join(", ") || "—";
    const meta = $("pd-header-meta");
    meta.innerHTML = "";
    [
      `Time limit: ${formatTimeLimit(p.time_limit_ms)}`,
      `Memory limit: ${p.memory_limit_mb} MB`,
      `Checker: ${p.checker_type || "standard"}`,
      `Input: stdin`,
      `Output: stdout`,
      `Languages: ${langNames}`
    ].forEach((text) => meta.appendChild(el("span", text)));

    // Tags
    const tagsWrap = $("pd-topic-tags");
    tagsWrap.innerHTML = "";
    (p.tags || []).forEach((t) => tagsWrap.appendChild(el("span", t.name, "tag")));

    // Statement
    setInlineMarkdown($("pd-description"), p.description);
    $("pd-input-format").textContent = p.input_format || "";
    $("pd-output-format").textContent = p.output_format || "";
    $("pd-constraints").textContent = p.constraints_text || "";

    // Samples khớp cấu trúc .pd-example / .pd-sample
    const samplesWrap = $("pd-samples-container");
    samplesWrap.innerHTML = "";
    [...(p.samples || [])]
      .sort((a, b) => a.display_order - b.display_order)
      .forEach((s, idx) => {
        const i = idx + 1;
        const example = el("div", null, "pd-example");

        // Input box
        const inBox = el("div", null, "pd-sample");
        const inHead = el("div", null, "pd-sample-heading");
        inHead.appendChild(el("strong", "Input"));
        const copyInBtn = el("button", "Copy input", "pd-text-button");
        copyInBtn.type = "button";
        copyInBtn.dataset.copySample = `pd-input-${i}`;
        inHead.appendChild(copyInBtn);
        const inPre = el("pre", s.input_data);
        inPre.id = `pd-input-${i}`;
        inBox.append(inHead, inPre);

        // Output box
        const outBox = el("div", null, "pd-sample");
        const outHead = el("div", null, "pd-sample-heading");
        outHead.appendChild(el("strong", "Output"));
        const copyOutBtn = el("button", "Copy output", "pd-text-button");
        copyOutBtn.type = "button";
        copyOutBtn.dataset.copySample = `pd-output-${i}`;
        outHead.appendChild(copyOutBtn);
        const outPre = el("pre", s.expected_output);
        outPre.id = `pd-output-${i}`;
        outBox.append(outHead, outPre);

        example.append(inBox, outBox);
        samplesWrap.appendChild(example);
      });

    // Dropdown ngôn ngữ ở tab Submit
    const langSelect = $("pd-language");
    if (langSelect && Array.isArray(p.languages)) {
      langSelect.innerHTML = "";
      p.languages.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.code || l.slug || l.name.toLowerCase();
        opt.textContent = l.compiler_version ? `${l.name} (${l.compiler_version})` : l.name;
        langSelect.appendChild(opt);
      });
    }

    // Editorial
    $("pd-editorial-body").textContent =
      p.editorial?.body || "No editorial available for this problem yet.";
  }

  async function load() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const url = `${BASE}/api/problems/${encodeURIComponent(slug)}`;

    setStatus("Loading problem data...");

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || `HTTP ${res.status}`);
      }

      render(json.data);
      setStatus(""); // Ẩn thông báo khi tải xong để giao diện sạch như bản mẫu
    } catch (err) {
      if (err.name === "AbortError") {
        setStatus("Request timed out. Server might be waking up, please refresh.", true);
      } else {
        setStatus(`Failed to load problem: ${err.message}`, true);
        console.error("Fetch error:", err);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
