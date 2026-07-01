/**
 * utils/settings.ts — ユーザー設定の永続化
 *
 * localStorage ではなく GM_setValue / GM_getValue を使用。
 * 元サイトのJSからの干渉や漏洩を防ぐための必須設計。
 * (ViteのHMR開発環境への配慮として、GM関数が存在しない場合は localStorage にフォールバックします)
 */

// Tampermonkey のグローバル関数（型定義）
declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue(key: string, value: unknown): void;
declare function GM_deleteValue(key: string): void;

/** 設定キーの名前空間プレフィックス */
const NS = 'wc_modern_';

// ============================================================
// テーマカラープリセット (中身は維持)
// ============================================================
export interface ThemeColorSet {
  name: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentRgb: string;
  deadline: string;
}

export const THEME_PRESETS: ThemeColorSet[] = [
  { name: 'インディゴ', accent: '#6366F1', accentLight: '#818CF8', accentDark: '#4a4ccc', accentRgb: '99,102,241', deadline: '#EF4444' },
  { name: 'バイオレット', accent: '#8B5CF6', accentLight: '#A78BFA', accentDark: '#6d45d4', accentRgb: '139,92,246', deadline: '#EF4444' },
  { name: 'スカイ', accent: '#0EA5E9', accentLight: '#38BDF8', accentDark: '#0284c7', accentRgb: '14,165,233', deadline: '#EF4444' },
  { name: 'ティール', accent: '#14B8A6', accentLight: '#2DD4BF', accentDark: '#0f8a7c', accentRgb: '20,184,166', deadline: '#EF4444' },
  { name: 'エメラルド', accent: '#10B981', accentLight: '#34D399', accentDark: '#059669', accentRgb: '16,185,129', deadline: '#EF4444' },
  { name: 'ローズ', accent: '#F43F5E', accentLight: '#FB7185', accentDark: '#e11d48', accentRgb: '244,63,94', deadline: '#7C3AED' },
  { name: 'アンバー', accent: '#F59E0B', accentLight: '#FCD34D', accentDark: '#d97706', accentRgb: '245,158,11', deadline: '#DC2626' },
];

export interface AppSettings {
  themePreset: string;
  colorMode: 'light' | 'dark' | 'system';
  avatarDataUrl: string;
  widgetVisibility: { announcements: boolean; messages: boolean; tasks: boolean };
  cachedDisplayName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  themePreset: 'インディゴ',
  colorMode:   'system',
  avatarDataUrl: '',
  widgetVisibility: { announcements: true, messages: true, tasks: true },
  cachedDisplayName: '',
};

// ============================================================
// 安全なストレージ制御（HMR対応フォールバック）
// ============================================================

/**
 * 設定値を取得する。
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  if (typeof GM_getValue !== 'undefined') {
    return GM_getValue<AppSettings[K]>(NS + key, DEFAULT_SETTINGS[key]);
  } else {
    // 開発サーバー(HMR)環境用のフォールバック
    const localVal = localStorage.getItem(NS + key);
    if (localVal === null) return DEFAULT_SETTINGS[key];
    try {
      return JSON.parse(localVal) as AppSettings[K];
    } catch {
      return DEFAULT_SETTINGS[key];
    }
  }
}

/**
 * 設定値を保存する。
 */
export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  if (typeof GM_setValue !== 'undefined') {
    GM_setValue(NS + key, value);
  } else {
    // 開発サーバー(HMR)環境用のフォールバック
    localStorage.setItem(NS + key, JSON.stringify(value));
  }
}

/**
 * 設定値を削除してデフォルトに戻す。
 */
export function resetSetting<K extends keyof AppSettings>(key: K): void {
  if (typeof GM_deleteValue !== 'undefined') {
    GM_deleteValue(NS + key);
  } else {
    localStorage.removeItem(NS + key);
  }
}

/**
 * すべての設定をデフォルトにリセットする。
 */
export function resetAllSettings(): void {
  (Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]).forEach(key => {
    resetSetting(key);
  });
}

// ============================================================
// テーマ適用ロジック (維持)
// ============================================================

export function getActiveTheme(): ThemeColorSet {
  const name = getSetting('themePreset');
  return THEME_PRESETS.find(p => p.name === name) ?? THEME_PRESETS[0];
}

export function applyTheme(): void {
  const theme = getActiveTheme();
  const mode  = getSetting('colorMode');
  const root  = document.documentElement;

  root.style.setProperty('--wc-color-primary',       theme.accent);
  root.style.setProperty('--wc-color-primary-light', theme.accentLight);
  root.style.setProperty('--wc-color-primary-dark',  theme.accentDark);
  root.style.setProperty('--wc-color-primary-rgb',   theme.accentRgb);
  root.style.setProperty('--wc-color-deadline',      theme.deadline);
  root.style.setProperty('--wc-color-primary-ghost', `rgba(${theme.accentRgb}, 0.1)`);

  root.classList.remove('wc-theme-light', 'wc-theme-dark', 'wc-theme-system');
  root.classList.add(`wc-theme-${mode}`);
}