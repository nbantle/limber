// Additional stretches and moves (merged into EXERCISES in exercises.js).

const STAND = { t: 0, aL: [178, 178], aR: [182, 182] };
const STAND_F = { t: 0, aL: [192, 186], aR: [168, 174], lL: [183, 180], lR: [177, 180] };
const HIPS_F = { aL: [215, 135], aR: [145, 225] }; // hands on hips, front view
const CHAIR_F = { t: 0, kth: 0.32, lL: [184, 180], lR: [176, 180], aL: [186, 170], aR: [174, 190] };
const CROSS_F = { t: 0, lL: [258, 100], lR: [102, 260] }; // seated cross-legged, front view
const SUPINE_T = { t: 270, aL: [180, 180], aR: [0, 0], lL: [90, 90], lR: [90, 90] }; // lying, seen from above
const CHAIR = [{ type: 'chair', at: 'hip' }];

export const MORE = [
  // ───────────── Floor stretches ─────────────
  {
    id: 'double-knee-chest', name: 'Double Knee to Chest', type: 'stretch', mode: 'time', duration: 30,
    primary: ['lowerBack', 'glutes'], secondary: ['hamstrings'],
    cues: ['Lie on your back and draw both knees toward your chest.', 'Wrap your arms around your shins.', 'Keep your head and shoulders relaxed on the floor.', 'Gently rock side to side if it feels good.'],
    anim: { anchor: 'hip', dur: 2.4, frames: [
      { t: 270, aL: [80, 50], aR: [80, 50], lL: [350, 112], lR: [350, 112] },
      { t: 270, aL: [68, 38], aR: [68, 38], lL: [332, 126], lR: [332, 126] },
    ] },
  },
  {
    id: 'knee-to-chest', name: 'Knee to Chest Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['glutes', 'lowerBack'], secondary: ['hipFlexors'],
    cues: ['Lie on your back with both legs straight.', 'Pull one knee in toward your chest with both hands.', 'Keep the other leg long and relaxed on the floor.', 'Breathe and let your lower back soften.'],
    anim: { anchor: 'hip', dur: 2.4, frames: [
      { t: 270, aL: [80, 50], aR: [80, 50], lR: [350, 112], lL: [90, 90, 0] },
      { t: 270, aL: [68, 38], aR: [68, 38], lR: [332, 126], lL: [90, 90, 0] },
    ] },
  },
  {
    id: 'figure-four', name: 'Lying Glute Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['glutes'], secondary: ['hipFlexors', 'lowerBack'],
    cues: ['Lie on your back with knees bent.', 'Cross one ankle over the opposite knee to make a "4".', 'Reach through and hold behind the bottom thigh.', 'Gently pull it toward you until you feel the stretch in your hip.'],
    anim: { anchor: 'hip', dur: 2.6, frames: [
      { t: 270, aL: [78, 62], aR: [78, 62], lL: [12, 92], lR: [62, 302, 10] },
      { t: 270, aL: [70, 58], aR: [70, 58], lL: [354, 84], lR: [52, 290, 0] },
    ] },
  },
  {
    id: 'seated-single-hamstring', name: 'Sitting Hamstring Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['hamstrings'], secondary: ['calves', 'lowerBack'],
    cues: ['Sit with one leg straight and the other knee bent.', 'Sit up tall, then hinge forward over the straight leg.', 'Reach toward your shin, ankle, or toes.', 'Keep your back long and breathe.'],
    anim: { dur: 2.6, frames: [
      { t: 22, h: 30, aL: [118, 108], aR: [112, 104], lR: [90, 90, 0], lL: [45, 155] },
      { t: 58, h: 76, c: 2, aL: [100, 94], aR: [96, 92], lR: [90, 90, 0], lL: [45, 155] },
    ] },
  },
  {
    id: 'anterior-shoulder', name: 'Anterior Shoulder Stretch', type: 'stretch', mode: 'time', duration: 30,
    primary: ['chest', 'shoulders'], secondary: ['biceps'],
    cues: ['Sit with knees bent and feet flat.', 'Place your hands on the floor behind you, fingers pointing back.', 'Lean back and lift your chest toward the ceiling.', 'Keep your shoulders down away from your ears.'],
    anim: { plant: ['handL', 'handR'], anchor: 'hip', dur: 2.6, frames: [
      { t: -10, aL: [202, 192], aR: [202, 192], lL: [50, 155], lR: [50, 155] },
      { t: -24, h: -20, aL: [222, 212], aR: [222, 212], lL: [50, 155], lR: [50, 155] },
    ] },
  },
  {
    id: 'legs-up-wall', name: 'Legs Up the Wall', type: 'stretch', mode: 'time', duration: 60,
    primary: ['hamstrings', 'lowerBack'], secondary: ['calves'],
    cues: ['Sit sideways next to a wall, then swing your legs up as you lie back.', 'Rest your legs against the wall, hips close to it.', 'Let your arms relax by your sides.', 'Breathe slowly and let your legs feel heavy.'],
    anim: { anchor: 'hip', props: [{ type: 'wall', at: 'hip', dx: 4.2 }], dur: 3, frames: [
      { t: 270, aL: [100, 96], aR: [100, 96], lL: [0, 0, 90], lR: [0, 0, 90] },
      { t: 270, aL: [102, 98], aR: [102, 98], lL: [-1, -1, 90], lR: [-1, -1, 90] },
    ] },
  },
  {
    id: 'seated-side-bend', name: 'Seated Side Bend', type: 'stretch', mode: 'time', duration: 20, sided: true,
    primary: ['obliques', 'lats'], secondary: ['shoulders'],
    cues: ['Sit cross-legged and tall.', 'Place one hand on the floor beside you.', 'Reach the other arm up and over your head.', 'Lengthen through your side — keep both hips grounded.'],
    anim: { view: 'front', dur: 2.6, frames: [
      { ...CROSS_F, t: -4, aR: [4, 0], aL: [200, 196] },
      { ...CROSS_F, t: -22, h: -26, aR: [328, 302], aL: [212, 204] },
    ] },
  },
  {
    id: 'seated-twist', name: 'Seated Spinal Twist', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['obliques', 'lowerBack'], secondary: ['upperBack'],
    cues: ['Sit cross-legged and tall.', 'Place one hand on the opposite knee and the other hand behind you.', 'Inhale to lengthen, exhale to twist and look over your shoulder.', 'Twist from your ribs, not just your neck.'],
    anim: { view: 'front', dur: 2.6, frames: [
      { ...CROSS_F, turn: -0.3, aR: [212, 236], aL: [204, 196] },
      { ...CROSS_F, turn: -0.95, h: -6, aR: [222, 240], aL: [208, 200] },
    ] },
  },
  {
    id: 'lying-butterfly', name: 'Lying Butterfly Stretch', type: 'stretch', mode: 'time', duration: 40,
    primary: ['adductors', 'hipFlexors'], secondary: ['glutes'],
    cues: ['Lie on your back.', 'Bring the soles of your feet together and let your knees fall open.', 'Rest your arms out to the sides.', 'Relax and let gravity open your hips.'],
    anim: { top: true, dur: 3, frames: [
      { ...SUPINE_T, aL: [200, 190], aR: [340, 350], lL: [140, 28], lR: [40, 152] },
      { ...SUPINE_T, aL: [200, 190], aR: [340, 350], lL: [150, 24], lR: [30, 156] },
    ] },
  },
  {
    id: 'lying-twist', name: 'Lying Twist Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['lowerBack', 'obliques'], secondary: ['glutes', 'chest'],
    cues: ['Lie on your back with arms out in a T.', 'Bend your knees and let them drop together to one side.', 'Turn your head the opposite way.', 'Keep both shoulders on the floor.'],
    anim: { top: true, dur: 3, frames: [
      { ...SUPINE_T, turn: 0.5, lL: [125, 92], lR: [118, 92] },
      { ...SUPINE_T, turn: 0.9, lL: [146, 96], lR: [138, 96] },
    ] },
  },
  {
    id: 'spinal-twist-supine', name: 'Spine Lumbar Twist', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['lowerBack', 'glutes'], secondary: ['obliques'],
    cues: ['Lie on your back with both legs straight.', 'Bend one knee and guide it across your body with the opposite hand.', 'Stretch the other arm out to the side.', 'Keep that shoulder down and breathe into the twist.'],
    anim: { top: true, dur: 3, frames: [
      { ...SUPINE_T, turn: -0.5, aL: [118, 104], lR: [138, 66], lL: [90, 90] },
      { ...SUPINE_T, turn: -0.8, aL: [124, 108], lR: [152, 70], lL: [90, 90] },
    ] },
  },
  {
    id: 'floor-slides', name: 'Floor Slides', type: 'stretch', mode: 'reps', reps: 10,
    primary: ['upperBack', 'shoulders'], secondary: ['chest'],
    cues: ['Lie on your back with knees bent and arms in a "goal post" shape.', 'Keep the backs of your arms on the floor.', 'Slowly slide your arms overhead, then back down.', 'Only go as far as your arms stay in contact with the floor.'],
    anim: { top: true, dur: 1.4, frames: [
      { ...SUPINE_T, aL: [180, 270], aR: [0, 270] },
      { ...SUPINE_T, aL: [232, 250], aR: [308, 290] },
    ] },
  },
  {
    id: 'lying-leg-swings', name: 'Lying Leg Swings', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['adductors', 'hipFlexors'], secondary: ['abs'],
    cues: ['Lie on your back with arms out to the sides.', 'Keep one leg straight and slowly swing it out to the side.', 'Bring it back to center with control.', 'Keep your hips flat on the floor.'],
    anim: { top: true, dur: 1.2, frames: [
      { ...SUPINE_T, lL: [92, 92], lR: [88, 88] },
      { ...SUPINE_T, lL: [92, 92], lR: [48, 48] },
    ] },
  },

  // ───────────── Standing stretches ─────────────
  {
    id: 'wall-downward-dog', name: 'Downward Dog on the Wall', type: 'stretch', mode: 'time', duration: 30,
    primary: ['lats', 'shoulders'], secondary: ['hamstrings', 'upperBack'],
    cues: ['Stand facing a wall and place your hands on it at hip height.', 'Walk your feet back and hinge at the hips.', 'Let your chest sink toward the floor between your arms.', 'Keep a slight bend in your knees if your hamstrings are tight.'],
    anim: { plant: ['handL', 'handR'], props: [{ type: 'wall', at: 'handR', dx: 1.8 }], dur: 2.6, frames: [
      { t: 82, h: 92, aL: [88, 88], aR: [88, 88], lL: [183, 183], lR: [183, 183] },
      { t: 98, h: 108, c: -2, aL: [92, 92], aR: [92, 92], lL: [184, 184], lR: [184, 184] },
    ] },
  },
  {
    id: 'doorway-chest', name: 'Doorway Chest Stretch', type: 'stretch', mode: 'time', duration: 30,
    primary: ['chest'], secondary: ['shoulders', 'biceps'],
    cues: ['Stand in a doorway with your forearms on the frame, elbows at shoulder height.', 'Step one foot forward.', 'Gently lean through until you feel a stretch across your chest.', 'Keep your shoulders down and your core engaged.'],
    anim: { plant: ['handL', 'handR'], props: [{ type: 'wall', at: 'elbowR', dx: -1.5 }], dur: 2.6, frames: [
      { t: 4, aL: [272, 2], aR: [272, 2], lL: [168, 180], lR: [190, 190] },
      { t: 12, aL: [262, 4], aR: [262, 4], lL: [160, 186], lR: [196, 196] },
    ] },
  },
  {
    id: 'biceps-stretch', name: 'Standing Biceps Stretch', type: 'stretch', mode: 'time', duration: 20, sided: true,
    primary: ['biceps'], secondary: ['chest', 'shoulders'],
    cues: ['Stand tall and extend one arm straight behind you.', 'Turn your palm to face out, thumb pointing down.', 'Gently lift the arm until you feel the front of it stretch.', 'Keep your chest open and shoulders level.'],
    anim: { dur: 2.4, frames: [
      { ...STAND, aR: [238, 240], aL: [176, 176] },
      { ...STAND, t: 3, aR: [250, 252], aL: [176, 176] },
    ] },
  },
  {
    id: 'triangle', name: 'Triangle Pose', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['obliques', 'hamstrings'], secondary: ['adductors', 'shoulders'],
    cues: ['Stand with feet wide, front toes pointing to the side.', 'Reach long over your front leg, then lower that hand to your shin.', 'Stretch the top arm straight up to the ceiling.', 'Keep both legs straight and your chest open.'],
    anim: { view: 'front', dur: 2.6, frames: [
      { t: 48, h: 40, turn: 0.3, aL: [10, 6], aR: [180, 182], lL: [208, 208], lR: [152, 152] },
      { t: 70, h: 60, turn: 0.7, aL: [0, 358], aR: [178, 180], lL: [210, 210], lR: [150, 150] },
    ] },
  },
  {
    id: 'standing-adductor', name: 'Standing Adductor Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['adductors'], secondary: ['quads', 'glutes'],
    cues: ['Stand with your feet wide apart.', 'Bend one knee and shift your hips toward it.', 'Keep the other leg straight and its foot flat.', 'Feel the stretch along the inside of the straight leg.'],
    anim: { view: 'front', anchor: 'ankleR', dur: 2.6, frames: [
      { t: -2, ...HIPS_F, lL: [196, 178], lR: [166, 166] },
      { t: -6, ...HIPS_F, lL: [210, 172], lR: [158, 158] },
    ] },
  },
  {
    id: 'standing-hip-opener', name: 'Single Leg Hip Rotation', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['hipFlexors', 'glutes'], secondary: ['adductors'],
    cues: ['Stand tall with hands on your hips.', 'Lift one knee up in front of you.', 'Rotate the knee out to the side, then bring it back to center.', 'Stay tall and keep your standing leg steady.'],
    anim: { view: 'front', anchor: 'ankleL', dur: 1.2, frames: [
      { t: 0, ...HIPS_F, kth: [1, 0.35], lL: [182, 180], lR: [176, 186] },
      { t: 0, ...HIPS_F, kth: [1, 0.9], lL: [182, 180], lR: [104, 182] },
    ] },
  },
  {
    id: 'standing-knee-chest', name: 'Standing Knee to Chest', type: 'stretch', mode: 'time', duration: 20, sided: true,
    primary: ['glutes', 'lowerBack'], secondary: ['hamstrings'],
    cues: ['Stand tall on one leg.', 'Lift the other knee and hug it toward your chest.', 'Keep your standing leg straight and chest lifted.', 'Hold onto a wall for balance if needed.'],
    anim: { anchor: 'ankleL', dur: 2.2, frames: [
      { t: 0, aR: [118, 172], aL: [118, 172], lL: [180, 180], lR: [70, 172, 120] },
      { t: 0, aR: [100, 189], aL: [100, 189], lL: [180, 180], lR: [28, 166, 120] },
    ] },
  },
  {
    id: 'wrist-ankle-circles', name: 'Wrists & Ankles Circles', type: 'stretch', mode: 'time', duration: 30, sided: true, halfway: 'Switch directions.',
    primary: ['forearms', 'calves'], secondary: [],
    cues: ['Stand tall and interlace your fingers in front of your chest.', 'Roll your wrists in slow circles.', 'At the same time, rest one toe on the floor and circle that ankle.', 'Switch directions halfway through.'],
    anim: { view: 'front', anchor: 'ankleL', dur: 0.5, hold: 0, frames: [
      { t: 0, aL: [170, 40], aR: [190, 320], lL: [183, 180], lR: [174, 178] },
      { t: 0, aL: [168, 30], aR: [192, 330], lL: [183, 180], lR: [171, 182] },
      { t: 0, aL: [172, 46], aR: [188, 314], lL: [183, 180], lR: [174, 186] },
      { t: 0, aL: [170, 52], aR: [190, 308], lL: [183, 180], lR: [177, 182] },
    ] },
  },
  {
    id: 'knee-circles', name: 'Knee Circles', type: 'stretch', mode: 'time', duration: 30, halfway: 'Switch directions.',
    primary: ['quads', 'calves'], secondary: ['hamstrings'],
    cues: ['Stand with feet together and bend your knees slightly.', 'Rest your hands on your knees.', 'Slowly circle your knees together.', 'Switch directions halfway through.'],
    anim: { arrow: 'kneeR', dur: 0.6, hold: 0, frames: [
      { t: 65, aL: [196, 200], aR: [196, 200], lL: [134, 212], lR: [134, 212] },
      { t: 65, aL: [194, 202], aR: [194, 202], lL: [140, 220], lR: [140, 220] },
      { t: 65, aL: [198, 198], aR: [198, 198], lL: [146, 216], lR: [146, 216] },
      { t: 65, aL: [198, 196], aR: [198, 196], lL: [140, 208], lR: [140, 208] },
    ] },
  },
  {
    id: 'overhead-arm-circles', name: 'Overhead Arm Circles', type: 'stretch', mode: 'time', duration: 30, halfway: 'Switch directions.',
    primary: ['shoulders', 'lats'], secondary: ['obliques'],
    cues: ['Stand tall and reach both arms overhead, hands together.', 'Draw slow circles with your hands, moving from your waist.', 'Keep your hips still and core engaged.', 'Switch directions halfway through.'],
    anim: { view: 'front', dur: 0.7, hold: 0, frames: [
      { ...STAND_F, t: -7, aL: [14, 20], aR: [346, 340] },
      { ...STAND_F, t: 0, aL: [16, 22], aR: [344, 338] },
      { ...STAND_F, t: 7, aL: [14, 20], aR: [346, 340] },
      { ...STAND_F, t: 0, aL: [12, 16], aR: [348, 344] },
    ] },
  },
  {
    id: 'cross-touch-reach', name: 'Cross Touch & Reach', type: 'stretch', mode: 'time', duration: 30,
    primary: ['obliques', 'hamstrings'], secondary: ['shoulders', 'lowerBack'],
    cues: ['Stand with feet wider than your hips.', 'Reach one arm high overhead.', 'Sweep it down and across to touch the opposite foot or shin.', 'Come back up and alternate sides.'],
    anim: { view: 'front', dur: 0.8, hold: 0.2, frames: [
      { t: 0, aR: [6, 2], aL: [192, 186], lL: [190, 186], lR: [170, 174] },
      { t: -40, h: -36, aR: [214, 206], aL: [328, 336], lL: [190, 186], lR: [170, 174] },
      { t: 0, aL: [354, 358], aR: [168, 174], lL: [190, 186], lR: [170, 174] },
      { t: 40, h: 36, aL: [146, 154], aR: [32, 24], lL: [190, 186], lR: [170, 174] },
    ] },
  },
  {
    id: 'torso-twist', name: 'Standing Torso Twist', type: 'stretch', mode: 'time', duration: 30,
    primary: ['obliques'], secondary: ['lowerBack', 'abs'],
    cues: ['Stand with feet hip-width apart, hands together at your chest.', 'Rotate your upper body to one side, then the other.', 'Keep your hips facing forward.', 'Move smoothly and breathe.'],
    anim: { view: 'front', dur: 0.9, hold: 0.15, frames: [
      { t: 0, turn: -0.85, aL: [205, 70], aR: [160, 300], lL: [184, 180], lR: [176, 180] },
      { t: 0, turn: 0.85, aL: [200, 60], aR: [155, 290], lL: [184, 180], lR: [176, 180] },
    ] },
  },

  // ───────────── Seated (chair) ─────────────
  {
    id: 'shoulder-rolls', name: 'Shoulder Rolls', type: 'stretch', mode: 'time', duration: 30, halfway: 'Switch directions.',
    primary: ['traps', 'shoulders'], secondary: ['upperBack'],
    cues: ['Sit tall with arms relaxed.', 'Lift your shoulders up toward your ears.', 'Roll them back and down in a smooth circle.', 'Switch directions halfway through.'],
    anim: { arrow: 'shoulderR', view: 'front', props: CHAIR, dur: 0.6, hold: 0, frames: [
      { ...CHAIR_F, sy: 0 },
      { ...CHAIR_F, sy: 2.4 },
      { ...CHAIR_F, sy: 1.2 },
      { ...CHAIR_F, sy: -0.6 },
    ] },
  },
  {
    id: 'shoulder-rotation', name: 'Shoulder Outward Rotation', type: 'stretch', mode: 'reps', reps: 12,
    primary: ['shoulders', 'upperBack'], secondary: [],
    cues: ['Sit tall with elbows bent 90° and tucked at your sides.', 'Keep your elbows touching your ribs.', 'Rotate your forearms out to the sides, squeezing your shoulder blades.', 'Return slowly to the start.'],
    anim: { view: 'front', props: CHAIR, dur: 1.1, frames: [
      { ...CHAIR_F, kfa: 0.35, aL: [178, 214], aR: [182, 146] },
      { ...CHAIR_F, kfa: 1, aL: [178, 268], aR: [182, 92] },
    ] },
  },
  {
    id: 'levator-scapulae', name: 'Levator Scapulae Stretch', type: 'stretch', mode: 'time', duration: 30, sided: true,
    primary: ['neck', 'traps'], secondary: [],
    cues: ['Sit tall and hold the side of your seat with one hand.', 'Turn your nose toward the opposite armpit.', 'Place the other hand on the back of your head and gently pull down.', 'Feel the stretch at the back of your neck, toward the shoulder blade.'],
    anim: { arrow: 'head', view: 'front', props: CHAIR, dur: 2.6, frames: [
      { ...CHAIR_F, h: -16, turn: -0.4, aL: [322, 74], aR: [176, 184] },
      { ...CHAIR_F, h: -30, turn: -0.7, aL: [316, 70], aR: [176, 184] },
    ] },
  },
  {
    id: 'neck-nods', name: 'Up & Down Nods', type: 'stretch', mode: 'time', duration: 30,
    primary: ['neck'], secondary: ['traps'],
    cues: ['Sit tall with your shoulders relaxed.', 'Slowly lower your chin toward your chest.', 'Then gently lift your gaze toward the ceiling.', 'Move slowly — never force your neck.'],
    anim: { props: CHAIR, anchor: 'hip', dur: 1.6, frames: [
      { t: 0, h: 32, aL: [168, 100], aR: [168, 100], lL: [90, 180], lR: [90, 180] },
      { t: 0, h: -28, aL: [168, 100], aR: [168, 100], lL: [90, 180], lR: [90, 180] },
    ] },
  },
  {
    id: 'neck-turns', name: 'Side-to-Side Turns', type: 'stretch', mode: 'time', duration: 30,
    primary: ['neck'], secondary: [],
    cues: ['Sit tall with your shoulders relaxed.', 'Slowly turn your head to look over one shoulder.', 'Return to center and turn to the other side.', 'Keep your chin level.'],
    anim: { view: 'front', props: CHAIR, dur: 1.6, frames: [
      { ...CHAIR_F, turn: -1 },
      { ...CHAIR_F, turn: 1 },
    ] },
  },
  {
    id: 'neck-tilts', name: 'Side-to-Side Tilts', type: 'stretch', mode: 'time', duration: 30,
    primary: ['neck', 'traps'], secondary: [],
    cues: ['Sit tall with your shoulders relaxed.', 'Tilt one ear toward your shoulder.', 'Return to center and tilt to the other side.', 'Keep your shoulders down.'],
    anim: { arrow: 'head', view: 'front', props: CHAIR, dur: 1.6, frames: [
      { ...CHAIR_F, h: -26 },
      { ...CHAIR_F, h: 26 },
    ] },
  },

  // ───────────── Calisthenics & cardio ─────────────
  {
    id: 'reverse-crunch', name: 'Reverse Crunches', type: 'strength', mode: 'reps', reps: 12,
    primary: ['abs'], secondary: ['hipFlexors'],
    cues: ['Lie on your back, knees bent at 90° above your hips.', 'Press your arms into the floor.', 'Curl your hips off the floor, drawing your knees toward your chest.', 'Lower slowly with control.'],
    anim: { anchor: 'shoulderR', dur: 1, frames: [
      { t: 270, aL: [90, 90], aR: [90, 90], lL: [0, 90, 0], lR: [0, 90, 0] },
      { t: 258, aL: [92, 90], aR: [92, 90], lL: [328, 62, 0], lR: [328, 62, 0] },
    ] },
  },
  {
    id: 'side-lunge', name: 'Side Lunges', type: 'strength', mode: 'reps', reps: 10, sided: true,
    primary: ['quads', 'glutes', 'adductors'], secondary: ['hamstrings'],
    cues: ['Stand with feet together, hands at your chest.', 'Take a big step out to the side.', 'Bend that knee and push your hips back; keep the other leg straight.', 'Push off to return to standing.'],
    anim: { view: 'front', anchor: 'ankleR', dur: 0.9, frames: [
      { t: 0, aL: [170, 40], aR: [190, 320], lL: [182, 180], lR: [178, 180] },
      { t: -4, aL: [170, 40], aR: [190, 320], lL: [214, 168], lR: [156, 156] },
    ] },
  },
  {
    id: 'butt-kicks', name: 'Butt Kicks', type: 'strength', mode: 'time', duration: 30,
    primary: ['hamstrings', 'quads'], secondary: ['calves'],
    cues: ['Jog in place.', 'Kick your heels up toward your glutes.', 'Stay light on the balls of your feet.', 'Pump your arms and keep your chest tall.'],
    anim: { anchor: 'hip', dur: 0.3, hold: 0.05, frames: [
      { t: 4, aL: [150, 60], aR: [210, 120], lR: [188, 340, 290], lL: [180, 180, 150], lift: 1 },
      { t: 4, aR: [150, 60], aL: [210, 120], lL: [188, 340, 290], lR: [180, 180, 150], lift: 1 },
    ] },
  },
  {
    id: 'marching', name: 'High Stepping', type: 'strength', mode: 'time', duration: 30,
    primary: ['hipFlexors'], secondary: ['quads', 'calves'],
    cues: ['March in place, lifting your knees high.', 'Swing your opposite arm with each step.', 'Stand tall and keep your core engaged.', 'Land softly.'],
    anim: { anchor: 'hip', dur: 0.5, hold: 0.1, frames: [
      { t: 0, aL: [140, 70], aR: [205, 150], lR: [110, 185, 120], lL: [180, 180] },
      { t: 0, aR: [140, 70], aL: [205, 150], lL: [110, 185, 120], lR: [180, 180] },
    ] },
  },
  {
    id: 'swimmers', name: 'Swimmers', type: 'strength', mode: 'time', duration: 30,
    primary: ['lowerBack', 'glutes'], secondary: ['shoulders', 'hamstrings'],
    cues: ['Lie face down with arms stretched overhead.', 'Lift your chest slightly and keep your gaze down.', 'Flutter opposite arms and legs up and down.', 'Keep it small and controlled.'],
    anim: { anchor: 'hip', dur: 0.4, hold: 0.1, frames: [
      { t: 84, h: 84, aR: [72, 70], aL: [92, 92], lL: [282, 282, 280], lR: [270, 270, 270] },
      { t: 84, h: 84, aL: [72, 70], aR: [92, 92], lR: [282, 282, 280], lL: [270, 270, 270] },
    ] },
  },
];

// Body-area filters (an exercise matches when one of its primary muscles is listed).
export const AREAS = {
  legs: { label: 'Butt & Legs', muscles: ['glutes', 'hipFlexors', 'adductors', 'quads', 'hamstrings', 'calves'] },
  core: { label: 'Abs & Core', muscles: ['abs', 'obliques'] },
  back: { label: 'Back', muscles: ['lowerBack', 'upperBack', 'lats'] },
  upper: { label: 'Neck & Shoulders', muscles: ['neck', 'traps', 'shoulders'] },
  arms: { label: 'Chest & Arms', muscles: ['chest', 'biceps', 'triceps', 'forearms'] },
};
