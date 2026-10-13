// Front/back body diagram with highlightable muscle groups.

function base(dx) {
  const limb = (x1, y1, x2, y2, w) => `<line x1="${x1 + dx}" y1="${y1}" x2="${x2 + dx}" y2="${y2}" stroke-width="${w}"/>`;
  const side = (s) => {
    const X = (x) => (s < 0 ? x : 100 - x);
    return limb(X(28), 38, X(22), 70, 11) + limb(X(22), 70, X(17), 96, 9) +
      `<circle cx="${X(16) + dx}" cy="101" r="4.6"/>` +
      limb(X(41), 104, X(40), 148, 17) + limb(X(40), 148, X(40), 186, 11.5) +
      `<ellipse cx="${X(40) + dx}" cy="192.5" rx="6" ry="3.6"/>`;
  };
  return `<g class="mm-base">
    <circle cx="${50 + dx}" cy="13.5" r="9.5"/>
    <rect x="${44.5 + dx}" y="20" width="11" height="13" rx="3"/>
    <path transform="translate(${dx} 0)" d="M31,34 C40,30 60,30 69,34 L71,46 C69,60 65,72 64,86 L66,104 C60,110 40,110 34,104 L36,86 C35,72 31,60 29,46 Z"/>
    <g stroke-linecap="round">${side(-1)}${side(1)}</g>
  </g>`;
}

// Each muscle group maps to its SVG shapes (left and right sides).
const FRONT = {
  neck: ['<ellipse cx="46.8" cy="27.5" rx="2" ry="5.2" transform="rotate(-14 46.8 27.5)"/>', '<ellipse cx="53.2" cy="27.5" rx="2" ry="5.2" transform="rotate(14 53.2 27.5)"/>'],
  traps: ['<path d="M44,30 L34,35 L44,35.5 Z"/>', '<path d="M56,30 L66,35 L56,35.5 Z"/>'],
  shoulders: ['<ellipse cx="29" cy="41" rx="6.5" ry="7.5"/>', '<ellipse cx="71" cy="41" rx="6.5" ry="7.5"/>'],
  chest: ['<path d="M49.3,37 C44,36 37,37 34,42 C35,50 42,54 49.3,52 Z"/>', '<path d="M50.7,37 C56,36 63,37 66,42 C65,50 58,54 50.7,52 Z"/>'],
  biceps: ['<ellipse cx="25" cy="56" rx="4.4" ry="9" transform="rotate(12 25 56)"/>', '<ellipse cx="75" cy="56" rx="4.4" ry="9" transform="rotate(-12 75 56)"/>'],
  forearms: ['<ellipse cx="19.6" cy="82" rx="3.7" ry="10" transform="rotate(12 19.6 82)"/>', '<ellipse cx="80.4" cy="82" rx="3.7" ry="10" transform="rotate(-12 80.4 82)"/>'],
  abs: ['<rect x="44.2" y="55" width="11.6" height="34" rx="4"/>'],
  obliques: ['<path d="M42.6,56 C37.5,62 36.5,76 39,89 L42.6,89 Z"/>', '<path d="M57.4,56 C62.5,62 63.5,76 61,89 L57.4,89 Z"/>'],
  hipFlexors: ['<ellipse cx="43" cy="99" rx="3" ry="6.5" transform="rotate(-32 43 99)"/>', '<ellipse cx="57" cy="99" rx="3" ry="6.5" transform="rotate(32 57 99)"/>'],
  adductors: ['<ellipse cx="46.6" cy="119" rx="2.8" ry="10.5" transform="rotate(-5 46.6 119)"/>', '<ellipse cx="53.4" cy="119" rx="2.8" ry="10.5" transform="rotate(5 53.4 119)"/>'],
  quads: ['<ellipse cx="39.6" cy="126" rx="6.3" ry="18" transform="rotate(3 39.6 126)"/>', '<ellipse cx="60.4" cy="126" rx="6.3" ry="18" transform="rotate(-3 60.4 126)"/>'],
  calves: ['<ellipse cx="37" cy="165" rx="2.8" ry="10"/>', '<ellipse cx="63" cy="165" rx="2.8" ry="10"/>'],
};

const BACK = {
  neck: ['<rect x="46" y="21" width="8" height="10" rx="3"/>'],
  traps: ['<path d="M50,24 L36,35 L44,38 L50,46 L56,38 L64,35 Z"/>'],
  upperBack: ['<path d="M44,39.5 L50,47.5 L56,39.5 L59,52 L50,60 L41,52 Z"/>'],
  shoulders: ['<ellipse cx="29" cy="41" rx="6.5" ry="7.5"/>', '<ellipse cx="71" cy="41" rx="6.5" ry="7.5"/>'],
  lats: ['<path d="M33.5,46 C31.5,60 36,78 45,88 L46.5,70 L40.5,55 Z"/>', '<path d="M66.5,46 C68.5,60 64,78 55,88 L53.5,70 L59.5,55 Z"/>'],
  triceps: ['<ellipse cx="25" cy="56" rx="4.4" ry="9" transform="rotate(12 25 56)"/>', '<ellipse cx="75" cy="56" rx="4.4" ry="9" transform="rotate(-12 75 56)"/>'],
  forearms: ['<ellipse cx="19.6" cy="82" rx="3.7" ry="10" transform="rotate(12 19.6 82)"/>', '<ellipse cx="80.4" cy="82" rx="3.7" ry="10" transform="rotate(-12 80.4 82)"/>'],
  lowerBack: ['<ellipse cx="46.3" cy="79" rx="3" ry="9.5"/>', '<ellipse cx="53.7" cy="79" rx="3" ry="9.5"/>'],
  glutes: ['<ellipse cx="41.6" cy="100.5" rx="8.4" ry="8"/>', '<ellipse cx="58.4" cy="100.5" rx="8.4" ry="8"/>'],
  adductors: ['<ellipse cx="46.8" cy="119" rx="2.3" ry="9"/>', '<ellipse cx="53.2" cy="119" rx="2.3" ry="9"/>'],
  hamstrings: ['<ellipse cx="39.8" cy="130" rx="6.3" ry="17"/>', '<ellipse cx="60.2" cy="130" rx="6.3" ry="17"/>'],
  calves: ['<ellipse cx="39.8" cy="163" rx="5.3" ry="11"/>', '<ellipse cx="60.2" cy="163" rx="5.3" ry="11"/>'],
};

function layer(map, dx, primary, secondary) {
  let out = `<g transform="translate(${dx} 0)">`;
  for (const [m, shapes] of Object.entries(map)) {
    const cls = primary.has(m) ? 'mm-m pri' : secondary.has(m) ? 'mm-m sec' : 'mm-m';
    out += `<g class="${cls}" data-m="${m}">${shapes.join('')}</g>`;
  }
  return out + '</g>';
}

export function muscleMapSVG(primary = [], secondary = [], { labels = true } = {}) {
  const P = new Set(primary), S = new Set(secondary);
  return `<svg class="musclemap" viewBox="0 0 200 ${labels ? 208 : 199}" role="img" aria-label="Muscles worked">
    ${base(0)}${base(100)}
    ${layer(FRONT, 0, P, S)}${layer(BACK, 100, P, S)}
    ${labels ? '<text x="50" y="206" class="mm-label">FRONT</text><text x="150" y="206" class="mm-label">BACK</text>' : ''}
  </svg>`;
}
