/**
 * pages/auth.ts — ログイン・認証系
 *
 * 対象URL:
 *   - / (MIDログイン選択画面)
 *   - /webclass/login.php (ID/PW入力)
 *
 * 方針:
 *   - 選択画面ではログイン画面へ即リダイレクト
 *   - ログイン画面はID/PW + 言語切り替えのみのシンプルUIに換装
 *   - CSRFトークン等の hidden 要素は必ず引き継ぐ
 */

import { replaceBody, setPageTitle, hideLoadingScreen } from './common';
import { applyTheme } from '../utils/settings';

export function initAuthPage(): void {
  applyTheme();

  const path = location.pathname;

  // トップ（選択画面）なら即ログインへリダイレクト
  if (path === '/') {
    location.replace('/webclass/login.php');
    return;
  }

  // ログイン画面
  const html = buildLoginHTML();
  replaceBody(html);
  setPageTitle('ログイン');
  hideLoadingScreen();
}

function buildLoginHTML(): string {
  // 既存フォームから action, CSRF トークン等の hidden 要素を引き継ぐ
  const origForm = document.querySelector<HTMLFormElement>('form');
  const action   = origForm?.action ?? '/webclass/login.php';
  const method   = origForm?.method ?? 'post';

  // hidden 要素をすべてスクレイピング
  const hiddens = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="hidden"]')
  ).map(el => `<input type="hidden" name="${el.name}" value="${el.value}">`).join('\n');

  return `
    <div class="wc-app">
      <main class="wc-auth-page">
        <div class="wc-auth-card wc-card">
          <div class="wc-card__body">
            <h1 class="wc-auth-title">WebClass</h1>
            <p class="wc-auth-subtitle">宮崎大学 学習管理システム</p>
            <form action="${action}" method="${method}" class="wc-auth-form">
              ${hiddens}
              <div class="wc-form-group">
                <label class="wc-form-label" for="wc-login-id">ユーザーID</label>
                <input type="text" id="wc-login-id" name="user_id"
                       class="wc-input" autocomplete="username"
                       required placeholder="学籍番号・教職員番号">
              </div>
              <div class="wc-form-group">
                <label class="wc-form-label" for="wc-login-pw">パスワード</label>
                <input type="password" id="wc-login-pw" name="password"
                       class="wc-input" autocomplete="current-password"
                       required placeholder="パスワード">
              </div>
              <button type="submit" class="wc-btn wc-btn--primary" style="width:100%;">
                ログイン
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  `;
}
