// The Limber palette, for code that paints SVG directly (CSS has the same 10 colors as --c-* in styles.css).
export const C = {
  charcoal: '#1f242c', white: '#ffffff', lime: '#a8dc48', green: '#68e180', slate: '#6b7480',
  mist: '#eef1f5', ocean: '#1a8fc2', coral: '#ee6427', violet: '#7356ec', amber: '#c98410',
};

// Tint or shade between two palette colors: t = 0 gives a, 1 gives b.
export function mix(a, b, t) {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
