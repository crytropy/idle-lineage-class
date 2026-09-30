(function () {
  'use strict';

  // 密碼不以明文放進公開 repo，只保存 SHA-256。
  // 注意：這是純前端靜態網站，只能防一般使用者誤入，無法提供真正的伺服器端存取控制。
  var PASSWORD_SHA256 = '92a86a14c2902894848a04696baa4aae6bdc6681364e18bcb4ee7c7d76ae163b';
  var SESSION_KEY = 'crytropy_test_mode_session_v1';

  function isTestMode() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
    catch (e) { return !!window.__CRYTROPY_TEST_MODE__; }
  }

  function applyTestMode(on) {
    window.__CRYTROPY_TEST_MODE__ = !!on;
    try {
      if (on) sessionStorage.setItem(SESSION_KEY, '1');
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    if (document.body) {
      if (on) document.body.setAttribute('data-crytropy-test-mode', '1');
      else document.body.removeAttribute('data-crytropy-test-mode');
    }
    syncTestUi();
  }

  async function sha256(text) {
    if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined') {
      throw new Error('此瀏覽器不支援安全雜湊驗證。');
    }
    var buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function closePasswordDialog() {
    var overlay = document.getElementById('crytropy-test-mode-overlay');
    if (overlay) overlay.style.display = 'none';
    var input = document.getElementById('crytropy-test-mode-password');
    var error = document.getElementById('crytropy-test-mode-error');
    if (input) input.value = '';
    if (error) error.textContent = '';
  }

  async function submitPassword() {
    var input = document.getElementById('crytropy-test-mode-password');
    var error = document.getElementById('crytropy-test-mode-error');
    var submit = document.getElementById('crytropy-test-mode-submit');
    if (!input || !submit) return;

    var password = input.value || '';
    if (!password) {
      if (error) error.textContent = '請輸入測試模式密碼。';
      input.focus();
      return;
    }

    submit.disabled = true;
    var oldText = submit.textContent;
    submit.textContent = '驗證中…';
    try {
      var digest = await sha256(password);
      if (digest !== PASSWORD_SHA256) {
        if (error) error.textContent = '密碼錯誤。';
        input.select();
        return;
      }

      applyTestMode(true);
      closePasswordDialog();
      if (typeof window.openLoadSelect === 'function') {
        window.openLoadSelect();
      } else {
        alert('角色選擇畫面尚未載入，請重新整理後再試。');
      }
    } catch (e) {
      if (error) error.textContent = e && e.message ? e.message : '密碼驗證失敗。';
    } finally {
      submit.disabled = false;
      submit.textContent = oldText;
    }
  }

  function ensurePasswordDialog() {
    if (document.getElementById('crytropy-test-mode-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'crytropy-test-mode-overlay';
    overlay.style.cssText = [
      'display:none','position:fixed','inset:0','z-index:10050',
      'background:rgba(2,6,23,.82)','backdrop-filter:blur(4px)',
      'align-items:center','justify-content:center','padding:20px'
    ].join(';');

    var box = document.createElement('div');
    box.style.cssText = [
      'width:min(420px,92vw)','background:#111827','border:1px solid #475569',
      'border-radius:14px','box-shadow:0 24px 70px rgba(0,0,0,.55)',
      'padding:24px','color:#e5e7eb','font-family:inherit'
    ].join(';');

    box.innerHTML =
      '<div style="font-size:22px;font-weight:800;color:#fbbf24;margin-bottom:8px">🧪 測試模式</div>' +
      '<div style="font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:16px">此入口僅供測試功能使用，請輸入密碼。</div>' +
      '<input id="crytropy-test-mode-password" type="password" autocomplete="current-password" ' +
      'style="box-sizing:border-box;width:100%;padding:11px 12px;background:#020617;color:#f8fafc;border:1px solid #475569;border-radius:8px;outline:none;font-size:16px" ' +
      'placeholder="測試模式密碼">' +
      '<div id="crytropy-test-mode-error" style="min-height:22px;margin-top:8px;color:#f87171;font-size:13px"></div>' +
      '<div style="display:flex;gap:10px;margin-top:8px">' +
      '<button id="crytropy-test-mode-cancel" type="button" style="flex:1;padding:10px;border-radius:8px;border:1px solid #475569;background:#334155;color:#e2e8f0;font-weight:700;cursor:pointer">取消</button>' +
      '<button id="crytropy-test-mode-submit" type="button" style="flex:1;padding:10px;border-radius:8px;border:1px solid #b45309;background:#92400e;color:#fef3c7;font-weight:800;cursor:pointer">進入測試模式</button>' +
      '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePasswordDialog();
    });
    document.getElementById('crytropy-test-mode-cancel').addEventListener('click', closePasswordDialog);
    document.getElementById('crytropy-test-mode-submit').addEventListener('click', submitPassword);
    document.getElementById('crytropy-test-mode-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitPassword();
      if (e.key === 'Escape') closePasswordDialog();
    });
  }

  function openPasswordDialog() {
    ensurePasswordDialog();
    var overlay = document.getElementById('crytropy-test-mode-overlay');
    var input = document.getElementById('crytropy-test-mode-password');
    var error = document.getElementById('crytropy-test-mode-error');
    if (error) error.textContent = '';
    if (input) input.value = '';
    if (overlay) {
      overlay.style.display = 'flex';
      setTimeout(function () { if (input) input.focus(); }, 0);
    }
  }

  function playerReady() {
    return !!(isTestMode() && typeof player !== 'undefined' && player && player.cls);
  }

  function gameVisible() {
    var gs = document.getElementById('game-screen');
    return !!(gs && !gs.classList.contains('hidden'));
  }

  function notice(msg, bad) {
    var el = document.getElementById('crytropy-test-tools-notice');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = bad ? '#f87171' : '#86efac';
  }

  function parseWhole(id, min, max) {
    var el = document.getElementById(id);
    var n = el ? Number(el.value) : NaN;
    if (!Number.isFinite(n)) return null;
    n = Math.floor(n);
    if (n < min || n > max) return null;
    return n;
  }

  function saveAndRefresh() {
    try { if (typeof calcStats === 'function') calcStats(); } catch (e) {}
    try {
      if (player && player.mhp) player.hp = Math.min(player.mhp, Math.max(1, Number(player.hp) || player.mhp));
      if (player && player.mmp !== undefined) player.mp = Math.min(player.mmp, Math.max(0, Number(player.mp) || 0));
    } catch (e) {}
    try { if (typeof updateUI === 'function') updateUI(); } catch (e) {}
    try { if (typeof renderTabs === 'function') renderTabs(true); } catch (e) {}
    try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
    refreshToolValues();
  }

  function refreshToolValues() {
    if (!playerReady()) return;
    var g = document.getElementById('crytropy-test-gold');
    var lv = document.getElementById('crytropy-test-level');
    var dia = document.getElementById('crytropy-test-diamonds');
    if (g && document.activeElement !== g) g.value = String(Math.max(0, Math.floor(Number(player.gold) || 0)));
    if (lv && document.activeElement !== lv) lv.value = String(Math.max(1, Math.min(100, Math.floor(Number(player.lv) || 1))));
    if (dia && document.activeElement !== dia && typeof window.pandoraGetSharedDiamonds === 'function') {
      dia.value = String(Math.max(0, Math.floor(Number(window.pandoraGetSharedDiamonds()) || 0)));
    }
    ['str','dex','con','int','wis','cha'].forEach(function (s) {
      var el = document.getElementById('crytropy-test-stat-' + s);
      if (!el || document.activeElement === el) return;
      var v;
      try {
        v = (typeof naturalStat === 'function')
          ? naturalStat(s)
          : ((player.base && player.base[s]) || 0) + ((player.alloc && player.alloc[s]) || 0) + ((player.panacea && player.panacea[s]) || 0);
      } catch (e) {
        v = ((player.base && player.base[s]) || 0) + ((player.alloc && player.alloc[s]) || 0) + ((player.panacea && player.panacea[s]) || 0);
      }
      el.value = String(Math.max(1, Math.min(60, Math.floor(Number(v) || 1))));
    });
  }

  function setGold() {
    if (!playerReady()) return notice('請先進入角色。', true);
    var n = parseWhole('crytropy-test-gold', 0, Number.MAX_SAFE_INTEGER);
    if (n === null) return notice('金幣請輸入 0 以上的整數。', true);
    player.gold = n;
    saveAndRefresh();
    notice('金幣已修改為 ' + n.toLocaleString() + '。');
  }

  function levelEntitlement(lv) {
    return Math.max(0, Math.floor(lv) - 49);
  }

  function allocatedLevelPoints() {
    if (!player || !player.alloc) return 0;
    return ['str','dex','con','int','wis','cha'].reduce(function (s, k) {
      return s + Math.max(0, Math.floor(Number(player.alloc[k]) || 0));
    }, 0);
  }

  function setLevel() {
    if (!playerReady()) return notice('請先進入角色。', true);
    var target = parseWhole('crytropy-test-level', 1, 100);
    if (target === null) return notice('等級請輸入 1～100。', true);

    var current = Math.max(1, Math.min(100, Math.floor(Number(player.lv) || 1)));
    var currentEnt = levelEntitlement(current);
    var targetEnt = levelEntitlement(target);
    var spent = allocatedLevelPoints();

    // 降級時避免已配出去的能力點超過新等級可擁有的點數。
    if (targetEnt < spent) {
      return notice('無法降到 Lv.' + target + '：目前已有 ' + spent + ' 點升級能力值已配出。請先重置配點。', true);
    }

    var currentBonus = Math.max(0, Math.floor(Number(player.bonus) || 0));
    var spentFromLevel = Math.max(0, Math.min(currentEnt, spent));
    var expectedCurrentFree = Math.max(0, currentEnt - spentFromLevel);
    // 優先保留目前 bonus 中非等級來源的額外點，再按目標等級重建等級點數。
    var extraFree = Math.max(0, currentBonus - expectedCurrentFree);
    player.lv = target;
    player.exp = 0;
    player.bonus = extraFree + Math.max(0, targetEnt - spent);

    try { if (typeof calcStats === 'function') calcStats(); } catch (e) {}
    if (player.mhp) player.hp = player.mhp;
    if (player.mmp !== undefined) player.mp = player.mmp;
    saveAndRefresh();
    notice('等級已修改為 Lv.' + target + '，目前經驗歸零。');
  }

  function setDiamonds() {
    if (!playerReady()) return notice('請先進入角色。', true);
    var n = parseWhole('crytropy-test-diamonds', 0, Number.MAX_SAFE_INTEGER);
    if (n === null) return notice('龍鑽請輸入 0 以上的整數。', true);
    if (typeof window.pandoraRestoreSharedDiamonds !== 'function') {
      return notice('龍之鑽石資料介面尚未載入。', true);
    }
    var result = window.pandoraRestoreSharedDiamonds(n);
    if (!result || !result.ok) return notice((result && result.error) || '龍鑽修改失敗。', true);
    refreshToolValues();
    notice('龍之鑽石已修改為 ' + n.toLocaleString() + '。');
  }

  function setAbilityStats() {
    if (!playerReady()) return notice('請先進入角色。', true);
    try {
      if (typeof _respec !== 'undefined' && _respec) {
        return notice('目前正在進行回憶蠟燭配點重置，請先確認或取消重置後再修改能力值。', true);
      }
    } catch (e) {}

    var keys = ['str','dex','con','int','wis','cha'];
    var labels = { str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神', cha:'魅力' };
    var targets = {};
    for (var i = 0; i < keys.length; i++) {
      var s = keys[i];
      var n = parseWhole('crytropy-test-stat-' + s, 1, 60);
      if (n === null) return notice(labels[s] + '請輸入 1～60。', true);
      targets[s] = n;
    }

    if (!player.base) player.base = {};
    if (!player.alloc) player.alloc = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
    if (!player.panacea) player.panacea = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };

    keys.forEach(function (s) {
      var alloc = Number(player.alloc[s]) || 0;
      var pan = Number(player.panacea[s]) || 0;
      // 只調整 base，使自然能力值(base+alloc+萬能藥)精確等於指定值；
      // 保留既有配點與萬能藥來源，之後仍可用原遊戲的重置/配點機制。
      player.base[s] = targets[s] - alloc - pan;
    });

    try { if (typeof calcStats === 'function') calcStats(); } catch (e) {}
    try {
      if (player.mhp) player.hp = player.mhp;
      if (player.mmp !== undefined) player.mp = player.mmp;
    } catch (e) {}
    try {
      if (typeof _petEnforceCarry === 'function') {
        _petEnforceCarry();
        if (typeof petRosterSave === 'function') petRosterSave();
      }
    } catch (e) {}

    saveAndRefresh();
    notice('六項自然能力值已修改：STR ' + targets.str + ' / DEX ' + targets.dex + ' / CON ' + targets.con + ' / INT ' + targets.int + ' / WIS ' + targets.wis + ' / CHA ' + targets.cha + '。');
  }

  var selectedItemId = '';

  function itemText(id, d) {
    return (d && d.n ? d.n : id) + '  [' + id + ']';
  }

  function renderItemMatches() {
    var wrap = document.getElementById('crytropy-test-item-results');
    var input = document.getElementById('crytropy-test-item-search');
    if (!wrap || !input) return;
    wrap.innerHTML = '';
    selectedItemId = '';

    if (typeof DB === 'undefined' || !DB.items) return;
    var q = String(input.value || '').trim().toLowerCase();
    if (!q) return;

    var matches = Object.keys(DB.items).filter(function (id) {
      var d = DB.items[id];
      var name = d && d.n ? String(d.n) : '';
      return id.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 20);

    matches.forEach(function (id) {
      var d = DB.items[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = itemText(id, d);
      b.style.cssText = 'display:block;width:100%;text-align:left;padding:7px 9px;margin-top:4px;border:1px solid #334155;border-radius:7px;background:#0f172a;color:#e2e8f0;cursor:pointer;font-size:13px;';
      b.addEventListener('click', function () {
        selectedItemId = id;
        input.value = itemText(id, d);
        Array.from(wrap.children).forEach(function (x) { x.style.borderColor = '#334155'; x.style.background = '#0f172a'; });
        b.style.borderColor = '#f59e0b';
        b.style.background = '#451a03';
        notice('已選擇：' + itemText(id, d));
      });
      wrap.appendChild(b);
    });

    if (!matches.length) {
      var empty = document.createElement('div');
      empty.textContent = '找不到符合的物品。';
      empty.style.cssText = 'padding:7px 2px;color:#94a3b8;font-size:13px;';
      wrap.appendChild(empty);
    }
  }

  function resolveItemIdFromInput() {
    if (selectedItemId && typeof DB !== 'undefined' && DB.items && DB.items[selectedItemId]) return selectedItemId;
    var input = document.getElementById('crytropy-test-item-search');
    var raw = input ? String(input.value || '').trim() : '';
    if (!raw || typeof DB === 'undefined' || !DB.items) return '';
    if (DB.items[raw]) return raw;
    var bracket = raw.match(/\[([^\]]+)\]\s*$/);
    if (bracket && DB.items[bracket[1]]) return bracket[1];
    var exact = Object.keys(DB.items).find(function (id) { return DB.items[id] && DB.items[id].n === raw; });
    return exact || '';
  }

  function giveItem() {
    if (!playerReady()) return notice('請先進入角色。', true);
    if (typeof gainItem !== 'function' || typeof DB === 'undefined' || !DB.items) {
      return notice('物品系統尚未載入。', true);
    }
    var id = resolveItemIdFromInput();
    if (!id || !DB.items[id]) return notice('請先搜尋並選擇有效物品。', true);
    var qty = parseWhole('crytropy-test-item-qty', 1, 999999);
    if (qty === null) return notice('數量請輸入 1～999,999。', true);

    var result = gainItem(id, qty, false, true);
    if (!result) return notice('物品未加入；可能已達該物品持有上限。', true);
    saveAndRefresh();
    notice('已給予 ' + (DB.items[id].n || id) + ' × ' + qty.toLocaleString() + '。');
  }

  function closeTools() {
    var overlay = document.getElementById('crytropy-test-tools-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function ensureToolsPanel() {
    if (document.getElementById('crytropy-test-tools-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'crytropy-test-tools-overlay';
    overlay.style.cssText = [
      'display:none','position:fixed','inset:0','z-index:10060',
      'background:rgba(2,6,23,.78)','backdrop-filter:blur(4px)',
      'align-items:center','justify-content:center','padding:16px'
    ].join(';');

    var panel = document.createElement('div');
    panel.style.cssText = [
      'width:min(640px,96vw)','max-height:92vh','overflow:auto',
      'background:#111827','border:1px solid #92400e','border-radius:14px',
      'box-shadow:0 24px 70px rgba(0,0,0,.6)','padding:20px','color:#e5e7eb'
    ].join(';');

    panel.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px">' +
        '<div><div style="font-size:22px;font-weight:800;color:#fbbf24">🧪 測試工具</div><div style="font-size:12px;color:#94a3b8;margin-top:3px">只在 TEST MODE 顯示；修改會直接寫入目前角色存檔。</div></div>' +
        '<button id="crytropy-test-tools-close" type="button" style="padding:7px 10px;border:1px solid #475569;border-radius:8px;background:#334155;color:#e2e8f0;cursor:pointer">✕</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:12px">' +
        '<label style="font-size:13px;color:#cbd5e1">修改金幣<input id="crytropy-test-gold" type="number" min="0" step="1" style="box-sizing:border-box;width:100%;margin-top:5px;padding:9px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
        '<button id="crytropy-test-gold-set" type="button" style="padding:9px 16px;border:1px solid #a16207;border-radius:7px;background:#713f12;color:#fef3c7;font-weight:700;cursor:pointer">套用</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:12px">' +
        '<label style="font-size:13px;color:#cbd5e1">修改等級（1～100）<input id="crytropy-test-level" type="number" min="1" max="100" step="1" style="box-sizing:border-box;width:100%;margin-top:5px;padding:9px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
        '<button id="crytropy-test-level-set" type="button" style="padding:9px 16px;border:1px solid #a16207;border-radius:7px;background:#713f12;color:#fef3c7;font-weight:700;cursor:pointer">套用</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:16px">' +
        '<label style="font-size:13px;color:#cbd5e1">修改龍鑽數量<input id="crytropy-test-diamonds" type="number" min="0" step="1" style="box-sizing:border-box;width:100%;margin-top:5px;padding:9px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
        '<button id="crytropy-test-diamonds-set" type="button" style="padding:9px 16px;border:1px solid #a16207;border-radius:7px;background:#713f12;color:#fef3c7;font-weight:700;cursor:pointer">套用</button>' +
      '</div>' +

      '<div style="border-top:1px solid #334155;padding-top:14px;margin-top:4px;margin-bottom:16px">' +
        '<div style="font-size:14px;font-weight:700;color:#fde68a;margin-bottom:4px">修改能力值</div>' +
        '<div style="font-size:11px;color:#64748b;margin-bottom:9px">修改自然能力值（不含裝備／Buff），每項 1～60；套用後會重新計算角色能力。</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' +
          '<label style="font-size:12px;color:#cbd5e1">STR 力量<input id="crytropy-test-stat-str" type="number" min="1" max="60" step="1" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
          '<label style="font-size:12px;color:#cbd5e1">DEX 敏捷<input id="crytropy-test-stat-dex" type="number" min="1" max="60" step="1" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
          '<label style="font-size:12px;color:#cbd5e1">CON 體質<input id="crytropy-test-stat-con" type="number" min="1" max="60" step="1" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
          '<label style="font-size:12px;color:#cbd5e1">INT 智力<input id="crytropy-test-stat-int" type="number" min="1" max="60" step="1" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
          '<label style="font-size:12px;color:#cbd5e1">WIS 精神<input id="crytropy-test-stat-wis" type="number" min="1" max="60" step="1" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
          '<label style="font-size:12px;color:#cbd5e1">CHA 魅力<input id="crytropy-test-stat-cha" type="number" min="1" max="60" step="1" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px"></label>' +
        '</div>' +
        '<button id="crytropy-test-stats-set" type="button" style="width:100%;margin-top:9px;padding:9px 16px;border:1px solid #a16207;border-radius:7px;background:#713f12;color:#fef3c7;font-weight:700;cursor:pointer">套用六項能力值</button>' +
      '</div>' +

      '<div style="border-top:1px solid #334155;padding-top:14px">' +
        '<div style="font-size:14px;font-weight:700;color:#fde68a;margin-bottom:7px">給物品</div>' +
        '<input id="crytropy-test-item-search" type="text" autocomplete="off" placeholder="輸入物品名稱或 ID，例如：屠龍劍 / wpn_dragonslayer" style="box-sizing:border-box;width:100%;padding:9px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px">' +
        '<div id="crytropy-test-item-results" style="max-height:210px;overflow:auto;margin-top:5px"></div>' +
        '<div style="display:grid;grid-template-columns:120px 1fr;gap:8px;margin-top:9px">' +
          '<input id="crytropy-test-item-qty" type="number" min="1" max="999999" step="1" value="1" style="box-sizing:border-box;width:100%;padding:9px;background:#020617;color:#fff;border:1px solid #475569;border-radius:7px">' +
          '<button id="crytropy-test-item-give" type="button" style="padding:9px 16px;border:1px solid #a16207;border-radius:7px;background:#713f12;color:#fef3c7;font-weight:700;cursor:pointer">給予物品</button>' +
        '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:6px">裝備以普通 +0 白板形式給予；物品原有持有上限仍會生效。</div>' +
      '</div>' +

      '<div id="crytropy-test-tools-notice" style="min-height:22px;margin-top:14px;font-size:13px;color:#86efac"></div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeTools(); });
    document.getElementById('crytropy-test-tools-close').addEventListener('click', closeTools);
    document.getElementById('crytropy-test-gold-set').addEventListener('click', setGold);
    document.getElementById('crytropy-test-level-set').addEventListener('click', setLevel);
    document.getElementById('crytropy-test-diamonds-set').addEventListener('click', setDiamonds);
    document.getElementById('crytropy-test-stats-set').addEventListener('click', setAbilityStats);
    document.getElementById('crytropy-test-item-search').addEventListener('input', renderItemMatches);
    document.getElementById('crytropy-test-item-give').addEventListener('click', giveItem);
  }

  function openTools() {
    if (!playerReady()) {
      alert('請先以測試模式進入角色後再使用測試工具。');
      return;
    }
    ensureToolsPanel();
    refreshToolValues();
    notice('');
    var overlay = document.getElementById('crytropy-test-tools-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function ensureTestControls() {
    var badge = document.getElementById('crytropy-test-mode-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'crytropy-test-mode-badge';
      badge.textContent = 'TEST MODE';
      badge.style.cssText = [
        'display:none','position:fixed','right:12px','top:12px','z-index:10000',
        'padding:5px 9px','border-radius:7px','background:#7f1d1d',
        'border:1px solid #ef4444','color:#fee2e2','font:700 12px/1.2 monospace',
        'letter-spacing:.08em','pointer-events:none','box-shadow:0 4px 14px rgba(0,0,0,.35)'
      ].join(';');
      document.body.appendChild(badge);
    }

    var tools = document.getElementById('crytropy-test-tools-button');
    if (!tools) {
      tools = document.createElement('button');
      tools.id = 'crytropy-test-tools-button';
      tools.type = 'button';
      tools.textContent = '🧪 測試工具';
      tools.style.cssText = [
        'display:none','position:fixed','right:12px','top:45px','z-index:10000',
        'padding:7px 10px','border-radius:8px','background:#78350f',
        'border:1px solid #f59e0b','color:#fef3c7','font:700 13px/1.2 inherit',
        'cursor:pointer','box-shadow:0 4px 14px rgba(0,0,0,.35)'
      ].join(';');
      tools.addEventListener('click', openTools);
      document.body.appendChild(tools);
    }
  }

  function injectEntryButton() {
    var menu = document.getElementById('main-menu');
    var start = document.getElementById('btn-start-menu');
    if (!menu || !start || document.getElementById('btn-test-mode')) return;

    var btn = document.createElement('button');
    btn.id = 'btn-test-mode';
    btn.type = 'button';
    btn.className = 'btn text-base w-72 py-2.5 bg-slate-700 hover:bg-slate-600 border-slate-500';
    btn.textContent = '🧪 測試模式';
    btn.style.cssText = 'background:#78350f;border-color:#b45309;color:#fef3c7;';
    btn.addEventListener('click', openPasswordDialog);
    start.insertAdjacentElement('afterend', btn);

    // 從同一分頁回首頁後若改走「開始遊戲」，就回到一般模式。
    start.addEventListener('click', function () { applyTestMode(false); }, true);
  }

  function syncTestUi() {
    ensureTestControls();
    var active = isTestMode();
    var badge = document.getElementById('crytropy-test-mode-badge');
    var tools = document.getElementById('crytropy-test-tools-button');
    if (badge) badge.style.display = active ? 'block' : 'none';
    if (tools) tools.style.display = active && gameVisible() && playerReady() ? 'block' : 'none';
    if (!active) closeTools();
  }

  function init() {
    ensureTestControls();
    injectEntryButton();
    applyTestMode(isTestMode());
    setInterval(syncTestUi, 750);
  }

  window.openCrytropyTestMode = openPasswordDialog;
  window.isCrytropyTestMode = isTestMode;
  window.openCrytropyTestTools = openTools;
  window.exitCrytropyTestMode = function () { applyTestMode(false); };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
