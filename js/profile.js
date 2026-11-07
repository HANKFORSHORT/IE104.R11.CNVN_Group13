/* Astra · profile page. Vanilla JS, no dependencies.
   Edit PROFILE below (or load it from your backend) – everything else renders from it. */
(function () {
  'use strict';

  var PROFILE = {
    handle: 'oppixelnew246',
    email: 'you@example.com',
    bio: '',                       // empty -> "You have not shared any information."
    solved: 0,
    rank: 47158,
    points: 0,
    contribution: 0,
    badges: [],                    // e.g. [{ icon: '🏆', name: 'Round 1 Winner' }]
    submissions: {}                // { 'YYYY-MM-DD': count }
  };

  // Preview with fake activity: profile.html?demo=1
  if (/[?&]demo=1\b/.test(location.search)) {
    PROFILE.solved = 42; PROFILE.points = 1234.5; PROFILE.contribution = 7;
    PROFILE.bio = 'Competitive programmer. Likes graphs and DP.';
    PROFILE.badges = [{ icon: '🏆', name: 'Round winner' }, { icon: '🔥', name: '30-day streak' }];
    var seed = 7;
    for (var i = 0; i < 365; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      var r = seed / 233280;
      if (r > 0.62) {
        var d = new Date(); d.setDate(d.getDate() - i);
        PROFILE.submissions[iso(d)] = Math.floor(r * 12) - 6;
      }
    }
  }

  function $(id) { return document.getElementById(id); }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* ---------- Sidebar + text ---------- */
  document.title = PROFILE.handle + ' · Astra';
  $('pf-handle').textContent = PROFILE.handle;
  $('nav-user').textContent = PROFILE.handle;
  $('pf-email').textContent = PROFILE.email;
  $('pf-solved').textContent = PROFILE.solved;
  $('pf-rank').textContent = '#' + PROFILE.rank;
  $('pf-points').textContent = Number(PROFILE.points).toFixed(2);
  $('pf-contrib').textContent = PROFILE.contribution;
  $('pf-bio').textContent = PROFILE.bio || 'You have not shared any information.';
  if (PROFILE.bio) $('pf-bio').style.fontStyle = 'normal';

  /* ---------- Badges ---------- */
  var badges = $('pf-badges');
  if (!PROFILE.badges.length) {
    badges.innerHTML = '<em>This user has not earned any badges or awards.</em>';
  } else {
    PROFILE.badges.forEach(function (b) {
      var s = document.createElement('span');
      s.className = 'pf-badge';
      s.textContent = (b.icon || '★') + ' ' + b.name;
      badges.appendChild(s);
    });
  }

  /* ---------- Identicon avatar (symmetric 5x5, derived from handle) ---------- */
  (function avatar() {
    var h = 2166136261;
    for (var i = 0; i < PROFILE.handle.length; i++) { h ^= PROFILE.handle.charCodeAt(i); h = Math.imul(h, 16777619); }
    var hue = Math.abs(h) % 360, svg = $('pf-avatar'), out = '';
    out += '<rect width="5" height="5" fill="hsl(' + hue + ',70%,95%)"/>';
    for (var y = 0; y < 5; y++) for (var x = 0; x < 3; x++) {
      if ((h >>> (y * 3 + x)) & 1) {
        out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="hsl(' + hue + ',65%,58%)"/>';
        if (x < 2) out += '<rect x="' + (4 - x) + '" y="' + y + '" width="1" height="1" fill="hsl(' + hue + ',65%,58%)"/>';
      }
    }
    svg.innerHTML = out;
  })();

  /* ---------- Heatmap (53 weeks ending today, weeks start on Sunday) ---------- */
  (function heatmap() {
    var grid = $('pf-grid'), monthsEl = $('pf-months'), tip = $('pf-tip');
    var CELL = 14, GAP = 6, STEP = CELL + GAP;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = new Date(today); start.setDate(start.getDate() - 52 * 7 - today.getDay());

    var total = 0, lastMonth = -1, col = 0;
    var vals = Object.keys(PROFILE.submissions).map(function (k) { return PROFILE.submissions[k]; });
    var max = Math.max.apply(null, vals.concat([1]));

    for (var d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      var dow = d.getDay();
      if (dow === 0 && d > start) col++;
      var key = iso(d), n = PROFILE.submissions[key] || 0;
      total += n;

      if (dow === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        var m = document.createElement('span');
        m.textContent = MONTHS[lastMonth];
        m.style.left = (col * STEP) + 'px';
        monthsEl.appendChild(m);
      }

      var cell = document.createElement('div');
      var lv = n <= 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
      cell.className = 'pf-cell lv' + lv;
      cell.dataset.tip = n + ' submission' + (n === 1 ? '' : 's') + ' on ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
      grid.appendChild(cell);
    }
    monthsEl.style.height = '18px';

    var label = total + ' submission' + (total === 1 ? '' : 's');
    $('pf-heat-title').textContent = label + ' in the last year';
    $('pf-heat-total').textContent = total + ' total submissions';

    grid.addEventListener('mouseover', function (e) {
      var t = e.target.closest('.pf-cell'); if (!t) return;
      var r = t.getBoundingClientRect();
      tip.textContent = t.dataset.tip;
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top = r.top + 'px';
      tip.hidden = false;
    });
    grid.addEventListener('mouseleave', function () { tip.hidden = true; });

    // Start scrolled to "today" on narrow screens
    var sc = grid.closest('.pf-heat-scroll'); sc.scrollLeft = sc.scrollWidth;
  })();

  /* ---------- Tabs ---------- */
  var tabs = document.querySelectorAll('.pf-tab[data-tab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { var on = t === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
      document.querySelectorAll('.pf-panel').forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
    });
  });
})();
