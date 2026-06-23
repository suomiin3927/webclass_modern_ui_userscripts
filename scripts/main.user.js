// ==UserScript==
// @name         WebClass Modern UI
// @namespace    https://webclass.miyazaki-u.ac.jp/
// @version      3.2.0
// @description  WebClassのUIを現代的なダッシュボードデザインに刷新する
// @author       Aiki
// @match        *://*/webclass/*
// @grant        none
// @run-at       document-end
// @updateURL    https://githubusercontent.com
// @downloadURL  https://githubusercontent.com
// ==/UserScript==

(function () {
  'use strict';

  // ─── ページ判定 ────────────────────────────────────────────
  const isTopPage =
    document.querySelector('#js-main') &&
    (document.querySelector('.schedule-table') || document.querySelector('.courseTree'));

  if (!isTopPage) return;

  // ════════════════════════════════════════════════════════════
  // データ抽出
  // ════════════════════════════════════════════════════════════
  // 注意：WebClass標準HTMLはPC用(hidden-xs)とスマホ用(visible-xs/hidden-sm,md,lg)
  // の同一ブロックを重複して描画している箇所が複数ある。
  // 抽出時は必ず「PC用（hidden-xsクラスを持つ方）」を優先し、1つだけ採用する。

  const userName = (() => {
    // body > header > nav > div:nth-child(1) > ul > li:nth-child(2) > a > span
    const el = document.querySelector(
      'body > header > nav > div:nth-child(1) > ul > li:nth-child(2) > a > span'
    );
    return el ? el.textContent.trim() : 'User';
  })();

  // アバター画像：localStorageにBase64保存された画像を優先し、なければWebClassのものを使う
  const savedAvatarSrc = localStorage.getItem('wc_avatar') || '';
  const wcAvatarSrc = (() => {
    const img = document.querySelector('.navbar-nav .dropdown > a > img');
    return img ? img.src : '';
  })();
  // 表示用（JS側で動的に切り替えるため let で保持）
  let currentAvatarSrc = savedAvatarSrc || wcAvatarSrc;

  const navLinks = (() => {
    const links = [];
    document.querySelectorAll('.nav.navbar-left > li > a').forEach(a => {
      const text = a.textContent.trim().replace(/\s+/g, ' ');
      if (text && !text.includes('ログアウト')) {
        links.push({ text, href: a.href });
      }
    });
    return links;
  })();
  // navLinksは最大3件まで表示（4番目以降は余分なリンクが混入するため）

  const logoutHref = (() => {
    const a = document.querySelector('a[href*="logout.php"]');
    return a ? a.href : '/webclass/logout.php';
  })();

  const messageHref = (() => {
    const a = document.querySelector('#notification-dropdown-icon');
    return a ? a.href : '/webclass/msg_editor.php?msgappmode=inbox';
  })();

  const messageOnClick = (() => {
    const a = document.querySelector('#notification-dropdown-icon');
    return a ? (a.getAttribute('onclick') || '') : '';
  })();

  const messageIconHTML = (() => {
    const iconEl = document.querySelector('#notification-dropdown-icon .glyphicon-envelope');
    if (iconEl) return iconEl.outerHTML;
    return '<span class="glyphicon glyphicon-envelope" aria-hidden="true"></span>';
  })();

  // #js-unread-message-count は未読がある時のみ存在する。なければ0件。
  const unreadMessageCount = (() => {
    const badge = document.querySelector('#js-unread-message-count');
    if (!badge) return 0; // 要素が存在しない = 未読なし
    const n = parseInt(badge.textContent.trim(), 10);
    return isNaN(n) ? 0 : n;
  })();

  // アカウントドロップダウンのメニューリンク
  // PC用 (hidden-xsの.navbar-nav.navbar-right内) の最初の.dropdown-menuだけを採用する
  const accountMenuLinks = (() => {
    const pcDropdown = document.querySelector('.navbar-nav.navbar-right.hidden-xs .dropdown-menu');
    const fallback = document.querySelector('.navbar-nav .dropdown-menu');
    const menu = pcDropdown || fallback;
    if (!menu) return [];
    const links = [];
    menu.querySelectorAll('li a').forEach(a => {
      const text = a.textContent.trim();
      if (text) {
        links.push({
          text,
          href: a.href,
          onClick: a.getAttribute('onclick') || '',
          target: a.target || '',
        });
      }
    });
    return links;
  })();

  // お知らせ（hidden-xs側を優先して1要素ずつ採用）
  const notices = (() => {
    const items = [];
    document.querySelectorAll('#AjaxInfoBox .info-list li:not(.head)').forEach(li => {
      const aHidden = li.querySelector('.hidden-xs a.title');
      const aFallback = li.querySelector('a.title');
      const a = aHidden || aFallback;
      const meta = li.querySelector('.exhibitionInfo');
      if (a) {
        items.push({
          title: a.title || a.textContent.trim(),
          href: a.href,
          meta: meta ? meta.textContent.trim() : '',
          unread: a.classList.contains('unread'),
        });
      }
    });
    return items;
  })();

  // 学期セレクトの選択肢・現在値
  const yearSelectData = (() => {
    const sel = document.querySelector('select[name="year"]');
    if (!sel) return { options: [{ value: '2026', label: '2026', selected: true }], selected: '2026' };
    const options = Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent.trim(), selected: o.selected }));
    return { options, selected: sel.value };
  })();

  const semesterSelectData = (() => {
    const sel = document.querySelector('select[name="semester"]');
    if (!sel) return { options: [{ value: '1', label: '前期', selected: true }], selected: '1' };
    const options = Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent.trim(), selected: o.selected }));
    return { options, selected: sel.value };
  })();

  const scheduleData = (() => {
    const rows = [];
    const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    document.querySelectorAll('.schedule-table tbody tr').forEach(tr => {
      const orderCell = tr.querySelector('.schedule-table-class_order');
      const order = orderCell ? orderCell.textContent.trim() : '';
      const cells = tr.querySelectorAll('td:not(.schedule-table-class_order)');
      const dayCourses = {};
      cells.forEach((td, i) => {
        const a = td.querySelector('a');
        if (a) {
          const hasDeadline = td.querySelector('.course-contents-info') !== null;
          dayCourses[days[i]] = {
            title: a.textContent.replace(/»\s*/, '').replace(/\[.*?\]/g, '').replace(/\([\d]+\)/g, '').replace(/（.*?）/g, '  ').replace('締切が近い課題があります。', '').trim(),
            fullTitle: a.textContent.replace(/»\s*/, '').replace('締切が近い課題があります。', '').trim(),
            href: a.href,
            hasDeadline,
          };
        }
      });
      rows.push({ order, dayCourses });
    });
    return rows;
  })();

  const todayDayMap = { 0: '日曜日', 1: '月曜日', 2: '火曜日', 3: '水曜日', 4: '木曜日', 5: '金曜日', 6: '土曜日' };
  const todayDay = todayDayMap[new Date().getDay()];

  const otherCourses = (() => {
    const groups = [];
    document.querySelectorAll('.courseLevelOne > li').forEach(li => {
      const groupTitle = li.querySelector('.courseTree-levelTitle');
      if (!groupTitle) return;
      const courses = [];
      li.querySelectorAll('.courseList > li').forEach(item => {
        const a = item.querySelector('a');
        const info = item.querySelector('.course-info');
        if (a) {
          courses.push({
            title: a.textContent.replace(/»\s*/, '').trim(),
            href: a.href,
            info: info ? info.textContent.trim() : '',
          });
        }
      });
      if (courses.length > 0) {
        groups.push({ title: groupTitle.textContent.trim(), courses });
      }
    });
    return groups;
  })();

  // アンケート：同一タイトル「アンケート」の.side-blockが複数存在するため最初の1件のみ採用
  const surveyData = (() => {
    const items = [];
    const block = Array.from(document.querySelectorAll('.side-block')).find(b => {
      const t = b.querySelector('h4.side-block-title, h2.side-block-title');
      return t && t.textContent.trim() === 'アンケート';
    });
    if (!block) return items;
    block.querySelectorAll('.menugroup li a').forEach(a => {
      const text = a.textContent.trim();
      const match = text.match(/\((\d+)\)/);
      const count = match ? parseInt(match[1], 10) : 0;
      const label = text.replace(/\s*\(\d+\)/, '').replace(/^»\s*/, '').trim();
      items.push({ label, count, href: a.href });
    });
    return items;
  })();

  // その他のサイドブロック（アンケートを除く、タイトル重複は除去して最初の1件のみ採用）
  const sideLinks = (() => {
    const items = [];
    const seen = new Set(['アンケート']);
    document.querySelectorAll('.side-block').forEach(block => {
      const title = block.querySelector('.side-block-title, h2.side-block-title, h4.side-block-title');
      if (!title) return;
      const titleText = title.textContent.trim();
      if (seen.has(titleText)) return;
      seen.add(titleText);
      const links = [];
      block.querySelectorAll('a').forEach(a => {
        links.push({
          text: a.textContent.replace(/»\s*/, '').trim(),
          href: a.href,
          onClick: a.getAttribute('onclick') || '',
          className: a.className || '',
        });
      });
      if (links.length > 0) {
        items.push({ title: titleText, links });
      }
    });
    return items;
  })();

  const addCourseHref = (() => {
    const a = document.querySelector('a[href*="/courses/"]');
    return a ? a.href : '/webclass/index.php/courses/';
  })();

  // ─── 既存UI非表示 ────────────────────────────────────────────
  document.querySelectorAll('header, #js-main, footer').forEach(el => {
    el.style.display = 'none';
  });

  // ─── ヘルパー ─────────────────────────────────────────────────
  function escAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── テーマ設定（localStorage永続化） ──────────────────────────
  const ACCENT_PRESETS = [
    { name: 'インディゴ', value: '#6366F1' },
    { name: 'バイオレット', value: '#8B5CF6' },
    { name: 'スカイ',    value: '#0EA5E9' },
    { name: 'ティール',  value: '#14B8A6' },
    { name: 'エメラルド', value: '#10B981' },
    { name: 'ローズ',   value: '#F43F5E' },
    { name: 'アンバー',  value: '#F59E0B' },
  ];

  const savedAccent = localStorage.getItem('wc_accent') || '#6366F1';
  const savedMode   = localStorage.getItem('wc_mode')   || 'system';

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return { r, g, b };
  }
  function rgbToHex(r, g, b) {
    return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`;
  }
  function rgbStr({r,g,b}) { return `${r},${g},${b}`; }

  function lightenAccent(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40));
  }

  // アクセントカラーに黒を混ぜて可読性を高めた「チップテキスト用カラー」
  function darkenForChipText(hex, darkAmount = 0.22) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r * (1 - darkAmount), g * (1 - darkAmount), b * (1 - darkAmount));
  }

  // RGB → HSL
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  // HSL → RGB
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  // テーマカラーに応じた「締切間近」用カラーを生成する。
  // テーマカラー自体がオレンジ〜赤系の場合は、混同を避けるため色相を大きくずらす。
  // それ以外の場合は、彩度・明度を強めた警告トーンの暖色を作る。
  function deriveDeadlineColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const { h, s } = rgbToHsl(r, g, b);
    const isWarmClash = (h >= 0 && h <= 50) || (h >= 330 && h <= 360);
    const targetHue = isWarmClash ? 320 : 4;
    const targetSat = Math.max(70, s);
    const { r: nr, g: ng, b: nb } = hslToRgb(targetHue, targetSat, 56);
    return rgbToHex(nr, ng, nb);
  }

  // ════════════════════════════════════════════════════════════
  // スタイル注入
  // ════════════════════════════════════════════════════════════
  const styleEl = document.createElement('style');
  styleEl.id = 'wc-style';
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    #wc-app {
      --bg:         #0F172A;
      --surface:    #1E293B;
      --surface2:   #263348;
      --surface3:   #2e3d55;
      --border:     #334155;
      --accent:     #6366F1;
      --accent-lt:  #818CF8;
      --accent-dk:  #4a4ccc;
      --accent-rgb: 99,102,241;
      --deadline:   #EF4444;
      --warn:       #F59E0B;
      --danger:     #EF4444;
      --success:    #10B981;
      --text:       #E2E8F0;
      --text-muted: #94A3B8;
      --text-dim:   #64748B;
      --today-col:  rgba(var(--accent-rgb),0.08);
      --topbar-bg:  rgba(15,23,42,0.88);
      --chip-text:  var(--accent-lt);
    }

    #wc-app.wc-light {
      --bg:         #F8FAFC;
      --surface:    #FFFFFF;
      --surface2:   #F1F5F9;
      --surface3:   #E2E8F0;
      --border:     #CBD5E1;
      --text:       #0F172A;
      --text-muted: #475569;
      --text-dim:   #94A3B8;
      --today-col:  rgba(var(--accent-rgb),0.07);
      --topbar-bg:  rgba(248,250,252,0.92);
      --chip-text:  var(--accent-dk);
    }

    #wc-app {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
      background: var(--bg);
      min-height: 100vh;
      color: var(--text);
      font-size: 14px;
      line-height: 1.6;
    }

    /* ══ Topbar ══ */
    .wc-topbar {
      position: sticky;
      top: 0;
      z-index: 200;
      background: var(--topbar-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      height: 56px;
      padding: 0 24px;
    }
    .wc-logo {
      font-weight: 700;
      font-size: 18px;
      color: var(--accent-lt);
      letter-spacing: -0.5px;
      text-decoration: none;
      margin-right: 28px;
      flex-shrink: 0;
    }
    .wc-logo span { color: var(--text); }

    .wc-nav { display: flex; gap: 2px; flex: 1; }
    .wc-nav a {
      color: var(--text-muted);
      text-decoration: none;
      padding: 6px 11px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
      position: relative;
    }
    .wc-nav a:hover { background: var(--surface2); color: var(--text); }
    .wc-nav a.wc-active { color: var(--text); font-weight: 600; }
    .wc-nav a.wc-active::after {
      content: '';
      position: absolute;
      bottom: -1px; left: 8px; right: 8px;
      height: 2px;
      border-radius: 2px 2px 0 0;
      background: var(--accent);
    }

    .wc-topbar-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }

    /* ══ ボタンラッパー共通（下線防止用div） ══ */
    .wc-btn-wrap { display: inline-block; }
    .wc-btn-wrap a { text-decoration: none !important; }

    /* ══ メールアイコンボタン ══ */
    .wc-msg-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      border-radius: 7px;
      color: var(--text-muted);
      font-size: 15px;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
      position: relative;
    }
    .wc-msg-btn:hover { background: var(--surface2); color: var(--text); }
    .wc-msg-btn .glyphicon { color: inherit; font-size: 15px; }
    /* 未読件数：0件時は非表示、1件以上はアクセントカラーで目立たせる */
    .wc-msg-count {
      display: none;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
    }
    .wc-msg-count.has-unread {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9px;
      background: var(--accent);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
    }

    /* ══ ログアウトボタン ══ */
    .wc-logout-btn {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      color: var(--text-dim);
      padding: 5px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .wc-logout-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--text-muted); }

    /* ══ アバター + ユーザー名トリガー ══ */
    .wc-avatar-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 7px;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
      position: relative;
    }
    .wc-avatar-trigger:hover { background: var(--surface2); }
    .wc-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: var(--surface2);
      object-fit: cover;
      flex-shrink: 0;
    }
    /* アバター未設定時のプレースホルダー */
    .wc-avatar-placeholder {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--surface3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: var(--text-dim);
      flex-shrink: 0;
    }
    .wc-username { font-size: 15px; font-weight: 500; color: var(--text-muted); white-space: nowrap; }
    .wc-avatar-caret { font-size: 24px; color: var(--text-dim); margin-left: 2px; margin-bottom: 3px;}

    /* ══ アカウントポップアップ ══ */
    .wc-popup {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 300px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.28);
      z-index: 300;
      overflow: hidden;
      opacity: 0;
      transform: translateY(-6px);
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .wc-popup.open { opacity: 1; transform: translateY(0); pointer-events: all; }

    .wc-popup-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-bottom: 1px solid var(--border);
    }
    /* ポップアップ内のアバター（クリックでアップロードトリガー） */
    .wc-popup-avatar-wrap {
      position: relative;
      width: 48px; height: 48px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .wc-popup-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      border: none;
      background: var(--surface2);
      object-fit: cover;
      display: block;
    }
    .wc-popup-avatar-placeholder {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: var(--surface3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--text-dim);
    }
    /* ホバー時にカメラオーバーレイを表示 */
    .wc-popup-avatar-overlay {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;
      font-size: 16px;
    }
    .wc-popup-avatar-wrap:hover .wc-popup-avatar-overlay { opacity: 1; }
    /* 隠しファイル入力 */
    #wc-avatar-input { display: none; }

    .wc-popup-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .wc-popup-username { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

    .wc-popup-links { padding: 6px; }
    .wc-popup-link {
      display: block;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
      transition: background 0.12s, color 0.12s;
    }
    .wc-popup-link:hover { background: var(--surface2); color: var(--text); text-decoration: none; }

    .wc-popup-divider { height: 1px; background: var(--border); margin: 4px 0; }

    .wc-popup-section { padding: 10px 14px 14px; border-top: 1px solid var(--border); }
    .wc-popup-section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text-dim); margin-bottom: 10px;
    }
    .wc-popup-row { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
    .wc-popup-row:last-child { margin-bottom: 0; }
    .wc-popup-row-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--text-dim); margin-bottom: 5px;
    }

    /* ══ セグメントボタン（外観モード切替） ══ */
    .wc-segment { display: flex; gap: 5px; }
    .wc-segment-btn {
      flex: 1;
      padding: 5px 4px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface2);
      color: var(--text-muted);
      font-size: 11.5px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s, color 0.12s;
      text-align: center;
    }
    .wc-segment-btn:hover { background: var(--surface3); color: var(--text); }
    .wc-segment-btn.active {
      border-color: var(--accent);
      color: var(--accent-lt);
      background: rgba(var(--accent-rgb), 0.1);
    }

    /* ══ カラースウォッチ ══ */
    .wc-swatches { display: flex; gap: 7px; flex-wrap: wrap; }
    .wc-swatch {
      width: 24px; height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.12s, border-color 0.12s;
      flex-shrink: 0;
    }
    .wc-swatch:hover { transform: scale(1.15); }
    .wc-swatch.active { border-color: var(--text); transform: scale(1.1); }

    /* ══ Layout ══ */
    .wc-body {
      max-width: 1340px;
      margin: 0 auto;
      padding: 28px 24px;
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 30px;
      align-items: start;
    }
    @media (max-width: 960px) {
      .wc-body { grid-template-columns: 1fr; }
      .wc-sidebar { display: none; }
    }

    /* ══ Sidebar / Card 共通 ══ */
    .wc-sidebar { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; }
    .wc-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .wc-card-head {
      padding: 9px 14px;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border);
      background: rgba(128,128,128,0.04);
    }
    .wc-card-body { padding: 6px; }
    .wc-card-empty { padding: 10px; font-size: 12px; color: var(--text-dim); }

    /* ══ クリッカブルアイテム（共通コンポーネント） ══ */
    .wc-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .wc-item:hover { background: var(--surface2); }
    .wc-item a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13px;
      transition: color 0.12s;
    }
    .wc-item a:hover { text-decoration: none !important; color: var(--text); }
    .wc-item-content { display: flex; flex-direction: column; line-height: 1.4; word-break: break-all; }
    .wc-item-title { font-size: 12.5px; }
    .wc-item-title.bold { color: var(--text); font-weight: 600; }
    .wc-item-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
    .wc-item-info { font-size: 11px; color: var(--text-dim); margin-left: auto; flex-shrink: 0; }
    .wc-item-info.accent { color: var(--accent-lt); font-weight: 600; }
    .wc-item-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .wc-item-dot.unread { background: var(--accent); }
    .wc-item-dot.read   { background: var(--border); }

    .wc-see-all {
      display: block;
      text-align: right;
      padding: 4px 10px 8px;
      font-size: 11px;
      color: var(--accent-lt);
      text-decoration: none;
      transition: color 0.12s;
    }
    .wc-see-all:hover { color: var(--text); }

    /* ══ Main Content ══ */
    .wc-main { display: flex; flex-direction: column; gap: 24px; }
    .wc-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .wc-section-title {
      font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim);
    }

    /* ══ Schedule ══ */
    .wc-schedule-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .wc-schedule-head { display: flex; align-items: center; padding: 11px 18px; border-bottom: 1px solid var(--border); gap: 12px; flex-wrap: wrap; }
    .wc-schedule-title-text { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; white-space: nowrap; }
    .wc-schedule-filter { display: flex; gap: 6px; align-items: center; }
    .wc-schedule-filter label { font-size: 11px; color: var(--text-dim); white-space: nowrap; }
    .wc-schedule-filter select {
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      transition: border-color 0.12s;
    }
    .wc-schedule-filter select:hover { border-color: var(--text-muted); }
    .wc-schedule-filter select:focus { outline: none; border-color: var(--accent); }
    .wc-schedule-filter-sep { font-size: 12px; color: var(--text-dim); }

    /* CSS Grid タイムテーブル */
    .wc-timetable { display: grid; grid-template-columns: 68px repeat(6, 1fr); }
    .wc-tt-hcell {
      padding: 9px 4px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border);
      background: rgba(128,128,128,0.03);
    }
    .wc-tt-hcell.wc-today-h { color: var(--accent-lt); background: var(--today-col); }
    .wc-tt-hcell.wc-corner { background: transparent; }

    .wc-tt-cell {
      height: 76px;
      padding: 6px 5px;
      border-bottom: 1px solid rgba(128,128,128,0.15);
      border-right: 1px solid rgba(128,128,128,0.1);
      overflow: hidden;
    }
    .wc-tt-row-last .wc-tt-cell { border-bottom: none; }
    .wc-tt-cell.wc-time-lbl {
      display: flex; align-items: center; justify-content: center; text-align: center;
      font-size: 10px; font-weight: 500; color: var(--text-dim);
      background: rgba(128,128,128,0.02);
      border-right: 1px solid var(--border) !important;
      line-height: 1.3; padding: 4px 2px;
    }
    .wc-tt-cell.wc-today-bg { background: var(--today-col); }
    .wc-tt-cell.wc-last-col { border-right: none; }

    /* ══ コースチップ ══ */
    .wc-chip {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: 5px 7px;
      background: rgba(var(--accent-rgb), 0.1);
      border: 1px solid rgba(var(--accent-rgb), 0.22);
      border-radius: 6px;
      text-decoration: none;
      font-size: 12px;
      line-height: 1.35;
      overflow: hidden;
      transition: background 0.12s, border-color 0.12s;
    }
    .wc-chip:hover { background: rgba(var(--accent-rgb), 0.18); border-color: rgba(var(--accent-rgb), 0.42); }
    .wc-chip-link { height: 100%; text-decoration: none !important; }
    .wc-chip-title {
      color: var(--chip-text);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-all;
    }

    /* 締切間近：左ボーダーをテーマカラー連動の警告色にする */
    .wc-chip.wc-deadline { border-left: 3px solid var(--deadline); }
    .wc-chip.wc-deadline:hover { border-left-color: var(--deadline); }
    .wc-chip-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-top: 3px;
      font-size: 10px;
      font-weight: 700;
      color: var(--deadline);
      letter-spacing: 0.02em;
      flex-shrink: 0;
      white-space: nowrap;
    }

    /* ══ コースを追加 ══ */
    .wc-add-bar { display: flex; justify-content: flex-end; padding: 11px 16px; border-top: 1px solid var(--border); }
    .wc-add-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 7px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      font-family: inherit;
    }
    .wc-add-btn:hover { border-color: var(--accent); color: var(--accent-lt); background: rgba(var(--accent-rgb), 0.07); }

    /* ══ その他コース ══ */
    .wc-other-courses { display: flex; flex-direction: column; gap: 10px; }
    .wc-course-search {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 9px 14px;
      color: var(--text);
      font-size: 13px;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .wc-course-search::placeholder { color: var(--text-dim); }
    .wc-course-search:focus { outline: none; border-color: var(--accent); }

    .wc-course-group { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .wc-group-title {
      padding: 9px 16px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border);
      background: rgba(128,128,128,0.03);
    }
    .wc-course-list { padding: 5px; }

    /* ══ Footer ══ */
    .wc-footer {
      text-align: center;
      padding: 20px 24px;
      font-size: 11px;
      color: var(--text-dim);
      border-top: 1px solid var(--border);
      margin-top: 4px;
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
  `;
  document.head.appendChild(styleEl);

  // ─── 定数 ─────────────────────────────────────────────────────
  const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const dayShort = ['月', '火', '水', '木', '金', '土'];

  // ════════════════════════════════════════════════════════════
  // コンポーネント（よく使う部品をすべて関数化）
  // ════════════════════════════════════════════════════════════

  /** クリッカブルなリスト項目（お知らせ・アンケート・サイドリンク・コース一覧で共用） */
  function Item({
    hasDot = false,
    dotState = 'read', // 'unread' | 'read'
    title,
    isBold = false,
    subText = '',
    infoText = '',
    infoAccent = false,
    href,
    onClick = '',
    titleAttr = '',
    className = '',
    searchDataAttr = ''
  }) {
    const dotHtml = hasDot ? `<span class="wc-item-dot ${dotState}"></span>` : '';
    return `
      <div class="wc-item" ${onClick && !onClick.includes('return') ? `onclick="${escAttr(onClick)}"` : ''}>
        <a class="${className}"
           href="${escAttr(href)}"
           ${onClick && onClick.includes('return') ? `onclick="${escAttr(onClick)}"` : ''}
           ${titleAttr ? `title="${escAttr(titleAttr)}"` : ''}
           ${searchDataAttr ? `data-course-name="${escAttr(searchDataAttr)}"` : ''}
        >
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            ${dotHtml}
            <div class="wc-item-content">
              <div class="wc-item-title ${isBold ? 'bold' : ''}">${escHtml(title)}</div>
              ${subText ? `<div class="wc-item-sub">${escHtml(subText)}</div>` : ''}
            </div>
          </div>
          ${infoText ? `<span class="wc-item-info${infoAccent ? ' accent' : ''}">${escHtml(infoText)}</span>` : ''}
        </a>
      </div>
    `;
  }

  /** サイドバー用カード（ヘッダー + 本文） */
  function Card({ title, bodyHtml, footerHtml = '' }) {
    return `
      <div class="wc-card">
        <div class="wc-card-head">${escHtml(title)}</div>
        <div class="wc-card-body">${bodyHtml}</div>
        ${footerHtml}
      </div>
    `;
  }

  /** 下線の出ない汎用ボタンリンク（<div>ラッパー + <a>） */
  function ButtonLink({ href, label, className = 'wc-add-btn', onClick = '', extraAttrs = '' }) {
    return `
      <div class="wc-btn-wrap">
        <a class="${className}" href="${escAttr(href)}" ${onClick ? `onclick="${escAttr(onClick)}"` : ''} ${extraAttrs}>${escHtml(label)}</a>
      </div>
    `;
  }

  /** セグメントボタン群（外観モード切替などに使用） */
  function SegmentControl({ options, dataAttr }) {
    return `
      <div class="wc-segment">
        ${options.map(o => `<button class="wc-segment-btn" data-${dataAttr}="${escAttr(o.value)}">${escHtml(o.label)}</button>`).join('')}
      </div>
    `;
  }

  /** カラースウォッチ群 */
  function SwatchGroup({ presets }) {
    return `
      <div class="wc-swatches">
        ${presets.map(p => `<div class="wc-swatch" data-accent="${escAttr(p.value)}" title="${escHtml(p.name)}" style="background:${escAttr(p.value)};"></div>`).join('')}
      </div>
    `;
  }

  /** セレクトの<option>群を生成 */
  function SelectOptions(optionList) {
    return optionList.map(o =>
      `<option value="${escAttr(o.value)}" ${o.selected ? 'selected' : ''}>${escHtml(o.label)}</option>`
    ).join('');
  }

  // ─── 学期表示タイトル生成 ──────────────────────────────────────
  function buildScheduleTitle(yearVal, semesterVal) {
    const yearLabel = yearVal === 'all' ? '全年度' : `${yearVal}年度`;
    const semLabel = semesterVal === 'all' ? '通年'
                   : semesterVal === '1' ? '前期'
                   : semesterVal === '2' ? '後期'
                   : semesterVal;
    return `${yearLabel} ${semLabel}`;
  }

  // ════════════════════════════════════════════════════════════
  // HTML組み立て
  // ════════════════════════════════════════════════════════════

  const currentPath = location.pathname;

  // ─── Topbar ──────────────────────────────────────────────────
  // アバターHTML（topbar用・小サイズ）
  function renderAvatarSmall(src) {
    if (src) return `<img class="wc-avatar" id="wc-avatar-img" src="${escAttr(src)}" alt="">`;
    return `<div class="wc-avatar-placeholder" id="wc-avatar-img">👤</div>`;
  }
  // アバターHTML（ポップアップ用・大サイズ）
  function renderAvatarLarge(src) {
    const imgOrPlaceholder = src
      ? `<img class="wc-popup-avatar" id="wc-popup-avatar-img" src="${escAttr(src)}" alt="">`
      : `<div class="wc-popup-avatar-placeholder" id="wc-popup-avatar-img">👤</div>`;
    return `
      <div class="wc-popup-avatar-wrap" id="wc-popup-avatar-wrap" title="クリックしてアバター画像を変更">
        ${imgOrPlaceholder}
        <div class="wc-popup-avatar-overlay">📷</div>
        <input type="file" id="wc-avatar-input" accept="image/*">
      </div>
    `;
  }

  const topbarHTML = `
    <div class="wc-topbar">
      <a class="wc-logo" href="/webclass/"><span>Web</span>Class</a>
      <nav class="wc-nav">
        ${navLinks.slice(0, 3).map(l => {
          const isActive = l.href && currentPath.startsWith(new URL(l.href, location.origin).pathname.split('?')[0]);
          return `<a href="${escAttr(l.href)}" ${isActive ? 'class="wc-active"' : ''}>${escHtml(l.text)}</a>`;
        }).join('')}
      </nav>
      <div class="wc-topbar-right">
        <!-- メールアイコン（未読がある時のみバッジ表示） -->
        <a class="wc-msg-btn" href="${escAttr(messageHref)}"
           ${messageOnClick ? `onclick="${escAttr(messageOnClick)}"` : ''}
           target="msgeditor" title="メッセージ">
          ${messageIconHTML}
          <span class="wc-msg-count ${unreadMessageCount > 0 ? 'has-unread' : ''}">${unreadMessageCount > 0 ? unreadMessageCount : ''}</span>
        </a>

        <!-- ログアウト -->
        ${ButtonLink({ href: logoutHref, label: 'ログアウト', className: 'wc-logout-btn' })}

        <!-- アバター + ユーザー名（クリックでポップアップ） -->
        <div class="wc-avatar-trigger" id="wc-avatar-trigger">
          ${renderAvatarSmall(currentAvatarSrc)}
          <span class="wc-username">${escHtml(userName)}</span>
          <span class="wc-avatar-caret">▾</span>

          <div class="wc-popup" id="wc-account-popup">
            <div class="wc-popup-header">
              ${renderAvatarLarge(currentAvatarSrc)}
              <div>
                <div class="wc-popup-name">${escHtml(userName)}</div>
                <div class="wc-popup-username">${escHtml(userName)}</div>
              </div>
            </div>

            <div class="wc-popup-links">
              ${accountMenuLinks.map(l => `
                <a class="wc-popup-link"
                   href="${escAttr(l.href)}"
                   ${l.target ? `target="${escAttr(l.target)}"` : ''}
                   ${l.onClick ? `onclick="${escAttr(l.onClick)}"` : ''}
                >${escHtml(l.text)}</a>
              `).join('')}
            </div>

            <div class="wc-popup-divider"></div>

            <div class="wc-popup-section">
              <div class="wc-popup-section-label">テーマ設定</div>
              <div class="wc-popup-row">
                <div class="wc-popup-row-label">外観</div>
                ${SegmentControl({
                  dataAttr: 'mode',
                  options: [
                    { value: 'light', label: 'ライト' },
                    { value: 'dark', label: 'ダーク' },
                    { value: 'system', label: 'システム' },
                  ],
                })}
              </div>
              <div class="wc-popup-row">
                <div class="wc-popup-row-label">テーマカラー</div>
                ${SwatchGroup({ presets: ACCENT_PRESETS })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ─── Timetable ───────────────────────────────────────────────
  const initTitle = buildScheduleTitle(yearSelectData.selected, semesterSelectData.selected);

  const timetableHTML = `
    <section>
      <div class="wc-section-head">
        <span class="wc-section-title">時間割</span>
      </div>
      <div class="wc-schedule-wrap">
        <div class="wc-schedule-head">
          <span class="wc-schedule-title-text" id="wc-schedule-title">${escHtml(initTitle)}</span>
          <div class="wc-schedule-filter">
            <label>学年度</label>
            <select id="wc-year-select">${SelectOptions(yearSelectData.options)}</select>
            <span class="wc-schedule-filter-sep">/</span>
            <label>学期</label>
            <select id="wc-semester-select">${SelectOptions(semesterSelectData.options)}</select>
          </div>
        </div>
        <div class="wc-timetable">
          <div class="wc-tt-hcell wc-corner"></div>
          ${days.map((d, i) =>
            `<div class="wc-tt-hcell ${d === todayDay ? 'wc-today-h' : ''}">${dayShort[i]}${d === todayDay ? ' ●' : ''}</div>`
          ).join('')}

          ${scheduleData.map((row, rowIdx) => {
            const isLast = rowIdx === scheduleData.length - 1;
            return `
              <div class="wc-tt-cell wc-time-lbl ${isLast ? 'wc-tt-row-last' : ''}">${escHtml(row.order)}</div>
              ${days.map((d, ci) => {
                const course = row.dayCourses[d];
                const isToday = d === todayDay;
                const isLastCol = ci === days.length - 1;
                const cellClass = [
                  'wc-tt-cell',
                  isToday ? 'wc-today-bg' : '',
                  isLastCol ? 'wc-last-col' : '',
                  isLast ? 'wc-tt-row-last' : '',
                ].filter(Boolean).join(' ');

                if (course) {
                  return `
                    <div class="${cellClass}">
                      <div class="wc-chip${course.hasDeadline ? ' wc-deadline' : ''}">
                        <a class="wc-chip-link" href="${escAttr(course.href)}" title="${escAttr(course.fullTitle)}">
                          <span class="wc-chip-title">${escHtml(course.title)}</span>
                          ${course.hasDeadline ? '<span class="wc-chip-badge">⚠ 締切間近</span>' : ''}
                        </a>
                      </div>
                    </div>
                  `;
                } else {
                  return `<div class="${cellClass}"></div>`;
                }
              }).join('')}
            `;
          }).join('')}
        </div>
        <div class="wc-add-bar">
          ${ButtonLink({ href: addCourseHref, label: '＋ コースを追加', className: 'wc-add-btn' })}
        </div>
      </div>
    </section>
  `;

  // ─── Sidebar ─────────────────────────────────────────────────
  const surveyCardHTML = surveyData.length > 0 ? Card({
    title: 'アンケート',
    bodyHtml: surveyData.map(s => {
      const countLabel = s.count > 0 ? `${s.count}件` : 'なし';
      const hasUnread = s.count > 0;
      return Item({
        hasDot: true,
        dotState: hasUnread ? 'unread' : 'read',
        title: s.label,
        isBold: hasUnread,
        infoText: countLabel,
        infoAccent: hasUnread,
        href: s.href,
      });
    }).join(''),
  }) : '';

  const sideLinkCardsHTML = sideLinks.map(group => Card({
    title: group.title,
    bodyHtml: group.links.length === 0
      ? `<p class="wc-card-empty">リンクはありません</p>`
      : group.links.map(link => Item({
          title: link.text,
          href: link.href,
          onClick: link.onClick,
          className: link.className.includes('showInIframeButton') ? 'showInIframeButton' : ''
        })).join(''),
  })).join('');

  const noticeCardHTML = Card({
    title: '管理者からのお知らせ',
    bodyHtml: notices.length === 0
      ? `<p class="wc-card-empty">お知らせはありません</p>`
      : notices.map(n => Item({
          hasDot: true,
          dotState: n.unread ? 'unread' : 'read',
          title: n.title.length > 36 ? n.title.slice(0,36)+'…' : n.title,
          isBold: n.unread,
          subText: n.meta,
          href: n.href,
          onClick: `return openMessage('${n.href}')`,
          titleAttr: n.title,
        })).join(''),
    footerHtml: `<a class="wc-see-all" href="/webclass/informations.php" target="msgeditor" onclick="return openMessage('/webclass/informations.php')">すべて見る →</a>`,
  });

  const sidebarHTML = `
    <aside class="wc-sidebar">
      ${surveyCardHTML}
      ${sideLinkCardsHTML}
      ${noticeCardHTML}
    </aside>
  `;

  // ─── Other Courses ───────────────────────────────────────────
  const otherCoursesHTML = `
    <section>
      <div class="wc-section-head">
        <span class="wc-section-title">その他のコース</span>
      </div>
      <div class="wc-other-courses">
        <input type="text" class="wc-course-search" id="wc-search" placeholder="コース名で検索…">
        ${otherCourses.map(group => `
          <div class="wc-course-group" data-group>
            <div class="wc-group-title">${escHtml(group.title)}</div>
            <div class="wc-course-list">
              ${group.courses.map(c => Item({
                title: c.title,
                infoText: c.info,
                href: c.href,
                className: 'wc-course-item',
                searchDataAttr: c.title,
              })).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  // ─── アプリ組み立て ──────────────────────────────────────────
  document.body.style.margin = '0'
    
  const app = document.createElement('div');
  app.id = 'wc-app';
  app.innerHTML = `
    ${topbarHTML}
    <div class="wc-body">
      <main class="wc-main">
        ${timetableHTML}
        ${otherCoursesHTML}
      </main>
      ${sidebarHTML}
    </div>
    <footer class="wc-footer">Powered by WebClass — Miyazaki University</footer>
  `;
  document.body.appendChild(app);

  // ════════════════════════════════════════════════════════════
  // テーマ適用
  // ════════════════════════════════════════════════════════════
  function applyAccent(hex) {
    const root = document.getElementById('wc-app');
    if (!root) return;
    const lt = lightenAccent(hex);
    const dk = darkenForChipText(hex, 0.22);
    const rgb = rgbStr(hexToRgb(hex));
    const deadline = deriveDeadlineColor(hex);

    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-lt', lt);
    root.style.setProperty('--accent-dk', dk);
    root.style.setProperty('--accent-rgb', rgb);
    root.style.setProperty('--deadline', deadline);

    document.querySelectorAll('.wc-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.accent === hex);
    });
  }

  function applyMode(mode) {
    const root = document.getElementById('wc-app');
    if (!root) return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    root.classList.toggle('wc-light', !isDark);
    document.querySelectorAll('.wc-segment-btn[data-mode]').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  applyAccent(savedAccent);
  applyMode(savedMode);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = localStorage.getItem('wc_mode') || 'system';
    if (current === 'system') applyMode('system');
  });

  // ════════════════════════════════════════════════════════════
  // インタラクティブ機能
  // ════════════════════════════════════════════════════════════

  // コース検索
  const searchInput = document.getElementById('wc-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      document.querySelectorAll('[data-group]').forEach(group => {
        let anyVisible = false;
        group.querySelectorAll('.wc-item').forEach(item => {
          const aTag = item.querySelector('a');
          const name = (aTag && aTag.dataset.courseName || '').toLowerCase();
          const match = !q || name.includes(q);
          item.style.display = match ? '' : 'none';
          if (match) anyVisible = true;
        });
        group.style.display = anyVisible ? '' : 'none';
      });
    });
  }

  // モード切替
  document.querySelectorAll('.wc-segment-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = btn.dataset.mode;
      localStorage.setItem('wc_mode', mode);
      applyMode(mode);
    });
  });

  // アクセントカラースウォッチ
  document.querySelectorAll('.wc-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      const hex = swatch.dataset.accent;
      localStorage.setItem('wc_accent', hex);
      applyAccent(hex);
    });
  });

  // アバタークリックでポップアップ開閉
  const avatarTrigger = document.getElementById('wc-avatar-trigger');
  const accountPopup  = document.getElementById('wc-account-popup');
  if (avatarTrigger && accountPopup) {
    avatarTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      accountPopup.classList.toggle('open', !accountPopup.classList.contains('open'));
    });
    document.addEventListener('click', () => accountPopup.classList.remove('open'));
    accountPopup.addEventListener('click', (e) => e.stopPropagation());
  }

  // アバター画像アップロード処理
  // ポップアップ内のアバターエリアをクリック → <input type="file"> を発火
  // 選択された画像をFileReaderでBase64化 → localStorageに保存 → 即時反映
  const avatarWrap  = document.getElementById('wc-popup-avatar-wrap');
  const avatarInput = document.getElementById('wc-avatar-input');
  if (avatarWrap && avatarInput) {
    avatarWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarInput.click();
    });
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        // localStorageに保存（次回以降もこの画像が使われる）
        try {
          localStorage.setItem('wc_avatar', dataUrl);
        } catch {
          // localStorageの容量制限（~5MB）に引っかかった場合は保存を諦める
          console.warn('WebClass UI: アバター画像の保存に失敗しました（容量超過の可能性）');
        }
        // Topbar小アバターを即時更新
        const smallEl = document.getElementById('wc-avatar-img');
        if (smallEl) {
          const newImg = document.createElement('img');
          newImg.className = 'wc-avatar';
          newImg.id = 'wc-avatar-img';
          newImg.src = dataUrl;
          smallEl.replaceWith(newImg);
        }
        // ポップアップ大アバターを即時更新
        const largeEl = document.getElementById('wc-popup-avatar-img');
        if (largeEl) {
          const newImg = document.createElement('img');
          newImg.className = 'wc-popup-avatar';
          newImg.id = 'wc-popup-avatar-img';
          newImg.src = dataUrl;
          largeEl.replaceWith(newImg);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // 学期セレクト連動
  const yearSelect     = document.getElementById('wc-year-select');
  const semesterSelect = document.getElementById('wc-semester-select');
  const scheduleTitle  = document.getElementById('wc-schedule-title');

  function updateScheduleTitle() {
    if (!scheduleTitle || !yearSelect || !semesterSelect) return;
    scheduleTitle.textContent = buildScheduleTitle(yearSelect.value, semesterSelect.value);
  }

  if (yearSelect && semesterSelect) {
    const origYearSelect     = document.querySelector('select[name="year"]');
    const origSemesterSelect = document.querySelector('select[name="semester"]');
    const origForm           = document.querySelector('form[name="condition"]');

    yearSelect.addEventListener('change', () => {
      updateScheduleTitle();
      if (origYearSelect && origForm) {
        origYearSelect.value = yearSelect.value;
        origForm.submit();
      }
    });

    semesterSelect.addEventListener('change', () => {
      updateScheduleTitle();
      if (origSemesterSelect && origForm) {
        origSemesterSelect.value = semesterSelect.value;
        origForm.submit();
      }
    });
  }

  // openMessage関数
  if (typeof window.openMessage === 'undefined') {
    window.openMessage = function (url) {
      const w = window.open(url, 'msgeditor', 'toolbar=no,location=no,directories=no,status=yes,menubar=no,scrollbars=yes,resizable=yes,width=820,height=650');
      if (w !== null) w.focus();
      return false;
    };
  }

})();