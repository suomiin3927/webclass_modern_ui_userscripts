// ==UserScript==
// @name         WebClass Modern UI
// @namespace    https://webclass.miyazaki-u.ac.jp/
// @version      4.0.0
// @description  WebClassのUIを現代的なダッシュボードデザインに刷新する
// @author       Aiki
// @match        *://*/webclass/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/suomiin3927/webclass_modern_ui_userscripts/refs/heads/main/scripts/main.user.js
// @downloadURL  https://raw.githubusercontent.com/suomiin3927/webclass_modern_ui_userscripts/refs/heads/main/scripts/main.user.js
// ==/UserScript==

/**
 * WebClass Modern UI — メインエントリポイント
 *
 * ファイル構成（論理モジュール）
 * ├── [UTILS]      汎用ユーティリティ（文字列エスケープ・色変換・DOMヘルパー）
 * ├── [THEME]      テーマ定数・カラー操作・CSS変数への適用
 * ├── [STYLES]     全スタイル定義（CSS文字列）
 * ├── [COMPONENTS] 再利用可能なHTMLコンポーネント関数群
 * ├── [ROUTER]     ページ判定・ページ別エントリの振り分け
 * ├── [PAGES]      各ページのデータ抽出 + HTML組み立て + イベント登録
 * │   ├── [PAGES/TOP]  トップページ（時間割・コース一覧）
 * │   └── （今後ページを追加する場合はここに追記）
 * └── [BOOT]       起動（既存UI非表示 → スタイル注入 → ルーター呼び出し）
 */

(function () {
  'use strict';

  // ============================================================
  // [UTILS] 汎用ユーティリティ
  // ============================================================

  /**
   * HTML属性値として安全に挿入できるようエスケープする。
   * @param {*} s - エスケープ対象の値
   * @returns {string}
   */
  function escAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * HTMLテキストノードとして安全に挿入できるようエスケープする。
   * @param {*} s - エスケープ対象の値
   * @returns {string}
   */
  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ============================================================
  // [THEME] テーマ定数・カラー操作
  // ============================================================

  /** アクセントカラーのプリセット一覧 */
  const ACCENT_PRESETS = [
    { name: 'インディゴ', value: '#6366F1' },
    { name: 'バイオレット', value: '#8B5CF6' },
    { name: 'スカイ',      value: '#0EA5E9' },
    { name: 'ティール',    value: '#14B8A6' },
    { name: 'エメラルド',  value: '#10B981' },
    { name: 'ローズ',      value: '#F43F5E' },
    { name: 'アンバー',    value: '#F59E0B' },
  ];

  /** localStorage のキー定数 */
  const STORAGE_KEY_ACCENT = 'wc_accent';
  const STORAGE_KEY_MODE   = 'wc_mode';
  const STORAGE_KEY_AVATAR = 'wc_avatar';

  /** アプリルート要素の ID */
  const APP_ROOT_ID = 'wc-app';

  /**
   * 16進カラーコードを RGB オブジェクトに変換する。
   * @param {string} hex - '#RRGGBB' 形式
   * @returns {{ r: number, g: number, b: number }}
   */
  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  /**
   * RGB 値を 16進カラーコードに変換する。
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {string}
   */
  function rgbToHex(r, g, b) {
    return `#${[r, g, b]
      .map(v => Math.round(v).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  /**
   * RGB オブジェクトを CSS rgb() 用のカンマ区切り文字列に変換する。
   * @param {{ r: number, g: number, b: number }} rgb
   * @returns {string} 例: "99,102,241"
   */
  function rgbToStr({ r, g, b }) {
    return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;
  }

  /**
   * RGB 値を HSL に変換する。
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {{ h: number, s: number, l: number }} 各値は 0–360 / 0–100 / 0–100
   */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

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

  /**
   * HSL 値を RGB に変換する。
   * @param {number} h - 0–360
   * @param {number} s - 0–100
   * @param {number} l - 0–100
   * @returns {{ r: number, g: number, b: number }}
   */
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  /**
   * アクセントカラーを明るくした派生色を返す（ライトバリアント用）。
   * @param {string} hex
   * @returns {string}
   */
  function calcAccentLight(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40));
  }

  /**
   * アクセントカラーを暗くした派生色を返す（チップテキスト・ライトモード用）。
   * @param {string} hex
   * @param {number} [amount=0.22] - 暗くする割合 (0.0〜1.0)
   * @returns {string}
   */
  function calcAccentDark(hex, amount = 0.22) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
  }

  /**
   * アクセントカラーに応じた「締切間近」表示用の警告色を生成する。
   * - テーマ色がオレンジ〜赤系の場合は色相を大きくずらしてマゼンタ系に
   * - それ以外は彩度・明度を強めた赤系にする
   * @param {string} hex
   * @returns {string}
   */
  function calcDeadlineColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const { h, s } = rgbToHsl(r, g, b);
    const isWarmClash = (h >= 0 && h <= 50) || (h >= 330 && h <= 360);
    const targetHue = isWarmClash ? 320 : 4;
    const targetSat = Math.max(70, s);
    const { r: nr, g: ng, b: nb } = hslToRgb(targetHue, targetSat, 56);
    return rgbToHex(nr, ng, nb);
  }

  /**
   * アクセントカラーを `#wc-app` の CSS 変数に適用し、スウォッチのアクティブ状態を更新する。
   * @param {string} hex - '#RRGGBB' 形式のカラーコード
   */
  function applyAccent(hex) {
    const root = document.getElementById(APP_ROOT_ID);
    if (!root) return;
    root.style.setProperty('--accent',     hex);
    root.style.setProperty('--accent-lt',  calcAccentLight(hex));
    root.style.setProperty('--accent-dk',  calcAccentDark(hex, 0.22));
    root.style.setProperty('--accent-rgb', rgbToStr(hexToRgb(hex)));
    root.style.setProperty('--deadline',   calcDeadlineColor(hex));

    document.querySelectorAll('.wc-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.accent === hex);
    });
  }

  /**
   * 外観モード（ライト / ダーク / システム）を適用する。
   * @param {'light'|'dark'|'system'} mode
   */
  function applyMode(mode) {
    const root = document.getElementById(APP_ROOT_ID);
    if (!root) return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    root.classList.toggle('wc-light', !isDark);
    document.querySelectorAll('.wc-segment-btn[data-mode]').forEach(el => {
      el.classList.toggle('active', el.dataset.mode === mode);
    });
  }

  // ============================================================
  // [STYLES] 全スタイル定義
  // ============================================================

  /**
   * アプリ全体のスタイルシートを生成して <head> に注入する。
   */
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'wc-style';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ─── CSS 変数（ダークモード：デフォルト） ─── */
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
        --today-col:  rgba(var(--accent-rgb), 0.08);
        --topbar-bg:  rgba(15,23,42,0.88);
        --chip-text:  var(--accent-lt);
      }

      /* ─── CSS 変数（ライトモード） ─── */
      #wc-app.wc-light {
        --bg:         #F8FAFC;
        --surface:    #FFFFFF;
        --surface2:   #F1F5F9;
        --surface3:   #E2E8F0;
        --border:     #CBD5E1;
        --text:       #0F172A;
        --text-muted: #475569;
        --text-dim:   #94A3B8;
        --today-col:  rgba(var(--accent-rgb), 0.07);
        --topbar-bg:  rgba(248,250,252,0.92);
        --chip-text:  var(--accent-dk);
      }

      /* ─── ベース ─── */
      #wc-app {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont,
                     'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
        background: var(--bg);
        min-height: 100vh;
        color: var(--text);
        font-size: 14px;
        line-height: 1.6;
      }

      /* ════ Topbar ════ */
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

      /* ─── 汎用ボタンラッパー（下線・スタイルのリセット用） ─── */
      .wc-btn-wrap { display: inline-block; }
      .wc-btn-wrap a { text-decoration: none !important; }

      /* ─── メッセージアイコンボタン ─── */
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
      }
      .wc-msg-btn:hover { background: var(--surface2); color: var(--text); }
      .wc-msg-btn .glyphicon { color: inherit; font-size: 15px; }

      /* 未読件数バッジ：0件時は非表示 */
      .wc-msg-badge { display: none; }
      .wc-msg-badge.has-unread {
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

      /* ─── ログアウトボタン ─── */
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
      .wc-logout-btn:hover {
        background: var(--surface2);
        color: var(--text);
        border-color: var(--text-muted);
      }

      /* ─── アバタートリガー（ユーザー名 + アバター） ─── */
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
      .wc-avatar-caret { font-size: 24px; color: var(--text-dim); margin-left: 2px; margin-bottom: 3px; }

      /* ════ アカウントポップアップ ════ */
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

      /* ポップアップ内のアバター（クリックでアップロード） */
      .wc-popup-avatar-wrap {
        position: relative;
        width: 48px; height: 48px;
        flex-shrink: 0;
        cursor: pointer;
      }
      .wc-popup-avatar {
        width: 48px; height: 48px;
        border-radius: 50%;
        background: var(--surface2);
        object-fit: cover;
        display: block;
      }
      .wc-popup-avatar-placeholder {
        width: 48px; height: 48px;
        border-radius: 50%;
        background: var(--surface3);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; color: var(--text-dim);
      }
      .wc-popup-avatar-overlay {
        position: absolute; inset: 0;
        border-radius: 50%;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        opacity: 0;
        transition: opacity 0.15s;
        font-size: 16px;
      }
      .wc-popup-avatar-wrap:hover .wc-popup-avatar-overlay { opacity: 1; }
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

      /* ─── セグメントボタン（外観モード切替） ─── */
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

      /* ─── カラースウォッチ ─── */
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

      /* ════ レイアウト ════ */
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

      /* ════ サイドバー / カード ════ */
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

      /* ─── クリッカブルリストアイテム（共通コンポーネント） ─── */
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

      /* ════ メインコンテンツ ════ */
      .wc-main { display: flex; flex-direction: column; gap: 24px; }
      .wc-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .wc-section-title {
        font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
        text-transform: uppercase; color: var(--text-dim);
      }

      /* ════ 時間割 ════ */
      .wc-schedule-wrap {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .wc-schedule-head {
        display: flex; align-items: center;
        padding: 11px 18px;
        border-bottom: 1px solid var(--border);
        gap: 12px;
        flex-wrap: wrap;
      }
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
      .wc-tt-hcell.wc-corner  { background: transparent; }

      .wc-tt-cell {
        height: 76px;
        padding: 6px 5px;
        border-bottom: 1px solid rgba(128,128,128,0.15);
        border-right: 1px solid rgba(128,128,128,0.1);
        overflow: hidden;
      }
      .wc-tt-row-last .wc-tt-cell { border-bottom: none; }
      .wc-tt-cell.wc-time-lbl {
        display: flex; align-items: center; justify-content: center;
        text-align: center;
        font-size: 10px; font-weight: 500; color: var(--text-dim);
        background: rgba(128,128,128,0.02);
        border-right: 1px solid var(--border) !important;
        line-height: 1.3; padding: 4px 2px;
      }
      .wc-tt-cell.wc-today-bg { background: var(--today-col); }
      .wc-tt-cell.wc-last-col { border-right: none; }

      /* ─── コースチップ ─── */
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
      .wc-chip:hover {
        background: rgba(var(--accent-rgb), 0.18);
        border-color: rgba(var(--accent-rgb), 0.42);
      }
      .wc-chip-link { height: 100%; text-decoration: none !important; }
      .wc-chip-title {
        color: var(--chip-text);
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        word-break: break-all;
      }
      /* 締切間近：左ボーダーをテーマ連動の警告色で強調 */
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

      /* ─── コース追加バー ─── */
      .wc-add-bar {
        display: flex;
        justify-content: flex-end;
        padding: 11px 16px;
        border-top: 1px solid var(--border);
      }
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
      .wc-add-btn:hover {
        border-color: var(--accent);
        color: var(--accent-lt);
        background: rgba(var(--accent-rgb), 0.07);
      }

      /* ════ その他のコース ════ */
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

      .wc-course-group {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        overflow: hidden;
      }
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

      /* ════ フッター ════ */
      .wc-footer {
        text-align: center;
        padding: 20px 24px;
        font-size: 11px;
        color: var(--text-dim);
        border-top: 1px solid var(--border);
        margin-top: 4px;
      }

      /* ════ スクロールバー ════ */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: var(--bg); }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // [COMPONENTS] 再利用可能な HTML コンポーネント
  // ============================================================

  /**
   * クリッカブルなリストアイテムを生成する。
   * お知らせ・アンケート・サイドリンク・コース一覧で共用。
   *
   * @param {object} props
   * @param {boolean} [props.hasDot=false]          - 既読/未読ドットを表示するか
   * @param {'unread'|'read'} [props.dotState='read'] - ドットの状態
   * @param {string}  props.title                    - メインテキスト
   * @param {boolean} [props.isBold=false]           - テキストを太字にするか
   * @param {string}  [props.subText='']             - サブテキスト（メタ情報）
   * @param {string}  [props.infoText='']            - 右端の補足テキスト
   * @param {boolean} [props.infoAccent=false]       - 補足テキストをアクセント色にするか
   * @param {string}  props.href                     - リンク先 URL
   * @param {string}  [props.onClick='']             - onclick 属性値
   * @param {string}  [props.titleAttr='']           - title 属性（ツールチップ）
   * @param {string}  [props.extraClass='']          - <a> 要素に追加するクラス
   * @param {string}  [props.searchKey='']           - コース検索用データ属性値
   * @returns {string} HTML 文字列
   */
  function Item({
    hasDot      = false,
    dotState    = 'read',
    title,
    isBold      = false,
    subText     = '',
    infoText    = '',
    infoAccent  = false,
    href,
    onClick     = '',
    titleAttr   = '',
    extraClass  = '',
    searchKey   = '',
  }) {
    const dotHtml      = hasDot ? `<span class="wc-item-dot ${dotState}"></span>` : '';
    const subHtml      = subText   ? `<div class="wc-item-sub">${escHtml(subText)}</div>` : '';
    const infoHtml     = infoText  ? `<span class="wc-item-info${infoAccent ? ' accent' : ''}">${escHtml(infoText)}</span>` : '';
    const titleAttrs   = titleAttr  ? `title="${escAttr(titleAttr)}"` : '';
    const searchAttrs  = searchKey  ? `data-course-name="${escAttr(searchKey)}"` : '';
    // onclick が `return xxx` 形式のものはアンカー側に付ける（画面遷移を伴う動作）
    const onClickOnDiv = onClick && !onClick.includes('return') ? `onclick="${escAttr(onClick)}"` : '';
    const onClickOnA   = onClick &&  onClick.includes('return') ? `onclick="${escAttr(onClick)}"` : '';

    return `
      <div class="wc-item" ${onClickOnDiv}>
        <a class="${extraClass}"
           href="${escAttr(href)}"
           ${onClickOnA}
           ${titleAttrs}
           ${searchAttrs}
        >
          <div style="display:flex;gap:8px;align-items:flex-start;">
            ${dotHtml}
            <div class="wc-item-content">
              <div class="wc-item-title${isBold ? ' bold' : ''}">${escHtml(title)}</div>
              ${subHtml}
            </div>
          </div>
          ${infoHtml}
        </a>
      </div>
    `;
  }

  /**
   * サイドバー用カードを生成する（ヘッダー + ボディ + 任意フッター）。
   *
   * @param {object} props
   * @param {string} props.title     - カードヘッダーのタイトル
   * @param {string} props.bodyHtml  - カードボディの HTML
   * @param {string} [props.footerHtml=''] - カードフッターの HTML
   * @returns {string} HTML 文字列
   */
  function Card({ title, bodyHtml, footerHtml = '' }) {
    return `
      <div class="wc-card">
        <div class="wc-card-head">${escHtml(title)}</div>
        <div class="wc-card-body">${bodyHtml}</div>
        ${footerHtml}
      </div>
    `;
  }

  /**
   * 下線が出ない汎用ボタンリンクを生成する（<div> ラッパー + <a>）。
   *
   * @param {object} props
   * @param {string} props.href
   * @param {string} props.label
   * @param {string} [props.className='wc-add-btn']
   * @param {string} [props.onClick='']
   * @param {string} [props.extraAttrs=''] - <a> 要素に追加する属性文字列
   * @returns {string} HTML 文字列
   */
  function ButtonLink({ href, label, className = 'wc-add-btn', onClick = '', extraAttrs = '' }) {
    const onClickAttr = onClick ? `onclick="${escAttr(onClick)}"` : '';
    return `
      <div class="wc-btn-wrap">
        <a class="${className}" href="${escAttr(href)}" ${onClickAttr} ${extraAttrs}>${escHtml(label)}</a>
      </div>
    `;
  }

  /**
   * セグメントボタン群を生成する（外観モード切替などに使用）。
   *
   * @param {object} props
   * @param {{ value: string, label: string }[]} props.options
   * @param {string} props.dataAttr - data-* 属性のキー名（例: 'mode' → data-mode="..."）
   * @returns {string} HTML 文字列
   */
  function SegmentControl({ options, dataAttr }) {
    return `
      <div class="wc-segment">
        ${options.map(o =>
          `<button class="wc-segment-btn" data-${dataAttr}="${escAttr(o.value)}">${escHtml(o.label)}</button>`
        ).join('')}
      </div>
    `;
  }

  /**
   * カラースウォッチ群を生成する。
   *
   * @param {object} props
   * @param {{ name: string, value: string }[]} props.presets
   * @returns {string} HTML 文字列
   */
  function SwatchGroup({ presets }) {
    return `
      <div class="wc-swatches">
        ${presets.map(p =>
          `<div class="wc-swatch" data-accent="${escAttr(p.value)}" title="${escHtml(p.name)}" style="background:${escAttr(p.value)};"></div>`
        ).join('')}
      </div>
    `;
  }

  /**
   * <select> の <option> 群を生成する。
   *
   * @param {{ value: string, label: string, selected: boolean }[]} optionList
   * @returns {string} HTML 文字列
   */
  function SelectOptions(optionList) {
    return optionList.map(o =>
      `<option value="${escAttr(o.value)}" ${o.selected ? 'selected' : ''}>${escHtml(o.label)}</option>`
    ).join('');
  }

  /**
   * トップバー用の小アバターを生成する。
   *
   * @param {string} src - 画像 URL または Base64。空文字の場合はプレースホルダーを表示。
   * @returns {string} HTML 文字列
   */
  function AvatarSmall(src) {
    if (src) return `<img class="wc-avatar" id="wc-avatar-img" src="${escAttr(src)}" alt="">`;
    return `<div class="wc-avatar-placeholder" id="wc-avatar-img">👤</div>`;
  }

  /**
   * ポップアップ用の大アバター（クリックでアップロードトリガー）を生成する。
   *
   * @param {string} src - 画像 URL または Base64。空文字の場合はプレースホルダーを表示。
   * @returns {string} HTML 文字列
   */
  function AvatarLarge(src) {
    const inner = src
      ? `<img class="wc-popup-avatar" id="wc-popup-avatar-img" src="${escAttr(src)}" alt="">`
      : `<div class="wc-popup-avatar-placeholder" id="wc-popup-avatar-img">👤</div>`;
    return `
      <div class="wc-popup-avatar-wrap" id="wc-popup-avatar-wrap" title="クリックしてアバター画像を変更">
        ${inner}
        <div class="wc-popup-avatar-overlay">📷</div>
        <input type="file" id="wc-avatar-input" accept="image/*">
      </div>
    `;
  }

  // ============================================================
  // [ROUTER] ページ判定・ルーティング
  //
  // 新しいページを追加する場合は以下の手順に従う:
  //   1. ページ判定関数 `isXxxPage()` を定義する
  //   2. `ROUTES` 配列にエントリを追加する（match / page の 2 プロパティ）
  //   3. [PAGES] セクションにページモジュールを実装する
  // ============================================================

  /**
   * ページ判定：トップページ（時間割 or コースツリーを持つ）
   * @returns {boolean}
   */
  function isTopPage() {
    return !!(
      document.querySelector('#js-main') &&
      (document.querySelector('.schedule-table') || document.querySelector('.courseTree'))
    );
  }

  /**
   * ルート定義。上から順に評価し、最初にマッチしたページを描画する。
   * @type {{ match: () => boolean, page: () => void }[]}
   */
  const ROUTES = [
    { match: isTopPage, page: renderTopPage },
    // 今後追加する例:
    // { match: isCoursePage, page: renderCoursePage },
  ];

  /**
   * 現在のページに対応するルートを探して描画を実行する。
   * どのルートにもマッチしない場合は何もしない。
   */
  function runRouter() {
    const route = ROUTES.find(r => r.match());
    if (route) route.page();
  }

  // ============================================================
  // [PAGES/TOP] トップページ
  // ============================================================

  /**
   * トップページのデータを WebClass の既存 DOM から抽出する。
   *
   * 注意: WebClass の標準 HTML は PC 用 (.hidden-xs) とスマホ用 (.visible-xs 等) の
   * 同一ブロックを重複描画している箇所がある。
   * 抽出時は必ず「PC 用（.hidden-xs を持つ方）」を優先し、1 件だけ採用すること。
   *
   * @returns {object} トップページで使用する全データ
   */
  function extractTopPageData() {
    // ─── ユーザー情報 ─────────────────────────────────────────
    const userName = (() => {
      const el = document.querySelector(
        'body > header > nav > div:nth-child(1) > ul > li:nth-child(2) > a > span'
      );
      return el ? el.textContent.trim() : 'User';
    })();

    // アバター: localStorage 保存画像 → WebClass 既存画像 の優先順
    const savedAvatarSrc = localStorage.getItem(STORAGE_KEY_AVATAR) || '';
    const wcAvatarSrc = (() => {
      const img = document.querySelector('.navbar-nav .dropdown > a > img');
      return img ? img.src : '';
    })();
    const avatarSrc = savedAvatarSrc || wcAvatarSrc;

    // ─── ナビゲーション ───────────────────────────────────────
    // 最大 3 件のみ表示（4 件目以降は余分なリンクが混入するため）
    const navLinks = (() => {
      const links = [];
      document.querySelectorAll('.nav.navbar-left > li > a').forEach(a => {
        const text = a.textContent.trim().replace(/\s+/g, ' ');
        if (text && !text.includes('ログアウト')) {
          links.push({ text, href: a.href });
        }
      });
      return links.slice(0, 3);
    })();

    const logoutHref = (() => {
      const a = document.querySelector('a[href*="logout.php"]');
      return a ? a.href : '/webclass/logout.php';
    })();

    // ─── メッセージアイコン ───────────────────────────────────
    const msgAnchor   = document.querySelector('#notification-dropdown-icon');
    const messageHref = msgAnchor ? msgAnchor.href : '/webclass/msg_editor.php?msgappmode=inbox';
    const messageOnClick = msgAnchor ? (msgAnchor.getAttribute('onclick') || '') : '';
    const messageIconHTML = (() => {
      const iconEl = document.querySelector('#notification-dropdown-icon .glyphicon-envelope');
      return iconEl
        ? iconEl.outerHTML
        : '<span class="glyphicon glyphicon-envelope" aria-hidden="true"></span>';
    })();
    // #js-unread-message-count は未読がある時のみ存在する
    const unreadCount = (() => {
      const badge = document.querySelector('#js-unread-message-count');
      if (!badge) return 0;
      const n = parseInt(badge.textContent.trim(), 10);
      return isNaN(n) ? 0 : n;
    })();

    // ─── アカウントドロップダウン ─────────────────────────────
    // PC 用 (.hidden-xs) の最初の .dropdown-menu だけを採用する
    const accountMenuLinks = (() => {
      const pcMenu  = document.querySelector('.navbar-nav.navbar-right.hidden-xs .dropdown-menu');
      const anyMenu = document.querySelector('.navbar-nav .dropdown-menu');
      const menu    = pcMenu || anyMenu;
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

    // ─── お知らせ ─────────────────────────────────────────────
    const notices = (() => {
      const items = [];
      document.querySelectorAll('#AjaxInfoBox .info-list li:not(.head)').forEach(li => {
        const a    = li.querySelector('.hidden-xs a.title') || li.querySelector('a.title');
        const meta = li.querySelector('.exhibitionInfo');
        if (a) {
          items.push({
            title:  a.title || a.textContent.trim(),
            href:   a.href,
            meta:   meta ? meta.textContent.trim() : '',
            unread: a.classList.contains('unread'),
          });
        }
      });
      return items;
    })();

    // ─── 学期フィルター ───────────────────────────────────────
    const yearSelectData = (() => {
      const sel = document.querySelector('select[name="year"]');
      if (!sel) return { options: [{ value: '2026', label: '2026', selected: true }], selected: '2026' };
      return {
        options:  Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent.trim(), selected: o.selected })),
        selected: sel.value,
      };
    })();

    const semesterSelectData = (() => {
      const sel = document.querySelector('select[name="semester"]');
      if (!sel) return { options: [{ value: '1', label: '前期', selected: true }], selected: '1' };
      return {
        options:  Array.from(sel.options).map(o => ({ value: o.value, label: o.textContent.trim(), selected: o.selected })),
        selected: sel.value,
      };
    })();

    // ─── 時間割 ───────────────────────────────────────────────
    const DAYS_LONG  = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const scheduleData = (() => {
      const rows = [];
      document.querySelectorAll('.schedule-table tbody tr').forEach(tr => {
        const orderCell = tr.querySelector('.schedule-table-class_order');
        const order     = orderCell ? orderCell.textContent.trim() : '';
        const cells     = tr.querySelectorAll('td:not(.schedule-table-class_order)');
        const dayCourses = {};
        cells.forEach((td, i) => {
          const a = td.querySelector('a');
          if (a) {
            const hasDeadline = td.querySelector('.course-contents-info') !== null;
            dayCourses[DAYS_LONG[i]] = {
              title: a.textContent
                .replace(/»\s*/, '')
                .replace(/\[.*?\]/g, '')
                .replace(/\([\d]+\)/g, '')
                .replace(/（.*?）/g, '  ')
                .replace('締切が近い課題があります。', '')
                .trim(),
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

    const TODAY_DAY_MAP = { 0: '日曜日', 1: '月曜日', 2: '火曜日', 3: '水曜日', 4: '木曜日', 5: '金曜日', 6: '土曜日' };
    const todayDay = TODAY_DAY_MAP[new Date().getDay()];

    // ─── その他のコース ───────────────────────────────────────
    const otherCourses = (() => {
      const groups = [];
      document.querySelectorAll('.courseLevelOne > li').forEach(li => {
        const groupTitle = li.querySelector('.courseTree-levelTitle');
        if (!groupTitle) return;
        const courses = [];
        li.querySelectorAll('.courseList > li').forEach(item => {
          const a    = item.querySelector('a');
          const info = item.querySelector('.course-info');
          if (a) {
            courses.push({
              title: a.textContent.replace(/»\s*/, '').trim(),
              href:  a.href,
              info:  info ? info.textContent.trim() : '',
            });
          }
        });
        if (courses.length > 0) {
          groups.push({ title: groupTitle.textContent.trim(), courses });
        }
      });
      return groups;
    })();

    // ─── アンケート ───────────────────────────────────────────
    // 同一タイトル「アンケート」の .side-block が複数ある場合は最初の 1 件のみ採用
    const surveyData = (() => {
      const items = [];
      const block = Array.from(document.querySelectorAll('.side-block')).find(b => {
        const t = b.querySelector('h4.side-block-title, h2.side-block-title');
        return t && t.textContent.trim() === 'アンケート';
      });
      if (!block) return items;
      block.querySelectorAll('.menugroup li a').forEach(a => {
        const text  = a.textContent.trim();
        const match = text.match(/\((\d+)\)/);
        const count = match ? parseInt(match[1], 10) : 0;
        const label = text.replace(/\s*\(\d+\)/, '').replace(/^»\s*/, '').trim();
        items.push({ label, count, href: a.href });
      });
      return items;
    })();

    // ─── その他サイドブロック ─────────────────────────────────
    // アンケートを除き、タイトル重複は最初の 1 件のみ採用
    const sideLinks = (() => {
      const items = [];
      const seen  = new Set(['アンケート']);
      document.querySelectorAll('.side-block').forEach(block => {
        const titleEl = block.querySelector('.side-block-title, h2.side-block-title, h4.side-block-title');
        if (!titleEl) return;
        const titleText = titleEl.textContent.trim();
        if (seen.has(titleText)) return;
        seen.add(titleText);
        const links = [];
        block.querySelectorAll('a').forEach(a => {
          links.push({
            text:      a.textContent.replace(/»\s*/, '').trim(),
            href:      a.href,
            onClick:   a.getAttribute('onclick') || '',
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

    return {
      userName,
      avatarSrc,
      navLinks,
      logoutHref,
      messageHref,
      messageOnClick,
      messageIconHTML,
      unreadCount,
      accountMenuLinks,
      notices,
      yearSelectData,
      semesterSelectData,
      scheduleData,
      todayDay,
      otherCourses,
      surveyData,
      sideLinks,
      addCourseHref,
    };
  }

  /**
   * 年度と学期の値から時間割ヘッダーに表示するタイトル文字列を生成する。
   *
   * @param {string} yearVal     - 年度値（例: '2026', 'all'）
   * @param {string} semesterVal - 学期値（例: '1', '2', 'all'）
   * @returns {string}
   */
  function buildScheduleTitle(yearVal, semesterVal) {
    const yearLabel = yearVal === 'all' ? '全年度' : `${yearVal}年度`;
    const semLabel  = semesterVal === 'all' ? '通年'
                    : semesterVal === '1'   ? '前期'
                    : semesterVal === '2'   ? '後期'
                    : semesterVal;
    return `${yearLabel} ${semLabel}`;
  }

  // ─── [PAGES/TOP] HTML 組み立て ──────────────────────────────

  /**
   * Topbar の HTML を生成する。
   *
   * @param {ReturnType<extractTopPageData>} data
   * @returns {string}
   */
  function buildTopbarHtml(data) {
    const {
      userName, avatarSrc, navLinks, logoutHref,
      messageHref, messageOnClick, messageIconHTML, unreadCount,
      accountMenuLinks,
    } = data;

    const currentPath     = location.pathname;
    const hasUnread       = unreadCount > 0;
    const onClickAttr     = messageOnClick ? `onclick="${escAttr(messageOnClick)}"` : '';

    const navHtml = navLinks.map(l => {
      const linkPath = l.href ? new URL(l.href, location.origin).pathname.split('?')[0] : '';
      const isActive = linkPath && currentPath.startsWith(linkPath);
      return `<a href="${escAttr(l.href)}"${isActive ? ' class="wc-active"' : ''}>${escHtml(l.text)}</a>`;
    }).join('');

    const accountLinksHtml = accountMenuLinks.map(l => `
      <a class="wc-popup-link"
         href="${escAttr(l.href)}"
         ${l.target ? `target="${escAttr(l.target)}"` : ''}
         ${l.onClick ? `onclick="${escAttr(l.onClick)}"` : ''}
      >${escHtml(l.text)}</a>
    `).join('');

    return `
      <div class="wc-topbar">
        <a class="wc-logo" href="/webclass/"><span>Web</span>Class</a>
        <nav class="wc-nav">${navHtml}</nav>
        <div class="wc-topbar-right">

          <!-- メッセージアイコン（未読バッジ付き） -->
          <a class="wc-msg-btn"
             href="${escAttr(messageHref)}"
             ${onClickAttr}
             target="msgeditor"
             title="メッセージ"
          >
            ${messageIconHTML}
            <span class="wc-msg-badge${hasUnread ? ' has-unread' : ''}">${hasUnread ? unreadCount : ''}</span>
          </a>

          <!-- ログアウト -->
          ${ButtonLink({ href: logoutHref, label: 'ログアウト', className: 'wc-logout-btn' })}

          <!-- アバター + ユーザー名（クリックでポップアップ） -->
          <div class="wc-avatar-trigger" id="wc-avatar-trigger">
            ${AvatarSmall(avatarSrc)}
            <span class="wc-username">${escHtml(userName)}</span>
            <span class="wc-avatar-caret">▾</span>

            <div class="wc-popup" id="wc-account-popup">
              <div class="wc-popup-header">
                ${AvatarLarge(avatarSrc)}
                <div>
                  <div class="wc-popup-name">${escHtml(userName)}</div>
                  <div class="wc-popup-username">${escHtml(userName)}</div>
                </div>
              </div>

              <div class="wc-popup-links">${accountLinksHtml}</div>
              <div class="wc-popup-divider"></div>

              <div class="wc-popup-section">
                <div class="wc-popup-section-label">テーマ設定</div>
                <div class="wc-popup-row">
                  <div class="wc-popup-row-label">外観</div>
                  ${SegmentControl({
                    dataAttr: 'mode',
                    options: [
                      { value: 'light',  label: 'ライト'   },
                      { value: 'dark',   label: 'ダーク'   },
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
  }

  /**
   * 時間割セクションの HTML を生成する。
   *
   * @param {ReturnType<extractTopPageData>} data
   * @returns {string}
   */
  function buildTimetableHtml(data) {
    const { scheduleData, todayDay, yearSelectData, semesterSelectData, addCourseHref } = data;
    const DAYS_LONG  = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const DAYS_SHORT = ['月', '火', '水', '木', '金', '土'];
    const initTitle  = buildScheduleTitle(yearSelectData.selected, semesterSelectData.selected);

    const headerCells = DAYS_LONG.map((d, i) => {
      const isToday = d === todayDay;
      return `<div class="wc-tt-hcell${isToday ? ' wc-today-h' : ''}">${DAYS_SHORT[i]}${isToday ? ' ●' : ''}</div>`;
    }).join('');

    const bodyRows = scheduleData.map((row, rowIdx) => {
      const isLast = rowIdx === scheduleData.length - 1;
      const rowClass = isLast ? ' wc-tt-row-last' : '';

      const cells = DAYS_LONG.map((d, ci) => {
        const course    = row.dayCourses[d];
        const isToday   = d === todayDay;
        const isLastCol = ci === DAYS_LONG.length - 1;
        const cellClass = [
          'wc-tt-cell',
          isToday   ? 'wc-today-bg' : '',
          isLastCol ? 'wc-last-col' : '',
          isLast    ? 'wc-tt-row-last' : '',
        ].filter(Boolean).join(' ');

        if (!course) return `<div class="${cellClass}"></div>`;
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
      }).join('');

      return `<div class="wc-tt-cell wc-time-lbl${rowClass}">${escHtml(row.order)}</div>${cells}`;
    }).join('');

    return `
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
            ${headerCells}
            ${bodyRows}
          </div>
          <div class="wc-add-bar">
            ${ButtonLink({ href: addCourseHref, label: '＋ コースを追加', className: 'wc-add-btn' })}
          </div>
        </div>
      </section>
    `;
  }

  /**
   * サイドバーの HTML を生成する。
   *
   * @param {ReturnType<extractTopPageData>} data
   * @returns {string}
   */
  function buildSidebarHtml(data) {
    const { surveyData, sideLinks, notices } = data;

    const surveyCardHtml = surveyData.length > 0
      ? Card({
          title: 'アンケート',
          bodyHtml: surveyData.map(s => Item({
            hasDot:     true,
            dotState:   s.count > 0 ? 'unread' : 'read',
            title:      s.label,
            isBold:     s.count > 0,
            infoText:   s.count > 0 ? `${s.count}件` : 'なし',
            infoAccent: s.count > 0,
            href:       s.href,
          })).join(''),
        })
      : '';

    const sideLinkCardsHtml = sideLinks.map(group => Card({
      title: group.title,
      bodyHtml: group.links.length === 0
        ? `<p class="wc-card-empty">リンクはありません</p>`
        : group.links.map(link => Item({
            title:      link.text,
            href:       link.href,
            onClick:    link.onClick,
            extraClass: link.className.includes('showInIframeButton') ? 'showInIframeButton' : '',
          })).join(''),
    })).join('');

    const noticeCardHtml = Card({
      title: '管理者からのお知らせ',
      bodyHtml: notices.length === 0
        ? `<p class="wc-card-empty">お知らせはありません</p>`
        : notices.map(n => Item({
            hasDot:    true,
            dotState:  n.unread ? 'unread' : 'read',
            title:     n.title.length > 36 ? n.title.slice(0, 36) + '…' : n.title,
            isBold:    n.unread,
            subText:   n.meta,
            href:      n.href,
            onClick:   `return openMessage('${n.href}')`,
            titleAttr: n.title,
          })).join(''),
      footerHtml: `<a class="wc-see-all" href="/webclass/informations.php" target="msgeditor"
                      onclick="return openMessage('/webclass/informations.php')">すべて見る →</a>`,
    });

    return `
      <aside class="wc-sidebar">
        ${surveyCardHtml}
        ${sideLinkCardsHtml}
        ${noticeCardHtml}
      </aside>
    `;
  }

  /**
   * その他のコースセクションの HTML を生成する。
   *
   * @param {ReturnType<extractTopPageData>} data
   * @returns {string}
   */
  function buildOtherCoursesHtml(data) {
    const { otherCourses } = data;

    const groupsHtml = otherCourses.map(group => `
      <div class="wc-course-group" data-group>
        <div class="wc-group-title">${escHtml(group.title)}</div>
        <div class="wc-course-list">
          ${group.courses.map(c => Item({
            title:     c.title,
            infoText:  c.info,
            href:      c.href,
            searchKey: c.title,
          })).join('')}
        </div>
      </div>
    `).join('');

    return `
      <section>
        <div class="wc-section-head">
          <span class="wc-section-title">その他のコース</span>
        </div>
        <div class="wc-other-courses">
          <input type="text" class="wc-course-search" id="wc-search" placeholder="コース名で検索…">
          ${groupsHtml}
        </div>
      </section>
    `;
  }

  // ─── [PAGES/TOP] イベント登録 ───────────────────────────────

  /**
   * コース検索入力欄のイベントを登録する。
   * 入力した文字列にマッチしないコースを非表示にする。
   */
  function bindCourseSearch() {
    const input = document.getElementById('wc-search');
    if (!input) return;
    input.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();
      document.querySelectorAll('[data-group]').forEach(group => {
        let anyVisible = false;
        group.querySelectorAll('.wc-item').forEach(item => {
          const a       = item.querySelector('a');
          const name    = (a && a.dataset.courseName || '').toLowerCase();
          const visible = !query || name.includes(query);
          item.style.display = visible ? '' : 'none';
          if (visible) anyVisible = true;
        });
        group.style.display = anyVisible ? '' : 'none';
      });
    });
  }

  /**
   * 外観モード切替ボタンのイベントを登録する。
   */
  function bindModeButtons() {
    document.querySelectorAll('.wc-segment-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const mode = btn.dataset.mode;
        localStorage.setItem(STORAGE_KEY_MODE, mode);
        applyMode(mode);
      });
    });
  }

  /**
   * テーマカラースウォッチのイベントを登録する。
   */
  function bindSwatches() {
    document.querySelectorAll('.wc-swatch').forEach(swatch => {
      swatch.addEventListener('click', e => {
        e.stopPropagation();
        const hex = swatch.dataset.accent;
        localStorage.setItem(STORAGE_KEY_ACCENT, hex);
        applyAccent(hex);
      });
    });
  }

  /**
   * アバタートリガーとアカウントポップアップの開閉イベントを登録する。
   */
  function bindAccountPopup() {
    const trigger = document.getElementById('wc-avatar-trigger');
    const popup   = document.getElementById('wc-account-popup');
    if (!trigger || !popup) return;

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      popup.classList.toggle('open', !popup.classList.contains('open'));
    });
    document.addEventListener('click', () => popup.classList.remove('open'));
    popup.addEventListener('click', e => e.stopPropagation());
  }

  /**
   * アバター画像のアップロード処理を登録する。
   * - ポップアップ内のアバターエリアをクリック → <input type="file"> を発火
   * - 選択画像を FileReader で Base64 化 → localStorage に保存 → 即時反映
   */
  function bindAvatarUpload() {
    const wrap  = document.getElementById('wc-popup-avatar-wrap');
    const input = document.getElementById('wc-avatar-input');
    if (!wrap || !input) return;

    wrap.addEventListener('click', e => {
      e.stopPropagation();
      input.click();
    });

    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        try {
          localStorage.setItem(STORAGE_KEY_AVATAR, dataUrl);
        } catch {
          // localStorage の容量制限（~5MB）超過時は保存をスキップ
          console.warn('WebClass UI: アバター画像の保存に失敗しました（容量超過の可能性）');
        }
        // Topbar の小アバターを即時更新
        const smallEl = document.getElementById('wc-avatar-img');
        if (smallEl) {
          const newImg = document.createElement('img');
          newImg.className = 'wc-avatar';
          newImg.id        = 'wc-avatar-img';
          newImg.src       = dataUrl;
          smallEl.replaceWith(newImg);
        }
        // ポップアップの大アバターを即時更新
        const largeEl = document.getElementById('wc-popup-avatar-img');
        if (largeEl) {
          const newImg = document.createElement('img');
          newImg.className = 'wc-popup-avatar';
          newImg.id        = 'wc-popup-avatar-img';
          newImg.src       = dataUrl;
          largeEl.replaceWith(newImg);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 学期フィルターセレクトの変更イベントを登録する。
   * 既存フォームに値を書き戻してサブミットすることで WebClass 側のフィルタリングを実行する。
   */
  function bindSemesterSelects() {
    const yearSel     = document.getElementById('wc-year-select');
    const semesterSel = document.getElementById('wc-semester-select');
    const titleEl     = document.getElementById('wc-schedule-title');
    if (!yearSel || !semesterSel) return;

    const origYearSel     = document.querySelector('select[name="year"]');
    const origSemesterSel = document.querySelector('select[name="semester"]');
    const origForm        = document.querySelector('form[name="condition"]');

    const updateTitle = () => {
      if (titleEl) titleEl.textContent = buildScheduleTitle(yearSel.value, semesterSel.value);
    };

    yearSel.addEventListener('change', () => {
      updateTitle();
      if (origYearSel && origForm) { origYearSel.value = yearSel.value; origForm.submit(); }
    });
    semesterSel.addEventListener('change', () => {
      updateTitle();
      if (origSemesterSel && origForm) { origSemesterSel.value = semesterSel.value; origForm.submit(); }
    });
  }

  /**
   * システムカラースキームの変更を監視し、モードが 'system' の場合に追従する。
   */
  function bindSystemColorScheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const mode = localStorage.getItem(STORAGE_KEY_MODE) || 'system';
      if (mode === 'system') applyMode('system');
    });
  }

  /**
   * WebClass 既存の `openMessage` 関数が未定義の場合のみ定義する。
   * メッセージをポップアップウィンドウで開く。
   */
  function ensureOpenMessageFn() {
    if (typeof window.openMessage !== 'undefined') return;
    window.openMessage = function (url) {
      const w = window.open(
        url,
        'msgeditor',
        'toolbar=no,location=no,directories=no,status=yes,menubar=no,scrollbars=yes,resizable=yes,width=820,height=650'
      );
      if (w !== null) w.focus();
      return false;
    };
  }

  // ─── [PAGES/TOP] ページレンダリング ─────────────────────────

  /**
   * トップページ全体を描画する。
   * データ抽出 → HTML 組み立て → DOM 注入 → テーマ適用 → イベント登録 の順に実行する。
   */
  function renderTopPage() {
    const data = extractTopPageData();
    const savedAccent = localStorage.getItem(STORAGE_KEY_ACCENT) || '#6366F1';
    const savedMode   = localStorage.getItem(STORAGE_KEY_MODE)   || 'system';

    const app = document.createElement('div');
    app.id    = APP_ROOT_ID;
    app.innerHTML = `
      ${buildTopbarHtml(data)}
      <div class="wc-body">
        <main class="wc-main">
          ${buildTimetableHtml(data)}
          ${buildOtherCoursesHtml(data)}
        </main>
        ${buildSidebarHtml(data)}
      </div>
      <footer class="wc-footer">Powered by WebClass — Miyazaki University</footer>
    `;
    document.body.appendChild(app);

    // テーマ適用
    applyAccent(savedAccent);
    applyMode(savedMode);

    // イベント登録
    bindCourseSearch();
    bindModeButtons();
    bindSwatches();
    bindAccountPopup();
    bindAvatarUpload();
    bindSemesterSelects();
    bindSystemColorScheme();
    ensureOpenMessageFn();
  }

  // ============================================================
  // [BOOT] 起動
  // ============================================================

  /** 既存 WebClass UI を非表示にする */
  document.querySelectorAll('header, #js-main, footer').forEach(el => {
    el.style.display = 'none';
  });
  document.body.style.margin = '0';

  /** スタイルを注入する */
  injectStyles();

  /** ルーターを実行してページを描画する */
  runRouter();

})();