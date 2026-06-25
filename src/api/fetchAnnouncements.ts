/**
 * api/fetchAnnouncements.ts — お知らせ一覧の非同期取得
 *
 * ダッシュボードへ統合するため、バックグラウンドでお知らせページを
 * GM_xmlhttpRequest でフェッチしてDOMをパースする。
 *
 * GM_xmlhttpRequest を使う理由:
 *   通常の fetch() はWebClassのCSRF/同一オリジン制限で弾かれることがあるが、
 *   Userscriptの特権スコープからなら回避できる。
 */

declare function GM_xmlhttpRequest(details: GMXHRDetails): void;

interface GMXHRDetails {
  method: string;
  url: string;
  headers?: Record<string, string>;
  onload?: (response: { status: number; responseText: string }) => void;
  onerror?: (response: { status: number; statusText: string }) => void;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  isUnread: boolean;
  href: string;
}

/**
 * お知らせ一覧を取得してパースした配列を返す。
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  return new Promise((resolve) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://webclass.eden.miyazaki-u.ac.jp/webclass/informations.php?acs_=',
      headers: { 'Accept': 'text/html' },
      onload: (res) => {
        if (res.status !== 200) {
          console.warn('[WebClass Modern UI] お知らせ取得失敗:', res.status);
          resolve([]);
          return;
        }
        resolve(parseAnnouncementsHTML(res.responseText));
      },
      onerror: (res) => {
        console.warn('[WebClass Modern UI] お知らせ取得エラー:', res.statusText);
        resolve([]);
      },
    });
  });
}

/**
 * お知らせページのHTMLをパースして配列に変換する。
 * 元サイトのHTML構造が変わってもクラッシュしないようオプショナルチェーン徹底。
 */
function parseAnnouncementsHTML(html: string): Announcement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // お知らせ行のセレクタ（元サイト構造に合わせて調整が必要）
  const rows = doc.querySelectorAll('table.informations tr, .info-list li, [class*="information"] tr');

  const results: Announcement[] = [];

  rows.forEach((row, i) => {
    const anchor = row.querySelector<HTMLAnchorElement>('a[href]');
    if (!anchor) return;

    const titleEl = row.querySelector('.title, td:nth-child(2), h3, h4');
    const dateEl  = row.querySelector('.date, td:first-child, time');
    const isUnread = row.classList.contains('unread') ||
                     row.querySelector('.unread, .new, [class*="unread"]') !== null;

    results.push({
      id:       `announcement-${i}`,
      title:    (titleEl?.textContent ?? anchor.textContent ?? '').trim() || '（タイトルなし）',
      date:     (dateEl?.textContent ?? '').trim(),
      isUnread,
      href:     anchor.href,
    });
  });

  return results;
}