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
    var badge = document.getElementById('crytropy-test-mode-badge');
    if (badge) badge.style.display = on ? 'block' : 'none';
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

  function closeDialog() {
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
      closeDialog();
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

  function ensureDialog() {
    if (document.getElementById('crytropy-test-mode-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'crytropy-test-mode-overlay';
    overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:10050',
      'background:rgba(2,6,23,.82)',
      'backdrop-filter:blur(4px)',
      'align-items:center',
      'justify-content:center',
      'padding:20px'
    ].join(';');

    var box = document.createElement('div');
    box.style.cssText = [
      'width:min(420px,92vw)',
      'background:#111827',
      'border:1px solid #475569',
      'border-radius:14px',
      'box-shadow:0 24px 70px rgba(0,0,0,.55)',
      'padding:24px',
      'color:#e5e7eb',
      'font-family:inherit'
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
      if (e.target === overlay) closeDialog();
    });
    document.getElementById('crytropy-test-mode-cancel').addEventListener('click', closeDialog);
    document.getElementById('crytropy-test-mode-submit').addEventListener('click', submitPassword);
    document.getElementById('crytropy-test-mode-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitPassword();
      if (e.key === 'Escape') closeDialog();
    });
  }

  function openDialog() {
    ensureDialog();
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

  function ensureBadge() {
    if (document.getElementById('crytropy-test-mode-badge')) return;
    var badge = document.createElement('div');
    badge.id = 'crytropy-test-mode-badge';
    badge.textContent = 'TEST MODE';
    badge.style.cssText = [
      'display:none',
      'position:fixed',
      'right:12px',
      'top:12px',
      'z-index:10000',
      'padding:5px 9px',
      'border-radius:7px',
      'background:#7f1d1d',
      'border:1px solid #ef4444',
      'color:#fee2e2',
      'font:700 12px/1.2 monospace',
      'letter-spacing:.08em',
      'pointer-events:none',
      'box-shadow:0 4px 14px rgba(0,0,0,.35)'
    ].join(';');
    document.body.appendChild(badge);
  }

  function injectButton() {
    var menu = document.getElementById('main-menu');
    var start = document.getElementById('btn-start-menu');
    if (!menu || !start || document.getElementById('btn-test-mode')) return;

    var btn = document.createElement('button');
    btn.id = 'btn-test-mode';
    btn.type = 'button';
    btn.className = 'btn text-base w-72 py-2.5 bg-slate-700 hover:bg-slate-600 border-slate-500';
    btn.textContent = '🧪 測試模式';
    btn.style.cssText = 'background:#78350f;border-color:#b45309;color:#fef3c7;';
    btn.addEventListener('click', openDialog);
    start.insertAdjacentElement('afterend', btn);

    // 從同一分頁回首頁後若改走「開始遊戲」，就回到一般模式。
    start.addEventListener('click', function () { applyTestMode(false); }, true);
  }

  function init() {
    ensureBadge();
    injectButton();
    applyTestMode(isTestMode());
  }

  window.openCrytropyTestMode = openDialog;
  window.isCrytropyTestMode = isTestMode;
  window.exitCrytropyTestMode = function () { applyTestMode(false); };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
