(function () {
  const norm = (s) =>
    (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  function init(bar) {
    const target = document.querySelector(bar.dataset.filterTable);
    if (!target) return;

    const search = bar.querySelector("[data-filter-search]");
    const selects = bar.querySelectorAll("[data-filter]");
    const applyBtn = bar.querySelector("[data-filter-apply]");
    const empty = target.querySelector("[data-filter-empty]");
    const live = bar.hasAttribute("data-filter-live");

    const getItems = () =>
      Array.from(target.children).filter((el) => !el.hasAttribute("data-filter-empty"));

    function matchSelect(item, sel) {
      const val = sel.value;
      if (val === "any" || val === "") return true;
      const raw = item.dataset[sel.dataset.filter];
      if (raw === undefined) return false;

      if (sel.dataset.filterType === "range") {
        const [min, max] = val.split("-").map(Number);
        const n = Number(raw);
        return n >= min && n <= max;
      }
      return norm(raw) === norm(val);
    }

    function apply() {
      const q = norm(search ? search.value : "");
      const field = search ? search.dataset.filterField : null;
      let visible = 0;

      getItems().forEach((item) => {
        const haystack = field ? item.dataset[field] : item.textContent;
        const okSearch = !q || norm(haystack).includes(q);
        const okSelect = Array.from(selects).every((s) => matchSelect(item, s));
        const show = okSearch && okSelect;
        item.hidden = !show;
        if (show) visible++;
      });

      if (empty) empty.hidden = visible > 0;
    }

    // Chỉ lọc khi bấm nút Filter hoặc nhấn Enter trong ô tìm kiếm
    if (applyBtn) applyBtn.addEventListener("click", (e) => { e.preventDefault(); apply(); });
    bar.addEventListener("submit", (e) => { e.preventDefault(); apply(); });
    if (search) {
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); apply(); }
      });
    }

    // Tùy chọn: lọc tức thì nếu thanh lọc có data-filter-live
    if (live) {
      if (search) search.addEventListener("input", apply);
      selects.forEach((s) => s.addEventListener("change", apply));
    }

    apply(); // lần đầu hiển thị tất cả
  }

  function boot() {
    document.querySelectorAll("[data-filter-table]").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();