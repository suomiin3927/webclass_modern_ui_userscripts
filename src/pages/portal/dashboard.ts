/**
 * pages/portal/dashboard.ts — ダッシュボード（コースリスト統合）
 *
 * Userscript の extractTopPageData / renderTopPage / bindCourseSearch /
 * bindSemesterSelects / ensureOpenMessageFn を URL ルーティング方式で移植。
 *
 * 処理フロー:
 *   1. テーマ適用
 *   2. 既存 WebClass DOM からデータをスクレイピング
 *   3. Topbar + メインコンテンツ + サイドバーを組み立て
 *   4. replaceBody でページを差し替え
 *   5. イベント登録 + ローディング解除
 */

import { replaceBody, setPageTitle, hideLoadingScreen } from '../common';
import { applyTheme, getSetting } from '../../utils/settings';
import { buildTopbar, initTopbar, TopbarOptions } from '../../components/CustomHeader';
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

  // スクレイピング
  const scraped = scrapeTopPageData();

  // Topbar HTML
  const topbarOptions: TopbarOptions = {
    userName:        scraped.userName,
    avatarSrc:       scraped.avatarSrc,
    navLinks:        scraped.navLinks,
    logoutHref:      scraped.logoutHref,
    messageHref:     scraped.messageHref,
    messageOnClick:  scraped.messageOnClick,
    messageIconHTML: scraped.messageIconHTML,
    unreadCount:     scraped.unreadCount,
    accountMenuLinks: scraped.accountMenuLinks,
  };

  const viewData: DashboardViewData = {
    scheduleData:       scraped.scheduleData,
    todayDay:           scraped.todayDay,
    yearSelectData:     scraped.yearSelectData,
    semesterSelectData: scraped.semesterSelectData,
    addCourseHref:      scraped.addCourseHref,
    otherCourses:       scraped.otherCourses,
    notices:            scraped.notices,
    surveyData:         scraped.surveyData,
    sideLinks:          scraped.sideLinks,
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
  bindSemesterSelects(scraped);
  ensureOpenMessageFn();

  hideLoadingScreen();

  // ユーザー表示名をキャッシュ
  if (scraped.userName) {
    // getSetting のみで確認（import 済み）し、変更があれば保存
    const cached = getSetting('cachedDisplayName');
    if (cached !== scraped.userName) {
      const { setSetting } = await import('../../utils/settings');
      setSetting('cachedDisplayName', scraped.userName);
    }
  }
}

// ============================================================
// スクレイピング
// ============================================================

interface ScrapedTopPageData {
  userName:          string;
  avatarSrc:         string;
  navLinks:          { text: string; href: string }[];
  logoutHref:        string;
  messageHref:       string;
  messageOnClick:    string;
  messageIconHTML:   string;
  unreadCount:       number;
  accountMenuLinks:  { text: string; href: string; onClick: string; target: string }[];
  notices:           Notice[];
  yearSelectData:    { options: { value: string; label: string; selected: boolean }[]; selected: string };
  semesterSelectData:{ options: { value: string; label: string; selected: boolean }[]; selected: string };
  scheduleData:      TimetableRow[];
  todayDay:          string;
  otherCourses:      CourseGroup[];
  surveyData:        SurveyItem[];
  sideLinks:         SideBlock[];
  addCourseHref:     string;
}

function scrapeTopPageData(): ScrapedTopPageData {
  // ── ユーザー情報 ────────────────────────────────────────────
  const userName = (
    document.querySelector(
      'body > header > nav > div:nth-child(1) > ul > li:nth-child(2) > a > span'
    )?.textContent?.trim() ?? 'User'
  );

  // アバター: GM_getValue 保存画像 → WebClass 既存画像 の優先順
  const savedAvatarSrc = getSetting('avatarDataUrl');
  const wcAvatarSrc = (
    document.querySelector<HTMLImageElement>('.navbar-nav .dropdown > a > img')?.src ?? ''
  );
  const avatarSrc = savedAvatarSrc || wcAvatarSrc;

  // ── ナビゲーション（最大3件） ──────────────────────────────
  const navLinks: { text: string; href: string }[] = [];
  document.querySelectorAll<HTMLAnchorElement>('.nav.navbar-left > li > a').forEach(a => {
    const text = a.textContent?.trim().replace(/\s+/g, ' ') ?? '';
    if (text && !text.includes('ログアウト')) {
      navLinks.push({ text, href: a.href });
    }
  });

  const logoutHref = (
    document.querySelector<HTMLAnchorElement>('a[href*="logout.php"]')?.href
    ?? '/webclass/logout.php'
  );

  // ── メッセージアイコン ──────────────────────────────────────
  const msgAnchor      = document.querySelector<HTMLAnchorElement>('#notification-dropdown-icon');
  const messageHref    = msgAnchor?.href ?? '/webclass/msg_editor.php?msgappmode=inbox';
  const messageOnClick = msgAnchor?.getAttribute('onclick') ?? '';
  const messageIconHTML = (
    document.querySelector('#notification-dropdown-icon .glyphicon-envelope')?.outerHTML
    ?? '<span class="glyphicon glyphicon-envelope" aria-hidden="true"></span>'
  );
  const unreadCountEl = document.querySelector('#js-unread-message-count');
  const unreadCount   = unreadCountEl
    ? (parseInt(unreadCountEl.textContent?.trim() ?? '0', 10) || 0)
    : 0;

  // ── アカウントドロップダウン（PC用 .hidden-xs 優先） ────────
  const pcMenu  = document.querySelector('.navbar-nav.navbar-right.hidden-xs .dropdown-menu');
  const anyMenu = document.querySelector('.navbar-nav .dropdown-menu');
  const menu    = pcMenu || anyMenu;
  const accountMenuLinks: { text: string; href: string; onClick: string; target: string }[] = [];
  menu?.querySelectorAll<HTMLAnchorElement>('li a').forEach(a => {
    const text = a.textContent?.trim() ?? '';
    if (text) {
      accountMenuLinks.push({
        text,
        href:    a.href,
        onClick: a.getAttribute('onclick') ?? '',
        target:  a.target ?? '',
      });
    }
  });

  // ── お知らせ ────────────────────────────────────────────────
  const notices: Notice[] = [];
  document.querySelectorAll('#AjaxInfoBox .info-list li:not(.head)').forEach(li => {
    const a    = li.querySelector<HTMLAnchorElement>('.hidden-xs a.title') ?? li.querySelector<HTMLAnchorElement>('a.title');
    const meta = li.querySelector('.exhibitionInfo');
    if (a) {
      notices.push({
        title:  a.title || a.textContent?.trim() ?? '',
        href:   a.href,
        meta:   meta?.textContent?.trim() ?? '',
        unread: a.classList.contains('unread'),
      });
    }
  });

  // ── 学期フィルター ──────────────────────────────────────────
  const yearSel = document.querySelector<HTMLSelectElement>('select[name="year"]');
  const yearSelectData = yearSel
    ? {
        options:  Array.from(yearSel.options).map(o => ({ value: o.value, label: o.text.trim(), selected: o.selected })),
        selected: yearSel.value,
      }
    : { options: [{ value: '2026', label: '2026', selected: true }], selected: '2026' };

  const semSel = document.querySelector<HTMLSelectElement>('select[name="semester"]');
  const semesterSelectData = semSel
    ? {
        options:  Array.from(semSel.options).map(o => ({ value: o.value, label: o.text.trim(), selected: o.selected })),
        selected: semSel.value,
      }
    : { options: [{ value: '1', label: '前期', selected: true }], selected: '1' };

  // ── 時間割 ──────────────────────────────────────────────────
  const DAYS_LONG = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const scheduleData: TimetableRow[] = [];

  document.querySelectorAll('.schedule-table tbody tr').forEach(tr => {
    const orderCell = tr.querySelector('.schedule-table-class_order');
    const order     = orderCell?.textContent?.trim() ?? '';
    const cells     = tr.querySelectorAll('td:not(.schedule-table-class_order)');
    const dayCourses: TimetableRow['dayCourses'] = {};

    cells.forEach((td, i) => {
      const a = td.querySelector<HTMLAnchorElement>('a');
      if (a) {
        const hasDeadline = td.querySelector('.course-contents-info') !== null;
        dayCourses[DAYS_LONG[i]] = {
          title: (a.textContent ?? '')
            .replace(/»\s*/, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\([\d]+\)/g, '')
            .replace(/（.*?）/g, '  ')
            .replace('締切が近い課題があります。', '')
            .trim(),
          fullTitle: (a.textContent ?? '')
            .replace(/»\s*/, '')
            .replace('締切が近い課題があります。', '')
            .trim(),
          href: a.href,
          hasDeadline,
        };
      }
    });
    scheduleData.push({ order, dayCourses });
  });

  const TODAY_DAY_MAP: Record<number, string> = {
    0: '日曜日', 1: '月曜日', 2: '火曜日', 3: '水曜日',
    4: '木曜日', 5: '金曜日', 6: '土曜日',
  };
  const todayDay = TODAY_DAY_MAP[new Date().getDay()];

  // ── その他のコース ──────────────────────────────────────────
  const otherCourses: CourseGroup[] = [];
  document.querySelectorAll('.courseLevelOne > li').forEach(li => {
    const groupTitle = li.querySelector('.courseTree-levelTitle');
    if (!groupTitle) return;
    const courses: CourseGroup['courses'] = [];
    li.querySelectorAll('.courseList > li').forEach(item => {
      const a    = item.querySelector<HTMLAnchorElement>('a');
      const info = item.querySelector('.course-info');
      if (a) {
        courses.push({
          title: (a.textContent ?? '').replace(/»\s*/, '').trim(),
          href:  a.href,
          info:  info?.textContent?.trim() ?? '',
        });
      }
    });
    if (courses.length > 0) {
      otherCourses.push({ title: groupTitle.textContent?.trim() ?? '', courses });
    }
  });

  // ── アンケート（最初の1件のみ） ─────────────────────────────
  const surveyData: SurveyItem[] = [];
  const surveyBlock = Array.from(document.querySelectorAll('.side-block')).find(b => {
    const t = b.querySelector('h4.side-block-title, h2.side-block-title');
    return t?.textContent?.trim() === 'アンケート';
  });
  surveyBlock?.querySelectorAll<HTMLAnchorElement>('.menugroup li a').forEach(a => {
    const text  = a.textContent?.trim() ?? '';
    const match = text.match(/\((\d+)\)/);
    const count = match ? parseInt(match[1], 10) : 0;
    const label = text.replace(/\s*\(\d+\)/, '').replace(/^»\s*/, '').trim();
    surveyData.push({ label, count, href: a.href });
  });

  // ── その他サイドブロック（アンケート除外・タイトル重複排除） ─
  const sideLinks: SideBlock[] = [];
  const seen = new Set(['アンケート']);
  document.querySelectorAll('.side-block').forEach(block => {
    const titleEl = block.querySelector('.side-block-title, h2.side-block-title, h4.side-block-title');
    if (!titleEl) return;
    const titleText = titleEl.textContent?.trim() ?? '';
    if (seen.has(titleText)) return;
    seen.add(titleText);
    const links: SideBlock['links'] = [];
    block.querySelectorAll<HTMLAnchorElement>('a').forEach(a => {
      links.push({
        text:      (a.textContent ?? '').replace(/»\s*/, '').trim(),
        href:      a.href,
        onClick:   a.getAttribute('onclick') ?? '',
        className: a.className ?? '',
      });
    });
    if (links.length > 0) {
      sideLinks.push({ title: titleText, links });
    }
  });

  const addCourseHref = (
    document.querySelector<HTMLAnchorElement>('a[href*="/courses/"]')?.href
    ?? '/webclass/index.php/courses/'
  );

  return {
    userName, avatarSrc, navLinks, logoutHref,
    messageHref, messageOnClick, messageIconHTML, unreadCount,
    accountMenuLinks, notices,
    yearSelectData, semesterSelectData,
    scheduleData, todayDay,
    otherCourses, surveyData, sideLinks, addCourseHref,
  };
}

// ============================================================
// イベント登録
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
        const a       = item.querySelector<HTMLAnchorElement>('a');
        const name    = (a?.dataset['courseName'] ?? '').toLowerCase();
        const visible = !query || name.includes(query);
        item.style.display = visible ? '' : 'none';
        if (visible) anyVisible = true;
      });
      group.style.display = anyVisible ? '' : 'none';
    });
  });
}

/** 学期フィルターセレクトの変更 → 元フォームをサブミット */
function bindSemesterSelects(scraped: ScrapedTopPageData): void {
  const yearSel     = document.getElementById('wc-year-select')     as HTMLSelectElement | null;
  const semesterSel = document.getElementById('wc-semester-select') as HTMLSelectElement | null;
  const titleEl     = document.getElementById('wc-schedule-title');
  if (!yearSel || !semesterSel) return;

  const origYearSel     = document.querySelector<HTMLSelectElement>('select[name="year"]');
  const origSemesterSel = document.querySelector<HTMLSelectElement>('select[name="semester"]');
  const origForm        = document.querySelector<HTMLFormElement>('form[name="condition"]');

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

/**
 * WebClass 既存の openMessage 関数が未定義の場合のみ定義する。
 * お知らせをポップアップウィンドウで開く。
 */
function ensureOpenMessageFn(): void {
  if (typeof (window as Window & { openMessage?: unknown }).openMessage !== 'undefined') return;
  (window as Window & { openMessage: (url: string) => boolean }).openMessage = function (url: string) {
    const w = window.open(
      url,
      'msgeditor',
      'toolbar=no,location=no,directories=no,status=yes,menubar=no,scrollbars=yes,resizable=yes,width=820,height=650',
    );
    if (w !== null) w.focus();
    return false;
  };
}