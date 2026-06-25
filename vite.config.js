import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'WebClass Modern UI',
        namespace: 'https://github.com/suomiin3927/webclass_modern_ui_userscript',
        version: '0.1.0',
        description: '宮崎大学WebClassのUIをモダンに再構築するUserscript',
        author: 'Aiki Watanabe / git:suomiin3927',
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
        // Userscript配布・更新先URL（公開後に設定）
        // updateURL: 'https://raw.githubusercontent.com/your-username/webclass-modern-ui/main/dist/webclass_modern_ui.user.js',
        // downloadURL: 'https://raw.githubusercontent.com/your-username/webclass-modern-ui/main/dist/webclass_modern_ui.user.js',
      },
      build: {
        fileName: 'webclass_modern_ui.user.js',
        externalGlobals: {},
        minifyCss: true,
      },
    }),
  ],
  build: {
    // ソースマップはデバッグ時のみ有効にする（本番時はfalse）
    sourcemap: false,
    target: 'es2020',
    minify: false,
  },
});
