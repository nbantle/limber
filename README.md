# Limber

A guided stretching, calisthenics, free-weights, and resistance-band web app for iPhone. Build custom routines, then follow them step by step with timers, voice cues, animated technique demos, and muscle maps.

- **Use it:** open the site in Safari → Share → **Add to Home Screen**.
- **Data:** stored on the device (localStorage). Use Settings → Export backup to move it.
- **Explore:** 40 ready-made routines on the home screen (`js/routines.js`) with search, filters and sort; add any to My routines.
- **Appearance:** Settings → Auto (follows the phone), Light, or Dark.
- **Reminders:** Settings → Workout reminders adds a repeating event with an alert to the phone's calendar.
- **Share a routine:** open a routine → ••• → Share routine. The link carries the whole routine.

## Code
Plain HTML/CSS/JS, no build step.
- `js/exercises.js` — exercise library (cues, muscles, animation keyframes) and starter routines; more in `js/exercises-more.js`, `js/exercises-weights.js` and `js/exercises-bands.js`
- `js/figure.js` — animated figure renderer (poses are absolute joint angles; see header comment)
- `js/muscles.js` — front/back muscle map
- `js/app.js` — routines, editor, library, player, history, settings
- `dev/figures.html` — grid of every exercise animation for tuning poses (`python3 dev/serve.py .`)
- `dev/frames.html` — each animation sampled at several moments, to catch glitches between keyframes
