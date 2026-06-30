/**
 * components/CustomHeader.ts — 共通トップバー
 *
 * Userscript の buildTopbarHtml / bindAccountPopup / bindModeButtons /
 * bindSwatches / bindAvatarUpload の各関数を TypeScript 移植したもの。
 *
 * - ロゴ / ナビゲーションリンク
 * - メッセージアイコン（未読バッジ）
 * - ログアウトボタン
 * - アバタートリガー → アカウントポップアップ
 *   - ユーザー情報
 *   - アカウントメニューリンク
 *   - 外観モード切替（セグメントボタン）
 *   - テーマカラー選択（スウォッチ）
 *   - アバター画像アップロード
 */

import { getSetting, setSetting, applyTheme, THEME_PRESETS, ThemeColorSet } from '../utils/settings';

// ============================================================
// 型定義
// ============================================================

export interface NavLink {
  text: string;
  href: string;
}

export interface AccountLink {
  text:     string;
  href:     string;
  onClick:  string;
  target:   string;
}

export interface TopbarOptions {
  /** スクレイピングで取得したユーザー表示名 */
  userName:        string;
  /** アバター画像の src（Base64 or URL）。空文字でプレースホルダー */
  avatarSrc:       string;
  /** ナビゲーションリンク一覧 */
  navLinks:        NavLink[];
  /** ログアウトリンク */
  logoutHref:      string;
  /** メッセージページリンク */
  messageHref:     string;
  /** メッセージアイコンの onclick 属性値 */
  messageOnClick:  string;
  /** メッセージアイコンの innerHTMLとして使うグリフアイコン HTML */
  messageIconHTML: string;
  /** 未読メッセージ数（0 のとき非表示） */
  unreadCount:     number;
  /** アカウントドロップダウン内リンク */
  accountMenuLinks: AccountLink[];
}

// ============================================================
// HTML エスケープユーティリティ（ローカル）
// ============================================================

function escAttr(s: unknown): string {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escHtml(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================
// サブコンポーネント（HTML 文字列生成）
// ============================================================

function buildAvatarSmall(src: string): string {
  if (src) {
    return `<img class="wc-avatar" id="wc-avatar-img" src="${escAttr(src)}" alt="">`;
  }
  return `<div class="wc-avatar-placeholder" id="wc-avatar-img">👤</div>`;
}

function buildAvatarLarge(src: string): string {
  const inner = src
    ? `<img class="wc-popup__avatar" id="wc-popup-avatar-img" src="${escAttr(src)}" alt="">`
    : `<div class="wc-popup__avatar-placeholder" id="wc-popup-avatar-img">👤</div>`;
  return `
    <div class="wc-popup__avatar-wrap" id="wc-popup-avatar-wrap" title="クリックしてアバター画像を変更">
      ${inner}
      <div class="wc-popup__avatar-overlay">📷</div>
      <input type="file" id="wc-avatar-input" accept="image/*">
    </div>
  `;
}

function buildSegmentControl(
  options: { value: string; label: string }[],
  dataAttr: string,
): string {
  return `
    <div class="wc-segment">
      ${options.map(o =>
        `<button class="wc-segment-btn" data-${dataAttr}="${escAttr(o.value)}">${escHtml(o.label)}</button>`
      ).join('')}
    </div>
  `;
}

function buildSwatchGroup(presets: ThemeColorSet[]): string {
  return `
    <div class="wc-swatches">
      ${presets.map(p => `
        <div class="wc-swatch"
             data-preset="${escAttr(p.name)}"
             title="${escHtml(p.name)}"
             style="background:${escAttr(p.accent)};">
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
// buildTopbar — HTML 文字列を返す
// ============================================================

export function buildTopbar(options: TopbarOptions): string {
  const {
    userName, avatarSrc, navLinks, logoutHref,
    messageHref, messageOnClick, messageIconHTML, unreadCount,
    accountMenuLinks,
  } = options;

  const currentPath = typeof location !== 'undefined' ? location.pathname : '';
  const hasUnread   = unreadCount > 0;
  const onClickAttr = messageOnClick ? `onclick="${escAttr(messageOnClick)}"` : '';

  const navHtml = navLinks.map(l => {
    let linkPath = '';
    try { linkPath = new URL(l.href, location.origin).pathname.split('?')[0]; } catch { /* noop */ }
    const isActive = linkPath && currentPath.startsWith(linkPath);
    return `
      <a class="wc-topbar__nav-link${isActive ? ' is-active' : ''}"
         href="${escAttr(l.href)}"
         ${isActive ? 'aria-current="page"' : ''}>
        ${escHtml(l.text)}
      </a>
    `;
  }).join('');

  const accountLinksHtml = accountMenuLinks.map(l => `
    <a class="wc-popup__link"
       href="${escAttr(l.href)}"
       ${l.target  ? `target="${escAttr(l.target)}"` : ''}
       ${l.onClick ? `onclick="${escAttr(l.onClick)}"` : ''}>
      ${escHtml(l.text)}
    </a>
  `).join('');

  return `
    <header class="wc-topbar" role="banner">

      <!-- ロゴ -->
      <a class="wc-topbar__logo" href="/webclass/" aria-label="WebClass ホームへ戻る">
        <span>Web</span>Class
      </a>

      <!-- デスクトップナビ -->
      <nav class="wc-topbar__nav" aria-label="メインナビゲーション">
        ${navHtml}
      </nav>

      <!-- 右側アクション群 -->
      <div class="wc-topbar__actions">

        <!-- メッセージアイコン（未読バッジ付き） -->
        <a class="wc-msg-btn"
           href="${escAttr(messageHref)}"
           ${onClickAttr}
           target="msgeditor"
           title="メッセージ">
          ${messageIconHTML}
          <span class="wc-msg-badge${hasUnread ? ' has-unread' : ''}">
            ${hasUnread ? unreadCount : ''}
          </span>
        </a>

        <!-- ログアウト -->
        <a class="wc-logout-btn" href="${escAttr(logoutHref)}">ログアウト</a>

        <!-- アバター + ユーザー名（クリックでポップアップ） -->
        <div class="wc-avatar-trigger" id="wc-avatar-trigger" role="button"
             aria-haspopup="true" aria-expanded="false"
             aria-label="${escAttr(userName)} のメニューを開く">
          ${buildAvatarSmall(avatarSrc)}
          <span class="wc-username">${escHtml(userName)}</span>
          <span class="wc-avatar-caret" aria-hidden="true">▾</span>

          <!-- アカウントポップアップ -->
          <div class="wc-popup" id="wc-account-popup" role="dialog" aria-label="アカウントメニュー">
            <div class="wc-popup__header">
              ${buildAvatarLarge(avatarSrc)}
              <div>
                <div class="wc-popup__name">${escHtml(userName)}</div>
                <div class="wc-popup__username">${escHtml(userName)}</div>
              </div>
            </div>

            <div class="wc-popup__links">${accountLinksHtml}</div>
            <div class="wc-popup__divider"></div>

            <!-- テーマ設定 -->
            <div class="wc-popup__section">
              <div class="wc-popup__section-label">テーマ設定</div>
              <div class="wc-popup__row">
                <div class="wc-popup__row-label">外観</div>
                ${buildSegmentControl(
                  [
                    { value: 'light',  label: 'ライト'   },
                    { value: 'dark',   label: 'ダーク'   },
                    { value: 'system', label: 'システム' },
                  ],
                  'mode',
                )}
              </div>
              <div class="wc-popup__row">
                <div class="wc-popup__row-label">テーマカラー</div>
                ${buildSwatchGroup(THEME_PRESETS)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  `;
}

// ============================================================
// initTopbar — DOM 注入後にイベントを登録する
// ============================================================

export function initTopbar(): void {
  _bindAccountPopup();
  _bindAvatarUpload();
  _bindModeButtons();
  _bindSwatches();
  _bindSystemColorScheme();
  _syncActiveStates();
}

// ── アカウントポップアップの開閉 ──────────────────────────

function _bindAccountPopup(): void {
  const trigger = document.getElementById('wc-avatar-trigger');
  const popup   = document.getElementById('wc-account-popup');
  if (!trigger || !popup) return;

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = popup.classList.contains('is-open');
    popup.classList.toggle('is-open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', () => {
    popup.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  });

  popup.addEventListener('click', e => e.stopPropagation());
}

// ── アバター画像アップロード ──────────────────────────────

function _bindAvatarUpload(): void {
  const wrap  = document.getElementById('wc-popup-avatar-wrap');
  const input = document.getElementById('wc-avatar-input') as HTMLInputElement | null;
  if (!wrap || !input) return;

  wrap.addEventListener('click', e => {
    e.stopPropagation();
    input.click();
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      // GM_setValue で永続化
      setSetting('avatarDataUrl', dataUrl);

      // 小アバター（Topbar）を即時更新
      const smallEl = document.getElementById('wc-avatar-img');
      if (smallEl) {
        const newImg = document.createElement('img');
        newImg.className = 'wc-avatar';
        newImg.id        = 'wc-avatar-img';
        newImg.src       = dataUrl;
        smallEl.replaceWith(newImg);
      }

      // 大アバター（ポップアップ）を即時更新
      const largeEl = document.getElementById('wc-popup-avatar-img');
      if (largeEl) {
        const newImg = document.createElement('img');
        newImg.className = 'wc-popup__avatar';
        newImg.id        = 'wc-popup-avatar-img';
        newImg.src       = dataUrl;
        largeEl.replaceWith(newImg);
      }
    };
    reader.readAsDataURL(file);
  });
}

// ── 外観モード切替ボタン ──────────────────────────────────

function _bindModeButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('.wc-segment-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const mode = btn.dataset['mode'] as 'light' | 'dark' | 'system';
      setSetting('colorMode', mode);
      applyTheme();
      _syncActiveStates();
    });
  });
}

// ── テーマカラースウォッチ ────────────────────────────────

function _bindSwatches(): void {
  document.querySelectorAll<HTMLElement>('.wc-swatch').forEach(swatch => {
    swatch.addEventListener('click', e => {
      e.stopPropagation();
      const preset = swatch.dataset['preset'];
      if (!preset) return;
      setSetting('themePreset', preset);
      applyTheme();
      _syncActiveStates();
    });
  });
}

// ── システムカラースキーム変化の監視 ─────────────────────

function _bindSystemColorScheme(): void {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const mode = getSetting('colorMode');
    if (mode === 'system') applyTheme();
  });
}

// ── アクティブ状態の同期（テーマ適用後に呼ぶ） ───────────

function _syncActiveStates(): void {
  const currentMode   = getSetting('colorMode');
  const currentPreset = getSetting('themePreset');

  // セグメントボタン
  document.querySelectorAll<HTMLButtonElement>('.wc-segment-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset['mode'] === currentMode);
  });

  // スウォッチ
  document.querySelectorAll<HTMLElement>('.wc-swatch').forEach(swatch => {
    swatch.classList.toggle('is-active', swatch.dataset['preset'] === currentPreset);
  });
}