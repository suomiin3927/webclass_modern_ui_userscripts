/**
 * templates/portal/DashboardView.ts — ダッシュボード HTML テンプレート
 */

// ============================================================
// 型定義 (中身は維持)
// ============================================================
export interface TimetableCourse {
  title:       string;
  fullTitle:   string;
  href:        string;
  hasDeadline: boolean;
}

export interface TimetableRow {
  order:      string;
  dayCourses: Record<string, TimetableCourse>;
}

export interface CourseGroup {
  title:   string;
  courses: { title: string; href: string; info: string }[];
}

export interface Notice {
  title:  string;
  href:   string;
  meta:   string;
  unread: boolean;
}

export interface SurveyItem {
  label: string;
  count: number;
  href:  string;
}

export interface SideBlock {
  title: string;
  links: { text: string; href: string; onClick: string; className: string }[];
}

export interface DashboardViewData {
  scheduleData:       TimetableRow[];
  todayDay:           string;
  yearSelectData:     { options: { value: string; label: string; selected: boolean }[]; selected: string };
  semesterSelectData: { options: { value: string; label: string; selected: boolean }[]; selected: string };
  addCourseHref:      string;
  otherCourses:       CourseGroup[];
  notices:            Notice[];
  surveyData:         SurveyItem[];
  sideLinks:          SideBlock[];
}

// ============================================================
// HTML エスケープユーティリティ (維持)
// ============================================================
function escAttr(s: unknown): string {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escHtml(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================
// ローカルコンポーネント関数 (維持)
// ============================================================
interface ItemProps {
  hasDot?:     boolean;
  dotState?:   'is-unread' | 'is-read';
  title:       string;
  isBold?:     boolean;
  subText?:    string;
  infoText?:   string;
  infoAccent?: boolean;
  href:        string;
  onClick?:    string;
  titleAttr?:  string;
  extraClass?: string;
  searchKey?:  string;
}

function Item({
  hasDot     = false,
  dotState   = 'is-read',
  title,
  isBold     = false,
  subText    = '',
  infoText   = '',
  infoAccent = false,
  href,
  onClick    = '',
  titleAttr  = '',
  extraClass = '',
  searchKey  = '',
}: ItemProps): string {
  const dotHtml     = hasDot    ? `<span class="wc-item__dot ${dotState}"></span>` : '';
  const subHtml     = subText   ? `<div class="wc-item__sub">${escHtml(subText)}</div>` : '';
  const displayInfoText = infoText === '[未分類]' ? '---' : infoText;
  const infoHtml    = displayInfoText  ? `<span class="wc-item__info${infoAccent ? ' is-accent' : ''}">${escHtml(displayInfoText)}</span>` : '';
  const titleAttrs  = titleAttr ? `title="${escAttr(titleAttr)}"` : '';
  const searchAttrs = searchKey ? `data-course-name="${escAttr(searchKey)}"` : '';

  const onClickOnDiv = onClick && !onClick.includes('return') ? `onclick="${escAttr(onClick)}"` : '';
  const onClickOnA   = onClick &&  onClick.includes('return') ? `onclick="${escAttr(onClick)}"` : '';

  return `
    <div class="wc-item" ${onClickOnDiv}>
      <a class="${extraClass}"
         href="${escAttr(href)}"
         ${onClickOnA}
         ${titleAttrs}
         ${searchAttrs}>
        <div style="display:flex;gap:8px;align-items:flex-start;">
          ${dotHtml}
          <div class="wc-item__content">
            <div class="wc-item__title${isBold ? ' is-bold' : ''}">${escHtml(title)}</div>
            ${subHtml}
          </div>
        </div>
        ${infoHtml}
      </a>
    </div>
  `;
}

interface CardProps {
  title:       string;
  bodyHtml:    string;
  footerHtml?: string;
}

function Card({ title, bodyHtml, footerHtml = '' }: CardProps): string {
  return `
    <div class="wc-card-dash">
      <div class="wc-card-dash__head">${escHtml(title)}</div>
      <div class="wc-card-dash__body">${bodyHtml}</div>
      ${footerHtml}
    </div>
  `;
}

function SelectOptions(
  optionList: { value: string; label: string; selected: boolean }[],
): string {
  return optionList.map(o =>
    `<option value="${escAttr(o.value)}" ${o.selected ? 'selected' : ''}>${escHtml(o.label)}</option>`
  ).join('');
}

// ============================================================
// 時間割セクション
// ============================================================
const DAYS_LONG  = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'] as const;
const DAYS_SHORT = ['月', '火', '水', '木', '金', '土'] as const;

export function buildScheduleTitle(yearVal: string, semesterVal: string): string {
  const yearLabel = yearVal === 'all' ? '全年度' : `${yearVal}年度`;
  const semLabel  = semesterVal === 'all' ? '通年'
                  : semesterVal === '1'   ? '前期'
                  : semesterVal === '2'   ? '後期'
                  : semesterVal;
  return `${yearLabel} ${semLabel}`;
}

export function buildTimetableSection(data: DashboardViewData): string {
  const { scheduleData, todayDay, yearSelectData, semesterSelectData, addCourseHref } = data;
  const initTitle = buildScheduleTitle(yearSelectData.selected, semesterSelectData.selected);

  const filteredScheduleData = scheduleData.filter(row => {
    const orderStr = String(row.order).trim();
    return orderStr !== '7' && !orderStr.includes('7限');
  });

  const hasSaturdayCourse = filteredScheduleData.some(row => row.dayCourses['土曜日'] !== undefined);
  const activeDaysLong  = hasSaturdayCourse ? DAYS_LONG : DAYS_LONG.slice(0, 5);
  const activeDaysShort = hasSaturdayCourse ? DAYS_SHORT : DAYS_SHORT.slice(0, 5);

  const headerCells = activeDaysLong.map((d, i) => {
    const isToday = d === todayDay;
    return `
      <div class="wc-tt-hcell${isToday ? ' is-today' : ''}">
        ${activeDaysShort[i]}
      </div>
    `;
  }).join('');

  const bodyRows = filteredScheduleData.map((row, rowIdx) => {
    const isLast   = rowIdx === filteredScheduleData.length - 1;
    const rowClass = isLast ? ' wc-tt-row--last' : '';

    const cells = activeDaysLong.map((d, ci) => {
      const course    = row.dayCourses[d];
      const isToday   = d === todayDay;
      const isLastCol = ci === activeDaysLong.length - 1;

      const cellClasses = [
        'wc-tt-cell',
        isToday   ? 'is-today'    : '',
        isLastCol ? 'is-last-col' : '',
      ].filter(Boolean).join(' ');

      if (!course) return `<div class="${cellClasses}"></div>`;

      // ── 💡 変更点: () または （） とその中身を "  " (半角スペース2個) に置換 ──
      // [^)]* は「閉じ括弧以外の文字」にマッチさせることで、ネストや複数箇所の誤判定を防止
      const cleanedTitle = course.title.replace(/\([^)]*\)|（[^）]*）/g, '  ');

      return `
        <div class="${cellClasses}">
          <div class="wc-chip${course.hasDeadline ? ' has-deadline' : ''}">
            <a class="wc-chip__link"
               href="${escAttr(course.href)}"
               title="${escAttr(course.fullTitle)}">
              <span class="wc-chip__title">${escHtml(cleanedTitle)}</span>
              ${course.hasDeadline ? '<span class="wc-chip__badge">⚠ 締切間近</span>' : ''}
            </a>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="wc-tt-cell is-time-lbl${rowClass}">${escHtml(row.order)}</div>
      ${cells}
    `;
  }).join('');

  const gridClass = hasSaturdayCourse ? 'has-sat' : 'no-sat';

  return `
    <section>
      <div class="wc-section-head">
        <span class="wc-section-title">時間割</span>
      </div>
      <div class="wc-schedule-wrap">
        <div class="wc-schedule-head">
          <span class="wc-schedule-title" id="wc-schedule-title">${escHtml(initTitle)}</span>
          <div class="wc-schedule-filter">
            <label for="wc-year-select">学年度</label>
            <select id="wc-year-select">${SelectOptions(yearSelectData.options)}</select>
            <span class="wc-schedule-filter-sep">/</span>
            <label for="wc-semester-select">学期</label>
            <select id="wc-semester-select">${SelectOptions(semesterSelectData.options)}</select>
          </div>
        </div>
        <div class="wc-timetable ${gridClass}">
          <div class="wc-tt-hcell is-corner"></div>
          ${headerCells}
          ${bodyRows}
        </div>
        <div class="wc-add-bar">
          <a class="wc-add-btn" href="${escAttr(addCourseHref)}">＋ コースを追加</a>
        </div>
      </div>
    </section>
  `;
}

// ============================================================
// その他のコースセクション
// ============================================================
export function buildOtherCoursesSection(data: DashboardViewData): string {
  const { otherCourses } = data;

  const groupsHtml = otherCourses.map(group => {
    // ── 💡 変更点: グループ名が [未分類] だった場合は "---" に置き換える ──
    const displayTitle = group.title === '[未分類]' ? '---' : group.title;

    return `
      <div class="wc-course-group" data-group>
        <div class="wc-course-group__title">${escHtml(displayTitle)}</div>
        <div class="wc-course-list">
          ${group.courses.map(c => Item({
            title:     c.title,
            infoText:  c.info,
            href:      c.href,
            searchKey: c.title,
          })).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <section>
      <div class="wc-section-head">
        <span class="wc-section-title">その他のコース</span>
      </div>
      <div class="wc-other-courses">
        <input type="text"
               class="wc-course-search"
               id="wc-course-search"
               placeholder="コース名で検索…"
               aria-label="コース名で検索">
        ${groupsHtml}
      </div>
    </section>
  `;
}

// ============================================================
// サイドバーセクション (維持)
// ============================================================
export function buildSidebarSection(data: DashboardViewData): string {
  const { surveyData, sideLinks, notices } = data;

  const surveyCardHtml = surveyData.length > 0
    ? Card({
        title: 'アンケート',
        bodyHtml: surveyData.map(s => Item({
          hasDot:     true,
          dotState:   s.count > 0 ? 'is-unread' : 'is-read',
          title:      s.label,
          isBold:     s.count > 0,
          infoText:   s.count > 0 ? `${s.count}件` : 'なし',
          infoAccent: s.count > 0,
          href:       s.href,
        })).join(''),
      })
    : '';

  const sideLinkCardsHtml = sideLinks.map(group => Card({
    title: group.title,
    bodyHtml: group.links.length === 0
      ? `<p class="wc-card-dash__empty">リンクはありません</p>`
      : group.links.map(link => Item({
          title:      link.text,
          href:       link.href,
          onClick:    link.onClick,
          extraClass: link.className.includes('showInIframeButton') ? 'showInIframeButton' : '',
        })).join(''),
  })).join('');

  const noticeCardHtml = Card({
    title: '管理者からのお知らせ',
    bodyHtml: notices.length === 0
      ? `<p class="wc-card-dash__empty">お知らせはありません</p>`
      : notices.map(n => Item({
          hasDot:    true,
          dotState:  n.unread ? 'is-unread' : 'is-read',
          title:     n.title.length > 36 ? n.title.slice(0, 36) + '…' : n.title,
          isBold:    n.unread,
          subText:   n.meta,
          href:      n.href,
          onClick:   `return openMessage('${n.href}')`,
          titleAttr: n.title,
        })).join(''),
    footerHtml: `
      <a class="wc-see-all"
         href="/webclass/informations.php"
         target="msgeditor"
         onclick="return openMessage('/webclass/informations.php')">
        すべて見る →
      </a>
    `,
  });

  return `
    <aside class="wc-sidebar">
      ${surveyCardHtml}
      ${sideLinkCardsHtml}
      ${noticeCardHtml}
    </aside>
  `;
}