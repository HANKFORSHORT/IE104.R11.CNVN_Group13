(function () {
  'use strict';

  function init() {

  var PROFILE = {
    handle: 'oppixelnew246',
    email: 'you@example.com',
    bio: '',
    solved: 0,
    rank: 47158,
    points: 0,
    contribution: 0,
    badges: [],
    achievements: [],
    submissions: {}
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
    // Demo achievements are spread over the months before the current one
    var demoYear = new Date().getFullYear(), demoMonth = new Date().getMonth() + 1;
    [['First solve', 9], ['Graph master', 7], ['Round winner', 5], ['30-day streak', 3], ['Grand Round 1 Champion', 1]]
      .forEach(function (a) {
        var m = Math.max(1, demoMonth - a[1]);
        PROFILE.achievements.push({ name: a[0], date: demoYear + '-' + String(m).padStart(2, '0') + '-01' });
      });
  }

  function $(id) { return document.getElementById(id); }
  // Null-safe text setter: a missing element must never stop the rest of the page rendering.
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  document.title = PROFILE.handle + ' · Astra';
  setText('pf-handle', PROFILE.handle);
  setText('nav-user', PROFILE.handle);   // optional: only exists if the page header has it
  setText('pf-email', PROFILE.email);
  setText('pf-solved', PROFILE.solved);
  setText('pf-rank', '#' + PROFILE.rank);
  setText('pf-points', Number(PROFILE.points).toFixed(2));
  setText('pf-contrib', PROFILE.contribution);
  var bio = $('pf-bio');
  if (bio) {
    bio.textContent = PROFILE.bio || 'You have not shared any information.';
    if (PROFILE.bio) bio.style.fontStyle = 'normal';
  }

  var badges = $('pf-badges') || document.createElement('div');
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
    if (!svg) return;
    out += '<rect width="5" height="5" fill="hsl(' + hue + ',70%,95%)"/>';
    for (var y = 0; y < 5; y++) for (var x = 0; x < 3; x++) {
      if ((h >>> (y * 3 + x)) & 1) {
        out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="hsl(' + hue + ',65%,58%)"/>';
        if (x < 2) out += '<rect x="' + (4 - x) + '" y="' + y + '" width="1" height="1" fill="hsl(' + hue + ',65%,58%)"/>';
      }
    }
    svg.innerHTML = out;
  })();

  /* ---------- Heatmap (53 weeks ending today, weeks start on Sunday) ----------
     Cell size comes from CSS (fractional columns), so JS only places cells and month labels. */
  (function heatmap() {
    var grid = $('pf-grid'), monthsEl = $('pf-months'), tip = $('pf-tip');
    if (!grid || !monthsEl || !tip) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = new Date(today); start.setDate(start.getDate() - 52 * 7 - today.getDay());

    var total = 0, lastMonth = -1, col = 0, marks = [];
    var vals = Object.keys(PROFILE.submissions).map(function (k) { return PROFILE.submissions[k]; });
    var max = Math.max.apply(null, vals.concat([1]));

    for (var d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      var dow = d.getDay();
      if (dow === 0 && d > start) col++;
      var key = iso(d), n = PROFILE.submissions[key] || 0;
      total += n;

      if (dow === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        marks.push({ col: col, name: MONTHS[lastMonth] });
      }

      var cell = document.createElement('div');
      var lv = n <= 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
      cell.className = 'pf-cell lv' + lv;
      cell.dataset.tip = n + ' submission' + (n === 1 ? '' : 's') + ' on ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
      grid.appendChild(cell);
    }

    // A label spans 3 columns: skip it if the next label is closer than that or it would run past the grid
    marks.forEach(function (mark, k) {
      var next = marks[k + 1];
      if ((next && next.col - mark.col < 3) || mark.col > 50) return;
      var m = document.createElement('span');
      m.textContent = mark.name;
      m.style.gridColumn = (mark.col + 1) + ' / span 3';
      monthsEl.appendChild(m);
    });

    var label = total + ' submission' + (total === 1 ? '' : 's');
    setText('pf-heat-title', label + ' in the last year');
    setText('pf-heat-total', total + ' total submissions');

    grid.addEventListener('mouseover', function (e) {
      var t = e.target.closest('.pf-cell'); if (!t) return;
      var r = t.getBoundingClientRect();
      tip.textContent = t.dataset.tip;
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top = r.top + 'px';
      tip.hidden = false;
    });
    grid.addEventListener('mouseleave', function () { tip.hidden = true; });

    // Start scrolled to "today" on narrow screens (no scrolling happens when the grid fits)
    var sc = grid.closest('.pf-heat-scroll'); sc.scrollLeft = sc.scrollWidth;
  })();

  /* ---------- Activity chart: isometric 3D bars drawn as SVG ----------
     One bar per month of the current year (labelled 1-12) standing on a base slab that is turned
     20° off-axis. The scene is projected by hand (orthographic), so faces always line up and the
     chart rebuilds at the real pixel width, which keeps labels readable on phones.
     Up to 5 achievements are pinned to the bar of the month they were earned in. */
  (function activity() {
    var canvas = $('pf-act-canvas'), list = $('pf-act-list'), tip = $('pf-tip');
    if (!canvas || !list || !tip) return;

    var NS = 'http://www.w3.org/2000/svg';
    var now = new Date(), YEAR = now.getFullYear(), NOW_MONTH = now.getMonth();

    var YAW = 20 * Math.PI / 180;      // base turned off-axis (brief: 10-30°)
    var PITCH = 22 * Math.PI / 180;    // camera elevation, so the top faces show
    var SIN_Y = Math.sin(YAW), COS_Y = Math.cos(YAW), SIN_P = Math.sin(PITCH), COS_P = Math.cos(PITCH);

    // World units: one bar is 1 wide and 1 deep
    var BAR_W = 1, BAR_GAP = 0.5, BAR_D = 1, STUB = 0.06;
    var SLAB_PAD = 0.6, SLAB_D = 2.2, SLAB_T = 0.45;
    var SLAB_LEN = SLAB_PAD * 2 + 12 * BAR_W + 11 * BAR_GAP;
    var BAR_Z = (SLAB_D - BAR_D) / 2;

    var MAX_PINS = 5, COMPACT_BELOW = 640, MAX_UNIT_PX = 42, LABEL_GAP = 14;

    /* --- data --- */
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    Object.keys(PROFILE.submissions).forEach(function (key) {
      var month = Number(key.slice(5, 7)) - 1;
      if (key.slice(0, 4) === String(YEAR) && month >= 0 && month < 12) counts[month] += PROFILE.submissions[key];
    });
    var total = counts.reduce(function (a, b) { return a + b; }, 0);
    var maxCount = Math.max.apply(null, counts.concat([1]));
    var peak = counts.indexOf(Math.max.apply(null, counts));

    var pins = PROFILE.achievements.slice(0, MAX_PINS).map(function (a, i) {
      var date = String(a.date || '');
      return {
        name: a.name,
        href: a.href || 'achievements.html',
        number: i + 1,
        month: date.slice(0, 4) === String(YEAR) ? Number(date.slice(5, 7)) - 1 : -1,
        tip: a.name + (date ? ' · ' + MONTHS[Number(date.slice(5, 7)) - 1] + ' ' + Number(date.slice(8, 10)) + ', ' + date.slice(0, 4) : '')
      };
    }).filter(function (p) { return p.month >= 0 && p.month < 12; });

    // Pins that share a month are spread across that bar's top face
    var perMonth = {}, placed = {};
    pins.forEach(function (p) { perMonth[p.month] = (perMonth[p.month] || 0) + 1; });
    pins.forEach(function (p) {
      var count = perMonth[p.month], index = placed[p.month] || 0;
      placed[p.month] = index + 1;
      p.offset = (index - (count - 1) / 2) * Math.min(0.3, 0.8 / count);
    });

    /* --- static text --- */
    var summary = total ? total + ' submissions · peak ' + MONTHS[peak] + ' (' + counts[peak] + ')' : 'No submissions yet';
    var chartLabel = 'Submissions per month in ' + YEAR + ': ' + counts.map(function (n, i) { return MONTHS[i] + ' ' + n; }).join(', ');
    setText('pf-act-title', 'Submissions per month · ' + YEAR);
    setText('pf-act-summary', summary);
    setText('pf-act-note', pins.length ? 'Pinned: ' + pins.length + ' most notable achievement' + (pins.length === 1 ? '' : 's') : 'This user has not unlocked any achievements this year.');

    // Phone layout lists the pinned achievements below the chart instead of labelling them on it
    pins.forEach(function (p) {
      var li = document.createElement('li'), a = document.createElement('a'), num = document.createElement('span');
      num.className = 'pf-act-list-num';
      num.textContent = p.number;
      a.href = p.href;
      a.textContent = p.name;
      li.appendChild(num);
      li.appendChild(a);
      list.appendChild(li);
    });

    /* --- geometry --- */
    // y is up, z points away from the viewer, and the far (right) end of the slab recedes
    function project(x, y, z) {
      var depth = z * COS_Y + x * SIN_Y;
      return { x: x * COS_Y - z * SIN_Y, y: -(y * COS_P + depth * SIN_P) };
    }

    function svgEl(name, attrs, parent) {
      var el = document.createElementNS(NS, name);
      Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      if (parent) parent.appendChild(el);
      return el;
    }

    function shorten(text, max) {
      return text.length > max ? text.slice(0, max - 1).replace(/\s+$/, '') + '…' : text;
    }

    function render() {
      var width = Math.floor(canvas.clientWidth);
      if (width < 160) return;                       // panel hidden or not laid out yet
      var compact = width < COMPACT_BELOW;
      var maxHeight = compact ? 6 : 4;

      var bars = counts.map(function (n, i) {
        return {
          index: i,
          count: n,
          future: i > NOW_MONTH,
          x0: SLAB_PAD + i * (BAR_W + BAR_GAP),
          h: Math.max(STUB, n / maxCount * maxHeight)
        };
      });

      // Fit the projected scene into the available width
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      function grow(x, y, z) {
        var p = project(x, y, z);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      [0, SLAB_LEN].forEach(function (x) {
        [0, SLAB_D].forEach(function (z) { [-SLAB_T, 0].forEach(function (y) { grow(x, y, z); }); });
      });
      bars.forEach(function (b) {
        [b.x0, b.x0 + BAR_W].forEach(function (x) {
          [BAR_Z, BAR_Z + BAR_D].forEach(function (z) { grow(x, b.h, z); });
        });
      });

      var padX = 12, topArea = compact ? 34 : 80, bottomArea = 34;
      var scale = Math.min((width - padX * 2) / (maxX - minX), MAX_UNIT_PX);
      var height = Math.ceil((maxY - minY) * scale + topArea + bottomArea);
      var ox = (width - (maxX - minX) * scale) / 2 - minX * scale;
      var oy = topArea - minY * scale;

      function at(x, y, z) {
        var p = project(x, y, z);
        return { x: ox + p.x * scale, y: oy + p.y * scale };
      }

      function poly(cls, pts, parent) {
        var points = pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
        return svgEl('polygon', { 'class': cls, points: points }, parent);
      }

      canvas.textContent = '';
      var svg = svgEl('svg', {
        'class': 'pf-act-svg', width: width, height: height,
        viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': chartLabel
      }, canvas);

      // Base slab (visible faces: top, front, left end)
      var slab = svgEl('g', {}, svg);
      poly('pf-face pf-slab-left', [at(0, -SLAB_T, 0), at(0, -SLAB_T, SLAB_D), at(0, 0, SLAB_D), at(0, 0, 0)], slab);
      poly('pf-face pf-slab-front', [at(0, -SLAB_T, 0), at(SLAB_LEN, -SLAB_T, 0), at(SLAB_LEN, 0, 0), at(0, 0, 0)], slab);
      poly('pf-face pf-slab-top', [at(0, 0, 0), at(SLAB_LEN, 0, 0), at(SLAB_LEN, 0, SLAB_D), at(0, 0, SLAB_D)], slab);

      // Bars, farthest (right) first so nearer bars paint over them
      bars.slice().reverse().forEach(function (b) {
        var x0 = b.x0, x1 = b.x0 + BAR_W, z0 = BAR_Z, z1 = BAR_Z + BAR_D, y1 = b.h;
        var g = svgEl('g', {
          'class': 'pf-bar' + (b.future ? ' pf-bar--future' : ''),
          'data-tip': MONTHS[b.index] + ' ' + YEAR + ' · ' + b.count + ' submission' + (b.count === 1 ? '' : 's')
        }, svg);
        poly('pf-face pf-face--left', [at(x0, 0, z0), at(x0, 0, z1), at(x0, y1, z1), at(x0, y1, z0)], g);
        poly('pf-face pf-face--front', [at(x0, 0, z0), at(x1, 0, z0), at(x1, y1, z0), at(x0, y1, z0)], g);
        poly('pf-face pf-face--top', [at(x0, y1, z0), at(x1, y1, z0), at(x1, y1, z1), at(x0, y1, z1)], g);
      });

      // Month numbers 1-12 under the front edge of the slab
      bars.forEach(function (b) {
        var p = at(b.x0 + BAR_W / 2, -SLAB_T, 0);
        var t = svgEl('text', {
          'class': 'pf-act-tick' + (b.index === NOW_MONTH ? ' is-now' : ''),
          x: p.x.toFixed(1), y: (p.y + 17).toFixed(1)
        }, svg);
        t.textContent = String(b.index + 1);
      });

      // Achievement pins, anchored at the centre of each bar's top face
      var items = pins.map(function (p) {
        var b = bars[p.month], pt = at(b.x0 + BAR_W / 2 + p.offset, b.h, BAR_Z + BAR_D / 2);
        return { pin: p, x: pt.x, y: pt.y };
      }).sort(function (a, b) { return a.x - b.x; });

      list.hidden = !(compact && items.length);

      if (compact) {
        items.forEach(function (it) {
          var a = svgEl('a', { 'class': 'pf-act-item', href: it.pin.href, 'aria-label': it.pin.name, 'data-tip': it.pin.tip }, svg);
          svgEl('line', { 'class': 'pf-act-stem', x1: it.x.toFixed(1), y1: (it.y - 10).toFixed(1), x2: it.x.toFixed(1), y2: it.y.toFixed(1) }, a);
          svgEl('circle', { 'class': 'pf-act-pin', cx: it.x.toFixed(1), cy: (it.y - 10).toFixed(1), r: 8 }, a);
          var num = svgEl('text', { 'class': 'pf-act-pin-num', x: it.x.toFixed(1), y: (it.y - 10).toFixed(1) }, a);
          num.textContent = String(it.pin.number);
        });
        return;
      }

      if (!items.length) return;

      // Wide layout: name on a rule across the top, a stem drops to the bar. Names are shortened
      // until all of them fit side by side, then nudged apart so they never overlap.
      var ruleY = 24, avail = width - padX * 2, maxChars = 18, widths, need;
      items.forEach(function (it) {
        it.link = svgEl('a', { 'class': 'pf-act-item', href: it.pin.href, 'aria-label': it.pin.name, 'data-tip': it.pin.tip }, svg);
        it.hit = svgEl('rect', { 'class': 'pf-act-hit', y: 0, height: ruleY + 4 }, it.link);
        it.rule = svgEl('line', { 'class': 'pf-act-rule', y1: ruleY, y2: ruleY }, it.link);
        it.stem = svgEl('line', { 'class': 'pf-act-stem', y1: ruleY, x1: it.x.toFixed(1), x2: it.x.toFixed(1), y2: it.y.toFixed(1) }, it.link);
        svgEl('circle', { 'class': 'pf-act-pin', cx: it.x.toFixed(1), cy: it.y.toFixed(1), r: 4.5 }, it.link);
        it.text = svgEl('text', { 'class': 'pf-act-label', y: 16 }, it.link);
      });

      do {
        items.forEach(function (it) { it.text.textContent = shorten(it.pin.name, maxChars); });
        widths = items.map(function (it) { return it.text.getComputedTextLength() + 8; });
        need = widths.reduce(function (a, b) { return a + b; }, 0) + LABEL_GAP * (items.length - 1);
      } while (need > avail && --maxChars >= 6);

      var left = items.map(function (it, k) { return it.x - widths[k] / 2; });
      left.forEach(function (_, k) {
        var min = k ? left[k - 1] + widths[k - 1] + LABEL_GAP : padX;
        if (left[k] < min) left[k] = min;
      });
      for (var k = items.length - 1; k >= 0; k--) {
        var limit = (k < items.length - 1 ? left[k + 1] - LABEL_GAP : width - padX) - widths[k];
        if (left[k] > limit) left[k] = limit;
      }

      items.forEach(function (it, j) {
        var right = left[j] + widths[j];
        it.text.setAttribute('x', (left[j] + widths[j] / 2).toFixed(1));
        it.hit.setAttribute('x', left[j].toFixed(1));
        it.hit.setAttribute('width', widths[j].toFixed(1));
        it.rule.setAttribute('x1', Math.min(left[j], it.x).toFixed(1));
        it.rule.setAttribute('x2', Math.max(right, it.x).toFixed(1));
        var full = svgEl('title', {}, it.link);
        full.textContent = it.pin.name;
      });
    }

    /* --- tooltip, shared with the heatmap --- */
    function showTip(target) {
      var r = target.getBoundingClientRect();
      tip.textContent = target.getAttribute('data-tip');
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top = r.top + 'px';
      tip.hidden = false;
    }
    function hideTip() { tip.hidden = true; }

    canvas.addEventListener('mouseover', function (e) {
      var t = e.target.closest('[data-tip]');
      if (t) showTip(t); else hideTip();
    });
    canvas.addEventListener('mouseleave', hideTip);
    canvas.addEventListener('focusin', function (e) {
      var t = e.target.closest('[data-tip]');
      if (t) showTip(t);
    });
    canvas.addEventListener('focusout', hideTip);

    /* --- rebuild when the width changes (resize, rotate, tab shown) or web fonts finish loading --- */
    var lastWidth = 0, queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var w = Math.floor(canvas.clientWidth);
        if (w !== lastWidth) { lastWidth = w; render(); }
      });
    }
    if (typeof ResizeObserver === 'function') new ResizeObserver(schedule).observe(canvas);
    else window.addEventListener('resize', schedule);

    lastWidth = Math.floor(canvas.clientWidth);
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  })();

  /* ---------- Tabs ---------- */
  var tabs = document.querySelectorAll('.pf-tab[data-tab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { var on = t === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
      document.querySelectorAll('.pf-panel').forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
    });
  });
  // Diagnostics: tell the developer which expected elements are missing from the page
  ['pf-handle','pf-email','pf-solved','pf-rank','pf-points','pf-contrib','pf-bio','pf-badges','pf-heat-title','pf-grid','pf-months','pf-tip','pf-heat-total','pf-act-canvas','pf-act-list']
    .forEach(function (id) { if (!$(id)) console.warn('[profile.js] missing element #' + id); });

  } // end init

  // Works whether the <script> sits in <head>, at the end of <body>, or is loaded with defer
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
