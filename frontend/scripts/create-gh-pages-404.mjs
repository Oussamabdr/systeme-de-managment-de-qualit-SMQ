import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distIndex = resolve(process.cwd(), 'dist/index.html');
const dist404 = resolve(process.cwd(), 'dist/404.html');

if (!existsSync(distIndex)) {
  throw new Error('dist/index.html not found. Run vite build before generating 404 fallback.');
}

copyFileSync(distIndex, dist404);
console.log('Created dist/404.html for GitHub Pages SPA fallback.');
