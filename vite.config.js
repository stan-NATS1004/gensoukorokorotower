import { defineConfig } from 'vite';

// WordPressへiframe埋め込みするため相対パスでビルドする
export default defineConfig({
  base: './',
  server: {
    host: true,
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
  },
});
