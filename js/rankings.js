/* [EDIT] rankings.js — sort, filter (Apply / Reset), chip bộ lọc, phân trang.
   Bản này thêm: (1) Friends chỉ hiện khi đã đăng nhập, (2) scope Country đổi bảng sang
   xếp hạng theo quốc gia (tổng rating, tổng solved, số competitor).
   Dữ liệu bên dưới là dữ liệu mẫu — thay bằng dữ liệu thật từ server khi có. */
(function () {
  'use strict';

  const PAGE_SIZE = 5;
  const DEFAULTS = { scope: 'global', q: '', period: 's04', region: 'all' };
  const PERIOD_LABELS = { s04: 'Season 04', s03: 'Season 03', all: 'All time' };
  const REGION_LABELS = { all: 'All regions', vietnam: 'Vietnam', apac: 'Asia Pacific', europe: 'Europe' };
  const SCOPE_LABELS = { global: 'Global', friends: 'Friends', country: 'Country' };
  const FIRST_DIR = { rank: 'asc', name: 'asc', rating: 'desc', solved: 'desc', change: 'desc' };
  const COUNTRY_CODES = {
    'Vietnam': 'VN', 'Japan': 'JP', 'South Korea': 'KR', 'Singapore': 'SG',
    'Poland': 'PL', 'India': 'IN', 'Thailand': 'TH', 'Germany': 'DE'
  };

  /* ---------- Đăng nhập ---------- */
  // [EDIT] Dùng đúng khóa phiên mà auth.js ghi khi đăng nhập: localStorage "astra-session" = {"identifier": "..."}.
  // (main.js cũng đọc khóa này để đổi header.) Khi có backend thì thay bằng kiểm tra phiên thật.
  const SESSION_KEY = 'astra-session';
  function isLoggedIn() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      return Boolean(session && session.identifier);
    } catch (e) {
      return false; // chưa có phiên, JSON hỏng hoặc trình duyệt chặn storage
    }
  }

  /* ---------- Dữ liệu mẫu ---------- */
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

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const form = $('ranking-filter');
  const body = $('ranking-body');
  if (!form || !body) return;
  const podium = $('ranking-podium');
  const chipsEl = $('filter-chips');
  const statusEl = $('filter-status');
  const countEl = $('ranking-count');
  const pageStatus = $('page-status');
  const prevBtn = $('page-prev');
  const nextBtn = $('page-next');
  const sortStatus = $('sort-status');
  const seasonNote = $('season-note');
  const captionEl = $('ranking-caption');
  const searchLabel = $('search-label');
  const searchInput = $('ranking-search');
  const headCells = document.querySelectorAll('#ranking-table thead th');
  const sortBtns = document.querySelectorAll('#ranking-table .sort-btn');
  const authOnly = form.querySelectorAll('[data-requires-auth]');

  /* ---------- State ---------- */
  let applied = Object.assign({}, DEFAULTS);
  let sort = { key: 'rank', dir: 'asc' };
  let page = 1;
  let meterMax = 3200;

  /* ---------- Helpers ---------- */
  const fmt = (n) => n.toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const profileLink = (handle) => 'public-profile.html?user=' + encodeURIComponent(handle);
  const isCountryMode = () => applied.scope === 'country';

  function readForm() {
    return {
      scope: form.elements.scope.value,
      q: form.elements.q.value.trim(),
      period: form.elements.period.value,
      region: form.elements.region.value
    };
  }
  function writeForm(v) {
    form.elements.scope.value = v.scope;
    form.elements.q.value = v.q;
    form.elements.period.value = v.period;
    form.elements.region.value = v.region;
    syncSearchHint();
  }
  const same = (a, b) => Object.keys(DEFAULTS).every((k) => a[k] === b[k]);

  /* ---------- Đăng nhập: ẩn / hiện Friends ---------- */
  function refreshAuth() {
    const logged = isLoggedIn();
    authOnly.forEach((el) => { el.hidden = !logged; });
    if (logged) return;
    if (form.elements.scope.value === 'friends') form.elements.scope.value = 'global';
    if (applied.scope === 'friends') {
      applied.scope = 'global';
      page = 1;
      render();
    }
  }

  // Nhãn + gợi ý ô tìm kiếm đổi theo scope đang chọn
  function syncSearchHint() {
    const country = form.elements.scope.value === 'country';
    searchLabel.textContent = country ? 'Country' : 'Competitor';
    searchInput.placeholder = country ? 'Country name' : 'Handle, name or city';
  }

  /* ---------- Data pipeline ---------- */
  const regionOk = (c, region) =>
    region === 'all' ||
    (region === 'vietnam' && c.country === 'Vietnam') ||
    (region === 'apac' && c.region === 'apac') ||
    (region === 'europe' && c.region === 'europe');

  // Trả về danh sách dòng đã xếp hạng theo rating (giảm dần).
  // kind 'person': 1 dòng / competitor. kind 'country': tổng hợp theo quốc gia.
  function getRows() {
    const f = applied;
    const q = f.q.toLowerCase();
    let rows;

    if (f.scope === 'country') {
      const map = new Map();
      COMPETITORS.filter((c) => regionOk(c, f.region)).forEach((c) => {
        const s = c.stats[f.period];
        let e = map.get(c.country);
        if (!e) {
          e = {
            kind: 'country', title: c.country,
            initials: COUNTRY_CODES[c.country] || c.country.slice(0, 2).toUpperCase(),
            rating: 0, solved: 0, extra: 0, topHandle: c.handle, topRating: -1
          };
          map.set(c.country, e);
        }
        e.rating += s.rating;
        e.solved += s.solved;
        e.extra += 1; // số competitor
        if (s.rating > e.topRating) { e.topRating = s.rating; e.topHandle = c.handle; }
      });
      rows = Array.from(map.values()).filter((e) => !q || e.title.toLowerCase().includes(q));
    } else {
      rows = COMPETITORS.filter((c) => {
        if (f.scope === 'friends' && !c.friend) return false;
        if (!regionOk(c, f.region)) return false;
        if (q && !(c.handle + ' ' + (c.name || '') + ' ' + c.place).toLowerCase().includes(q)) return false;
        return true;
      }).map((c) => {
        const s = c.stats[f.period];
        return { kind: 'person', c, title: c.handle, initials: c.initials, rating: s.rating, solved: s.solved, extra: s.change };
      });
    }

    rows.sort((a, b) => b.rating - a.rating);
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  }

  const ACCESSORS = {
    rank: (r) => r.rank,
    name: (r) => r.title.toLowerCase(),
    rating: (r) => r.rating,
    solved: (r) => r.solved,
    change: (r) => r.extra // người: thay đổi hạng; quốc gia: số competitor
  };
  function sortRows(rows) {
    const get = ACCESSORS[sort.key];
    const m = sort.dir === 'asc' ? 1 : -1;
    return rows.slice().sort((a, b) => {
      const x = get(a), y = get(b);
      if (x === null && y === null) return a.rank - b.rank;
      if (x === null) return 1;          // giá trị rỗng luôn nằm cuối
      if (y === null) return -1;
      const d = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return d !== 0 ? d * m : a.rank - b.rank;
    });
  }

  /* ---------- Render ---------- */
  function changeHTML(v) {
    if (v === null) return '<span class="trend trend-none" aria-label="Not available">—</span>';
    if (v > 0) return '<span class="trend trend-up"><span class="sr-only">Up </span>+' + v + '</span>';
    if (v < 0) return '<span class="trend trend-down"><span class="sr-only">Down </span>−' + Math.abs(v) + '</span>';
    return '<span class="trend trend-flat"><span class="sr-only">No change </span>0</span>';
  }

  function rowHTML(r) {
    const country = r.kind === 'country';
    const cls = (k, extra) => {
      const list = [extra, sort.key === k ? 'is-sorted' : ''].filter(Boolean).join(' ');
      return list ? ' class="' + list + '"' : '';
    };
    const nameCell = country
      ? '<span class="user-avatar is-country" aria-hidden="true">' + esc(r.initials) + '</span>' +
        '<span><span class="user-name">' + esc(r.title) + '</span>' +
        '<span class="user-country">Top: <a href="' + profileLink(r.topHandle) + '">' + esc(r.topHandle) + '</a></span></span>'
      : '<span class="user-avatar" aria-hidden="true">' + esc(r.initials) + '</span>' +
        '<span><span class="user-name"><a href="' + profileLink(r.c.handle) + '">' + esc(r.c.handle) + '</a></span>' +
        '<span class="user-country">' + esc(r.c.place) + '</span></span>';
    return '<tr>' +
      '<td' + cls('rank', 'rank-number') + '>' + pad(r.rank) + '</td>' +
      '<td' + cls('name') + '><div class="user-cell">' + nameCell + '</div></td>' +
      '<td' + cls('rating', 'col-num') + '><span class="rating-cell">' +
        '<progress class="rating-meter" max="' + meterMax + '" value="' + r.rating + '" aria-hidden="true"></progress>' +
        '<span class="rating">' + fmt(r.rating) + '</span></span></td>' +
      '<td' + cls('solved', 'col-num solved') + '>' + fmt(r.solved) + '</td>' +
      '<td' + cls('change', 'col-num') + '>' + (country ? '<span class="solved">' + r.extra + '</span>' : changeHTML(r.extra)) + '</td>' +
      '</tr>';
  }

  function renderBody(slice) {
    if (!slice.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="5">' +
        '<p>' + (isCountryMode() ? 'No countries match these filters.' : 'No competitors match these filters.') + '</p>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-action="reset">Reset filters</button>' +
        '</td></tr>';
      return;
    }
    body.innerHTML = slice.map(rowHTML).join('');
  }

  function renderPodium(top) {
    const country = isCountryMode();
    podium.hidden = top.length === 0;
    podium.setAttribute('aria-label', country ? 'Top three countries' : 'Top three competitors');
    podium.innerHTML = top.map((r) => {
      const title = country
        ? esc(r.title)
        : '<a href="' + profileLink(r.c.handle) + '">' + esc(r.c.handle) + '</a>';
      const sub = country
        ? r.extra + (r.extra === 1 ? ' competitor' : ' competitors')
        : (r.c.name ? r.c.name + ' · ' + r.c.country : r.c.place);
      return '<article class="podium-card">' +
        '<span class="podium-rank">' + pad(r.rank) + '</span>' +
        '<div><h2>' + title + '</h2>' +
        '<p class="podium-handle">' + esc(sub) + '</p></div>' +
        '<div class="podium-score"><strong>' + fmt(r.rating) + '</strong><span>' + (country ? 'total rating' : 'rating') + '</span></div>' +
        '</article>';
    }).join('');
  }

  function renderHead() {
    const country = isCountryMode();
    sortBtns.forEach((btn) => {
      const label = (country && btn.dataset.labelCountry) || btn.dataset.label;
      btn.querySelector('.sort-label').textContent = label;
    });
    headCells.forEach((th) => {
      const key = th.dataset.col;
      th.setAttribute('aria-sort', key === sort.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    });
    captionEl.textContent = country
      ? 'Astra country rankings by total rating. Use the column headers to sort.'
      : 'Astra competitor rankings. Use the column headers to sort.';
  }

  function renderChips() {
    const f = applied;
    const items = [];
    if (f.scope !== DEFAULTS.scope) items.push(['scope', 'Scope: ' + SCOPE_LABELS[f.scope]]);
    if (f.period !== DEFAULTS.period) items.push(['period', 'Period: ' + PERIOD_LABELS[f.period]]);
    if (f.region !== DEFAULTS.region) items.push(['region', 'Region: ' + REGION_LABELS[f.region]]);
    if (f.q) items.push(['q', 'Search: “' + f.q + '”']);
    chipsEl.hidden = items.length === 0;
    chipsEl.innerHTML = items.map(([key, label]) =>
      '<li><button type="button" class="chip" data-clear="' + key + '" aria-label="Remove filter: ' + esc(label) + '">' +
      '<span>' + esc(label) + '</span>' +
      '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"/></svg></button></li>'
    ).join('');
  }

  function renderFooter(total, start, shown, pages) {
    const noun = isCountryMode() ? 'countries' : 'competitors';
    countEl.textContent = total === 0
      ? 'No ' + noun + ' to show'
      : 'Showing ' + (start + 1) + '–' + (start + shown) + ' of ' + total + ' ' + noun;
    pageStatus.textContent = 'Page ' + page + ' of ' + pages;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= pages;
  }

  function updateStatus() {
    statusEl.textContent = same(readForm(), applied)
      ? ''
      : 'You have changes that are not applied yet. Select “Apply filters”.';
    statusEl.classList.toggle('is-dirty', statusEl.textContent !== '');
  }

  function render() {
    const rows = getRows();
    meterMax = isCountryMode() ? Math.max(1, rows.length ? rows[0].rating : 1) : 3200;
    const sorted = sortRows(rows);
    const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    page = Math.min(Math.max(page, 1), pages);
    const start = (page - 1) * PAGE_SIZE;
    const slice = sorted.slice(start, start + PAGE_SIZE);

    renderPodium(rows.slice(0, 3));
    renderBody(slice);
    renderHead();
    renderChips();
    renderFooter(sorted.length, start, slice.length, pages);
    updateStatus();
    seasonNote.textContent = PERIOD_LABELS[applied.period] + ' · Updated 2m ago';
  }

  /* ---------- Events ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    applied = readForm();
    page = 1;
    render();
  });
  form.addEventListener('input', updateStatus);
  form.addEventListener('change', () => { syncSearchHint(); updateStatus(); });

  function resetFilters() {
    writeForm(DEFAULTS);
    applied = Object.assign({}, DEFAULTS);
    page = 1;
    render();
  }
  $('filter-reset').addEventListener('click', resetFilters);
  body.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="reset"]')) resetFilters();
  });

  chipsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-clear]');
    if (!btn) return;
    const key = btn.dataset.clear;
    // Bỏ một bộ lọc: các ô đang sửa dở khác cũng được đồng bộ về giá trị đã apply
    const next = Object.assign({}, applied, { [key]: DEFAULTS[key] });
    writeForm(next);
    applied = next;
    page = 1;
    render();
  });

  document.querySelector('#ranking-table thead').addEventListener('click', (e) => {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;
    const key = btn.dataset.sort;
    if (sort.key === key) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
    else sort = { key, dir: FIRST_DIR[key] };
    page = 1;
    render();
    sortStatus.textContent = 'Sorted by ' + btn.querySelector('.sort-label').textContent + ', ' +
      (sort.dir === 'asc' ? 'ascending' : 'descending');
  });

  prevBtn.addEventListener('click', () => { page -= 1; render(); });
  nextBtn.addEventListener('click', () => { page += 1; render(); });

  // [EDIT] Đăng nhập / đăng xuất ở tab khác thì cập nhật Friends ngay
  window.addEventListener('storage', (e) => { if (!e.key || e.key === SESSION_KEY) refreshAuth(); });

  refreshAuth();
  syncSearchHint();
  render();
})();