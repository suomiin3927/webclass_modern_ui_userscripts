/**
 * utils/domObserver.ts — 動的DOM監視
 *
 * 元サイトが非同期でDOMを書き換えるケースへの対応。
 * 特に教材系フレームで使用する。
 */

/**
 * 指定セレクタに一致するDOMが現れたらコールバックを呼ぶ。
 * すでに存在していれば即コールバック。
 *
 * @param selector   監視するCSSセレクタ
 * @param callback   要素が見つかったときのコールバック
 * @param root       監視するルート要素（省略時 document.body）
 * @param timeout    タイムアウトms（省略時 10000ms）
 * @returns          監視を止めるための関数
 */
export function waitForElement(
  selector: string,
  callback: (el: Element) => void,
  root: Element | Document = document,
  timeout = 10_000,
): () => void {
  // 既に存在していれば即実行
  const existing = root.querySelector(selector);
  if (existing) {
    callback(existing);
    return () => {};
  }

  let observer: MutationObserver | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
    if (timer !== null) clearTimeout(timer);
  };

  observer = new MutationObserver(() => {
    const el = root.querySelector(selector);
    if (el) {
      cleanup();
      callback(el);
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  timer = setTimeout(() => {
    cleanup();
    console.warn(`[WebClass Modern UI] waitForElement: "${selector}" がタイムアウト`);
  }, timeout);

  return cleanup;
}

/**
 * 指定セレクタに一致するDOMが消えたらコールバックを呼ぶ。
 *
 * @param selector   監視するCSSセレクタ
 * @param callback   要素が消えたときのコールバック
 * @param root       監視するルート要素
 * @returns          監視を止めるための関数
 */
export function waitForRemoval(
  selector: string,
  callback: () => void,
  root: Element | Document = document,
): () => void {
  if (!root.querySelector(selector)) {
    callback();
    return () => {};
  }

  const observer = new MutationObserver(() => {
    if (!root.querySelector(selector)) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}