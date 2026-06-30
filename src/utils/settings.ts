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

// ============================================================
// テーマカラープリセット
// カラー計算は行わず、各テーマに必要な全色を事前定義する。
// ============================================================

export interface ThemeColorSet {
  /** プリセット名（表示用） */
  name: string;
  /** メインアクセントカラー (#RRGGBB) */
  accent: string;
  /** ライトバリアント（ホバー等） */
  accentLight: string;
  /** ダークバリアント（チップテキスト・ライトモード用） */
  accentDark: string;
  /** CSS rgb() 用カンマ区切り文字列（例: "99,102,241"）*/
  accentRgb: string;
  /** 締切間近の警告色 */
  deadline: string;
}

export const THEME_PRESETS: ThemeColorSet[] = [
  {
    name:        'インディゴ',
    accent:      '#6366F1',
    accentLight: '#818CF8',
    accentDark:  '#4a4ccc',
    accentRgb:   '99,102,241',
    deadline:    '#EF4444',
  },
  {
    name:        'バイオレット',
    accent:      '#8B5CF6',
    accentLight: '#A78BFA',
    accentDark:  '#6d45d4',
    accentRgb:   '139,92,246',
    deadline:    '#EF4444',
  },
  {
    name:        'スカイ',
    accent:      '#0EA5E9',
    accentLight: '#38BDF8',
    accentDark:  '#0284c7',
    accentRgb:   '14,165,233',
    deadline:    '#EF4444',
  },
  {
    name:        'ティール',
    accent:      '#14B8A6',
    accentLight: '#2DD4BF',
    accentDark:  '#0f8a7c',
    accentRgb:   '20,184,166',
    deadline:    '#EF4444',
  },
  {
    name:        'エメラルド',
    accent:      '#10B981',
    accentLight: '#34D399',
    accentDark:  '#059669',
    accentRgb:   '16,185,129',
    deadline:    '#EF4444',
  },
  {
    name:        'ローズ',
    accent:      '#F43F5E',
    accentLight: '#FB7185',
    accentDark:  '#e11d48',
    accentRgb:   '244,63,94',
    deadline:    '#7C3AED',
  },
  {
    name:        'アンバー',
    accent:      '#F59E0B',
    accentLight: '#FCD34D',
    accentDark:  '#d97706',
    accentRgb:   '245,158,11',
    deadline:    '#DC2626',
  },
];

/** アプリ全体の設定スキーマ */
export interface AppSettings {
  /** 選択中のテーマプリセット名（THEME_PRESETS[].name に対応） */
  themePreset: string;
  /** カラーモード */
  colorMode: 'light' | 'dark' | 'system';
  /** アバター画像（Base64 DataURL）*/
  avatarDataUrl: string;
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
  themePreset: 'インディゴ',
  colorMode:   'system',
  avatarDataUrl: '',
  widgetVisibility: {
    announcements: true,
    messages:      true,
    tasks:         true,
  },
  cachedDisplayName: '',
};

/**
 * 設定値を取得する。
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return GM_getValue<AppSettings[K]>(NS + key, DEFAULT_SETTINGS[key]);
}

/**
 * 設定値を保存する。
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
 * プリセット名からカラーセットを取得する。見つからない場合は先頭を返す。
 */
export function getActiveTheme(): ThemeColorSet {
  const name = getSetting('themePreset');
  return THEME_PRESETS.find(p => p.name === name) ?? THEME_PRESETS[0];
}

/**
 * 現在のテーマ設定を :root / <html> の CSS 変数として適用する。
 * アプリ起動時に必ず呼ぶ。
 */
export function applyTheme(): void {
  const theme = getActiveTheme();
  const mode  = getSetting('colorMode');

  const root = document.documentElement;

  // ── アクセントカラー変数 ──────────────────────────────────
  root.style.setProperty('--wc-color-primary',       theme.accent);
  root.style.setProperty('--wc-color-primary-light', theme.accentLight);
  root.style.setProperty('--wc-color-primary-dark',  theme.accentDark);
  root.style.setProperty('--wc-color-primary-rgb',   theme.accentRgb);
  root.style.setProperty('--wc-color-deadline',      theme.deadline);

  // ghost（ホバー背景）は accentRgb ベースで統一
  root.style.setProperty(
    '--wc-color-primary-ghost',
    `rgba(${theme.accentRgb}, 0.1)`,
  );

  // ── カラーモード ──────────────────────────────────────────
  root.classList.remove('wc-theme-light', 'wc-theme-dark', 'wc-theme-system');
  root.classList.add(`wc-theme-${mode}`);

  // system モードはメディアクエリ側が処理するため JS 側では追従しない
}