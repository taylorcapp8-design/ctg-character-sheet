// ctg-sync.js — Supabase cloud sync for CTG Character Sheet
(function () {
  var SUPA_URL = 'https://lijzuwwhktgywytbmutf.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpanp1d3doa3RneXd5dGJtdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODM4MDEsImV4cCI6MjA5NjQ1OTgwMX0.Q0yi6VcgZuhORU6MZbOD02Od5ZYE8tYfOodHBQ0MypI';

  // keys excluded from cloud sync (portrait is a base64 image — too large)
  var SKIP_KEYS = ['ctg-portrait'];

  var _client = null;
  var _interval = null;
  var _tickInterval = null;
  var _lastSynced = null;

  function getClient() {
    if (_client) return _client;
    try {
      if (window.supabase && window.supabase.createClient) {
        _client = window.supabase.createClient(SUPA_URL, SUPA_KEY);
      }
    } catch (e) {}
    return _client;
  }

  // ── Clear all local ctg-* data ───────────────────────────────────────
  function clearLocal() {
    try {
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith('ctg-')) toRemove.push(k);
      }
      toRemove.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}
  }

  // ── Session ──────────────────────────────────────────────────────────
  function getUser() {
    try { return sessionStorage.getItem('ctg-session-user') || null; } catch (e) { return null; }
  }
  function _setUser(u) {
    try { sessionStorage.setItem('ctg-session-user', u); } catch (e) {}
  }
  function _clearUser() {
    try { sessionStorage.removeItem('ctg-session-user'); } catch (e) {}
  }

  // ── Sync indicator injected into nav ─────────────────────────────────
  function setIndicator(state) {
    var el = document.getElementById('nav-sync');
    if (!el) return;
    el.style.transition = 'color 0.3s,opacity 0.3s';
    if (state === 'saving') {
      el.textContent = 'Saving...';
      el.style.color = '#9b7800';
      el.style.opacity = '0.9';
    } else if (state === 'saved') {
      el.textContent = '☁ Saved';
      el.style.color = '#159a3c';
      el.style.opacity = '1';
    } else if (state === 'offline') {
      el.textContent = '⚠ Offline';
      el.style.color = '#d8143a';
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0';
    }
  }

  // ── Collect all ctg- keys from localStorage ───────────────────────────
  function collect() {
    var d = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith('ctg-') && SKIP_KEYS.indexOf(k) === -1) {
          var v = localStorage.getItem(k);
          if (v !== null) d[k] = v;
        }
      }
    } catch (e) {}
    return d;
  }

  function restore(data) {
    if (!data || typeof data !== 'object') return;
    // wipe existing local keys so stale data from a previous user can't bleed through
    clearLocal();
    Object.keys(data).forEach(function (k) {
      if (k.startsWith('ctg-')) {
        try { localStorage.setItem(k, data[k]); } catch (e) {}
      }
    });
  }

  // ── "Last synced" display ─────────────────────────────────────────────
  function updateLastSyncedDisplay() {
    var el = document.getElementById('last-synced');
    if (!el) return;
    if (!_lastSynced) { el.textContent = 'never'; return; }
    var mins = Math.floor((Date.now() - _lastSynced.getTime()) / 60000);
    if (mins < 1) el.textContent = 'just now';
    else if (mins === 1) el.textContent = '1 min ago';
    else el.textContent = mins + ' mins ago';
  }

  // ── Push to Supabase ──────────────────────────────────────────────────
  async function push() {
    var user = getUser();
    if (!user) return;
    var c = getClient();
    if (!c) { setIndicator('offline'); return; }
    setIndicator('saving');
    try {
      var result = await c.from('sheets').update({ data: collect(), updated_at: new Date().toISOString() }).eq('username', user);
      if (result.error) throw result.error;
      _lastSynced = new Date();
      setIndicator('saved');
      updateLastSyncedDisplay();
    } catch (e) {
      setIndicator('offline');
    }
  }

  // ── Pull from Supabase ────────────────────────────────────────────────
  async function pull(user) {
    var c = getClient();
    if (!c) return false;
    try {
      var result = await c.from('sheets').select('data').eq('username', user).single();
      if (result.error) return false;
      if (result.data && result.data.data) restore(result.data.data);
      _lastSynced = new Date();
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Login / register ──────────────────────────────────────────────────
  async function login(username, pin) {
    var c = getClient();
    if (!c) throw new Error('Cannot reach server — check network');

    var check = await c.from('sheets').select('username,pin').eq('username', username).single();

    if (check.error && check.error.code !== 'PGRST116') {
      throw new Error('Connection error — check your network');
    }

    var isNew = false;
    if (check.data) {
      // existing account — pull replaces local data entirely
      if (check.data.pin !== pin) throw new Error('Incorrect PIN');
      await pull(username);
    } else {
      // new account — clear any local data so the new sheet starts blank
      isNew = true;
      clearLocal();
      var ins = await c.from('sheets').insert({ username: username, pin: pin, data: {} });
      if (ins.error) throw new Error('Could not create dossier');
    }

    _setUser(username);
    _lastSynced = new Date();
    return { isNew: isNew };
  }

  // ── Logout ────────────────────────────────────────────────────────────
  function logout() {
    _clearUser();
    clearLocal(); // wipe local data so the next user doesn't inherit it
    if (_interval) { clearInterval(_interval); _interval = null; }
    if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null; }
    setIndicator(null);
  }

  // ── Start auto-sync ───────────────────────────────────────────────────
  function start() {
    if (!getUser()) return;
    if (_interval) clearInterval(_interval);
    _interval = setInterval(push, 30000);
    window.addEventListener('beforeunload', function () { push(); });
    setIndicator('saved');
    if (_tickInterval) clearInterval(_tickInterval);
    _tickInterval = setInterval(updateLastSyncedDisplay, 60000);
  }

  // ── Inject nav sync indicator ─────────────────────────────────────────
  function buildNavIndicator() {
    var nav = document.getElementById('ctg-nav-bar');
    if (!nav || document.getElementById('nav-sync')) return;
    var span = document.createElement('span');
    span.id = 'nav-sync';
    span.style.cssText = 'font-family:"Share Tech Mono",monospace;font-size:0.5rem;letter-spacing:1px;padding-right:8px;white-space:nowrap;opacity:0;';
    var nameEl = document.getElementById('nav-char-name');
    if (nameEl) nav.insertBefore(span, nameEl);
    else nav.appendChild(span);
  }

  function onReady() {
    buildNavIndicator();
    if (getUser()) start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  window.ctgSync = {
    login: login,
    logout: logout,
    push: push,
    pull: pull,
    start: start,
    getUser: getUser,
    clearLocal: clearLocal,
    setIndicator: setIndicator,
    updateLastSyncedDisplay: updateLastSyncedDisplay,
  };
})();
