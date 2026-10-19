// Knee care: gentle mobility, quad and hip strength, and balance work used in knee (e.g. meniscus) recovery plans.
// Same shape as exercises.js. Depths are kept shallow on purpose — nothing here bends the knee past about 90°.

const STAND = { t: 0, aL: [178, 178], aR: [182, 182] };
const SUPINE = { t: 270, h: 270, aL: [97, 99], aR: [97, 99] }; // lying on the back, arms resting at the sides
const LEG_STRAIGHT = [90, 90, 0]; // lying, leg along the floor, toes up
const LEG_BENT = [45, 150]; // lying, knee up, foot flat
const CHAIR = [{ type: 'chair', at: 'hip' }];

export const KNEE = [
  // ───────────── Daily mobility ─────────────
  {
    id: 'heel-slides', name: 'Heel Slides', type: 'stretch', mode: 'reps', reps: 15, sided: true,
    primary: ['quads', 'hamstrings'], secondary: ['hipFlexors'],
    cues: ['Lie on your back with both legs straight.', 'Slowly slide one heel toward your glutes until you feel a gentle stretch.', 'Pause, then slide it back out until the leg is straight.', 'Keep the heel on the floor the whole time.'],
    anim: { arrow: 'ankleR', dur: 1.6, frames: [
      { ...SUPINE, lL: LEG_STRAIGHT, lR: LEG_STRAIGHT },
      { ...SUPINE, lL: LEG_STRAIGHT, lR: [52, 144, 60] },
    ] },
  },
  {
    id: 'quad-sets', name: 'Quad Sets', type: 'strength', mode: 'reps', reps: 10, sided: true,
    primary: ['quads'], secondary: [],
    cues: ['Lie or sit with your leg straight.', 'Tighten the thigh and press the back of your knee down into the floor.', 'Hold for 5 seconds — your kneecap should pull up slightly.', 'Relax fully, then repeat.'],
    anim: { arrow: 'kneeR', dur: 2.5, hold: 0.6, frames: [
      { ...SUPINE, lL: LEG_STRAIGHT, lR: [86, 95, 5] },
      { ...SUPINE, lL: LEG_STRAIGHT, lR: [90, 90, 345] },
    ] },
  },
  {
    id: 'straight-leg-hang', name: 'Straight-Leg Hang', type: 'stretch', mode: 'time', duration: 120, sided: true,
    primary: ['hamstrings'], secondary: ['calves'],
    cues: ['Sit and rest your heel on a stool or chair, knee unsupported.', 'Let the leg relax so gravity gently straightens the knee.', 'Breathe and stay loose — no forcing.', 'Stop if you feel pinching behind the knee.'],
    anim: { props: [...CHAIR, { type: 'box', at: 'ankleR', dx: 0, dy: 2.6, w: 9 }], anchor: 'hip', dur: 3, frames: [
      { t: -6, aL: [160, 110], aR: [160, 110], lL: [90, 180], lR: [90, 94, 0] },
      { t: -6, aL: [160, 110], aR: [160, 110], lL: [90, 180], lR: [91, 92, 0] },
    ] },
  },
  {
    id: 'ankle-pumps', name: 'Ankle Pumps', type: 'stretch', mode: 'reps', reps: 20,
    primary: ['calves'], secondary: [],
    cues: ['Lie down with your legs straight, ideally raised on a pillow.', 'Point your toes away from you.', 'Then pull them back toward your shins.', 'Keep a steady rhythm — it helps move swelling out of the leg.'],
    anim: { arrow: 'toeR', dur: 0.8, frames: [
      { ...SUPINE, lL: [90, 90, 40], lR: [90, 90, 40] },
      { ...SUPINE, lL: [90, 90, 330], lR: [90, 90, 330] },
    ] },
  },

  // ───────────── Strength ─────────────
  {
    id: 'straight-leg-raise', name: 'Straight-Leg Raise', type: 'strength', mode: 'reps', reps: 10, sided: true,
    primary: ['quads', 'hipFlexors'], secondary: ['abs'],
    cues: ['Lie on your back, one knee bent with the foot flat.', 'Tighten the thigh of the straight leg first.', 'Lift it to the height of the bent knee, keeping it locked straight.', 'Lower slowly.'],
    anim: { arrow: 'ankleR', dur: 1.3, frames: [
      { ...SUPINE, lL: LEG_BENT, lR: LEG_STRAIGHT },
      { ...SUPINE, lL: LEG_BENT, lR: [56, 56, 330] },
    ] },
  },
  {
    id: 'side-lying-leg-raise', name: 'Side-Lying Leg Raise', type: 'strength', mode: 'reps', reps: 12, sided: true,
    primary: ['glutes'], secondary: ['adductors', 'abs'],
    cues: ['Lie on your side, legs straight and stacked, head resting on your arm.', 'Keep your hips stacked — don\'t roll back.', 'Lift the top leg about 12 inches, toes pointing forward.', 'Lower slowly.'],
    anim: { view: 'front', arrow: 'ankleR', dur: 1.3, frames: [
      { t: 270, h: 268, aL: [272, 30], aR: [96, 94], lL: [90, 90, 90], lR: [88, 88, 90] },
      { t: 270, h: 268, aL: [272, 30], aR: [96, 94], lL: [90, 90, 90], lR: [66, 66, 66] },
    ] },
  },
  {
    id: 'wall-sit-shallow', name: 'Shallow Wall Sit', type: 'strength', mode: 'time', duration: 20,
    primary: ['quads'], secondary: ['glutes'],
    cues: ['Lean your back flat against a wall, feet a step out in front.', 'Slide down only until your knees bend about 45° — not to 90°.', 'Keep your knees over your ankles.', 'Hold and breathe.'],
    anim: { props: [{ type: 'wall', at: 'hip', dx: -5.5 }], dur: 2, frames: [
      { t: 0, aL: [176, 180], aR: [176, 180], lL: [138, 186], lR: [138, 186] },
      { t: 0, aL: [177, 180], aR: [177, 180], lL: [139, 186], lR: [139, 186] },
    ] },
  },
  {
    id: 'mini-squat', name: 'Mini Squat', type: 'strength', mode: 'reps', reps: 12,
    primary: ['quads', 'glutes'], secondary: ['calves'],
    cues: ['Stand with feet hip-width, a hand on a counter for balance.', 'Push your hips back and bend to about 45° — a quarter squat.', 'Keep your knees over your toes.', 'Stand back up tall.'],
    anim: { dur: 1.2, frames: [
      { ...STAND, aL: [100, 92], aR: [100, 92] },
      { t: 18, aL: [92, 88], aR: [92, 88], lL: [140, 196, 90], lR: [140, 196, 90] },
    ] },
  },
  {
    id: 'step-up', name: 'Step-Up', type: 'strength', mode: 'reps', reps: 10, sided: true,
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'],
    cues: ['Use a low step, 4 to 6 inches.', 'Place your whole foot on the step and press through the heel to stand up.', 'Bring the other foot up, then step down slowly with control.', 'Lead with the leg you\'re rebuilding.'],
    anim: { anchor: 'ankleR', steady: true, props: [{ type: 'box', at: 'ankleR', dx: 1.5, dy: 2.4, w: 14 }], dur: 1.4, frames: [
      { t: 8, aL: [168, 172], aR: [192, 186], lL: [180, 180], lR: [122, 188] },
      { t: 2, aL: [176, 178], aR: [184, 182], lR: [180, 180], lL: [196, 236, 200] },
    ] },
  },
  {
    id: 'standing-hamstring-curl', name: 'Standing Hamstring Curl', type: 'strength', mode: 'reps', reps: 12, sided: true,
    primary: ['hamstrings'], secondary: ['calves'],
    cues: ['Stand tall with your hands on a wall or counter.', 'Bend one knee and bring your heel up toward your glutes.', 'Keep your thighs side by side.', 'Lower slowly over 3 seconds.'],
    anim: { anchor: 'ankleL', props: [{ type: 'wall', at: 'handR', dx: 1.2 }], dur: 1.6, frames: [
      { t: 4, aL: [96, 92], aR: [96, 92], lL: [180, 180], lR: [180, 180] },
      { t: 4, aL: [96, 92], aR: [96, 92], lL: [180, 180], lR: [184, 284, 250] },
    ] },
  },

  // ───────────── Balance ─────────────
  {
    id: 'single-leg-stand', name: 'Single-Leg Stand', type: 'strength', mode: 'time', duration: 30, sided: true,
    primary: ['calves', 'glutes'], secondary: ['abs'],
    cues: ['Stand barefoot near a wall in case you need it.', 'Lift one foot just off the floor.', 'Stand tall with a soft knee and eyes on a fixed spot.', 'Touch the wall only if you need to.'],
    anim: { anchor: 'ankleL', dur: 2.2, frames: [
      { t: 0, aL: [172, 176], aR: [190, 186], lL: [180, 180], lR: [168, 250, 210] },
      { t: 1, aL: [175, 178], aR: [188, 184], lL: [180, 180], lR: [166, 248, 208] },
    ] },
  },
  {
    id: 'single-leg-stand-eyes-closed', name: 'Single-Leg Stand, Eyes Closed', type: 'strength', mode: 'time', duration: 15, sided: true,
    primary: ['calves', 'glutes'], secondary: ['abs'],
    cues: ['Only try this once the eyes-open version is easy.', 'Stand right next to a wall.', 'Lift one foot, find your balance, then close your eyes.', 'Open them and touch the wall as soon as you wobble.'],
    anim: { anchor: 'ankleL', dur: 1.8, frames: [
      { t: 0, aL: [168, 172], aR: [194, 188], lL: [180, 180], lR: [168, 250, 210] },
      { t: 2, aL: [172, 176], aR: [190, 186], lL: [181, 180], lR: [166, 248, 208] },
    ] },
  },
  {
    id: 'tandem-walk', name: 'Tandem Walk', type: 'strength', mode: 'time', duration: 30,
    primary: ['calves'], secondary: ['glutes', 'abs'],
    cues: ['Walk in a straight line, heel touching toe with every step.', 'Arms out a little for balance.', 'Look ahead, not at your feet.', 'Go slowly — down a hallway and back.'],
    anim: { anchor: 'hip', steady: true, arrow: false, dur: 0.9, hold: 0.15, frames: [
      { t: 0, aL: [150, 160], aR: [150, 160], lR: [172, 182], lL: [188, 186, 110] },
      { t: 0, aL: [150, 160], aR: [150, 160], lL: [172, 182], lR: [188, 186, 110] },
    ] },
  },
];
