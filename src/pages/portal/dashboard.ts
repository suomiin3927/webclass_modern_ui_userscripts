/**
 * pages/portal/dashboard.ts — ダッシュボード（コースリスト統合）
 *
 * 方針:
 *   1. スケルトンを即表示
 *   2. お知らせ・メッセージを並行フェッチ
 *   3. 既存のコース一覧をスクレイピング
 *   4. モダンUIを注入
 */
import { replaceBody, setPageTitle, hideLoadingScreen } from '../common';
import { applyTheme } from '../../utils/settings';
import { fetchAnnouncements } from '../../api/fetchAnnouncements';
import { fetchMessages } from '../../api/fetchMessages';
import { buildHeader, initHeader } from '../../components/CustomHeader';

export async function initDashboardPage(): Promise<void> {
  applyTheme();

  // スクレイピング（コース一覧・ユーザー名）
  const courses      = scrapeCourses();
  const displayName  = scrapeDisplayName();

  // 並行フェッチ（お知らせ・メッセージ）
  const [announcements, messages] = await Promise.all([
    fetchAnnouncements(),
    fetchMessages(),
  ]);

  const header = buildHeader({ currentPage: 'dashboard', displayName });

  const html = `
    <div class="wc-app">
      ${header}
      <main class="wc-main">
        <h2 style="font-size:var(--wc-text-xl);font-weight:700;margin-bottom:var(--wc-space-6);">
          ダッシュボード
        </h2>
        <!-- TODO: DashboardView.ts テンプレートへ移行 -->
        <p style="color:var(--wc-color-text-secondary);font-size:var(--wc-text-sm);">
          コース: ${courses.length} 件 ／
          お知らせ: ${announcements.length} 件 ／
          メッセージ: ${messages.length} 件
        </p>
      </main>
    </div>
  `;

  replaceBody(html);
  setPageTitle('ホーム');
  initHeader();
  hideLoadingScreen();
}

interface Course { title: string; href: string; }

function scrapeCourses(): Course[] {
  return Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href*="/course.php/"]')
  ).map(a => ({
    title: a.textContent?.trim() ?? '',
    href:  a.href,
  }));
}

function scrapeDisplayName(): string {
  return (
    document.querySelector('.username, [class*="username"], [class*="user-name"]')
      ?.textContent?.trim() ?? ''
  );
}