document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-filter-table]").forEach(initFilterBar);
});

function initFilterBar(bar) {
  const container = document.querySelector(bar.dataset.filterTable);
  if (!container) return;

  const selects  = bar.querySelectorAll("select[data-filter]");
  const searchIn = bar.querySelector("[data-filter-search]");
  const applyBtn = bar.querySelector("[data-filter-apply]");
  const emptyRow = container.querySelector("[data-filter-empty], #emptyRow");

  // :scope > * lấy con trực tiếp: <tr> (bảng) hoặc .card (lưới)
  const rows = [...container.querySelectorAll(":scope > *")].filter(el => el !== emptyRow);

  function matchSelect(sel, row) {
    const val = sel.value;
    if (val === "any" || val === "") return true;

    const rowVal = row.dataset[sel.dataset.filter];

    // dạng khoảng: value="min-max", so với số trong data-* của row
    if (sel.dataset.filterType === "range") {
      const [min, max] = val.split("-").map(Number);
      const n = Number(rowVal);
      return !Number.isNaN(n) && n >= min && n <= max;
    }

    return rowVal === val;
  }

  function apply() {
    const keyword = searchIn ? searchIn.value.trim().toLowerCase() : "";
    let visible = 0;

    rows.forEach(row => {
      const okSelects = [...selects].every(sel => matchSelect(sel, row));
      const okSearch  = row.textContent.toLowerCase().includes(keyword);

      const show = okSelects && okSearch;
      row.hidden = !show;
      if (show) visible++;
    });

    if (emptyRow) emptyRow.hidden = visible > 0;
  }

  if (applyBtn) applyBtn.addEventListener("click", apply);
  if (searchIn) searchIn.addEventListener("keydown", e => {
    if (e.key === "Enter") apply();
  });
}