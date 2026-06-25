/**
 * components/SettingsModal.ts — 設定モーダル
 *
 * - テーマカラーのカラーピッカー
 * - カラーモード（ライト / ダーク / 自動）
 * - ウィジェット表示設定
 * 変更は即時 GM_setValue で保存・CSS変数に反映する。
 */

import { getSetting, setSetting, applyTheme } from '../utils/settings';

const MODAL_ID = 'wc-settings-modal';

/** 設定モーダルを開く（すでに開いていれば閉じる） */
export function openSettingsModal(): void {
  const existing = document.getElementById(MODAL_ID);
  if (existing) {
    closeSettingsModal();
    return;
  }

  const backdrop = document.createElement('div');
  backdrop.id = MODAL_ID;
  backdrop.className = 'wc-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'wc-settings-title');

  backdrop.innerHTML = buildModalHTML();
  document.body.appendChild(backdrop);

  // イベント登録
  initModalEvents(backdrop);

  // フォーカストラップ: モーダル内の最初の要素にフォーカス
  backdrop.querySelector<HTMLElement>('button, input, select')?.focus();
}

/** 設定モーダルを閉じる */
function closeSettingsModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}

/** モーダルのHTML文字列を生成 */
function buildModalHTML(): string {
  const currentColor = getSetting('themeColor');
  const currentMode  = getSetting('colorMode');
  const widgets      = getSetting('widgetVisibility');

  return `
    <div class="wc-modal" role="document">
      <div class="wc-modal__header">
        <h2 class="wc-modal__title" id="wc-settings-title">表示設定</h2>
        <button class="wc-btn wc-btn--ghost wc-btn--sm" id="wc-settings-close" aria-label="閉じる">✕</button>
      </div>

      <div class="wc-modal__body">

        <!-- テーマカラー -->
        <div class="wc-form-group">
          <label class="wc-form-label" for="wc-color-picker">テーマカラー</label>
          <div style="display:flex;align-items:center;gap:12px;">
            <input type="color" id="wc-color-picker" class="wc-input"
                   value="${currentColor}" style="width:60px;height:44px;padding:4px;cursor:pointer;">
            <code style="font-size:13px;color:var(--wc-color-text-secondary);" id="wc-color-value">${currentColor}</code>
          </div>
        </div>

        <!-- カラーモード -->
        <div class="wc-form-group">
          <label class="wc-form-label" for="wc-color-mode">カラーモード</label>
          <select id="wc-color-mode" class="wc-select">
            <option value="light"  ${currentMode === 'light'  ? 'selected' : ''}>ライト</option>
            <option value="dark"   ${currentMode === 'dark'   ? 'selected' : ''}>ダーク</option>
            <option value="auto"   ${currentMode === 'auto'   ? 'selected' : ''}>システム設定に合わせる</option>
          </select>
        </div>

        <!-- ダッシュボードウィジェット -->
        <fieldset style="border:1px solid var(--wc-color-border);border-radius:var(--wc-radius-md);padding:16px;">
          <legend style="font-size:var(--wc-text-sm);font-weight:500;padding:0 8px;color:var(--wc-color-text-secondary);">
            ダッシュボード表示
          </legend>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px;">
            ${buildCheckbox('wc-widget-announcements', 'お知らせ',    widgets.announcements)}
            ${buildCheckbox('wc-widget-messages',      'メッセージ',  widgets.messages)}
            ${buildCheckbox('wc-widget-tasks',         '課題・タスク', widgets.tasks)}
          </div>
        </fieldset>

      </div>

      <div class="wc-modal__footer">
        <button class="wc-btn wc-btn--secondary" id="wc-settings-reset">リセット</button>
        <button class="wc-btn wc-btn--primary"   id="wc-settings-save">保存して適用</button>
      </div>
    </div>
  `;
}

/** チェックボックスのHTML断片を生成 */
function buildCheckbox(id: string, label: string, checked: boolean): string {
  return `
    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;min-height:44px;">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}
             style="width:18px;height:18px;cursor:pointer;accent-color:var(--wc-color-primary);">
      <span style="font-size:var(--wc-text-sm);">${label}</span>
    </label>
  `;
}

/** モーダル内のイベントを登録する */
function initModalEvents(backdrop: HTMLElement): void {
  // 閉じるボタン
  backdrop.querySelector('#wc-settings-close')?.addEventListener('click', closeSettingsModal);

  // バックドロップクリックで閉じる
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSettingsModal();
  });

  // Escape キーで閉じる
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSettingsModal();
      document.removeEventListener('keydown', onKeydown);
    }
  };
  document.addEventListener('keydown', onKeydown);

  // カラーピッカーの即時プレビュー
  const picker   = backdrop.querySelector<HTMLInputElement>('#wc-color-picker');
  const colorVal = backdrop.querySelector<HTMLElement>('#wc-color-value');
  picker?.addEventListener('input', () => {
    if (!picker.value) return;
    if (colorVal) colorVal.textContent = picker.value;
    document.documentElement.style.setProperty('--wc-color-primary', picker.value);
  });

  // 保存
  backdrop.querySelector('#wc-settings-save')?.addEventListener('click', () => {
    const color   = picker?.value ?? getSetting('themeColor');
    const mode    = (backdrop.querySelector<HTMLSelectElement>('#wc-color-mode')?.value ?? 'light') as 'light' | 'dark' | 'auto';
    const annCb   = backdrop.querySelector<HTMLInputElement>('#wc-widget-announcements')?.checked ?? true;
    const msgCb   = backdrop.querySelector<HTMLInputElement>('#wc-widget-messages')?.checked ?? true;
    const taskCb  = backdrop.querySelector<HTMLInputElement>('#wc-widget-tasks')?.checked ?? true;

    setSetting('themeColor', color);
    setSetting('colorMode', mode);
    setSetting('widgetVisibility', {
      announcements: annCb,
      messages: msgCb,
      tasks: taskCb,
    });

    applyTheme();
    closeSettingsModal();
  });

  // リセット（デフォルト値を即反映してプレビュー）
  backdrop.querySelector('#wc-settings-reset')?.addEventListener('click', () => {
    if (!picker) return;
    picker.value = '#2563eb';
    if (colorVal) colorVal.textContent = '#2563eb';
    document.documentElement.style.setProperty('--wc-color-primary', '#2563eb');
  });
}