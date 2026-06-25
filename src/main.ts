/**
 * main.ts — 司令塔
 *
 * 役割：
 * 1. DOM構築前（document-start）で即座にローディングUIを表示してチラつきを防ぐ
 * 2. URLを判定して対応するページモジュールを呼び出す（ルーター）
 * 3. ページロード完了後にスクレイピング → 既存UI破壊 → モダンUI注入
 */

import './style.css';
import { showLoadingScreen, hideLoadingScreen } from './pages/common';

// ============================================================
// Step 1: DOM構築前の最速実行 — ローディングを即座に表示
// ============================================================
// document-start で動くため document.body はまだ存在しない。
// <style> タグのみ先行注入し、body が生成されたら即ローディングへ差し替える。
showLoadingScreen();

// ============================================================
// Step 2: ルーター — URLでページモジュールを振り分ける
// ============================================================
const route = (): void => {
  const path = location.pathname;
  const search = location.search;

  // --- ログイン・認証系 ---
  if (path === '/' || path === '/webclass/login.php') {
    import('./pages/auth').then(m => m.initAuthPage());
    return;
  }

  // --- ポータル系（トップ / ダッシュボード） ---
  if (path === '/webclass' || path === '/webclass/' || search.startsWith('?acs_=') && !path.includes('course.php')) {

    // 参加可能なコース
    if (path.includes('/courses/')) {
      import('./pages/portal/courses').then(m => m.initCoursesPage());
      return;
    }

    // ショーケースポートフォリオ
    if (path.includes('/eportfolio.php/showcases/')) {
      import('./pages/portal/eportfolio').then(m => m.initEportfolioPage());
      return;
    }

    // アンケート（回答画面を含む）
    if (path.includes('/ip_mods.php/plugin/survey/')) {
      import('./pages/portal/survey').then(m => m.initSurveyPage());
      return;
    }

    // ユーザー設定
    if (path.includes('/user.php/')) {
      import('./pages/portal/userConfig').then(m => m.initUserConfigPage());
      return;
    }

    // ポップアップ系（お知らせ・メッセージ）はポータルへの統合のためスキップ
    if (path.includes('/informations.php') || path.includes('/msg_editor.php')) {
      // バックグラウンドfetch用：UIは構築せずデータ取得のみ
      hideLoadingScreen();
      return;
    }

    // デフォルト: ダッシュボード（コースリスト + お知らせ・メッセージを統合）
    import('./pages/portal/dashboard').then(m => m.initDashboardPage());
    return;
  }

  // --- コース内系 ---
  if (path.includes('/course.php/')) {

    if (path.endsWith('/my-reports') || path.includes('/my-reports?')) {
      import('./pages/course/report').then(m => m.initReportPage());
      return;
    }

    if (path.endsWith('/attendance') || path.includes('/attendance?')) {
      import('./pages/course/attendance').then(m => m.initAttendancePage());
      return;
    }

    if (path.endsWith('/scores') || path.includes('/area-score') || path.includes('/scores?')) {
      import('./pages/course/scores').then(m => m.initScoresPage());
      return;
    }

    if (path.endsWith('/info') || path.includes('/info?') || path.includes('/access-log')) {
      import('./pages/course/info').then(m => m.initInfoPage());
      return;
    }

    // デフォルト: タイムライン（教材一覧）
    import('./pages/course/timeline').then(m => m.initTimelinePage());
    return;
  }

  // --- 教材実行・ビューワー系 ---
  if (path.includes('/show_frame.php')) {
    import('./pages/contents/common').then(m => m.initContentsCommon());
    return;
  }

  if (path.includes('/txtbk_frame.php')) {
    import('./pages/contents/viewer').then(m => m.initViewerPage());
    return;
  }

  if (path.includes('/forum_frame.php')) {
    import('./pages/contents/forum').then(m => m.initForumPage());
    return;
  }

  if (path.includes('/qstn_frame.php') || path.includes('/reslt_frame.php')) {
    import('./pages/contents/exam').then(m => m.initExamPage());
    return;
  }

  // --- 対象外ページ: ローディングを解除して何もしない ---
  hideLoadingScreen();
};

// ============================================================
// Step 3: DOMContentLoaded 以降でルーターを起動
// ============================================================
// document-start で実行されているため、DOMの準備を待つ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', route);
} else {
  // 既にDOM構築済みなら即実行
  route();
}