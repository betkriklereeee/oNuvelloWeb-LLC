import { cpSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'server'), { recursive: true });
mkdirSync(join(dist, 'assets'), { recursive: true });
copyFileSync(join(root, 'sites-worker.js'), join(dist, 'server', 'index.js'));
cpSync(join(root, 'assets'), join(dist, 'assets', 'assets'), { recursive: true });
for (const file of ['index.html','about.html','services.html','blog.html','contact.html','faq.html','404.html','robots.txt','sitemap.xml','llms.txt','378cc854f6b4ad9da20c5816606b42e7.txt','favicon.ico','site.webmanifest']) copyFileSync(join(root, file), join(dist, 'assets', file));
cpSync(join(root, 'services'), join(dist, 'assets', 'services'), { recursive: true });
cpSync(join(root, 'blog'), join(dist, 'assets', 'blog'), { recursive: true });
