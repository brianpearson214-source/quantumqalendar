/* Quantum Calendar — renders events.json into a filterable calendar. */

(function () {
  'use strict';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var CATEGORY_LABELS = {
    industry: 'Industry',
    research: 'Research',
    policy: 'Policy',
    community: 'Community'
  };

  var FORMAT_LABELS = {
    'in-person': 'In person',
    hybrid: 'Hybrid',
    virtual: 'Virtual'
  };

  var state = {
    events: [],
    region: 'all',
    category: 'all',
    query: '',
    showPast: false
  };

  var els = {
    calendar: document.getElementById('calendar'),
    empty: document.getElementById('empty'),
    loadError: document.getElementById('load-error'),
    resultCount: document.getElementById('result-count'),
    search: document.getElementById('search'),
    showPast: document.getElementById('show-past'),
    reset: document.getElementById('reset-filters'),
    lastUpdated: document.getElementById('last-updated')
  };

  /* ---------- dates ---------- */

  // "2026-09-13" -> local Date at midnight. Avoids the UTC shift that
  // new Date("2026-09-13") produces in most time zones.
  function parseDate(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }

  // "Sep 13–18, 2026" / "Aug 31 – Sep 4, 2026" / "Sep 14, 2026"
  function formatRange(start, end) {
    var y = start.getFullYear();
    if (start.getTime() === end.getTime()) {
      return MONTHS_SHORT[start.getMonth()] + ' ' + start.getDate() + ', ' + y;
    }
    if (start.getMonth() === end.getMonth() && y === end.getFullYear()) {
      return MONTHS_SHORT[start.getMonth()] + ' ' + start.getDate() + '–' + end.getDate() + ', ' + y;
    }
    var tail = MONTHS_SHORT[end.getMonth()] + ' ' + end.getDate() +
               (end.getFullYear() === y ? '' : ', ' + end.getFullYear());
    return MONTHS_SHORT[start.getMonth()] + ' ' + start.getDate() + ' – ' + tail + ', ' + end.getFullYear();
  }

  /* ---------- filtering ---------- */

  function matches(ev) {
    if (state.region !== 'all' && ev.region !== state.region) return false;
    if (state.category !== 'all' && ev.category !== state.category) return false;
    if (!state.showPast && ev.isPast) return false;

    if (state.query) {
      var haystack = [ev.name, ev.shortName, ev.place, ev.country, ev.blurb,
                      CATEGORY_LABELS[ev.category], FORMAT_LABELS[ev.format]]
        .filter(Boolean).join(' ').toLowerCase();
      if (haystack.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  /* ---------- rendering ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function cell(label, className) {
    var td = el('td', className);
    td.setAttribute('data-label', label);
    return td;
  }

  function renderRow(ev) {
    var row = el('tr', 'event-row' +
      (ev.featured ? ' is-featured' : '') +
      (ev.isPast ? ' is-past' : ''));

    /* Conference */
    var nameCell = cell('Conference', 'col-name');
    var title = el('div', 'event-title');
    if (ev.url) {
      var link = el('a', null, ev.name);
      link.href = ev.url;
      link.target = '_blank';
      link.rel = 'noopener';
      title.appendChild(link);
    } else {
      title.textContent = ev.name;
    }
    nameCell.appendChild(title);
    if (ev.blurb) nameCell.appendChild(el('p', 'event-blurb', ev.blurb));
    row.appendChild(nameCell);

    /* Dates */
    var dateCell = cell('Dates', 'col-dates');
    dateCell.appendChild(el('span', 'date-range', formatRange(ev.startDate, ev.endDate)));
    if (ev.isOngoing) {
      dateCell.appendChild(el('span', 'soon', 'Under way'));
    } else if (!ev.isPast && ev.daysAway >= 0 && ev.daysAway <= 30) {
      dateCell.appendChild(el('span', 'soon',
        ev.daysAway === 0 ? 'Today' : ev.daysAway === 1 ? 'Tomorrow' : 'In ' + ev.daysAway + ' days'));
    }
    var ics = el('button', 'ics-link', 'Add to calendar');
    ics.type = 'button';
    ics.addEventListener('click', function () { downloadIcs(ev); });
    dateCell.appendChild(ics);
    row.appendChild(dateCell);

    /* Location */
    var placeCell = cell('Location', 'col-place');
    placeCell.appendChild(el('span', 'place-name', ev.place));
    if (ev.format && ev.format !== 'in-person') {
      placeCell.appendChild(el('span', 'format-note', FORMAT_LABELS[ev.format] || ev.format));
    }
    row.appendChild(placeCell);

    /* Intended audience */
    var audienceCell = cell('Audience', 'col-audience');
    audienceCell.appendChild(el('span', 'audience-text', ev.audience || '—'));
    audienceCell.appendChild(el('span', 'tag tag-' + ev.category,
      CATEGORY_LABELS[ev.category] || ev.category));
    row.appendChild(audienceCell);

    return row;
  }

  function monthRow(date, count) {
    var row = el('tr', 'month-row');
    var th = el('th');
    th.setAttribute('colspan', '4');
    th.setAttribute('scope', 'colgroup');
    th.appendChild(el('span', 'month-name',
      MONTHS[date.getMonth()] + ' ' + date.getFullYear()));
    th.appendChild(el('span', 'month-count',
      count + (count === 1 ? ' event' : ' events')));
    row.appendChild(th);
    return row;
  }

  function buildTable() {
    var table = el('table', 'event-table');
    var caption = el('caption', 'sr-only',
      'Quantum computing conferences and events, grouped by month');
    table.appendChild(caption);

    var thead = el('thead');
    var headRow = el('tr');
    [['Conference', 'col-name'], ['Dates', 'col-dates'],
     ['Location', 'col-place'], ['Intended audience', 'col-audience']]
      .forEach(function (h) {
        var th = el('th', h[1], h[0]);
        th.setAttribute('scope', 'col');
        headRow.appendChild(th);
      });
    thead.appendChild(headRow);
    table.appendChild(thead);
    table.appendChild(el('tbody'));
    return table;
  }

  function render() {
    var visible = state.events.filter(matches);

    els.calendar.textContent = '';
    els.empty.hidden = visible.length > 0;

    if (!visible.length) {
      els.resultCount.textContent = '';
      return;
    }

    els.resultCount.textContent =
      visible.length + (visible.length === 1 ? ' event' : ' events') +
      (state.region === 'all' && state.category === 'all' && !state.query ? '' : ' matching your filters');

    // Count per month first, so each month header can state its own total.
    var order = [];
    var byMonth = {};
    visible.forEach(function (ev) {
      var key = ev.groupDate.getFullYear() + '-' + ev.groupDate.getMonth();
      if (!byMonth[key]) {
        byMonth[key] = [];
        order.push(key);
      }
      byMonth[key].push(ev);
    });

    var wrap = el('div', 'table-wrap');
    var table = buildTable();
    var tbody = table.querySelector('tbody');

    order.forEach(function (key) {
      var group = byMonth[key];
      tbody.appendChild(monthRow(group[0].groupDate, group.length));
      group.forEach(function (ev) { tbody.appendChild(renderRow(ev)); });
    });

    wrap.appendChild(table);
    els.calendar.appendChild(wrap);
  }

  /* ---------- .ics export ---------- */

  function icsDate(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return '' + d.getFullYear() + m + day;
  }

  function icsEscape(s) {
    return String(s || '').replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
  }

  function downloadIcs(ev) {
    // DTEND on an all-day VEVENT is exclusive, so push it one day past the last day.
    var endExclusive = new Date(ev.endDate.getTime());
    endExclusive.setDate(endExclusive.getDate() + 1);

    var description = ev.blurb || '';
    if (ev.url) description += (description ? '\n\n' : '') + ev.url;

    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Quantum Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + ev.id + '@quantum-calendar',
      'DTSTAMP:' + icsDate(new Date()) + 'T000000Z',
      'DTSTART;VALUE=DATE:' + icsDate(ev.startDate),
      'DTEND;VALUE=DATE:' + icsDate(endExclusive),
      'SUMMARY:' + icsEscape(ev.name),
      'LOCATION:' + icsEscape(ev.place),
      'DESCRIPTION:' + icsEscape(description)
    ];
    if (ev.url) lines.push('URL:' + ev.url);
    lines.push('END:VEVENT', 'END:VCALENDAR');

    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = ev.id + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------- wiring ---------- */

  function bindFilters() {
    document.querySelectorAll('.chips').forEach(function (group) {
      var key = group.dataset.filter;
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        state[key] = chip.dataset.value;
        render();
      });
    });

    var debounce;
    els.search.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        state.query = els.search.value.trim().toLowerCase();
        render();
      }, 120);
    });

    els.showPast.addEventListener('change', function () {
      state.showPast = els.showPast.checked;
      render();
    });

    els.reset.addEventListener('click', function () {
      state.region = 'all';
      state.category = 'all';
      state.query = '';
      state.showPast = false;
      els.search.value = '';
      els.showPast.checked = false;
      document.querySelectorAll('.chips').forEach(function (group) {
        group.querySelectorAll('.chip').forEach(function (c) {
          c.classList.toggle('is-active', c.dataset.value === 'all');
        });
      });
      render();
    });
  }

  function hydrate(raw) {
    var today = startOfToday();

    state.events = raw.events.map(function (ev) {
      var start = parseDate(ev.start);
      var end = parseDate(ev.end || ev.start);
      var isOngoing = start <= today && end >= today;
      return Object.assign({}, ev, {
        startDate: start,
        endDate: end,
        isPast: end < today,
        isOngoing: isOngoing,
        daysAway: daysBetween(today, start),
        // A long-running event that began in an earlier month belongs with the
        // current month, not stranded above everything under its start month.
        groupDate: isOngoing ? today : start
      });
    }).sort(function (a, b) {
      return (a.groupDate - b.groupDate) || (a.startDate - b.startDate);
    });

    if (raw.updated && els.lastUpdated) {
      var u = parseDate(raw.updated);
      els.lastUpdated.textContent = MONTHS[u.getMonth()] + ' ' + u.getDate() + ', ' + u.getFullYear();
    }
  }

  fetch('events.json', { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (raw) {
      hydrate(raw);
      bindFilters();
      render();
    })
    .catch(function (err) {
      console.error('Quantum Calendar: could not load events.json —', err);
      els.loadError.hidden = false;
      els.resultCount.textContent = '';
    });
})();
