document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-filter-table]").forEach(initFilterBar);
});

function initFilterBar(bar) {
<<<<<<< HEAD
  const container = document.querySelector(bar.dataset.filterTable);
  if (!container) return;
=======
<<<<<<< HEAD
  const tbody = document.querySelector(bar.dataset.filterTable);
  if (!tbody) return;
=======
  const container = document.querySelector(bar.dataset.filterTable);
  if (!container) return;
>>>>>>> 008eb5f0fa2eb556816a008296e99c109d0e3ddc
>>>>>>> 5269a04b9470258028e8aced7f3010e981905b15

  const selects  = bar.querySelectorAll("select[data-filter]");
  const searchIn = bar.querySelector("[data-filter-search]");
  const applyBtn = bar.querySelector("[data-filter-apply]");
<<<<<<< HEAD
=======
<<<<<<< HEAD
  const emptyRow = tbody.querySelector("[data-filter-empty], #emptyRow");
  const rows     = [...tbody.querySelectorAll("tr")].filter(tr => tr !== emptyRow);
=======
>>>>>>> 5269a04b9470258028e8aced7f3010e981905b15
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
<<<<<<< HEAD
=======
>>>>>>> 008eb5f0fa2eb556816a008296e99c109d0e3ddc
>>>>>>> 5269a04b9470258028e8aced7f3010e981905b15

  function apply() {
    const keyword = searchIn ? searchIn.value.trim().toLowerCase() : "";
    let visible = 0;

    rows.forEach(row => {
<<<<<<< HEAD
      const okSelects = [...selects].every(sel => matchSelect(sel, row));
      const okSearch  = row.textContent.toLowerCase().includes(keyword);
=======
<<<<<<< HEAD
      // mỗi select: data-filter="format" so với row.dataset.format
      const okSelects = [...selects].every(sel => {
        const val = sel.value;
        return val === "any" || val === "" || row.dataset[sel.dataset.filter] === val;
      });
      const okSearch = row.textContent.toLowerCase().includes(keyword);
=======
      const okSelects = [...selects].every(sel => matchSelect(sel, row));
      const okSearch  = row.textContent.toLowerCase().includes(keyword);
>>>>>>> 008eb5f0fa2eb556816a008296e99c109d0e3ddc
>>>>>>> 5269a04b9470258028e8aced7f3010e981905b15

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