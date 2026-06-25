/**
 * api/fetchMessages.ts — メッセージ受信箱の非同期取得
 *
 * ダッシュボードへ統合するため、バックグラウンドでメッセージページを
 * GM_xmlhttpRequest でフェッチしてDOMをパースする。
 */

declare function GM_xmlhttpRequest(details: GMXHRDetails): void;

interface GMXHRDetails {
  method: string;
  url: string;
  headers?: Record<string, string>;
  onload?: (response: { status: number; responseText: string }) => void;
  onerror?: (response: { status: number; statusText: string }) => void;
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  date: string;
  isUnread: boolean;
  href: string;
}

/**
 * 受信箱のメッセージ一覧を取得してパースした配列を返す。
 */
export async function fetchMessages(): Promise<Message[]> {
  return new Promise((resolve) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://webclass.eden.miyazaki-u.ac.jp/webclass/msg_editor.php?msgappmode=inbox&acs_=',
      headers: { 'Accept': 'text/html' },
      onload: (res) => {
        if (res.status !== 200) {
          console.warn('[WebClass Modern UI] メッセージ取得失敗:', res.status);
          resolve([]);
          return;
        }
        resolve(parseMessagesHTML(res.responseText));
      },
      onerror: (res) => {
        console.warn('[WebClass Modern UI] メッセージ取得エラー:', res.statusText);
        resolve([]);
      },
    });
  });
}

/**
 * メッセージページのHTMLをパースして配列に変換する。
 */
function parseMessagesHTML(html: string): Message[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // メッセージ行のセレクタ（元サイト構造に合わせて調整が必要）
  const rows = doc.querySelectorAll('table.msg tr, .msg-list li, [class*="message"] tr');

  const results: Message[] = [];

  rows.forEach((row, i) => {
    const anchor   = row.querySelector<HTMLAnchorElement>('a[href]');
    if (!anchor) return;

    const subjectEl = row.querySelector('.subject, td:nth-child(2), h3, h4');
    const fromEl    = row.querySelector('.from, td:nth-child(3), .sender');
    const dateEl    = row.querySelector('.date, td:last-child, time');
    const isUnread  = row.classList.contains('unread') ||
                      row.querySelector('.unread, .new, strong') !== null;

    results.push({
      id:       `message-${i}`,
      from:     (fromEl?.textContent ?? '').trim() || '差出人不明',
      subject:  (subjectEl?.textContent ?? anchor.textContent ?? '').trim() || '（件名なし）',
      date:     (dateEl?.textContent ?? '').trim(),
      isUnread,
      href:     anchor.href,
    });
  });

  return results;
}