import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'index.html', 'about.html', 'services.html', 'blog.html', 'contact.html', 'faq.html', '404.html',
  ...readdirSync(join(root, 'blog')).filter(file => file.endsWith('.html')).map(file => `blog/${file}`),
  ...readdirSync(join(root, 'services')).filter(file => file.endsWith('.html') && !file.includes(' 2')).map(file => `services/${file}`)
];
const errors = [];

const resolveLink = href => {
  if (href === '/') return 'index.html';
  const clean = href.split(/[?#]/)[0].replace(/^\//, '').replace(/\/$/, '');
  if (!clean) return 'index.html';
  if (extname(clean)) return clean;
  return `${clean}.html`;
};

for (const file of pages) {
  const html = readFileSync(join(root, file), 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${file}: missing title`);
  if (file !== '404.html' && !/<link rel="canonical"/.test(html)) errors.push(`${file}: missing canonical`);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${file}: expected exactly one h1`);
  if (!['404.html'].includes(file) && !/\(323\) 219-9208/.test(html)) errors.push(`${file}: new phone number missing`);
  if (!html.includes('https://use.typekit.net/wrx5tvq.css')) errors.push(`${file}: Adobe Fonts project missing`);
  if ((html.match(/GTM-KNH8LMBF/g) || []).length !== 2) errors.push(`${file}: expected one GTM script and one noscript fallback`);
  if (!/<body>\s*(?:<!--[^]*?-->)?\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-KNH8LMBF"/.test(html)) errors.push(`${file}: GTM noscript must immediately follow body`);

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${file}: invalid JSON-LD`); }
  }
  if (file !== '404.html' && !html.includes('BreadcrumbList')) errors.push(`${file}: breadcrumb schema missing`);
  if (file.startsWith('services/') && !html.includes('"@type":"Service"')) errors.push(`${file}: service schema missing`);
  if (file.startsWith('blog/') && !html.includes('"@type":"BlogPosting"')) errors.push(`${file}: article schema missing`);

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    const target = resolveLink(href);
    if (!existsSync(join(root, target))) errors.push(`${file}: broken link ${href}`);
  }
}

for (const required of ['robots.txt', 'sitemap.xml', 'llms.txt', '378cc854f6b4ad9da20c5816606b42e7.txt']) {
  if (!existsSync(join(root, required))) errors.push(`${required}: discovery file missing`);
}
const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
for (const agent of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User']) if (!robots.includes(agent)) errors.push(`robots.txt: ${agent} policy missing`);
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
if ((sitemap.match(/<lastmod>2026-08-01<\/lastmod>/g) || []).length !== 14) errors.push('sitemap.xml: expected current lastmod on all 14 URLs');

const production = pages.map(file => readFileSync(join(root, file), 'utf8')).join('\n');
for (const stale of ['909) 312-7101', '+19093127101', 'Orange County', 'Pipedrive', 'pipedriveWebForms', 'nuweb.cloud']) {
  if (production.toLowerCase().includes(stale.toLowerCase())) errors.push(`stale production reference: ${stale}`);
}

const formPages = pages.filter(file => !['404.html'].includes(file));
for (const file of formPages) {
  const html = readFileSync(join(root, file), 'utf8');
  if (!html.includes('https://api.web3forms.com/submit')) errors.push(`${file}: Web3Forms endpoint missing`);
  if (!html.includes('name="access_key"')) errors.push(`${file}: Web3Forms access key missing`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${pages.length} pages, ${formPages.length} forms, local links, JSON-LD, contact details, and stale-reference checks.`);
