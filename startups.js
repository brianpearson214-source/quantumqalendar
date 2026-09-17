/* Chicago quantum startup tracker — renders startups.json into a table. */

(function () {
  'use strict';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  var AREA_LABELS = {
    hardware: 'Hardware',
    software: 'Software',
    applications: 'Applications',
    consulting: 'Consulting'
  };

  var els = {
    tracker: document.getElementById('tracker'),
    resultCount: document.getElementById('result-count'),
    loadError: document.getElementById('load-error'),
    lastUpdated: document.getElementById('last-updated')
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Same untrusted-input rule as the events page: only plain http(s) links
  // are rendered, so a bad value in startups.json can't become a script URL.
  function safeUrl(url) {
    if (!url) return '';
    var trimmed = String(url).trim();
    return /^https?:\/\/[^\s]+$/i.test(trimmed) ? trimmed : '';
  }

  function cell(label, className) {
    var td = el('td', className);
    td.setAttribute('data-label', label);
    return td;
  }

  function renderRow(s) {
    var row = el('tr', 'event-row');

    var nameCell = cell('Company', 'col-name');
    var title = el('div', 'event-title');
    var href = safeUrl(s.url);
    if (href) {
      var link = el('a', null, s.name);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      title.appendChild(link);
    } else {
      title.textContent = s.name;
    }
    nameCell.appendChild(title);
    row.appendChild(nameCell);

    var locCell = cell('Location', 'col-location');
    locCell.appendChild(el('span', 'place-name', s.location || '—'));
    row.appendChild(locCell);

    var areaCell = cell('Area', 'col-area');
    areaCell.appendChild(el('span', 'tag tag-' + s.area, AREA_LABELS[s.area] || s.area));
    row.appendChild(areaCell);

    var foundedCell = cell('Founded', 'col-founded');
    foundedCell.appendChild(el('span', 'founded', s.founded ? String(s.founded) : '—'));
    row.appendChild(foundedCell);

    return row;
  }

  function render(startups) {
    var table = el('table', 'event-table startup-table');
    table.appendChild(el('caption', 'sr-only',
      'Quantum startups in Illinois, Indiana and Wisconsin, alphabetical'));

    var thead = el('thead');
    var headRow = el('tr');
    [['Company', 'col-name'], ['Location', 'col-location'],
     ['Area', 'col-area'], ['Founded', 'col-founded']]
      .forEach(function (h) {
        var th = el('th', h[1], h[0]);
        th.setAttribute('scope', 'col');
        headRow.appendChild(th);
      });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    startups.forEach(function (s) { tbody.appendChild(renderRow(s)); });
    table.appendChild(tbody);

    var wrap = el('div', 'table-wrap');
    wrap.appendChild(table);
    els.tracker.textContent = '';
    els.tracker.appendChild(wrap);

    els.resultCount.textContent = startups.length + ' startups';
  }

  fetch('startups.json', { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (raw) {
      var list = raw.startups.slice().sort(function (a, b) {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      render(list);

      if (raw.updated && els.lastUpdated) {
        var p = raw.updated.split('-');
        els.lastUpdated.textContent = MONTHS[+p[1] - 1] + ' ' + +p[2] + ', ' + p[0];
      }
    })
    .catch(function (err) {
      console.error('Startup tracker: could not load startups.json —', err);
      els.loadError.hidden = false;
    });
})();
