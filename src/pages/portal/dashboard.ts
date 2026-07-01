/**
 * pages/portal/dashboard.ts — ダッシュボード（コースリスト統合）
 *
 * 処理フロー:
 * 1. テーマ適用
 * 2. 共通 API (fetchDashboardInfo) からクリーンなデータをスクレイピング
 * 3. データの整形 (View 向けの構造へマッピング)
 * 4. Topbar + メインコンテンツ + サイドバーを組み立て
 * 5. replaceBody でページを差し替え
 * 6. イベント登録 + ローディング解除
 */

import { replaceBody, setPageTitle, hideLoadingScreen } from '../common';
import { applyTheme, getSetting } from '../../utils/settings';
import { buildTopbar, initTopbar, TopbarOptions } from '../../components/header';
import { fetchDashboardInfo } from '../../api/portal/fetchDashboardInfo'; // 先ほど作成したAPI
import {
  buildTimetableSection,
  buildOtherCoursesSection,
  buildSidebarSection,
  buildScheduleTitle,
  DashboardViewData,
  TimetableRow,
  CourseGroup,
  Notice,
  SurveyItem,
  SideBlock,
} from '../../templates/portal/DashboardView';

// ============================================================
// メインエントリ
// ============================================================

export async function initDashboardPage(): Promise<void> {
  applyTheme();

  // 1. 最新の完璧なスクレイピングロジックでDOMからデータを全回収
  const info = fetchDashboardInfo();

  // 2. アバター画像の取得（GM_getValue のカスタム保存画像があれば最優先、なければヘッダー内からフォールバック）
  const savedAvatarSrc = getSetting('avatarDataUrl');
  const wcAvatarSrc = document.querySelector<HTMLImageElement>('.navbar-nav .dropdown > a > img')?.src ?? '';
  const avatarSrc = savedAvatarSrc || wcAvatarSrc;

  // 3. ナビゲーションリンク等の既存固定パーツをサクッと回収
  const navLinks: { text: string; href: string }[] = [];
  document.querySelectorAll<HTMLAnchorElement>('#menu > ul:nth-child(2) > li > a').forEach(a => {
    const text = a.textContent?.trim().replace(/\s+/g, ' ') ?? '';
    if (text && !text.includes('ログアウト')) {
      navLinks.push({ text, href: a.href });
    }
  });

  const logoutHref = document.querySelector<HTMLAnchorElement>('a[href*="logout.php"]')?.href ?? '/webclass/logout.php';
  const msgAnchor = document.querySelector<HTMLAnchorElement>('#notification-dropdown-icon');
  const messageHref = msgAnchor?.href ?? '/webclass/msg_editor.php?msgappmode=inbox';
  const messageOnClick = msgAnchor?.getAttribute('onclick') ?? '';
  const messageIconHTML = document.querySelector('#notification-dropdown-icon .glyphicon-envelope')?.outerHTML 
    ?? '<span class="glyphicon glyphicon-envelope" aria-hidden="true"></span>';

  // アカウントドロップダウンメニューの回収
  const pcMenu = document.querySelector('.navbar-nav.navbar-right.hidden-xs .dropdown-menu');
  const anyMenu = document.querySelector('.navbar-nav .dropdown-menu');
  const menu = pcMenu || anyMenu;
  const accountMenuLinks: { text: string; href: string; onClick: string; target: string }[] = [];
  menu?.querySelectorAll<HTMLAnchorElement>('li a').forEach(a => {
    const text = a.textContent?.trim() ?? '';
    if (text) {
      accountMenuLinks.push({
        text,
        href: a.href,
        onClick: a.getAttribute('onclick') ?? '',
        target: a.target ?? '',
      });
    }
  });

  // 原本の学期セレクトフォーム（サブミット用）から現在の選択状態を取得
  const yearSel = document.querySelector<HTMLSelectElement>('select[name="year"]');
  const yearSelectData = yearSel
    ? { options: Array.from(yearSel.options).map(o => ({ value: o.value, label: o.text.trim(), selected: o.selected })), selected: yearSel.value }
    : { options: [{ value: '2026', label: '2026', selected: true }], selected: '2026' };

  const semSel = document.querySelector<HTMLSelectElement>('select[name="semester"]');
  const semesterSelectData = semSel
    ? { options: Array.from(semSel.options).map(o => ({ value: o.value, label: o.text.trim(), selected: o.selected })), selected: semSel.value }
    : { options: [{ value: '1', label: '前期', selected: true }], selected: '1' };

  // ============================================================
  // 4. API データ構造 から DashboardViewData へのマッピング（ギャップの吸収）
  // ============================================================
  
  // 4a. 時間割データのマッピング (ScheduledCourse[] -> TimetableRow[])
  const scheduleData: TimetableRow[] = [];
  const dayRevMap: Record<string, string> = { mon: '月曜日', tue: '火曜日', wed: '水曜日', thu: '木曜日', fri: '金曜日', sat: '土曜日' };

  // 1〜7限の器を綺麗に用意
  for (let i = 1; i <= 7; i++) {
    const dayCourses: TimetableRow['dayCourses'] = {};
    const periodKey = `p${i}`;
    
    // 該当する時限のコースを曜日ごとに詰め込む
    const matches = info.scheduledCourses.filter(c => c.schedule.period === periodKey);
    matches.forEach(c => {
      const longDay = dayRevMap[c.schedule.day];
      if (longDay) {
        dayCourses[longDay] = {
          title: c.title,
          fullTitle: c.title, // 必要に応じて詳細表示用として共通利用
          href: c.url,
          hasDeadline: c.hasUrgentTask
        };
      }
    });

    scheduleData.push({ order: `${i}限`, dayCourses });
  }

  const TODAY_DAY_MAP: Record<number, string> = { 0: '日曜日', 1: '月曜日', 2: '火曜日', 3: '水曜日', 4: '木曜日', 5: '金曜日', 6: '土曜日' };
  const todayDay = TODAY_DAY_MAP[new Date().getDay()];

  // 4b. その他のコースのマッピング (OtherCourseGroup[] -> CourseGroup[])
  const otherCourses: CourseGroup[] = info.otherCourses.map(g => ({
    title: g.categoryName,
    courses: g.children.flatMap(child => 
      child.courses.map(c => ({
        title: c.title,
        href: c.url,
        info: child.categoryName // 親カテゴリの階層名を情報ラベルとして渡す
      }))
    )
  }));

  // 4c. お知らせのマッピング (SystemAnnouncement[] -> Notice[])
  const notices: Notice[] = info.portalContents.systemAnnouncements.map(a => ({
    title: a.title,
    href: a.url,
    meta: '', // API側で不要としたメタ文字列は空文字で安全にフォールバック
    unread: a.isNew
  }));

  // 4d. アンケートデータのマッピング (重複排除済みのsideMenusから綺麗に逆算)
  const surveyData: SurveyItem[] = [];
  const surveyBlock = info.portalContents.sideMenus.find(m => m.title.includes('アンケート'));
  if (surveyBlock) {
    surveyBlock.links.forEach(l => {
      const match = l.title.match(/\((\d+)\)/);
      const count = match ? parseInt(match[1], 10) : 0;
      const label = l.title.replace(/\s*\(\d+\)/, '').trim();
      surveyData.push({ label, count, href: l.url });
    });
  }

  // 4e. その他サイドメニュー（アンケート以外）のマッピング (SideMenuBlock[] -> SideBlock[])
  const sideLinks: SideBlock[] = info.portalContents.sideMenus
    .filter(m => !m.title.includes('アンケート'))
    .map(m => ({
      title: m.title,
      links: m.links.map(l => ({
        text: l.title,
        href: l.url,
        onClick: l.url.includes('javascript:') ? l.url : '', // インラインJS用
        className: l.title.includes('ウィンドウ') ? 'showInIframeButton' : ''
      }))
    }));

  const addCourseHref = document.querySelector<HTMLAnchorElement>('a[href*="/courses/"]')?.href ?? '/webclass/index.php/courses/';

  // ============================================================
  // 5. ビューアセンブリ & レンダリング
  // ============================================================
  const topbarOptions: TopbarOptions = {
    userName: info.userProfile.username,
    avatarSrc,
    navLinks,
    logoutHref,
    messageHref,
    messageOnClick,
    messageIconHTML,
    unreadCount: info.userProfile.unreadMessagesCount,
    accountMenuLinks,
  };

  const viewData: DashboardViewData = {
    scheduleData,
    todayDay,
    yearSelectData,
    semesterSelectData,
    addCourseHref,
    otherCourses,
    notices,
    surveyData,
    sideLinks,
  };

  const html = `
    <div class="wc-app">
      ${buildTopbar(topbarOptions)}
      <div class="wc-dashboard-body">
        <main class="wc-dashboard-main">
          ${buildTimetableSection(viewData)}
          ${buildOtherCoursesSection(viewData)}
        </main>
        ${buildSidebarSection(viewData)}
      </div>
      <footer class="wc-footer">Powered by WebClass — Miyazaki University</footer>
    </div>
  `;

  replaceBody(html);
  setPageTitle('ホーム');

  // イベント登録
  initTopbar();
  bindCourseSearch();
  bindSemesterSelects();
  ensureOpenMessageFn();

  hideLoadingScreen();

  // ユーザー表示名のキャッシュ処理
  if (info.userProfile.username) {
    const cached = getSetting('cachedDisplayName');
    if (cached !== info.userProfile.username) {
      const { setSetting } = await import('../../utils/settings');
      setSetting('cachedDisplayName', info.userProfile.username);
    }
  }
}

// ============================================================
// イベント登録（ロジック維持）
// ============================================================

/** コース検索入力欄のフィルタリング */
function bindCourseSearch(): void {
  const input = document.getElementById('wc-course-search') as HTMLInputElement | null;
  if (!input) return;

  input.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>('[data-group]').forEach(group => {
      let anyVisible = false;
      group.querySelectorAll<HTMLElement>('.wc-item').forEach(item => {
        const a = item.querySelector<HTMLAnchorElement>('a');
        const name = (a?.dataset['courseName'] ?? '').toLowerCase();
        const visible = !query || name.includes(query);
        item.style.display = visible ? '' : 'none';
        if (visible) anyVisible = true;
      });
      group.style.display = anyVisible ? '' : 'none';
    });
  });
}

/** 学期フィルターセレクトの変更 → 元フォームをサブミット */
function bindSemesterSelects(): void {
  const yearSel = document.getElementById('wc-year-select') as HTMLSelectElement | null;
  const semesterSel = document.getElementById('wc-semester-select') as HTMLSelectElement | null;
  const titleEl = document.getElementById('wc-schedule-title');
  if (!yearSel || !semesterSel) return;

  const origYearSel = document.querySelector<HTMLSelectElement>('select[name="year"]');
  const origSemesterSel = document.querySelector<HTMLSelectElement>('select[name="semester"]');
  const origForm = document.querySelector<HTMLFormElement>('form[name="condition"]');

  const updateTitle = () => {
    if (titleEl) titleEl.textContent = buildScheduleTitle(yearSel.value, semesterSel.value);
  };

  yearSel.addEventListener('change', () => {
    updateTitle();
    if (origYearSel && origForm) {
      origYearSel.value = yearSel.value;
      origForm.submit();
    }
  });

  semesterSel.addEventListener('change', () => {
    updateTitle();
    if (origSemesterSel && origForm) {
      origSemesterSel.value = semesterSel.value;
      origForm.submit();
    }
  });
}

/** WebClass 既存の openMessage 関数を安全にポリフィル */
function ensureOpenMessageFn(): void {
  const win = window as unknown as { openMessage?: (url: string) => boolean };
  if (typeof win.openMessage !== 'undefined') return;
  win.openMessage = function (url: string) {
    const w = window.open(
      url,
      'msgeditor',
      'toolbar=no,location=no,directories=no,status=yes,menubar=no,scrollbars=yes,resizable=yes,width=820,height=650',
    );
    if (w !== null) w.focus();
    return false;
  };
}