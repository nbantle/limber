// Renders the Limber home-screen icon. Usage: node icon.mjs <variant> <size> <out.png>
export function iconSVG(v = 'a', size = 512) {
  const bg = v === 'c'
    ? `<rect width="512" height="512" fill="#1f242c"/>`
    : `<rect width="512" height="512" fill="url(#g)"/><rect width="512" height="512" fill="url(#gl)"/>`;
  const fig = v === 'b' ? '#1f242c' : v === 'c' ? 'url(#gu)' : '#ffffff';
  const shadow = v === 'a' ? 'filter="url(#sh)"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8dc48"/><stop offset="1" stop-color="#68e180"/></linearGradient>
    <linearGradient id="gu" gradientUnits="userSpaceOnUse" x1="150" y1="80" x2="360" y2="430"><stop offset="0" stop-color="#a8dc48"/><stop offset="1" stop-color="#68e180"/></linearGradient>
    <radialGradient id="gl" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".6" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1f242c" flood-opacity=".22"/></filter>
  </defs>
  ${bg}
  <g ${shadow} fill="${fig}" stroke="${fig}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="256" cy="118" r="38" stroke="none"/>
    <path d="M228 196 L162 92 M284 196 L350 92" stroke-width="36" fill="none"/>
    <rect x="221" y="172" width="70" height="150" rx="35" stroke="none"/>
    <path d="M240 300 L186 424 M272 300 L326 424" stroke-width="38" fill="none"/>
  </g>
</svg>`;
}
