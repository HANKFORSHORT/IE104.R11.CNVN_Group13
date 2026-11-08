document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-filter-table]").forEach(initFilterBar);
});

function initFilterBar(bar) {
  const tbody = document.querySelector(bar.dataset.filterTable);
  if (!tbody) return;

  const selects  = bar.querySelectorAll("select[data-filter]");
  const searchIn = bar.querySelector("[data-filter-search]");
  const applyBtn = bar.querySelector("[data-filter-apply]");
  const emptyRow = tbody.querySelector("[data-filter-empty], #emptyRow");
  const rows     = [...tbody.querySelectorAll("tr")].filter(tr => tr !== emptyRow);

  function apply() {
    const keyword = searchIn ? searchIn.value.trim().toLowerCase() : "";
    let visible = 0;

    rows.forEach(row => {
      // mỗi select: data-filter="format" so với row.dataset.format
      const okSelects = [...selects].every(sel => {
        const val = sel.value;
        return val === "any" || val === "" || row.dataset[sel.dataset.filter] === val;
      });
      const okSearch = row.textContent.toLowerCase().includes(keyword);

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