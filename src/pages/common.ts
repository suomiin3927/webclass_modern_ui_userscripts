/**
 * pages/common.ts — 全ページ共通処理
 *
 * ローディング表示・非表示の制御を担う。
 * document-start 時点では <body> が存在しないため、
 * <html> タグ直下にローディングDOMを注入する。
 */

const LOADING_ID = 'wc-loading';

/**
 * ローディング画面を表示する。
 * DOM構築前（document-start）でも動作するよう <html> に直接注入する。
 */
export function showLoadingScreen(): void {
  // すでに挿入済みならスキップ
  if (document.getElementById(LOADING_ID)) return;

  // ローディング用CSSをインラインで先行注入（style.css のバンドル前でも機能させるため）
  const style = document.createElement('style');
  style.textContent = `
    #${LOADING_ID} {
      position: fixed; inset: 0; z-index: 99999;
      background: #fff; display: flex; align-items: center;
      justify-content: center; flex-direction: column; gap: 16px;
      font-family: system-ui, sans-serif;
      transition: opacity 300ms ease;
    }
    #${LOADING_ID}.is-hidden { opacity: 0; pointer-events: none; }
    .wc-spinner-raw {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: #2563eb;
      border-radius: 50%; animation: _wc_spin 0.7s linear infinite;
    }
    @keyframes _wc_spin { to { transform: rotate(360deg); } }
    .wc-loading-label { font-size: 13px; color: #94a3b8; letter-spacing: 0.05em; }
  `;

  const overlay = document.createElement('div');
  overlay.id = LOADING_ID;
  overlay.innerHTML = `
    <div class="wc-spinner-raw" aria-hidden="true"></div>
    <span class="wc-loading-label">読み込み中…</span>
  `;

  // 元サイトの <body> スタイルを消す（チラつき防止）
  const bodyHideStyle = document.createElement('style');
  bodyHideStyle.id = 'wc-body-hide';
  bodyHideStyle.textContent = 'body { visibility: hidden !important; }';

  const insertIntoDoc = () => {
    document.documentElement.appendChild(style);
    document.documentElement.appendChild(bodyHideStyle);
    document.documentElement.appendChild(overlay);
  };

  if (document.documentElement) {
    insertIntoDoc();
  } else {
    // 極めてまれなケース：documentElement もまだない場合
    document.addEventListener('readystatechange', () => insertIntoDoc(), { once: true });
  }
}

/**
 * ローディング画面をフェードアウトして非表示にする。
 * モダンUIの注入が完了した後に呼ぶ。
 */
export function hideLoadingScreen(): void {
  const overlay = document.getElementById(LOADING_ID);
  const bodyHideStyle = document.getElementById('wc-body-hide');

  // body の visibility を戻す
  bodyHideStyle?.remove();

  if (!overlay) return;

  overlay.classList.add('is-hidden');
  // フェードアウト完了後にDOMから削除
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

/**
 * 既存のUIを完全破壊して新しいHTMLを注入する。
 * スクレイピング完了後に呼ぶ。
 *
 * @param html 注入するHTML文字列
 */
export function replaceBody(html: string): void {
  // body がない場合は DOMContentLoaded 後に再試行
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', () => replaceBody(html), { once: true });
    return;
  }

  // 既存UI完全破壊
  document.body.innerHTML = '';
  document.body.className = '';

  // 元サイトの <head> に残るCSSをすべて無効化
  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach(link => {
    link.disabled = true;
  });
  document.querySelectorAll<HTMLStyleElement>('head style').forEach(s => {
    // 自作スタイル（wc-）以外を除去
    if (!s.textContent?.includes('wc-') && !s.id?.startsWith('wc-')) {
      s.remove();
    }
  });

  // モダンUIを注入
  document.body.insertAdjacentHTML('beforeend', html);
}

/**
 * ページタイトルを書き換える。
 */
export function setPageTitle(title: string): void {
  document.title = `${title} — WebClass`;
}