import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import basicSsl from '@vitejs/plugin-basic-ssl'; // 1. インポートを追加

export default defineConfig({
  plugins: [
    basicSsl(), // 2. プラグインの配列の先頭に追加
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Better WebClass',
        namespace: 'https://github.com/suomiin3927/webclass_modern_ui_userscript',
        version: '0.1.0',
        description: '宮崎大学WebClassのUIをモダンに再構築するUserscript',
        author: 'suomiin3927 (Aiki Watanabe)',
        license: 'MIT',

        match: [
          'https://webclass.eden.miyazaki-u.ac.jp/',
          'https://webclass.eden.miyazaki-u.ac.jp/webclass',
          'https://webclass.eden.miyazaki-u.ac.jp/webclass/*',
        ],

        'run-at': 'document-start',
        
        grant: [
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_listValues',
          'GM_setClipboard',
          'GM_addStyle',
          'GM_xmlhttpRequest',
          'unsafeWindow',
        ],
        connect: [
          'webclass.eden.miyazaki-u.ac.jp',
        ],
      },
      build: {
        fileName: 'webclass_modern_ui.user.js',
        externalGlobals: {},
        minifyCss: true,
      },
    }),
  ],
  build: {
    sourcemap: false,
    target: 'es2020',
    minify: false,
  },
  // 3. ローカル開発サーバー用の HTTPS 設定を追加
  server: {
    https: true,
    host: '127.0.0.1',
    port: 5173,
  },
});