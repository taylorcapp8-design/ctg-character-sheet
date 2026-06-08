(function () {
  var THEMES = [
    { id: '',             label: 'Gallahad', color: '#c8a020', title: 'Gallahad — Olive & Gold' },
    { id: 'theme-umbra',  label: 'Umbra',    color: '#a8b4c0', title: 'Umbra — Shadow Silver' },
    { id: 'theme-ember',  label: 'Ember',    color: '#c43a28', title: 'Ember — Blood & Iron' },
    { id: 'theme-deep',   label: 'Deep',     color: '#4499cc', title: 'Deep — Naval Intelligence' },
    { id: 'theme-scorch', label: 'Scorch',   color: '#cc7720', title: 'Scorch — Wasteland Rust' },
    { id: 'theme-arcane', label: 'Arcane',   color: '#9966cc', title: 'Arcane — Void Protocol' },
    { id: 'theme-verdant',label: 'Verdant',  color: '#44bb70', title: 'Verdant — Jungle Ops' },
    { id: 'theme-slate',  label: 'Slate',    color: '#3eb8b0', title: 'Slate — Industrial Teal' },
  ];

  var saved = '';
  try { saved = localStorage.getItem('ctg-theme') || ''; } catch (e) {}
  if (saved && document.body) {
    var existing = document.body.className.replace(/theme-\S+/g, '').trim();
    document.body.className = (existing + ' ' + saved).trim();
  }

  function setTheme(id) {
    try { localStorage.setItem('ctg-theme', id); } catch (e) {}
    var existing = document.body.className.replace(/theme-\S+/g, '').trim();
    document.body.className = id ? (existing + ' ' + id).trim() : existing;
    // Update theme-color meta
    var metaTC = document.querySelector('meta[name="theme-color"]');
    var th = THEMES.find(function (t) { return t.id === id; });
    if (metaTC && th) {
      // Darken the accent a bit for the meta tag
      metaTC.setAttribute('content', id ? '#080a04' : '#080a04');
    }
    // Update dots
    document.querySelectorAll('.theme-dot').forEach(function (dot) {
      dot.classList.toggle('active', dot.dataset.theme === id);
    });
  }

  function buildSwitcher() {
    var nav = document.getElementById('ctg-nav-bar');
    if (!nav) return;
    if (document.getElementById('theme-sw')) return; // already built

    var sw = document.createElement('div');
    sw.className = 'theme-sw';
    sw.id = 'theme-sw';

    THEMES.forEach(function (t) {
      var dot = document.createElement('button');
      dot.className = 'theme-dot' + (saved === t.id ? ' active' : '');
      dot.dataset.theme = t.id;
      dot.style.background = t.color;
      dot.title = t.title;
      dot.setAttribute('aria-label', t.title);
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        setTheme(t.id);
      });
      sw.appendChild(dot);
    });

    // Insert before the char-name span so it sits left of the name
    var nameEl = document.getElementById('nav-char-name');
    if (nameEl) nav.insertBefore(sw, nameEl);
    else nav.appendChild(sw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSwitcher);
  } else {
    buildSwitcher();
  }
})();
