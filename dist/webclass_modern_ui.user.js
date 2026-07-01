// ==UserScript==
// @name         Better WebClass
// @namespace    https://github.com/suomiin3927/webclass_modern_ui_userscript
// @version      0.1.0
// @author       suomiin3927 (Aiki Watanabe)
// @description  宮崎大学WebClassのUIをモダンに再構築するUserscript
// @license      MIT
// @match        https://webclass.eden.miyazaki-u.ac.jp/
// @match        https://webclass.eden.miyazaki-u.ac.jp/webclass
// @match        https://webclass.eden.miyazaki-u.ac.jp/webclass/*
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @connect      webclass.eden.miyazaki-u.ac.jp
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(r=>{if(typeof GM_addStyle=="function"){GM_addStyle(r);return}const o=document.createElement("style");o.textContent=r,document.head.append(o)})(' @import"https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap";:root{--wc-color-primary: #6366F1;--wc-color-primary-light: #818CF8;--wc-color-primary-dark: #4a4ccc;--wc-color-primary-rgb: 99,102,241;--wc-color-primary-ghost: rgba(99,102,241,.1);--wc-color-deadline: #EF4444;--wc-color-success: #10B981;--wc-color-success-ghost: #f0fdf4;--wc-color-warning: #F59E0B;--wc-color-warning-ghost: #fffbeb;--wc-color-danger: #EF4444;--wc-color-danger-ghost: #fef2f2;--wc-color-info: #0891b2;--wc-color-info-ghost: #ecfeff;--wc-color-bg: #F8FAFC;--wc-color-surface: #FFFFFF;--wc-color-surface2: #F1F5F9;--wc-color-surface3: #E2E8F0;--wc-color-border: #CBD5E1;--wc-color-border-strong: #94A3B8;--wc-color-text-primary: #0F172A;--wc-color-text-secondary: #475569;--wc-color-text-muted: #94A3B8;--wc-color-text-dim: #64748B;--wc-color-text-inverse: #FFFFFF;--wc-topbar-bg: rgba(248,250,252,.92);--wc-chip-text: var(--wc-color-primary-dark);--wc-today-col: rgba(var(--wc-color-primary-rgb), .07);--wc-font-sans: "Inter", -apple-system, "Hiragino Kaku Gothic ProN", "YuGothic", "Meiryo", system-ui, sans-serif;--wc-font-mono: "JetBrains Mono", "Consolas", "Courier New", monospace;--wc-text-xs: .75rem;--wc-text-sm: .875rem;--wc-text-base: 1rem;--wc-text-lg: 1.125rem;--wc-text-xl: 1.25rem;--wc-text-2xl: 1.5rem;--wc-text-3xl: 1.875rem;--wc-leading-tight: 1.25;--wc-leading-normal: 1.6;--wc-space-1: .25rem;--wc-space-2: .5rem;--wc-space-3: .75rem;--wc-space-4: 1rem;--wc-space-5: 1.25rem;--wc-space-6: 1.5rem;--wc-space-8: 2rem;--wc-space-10: 2.5rem;--wc-space-12: 3rem;--wc-radius-sm: .25rem;--wc-radius-md: .5rem;--wc-radius-lg: .75rem;--wc-radius-xl: 1rem;--wc-radius-full: 9999px;--wc-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / .05);--wc-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--wc-shadow-md: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);--wc-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--wc-shadow-popup: 0 8px 32px rgba(0,0,0,.28);--wc-transition-fast: .1s ease;--wc-transition-normal: .2s ease;--wc-transition-slow: .3s ease;--wc-header-height: 56px;--wc-sidebar-width: 330px;--wc-content-max-width: 1340px}:root.wc-theme-dark,:root.wc-theme-system{--wc-color-bg: #0F172A;--wc-color-surface: #1E293B;--wc-color-surface2: #263348;--wc-color-surface3: #2e3d55;--wc-color-border: #334155;--wc-color-border-strong: #475569;--wc-color-text-primary: #E2E8F0;--wc-color-text-secondary: #94A3B8;--wc-color-text-muted: #94A3B8;--wc-color-text-dim: #64748B;--wc-topbar-bg: rgba(15,23,42,.88);--wc-chip-text: var(--wc-color-primary-light);--wc-today-col: rgba(var(--wc-color-primary-rgb), .08);--wc-color-primary-ghost: rgba(var(--wc-color-primary-rgb), .1)}@media (prefers-color-scheme: light){:root.wc-theme-system{--wc-color-bg: #F8FAFC;--wc-color-surface: #FFFFFF;--wc-color-surface2: #F1F5F9;--wc-color-surface3: #E2E8F0;--wc-color-border: #CBD5E1;--wc-color-border-strong: #94A3B8;--wc-color-text-primary: #0F172A;--wc-color-text-secondary: #475569;--wc-color-text-muted: #94A3B8;--wc-color-text-dim: #64748B;--wc-topbar-bg: rgba(248,250,252,.92);--wc-chip-text: var(--wc-color-primary-dark);--wc-today-col: rgba(var(--wc-color-primary-rgb), .07)}}*,*:before,*:after{box-sizing:border-box;margin:0;padding:0}.wc-app{all:revert;font-family:var(--wc-font-sans);font-size:14px;line-height:var(--wc-leading-normal);color:var(--wc-color-text-primary);background:var(--wc-color-bg);min-height:100vh;display:block}.wc-app *,.wc-app *:before,.wc-app *:after{box-sizing:border-box;margin:0;padding:0}#wc-loading{position:fixed;inset:0;z-index:99999;background:var(--wc-color-surface, #fff);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:var(--wc-space-4, 16px);font-family:var(--wc-font-sans, system-ui, sans-serif)}#wc-loading.wc-loading--hidden{opacity:0;pointer-events:none;transition:opacity var(--wc-transition-slow, .3s ease)}.wc-spinner{width:40px;height:40px;border:3px solid var(--wc-color-border, #e2e8f0);border-top-color:var(--wc-color-primary, #6366F1);border-radius:50%;animation:wc-spin .7s linear infinite}@keyframes wc-spin{to{transform:rotate(360deg)}}.wc-loading__label{font-size:var(--wc-text-sm, 14px);color:var(--wc-color-text-muted, #94a3b8);letter-spacing:.05em}.wc-skeleton{background:linear-gradient(90deg,var(--wc-color-border, #e2e8f0) 25%,var(--wc-color-bg, #f8fafc) 37%,var(--wc-color-border, #e2e8f0) 63%);background-size:400% 100%;animation:wc-shimmer 1.4s ease infinite;border-radius:var(--wc-radius-sm)}@keyframes wc-shimmer{0%{background-position:100% 50%}to{background-position:0% 50%}}.wc-skeleton--text{height:1em;border-radius:var(--wc-radius-full)}.wc-skeleton--heading{height:1.5em;width:60%;border-radius:var(--wc-radius-full)}.wc-skeleton--card{height:80px;border-radius:var(--wc-radius-md)}.wc-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--wc-space-2);min-height:44px;padding:var(--wc-space-2) var(--wc-space-4);font-family:var(--wc-font-sans);font-size:var(--wc-text-sm);font-weight:500;line-height:1;border:1px solid transparent;border-radius:var(--wc-radius-md);cursor:pointer;text-decoration:none;white-space:nowrap;transition:background-color var(--wc-transition-fast),border-color var(--wc-transition-fast),color var(--wc-transition-fast),box-shadow var(--wc-transition-fast);user-select:none}.wc-btn:focus-visible{outline:2px solid var(--wc-color-primary);outline-offset:2px}.wc-btn--primary{background:var(--wc-color-primary);color:var(--wc-color-text-inverse)}.wc-btn--primary:hover{background:var(--wc-color-primary-dark)}.wc-btn--secondary{background:var(--wc-color-surface);color:var(--wc-color-text-primary);border-color:var(--wc-color-border)}.wc-btn--secondary:hover{background:var(--wc-color-surface2)}.wc-btn--ghost{background:transparent;color:var(--wc-color-text-secondary)}.wc-btn--ghost:hover{background:var(--wc-color-surface2);color:var(--wc-color-text-primary)}.wc-btn--danger{background:var(--wc-color-danger);color:var(--wc-color-text-inverse)}.wc-btn--danger:hover{background:#b91c1c}.wc-btn--sm{min-height:32px;padding:var(--wc-space-1) var(--wc-space-3);font-size:var(--wc-text-xs)}.wc-btn--lg{min-height:52px;padding:var(--wc-space-3) var(--wc-space-6);font-size:var(--wc-text-base)}.wc-badge{display:inline-flex;align-items:center;padding:2px var(--wc-space-2);font-size:var(--wc-text-xs);font-weight:600;line-height:1.4;border-radius:var(--wc-radius-full);white-space:nowrap}.wc-badge--primary{background:var(--wc-color-primary-ghost);color:var(--wc-color-primary-dark)}.wc-badge--success{background:var(--wc-color-success-ghost);color:var(--wc-color-success)}.wc-badge--warning{background:var(--wc-color-warning-ghost);color:var(--wc-color-warning)}.wc-badge--danger{background:var(--wc-color-danger-ghost);color:var(--wc-color-danger)}.wc-badge--info{background:var(--wc-color-info-ghost);color:var(--wc-color-info)}.wc-badge--neutral{background:var(--wc-color-surface2);color:var(--wc-color-text-secondary);border:1px solid var(--wc-color-border)}.wc-card{background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:var(--wc-radius-lg);overflow:hidden}.wc-card__header,.wc-card__body,.wc-card__footer{padding:var(--wc-space-4) var(--wc-space-5)}.wc-card__header{border-bottom:1px solid var(--wc-color-border);display:flex;align-items:center;gap:var(--wc-space-3)}.wc-card__title{font-size:var(--wc-text-base);font-weight:600;color:var(--wc-color-text-primary)}.wc-card__footer{border-top:1px solid var(--wc-color-border)}.wc-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--wc-color-border);border-radius:var(--wc-radius-lg)}.wc-table{width:100%;border-collapse:collapse;font-size:var(--wc-text-sm)}.wc-table th,.wc-table td{padding:var(--wc-space-3) var(--wc-space-4);text-align:left;border-bottom:1px solid var(--wc-color-border);white-space:nowrap}.wc-table th{font-weight:600;font-size:var(--wc-text-xs);text-transform:uppercase;letter-spacing:.05em;color:var(--wc-color-text-secondary);background:var(--wc-color-surface2)}.wc-table tbody tr:last-child td{border-bottom:none}.wc-table tbody tr:hover td{background:var(--wc-color-primary-ghost)}.wc-input,.wc-select,.wc-textarea{display:block;width:100%;font-size:var(--wc-text-base);font-family:var(--wc-font-sans);line-height:var(--wc-leading-normal);color:var(--wc-color-text-primary);background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:var(--wc-radius-md);padding:var(--wc-space-2) var(--wc-space-3);min-height:44px;transition:border-color var(--wc-transition-fast),box-shadow var(--wc-transition-fast)}.wc-input:focus,.wc-select:focus,.wc-textarea:focus{outline:none;border-color:var(--wc-color-primary);box-shadow:0 0 0 3px var(--wc-color-primary-ghost)}.wc-input::placeholder,.wc-textarea::placeholder{color:var(--wc-color-text-dim)}.wc-form-label{display:block;font-size:var(--wc-text-sm);font-weight:500;color:var(--wc-color-text-secondary);margin-bottom:var(--wc-space-1)}.wc-form-group{display:flex;flex-direction:column;gap:var(--wc-space-1);margin-bottom:var(--wc-space-4)}.wc-modal-backdrop{position:fixed;inset:0;z-index:9000;background:#0f172a80;display:flex;align-items:center;justify-content:center;padding:var(--wc-space-4);animation:wc-fade-in var(--wc-transition-normal) ease}.wc-modal{background:var(--wc-color-surface);border-radius:var(--wc-radius-xl);box-shadow:var(--wc-shadow-lg);width:100%;max-width:540px;max-height:90vh;overflow-y:auto;animation:wc-slide-up var(--wc-transition-normal) ease}.wc-modal__header{display:flex;align-items:center;justify-content:space-between;padding:var(--wc-space-5) var(--wc-space-6);border-bottom:1px solid var(--wc-color-border)}.wc-modal__title{font-size:var(--wc-text-lg);font-weight:600}.wc-modal__body{padding:var(--wc-space-5) var(--wc-space-6)}.wc-modal__footer{display:flex;align-items:center;justify-content:flex-end;gap:var(--wc-space-3);padding:var(--wc-space-4) var(--wc-space-6);border-top:1px solid var(--wc-color-border)}@keyframes wc-fade-in{0%{opacity:0}to{opacity:1}}@keyframes wc-slide-up{0%{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}.wc-layout{display:flex;flex-direction:column;min-height:100vh}.wc-main{flex:1;padding:var(--wc-space-6) var(--wc-space-4);max-width:var(--wc-content-max-width);width:100%;margin:0 auto}@media (min-width: 768px){.wc-main{padding:var(--wc-space-8) var(--wc-space-6)}}.wc-topbar{position:sticky;top:0;z-index:200;background:var(--wc-topbar-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--wc-color-border);display:flex;align-items:center;height:var(--wc-header-height);padding:0 24px}.wc-topbar__logo{font-weight:700;font-size:18px;color:var(--wc-color-primary-light);letter-spacing:-.5px;text-decoration:none;margin-right:28px;flex-shrink:0}.wc-topbar__logo span{color:var(--wc-color-text-primary)}.wc-topbar__nav{display:flex;gap:2px;flex:1}.wc-topbar__nav-link{color:var(--wc-color-text-muted);text-decoration:none;padding:6px 11px;border-radius:6px;font-size:13px;font-weight:500;white-space:nowrap;transition:background var(--wc-transition-fast),color var(--wc-transition-fast);position:relative}.wc-topbar__nav-link:hover{background:var(--wc-color-surface2);color:var(--wc-color-text-primary)}.wc-topbar__nav-link.is-active{color:var(--wc-color-text-primary);font-weight:600}.wc-topbar__nav-link.is-active:after{content:"";position:absolute;bottom:-1px;left:8px;right:8px;height:2px;border-radius:2px 2px 0 0;background:var(--wc-color-primary)}.wc-topbar__actions{display:flex;align-items:center;gap:10px;margin-left:auto}.wc-msg-btn{display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:7px;color:var(--wc-color-text-muted);font-size:15px;text-decoration:none;transition:background var(--wc-transition-fast),color var(--wc-transition-fast);flex-shrink:0}.wc-msg-btn:hover{background:var(--wc-color-surface2);color:var(--wc-color-text-primary)}.wc-msg-btn .glyphicon{color:inherit;font-size:15px}.wc-msg-badge{display:none}.wc-msg-badge.has-unread{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--wc-color-primary);color:#fff;font-size:10px;font-weight:700}.wc-logout-btn{display:inline-flex;align-items:center;font-size:12px;color:var(--wc-color-text-dim);padding:5px 10px;border:1px solid var(--wc-color-border);border-radius:6px;text-decoration:none;transition:background var(--wc-transition-fast),color var(--wc-transition-fast),border-color var(--wc-transition-fast);white-space:nowrap}.wc-logout-btn:hover{background:var(--wc-color-surface2);color:var(--wc-color-text-primary);border-color:var(--wc-color-text-muted)}.wc-avatar-trigger{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:7px;cursor:pointer;user-select:none;transition:background var(--wc-transition-fast);position:relative}.wc-avatar-trigger:hover{background:var(--wc-color-surface2)}.wc-avatar{width:30px;height:30px;border-radius:50%;background:var(--wc-color-surface2);object-fit:cover;flex-shrink:0;border:none}.wc-avatar-placeholder{width:30px;height:30px;border-radius:50%;background:var(--wc-color-surface3);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--wc-color-text-dim);flex-shrink:0}.wc-username{font-size:15px;font-weight:500;color:var(--wc-color-text-muted);white-space:nowrap}.wc-avatar-caret{font-size:24px;color:var(--wc-color-text-dim);margin-left:2px;margin-bottom:3px}.wc-popup{position:absolute;top:calc(100% + 10px);right:0;width:300px;background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:12px;box-shadow:var(--wc-shadow-popup);z-index:300;overflow:hidden;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity var(--wc-transition-normal),transform var(--wc-transition-normal)}.wc-popup.is-open{opacity:1;transform:translateY(0);pointer-events:all}.wc-popup__header{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--wc-color-border)}.wc-popup__avatar-wrap{position:relative;width:48px;height:48px;flex-shrink:0;cursor:pointer}.wc-popup__avatar{width:48px;height:48px;border-radius:50%;background:var(--wc-color-surface2);object-fit:cover;display:block}.wc-popup__avatar-placeholder{width:48px;height:48px;border-radius:50%;background:var(--wc-color-surface3);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--wc-color-text-dim)}.wc-popup__avatar-overlay{position:absolute;inset:0;border-radius:50%;background:#00000080;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity var(--wc-transition-fast);font-size:16px}.wc-popup__avatar-wrap:hover .wc-popup__avatar-overlay{opacity:1}#wc-avatar-input{display:none}.wc-popup__name{font-size:14px;font-weight:600;color:var(--wc-color-text-primary)}.wc-popup__username{font-size:12px;color:var(--wc-color-text-dim);margin-top:2px}.wc-popup__links{padding:6px}.wc-popup__link{display:block;padding:7px 10px;border-radius:6px;font-size:13px;color:var(--wc-color-text-muted);text-decoration:none;transition:background var(--wc-transition-fast),color var(--wc-transition-fast)}.wc-popup__link:hover{background:var(--wc-color-surface2);color:var(--wc-color-text-primary);text-decoration:none}.wc-popup__divider{height:1px;background:var(--wc-color-border);margin:4px 0}.wc-popup__section{padding:10px 14px 14px;border-top:1px solid var(--wc-color-border)}.wc-popup__section-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--wc-color-text-dim);margin-bottom:10px}.wc-popup__row{display:flex;flex-direction:column;gap:10px;margin-bottom:10px}.wc-popup__row:last-child{margin-bottom:0}.wc-popup__row-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--wc-color-text-dim);margin-bottom:5px}.wc-segment{display:flex;gap:5px}.wc-segment-btn{flex:1;padding:5px 4px;border:1px solid var(--wc-color-border);border-radius:6px;background:var(--wc-color-surface2);color:var(--wc-color-text-muted);font-size:11.5px;font-family:inherit;cursor:pointer;transition:background var(--wc-transition-fast),border-color var(--wc-transition-fast),color var(--wc-transition-fast);text-align:center}.wc-segment-btn:hover{background:var(--wc-color-surface3);color:var(--wc-color-text-primary)}.wc-segment-btn.is-active{border-color:var(--wc-color-primary);color:var(--wc-color-primary-light);background:var(--wc-color-primary-ghost)}.wc-swatches{display:flex;gap:7px;flex-wrap:wrap}.wc-swatch{width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform .12s,border-color .12s;flex-shrink:0}.wc-swatch:hover{transform:scale(1.15)}.wc-swatch.is-active{border-color:var(--wc-color-text-primary);transform:scale(1.1)}.wc-dashboard-body{max-width:var(--wc-content-max-width);margin:0 auto;padding:28px 24px;display:grid;grid-template-columns:1fr var(--wc-sidebar-width);gap:30px;align-items:start}@media (max-width: 960px){.wc-dashboard-body{grid-template-columns:1fr}.wc-sidebar{display:none}}.wc-sidebar{display:flex;flex-direction:column;gap:12px;position:sticky;top:calc(var(--wc-header-height) + 16px)}.wc-card-dash{background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:10px;overflow:hidden}.wc-card-dash__head{padding:9px 14px;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--wc-color-text-muted);border-bottom:1px solid var(--wc-color-border);background:#8080800a}.wc-card-dash__body{padding:6px}.wc-card-dash__empty{padding:10px;font-size:12px;color:var(--wc-color-text-dim)}.wc-item{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;transition:background var(--wc-transition-fast)}.wc-item:hover{background:var(--wc-color-surface2)}.wc-item a{display:flex;align-items:center;justify-content:space-between;width:100%;color:var(--wc-color-text-dim);text-decoration:none;font-size:13px;transition:color var(--wc-transition-fast)}.wc-item a:hover{text-decoration:none;color:var(--wc-color-text-primary)}.wc-item__content{display:flex;flex-direction:column;line-height:1.4;word-break:break-all}.wc-item__title{font-size:12.5px}.wc-item__title.is-bold{color:var(--wc-color-text-primary);font-weight:600}.wc-item__sub{font-size:10px;color:var(--wc-color-text-dim);margin-top:2px}.wc-item__info{font-size:11px;color:var(--wc-color-text-muted);margin-left:auto;flex-shrink:0}.wc-item__info.is-accent{color:var(--wc-color-primary-light);font-weight:600}.wc-item__dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}.wc-item__dot.is-unread{background:var(--wc-color-primary)}.wc-item__dot.is-read{background:var(--wc-color-border)}.wc-see-all{display:block;text-align:right;padding:4px 10px 8px;font-size:11px;color:var(--wc-color-primary-light);text-decoration:none;transition:color var(--wc-transition-fast)}.wc-see-all:hover{color:var(--wc-color-text-primary)}.wc-dashboard-main{display:flex;flex-direction:column;gap:24px}.wc-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.wc-section-title{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--wc-color-text-muted)}.wc-schedule-wrap{background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:12px;overflow:hidden}.wc-schedule-head{display:flex;align-items:center;padding:11px 18px;border-bottom:1px solid var(--wc-color-border);gap:12px;flex-wrap:wrap}.wc-schedule-title{font-size:13px;font-weight:600;color:var(--wc-color-text-primary);flex:1;white-space:nowrap}.wc-schedule-filter{display:flex;gap:6px;align-items:center}.wc-schedule-filter label{font-size:11px;color:var(--wc-color-text-dim);white-space:nowrap}.wc-schedule-filter select{background:var(--wc-color-surface2);border:1px solid var(--wc-color-border);color:var(--wc-color-text-primary);border-radius:6px;padding:4px 8px;font-size:12px;font-family:inherit;cursor:pointer;transition:border-color var(--wc-transition-fast)}.wc-schedule-filter select:hover{border-color:var(--wc-color-text-muted)}.wc-schedule-filter select:focus{outline:none;border-color:var(--wc-color-primary)}.wc-schedule-filter-sep{font-size:12px;color:var(--wc-color-text-dim)}.wc-timetable{display:grid}.wc-timetable.no-sat{grid-template-columns:68px repeat(5,1fr)}.wc-timetable.has-sat{grid-template-columns:68px repeat(6,1fr)}.wc-tt-hcell{padding:9px 4px;text-align:center;font-size:11px;font-weight:600;color:var(--wc-color-text-muted);border-bottom:1px solid var(--wc-color-border);background:#80808008}.wc-tt-hcell.is-today{color:var(--wc-color-primary-light);background:var(--wc-today-col)}.wc-tt-hcell.is-corner{background:transparent}.wc-tt-cell{height:76px;padding:6px 5px;border-bottom:1px solid rgba(128,128,128,.15);border-right:1px solid rgba(128,128,128,.1);overflow:hidden}.wc-tt-row--last .wc-tt-cell{border-bottom:none}.wc-tt-cell.is-time-lbl{display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;font-weight:500;color:var(--wc-color-text-muted);background:#80808005;border-right:1px solid var(--wc-color-border)!important;line-height:1.3;padding:4px 2px}.wc-tt-cell.is-today{background:var(--wc-today-col)}.wc-tt-cell.is-last-col{border-right:none}.wc-chip{display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:5px 7px;background:rgba(var(--wc-color-primary-rgb),.1);border:1px solid rgba(var(--wc-color-primary-rgb),.22);border-radius:8px;font-size:12px;line-height:1.35;overflow:hidden;transition:background var(--wc-transition-fast),border-color var(--wc-transition-fast)}.wc-chip:hover{background:rgba(var(--wc-color-primary-rgb),.18);border-color:rgba(var(--wc-color-primary-rgb),.42)}.wc-chip__link{height:100%;text-decoration:none;display:block}.wc-chip__title{color:var(--wc-chip-text);overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical;word-break:break-all}.wc-chip.has-deadline{border-left:3px solid var(--wc-color-deadline)}.wc-chip.has-deadline:hover{border-left-color:var(--wc-color-deadline)}.wc-chip__badge{display:inline-flex;align-items:center;gap:2px;margin-top:3px;font-size:10px;font-weight:700;color:var(--wc-color-deadline);letter-spacing:.02em;flex-shrink:0;white-space:nowrap}.wc-add-bar{display:flex;justify-content:flex-end;padding:11px 16px;border-top:1px solid var(--wc-color-border)}.wc-add-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;background:var(--wc-color-surface2);border:1px solid var(--wc-color-border);border-radius:7px;color:var(--wc-color-text-muted);font-size:12px;font-weight:500;cursor:pointer;text-decoration:none;transition:background var(--wc-transition-fast),border-color var(--wc-transition-fast),color var(--wc-transition-fast);font-family:inherit}.wc-add-btn:hover{border-color:var(--wc-color-primary);color:var(--wc-color-primary-light);background:var(--wc-color-primary-ghost)}.wc-other-courses{display:flex;flex-direction:column;gap:10px}.wc-course-search{width:100%;background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:8px;padding:9px 14px;color:var(--wc-color-text-primary);font-size:13px;font-family:inherit;transition:border-color var(--wc-transition-fast)}.wc-course-search::placeholder{color:var(--wc-color-text-muted)}.wc-course-search:focus{outline:none;border-color:var(--wc-color-primary)}.wc-course-group{background:var(--wc-color-surface);border:1px solid var(--wc-color-border);border-radius:10px;overflow:hidden}.wc-course-group__title{padding:9px 16px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--wc-color-text-muted);border-bottom:1px solid var(--wc-color-border);background:#80808008}.wc-course-list{padding:5px}.wc-footer{text-align:center;padding:20px 24px;font-size:11px;color:var(--wc-color-text-dim);border-top:1px solid var(--wc-color-border);margin-top:4px}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:var(--wc-color-bg)}::-webkit-scrollbar-thumb{background:var(--wc-color-border);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:var(--wc-color-text-dim)}@media (prefers-reduced-motion: reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}} ');


System.register("./__entry.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
	'use strict';
	return {
		setters: [null],
		execute: (function () {



		})
	};
}));

System.register("./__monkey.entry-DzYmScNf.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      exports({
        h: hideLoadingScreen,
        r: replaceBody,
        s: setPageTitle
      });

      const scriptRel = function detectScriptRel() {
        const relList = typeof document !== "undefined" && document.createElement("link").relList;
        return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
      }();
      const assetsURL = function(dep) {
        return "/" + dep;
      };
      const seen = {};
      const __vitePreload = exports("_", function preload(baseModule, deps, importerUrl) {
        let promise = Promise.resolve();
        if (deps && deps.length > 0) {
          document.getElementsByTagName("link");
          const cspNonceMeta = document.querySelector(
            "meta[property=csp-nonce]"
          );
          const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
          promise = Promise.allSettled(
            deps.map((dep) => {
              dep = assetsURL(dep);
              if (dep in seen) return;
              seen[dep] = true;
              const isCss = dep.endsWith(".css");
              const cssSelector = isCss ? '[rel="stylesheet"]' : "";
              if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
                return;
              }
              const link = document.createElement("link");
              link.rel = isCss ? "stylesheet" : scriptRel;
              if (!isCss) {
                link.as = "script";
              }
              link.crossOrigin = "";
              link.href = dep;
              if (cspNonce) {
                link.setAttribute("nonce", cspNonce);
              }
              document.head.appendChild(link);
              if (isCss) {
                return new Promise((res, rej) => {
                  link.addEventListener("load", res);
                  link.addEventListener(
                    "error",
                    () => rej(new Error(`Unable to preload CSS for ${dep}`))
                  );
                });
              }
            })
          );
        }
        function handlePreloadError(err) {
          const e = new Event("vite:preloadError", {
            cancelable: true
          });
          e.payload = err;
          window.dispatchEvent(e);
          if (!e.defaultPrevented) {
            throw err;
          }
        }
        return promise.then((res) => {
          for (const item of res || []) {
            if (item.status !== "rejected") continue;
            handlePreloadError(item.reason);
          }
          return baseModule().catch(handlePreloadError);
        });
      });
      const LOADING_ID = "wc-loading";
      function showLoadingScreen() {
        if (document.getElementById(LOADING_ID)) return;
        const style = document.createElement("style");
        style.textContent = `
    #${LOADING_ID} {
      position: fixed; inset: 0; z-index: 99999;
      background: #fff; display: flex; align-items: center;
      justify-content: center; flex-direction: column; gap: 16px;
      font-family: system-ui, sans-serif;
      transition: opacity 300ms ease;
    }
    #${LOADING_ID}.is-hidden { opacity: 0; pointer-events: none; }
    .wc-spinner-raw {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: #2563eb;
      border-radius: 50%; animation: _wc_spin 0.7s linear infinite;
    }
    @keyframes _wc_spin { to { transform: rotate(360deg); } }
    .wc-loading-label { font-size: 13px; color: #94a3b8; letter-spacing: 0.05em; }
  `;
        const overlay = document.createElement("div");
        overlay.id = LOADING_ID;
        overlay.innerHTML = `
    <div class="wc-spinner-raw" aria-hidden="true"></div>
    <span class="wc-loading-label">読み込み中…</span>
  `;
        const bodyHideStyle = document.createElement("style");
        bodyHideStyle.id = "wc-body-hide";
        bodyHideStyle.textContent = "body { visibility: hidden !important; }";
        const insertIntoDoc = () => {
          document.documentElement.appendChild(style);
          document.documentElement.appendChild(bodyHideStyle);
          document.documentElement.appendChild(overlay);
        };
        if (document.documentElement) {
          insertIntoDoc();
        } else {
          document.addEventListener("readystatechange", () => insertIntoDoc(), { once: true });
        }
      }
      function hideLoadingScreen() {
        const overlay = document.getElementById(LOADING_ID);
        const bodyHideStyle = document.getElementById("wc-body-hide");
        bodyHideStyle?.remove();
        if (!overlay) return;
        overlay.classList.add("is-hidden");
        overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
      }
      function replaceBody(html) {
        if (!document.body) {
          document.addEventListener("DOMContentLoaded", () => replaceBody(html), { once: true });
          return;
        }
        document.body.innerHTML = "";
        document.body.className = "";
        document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
          link.disabled = true;
        });
        document.querySelectorAll("head style").forEach((s) => {
          if (!s.textContent?.includes("wc-") && !s.id?.startsWith("wc-")) {
            s.remove();
          }
        });
        document.body.insertAdjacentHTML("beforeend", html);
      }
      function setPageTitle(title) {
        document.title = `${title} — WebClass`;
      }
      showLoadingScreen();
      const route = () => {
        const path = location.pathname;
        const search = location.search;
        if (path === "/" || path === "/webclass/login.php") {
          __vitePreload(() => module.import('./auth-DEFWLL-4-CEh4gy-p.js'), void 0 ).then((m) => m.initAuthPage());
          return;
        }
        if (path.includes("/show_frame.php")) {
          __vitePreload(() => module.import('./common-DxC4SDJI-Bs4Vm2W8.js'), void 0 ).then((m) => m.initContentsCommon());
          return;
        }
        if (path.includes("/txtbk_frame.php")) {
          __vitePreload(() => module.import('./viewer-BRGhRuzX-Dgjfy2LY.js'), void 0 ).then((m) => m.initViewerPage());
          return;
        }
        if (path.includes("/forum_frame.php")) {
          __vitePreload(() => module.import('./forum-Bwo7b7wD-BgpD5Pum.js'), void 0 ).then((m) => m.initForumPage());
          return;
        }
        if (path.includes("/qstn_frame.php") || path.includes("/reslt_frame.php")) {
          __vitePreload(() => module.import('./exam-CcNB22k2-BQhvWnO8.js'), void 0 ).then((m) => m.initExamPage());
          return;
        }
        if (path.includes("/course.php/")) {
          if (path.endsWith("/my-reports") || path.includes("/my-reports?")) {
            __vitePreload(() => module.import('./report-BM3g-qNG-CgSF0CY8.js'), void 0 ).then((m) => m.initReportPage());
            return;
          }
          if (path.endsWith("/attendance") || path.includes("/attendance?")) {
            __vitePreload(() => module.import('./attendance-BUx3Yucz-DDzqohkN.js'), void 0 ).then((m) => m.initAttendancePage());
            return;
          }
          if (path.endsWith("/scores") || path.includes("/area-score") || path.includes("/scores?")) {
            __vitePreload(() => module.import('./scores-DS7WxCB0-W9pV5Yu3.js'), void 0 ).then((m) => m.initScoresPage());
            return;
          }
          if (path.endsWith("/info") || path.includes("/info?") || path.includes("/access-log")) {
            __vitePreload(() => module.import('./info-B-oUKla4-D11cT-Qj.js'), void 0 ).then((m) => m.initInfoPage());
            return;
          }
          __vitePreload(() => module.import('./timeline-CW3hXqmF-y1_XgGvg.js'), void 0 ).then((m) => m.initTimelinePage());
          return;
        }
        if (path.includes("/courses/")) {
          __vitePreload(() => module.import('./courses-gvk99O10-DiZy2IGD.js'), void 0 ).then((m) => m.initCoursesPage());
          return;
        }
        if (path.includes("/eportfolio.php/showcases/")) {
          __vitePreload(() => module.import('./eportfolio-5Lgn_7Sp-DTNe9iVq.js'), void 0 ).then((m) => m.initEportfolioPage());
          return;
        }
        if (path.includes("/ip_mods.php/plugin/survey/")) {
          __vitePreload(() => module.import('./survey-CqpeJN2l-C_Z4w992.js'), void 0 ).then((m) => m.initSurveyPage());
          return;
        }
        if (path.includes("/user.php/")) {
          __vitePreload(() => module.import('./userConfig-B__hoi4z-BG8FC6Qu.js'), void 0 ).then((m) => m.initUserConfigPage());
          return;
        }
        if (path.includes("/informations.php") || path.includes("/msg_editor.php")) {
          hideLoadingScreen();
          return;
        }
        const isTopPage = path === "/webclass" || path === "/webclass/" || path.endsWith("/index.php");
        const isAcsParam = search.includes("acs_=");
        if (isTopPage || isAcsParam) {
          __vitePreload(() => module.import('./dashboard-BECIvPvu-C5yMtNRi.js'), void 0 ).then((m) => m.initDashboardPage());
          return;
        }
        hideLoadingScreen();
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", route);
      } else {
        route();
      }

    })
  };
}));

System.register("./auth-DEFWLL-4-CEh4gy-p.js", ['./__monkey.entry-DzYmScNf.js', './settings-De-yasn8-CAm56mZd.js'], (function (exports, module) {
  'use strict';
  var replaceBody, setPageTitle, hideLoadingScreen, applyTheme;
  return {
    setters: [module => {
      replaceBody = module.r;
      setPageTitle = module.s;
      hideLoadingScreen = module.h;
    }, module => {
      applyTheme = module.applyTheme;
    }],
    execute: (function () {

      exports("initAuthPage", initAuthPage);

      function initAuthPage() {
        applyTheme();
        const path = location.pathname;
        if (path === "/") {
          location.replace("/webclass/login.php");
          return;
        }
        const html = buildLoginHTML();
        replaceBody(html);
        setPageTitle("ログイン");
        hideLoadingScreen();
      }
      function buildLoginHTML() {
        const origForm = document.querySelector("form");
        const action = origForm?.action ?? "/webclass/login.php";
        const method = origForm?.method ?? "post";
        const hiddens = Array.from(
          document.querySelectorAll('input[type="hidden"]')
        ).map((el) => `<input type="hidden" name="${el.name}" value="${el.value}">`).join("\n");
        return `
    <div class="wc-app">
      <main class="wc-auth-page">
        <div class="wc-auth-card wc-card">
          <div class="wc-card__body">
            <h1 class="wc-auth-title">WebClass</h1>
            <p class="wc-auth-subtitle">宮崎大学 学習管理システム</p>
            <form action="${action}" method="${method}" class="wc-auth-form">
              ${hiddens}
              <div class="wc-form-group">
                <label class="wc-form-label" for="wc-login-id">ユーザーID</label>
                <input type="text" id="wc-login-id" name="user_id"
                       class="wc-input" autocomplete="username"
                       required placeholder="学籍番号・教職員番号">
              </div>
              <div class="wc-form-group">
                <label class="wc-form-label" for="wc-login-pw">パスワード</label>
                <input type="password" id="wc-login-pw" name="password"
                       class="wc-input" autocomplete="current-password"
                       required placeholder="パスワード">
              </div>
              <button type="submit" class="wc-btn wc-btn--primary" style="width:100%;">
                ログイン
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  `;
      }

    })
  };
}));

System.register("./common-DxC4SDJI-Bs4Vm2W8.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initContentsCommon", initContentsCommon);

      function initContentsCommon() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./viewer-BRGhRuzX-Dgjfy2LY.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initViewerPage", initViewerPage);

      function initViewerPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./forum-Bwo7b7wD-BgpD5Pum.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initForumPage", initForumPage);

      function initForumPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./exam-CcNB22k2-BQhvWnO8.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initExamPage", initExamPage);

      function initExamPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./report-BM3g-qNG-CgSF0CY8.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initReportPage", initReportPage);

      function initReportPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./attendance-BUx3Yucz-DDzqohkN.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initAttendancePage", initAttendancePage);

      function initAttendancePage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./scores-DS7WxCB0-W9pV5Yu3.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initScoresPage", initScoresPage);

      function initScoresPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./info-B-oUKla4-D11cT-Qj.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initInfoPage", initInfoPage);

      function initInfoPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./timeline-CW3hXqmF-y1_XgGvg.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initTimelinePage", initTimelinePage);

      function initTimelinePage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./courses-gvk99O10-DiZy2IGD.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initCoursesPage", initCoursesPage);

      function initCoursesPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./eportfolio-5Lgn_7Sp-DTNe9iVq.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initEportfolioPage", initEportfolioPage);

      function initEportfolioPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./survey-CqpeJN2l-C_Z4w992.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initSurveyPage", initSurveyPage);

      function initSurveyPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./userConfig-B__hoi4z-BG8FC6Qu.js", ['./__monkey.entry-DzYmScNf.js'], (function (exports, module) {
  'use strict';
  var hideLoadingScreen;
  return {
    setters: [module => {
      hideLoadingScreen = module.h;
    }],
    execute: (function () {

      exports("initUserConfigPage", initUserConfigPage);

      function initUserConfigPage() {
        hideLoadingScreen();
      }

    })
  };
}));

System.register("./dashboard-BECIvPvu-C5yMtNRi.js", ['./__monkey.entry-DzYmScNf.js', './settings-De-yasn8-CAm56mZd.js'], (function (exports, module) {
  'use strict';
  var replaceBody, setPageTitle, hideLoadingScreen, __vitePreload, applyTheme, getSetting, setSetting, THEME_PRESETS;
  return {
    setters: [module => {
      replaceBody = module.r;
      setPageTitle = module.s;
      hideLoadingScreen = module.h;
      __vitePreload = module._;
    }, module => {
      applyTheme = module.applyTheme;
      getSetting = module.getSetting;
      setSetting = module.setSetting;
      THEME_PRESETS = module.THEME_PRESETS;
    }],
    execute: (function () {

      exports("initDashboardPage", initDashboardPage);

      function escAttr$1(s) {
        return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      }
      function escHtml$1(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      function buildAvatarSmall(src) {
        if (src) {
          return `<img class="wc-avatar" id="wc-avatar-img" src="${escAttr$1(src)}" alt="">`;
        }
        return `<div class="wc-avatar-placeholder" id="wc-avatar-img">👤</div>`;
      }
      function buildAvatarLarge(src) {
        const inner = src ? `<img class="wc-popup__avatar" id="wc-popup-avatar-img" src="${escAttr$1(src)}" alt="">` : `<div class="wc-popup__avatar-placeholder" id="wc-popup-avatar-img">👤</div>`;
        return `
    <div class="wc-popup__avatar-wrap" id="wc-popup-avatar-wrap" title="クリックしてアバター画像を変更">
      ${inner}
      <div class="wc-popup__avatar-overlay">📷</div>
      <input type="file" id="wc-avatar-input" accept="image/*">
    </div>
  `;
      }
      function buildSegmentControl(options, dataAttr) {
        return `
    <div class="wc-segment">
      ${options.map(
    (o) => `<button class="wc-segment-btn" data-${dataAttr}="${escAttr$1(o.value)}">${escHtml$1(o.label)}</button>`
  ).join("")}
    </div>
  `;
      }
      function buildSwatchGroup(presets) {
        return `
    <div class="wc-swatches">
      ${presets.map((p) => `
        <div class="wc-swatch"
             data-preset="${escAttr$1(p.name)}"
             title="${escHtml$1(p.name)}"
             style="background:${escAttr$1(p.accent)};">
        </div>
      `).join("")}
    </div>
  `;
      }
      function buildTopbar(options) {
        const {
          userName,
          avatarSrc,
          navLinks,
          logoutHref,
          messageHref,
          messageOnClick,
          messageIconHTML,
          unreadCount,
          accountMenuLinks
        } = options;
        const currentPath = typeof location !== "undefined" ? location.pathname : "";
        const hasUnread = unreadCount > 0;
        const onClickAttr = messageOnClick ? `onclick="${escAttr$1(messageOnClick)}"` : "";
        const navHtml = navLinks.map((l) => {
          let linkPath = "";
          try {
            linkPath = new URL(l.href, location.origin).pathname.split("?")[0];
          } catch {
          }
          const isActive = linkPath && currentPath.startsWith(linkPath);
          return `
      <a class="wc-topbar__nav-link${isActive ? " is-active" : ""}"
         href="${escAttr$1(l.href)}"
         ${isActive ? 'aria-current="page"' : ""}>
        ${escHtml$1(l.text)}
      </a>
    `;
        }).join("");
        const accountLinksHtml = accountMenuLinks.map((l) => `
    <a class="wc-popup__link"
       href="${escAttr$1(l.href)}"
       ${l.target ? `target="${escAttr$1(l.target)}"` : ""}
       ${l.onClick ? `onclick="${escAttr$1(l.onClick)}"` : ""}>
      ${escHtml$1(l.text)}
    </a>
  `).join("");
        return `
    <header class="wc-topbar" role="banner">

      <!-- ロゴ -->
      <a class="wc-topbar__logo" href="/webclass/" aria-label="WebClass ホームへ戻る">
        <span>Web</span>Class
      </a>

      <!-- デスクトップナビ -->
      <nav class="wc-topbar__nav" aria-label="メインナビゲーション">
        ${navHtml}
      </nav>

      <!-- 右側アクション群 -->
      <div class="wc-topbar__actions">

        <!-- メッセージアイコン（未読バッジ付き） -->
        <a class="wc-msg-btn"
           href="${escAttr$1(messageHref)}"
           ${onClickAttr}
           target="msgeditor"
           title="メッセージ">
          ${messageIconHTML}
          <span class="wc-msg-badge${hasUnread ? " has-unread" : ""}">
            ${hasUnread ? unreadCount : ""}
          </span>
        </a>

        <!-- アバター + ユーザー名（クリックでポップアップ） -->
        <div class="wc-avatar-trigger" id="wc-avatar-trigger" role="button"
             aria-haspopup="true" aria-expanded="false"
             aria-label="${escAttr$1(userName)} のメニューを開く">
          ${buildAvatarSmall(avatarSrc)}
          <span class="wc-username">${escHtml$1(userName)}</span>
          <span class="wc-avatar-caret" aria-hidden="true">▾</span>

          <!-- アカウントポップアップ -->
          <div class="wc-popup" id="wc-account-popup" role="dialog" aria-label="アカウントメニュー">
            <div class="wc-popup__header">
              ${buildAvatarLarge(avatarSrc)}
              <div>
                <div class="wc-popup__name">${escHtml$1(userName)}</div>
                <div class="wc-popup__username">${escHtml$1(userName)}</div>
              </div>
            </div>

            <div class="wc-popup__links">${accountLinksHtml}</div>
            <div class="wc-popup__divider"></div>
            <a class="wc-logout-btn" href="${escAttr$1(logoutHref)}">ログアウト</a> 

            <!-- テーマ設定 -->
            <div class="wc-popup__section">
              <div class="wc-popup__section-label">テーマ設定</div>
              <div class="wc-popup__row">
                <div class="wc-popup__row-label">外観</div>
                ${buildSegmentControl(
    [
      { value: "light", label: "ライト" },
      { value: "dark", label: "ダーク" },
      { value: "system", label: "システム" }
    ],
    "mode"
  )}
              </div>
              <div class="wc-popup__row">
                <div class="wc-popup__row-label">テーマカラー</div>
                ${buildSwatchGroup(THEME_PRESETS)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  `;
      }
      function initTopbar() {
        _bindAccountPopup();
        _bindAvatarUpload();
        _bindModeButtons();
        _bindSwatches();
        _bindSystemColorScheme();
        _syncActiveStates();
      }
      function _bindAccountPopup() {
        const trigger = document.getElementById("wc-avatar-trigger");
        const popup = document.getElementById("wc-account-popup");
        if (!trigger || !popup) return;
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          const isOpen = popup.classList.contains("is-open");
          popup.classList.toggle("is-open", !isOpen);
          trigger.setAttribute("aria-expanded", String(!isOpen));
        });
        document.addEventListener("click", () => {
          popup.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        });
        popup.addEventListener("click", (e) => e.stopPropagation());
      }
      function _bindAvatarUpload() {
        const wrap = document.getElementById("wc-popup-avatar-wrap");
        const input = document.getElementById("wc-avatar-input");
        if (!wrap || !input) return;
        wrap.addEventListener("click", (e) => {
          e.stopPropagation();
          input.click();
        });
        input.addEventListener("change", () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result;
            if (!dataUrl) return;
            setSetting("avatarDataUrl", dataUrl);
            const smallEl = document.getElementById("wc-avatar-img");
            if (smallEl) {
              const newImg = document.createElement("img");
              newImg.className = "wc-avatar";
              newImg.id = "wc-avatar-img";
              newImg.src = dataUrl;
              smallEl.replaceWith(newImg);
            }
            const largeEl = document.getElementById("wc-popup-avatar-img");
            if (largeEl) {
              const newImg = document.createElement("img");
              newImg.className = "wc-popup__avatar";
              newImg.id = "wc-popup-avatar-img";
              newImg.src = dataUrl;
              largeEl.replaceWith(newImg);
            }
          };
          reader.readAsDataURL(file);
        });
      }
      function _bindModeButtons() {
        document.querySelectorAll(".wc-segment-btn[data-mode]").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const mode = btn.dataset["mode"];
            setSetting("colorMode", mode);
            applyTheme();
            _syncActiveStates();
          });
        });
      }
      function _bindSwatches() {
        document.querySelectorAll(".wc-swatch").forEach((swatch) => {
          swatch.addEventListener("click", (e) => {
            e.stopPropagation();
            const preset = swatch.dataset["preset"];
            if (!preset) return;
            setSetting("themePreset", preset);
            applyTheme();
            _syncActiveStates();
          });
        });
      }
      function _bindSystemColorScheme() {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
          const mode = getSetting("colorMode");
          if (mode === "system") applyTheme();
        });
      }
      function _syncActiveStates() {
        const currentMode = getSetting("colorMode");
        const currentPreset = getSetting("themePreset");
        document.querySelectorAll(".wc-segment-btn[data-mode]").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset["mode"] === currentMode);
        });
        document.querySelectorAll(".wc-swatch").forEach((swatch) => {
          swatch.classList.toggle("is-active", swatch.dataset["preset"] === currentPreset);
        });
      }
      function fetchDashboardInfo() {
        const origin = window.location.origin;
        const usernameEl = document.querySelector("body > header > nav > div:nth-child(1) > ul > li:nth-child(2) > a > span");
        const username = usernameEl ? usernameEl.textContent?.trim() || "" : "";
        const totalMsgEl = document.getElementById("js-unread-message-count");
        const unreadMessagesCount = totalMsgEl ? parseInt(totalMsgEl.textContent || "0", 10) || 0 : 0;
        const scheduledCourses = [];
        const table = document.querySelector(".schedule-table");
        if (table) {
          const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() || "");
          const dayMap = {
            "月曜日": "mon",
            "火曜日": "tue",
            "水曜日": "wed",
            "木曜日": "thu",
            "金曜日": "fri",
            "土曜日": "sat"
          };
          const rows = table.querySelectorAll("tbody tr");
          rows.forEach((row) => {
            const orderAttr = row.getAttribute("data-class_order");
            let period = "unknown";
            if (orderAttr) {
              period = `p${orderAttr}`;
            }
            const cells = row.querySelectorAll("td:not(.schedule-table-class_order)");
            cells.forEach((cell, index) => {
              if (cell.classList.contains("blank") || cell.classList.contains("active-blank")) return;
              const linkEl = cell.querySelector("a");
              if (!linkEl) return;
              const rawUrl = linkEl.getAttribute("href") || "";
              const url = rawUrl.startsWith("http") ? rawUrl : `${origin}${rawUrl}`;
              const rawText = linkEl.textContent?.replace(/^»\s*/, "").trim() || "";
              const match = rawText.match(/(.*?)\s*\[([^:]+):(.*?)\]/);
              let title = rawText;
              let id = "";
              let term = "";
              if (match) {
                title = match[1].trim();
                id = match[2].trim();
                term = match[3].trim();
              } else {
                const idMatch = url.match(/course\.php\/([^\/-]+)/);
                id = idMatch ? idMatch[1] : "";
              }
              let unreadMessages = 0;
              const msgEl = cell.querySelector(".course-new-message");
              if (msgEl && msgEl.textContent) {
                const msgMatch = msgEl.textContent.match(/\((\d+)\)/);
                if (msgMatch) unreadMessages = parseInt(msgMatch[1], 10);
              }
              const hasUrgentTask = !!cell.querySelector(".course-contents-info");
              const dayText = headers[index + 1] || "";
              const day = dayMap[dayText] || "unknown";
              scheduledCourses.push({
                id,
                title,
                term,
                url,
                schedule: { day, period },
                unreadMessages,
                hasUrgentTask
              });
            });
          });
        }
        const otherCourses = [];
        const levelOneLiList = document.querySelectorAll(".courseLevelOne > li");
        levelOneLiList.forEach((l1Li) => {
          const l1TitleEl = l1Li.querySelector(".courseTree-levelTitle");
          if (!l1TitleEl) return;
          const l1Name = l1TitleEl.textContent?.trim() || "";
          const l2NodeList = [];
          const l2LiList = l1Li.querySelectorAll(".courseLevelTwo > li");
          l2LiList.forEach((l2Li) => {
            const l2TitleEl = l2Li.querySelector(".title h5");
            if (!l2TitleEl) return;
            const l2Name = l2TitleEl.textContent?.trim() || "";
            const courseItems = [];
            const courseLiList = l2Li.querySelectorAll(".courseList > li");
            courseLiList.forEach((cLi) => {
              const linkEl = cLi.querySelector(".course-title a");
              if (!linkEl) return;
              const rawUrl = linkEl.getAttribute("href") || "";
              const url = rawUrl.startsWith("http") ? rawUrl : `${origin}${rawUrl}`;
              const rawText = linkEl.textContent?.replace(/^»\s*/, "").trim() || "";
              const idMatch = url.match(/course\.php\/([^\/]+)/);
              const id = idMatch ? idMatch[1].split("-")[0] : "";
              let unreadMessages = 0;
              const msgEl = cLi.querySelector(".course-new-message");
              if (msgEl && msgEl.textContent) {
                const msgMatch = msgEl.textContent.match(/\((\d+)\)/);
                if (msgMatch) unreadMessages = parseInt(msgMatch[1], 10);
              }
              const hasUrgentTask = !!cLi.querySelector(".course-contents-info");
              courseItems.push({
                id,
                title: rawText,
                url,
                unreadMessages,
                hasUrgentTask
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
        const systemAnnouncements = [];
        const infoRows = document.querySelectorAll("#NewestInformations .info-list li:not(.head)");
        infoRows.forEach((row) => {
          const linkEl = row.querySelector("a.title");
          if (!linkEl) return;
          const rawUrl = linkEl.getAttribute("href") || "";
          const url = rawUrl.startsWith("http") ? rawUrl : `${origin}${rawUrl}`;
          const title = linkEl.getAttribute("title") || linkEl.textContent?.trim() || "";
          const id = url.match(/id=(\d+)/)?.[1] || "";
          const isNew = linkEl.classList.contains("mark1");
          systemAnnouncements.push({ id, title, url, isNew });
        });
        const allParsedBlocks = [];
        const sideBlocks = document.querySelectorAll(".side-block");
        sideBlocks.forEach((block) => {
          const titleEl = block.querySelector(".side-block-title");
          if (!titleEl) return;
          const blockTitle = titleEl.textContent?.trim() || "";
          const links = [];
          const linkElements = block.querySelectorAll("a");
          linkElements.forEach((link) => {
            const rawUrl = link.getAttribute("href") || "";
            if (!rawUrl || rawUrl === "#") return;
            const url = rawUrl.startsWith("http") ? rawUrl : `${origin}${rawUrl}`;
            const title = link.textContent?.replace(/^»\s*/, "").trim() || "";
            if (title) {
              links.push({ title, url });
            }
          });
          allParsedBlocks.push({
            title: blockTitle,
            links
          });
        });
        const sideMenus = [];
        allParsedBlocks.forEach((block) => {
          if (!sideMenus.some((menu) => menu.title === block.title)) {
            sideMenus.push(block);
          }
        });
        let requiredSurveysCount = 0;
        const surveyMenu = sideMenus.find((menu) => menu.title.includes("アンケート"));
        if (surveyMenu) {
          requiredSurveysCount = surveyMenu.links.filter((l) => !l.title.includes("ありません")).length;
        }
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
      function escAttr(s) {
        return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      }
      function escHtml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      function Item({
        hasDot = false,
        dotState = "is-read",
        title,
        isBold = false,
        subText = "",
        infoText = "",
        infoAccent = false,
        href,
        onClick = "",
        titleAttr = "",
        extraClass = "",
        searchKey = ""
      }) {
        const dotHtml = hasDot ? `<span class="wc-item__dot ${dotState}"></span>` : "";
        const subHtml = subText ? `<div class="wc-item__sub">${escHtml(subText)}</div>` : "";
        const displayInfoText = infoText === "[未分類]" ? "---" : infoText;
        const infoHtml = displayInfoText ? `<span class="wc-item__info${infoAccent ? " is-accent" : ""}">${escHtml(displayInfoText)}</span>` : "";
        const titleAttrs = titleAttr ? `title="${escAttr(titleAttr)}"` : "";
        const searchAttrs = searchKey ? `data-course-name="${escAttr(searchKey)}"` : "";
        const onClickOnDiv = onClick && !onClick.includes("return") ? `onclick="${escAttr(onClick)}"` : "";
        const onClickOnA = onClick && onClick.includes("return") ? `onclick="${escAttr(onClick)}"` : "";
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
            <div class="wc-item__title${isBold ? " is-bold" : ""}">${escHtml(title)}</div>
            ${subHtml}
          </div>
        </div>
        ${infoHtml}
      </a>
    </div>
  `;
      }
      function Card({ title, bodyHtml, footerHtml = "" }) {
        return `
    <div class="wc-card-dash">
      <div class="wc-card-dash__head">${escHtml(title)}</div>
      <div class="wc-card-dash__body">${bodyHtml}</div>
      ${footerHtml}
    </div>
  `;
      }
      function SelectOptions(optionList) {
        return optionList.map(
          (o) => `<option value="${escAttr(o.value)}" ${o.selected ? "selected" : ""}>${escHtml(o.label)}</option>`
        ).join("");
      }
      const DAYS_LONG = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
      const DAYS_SHORT = ["月", "火", "水", "木", "金", "土"];
      function buildScheduleTitle(yearVal, semesterVal) {
        const yearLabel = yearVal === "all" ? "全年度" : `${yearVal}年度`;
        const semLabel = semesterVal === "all" ? "通年" : semesterVal === "1" ? "前期" : semesterVal === "2" ? "後期" : semesterVal;
        return `${yearLabel} ${semLabel}`;
      }
      function buildTimetableSection(data) {
        const { scheduleData, todayDay, yearSelectData, semesterSelectData, addCourseHref } = data;
        const initTitle = buildScheduleTitle(yearSelectData.selected, semesterSelectData.selected);
        const filteredScheduleData = scheduleData.filter((row) => {
          const orderStr = String(row.order).trim();
          return orderStr !== "7" && !orderStr.includes("7限");
        });
        const hasSaturdayCourse = filteredScheduleData.some((row) => row.dayCourses["土曜日"] !== void 0);
        const activeDaysLong = hasSaturdayCourse ? DAYS_LONG : DAYS_LONG.slice(0, 5);
        const activeDaysShort = hasSaturdayCourse ? DAYS_SHORT : DAYS_SHORT.slice(0, 5);
        const headerCells = activeDaysLong.map((d, i) => {
          const isToday = d === todayDay;
          return `
      <div class="wc-tt-hcell${isToday ? " is-today" : ""}">
        ${activeDaysShort[i]}
      </div>
    `;
        }).join("");
        const bodyRows = filteredScheduleData.map((row, rowIdx) => {
          const isLast = rowIdx === filteredScheduleData.length - 1;
          const rowClass = isLast ? " wc-tt-row--last" : "";
          const cells = activeDaysLong.map((d, ci) => {
            const course = row.dayCourses[d];
            const isToday = d === todayDay;
            const isLastCol = ci === activeDaysLong.length - 1;
            const cellClasses = [
              "wc-tt-cell",
              isToday ? "is-today" : "",
              isLastCol ? "is-last-col" : ""
            ].filter(Boolean).join(" ");
            if (!course) return `<div class="${cellClasses}"></div>`;
            const cleanedTitle = course.title.replace(/\([^)]*\)|（[^）]*）/g, "  ");
            return `
        <div class="${cellClasses}">
          <div class="wc-chip${course.hasDeadline ? " has-deadline" : ""}">
            <a class="wc-chip__link"
               href="${escAttr(course.href)}"
               title="${escAttr(course.fullTitle)}">
              <span class="wc-chip__title">${escHtml(cleanedTitle)}</span>
              ${course.hasDeadline ? '<span class="wc-chip__badge">⚠ 締切間近</span>' : ""}
            </a>
          </div>
        </div>
      `;
          }).join("");
          return `
      <div class="wc-tt-cell is-time-lbl${rowClass}">${escHtml(row.order)}</div>
      ${cells}
    `;
        }).join("");
        const gridClass = hasSaturdayCourse ? "has-sat" : "no-sat";
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
      function buildOtherCoursesSection(data) {
        const { otherCourses } = data;
        const groupsHtml = otherCourses.map((group) => {
          const displayTitle = group.title === "[未分類]" ? "---" : group.title;
          return `
      <div class="wc-course-group" data-group>
        <div class="wc-course-group__title">${escHtml(displayTitle)}</div>
        <div class="wc-course-list">
          ${group.courses.map((c) => Item({
      title: c.title,
      infoText: c.info,
      href: c.href,
      searchKey: c.title
    })).join("")}
        </div>
      </div>
    `;
        }).join("");
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
      function buildSidebarSection(data) {
        const { surveyData, sideLinks, notices } = data;
        const surveyCardHtml = surveyData.length > 0 ? Card({
          title: "アンケート",
          bodyHtml: surveyData.map((s) => Item({
            hasDot: true,
            dotState: s.count > 0 ? "is-unread" : "is-read",
            title: s.label,
            isBold: s.count > 0,
            infoText: s.count > 0 ? `${s.count}件` : "なし",
            infoAccent: s.count > 0,
            href: s.href
          })).join("")
        }) : "";
        const sideLinkCardsHtml = sideLinks.map((group) => Card({
          title: group.title,
          bodyHtml: group.links.length === 0 ? `<p class="wc-card-dash__empty">リンクはありません</p>` : group.links.map((link) => Item({
            title: link.text,
            href: link.href,
            onClick: link.onClick,
            extraClass: link.className.includes("showInIframeButton") ? "showInIframeButton" : ""
          })).join("")
        })).join("");
        const noticeCardHtml = Card({
          title: "管理者からのお知らせ",
          bodyHtml: notices.length === 0 ? `<p class="wc-card-dash__empty">お知らせはありません</p>` : notices.map((n) => Item({
            hasDot: true,
            dotState: n.unread ? "is-unread" : "is-read",
            title: n.title.length > 36 ? n.title.slice(0, 36) + "…" : n.title,
            isBold: n.unread,
            subText: n.meta,
            href: n.href,
            onClick: `return openMessage('${n.href}')`,
            titleAttr: n.title
          })).join(""),
          footerHtml: `
      <a class="wc-see-all"
         href="/webclass/informations.php"
         target="msgeditor"
         onclick="return openMessage('/webclass/informations.php')">
        すべて見る →
      </a>
    `
        });
        return `
    <aside class="wc-sidebar">
      ${surveyCardHtml}
      ${sideLinkCardsHtml}
      ${noticeCardHtml}
    </aside>
  `;
      }
      async function initDashboardPage() {
        applyTheme();
        const info = fetchDashboardInfo();
        const savedAvatarSrc = getSetting("avatarDataUrl");
        const wcAvatarSrc = document.querySelector(".navbar-nav .dropdown > a > img")?.src ?? "";
        const avatarSrc = savedAvatarSrc || wcAvatarSrc;
        const navLinks = [];
        document.querySelectorAll("#menu > ul:nth-child(2) > li > a").forEach((a) => {
          const text = a.textContent?.trim().replace(/\s+/g, " ") ?? "";
          if (text && !text.includes("ログアウト")) {
            navLinks.push({ text, href: a.href });
          }
        });
        const logoutHref = document.querySelector('a[href*="logout.php"]')?.href ?? "/webclass/logout.php";
        const msgAnchor = document.querySelector("#notification-dropdown-icon");
        const messageHref = msgAnchor?.href ?? "/webclass/msg_editor.php?msgappmode=inbox";
        const messageOnClick = msgAnchor?.getAttribute("onclick") ?? "";
        const messageIconHTML = document.querySelector("#notification-dropdown-icon .glyphicon-envelope")?.outerHTML ?? '<span class="glyphicon glyphicon-envelope" aria-hidden="true"></span>';
        const pcMenu = document.querySelector(".navbar-nav.navbar-right.hidden-xs .dropdown-menu");
        const anyMenu = document.querySelector(".navbar-nav .dropdown-menu");
        const menu = pcMenu || anyMenu;
        const accountMenuLinks = [];
        menu?.querySelectorAll("li a").forEach((a) => {
          const text = a.textContent?.trim() ?? "";
          if (text) {
            accountMenuLinks.push({
              text,
              href: a.href,
              onClick: a.getAttribute("onclick") ?? "",
              target: a.target ?? ""
            });
          }
        });
        const yearSel = document.querySelector('select[name="year"]');
        const yearSelectData = yearSel ? { options: Array.from(yearSel.options).map((o) => ({ value: o.value, label: o.text.trim(), selected: o.selected })), selected: yearSel.value } : { options: [{ value: "2026", label: "2026", selected: true }], selected: "2026" };
        const semSel = document.querySelector('select[name="semester"]');
        const semesterSelectData = semSel ? { options: Array.from(semSel.options).map((o) => ({ value: o.value, label: o.text.trim(), selected: o.selected })), selected: semSel.value } : { options: [{ value: "1", label: "前期", selected: true }], selected: "1" };
        const scheduleData = [];
        const dayRevMap = { mon: "月曜日", tue: "火曜日", wed: "水曜日", thu: "木曜日", fri: "金曜日", sat: "土曜日" };
        for (let i = 1; i <= 7; i++) {
          const dayCourses = {};
          const periodKey = `p${i}`;
          const matches = info.scheduledCourses.filter((c) => c.schedule.period === periodKey);
          matches.forEach((c) => {
            const longDay = dayRevMap[c.schedule.day];
            if (longDay) {
              dayCourses[longDay] = {
                title: c.title,
                fullTitle: c.title,
                // 必要に応じて詳細表示用として共通利用
                href: c.url,
                hasDeadline: c.hasUrgentTask
              };
            }
          });
          scheduleData.push({ order: `${i}限`, dayCourses });
        }
        const TODAY_DAY_MAP = { 0: "日曜日", 1: "月曜日", 2: "火曜日", 3: "水曜日", 4: "木曜日", 5: "金曜日", 6: "土曜日" };
        const todayDay = TODAY_DAY_MAP[(/* @__PURE__ */ new Date()).getDay()];
        const otherCourses = info.otherCourses.map((g) => ({
          title: g.categoryName,
          courses: g.children.flatMap(
            (child) => child.courses.map((c) => ({
              title: c.title,
              href: c.url,
              info: child.categoryName
              // 親カテゴリの階層名を情報ラベルとして渡す
            }))
          )
        }));
        const notices = info.portalContents.systemAnnouncements.map((a) => ({
          title: a.title,
          href: a.url,
          meta: "",
          // API側で不要としたメタ文字列は空文字で安全にフォールバック
          unread: a.isNew
        }));
        const surveyData = [];
        const surveyBlock = info.portalContents.sideMenus.find((m) => m.title.includes("アンケート"));
        if (surveyBlock) {
          surveyBlock.links.forEach((l) => {
            const match = l.title.match(/\((\d+)\)/);
            const count = match ? parseInt(match[1], 10) : 0;
            const label = l.title.replace(/\s*\(\d+\)/, "").trim();
            surveyData.push({ label, count, href: l.url });
          });
        }
        const sideLinks = info.portalContents.sideMenus.filter((m) => !m.title.includes("アンケート")).map((m) => ({
          title: m.title,
          links: m.links.map((l) => ({
            text: l.title,
            href: l.url,
            onClick: l.url.includes("javascript:") ? l.url : "",
            // インラインJS用
            className: l.title.includes("ウィンドウ") ? "showInIframeButton" : ""
          }))
        }));
        const addCourseHref = document.querySelector('a[href*="/courses/"]')?.href ?? "/webclass/index.php/courses/";
        const topbarOptions = {
          userName: info.userProfile.username,
          avatarSrc,
          navLinks,
          logoutHref,
          messageHref,
          messageOnClick,
          messageIconHTML,
          unreadCount: info.userProfile.unreadMessagesCount,
          accountMenuLinks
        };
        const viewData = {
          scheduleData,
          todayDay,
          yearSelectData,
          semesterSelectData,
          addCourseHref,
          otherCourses,
          notices,
          surveyData,
          sideLinks
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
        setPageTitle("ホーム");
        initTopbar();
        bindCourseSearch();
        bindSemesterSelects();
        ensureOpenMessageFn();
        hideLoadingScreen();
        if (info.userProfile.username) {
          const cached = getSetting("cachedDisplayName");
          if (cached !== info.userProfile.username) {
            const { setSetting: setSetting2 } = await __vitePreload(async () => {
              const { setSetting: setSetting3 } = await module.import('./settings-De-yasn8-CAm56mZd.js');
              return { setSetting: setSetting3 };
            }, void 0 );
            setSetting2("cachedDisplayName", info.userProfile.username);
          }
        }
      }
      function bindCourseSearch() {
        const input = document.getElementById("wc-course-search");
        if (!input) return;
        input.addEventListener("input", function() {
          const query = this.value.trim().toLowerCase();
          document.querySelectorAll("[data-group]").forEach((group) => {
            let anyVisible = false;
            group.querySelectorAll(".wc-item").forEach((item) => {
              const a = item.querySelector("a");
              const name = (a?.dataset["courseName"] ?? "").toLowerCase();
              const visible = !query || name.includes(query);
              item.style.display = visible ? "" : "none";
              if (visible) anyVisible = true;
            });
            group.style.display = anyVisible ? "" : "none";
          });
        });
      }
      function bindSemesterSelects() {
        const yearSel = document.getElementById("wc-year-select");
        const semesterSel = document.getElementById("wc-semester-select");
        const titleEl = document.getElementById("wc-schedule-title");
        if (!yearSel || !semesterSel) return;
        const origYearSel = document.querySelector('select[name="year"]');
        const origSemesterSel = document.querySelector('select[name="semester"]');
        const origForm = document.querySelector('form[name="condition"]');
        const updateTitle = () => {
          if (titleEl) titleEl.textContent = buildScheduleTitle(yearSel.value, semesterSel.value);
        };
        yearSel.addEventListener("change", () => {
          updateTitle();
          if (origYearSel && origForm) {
            origYearSel.value = yearSel.value;
            origForm.submit();
          }
        });
        semesterSel.addEventListener("change", () => {
          updateTitle();
          if (origSemesterSel && origForm) {
            origSemesterSel.value = semesterSel.value;
            origForm.submit();
          }
        });
      }
      function ensureOpenMessageFn() {
        const win = window;
        if (typeof win.openMessage !== "undefined") return;
        win.openMessage = function(url) {
          const w = window.open(
            url,
            "msgeditor",
            "toolbar=no,location=no,directories=no,status=yes,menubar=no,scrollbars=yes,resizable=yes,width=820,height=650"
          );
          if (w !== null) w.focus();
          return false;
        };
      }

    })
  };
}));

System.register("./settings-De-yasn8-CAm56mZd.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      exports({
        applyTheme: applyTheme,
        getActiveTheme: getActiveTheme,
        getSetting: getSetting,
        setSetting: setSetting
      });

      const NS = "wc_modern_";
      const THEME_PRESETS = exports("THEME_PRESETS", [
        { name: "インディゴ", accent: "#6366F1", accentLight: "#818CF8", accentDark: "#4a4ccc", accentRgb: "99,102,241", deadline: "#EF4444" },
        { name: "バイオレット", accent: "#8B5CF6", accentLight: "#A78BFA", accentDark: "#6d45d4", accentRgb: "139,92,246", deadline: "#EF4444" },
        { name: "スカイ", accent: "#0EA5E9", accentLight: "#38BDF8", accentDark: "#0284c7", accentRgb: "14,165,233", deadline: "#EF4444" },
        { name: "ティール", accent: "#14B8A6", accentLight: "#2DD4BF", accentDark: "#0f8a7c", accentRgb: "20,184,166", deadline: "#EF4444" },
        { name: "エメラルド", accent: "#10B981", accentLight: "#34D399", accentDark: "#059669", accentRgb: "16,185,129", deadline: "#EF4444" },
        { name: "ローズ", accent: "#F43F5E", accentLight: "#FB7185", accentDark: "#e11d48", accentRgb: "244,63,94", deadline: "#7C3AED" },
        { name: "アンバー", accent: "#F59E0B", accentLight: "#FCD34D", accentDark: "#d97706", accentRgb: "245,158,11", deadline: "#DC2626" }
      ]);
      const DEFAULT_SETTINGS = {
        themePreset: "インディゴ",
        colorMode: "system",
        avatarDataUrl: "",
        widgetVisibility: { announcements: true, messages: true, tasks: true },
        cachedDisplayName: ""
      };
      function getSetting(key) {
        if (typeof GM_getValue !== "undefined") {
          return GM_getValue(NS + key, DEFAULT_SETTINGS[key]);
        } else {
          const localVal = localStorage.getItem(NS + key);
          if (localVal === null) return DEFAULT_SETTINGS[key];
          try {
            return JSON.parse(localVal);
          } catch {
            return DEFAULT_SETTINGS[key];
          }
        }
      }
      function setSetting(key, value) {
        if (typeof GM_setValue !== "undefined") {
          GM_setValue(NS + key, value);
        } else {
          localStorage.setItem(NS + key, JSON.stringify(value));
        }
      }
      function getActiveTheme() {
        const name = getSetting("themePreset");
        return THEME_PRESETS.find((p) => p.name === name) ?? THEME_PRESETS[0];
      }
      function applyTheme() {
        const theme = getActiveTheme();
        const mode = getSetting("colorMode");
        const root = document.documentElement;
        root.style.setProperty("--wc-color-primary", theme.accent);
        root.style.setProperty("--wc-color-primary-light", theme.accentLight);
        root.style.setProperty("--wc-color-primary-dark", theme.accentDark);
        root.style.setProperty("--wc-color-primary-rgb", theme.accentRgb);
        root.style.setProperty("--wc-color-deadline", theme.deadline);
        root.style.setProperty("--wc-color-primary-ghost", `rgba(${theme.accentRgb}, 0.1)`);
        root.classList.remove("wc-theme-light", "wc-theme-dark", "wc-theme-system");
        root.classList.add(`wc-theme-${mode}`);
      }

    })
  };
}));

System.import("./__entry.js", "./");