# Working on Limber

## Every release
- Bump `CACHE` in `sw.js` (and add any new file to `ASSETS`) so phones pick up the update.
- If the change is something people would notice, add a "What's new" note: a new entry at the top of
  `RELEASES` in `js/whatsnew.js` with the next `id`, the month, and one line per change
  (`[icon, title, text]`, plain words, no jargon). Several small tweaks can share one note;
  behind-the-scenes fixes don't need one. People see each note once, after the update loads.

## Colors
Use only the 10 palette colors (`--c-*` in `styles.css`, `js/palette.js`). The one exception is
`--danger` red for delete and warnings.
