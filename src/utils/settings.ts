/**
 * utils/settings.ts — ユーザー設定の永続化
 *
 * localStorage ではなく GM_setValue / GM_getValue を使用。
 * 元サイトのJSからの干渉や漏洩を防ぐための必須設計。
 */

// Tampermonkey のグローバル関数（型定義）
declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue(key: string, value: unknown): void;
declare function GM_deleteValue(key: string): void;

/** 設定キーの名前空間プレフィックス */
const NS = 'wc_modern_';

/** アプリ全体の設定スキーマ */
export interface AppSettings {
  /** テーマカラー（CSS変数 --wc-color-primary に適用） */
  themeColor: string;
  /** カラーモード: 'light' | 'dark' | 'auto' */
  colorMode: 'light' | 'dark' | 'auto';
  /** ダッシュボードに表示するウィジェットの表示状態 */
  widgetVisibility: {
    announcements: boolean;
    messages: boolean;
    tasks: boolean;
  };
  /** ユーザー表示名（スクレイピングで取得後にキャッシュ） */
  cachedDisplayName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeColor: '#2563eb',
  colorMode: 'light',
  widgetVisibility: {
    announcements: true,
    messages: true,
    tasks: true,
  },
  cachedDisplayName: '',
};

/**
 * 設定値を取得する。
 * @param key AppSettings のキー名
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return GM_getValue<AppSettings[K]>(NS + key, DEFAULT_SETTINGS[key]);
}

/**
 * 設定値を保存する。
 * @param key AppSettings のキー名
 * @param value 保存する値
 */
export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  GM_setValue(NS + key, value);
}

/**
 * 設定値を削除してデフォルトに戻す。
 */
export function resetSetting<K extends keyof AppSettings>(key: K): void {
  GM_deleteValue(NS + key);
}

/**
 * すべての設定をデフォルトにリセットする。
 */
export function resetAllSettings(): void {
  (Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]).forEach(key => {
    GM_deleteValue(NS + key);
  });
}

/**
 * 現在のテーマカラーをCSS変数として <html> に適用する。
 * アプリ起動時に必ず呼ぶ。
 */
export function applyTheme(): void {
  const color = getSetting('themeColor');
  const mode = getSetting('colorMode');

  const root = document.documentElement;
  root.style.setProperty('--wc-color-primary', color);

  // カラーモードのクラスを付け替え
  root.classList.remove('wc-theme-light', 'wc-theme-dark', 'wc-theme-auto');
  root.classList.add(`wc-theme-${mode}`);
}