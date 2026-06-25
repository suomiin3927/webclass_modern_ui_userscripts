/**
 * PortalSkeleton.ts — ポータル系スケルトンローダーテンプレート
 * ページロード中に即座に表示する骨格UI。
 */
export function PortalSkeleton(): string {
  return `
    <div class="wc-app">
      <div style="height:60px;background:var(--wc-color-surface);border-bottom:1px solid var(--wc-color-border);display:flex;align-items:center;padding:0 24px;gap:16px;">
        <div class="wc-skeleton" style="width:120px;height:24px;border-radius:6px;"></div>
        <div class="wc-skeleton" style="width:200px;height:20px;border-radius:6px;margin-left:auto;"></div>
      </div>
      <div style="padding:32px 24px;max-width:1200px;margin:0 auto;">
        <div class="wc-skeleton wc-skeleton--heading" style="margin-bottom:24px;width:200px;height:28px;"></div>
        <div style="display:grid;gap:16px;">
          ${Array.from({ length: 4 }, () =>
            `<div class="wc-skeleton wc-skeleton--card" style="height:80px;border-radius:12px;"></div>`
          ).join('\n')}
        </div>
      </div>
    </div>
  `;
}