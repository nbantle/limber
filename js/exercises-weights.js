// Free-weight exercises (merged into EXERCISES in exercises.js).
// weight: default load in pounds (converted when Settings uses kg). sets: default sets.

const STAND = { t: 0, aL: [178, 178], aR: [182, 182] };
const STAND_F = { t: 0, aL: [192, 186], aR: [168, 174], lL: [183, 180], lR: [177, 180] };
const SQUAT_LEGS = { lL: [95, 200, 90], lR: [95, 200, 90] };
const BENCH_LEGS = { t: 270, lL: [100, 180], lR: [100, 180] }; // lying on a bench, feet on the floor
const BENCH = [{ type: 'bench', at: 'hip', dx: -15, dy: 4.6, w: 42 }];
const DB = { kind: 'db' };

export const WEIGHTS = [
  // ───────────── Arms & shoulders ─────────────
  {
    id: 'db-curl', name: 'Dumbbell Biceps Curl', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 20, equipment: 'Dumbbells',
    primary: ['biceps'], secondary: ['forearms'],
    cues: ['Stand tall with a dumbbell in each hand, palms facing forward.', 'Keep your elbows pinned at your sides.', 'Curl the weights up toward your shoulders, squeezing your biceps.', 'Lower slowly all the way down — don\'t swing.'],
    anim: { gear: DB, arrow: 'handR', dur: 1.1, frames: [
      { ...STAND, aL: [178, 176], aR: [180, 178] },
      { ...STAND, aL: [176, 24], aR: [178, 22] },
    ] },
  },
  {
    id: 'db-hammer-curl', name: 'Hammer Curl', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 20, equipment: 'Dumbbells',
    primary: ['biceps', 'forearms'], secondary: [],
    cues: ['Hold the dumbbells at your sides, palms facing each other.', 'Keep your elbows tucked and still.', 'Curl the weights up, keeping your palms facing in.', 'Lower with control.'],
    anim: { gear: { kind: 'db', axis: 'perp' }, arrow: 'handR', dur: 1.1, frames: [
      { ...STAND, aL: [178, 176], aR: [180, 178] },
      { ...STAND, aL: [176, 24], aR: [178, 22] },
    ] },
  },
  {
    id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 25, equipment: 'Dumbbells',
    primary: ['shoulders'], secondary: ['triceps', 'upperBack'],
    cues: ['Stand or sit tall with the dumbbells at shoulder height, palms forward.', 'Brace your core and keep your ribs down.', 'Press the weights overhead until your arms are straight.', 'Lower back to your shoulders with control.'],
    anim: { view: 'front', gear: DB, dur: 1.1, frames: [
      { ...STAND_F, aL: [262, 2], aR: [98, 358] },
      { ...STAND_F, aL: [346, 356], aR: [14, 4] },
    ] },
  },
  {
    id: 'db-lateral-raise', name: 'Lateral Raise', type: 'weights', mode: 'reps', reps: 12, sets: 3, weight: 10, equipment: 'Dumbbells',
    primary: ['shoulders'], secondary: ['traps'],
    cues: ['Stand with a light dumbbell in each hand at your sides.', 'With a slight bend in your elbows, raise your arms out to the sides.', 'Stop at shoulder height — lead with your elbows.', 'Lower slowly.'],
    anim: { view: 'front', gear: { kind: 'db', axis: 'end' }, dur: 1.1, frames: [
      { ...STAND_F, aL: [196, 192], aR: [164, 168] },
      { ...STAND_F, aL: [270, 276], aR: [90, 84] },
    ] },
  },
  {
    id: 'db-front-raise', name: 'Front Raise', type: 'weights', mode: 'reps', reps: 12, sets: 3, weight: 10, equipment: 'Dumbbells',
    primary: ['shoulders'], secondary: ['chest'],
    cues: ['Stand tall with dumbbells in front of your thighs, palms facing you.', 'Keep your arms nearly straight.', 'Raise the weights in front of you to shoulder height.', 'Lower slowly without leaning back.'],
    anim: { gear: DB, arrow: 'handR', dur: 1.1, frames: [
      { ...STAND, aL: [168, 168], aR: [170, 170] },
      { ...STAND, aL: [90, 86], aR: [92, 88] },
    ] },
  },
  {
    id: 'db-overhead-triceps', name: 'Overhead Triceps Extension', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 25, equipment: 'Dumbbell',
    primary: ['triceps'], secondary: ['shoulders'],
    cues: ['Hold one dumbbell overhead with both hands under the top plate.', 'Keep your elbows pointing up and close to your head.', 'Lower the weight behind your head by bending your elbows.', 'Straighten your arms to press it back up.'],
    anim: { gear: { kind: 'db', hands: 'both', axis: 'along' }, arrow: 'handR', dur: 1.2, frames: [
      { t: 0, aL: [6, 2], aR: [8, 4] },
      { t: 0, aL: [8, 200], aR: [10, 202] },
    ] },
  },
  {
    id: 'db-shrug', name: 'Dumbbell Shrug', type: 'weights', mode: 'reps', reps: 12, sets: 3, weight: 40, equipment: 'Dumbbells',
    primary: ['traps'], secondary: ['forearms'],
    cues: ['Stand tall holding heavy dumbbells at your sides.', 'Lift your shoulders straight up toward your ears.', 'Pause and squeeze at the top.', 'Lower slowly — don\'t roll your shoulders.'],
    anim: { view: 'front', gear: { kind: 'db', axis: 'end' }, arrow: 'shoulderR', dur: 1, frames: [
      { ...STAND_F, aL: [186, 182], aR: [174, 178] },
      { ...STAND_F, sy: 2.6, aL: [186, 182], aR: [174, 178] },
    ] },
  },

  // ───────────── Chest & back ─────────────
  {
    id: 'db-bench-press', name: 'Dumbbell Bench Press', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 30, equipment: 'Dumbbells & bench',
    primary: ['chest', 'triceps'], secondary: ['shoulders'],
    cues: ['Lie on a flat bench, feet flat on the floor, a dumbbell in each hand above your chest.', 'Lower the weights to the sides of your chest, elbows about 45° from your body.', 'Press back up until your arms are straight.', 'Keep your shoulder blades pulled back and down.'],
    anim: { gear: DB, props: BENCH, arrow: 'handR', dur: 1.2, frames: [
      { ...BENCH_LEGS, aL: [2, 0], aR: [358, 0] },
      { ...BENCH_LEGS, kua: 0.5, aL: [180, 0], aR: [176, 0] },
    ] },
  },
  {
    id: 'bb-bench-press', name: 'Barbell Bench Press', type: 'weights', mode: 'reps', reps: 8, sets: 3, weight: 95, equipment: 'Barbell & bench',
    primary: ['chest', 'triceps'], secondary: ['shoulders'],
    cues: ['Lie on the bench with your eyes under the bar and feet flat.', 'Grip a little wider than shoulder width and unrack with straight arms.', 'Lower the bar to your mid-chest with control.', 'Press it back up over your shoulders. Use a spotter for heavy sets.'],
    anim: { gear: { kind: 'bb' }, props: BENCH, arrow: 'handR', dur: 1.3, frames: [
      { ...BENCH_LEGS, aL: [2, 0], aR: [2, 0] },
      { ...BENCH_LEGS, kua: 0.55, aL: [176, 2], aR: [176, 2] },
    ] },
  },
  {
    id: 'db-row', name: 'One-Arm Dumbbell Row', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 30, sided: true, equipment: 'Dumbbell & bench',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'shoulders'],
    cues: ['Put one knee and the same-side hand on a bench, back flat.', 'Hold the dumbbell in your other hand with the arm hanging straight.', 'Pull the weight up toward your hip, elbow close to your body.', 'Lower with control and repeat. Switch sides.'],
    anim: { gear: { kind: 'db', hands: 'R', axis: 'perp' }, props: [{ type: 'bench', at: 'kneeL', dx: 2, dy: 2.4, w: 48 }], arrow: 'handR', dur: 1.2, frames: [
      { t: 82, h: 92, aL: [180, 180], aR: [180, 180], lL: [180, 270, 270], lR: [172, 186] },
      { t: 82, h: 92, aL: [180, 180], aR: [262, 176], lL: [180, 270, 270], lR: [172, 186] },
    ] },
  },
  {
    id: 'bb-row', name: 'Barbell Bent-Over Row', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 75, equipment: 'Barbell',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'lowerBack'],
    cues: ['Hold the bar with hands just outside your knees.', 'Hinge forward with a flat back and soft knees.', 'Pull the bar to your lower ribs, squeezing your shoulder blades.', 'Lower it until your arms are straight.'],
    anim: { gear: { kind: 'bb' }, arrow: 'handR', dur: 1.2, frames: [
      { t: 68, h: 80, aL: [180, 180], aR: [180, 180], lL: [160, 192], lR: [160, 192] },
      { t: 68, h: 80, aL: [252, 172], aR: [252, 172], lL: [160, 192], lR: [160, 192] },
    ] },
  },

  // ───────────── Legs & hips ─────────────
  {
    id: 'goblet-squat', name: 'Goblet Squat', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 35, equipment: 'Dumbbell or kettlebell',
    primary: ['quads', 'glutes'], secondary: ['abs', 'hamstrings'],
    cues: ['Hold one dumbbell upright against your chest.', 'Feet shoulder-width apart, toes slightly out.', 'Sit down between your heels, keeping your chest tall.', 'Drive through your whole foot to stand.'],
    anim: { gear: { kind: 'db', hands: 'both', axis: 'upright' }, dur: 1.2, frames: [
      { t: 0, aL: [152, 14], aR: [156, 16] },
      { t: 30, ...SQUAT_LEGS, aL: [182, 44], aR: [186, 46] },
    ] },
  },
  {
    id: 'bb-back-squat', name: 'Barbell Back Squat', type: 'weights', mode: 'reps', reps: 8, sets: 3, weight: 95, equipment: 'Barbell & rack',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lowerBack', 'abs'],
    cues: ['Rest the bar across your upper back, not your neck.', 'Brace your core, then sit your hips back and down.', 'Keep your knees tracking over your toes and chest up.', 'Drive up through your whole foot. Use a rack with safety bars.'],
    anim: { gear: { kind: 'bb', at: 'back' }, arrow: 'hip', dur: 1.3, frames: [
      { t: 0, aL: [204, 344], aR: [206, 346] },
      { t: 34, ...SQUAT_LEGS, aL: [238, 18], aR: [240, 20] },
    ] },
  },
  {
    id: 'bb-deadlift', name: 'Barbell Deadlift', type: 'weights', mode: 'reps', reps: 6, sets: 3, weight: 135, equipment: 'Barbell',
    primary: ['hamstrings', 'glutes', 'lowerBack'], secondary: ['quads', 'forearms', 'traps'],
    cues: ['Stand with the bar over your mid-foot, hands just outside your legs.', 'Hinge down with a flat back, shins touching the bar.', 'Push the floor away and stand up tall, keeping the bar close.', 'Lower it by pushing your hips back first.'],
    anim: { gear: { kind: 'bb' }, arrow: 'hip', dur: 1.4, frames: [
      { t: 72, h: 84, aL: [180, 180], aR: [180, 180], lL: [114, 158], lR: [114, 158] },
      { t: 0, aL: [182, 182], aR: [182, 182] },
    ] },
  },
  {
    id: 'db-rdl', name: 'Romanian Deadlift', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 30, equipment: 'Dumbbells',
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack'],
    cues: ['Stand tall with dumbbells in front of your thighs.', 'Keep a slight bend in your knees and push your hips back.', 'Slide the weights down your legs until you feel your hamstrings stretch.', 'Squeeze your glutes to stand back up. Keep your back flat.'],
    anim: { gear: DB, arrow: 'hip', dur: 1.3, frames: [
      { t: 0, aL: [174, 174], aR: [176, 176] },
      { t: 78, h: 90, aL: [180, 180], aR: [180, 180], lL: [164, 182], lR: [164, 182] },
    ] },
  },
  {
    id: 'db-lunge', name: 'Dumbbell Lunge', type: 'weights', mode: 'reps', reps: 10, sets: 3, weight: 20, sided: true, equipment: 'Dumbbells',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'],
    cues: ['Stand tall with a dumbbell in each hand at your sides.', 'Step back and lower until both knees bend to about 90°.', 'Keep your front knee over your ankle and your torso upright.', 'Push through the front heel to stand back up.'],
    anim: { gear: { kind: 'db', axis: 'perp' }, dur: 1.1, frames: [
      { t: 0, aL: [180, 180], aR: [180, 180] },
      { t: 3, aL: [182, 182], aR: [182, 182], lR: [100, 180], lL: [196, 280, 170] },
    ] },
  },
  {
    id: 'kb-swing', name: 'Kettlebell Swing', type: 'weights', mode: 'reps', reps: 15, sets: 3, weight: 25, equipment: 'Kettlebell',
    primary: ['glutes', 'hamstrings'], secondary: ['lowerBack', 'shoulders', 'abs'],
    cues: ['Stand with feet a little wider than your hips, kettlebell held in both hands.', 'Hinge your hips back and let the bell swing between your legs.', 'Snap your hips forward to swing it to chest height — your arms just guide it.', 'Let it fall back and hinge again. Keep your back flat.'],
    anim: { gear: { kind: 'kb', hands: 'both' }, arrow: 'handR', dur: 0.75, hold: 0.1, frames: [
      { t: 62, h: 76, aL: [196, 196], aR: [198, 198], lL: [160, 192], lR: [160, 192] },
      { t: -2, aL: [86, 88], aR: [88, 90] },
    ] },
  },
  {
    id: 'farmers-carry', name: "Farmer's Carry", type: 'weights', mode: 'time', duration: 40, sets: 2, weight: 40, equipment: 'Dumbbells or kettlebells',
    primary: ['forearms', 'traps'], secondary: ['abs', 'glutes', 'shoulders'],
    cues: ['Pick up a heavy weight in each hand.', 'Stand tall with your shoulders back and down.', 'Walk with short, steady steps.', 'Keep your core braced — don\'t let the weights pull you sideways.'],
    anim: { gear: { kind: 'db', axis: 'perp' }, anchor: 'hip', steady: true, arrow: false, dur: 0.45, hold: 0.05, frames: [
      { t: 0, aL: [180, 180], aR: [180, 180], lR: [164, 180], lL: [196, 196, 120] },
      { t: 0, aL: [180, 180], aR: [180, 180], lL: [164, 180], lR: [196, 196, 120] },
    ] },
  },
  {
    id: 'bb-overhead-press', name: 'Barbell Overhead Press', type: 'weights', mode: 'reps', reps: 8, sets: 3, weight: 65, equipment: 'Barbell',
    primary: ['shoulders', 'triceps'], secondary: ['upperBack', 'abs'],
    cues: ['Hold the bar at your collarbones, hands just outside your shoulders.', 'Squeeze your glutes and brace your core.', 'Press the bar straight up, moving your head back slightly to clear it.', 'Lock out overhead, then lower to your shoulders.'],
    anim: { view: 'front', gear: { kind: 'bb' }, arrow: 'handR', dur: 1.2, frames: [
      { ...STAND_F, aL: [214, 4], aR: [146, 356] },
      { ...STAND_F, aL: [348, 358], aR: [12, 2] },
    ] },
  },
];
