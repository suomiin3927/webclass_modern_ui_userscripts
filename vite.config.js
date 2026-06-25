import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'WebClass Modern UI',
        namespace: 'https://github.com/your-username/webclass-modern-ui',
        version: '0.1.0',
        description: 'WebClassのUIをモダンに完全再構築するUserscript',
        author: 'Your Name',
        license: 'MIT',
        // --- 対象URL ---
        // すべてのWebClassページに適用（ポータル、コース内、各フレームを網羅）
        // @noframes は使わない：教材フレームにも適用が必要なため
        match: [
          'https://webclass.eden.miyazaki-u.ac.jp/',
          'https://webclass.eden.miyazaki-u.ac.jp/webclass',
          'https://webclass.eden.miyazaki-u.ac.jp/webclass/*',
        ],
        // --- 実行タイミング ---
        // チラつきゼロのためDOMが構築される前の最速タイミングで起動
        'run-at': 'document-start',
        // --- 権限 ---
        grant: [
          // Userscript専用ストレージ（localStorageより安全）
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_listValues',
          // 設定エクスポート用クリップボード操作
          'GM_setClipboard',
          // 外部CSSやフォント読み込みへの許可（Content-Security-Policy回避）
          'GM_addStyle',
          // バックグラウンドfetch（お知らせ・メッセージのポータル統合用）
          'GM_xmlhttpRequest',
          // ページ情報取得のためのウィンドウ操作
          'unsafeWindow',
        ],
        // GM_xmlhttpRequest でfetchを許可するドメイン
        connect: [
          'webclass.eden.miyazaki-u.ac.jp',
        ],
        // Userscript配布・更新先URL（公開後に設定）
        // updateURL: 'https://raw.githubusercontent.com/your-username/webclass-modern-ui/main/dist/webclass_modern_ui.user.js',
        // downloadURL: 'https://raw.githubusercontent.com/your-username/webclass-modern-ui/main/dist/webclass_modern_ui.user.js',
      },
      build: {
        fileName: 'webclass_modern_ui.user.js',
        externalGlobals: {},
        // すべてのCSS・テンプレートをJSにインライン化して1ファイル出力
        minifyCss: true,
      },
    }),
  ],
  build: {
    // ソースマップはデバッグ時のみ有効にする（本番時はfalse）
    sourcemap: false,
    target: 'es2020',
    minify: false, // Userscriptは可読性を残すためminifyしない
  },
});
