import { WebClassDashboardInfo, ScheduledCourse, OtherCourseGroup, SystemAnnouncement, SideMenuBlock } from '../../types/portal/dashboard';

/**
 * WebClassのマイページ（コースリスト画面）のDOMを解析し、
 * 整形されたダッシュボード情報を取得します。
 * * @returns 解析されたダッシュボード情報オブジェクト
 */
export function fetchDashboardInfo(): WebClassDashboardInfo {
  const origin = window.location.origin;

  // =========================================================================
  // 1. ユーザープロファイル & 未読メッセージ総数 の取得
  // =========================================================================
  const usernameEl = document.querySelector("body > header > nav > div:nth-child(1) > ul > li:nth-child(2) > a > span");
  const username = usernameEl ? usernameEl.textContent?.trim() || '' : '';
  
  const totalMsgEl = document.getElementById('js-unread-message-count');
  const unreadMessagesCount = totalMsgEl ? parseInt(totalMsgEl.textContent || '0', 10) || 0 : 0;

  // =========================================================================
  // 2. 時間割コース (scheduledCourses) の取得
  // =========================================================================
  const scheduledCourses: ScheduledCourse[] = [];
  const table = document.querySelector('.schedule-table');
  
  if (table) {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
    const dayMap: Record<string, ScheduledCourse['schedule']['day']> = {
      '月曜日': 'mon', '火曜日': 'tue', '水曜日': 'wed',
      '木曜日': 'thu', '金曜日': 'fri', '土曜日': 'sat'
    };

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      const orderAttr = row.getAttribute('data-class_order');
      let period = 'unknown';
      if (orderAttr) {
        period = `p${orderAttr}`;
      }

      const cells = row.querySelectorAll('td:not(.schedule-table-class_order)');
      cells.forEach((cell, index) => {
        if (cell.classList.contains('blank') || cell.classList.contains('active-blank')) return;

        const linkEl = cell.querySelector('a');
        if (!linkEl) return;

        const rawUrl = linkEl.getAttribute('href') || '';
        const url = rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl}`;

        const rawText = linkEl.textContent?.replace(/^»\s*/, '').trim() || '';
        const match = rawText.match(/(.*?)\s*\[([^:]+):(.*?)\]/);
        
        let title = rawText;
        let id = '';
        let term = '';

        if (match) {
          title = match[1].trim();
          id = match[2].trim();     
          term = match[3].trim();   
        } else {
          const idMatch = url.match(/course\.php\/([^\/-]+)/);
          id = idMatch ? idMatch[1] : '';
        }

        let unreadMessages = 0;
        const msgEl = cell.querySelector('.course-new-message');
        if (msgEl && msgEl.textContent) {
          const msgMatch = msgEl.textContent.match(/\((\d+)\)/);
          if (msgMatch) unreadMessages = parseInt(msgMatch[1], 10);
        }

        const hasUrgentTask = !!cell.querySelector('.course-contents-info');
        const dayText = headers[index + 1] || '';
        const day = dayMap[dayText] || 'unknown';

        scheduledCourses.push({
          id, title, term, url,
          schedule: { day, period },
          unreadMessages, hasUrgentTask
        });
      });
    });
  }

  // =========================================================================
  // 3. その他のコース (otherCourses) の取得
  // =========================================================================
  const otherCourses: OtherCourseGroup[] = [];
  const levelOneLiList = document.querySelectorAll('.courseLevelOne > li');

  levelOneLiList.forEach((l1Li) => {
    const l1TitleEl = l1Li.querySelector('.courseTree-levelTitle');
    if (!l1TitleEl) return;
    const l1Name = l1TitleEl.textContent?.trim() || '';

    const l2NodeList: OtherCourseGroup['children'] = [];
    const l2LiList = l1Li.querySelectorAll('.courseLevelTwo > li');

    l2LiList.forEach((l2Li) => {
      const l2TitleEl = l2Li.querySelector('.title h5');
      if (!l2TitleEl) return;
      const l2Name = l2TitleEl.textContent?.trim() || '';

      const courseItems: OtherCourseGroup['children'][0]['courses'] = [];
      const courseLiList = l2Li.querySelectorAll('.courseList > li');

      courseLiList.forEach((cLi) => {
        const linkEl = cLi.querySelector('.course-title a');
        if (!linkEl) return;

        const rawUrl = linkEl.getAttribute('href') || '';
        const url = rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl}`;
        const rawText = linkEl.textContent?.replace(/^»\s*/, '').trim() || '';
        
        const idMatch = url.match(/course\.php\/([^\/]+)/);
        const id = idMatch ? idMatch[1].split('-')[0] : ''; 

        let unreadMessages = 0;
        const msgEl = cLi.querySelector('.course-new-message');
        if (msgEl && msgEl.textContent) {
          const msgMatch = msgEl.textContent.match(/\((\d+)\)/);
          if (msgMatch) unreadMessages = parseInt(msgMatch[1], 10);
        }

        const hasUrgentTask = !!cLi.querySelector('.course-contents-info');

        courseItems.push({
          id, title: rawText, url, unreadMessages, hasUrgentTask
        });
      });

      if (courseItems.length > 0) {
        l2NodeList.push({ categoryName: l2Name, courses: courseItems });
      }
    });

    if (l2NodeList.length > 0) {
      otherCourses.push({ categoryName: l1Name, children: l2NodeList });
    }
  });

  // =========================================================================
  // 4. ポータルコンテンツ (portalContents) の取得
  // =========================================================================
  // 4a. 管理者からのお知らせ
  const systemAnnouncements: SystemAnnouncement[] = [];
  const infoRows = document.querySelectorAll('#NewestInformations .info-list li:not(.head)');
  infoRows.forEach((row) => {
    const linkEl = row.querySelector('a.title');
    if (!linkEl) return;

    const rawUrl = linkEl.getAttribute('href') || '';
    const url = rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl}`;
    const title = linkEl.getAttribute('title') || linkEl.textContent?.trim() || '';
    const id = url.match(/id=(\d+)/)?.[1] || '';
    const isNew = linkEl.classList.contains('mark1'); 

    systemAnnouncements.push({ id, title, url, isNew });
  });

  // 4b. 全ての side-block をフラットに全回収する
  const allParsedBlocks: SideMenuBlock[] = [];
  const sideBlocks = document.querySelectorAll('.side-block');

  sideBlocks.forEach((block) => {
    const titleEl = block.querySelector('.side-block-title');
    if (!titleEl) return;
    const blockTitle = titleEl.textContent?.trim() || '';

    // ブロック内のすべてのリンクをそのまま抽出 (重複排除なし)
    const links: SideMenuBlock['links'] = [];
    const linkElements = block.querySelectorAll('a');
    
    linkElements.forEach((link) => {
      const rawUrl = link.getAttribute('href') || '';
      if (!rawUrl || rawUrl === '#') return;
      
      const url = rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl}`;
      const title = link.textContent?.replace(/^»\s*/, '').trim() || '';

      if (title) {
        links.push({ title, url });
      }
    });

    allParsedBlocks.push({
      title: blockTitle,
      links: links
    });
  });

  // 4c. タイトル名による重複ブロックの排除
  const sideMenus: SideMenuBlock[] = [];
  allParsedBlocks.forEach((block) => {
    if (!sideMenus.some(menu => menu.title === block.title)) {
      sideMenus.push(block);
    }
  });

  // 4d. アンケートの回答必要数を、「アンケート」ブロックから取得
  let requiredSurveysCount = 0;
  const surveyMenu = sideMenus.find(menu => menu.title.includes('アンケート'));
  if (surveyMenu) {
    requiredSurveysCount = surveyMenu.links.filter(l => !l.title.includes('ありません')).length;
  }

  // =========================================================================
  // 結果オブジェクトの返却
  // =========================================================================
  return {
    userProfile: { username, unreadMessagesCount },
    scheduledCourses,
    otherCourses,
    portalContents: {
      systemAnnouncements,
      requiredSurveysCount,
      sideMenus
    }
  };
}