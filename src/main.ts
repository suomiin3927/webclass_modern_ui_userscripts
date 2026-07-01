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

  // --- 教材実行・ビューワー系（コース内より優先して完全に判定を独立） ---
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

  // --- コース内系（/course.php/ 配下） ---
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

  // --- ポータル系個別（階層をフラットにして、index.php等が含まれても確実に引っかかるように変更） ---
  
  // 参加可能なコース (/webclass/index.php/courses/ などをカバー)
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

  // ポップアップ系（お知らせ・メッセージ）：UI構築をスキップして生画面を表示
  if (path.includes('/informations.php') || path.includes('/msg_editor.php')) {
    hideLoadingScreen();
    return;
  }

  // --- デフォルト: ポータルダッシュボード（コースリストトップ） ---
  // /webclass, /webclass/, /webclass/index.php、および認証直後の acs_ パラメータ付きトップを安全に捕獲
  const isTopPage = path === '/webclass' || path === '/webclass/' || path.endsWith('/index.php');
  const isAcsParam = search.includes('acs_=');

  if (isTopPage || isAcsParam) {
    import('./pages/portal/dashboard').then(m => m.initDashboardPage());
    return;
  }

  // --- 上記のどれにも該当しない対象外ページ: ローディングを解除してネイティブ表示 ---
  hideLoadingScreen();
};

// ============================================================
// Step 3: DOMContentLoaded 以降でルーターを起動
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', route);
} else {
  route();
}