// Writes the app icons: node dev/icon/render.mjs  (variant B: charcoal figure on the lime→green gradient)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { iconSVG } from './icon.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [size, file] of [[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<body style="margin:0">${iconSVG('b', size)}</body>`);
  await p.screenshot({ path: `icons/${file}` });
  await p.close();
}
await b.close();
