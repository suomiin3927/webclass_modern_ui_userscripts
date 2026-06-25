/**
 * components/CustomHeader.ts — 共通ヘッダー
 *
 * 全ページで共通して使うヘッダーを生成する。
 * - ロゴ / サービス名
 * - ナビゲーションリンク
 * - 言語切り替え（地球儀アイコン）
 * - 設定ボタン
 * - ユーザーアバター
 */

import { getSetting } from '../utils/settings';
import { openSettingsModal } from './SettingsModal';

/** ヘッダーに渡すオプション */
interface HeaderOptions {
  /** 現在のページ識別子（アクティブリンク強調用） */
  currentPage?: 'dashboard' | 'courses' | 'eportfolio' | 'survey' | 'settings';
  /** スクレイピングで取得したユーザー表示名 */
  displayName?: string;
}

/** ヘッダーのHTML文字列を生成して返す */
export function buildHeader(options: HeaderOptions = {}): string {
  const { currentPage, displayName } = options;
  const name = displayName || getSetting('cachedDisplayName') || 'ユーザー';

  const navItems: { id: HeaderOptions['currentPage']; label: string; href: string }[] = [
    { id: 'dashboard',  label: 'ホーム',         href: '/webclass' },
    { id: 'courses',    label: 'コース一覧',     href: '/webclass/index.php/courses/?acs_=' },
    { id: 'eportfolio', label: 'ポートフォリオ', href: '/webclass/eportfolio.php/showcases/?acs_=' },
    { id: 'survey',     label: 'アンケート',     href: '/webclass/ip_mods.php/plugin/survey/my-surveys-view/surveys' },
  ];

  const navHTML = navItems.map(item => `
    <a href="${item.href}"
       class="wc-header__nav-link ${currentPage === item.id ? 'is-active' : ''}"
       aria-current="${currentPage === item.id ? 'page' : 'false'}">
      ${item.label}
    </a>
  `).join('');

  return `
    <header class="wc-header" role="banner">
      <div class="wc-header__inner">

        <!-- ロゴ -->
        <a href="/webclass" class="wc-header__logo" aria-label="WebClass ホームへ戻る">
          <svg class="wc-header__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 3L2 9l10 6 10-6-10-6z"/>
            <path d="M2 17l10 6 10-6"/>
            <path d="M2 13l10 6 10-6"/>
          </svg>
          <span class="wc-header__logo-text">WebClass</span>
        </a>

        <!-- デスクトップナビ -->
        <nav class="wc-header__nav" aria-label="メインナビゲーション">
          ${navHTML}
        </nav>

        <!-- 右側アクション群 -->
        <div class="wc-header__actions">

          <!-- 言語切り替え（地球儀アイコン） -->
          <button class="wc-btn wc-btn--ghost wc-btn--sm wc-header__lang-btn"
                  id="wc-lang-btn"
                  aria-label="言語を切り替える"
                  aria-haspopup="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
          </button>
          <!-- 言語メニュー（JS で開閉） -->
          <div class="wc-header__lang-menu wc-dropdown" id="wc-lang-menu" hidden>
            <button class="wc-dropdown__item" data-lang="ja">日本語</button>
            <button class="wc-dropdown__item" data-lang="en">English</button>
            <button class="wc-dropdown__item" data-lang="zh">中文</button>
          </div>

          <!-- 設定ボタン -->
          <button class="wc-btn wc-btn--ghost wc-btn--sm"
                  id="wc-settings-btn"
                  aria-label="設定を開く">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>

          <!-- ユーザーアバター（イニシャル表示） -->
          <button class="wc-header__avatar" id="wc-user-btn" aria-label="${name} のメニューを開く">
            <span aria-hidden="true">${getInitial(name)}</span>
          </button>

        </div>
      </div>
    </header>
  `;
}

/** ヘッダーにインタラクティブな挙動を付与する（HTML注入後に呼ぶ） */
export function initHeader(): void {
  // 設定モーダルを開く
  document.getElementById('wc-settings-btn')?.addEventListener('click', () => {
    openSettingsModal();
  });

  // 言語メニューのトグル
  const langBtn = document.getElementById('wc-lang-btn');
  const langMenu = document.getElementById('wc-lang-menu');

  langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !langMenu?.hidden;
    if (langMenu) langMenu.hidden = isOpen;
    langBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  // 言語切り替え処理
  document.querySelectorAll<HTMLButtonElement>('.wc-dropdown__item[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset['lang'];
      if (lang) switchLanguage(lang);
      if (langMenu) langMenu.hidden = true;
    });
  });

  // 外部クリックでメニューを閉じる
  document.addEventListener('click', () => {
    if (langMenu) langMenu.hidden = true;
  });
}

/** 表示名の先頭1文字（イニシャル）を返す */
function getInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

/** 元サイトの言語切り替えフォームを操作して言語を変更する */
function switchLanguage(lang: string): void {
  // 元サイトの言語切り替えは通常フォームPOSTまたはURLパラメータ経由
  // 隠しフォームが存在すれば操作、なければURLパラメータで遷移
  const langForm = document.querySelector<HTMLFormElement>('form[name="langfrm"], form[action*="language"]');
  if (langForm) {
    const select = langForm.querySelector<HTMLSelectElement>('select[name="lang"]');
    if (select) {
      select.value = lang;
      langForm.submit();
      return;
    }
  }
  // フォールバック: URLにlangパラメータを付与してリロード
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  location.href = url.toString();
}