import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { iconSVG } from './icon.mjs';
const out = process.argv[2];
const tile = (v, label) => `<div class="t"><div class="ic">${iconSVG(v, 120)}</div><span>${label}</span></div>`;
const html = `<body style="margin:0;font-family:-apple-system,Helvetica;background:linear-gradient(#8a8f8a,#b9ad94);padding:30px;display:flex;gap:40px">
<style>.t{display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff;font-size:22px}.ic{width:120px;height:120px;border-radius:27px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.2)}.ic svg{display:block}</style>
${tile('a', 'A · white')}${tile('b', 'B · charcoal')}${tile('c', 'C · dark')}</body>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 560, height: 210 }, deviceScaleFactor: 2 });
await p.setContent(html); await p.screenshot({ path: out }); await b.close();
