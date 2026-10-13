// Built-in exercise library.
// type: 'stretch' | 'strength'. mode: 'time' | 'reps'. sided: done once per side.
// Animation poses are documented in figure.js.

import { MORE, AREAS } from './exercises-more.js';

export { AREAS };

export const MUSCLES = {
  neck: 'Neck',
  traps: 'Traps',
  shoulders: 'Shoulders',
  chest: 'Chest',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  lats: 'Lats',
  upperBack: 'Upper back',
  lowerBack: 'Lower back',
  glutes: 'Glutes',
  hipFlexors: 'Hip flexors',
  adductors: 'Inner thighs',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

const STAND = { t: 0, aL: [178, 178], aR: [182, 182] };
const STAND_F = { t: 0, aL: [192, 186], aR: [168, 174], lL: [183, 180], lR: [177, 180] };
const PLANK = { t: 70, aL: [180, 180], aR: [180, 180], lL: [250, 250, 150], lR: [250, 250, 150] };
const FOURS = { t: 75, aL: [180, 180], aR: [180, 180], lL: [182, 270, 270], lR: [182, 270, 270] };
const SUPINE_KNEES = { lL: [45, 150], lR: [45, 150] };

export const EXERCISES = [
  // ───────────── Stretches & mobility ─────────────
  {
    id: 'neck-side', name: 'Neck Side Stretch', type: 'stretch', mode: 'time', duration: 20, sided: true,
    primary: ['neck'], secondary: ['traps'],
    cues: ['Sit or stand tall with shoulders relaxed and down.', 'Tilt your ear toward your shoulder — don\'t lift the shoulder to meet it.', 'Rest your hand on your head for gentle extra pressure only.', 'Breathe slowly; feel the stretch along the opposite side of the neck.'],
    anim: { arrow: 'head', view: 'front', dur: 2.4, frames: [
      { ...STAND_F, h: -16, aL: [322, 74] },
      { ...STAND_F, h: -30, aL: [318, 70] },
    ] },
  },
  {
    id: 'cross-body-shoulder', name: 'Cross-Body Shoulder Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['shoulders'], secondary: ['upperBack', 'triceps'],
    cues: ['Bring one straight arm across your chest at shoulder height.', 'Hook the other forearm above the elbow and draw it closer.', 'Keep the shoulder down, away from your ear.', 'Feel the stretch in the back of the shoulder.'],
    anim: { view: 'front', hotSegs: ['uaR'], dur: 2.4, frames: [
      { ...STAND_F, aR: [272, 270], aL: [152, -14] },
      { ...STAND_F, aR: [266, 268], aL: [148, -20] },
    ] },
  },
  {
    id: 'overhead-triceps', name: 'Overhead Triceps Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['triceps'], secondary: ['lats', 'shoulders'],
    cues: ['Reach one arm overhead, then bend the elbow so your hand drops behind your head.', 'Use the other hand to gently press the elbow back and in.', 'Keep your ribs down — avoid arching your lower back.', 'Hold and breathe.'],
    anim: { view: 'front', hotSegs: ['uaR'], dur: 2.4, frames: [
      { ...STAND_F, aR: [352, 205], aL: [358, 88] },
      { ...STAND_F, aR: [344, 198], aL: [352, 86] },
    ] },
  },
  {
    id: 'chest-opener', name: 'Chest Opener', type: 'stretch', mode: 'time', duration: 30,
    primary: ['chest', 'shoulders'], secondary: ['biceps'],
    cues: ['Clasp your hands behind your back.', 'Straighten the arms and gently lift them away from your body.', 'Squeeze shoulder blades together and lift your chest.', 'Keep your chin level — don\'t crane your neck.'],
    anim: { dur: 2.4, frames: [
      { ...STAND, t: -2, aL: [208, 205], aR: [208, 205] },
      { ...STAND, t: -7, h: -12, aL: [226, 222], aR: [226, 222] },
    ] },
  },
  {
    id: 'forward-fold', name: 'Standing Forward Fold', type: 'stretch', mode: 'time', duration: 30,
    primary: ['hamstrings', 'lowerBack'], secondary: ['calves'],
    cues: ['Stand with feet hip-width apart, soft knees.', 'Hinge at the hips and let your upper body hang.', 'Let your head and arms relax toward the floor.', 'Bend the knees as much as needed — don\'t force it.'],
    anim: { dur: 2.6, frames: [
      { t: 108, h: 135, aL: [176, 178], aR: [178, 180], lL: [178, 178], lR: [178, 178] },
      { t: 126, h: 160, aL: [184, 186], aR: [186, 188], lL: [176, 176], lR: [176, 176] },
    ] },
  },
  {
    id: 'standing-quad', name: 'Standing Quad Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['quads'], secondary: ['hipFlexors'],
    cues: ['Stand tall and hold something for balance if you need to.', 'Bend one knee and hold your ankle behind you.', 'Keep knees close together and tuck your hips slightly under.', 'Feel the stretch along the front of the thigh.'],
    anim: { anchor: 'ankleL', props: [{ type: 'wall', at: 'handL', dx: 1.8 }], dur: 2.4, frames: [
      { t: 0, aL: [100, 95], aR: [219, 172], lL: [180, 180], lR: [185, 345, 300] },
      { t: 0, aL: [100, 95], aR: [226, 172], lL: [180, 180], lR: [195, 352, 300] },
    ] },
  },
  {
    id: 'low-lunge', name: 'Low Lunge Hip Flexor Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['hipFlexors', 'quads'], secondary: ['glutes'],
    cues: ['Kneel on one knee with the other foot in front, knee over ankle.', 'Tuck your tailbone and gently shift your hips forward.', 'Keep your chest tall and hands on your front knee.', 'Feel the stretch at the front of the back hip.'],
    anim: { arrow: 'hip', hotSegs: ['thL'], dur: 2.6, frames: [
      { t: 0, aL: [160, 145], aR: [158, 142], lR: [95, 175], lL: [200, 270, 270] },
      { t: -5, aL: [164, 140], aR: [162, 138], lR: [98, 195], lL: [204, 268, 270] },
    ] },
  },
  {
    id: 'seated-forward-fold', name: 'Seated Forward Fold', type: 'stretch', mode: 'time', duration: 30,
    primary: ['hamstrings'], secondary: ['lowerBack', 'calves'],
    cues: ['Sit with legs straight out in front, toes pointing up.', 'Sit tall first, then hinge forward from the hips.', 'Reach for your shins, ankles, or toes — wherever you reach is fine.', 'Keep your back long rather than rounding hard.'],
    anim: { dur: 2.6, frames: [
      { t: 20, h: 30, aL: [118, 108], aR: [116, 106], lL: [90, 90, 0], lR: [90, 90, 0] },
      { t: 58, h: 78, c: 2, aL: [100, 94], aR: [98, 92], lL: [90, 90, 0], lR: [90, 90, 0] },
    ] },
  },
  {
    id: 'butterfly', name: 'Butterfly Stretch', type: 'stretch', mode: 'time', duration: 30,
    primary: ['adductors'], secondary: ['hipFlexors', 'glutes'],
    cues: ['Sit with the soles of your feet together, knees out to the sides.', 'Hold your feet and sit up tall.', 'Let your knees relax toward the floor — don\'t push them down.', 'For more stretch, hinge forward with a long back.'],
    anim: { arrow: 'kneeL', view: 'front', anchor: 'hip', dur: 2.6, frames: [
      { t: 0, aL: [178, 172], aR: [182, 188], lL: [252, 108], lR: [108, 252] },
      { t: 0, aL: [178, 172], aR: [182, 188], lL: [262, 100], lR: [98, 260] },
    ] },
  },
  {
    id: 'childs-pose', name: "Child's Pose", type: 'stretch', mode: 'time', duration: 30,
    primary: ['lats', 'lowerBack'], secondary: ['glutes', 'shoulders'],
    cues: ['Kneel, sit back toward your heels, and fold forward.', 'Reach your arms long in front of you on the floor.', 'Let your forehead rest on the floor.', 'Breathe into your back and let it widen.'],
    anim: { dur: 2.8, frames: [
      { t: 98, h: 115, c: 3, aL: [92, 92], aR: [92, 92], lL: [100, 270, 270], lR: [100, 270, 270] },
      { t: 95, h: 112, c: 4, aL: [88, 90], aR: [88, 90], lL: [100, 270, 270], lR: [100, 270, 270] },
    ] },
  },
  {
    id: 'cat-cow', name: 'Cat-Cow', type: 'stretch', mode: 'time', duration: 40,
    primary: ['lowerBack', 'abs'], secondary: ['upperBack', 'neck'],
    cues: ['Start on hands and knees: wrists under shoulders, knees under hips.', 'Cow: drop your belly, lift your chest and gaze — inhale.', 'Cat: round your back up toward the ceiling, tuck your chin — exhale.', 'Move slowly with your breath.'],
    anim: { plant: ['handL', 'handR'], anchor: 'kneeR', dur: 2.2, frames: [
      { ...FOURS, c: -5, h: 45 },
      { ...FOURS, c: 7, h: 140 },
    ] },
  },
  {
    id: 'cobra', name: 'Cobra Stretch', type: 'stretch', mode: 'time', duration: 30,
    primary: ['abs', 'hipFlexors'], secondary: ['chest', 'lowerBack'],
    cues: ['Lie face down with hands under your shoulders.', 'Press gently to lift your chest, keeping hips on the floor.', 'Keep elbows soft and shoulders away from your ears.', 'Only lift as high as feels comfortable for your lower back.'],
    anim: { plant: ['handL', 'handR'], anchor: 'hip', dur: 2.6, frames: [
      { t: 84, h: 88, aL: [235, 115], aR: [235, 115], lL: [270, 270, 270], lR: [270, 270, 270] },
      { t: 58, h: 30, c: -4, aL: [200, 160], aR: [200, 160], lL: [270, 270, 270], lR: [270, 270, 270] },
    ] },
  },
  {
    id: 'downward-dog', name: 'Downward Dog', type: 'stretch', mode: 'time', duration: 30,
    primary: ['hamstrings', 'calves'], secondary: ['shoulders', 'lats'],
    cues: ['From hands and knees, lift your hips up and back into an upside-down V.', 'Press the floor away and lengthen your spine.', 'Let your heels sink toward the floor — they don\'t need to touch.', 'Bend the knees if your back rounds.'],
    anim: { plant: ['handL', 'handR'], dur: 2.4, frames: [
      { t: 135, h: 140, aL: [135, 135], aR: [135, 135], lL: [205, 205, 90], lR: [205, 205, 90] },
      { t: 131, h: 138, aL: [132, 132], aR: [132, 132], lL: [207, 207, 96], lR: [207, 207, 96] },
    ] },
  },
  {
    id: 'calf-stretch', name: 'Wall Calf Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['calves'], secondary: ['hamstrings'],
    cues: ['Face a wall with hands on it at chest height.', 'Step one foot back, keeping that leg straight and heel down.', 'Bend the front knee and lean toward the wall.', 'Point the back toes straight forward.'],
    anim: { arrow: 'hip', plant: ['handL', 'handR'], props: [{ type: 'wall', at: 'handR', dx: 2 }], dur: 2.4, frames: [
      { t: 18, aL: [72, 82], aR: [72, 82], lL: [160, 190], lR: [202, 202, 90] },
      { t: 24, aL: [76, 84], aR: [76, 84], lL: [154, 194], lR: [206, 206, 94] },
    ] },
  },
  {
    id: 'pigeon', name: 'Pigeon Pose', type: 'stretch', mode: 'time', duration: 45, sided: true,
    primary: ['glutes', 'hipFlexors'], secondary: ['lowerBack'],
    cues: ['From hands and knees, bring one knee forward behind your wrist.', 'Extend the other leg straight back along the floor.', 'Square your hips and stay upright, or fold forward over the front leg.', 'Use a cushion under the front hip if it doesn\'t reach the floor.'],
    anim: { anchor: 'hip', dur: 3, frames: [
      { t: 8, aL: [170, 176], aR: [168, 174], lR: [94, 266], lL: [268, 270, 270] },
      { t: 72, h: 92, c: 3, aL: [96, 92], aR: [96, 92], lR: [94, 266], lL: [268, 270, 270] },
    ] },
  },
  {
    id: 'side-bend', name: 'Standing Side Bend', type: 'stretch', mode: 'time', duration: 20, sided: true,
    primary: ['obliques', 'lats'], secondary: ['shoulders'],
    cues: ['Stand tall with feet hip-width apart.', 'Reach one arm overhead.', 'Lean to the opposite side, reaching up and over.', 'Keep both feet grounded and hips square.'],
    anim: { view: 'front', dur: 2.6, frames: [
      { ...STAND_F, t: -4, aR: [2, 356], aL: [194, 188] },
      { ...STAND_F, t: -22, h: -26, aR: [330, 304], aL: [200, 192] },
    ] },
  },
  {
    id: 'supine-hamstring', name: 'Lying Hamstring Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['hamstrings'], secondary: ['calves'],
    cues: ['Lie on your back with both legs straight.', 'Lift one leg and hold behind the thigh or calf.', 'Keep the leg as straight as is comfortable and gently pull it toward you.', 'Keep your head and the other leg relaxed on the floor.'],
    anim: { anchor: 'hip', dur: 2.6, frames: [
      { t: 270, aR: [40, 20], aL: [42, 22], lR: [12, 12, 102], lL: [90, 90, 0] },
      { t: 270, aR: [30, 14], aL: [32, 16], lR: [-2, -2, 88], lL: [90, 90, 0] },
    ] },
  },
  {
    id: 'arm-circles', name: 'Arm Circles', type: 'stretch', mode: 'time', duration: 30, halfway: 'Switch directions.',
    primary: ['shoulders'], secondary: ['upperBack'],
    cues: ['Stand tall with arms out to the sides at shoulder height.', 'Make small, controlled circles.', 'Gradually make the circles bigger.', 'Switch direction halfway through.'],
    anim: { view: 'front', dur: 0.32, hold: 0, frames: [
      { ...STAND_F, aL: [262, 262], aR: [98, 98] },
      { ...STAND_F, aL: [270, 274], aR: [90, 86] },
      { ...STAND_F, aL: [278, 270], aR: [82, 90] },
      { ...STAND_F, aL: [270, 264], aR: [90, 96] },
    ] },
  },
  {
    id: 'leg-swings', name: 'Leg Swings', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['hipFlexors', 'hamstrings'], secondary: ['glutes'],
    cues: ['Stand next to a wall and hold it for balance.', 'Swing one leg forward and back like a pendulum.', 'Keep your torso tall — let the hip do the work.', 'Start small and gradually increase the range.'],
    anim: { anchor: 'ankleL', props: [{ type: 'wall', at: 'handL', dx: 2 }], dur: 0.7, hold: 0.1, frames: [
      { t: 4, aL: [92, 90], aR: [200, 190], lL: [180, 180], lR: [125, 140] },
      { t: -4, aL: [92, 90], aR: [160, 170], lL: [180, 180], lR: [218, 212] },
    ] },
  },

  // ───────────── Calisthenics ─────────────
  {
    id: 'push-up', name: 'Push-Up', type: 'strength', mode: 'reps', reps: 10,
    primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'],
    cues: ['Hands slightly wider than shoulders, body in a straight line from head to heels.', 'Brace your core and squeeze your glutes.', 'Lower your chest toward the floor, elbows about 45° from your body.', 'Press back up without letting your hips sag.'],
    anim: { anchor: 'toeR', plant: ['handL', 'handR'], dur: 0.9, frames: [
      PLANK,
      { t: 85, aL: [255, 130], aR: [255, 130], lL: [265, 265, 150], lR: [265, 265, 150] },
    ] },
  },
  {
    id: 'knee-push-up', name: 'Knee Push-Up', type: 'strength', mode: 'reps', reps: 10,
    primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'],
    cues: ['Start on hands and knees, then walk your hands forward.', 'Keep a straight line from your head to your knees.', 'Lower your chest toward the floor with control.', 'Press back up — a great way to build toward full push-ups.'],
    anim: { anchor: 'kneeR', plant: ['handL', 'handR'], dur: 0.9, frames: [
      { t: 51, aL: [180, 180], aR: [180, 180], lL: [231, 276, 300], lR: [231, 276, 300] },
      { t: 75, aL: [265, 150], aR: [265, 150], lL: [255, 276, 300], lR: [255, 276, 300] },
    ] },
  },
  {
    id: 'pike-push-up', name: 'Pike Push-Up', type: 'strength', mode: 'reps', reps: 8,
    primary: ['shoulders'], secondary: ['triceps', 'upperBack'],
    cues: ['Start in an upside-down V with hips high.', 'Bend your elbows to lower the top of your head toward the floor.', 'Keep your hips high throughout.', 'Press back up to the start.'],
    anim: { anchor: 'toeR', plant: ['handL', 'handR'], dur: 0.9, frames: [
      { t: 135, h: 145, aL: [135, 135], aR: [135, 135], lL: [205, 205, 120], lR: [205, 205, 120] },
      { t: 160, h: 170, aL: [45, 165], aR: [45, 165], lL: [210, 210, 120], lR: [210, 210, 120] },
    ] },
  },
  {
    id: 'squat', name: 'Bodyweight Squat', type: 'strength', mode: 'reps', reps: 15,
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'],
    cues: ['Feet shoulder-width apart, toes slightly turned out.', 'Push your hips back and bend your knees as if sitting in a chair.', 'Keep your chest up and knees tracking over your toes.', 'Drive through your whole foot to stand back up.'],
    anim: { dur: 1, frames: [
      { ...STAND },
      { t: 35, aL: [90, 90], aR: [90, 90], lL: [95, 200, 90], lR: [95, 200, 90] },
    ] },
  },
  {
    id: 'reverse-lunge', name: 'Reverse Lunge', type: 'strength', mode: 'reps', reps: 10, sided: true,
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'],
    cues: ['Stand tall with feet hip-width apart.', 'Step one foot back and lower until both knees are about 90°.', 'Keep your front knee over your ankle and torso upright.', 'Push through the front heel to return to standing.'],
    anim: { dur: 1, frames: [
      { ...STAND },
      { t: 3, aL: [186, 176], aR: [186, 176], lR: [100, 180], lL: [196, 280, 170] },
    ] },
  },
  {
    id: 'glute-bridge', name: 'Glute Bridge', type: 'strength', mode: 'reps', reps: 15,
    primary: ['glutes', 'hamstrings'], secondary: ['lowerBack', 'abs'],
    cues: ['Lie on your back with knees bent and feet flat, hip-width apart.', 'Press through your heels and lift your hips.', 'Squeeze your glutes at the top — make a straight line from shoulders to knees.', 'Lower with control.'],
    anim: { arrow: 'hip', dur: 1, frames: [
      { t: 270, h: 270, aL: [90, 90], aR: [90, 90], ...SUPINE_KNEES },
      { t: 246, h: 268, aL: [100, 95], aR: [100, 95], lL: [75, 170], lR: [75, 170] },
    ] },
  },
  {
    id: 'plank', name: 'Plank', type: 'strength', mode: 'time', duration: 30,
    primary: ['abs'], secondary: ['shoulders', 'lowerBack', 'glutes'],
    cues: ['Forearms on the floor, elbows under shoulders.', 'Make a straight line from head to heels.', 'Brace your belly and squeeze your glutes.', 'Don\'t let your hips sag or pike up. Keep breathing.'],
    anim: { anchor: 'toeR', dur: 2, frames: [
      { t: 85, h: 88, aL: [180, 90], aR: [180, 90], lL: [264, 264, 175], lR: [264, 264, 175] },
      { t: 84, h: 87, aL: [181, 90], aR: [181, 90], lL: [263, 263, 175], lR: [263, 263, 175] },
    ] },
  },
  {
    id: 'side-plank', name: 'Side Plank', type: 'strength', mode: 'time', duration: 20, sided: true,
    primary: ['obliques'], secondary: ['abs', 'shoulders', 'glutes'],
    cues: ['Lie on your side with your elbow under your shoulder.', 'Stack your feet and lift your hips off the floor.', 'Make a straight line from head to feet.', 'Reach your top arm up, or rest it on your hip.'],
    anim: { view: 'front', anchor: 'toeR', dur: 2, frames: [
      { t: 72, h: 76, aR: [170, 120], aL: [0, 0], lL: [252, 252, 340], lR: [252, 252, 160] },
      { t: 74, h: 77, aR: [171, 120], aL: [2, 2], lL: [253, 253, 340], lR: [253, 253, 160] },
    ] },
  },
  {
    id: 'mountain-climbers', name: 'Mountain Climbers', type: 'strength', mode: 'time', duration: 30,
    primary: ['abs', 'hipFlexors'], secondary: ['shoulders', 'quads'],
    cues: ['Start in a high plank, hands under shoulders.', 'Drive one knee toward your chest, then switch quickly.', 'Keep your hips level and core tight.', 'Keep your shoulders over your wrists.'],
    anim: { anchor: 'handR', plant: ['handL', 'handR'], dur: 0.34, hold: 0.1, frames: [
      { ...PLANK, lR: [150, 235, 150], lL: [250, 250, 150] },
      { ...PLANK, lL: [150, 235, 150], lR: [250, 250, 150] },
    ] },
  },
  {
    id: 'jumping-jacks', name: 'Jumping Jacks', type: 'strength', mode: 'time', duration: 30,
    primary: ['calves', 'shoulders'], secondary: ['quads', 'glutes'],
    cues: ['Stand with feet together and arms at your sides.', 'Jump your feet out while raising your arms overhead.', 'Jump back to the start.', 'Land softly on the balls of your feet.'],
    anim: { view: 'front', dur: 0.4, hold: 0.15, frames: [
      { ...STAND_F, aL: [194, 188], aR: [166, 172], lL: [182, 180], lR: [178, 180] },
      { t: 0, aL: [312, 330], aR: [48, 30], lL: [200, 194], lR: [160, 166] },
    ] },
  },
  {
    id: 'burpee', name: 'Burpee', type: 'strength', mode: 'reps', reps: 8,
    primary: ['quads', 'chest'], secondary: ['shoulders', 'abs', 'glutes'],
    cues: ['From standing, squat down and place your hands on the floor.', 'Jump or step your feet back into a plank.', 'Jump or step your feet back toward your hands.', 'Stand and jump up, reaching overhead. Modify by stepping instead of jumping.'],
    anim: { anchor: 'shoulderR', dur: 0.55, hold: 0.1, frames: [
      { ...STAND },
      { t: 60, h: 80, aL: [168, 172], aR: [168, 172], lL: [65, 212, 90], lR: [65, 212, 90] },
      { ...PLANK },
      { t: 60, h: 80, aL: [168, 172], aR: [168, 172], lL: [65, 212, 90], lR: [65, 212, 90] },
      { t: -3, aL: [8, 4], aR: [8, 4], lL: [182, 182, 150], lR: [182, 182, 150], lift: 7 },
    ] },
  },
  {
    id: 'crunch', name: 'Crunch', type: 'strength', mode: 'reps', reps: 15,
    primary: ['abs'], secondary: ['obliques'],
    cues: ['Lie on your back with knees bent and feet flat.', 'Reach your hands toward your knees.', 'Curl your head and shoulders off the floor using your abs.', 'Lower slowly. Keep your neck relaxed.'],
    anim: { dur: 0.9, frames: [
      { t: 270, h: 270, aL: [72, 82], aR: [72, 82], ...SUPINE_KNEES },
      { t: 298, h: 318, aL: [78, 84], aR: [78, 84], ...SUPINE_KNEES },
    ] },
  },
  {
    id: 'leg-raises', name: 'Lying Leg Raises', type: 'strength', mode: 'reps', reps: 12,
    primary: ['abs', 'hipFlexors'], secondary: [],
    cues: ['Lie on your back with legs straight and arms by your sides.', 'Press your lower back into the floor.', 'Raise your legs together until they point at the ceiling.', 'Lower slowly — stop before your back arches.'],
    anim: { anchor: 'hip', dur: 1.1, frames: [
      { t: 270, aL: [90, 90], aR: [90, 90], lL: [88, 88, 0], lR: [88, 88, 0] },
      { t: 270, aL: [90, 90], aR: [90, 90], lL: [4, 4, 94], lR: [4, 4, 94] },
    ] },
  },
  {
    id: 'superman', name: 'Superman', type: 'strength', mode: 'reps', reps: 12,
    primary: ['lowerBack', 'glutes'], secondary: ['upperBack', 'hamstrings', 'shoulders'],
    cues: ['Lie face down with arms stretched out in front.', 'Lift your arms, chest, and legs off the floor together.', 'Squeeze your glutes and back; keep your gaze down.', 'Pause, then lower with control.'],
    anim: { anchor: 'hip', dur: 1.1, frames: [
      { t: 90, h: 92, aL: [90, 90], aR: [90, 90], lL: [270, 270, 270], lR: [270, 270, 270] },
      { t: 78, h: 76, c: -3, aL: [70, 68], aR: [70, 68], lL: [281, 281, 281], lR: [281, 281, 281] },
    ] },
  },
  {
    id: 'wall-sit', name: 'Wall Sit', type: 'strength', mode: 'time', duration: 30,
    primary: ['quads'], secondary: ['glutes', 'calves'],
    cues: ['Lean your back flat against a wall.', 'Slide down until your knees are at about 90°.', 'Keep knees over ankles, not past your toes.', 'Hold, breathing steadily.'],
    anim: { props: [{ type: 'wall', at: 'hip', dx: -5.5 }], dur: 2, frames: [
      { t: 0, aL: [176, 180], aR: [176, 180], lL: [90, 180], lR: [90, 180] },
      { t: 0, aL: [177, 180], aR: [177, 180], lL: [91, 180], lR: [91, 180] },
    ] },
  },
  {
    id: 'pull-up', name: 'Pull-Up', type: 'strength', mode: 'reps', reps: 5, equipment: 'Pull-up bar',
    primary: ['lats', 'biceps'], secondary: ['upperBack', 'forearms', 'shoulders'],
    cues: ['Hang from a bar with hands slightly wider than shoulders.', 'Pull your shoulder blades down and back first.', 'Pull until your chin passes the bar.', 'Lower all the way down with control.'],
    anim: { arrow: 'head', view: 'front', hang: true, anchor: 'handR', plant: ['handL', 'handR'], props: [{ type: 'bar', at: 'handR', dx: -9.5, w: 44 }], dur: 1, frames: [
      { t: 0, aL: [340, 352], aR: [20, 8], lL: [182, 180], lR: [178, 180] },
      { t: 0, aL: [240, 10], aR: [120, 350], lL: [176, 186], lR: [184, 174] },
    ] },
  },
  {
    id: 'bench-dip', name: 'Bench Dip', type: 'strength', mode: 'reps', reps: 10, equipment: 'Chair or bench',
    primary: ['triceps'], secondary: ['chest', 'shoulders'],
    cues: ['Sit on the edge of a sturdy chair with hands beside your hips.', 'Slide forward so your hips are just off the seat.', 'Bend your elbows straight back to lower your hips.', 'Press back up, keeping shoulders down.'],
    anim: { plant: ['handL', 'handR'], props: [{ type: 'box', at: 'handR', dx: -5, w: 16 }], dur: 1, frames: [
      { t: 2, aL: [198, 192], aR: [198, 192], lL: [88, 160], lR: [88, 160] },
      { t: 6, aL: [235, 150], aR: [235, 150], lL: [72, 170], lR: [72, 170] },
    ] },
  },
  {
    id: 'high-knees', name: 'High Knees', type: 'strength', mode: 'time', duration: 30,
    primary: ['hipFlexors', 'quads'], secondary: ['calves', 'abs'],
    cues: ['Run in place, driving your knees up to hip height.', 'Pump your arms.', 'Stay light on the balls of your feet.', 'Keep your chest tall.'],
    anim: { anchor: 'hip', dur: 0.3, hold: 0.05, frames: [
      { t: 0, aL: [150, 60], aR: [210, 120], lR: [92, 190, 150], lL: [182, 180, 150] },
      { t: 0, aR: [150, 60], aL: [210, 120], lL: [92, 190, 150], lR: [182, 180, 150] },
    ] },
  },
  {
    id: 'bird-dog', name: 'Bird Dog', type: 'strength', mode: 'reps', reps: 8, sided: true,
    primary: ['lowerBack', 'abs'], secondary: ['glutes', 'shoulders'],
    cues: ['Start on hands and knees with a flat back.', 'Reach one arm forward and the opposite leg back.', 'Keep your hips level — don\'t rotate.', 'Pause, then return with control.'],
    anim: { anchor: 'kneeR', plant: ['handL'], dur: 1.2, frames: [
      { ...FOURS },
      { ...FOURS, aR: [88, 88], lL: [270, 270, 270] },
    ] },
  },
  {
    id: 'dead-bug', name: 'Dead Bug', type: 'strength', mode: 'reps', reps: 10,
    primary: ['abs'], secondary: ['hipFlexors'],
    cues: ['Lie on your back, arms pointing at the ceiling, knees bent at 90° above your hips.', 'Press your lower back into the floor.', 'Slowly extend one arm overhead and the opposite leg out.', 'Return and switch sides.'],
    anim: { anchor: 'hip', dur: 1, hold: 0.2, frames: [
      { t: 270, aL: [0, 0], aR: [0, 0], lL: [0, 90, 0], lR: [0, 90, 0] },
      { t: 270, aL: [0, 0], aR: [285, 282], lL: [78, 82, 0], lR: [0, 90, 0] },
      { t: 270, aL: [0, 0], aR: [0, 0], lL: [0, 90, 0], lR: [0, 90, 0] },
      { t: 270, aL: [285, 282], aR: [0, 0], lL: [0, 90, 0], lR: [78, 82, 0] },
    ] },
  },
  {
    id: 'hollow-hold', name: 'Hollow Body Hold', type: 'strength', mode: 'time', duration: 20,
    primary: ['abs'], secondary: ['hipFlexors', 'quads'],
    cues: ['Lie on your back and press your lower back into the floor.', 'Lift your shoulders, arms, and legs off the floor.', 'Reach your arms overhead and point your toes.', 'Bend your knees to make it easier.'],
    anim: { anchor: 'hip', dur: 2, frames: [
      { t: 284, h: 290, aL: [276, 276], aR: [276, 276], lL: [78, 78, 40], lR: [78, 78, 40] },
      { t: 285, h: 291, aL: [277, 277], aR: [277, 277], lL: [77, 77, 40], lR: [77, 77, 40] },
    ] },
  },
  {
    id: 'calf-raises', name: 'Calf Raises', type: 'strength', mode: 'reps', reps: 15,
    primary: ['calves'], secondary: [],
    cues: ['Stand tall with feet hip-width apart.', 'Rise up onto the balls of your feet as high as you can.', 'Pause at the top.', 'Lower your heels slowly.'],
    anim: { anchor: 'toeR', dur: 0.9, frames: [
      { ...STAND },
      { ...STAND, lL: [180, 180, 150], lR: [180, 180, 150] },
    ] },
  },
];

EXERCISES.push(...MORE);

export const STARTER_ROUTINES = [
  {
    name: '12-Minute Stretch',
    rest: 5,
    steps: [
      { ex: 'calf-stretch', duration: 35 },
      { ex: 'standing-quad', duration: 25 },
      { ex: 'low-lunge', duration: 30 },
      { ex: 'cobra', duration: 30 },
      { ex: 'childs-pose', duration: 30 },
      { ex: 'cat-cow', duration: 40 },
      { ex: 'downward-dog', duration: 30 },
      { ex: 'figure-four', duration: 30 },
      { ex: 'seated-single-hamstring', duration: 30 },
      { ex: 'lying-twist', duration: 30 },
      { ex: 'double-knee-chest', duration: 30 },
      { ex: 'cross-body-shoulder', duration: 25 },
    ],
  },
  {
    name: 'Desk Break',
    rest: 3,
    steps: [
      { ex: 'neck-tilts', duration: 30 },
      { ex: 'neck-turns', duration: 30 },
      { ex: 'shoulder-rolls', duration: 30 },
      { ex: 'levator-scapulae', duration: 20 },
      { ex: 'shoulder-rotation', reps: 12 },
      { ex: 'wrist-ankle-circles', duration: 20 },
    ],
  },
  {
    name: 'Morning Mobility',
    rest: 5,
    steps: [
      { ex: 'neck-side', duration: 20 },
      { ex: 'arm-circles', duration: 30 },
      { ex: 'cat-cow', duration: 40 },
      { ex: 'downward-dog', duration: 30 },
      { ex: 'low-lunge', duration: 30 },
      { ex: 'standing-quad', duration: 30 },
      { ex: 'forward-fold', duration: 30 },
      { ex: 'childs-pose', duration: 40 },
    ],
  },
  {
    name: 'Beginner Calisthenics',
    rest: 20,
    steps: [
      { ex: 'jumping-jacks', duration: 30 },
      { ex: 'squat', reps: 12, sets: 2, setRest: 30 },
      { ex: 'knee-push-up', reps: 8, sets: 2, setRest: 30 },
      { ex: 'glute-bridge', reps: 12, sets: 2, setRest: 30 },
      { ex: 'reverse-lunge', reps: 8 },
      { ex: 'plank', duration: 30 },
      { ex: 'dead-bug', reps: 10 },
    ],
  },
  {
    name: 'Stretch & Strength',
    rest: 10,
    steps: [
      { ex: 'arm-circles', duration: 30 },
      { ex: 'leg-swings', duration: 20 },
      { ex: 'push-up', reps: 10 },
      { ex: 'squat', reps: 15 },
      { ex: 'mountain-climbers', duration: 30 },
      { ex: 'side-plank', duration: 20 },
      { ex: 'chest-opener', duration: 30 },
      { ex: 'pigeon', duration: 40 },
      { ex: 'seated-forward-fold', duration: 40 },
    ],
  },
];
