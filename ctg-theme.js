(function () {
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('ctg-theme', t); } catch (e) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀ LIGHT' : '☾ DARK';
  }
  function toggleTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  // update button label on load to match current theme
  var t = document.documentElement.getAttribute('data-theme') || localStorage.getItem('ctg-theme') || 'light';
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = t === 'dark' ? '☀ LIGHT' : '☾ DARK';
})();
