// Resistance-band exercises (merged into EXERCISES in exercises.js).
// band: default resistance level, 0 = extra light … 4 = extra heavy (see BAND_LEVELS in app.js).

const STAND = { t: 0, aL: [178, 178], aR: [182, 182] };
const STAND_F = { t: 0, aL: [192, 186], aR: [168, 174], lL: [183, 180], lR: [177, 180] };
const HIPS_F = { aL: [215, 135], aR: [145, 225] }; // hands on hips, front view
const FEET = { kind: 'band', to: 'feet' };

export const BANDS = [
  // ───────────── Upper body ─────────────
  {
    id: 'band-pull-apart', name: 'Band Pull-Apart', type: 'bands', mode: 'reps', reps: 15, sets: 3, band: 1, equipment: 'Resistance band',
    primary: ['upperBack', 'shoulders'], secondary: ['traps'],
    cues: ['Hold the band in front of your chest with straight arms, hands shoulder-width apart.', 'Pull the band apart by moving your hands out to the sides.', 'Squeeze your shoulder blades together at the end.', 'Return slowly — keep tension on the band.'],
    anim: { view: 'front', gear: { kind: 'band', to: 'hands' }, dur: 1, frames: [
      { ...STAND_F, kua: 0.35, kfa: 0.35, aL: [252, 262], aR: [108, 98] },
      { ...STAND_F, aL: [270, 270], aR: [90, 90] },
    ] },
  },
  {
    id: 'band-row', name: 'Band Row', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 2, equipment: 'Resistance band & door anchor',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'shoulders'],
    cues: ['Anchor the band at chest height and step back until it is taut.', 'Stand tall with arms straight out in front.', 'Pull your elbows back past your ribs, squeezing your shoulder blades.', 'Let your arms straighten slowly.'],
    anim: { gear: { kind: 'band', to: 'anchor', at: 'shoulderR', dx: 34, dy: 2 }, props: [{ type: 'wall', at: 'shoulderR', dx: 35 }], arrow: 'handR', dur: 1.1, frames: [
      { t: 0, aL: [88, 88], aR: [90, 90] },
      { t: 0, aL: [214, 88], aR: [216, 90] },
    ] },
  },
  {
    id: 'band-chest-press', name: 'Band Chest Press', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 2, equipment: 'Resistance band & door anchor',
    primary: ['chest', 'triceps'], secondary: ['shoulders'],
    cues: ['Anchor the band behind you at chest height and face away from it.', 'Start with your hands by your chest, elbows back.', 'Press your hands forward until your arms are straight.', 'Control the band as your hands come back.'],
    anim: { gear: { kind: 'band', to: 'anchor', at: 'shoulderR', dx: -24, dy: 2, behind: true }, props: [{ type: 'wall', at: 'shoulderR', dx: -25 }], arrow: 'handR', dur: 1.1, frames: [
      { t: 4, aL: [226, 88], aR: [228, 90], lL: [190, 186], lR: [168, 176] },
      { t: 4, aL: [88, 88], aR: [90, 90], lL: [190, 186], lR: [168, 176] },
    ] },
  },
  {
    id: 'band-curl', name: 'Band Biceps Curl', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 2, equipment: 'Resistance band',
    primary: ['biceps'], secondary: ['forearms'],
    cues: ['Stand on the middle of the band, holding an end in each hand.', 'Keep your elbows pinned at your sides.', 'Curl your hands up toward your shoulders.', 'Lower slowly against the band.'],
    anim: { gear: FEET, arrow: 'handR', dur: 1.1, frames: [
      { ...STAND, aL: [178, 176], aR: [180, 178] },
      { ...STAND, aL: [176, 24], aR: [178, 22] },
    ] },
  },
  {
    id: 'band-overhead-press', name: 'Band Overhead Press', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 1, equipment: 'Resistance band',
    primary: ['shoulders'], secondary: ['triceps'],
    cues: ['Stand on the band with feet shoulder-width apart.', 'Bring your hands up to shoulder height, palms forward.', 'Press straight overhead until your arms are straight.', 'Lower back to your shoulders with control.'],
    anim: { view: 'front', gear: FEET, dur: 1.1, frames: [
      { ...STAND_F, aL: [262, 2], aR: [98, 358] },
      { ...STAND_F, aL: [346, 356], aR: [14, 4] },
    ] },
  },
  {
    id: 'band-lateral-raise', name: 'Band Lateral Raise', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 0, equipment: 'Resistance band',
    primary: ['shoulders'], secondary: ['traps'],
    cues: ['Stand on the band and hold an end in each hand at your sides.', 'With a slight bend in your elbows, raise your arms out to the sides.', 'Stop at shoulder height.', 'Lower slowly.'],
    anim: { view: 'front', gear: FEET, dur: 1.1, frames: [
      { ...STAND_F, aL: [196, 192], aR: [164, 168] },
      { ...STAND_F, aL: [270, 276], aR: [90, 84] },
    ] },
  },
  {
    id: 'band-face-pull', name: 'Band Face Pull', type: 'bands', mode: 'reps', reps: 15, sets: 3, band: 1, equipment: 'Resistance band & door anchor',
    primary: ['shoulders', 'upperBack'], secondary: ['traps'],
    cues: ['Anchor the band at head height and hold an end in each hand.', 'Step back until the band is taut, arms straight.', 'Pull your hands toward your face, elbows high and wide.', 'Pause, then let your arms straighten slowly.'],
    anim: { gear: { kind: 'band', to: 'anchor', at: 'head', dx: 32, dy: 2 }, props: [{ type: 'wall', at: 'head', dx: 33 }], arrow: 'handR', dur: 1.1, frames: [
      { t: 0, aL: [78, 80], aR: [80, 82] },
      { t: 0, kua: 0.6, aL: [268, 70], aR: [270, 72] },
    ] },
  },
  {
    id: 'band-pushdown', name: 'Band Triceps Pushdown', type: 'bands', mode: 'reps', reps: 15, sets: 3, band: 2, equipment: 'Resistance band & door anchor',
    primary: ['triceps'], secondary: [],
    cues: ['Anchor the band high and face it, holding an end in each hand.', 'Tuck your elbows at your sides with hands at chest height.', 'Push your hands down until your arms are straight.', 'Let them come back up without moving your elbows.'],
    anim: { gear: { kind: 'band', to: 'anchor', at: 'head', dx: 16, dy: -14 }, props: [{ type: 'wall', at: 'head', dx: 17 }], arrow: 'handR', dur: 1, frames: [
      { t: 6, aL: [176, 30], aR: [178, 32] },
      { t: 6, aL: [176, 172], aR: [178, 174] },
    ] },
  },

  // ───────────── Lower body ─────────────
  {
    id: 'band-squat', name: 'Band Squat', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 2, equipment: 'Resistance band',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    cues: ['Stand on the band, feet shoulder-width apart.', 'Hold the ends at your shoulders.', 'Sit your hips back and down, chest tall.', 'Drive up through your feet against the band.'],
    anim: { gear: FEET, dur: 1.2, frames: [
      { t: 0, aL: [150, 10], aR: [152, 12] },
      { t: 30, aL: [180, 40], aR: [182, 42], lL: [95, 200, 90], lR: [95, 200, 90] },
    ] },
  },
  {
    id: 'band-deadlift', name: 'Band Deadlift', type: 'bands', mode: 'reps', reps: 12, sets: 3, band: 3, equipment: 'Resistance band',
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack'],
    cues: ['Stand on the band and hold the ends in front of your thighs.', 'Push your hips back with soft knees and a flat back.', 'Stand tall by squeezing your glutes.', 'Lower slowly by hinging again.'],
    anim: { gear: FEET, arrow: 'hip', dur: 1.3, frames: [
      { t: 76, h: 88, aL: [180, 180], aR: [180, 180], lL: [160, 186], lR: [160, 186] },
      { t: 0, aL: [176, 176], aR: [178, 178] },
    ] },
  },
  {
    id: 'band-lateral-walk', name: 'Banded Side Steps', type: 'bands', mode: 'time', duration: 30, sets: 2, band: 1, equipment: 'Loop band',
    primary: ['glutes'], secondary: ['adductors', 'quads'],
    cues: ['Put a loop band just above your knees.', 'Bend your knees slightly and push your hips back.', 'Step sideways, keeping tension on the band.', 'Take the same number of steps each way.'],
    anim: { view: 'front', gear: { kind: 'band', to: 'knees' }, anchor: 'hip', steady: true, dur: 0.6, hold: 0.1, frames: [
      { t: 0, ...HIPS_F, lL: [192, 176], lR: [168, 184] },
      { t: 0, ...HIPS_F, lL: [196, 176], lR: [152, 186] },
      { t: 0, ...HIPS_F, lL: [186, 178], lR: [164, 184] },
    ] },
  },
  {
    id: 'band-glute-bridge', name: 'Banded Glute Bridge', type: 'bands', mode: 'reps', reps: 15, sets: 3, band: 2, equipment: 'Loop band',
    primary: ['glutes', 'hamstrings'], secondary: ['lowerBack'],
    cues: ['Lie on your back with a loop band above your knees, feet flat.', 'Press your knees out gently against the band.', 'Drive through your heels to lift your hips.', 'Squeeze at the top, then lower with control.'],
    anim: { gear: { kind: 'band', to: 'knees' }, arrow: 'hip', dur: 1, frames: [
      { t: 270, h: 270, aL: [97, 99], aR: [97, 99], lL: [45, 150], lR: [45, 150] },
      { t: 246, h: 268, aL: [104, 100], aR: [104, 100], lL: [75, 170], lR: [75, 170] },
    ] },
  },
];
