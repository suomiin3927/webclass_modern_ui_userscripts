/**
 * components/SettingsModal.ts — 設定モーダル
 *
 * - テーマカラープリセット選択（スウォッチ）
 * - カラーモード（ライト / ダーク / システム）
 * - ウィジェット表示設定
 *
 * 変更は即時 GM_setValue で保存・CSS変数に反映する。
 * （テーマカラー設定は CustomHeader.ts のアカウントポップアップでも操作可能）
 */

import { getSetting, setSetting, applyTheme, THEME_PRESETS, resetAllSettings } from '../utils/settings';

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

  initModalEvents(backdrop);
  syncModalActiveStates(backdrop);

  backdrop.querySelector<HTMLElement>('button, input, select')?.focus();
}

function closeSettingsModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}

function buildModalHTML(): string {
  const currentMode = getSetting('colorMode');
  const widgets     = getSetting('widgetVisibility');

  const swatchesHTML = THEME_PRESETS.map(p => `
    <div class="wc-swatch"
         data-preset="${p.name}"
         title="${p.name}"
         style="background:${p.accent};">
    </div>
  `).join('');

  const modeOptions: { value: string; label: string }[] = [
    { value: 'light',  label: 'ライト'   },
    { value: 'dark',   label: 'ダーク'   },
    { value: 'system', label: 'システム' },
  ];

  return `
    <div class="wc-modal" role="document">
      <div class="wc-modal__header">
        <h2 class="wc-modal__title" id="wc-settings-title">表示設定</h2>
        <button class="wc-btn wc-btn--ghost wc-btn--sm" id="wc-settings-close" aria-label="閉じる">✕</button>
      </div>

      <div class="wc-modal__body">

        <!-- テーマカラー -->
        <div class="wc-form-group">
          <label class="wc-form-label">テーマカラー</label>
          <div class="wc-swatches" id="wc-modal-swatches">
            ${swatchesHTML}
          </div>
        </div>

        <!-- カラーモード -->
        <div class="wc-form-group">
          <label class="wc-form-label">外観モード</label>
          <div class="wc-segment" id="wc-modal-segment">
            ${modeOptions.map(o => `
              <button class="wc-segment-btn${currentMode === o.value ? ' is-active' : ''}"
                      data-mode="${o.value}">
                ${o.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- ダッシュボードウィジェット -->
        <fieldset style="border:1px solid var(--wc-color-border);border-radius:var(--wc-radius-md);padding:16px;">
          <legend style="font-size:var(--wc-text-sm);font-weight:500;padding:0 8px;color:var(--wc-color-text-secondary);">
            ダッシュボード表示
          </legend>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px;">
            ${buildCheckbox('wc-widget-announcements', 'お知らせ',     widgets.announcements)}
            ${buildCheckbox('wc-widget-messages',      'メッセージ',   widgets.messages)}
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

function buildCheckbox(id: string, label: string, checked: boolean): string {
  return `
    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;min-height:44px;">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}
             style="width:18px;height:18px;cursor:pointer;accent-color:var(--wc-color-primary);">
      <span style="font-size:var(--wc-text-sm);">${label}</span>
    </label>
  `;
}

function initModalEvents(backdrop: HTMLElement): void {
  // 閉じる
  backdrop.querySelector('#wc-settings-close')?.addEventListener('click', closeSettingsModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeSettingsModal(); });

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSettingsModal();
      document.removeEventListener('keydown', onKeydown);
    }
  };
  document.addEventListener('keydown', onKeydown);

  // モーダル内スウォッチ
  backdrop.querySelectorAll<HTMLElement>('#wc-modal-swatches .wc-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const preset = swatch.dataset['preset'];
      if (!preset) return;
      setSetting('themePreset', preset);
      applyTheme();
      syncModalActiveStates(backdrop);
    });
  });

  // モーダル内セグメントボタン
  backdrop.querySelectorAll<HTMLButtonElement>('#wc-modal-segment .wc-segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset['mode'] as 'light' | 'dark' | 'system';
      setSetting('colorMode', mode);
      applyTheme();
      syncModalActiveStates(backdrop);
    });
  });

  // 保存
  backdrop.querySelector('#wc-settings-save')?.addEventListener('click', () => {
    const annCb  = backdrop.querySelector<HTMLInputElement>('#wc-widget-announcements')?.checked ?? true;
    const msgCb  = backdrop.querySelector<HTMLInputElement>('#wc-widget-messages')?.checked ?? true;
    const taskCb = backdrop.querySelector<HTMLInputElement>('#wc-widget-tasks')?.checked ?? true;

    setSetting('widgetVisibility', {
      announcements: annCb,
      messages:      msgCb,
      tasks:         taskCb,
    });

    closeSettingsModal();
  });

  // リセット
  backdrop.querySelector('#wc-settings-reset')?.addEventListener('click', () => {
    resetAllSettings();
    applyTheme();
    closeSettingsModal();
  });
}

/** モーダル内のアクティブ状態を現在の設定値に同期する */
function syncModalActiveStates(backdrop: HTMLElement): void {
  const currentPreset = getSetting('themePreset');
  const currentMode   = getSetting('colorMode');

  backdrop.querySelectorAll<HTMLElement>('#wc-modal-swatches .wc-swatch').forEach(s => {
    s.classList.toggle('is-active', s.dataset['preset'] === currentPreset);
  });

  backdrop.querySelectorAll<HTMLButtonElement>('#wc-modal-segment .wc-segment-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset['mode'] === currentMode);
  });
}