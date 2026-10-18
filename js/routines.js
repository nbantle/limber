// Explore catalog: ready-made routines people can preview, start, or copy into My Routines.
// goal / level drive the Explore filters; equipment is worked out from the exercises (see app.js).
// Steps use the same shape as saved routines; anything not set falls back to the exercise defaults.

const T = (ex, duration, extra = {}) => ({ ex, mode: 'time', duration, ...extra }); // timed
const R = (ex, reps, sets = 1, extra = {}) => ({ ex, mode: 'reps', reps, sets, ...extra }); // reps

export const GOALS = ['Full Workout', 'Stretch & Mobility', 'Strength', 'Cardio & HIIT', 'Core', 'Recovery', 'Desk & Travel'];
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const EXPLORE = [
  // ───────────── Full workouts (blends of stretch, bodyweight, weights and bands) ─────────────
  {
    id: 'x-complete', name: 'Complete Workout', goal: 'Full Workout', level: 'Intermediate', rest: 45,
    desc: 'Everything in one session: a dynamic warm-up, full-body dumbbell strength, a core finisher, and a stretch to cool down.',
    steps: [T('arm-circles', 30), T('leg-swings', 30), T('cat-cow', 40), T('jumping-jacks', 30),
      R('goblet-squat', 10, 3), R('push-up', 10, 3), R('db-row', 10, 3), R('db-rdl', 10, 3), T('plank', 45),
      T('low-lunge', 30), T('supine-hamstring', 30), T('figure-four', 30), T('chest-opener', 30), T('childs-pose', 45)],
  },
  {
    id: 'x-mobility-core', name: 'Mobility & Core Flow', goal: 'Full Workout', level: 'Beginner', rest: 10,
    desc: 'Stretches and core holds woven together, yoga-style. Moves you through every direction without any equipment.',
    steps: [T('cat-cow', 40), R('bird-dog', 8), T('downward-dog', 30), T('plank', 30), T('low-lunge', 30), T('side-plank', 20), T('cobra', 30), R('dead-bug', 10), T('pigeon', 40), R('glute-bridge', 12), T('childs-pose', 45)],
  },
  {
    id: 'x-bands-bodyweight', name: 'Bands & Bodyweight Circuit', goal: 'Full Workout', level: 'Beginner', rest: 15,
    desc: 'Two rounds alternating bodyweight moves with band pulls and presses, then a short stretch. Only needs a band.',
    steps: [R('squat', 12), R('band-row', 12), R('push-up', 8), R('band-deadlift', 12), R('reverse-lunge', 8), R('band-overhead-press', 10), T('mountain-climbers', 30), R('band-pull-apart', 15),
      R('squat', 12), R('band-row', 12), R('push-up', 8), R('band-deadlift', 12), R('reverse-lunge', 8), R('band-overhead-press', 10), T('mountain-climbers', 30), R('band-pull-apart', 15),
      T('doorway-chest', 30), T('standing-quad', 25), T('forward-fold', 30)],
  },
  {
    id: 'x-hybrid', name: 'Hybrid Full Body', goal: 'Full Workout', level: 'Intermediate', rest: 45,
    desc: 'Dumbbells, kettlebell, bands, and bodyweight in one balanced session — push, pull, legs, hinge, and core — finished with a stretch.',
    steps: [T('marching', 45), T('arm-circles', 30), R('band-pull-apart', 15),
      R('db-bench-press', 10, 3), R('band-row', 12, 3), R('goblet-squat', 10, 3), R('band-face-pull', 15, 2), R('db-lunge', 10, 2), R('kb-swing', 15, 3), R('dead-bug', 10, 2),
      T('doorway-chest', 30), T('pigeon', 40), T('seated-forward-fold', 40), T('childs-pose', 45)],
  },
  {
    id: 'x-strength-yoga', name: 'Strength & Yoga Blend', goal: 'Full Workout', level: 'Beginner', rest: 10,
    desc: 'Bodyweight strength moves paired with the yoga stretch that opens up the same muscles.',
    steps: [T('downward-dog', 30), R('push-up', 10), T('cobra', 30), R('squat', 15), T('low-lunge', 30), T('plank', 40), T('childs-pose', 30), R('glute-bridge', 15), T('pigeon', 40), T('triangle', 30), T('side-plank', 20), R('superman', 10), T('seated-forward-fold', 40), T('legs-up-wall', 60)],
  },
  {
    id: 'x-upper-pump', name: 'Upper Body Pump + Stretch', goal: 'Full Workout', level: 'Intermediate', rest: 40,
    desc: 'Chest, back, shoulders, and arms with dumbbells and a band, then stretch everything you worked.',
    steps: [R('band-pull-apart', 15), T('arm-circles', 30),
      R('push-up', 10, 3), R('db-row', 10, 3), R('db-shoulder-press', 10, 3), R('band-face-pull', 15, 2), R('db-curl', 12, 2), R('band-pushdown', 15, 2),
      T('cross-body-shoulder', 30), T('overhead-triceps', 30), T('doorway-chest', 30), T('biceps-stretch', 20)],
  },
  {
    id: 'x-legs-hips', name: 'Leg Day + Hip Mobility', goal: 'Full Workout', level: 'Intermediate', rest: 45,
    desc: 'Heavy-ish legs with dumbbells and bands, then a long hip-opening cool-down.',
    steps: [T('leg-swings', 30), T('knee-circles', 30),
      R('goblet-squat', 10, 4), R('db-rdl', 10, 3), R('db-lunge', 10, 3), T('band-lateral-walk', 30, { sets: 2 }), R('band-glute-bridge', 15, 3), R('calf-raises', 15, 3),
      T('low-lunge', 40), T('pigeon', 45), T('butterfly', 40), T('supine-hamstring', 40), T('figure-four', 40)],
  },
  {
    id: 'x-runner-strength', name: "Runner's Strength & Mobility", goal: 'Full Workout', level: 'Beginner', rest: 20,
    desc: 'Single-leg strength, glute and calf work, and core stability — the stuff that keeps runners healthy — plus a cool-down.',
    steps: [T('leg-swings', 30), T('high-knees', 20),
      R('reverse-lunge', 10, 2), R('side-lunge', 10, 2), R('band-glute-bridge', 15, 2), T('band-lateral-walk', 30), R('calf-raises', 20, 2), T('side-plank', 25), R('dead-bug', 10),
      T('calf-stretch', 30), T('standing-quad', 30), T('figure-four', 40), T('supine-hamstring', 40)],
  },
  {
    id: 'x-weekend-long', name: 'Long Weekend Session', goal: 'Full Workout', level: 'Intermediate', rest: 45,
    desc: 'About an hour when you have time: long warm-up, full-body dumbbell strength, conditioning, core, and a full stretch.',
    steps: [T('jumping-jacks', 60), T('arm-circles', 30), T('leg-swings', 30), T('cat-cow', 40), T('downward-dog', 30),
      R('goblet-squat', 10, 3), R('db-bench-press', 10, 3), R('db-row', 10, 3), R('db-rdl', 10, 3), R('db-shoulder-press', 10, 3), R('db-lunge', 10, 2),
      R('kb-swing', 15, 3), R('burpee', 8, 2), T('mountain-climbers', 30, { sets: 2 }),
      T('plank', 45), T('side-plank', 30), T('hollow-hold', 30),
      T('low-lunge', 40), T('pigeon', 45), T('seated-forward-fold', 45), T('chest-opener', 30), T('childs-pose', 60)],
  },
  {
    id: 'x-total-training', name: 'Total Training (Barbell)', goal: 'Full Workout', level: 'Advanced', rest: 90,
    desc: 'A long gym day (about 75 minutes): warm-up, heavy barbell squat, bench, and row, dumbbell accessories, core, and a cool-down stretch.',
    steps: [T('jumping-jacks', 60), T('leg-swings', 30), T('arm-circles', 30), R('squat', 10), R('band-pull-apart', 15),
      R('bb-back-squat', 5, 5, { setRest: 120 }), R('bb-bench-press', 5, 5, { setRest: 120 }), R('bb-row', 8, 3, { setRest: 90 }),
      R('db-rdl', 10, 3), R('db-lateral-raise', 12, 3), R('db-curl', 12, 2), R('db-overhead-triceps', 12, 2),
      R('leg-raises', 12, 2), T('plank', 60),
      T('low-lunge', 40), T('pigeon', 45), T('doorway-chest', 30), T('supine-hamstring', 40), T('childs-pose', 60)],
  },
  {
    id: 'x-desk-fix', name: 'Desk Worker Fix', goal: 'Full Workout', level: 'Beginner', rest: 15,
    desc: 'Strengthen what sitting weakens (upper back, glutes, core) and stretch what it tightens (chest, hips, neck).',
    steps: [R('band-pull-apart', 15, 2), R('band-face-pull', 15, 2), R('glute-bridge', 15, 2), R('bird-dog', 8), T('plank', 30),
      T('doorway-chest', 30), T('low-lunge', 40), T('cobra', 30), T('neck-side', 25), T('levator-scapulae', 25)],
  },
  {
    id: 'x-rotation', name: 'Golf & Rotation Ready', goal: 'Full Workout', level: 'Beginner', rest: 10,
    desc: 'Twist-friendly mobility plus anti-rotation core work — good before a round of golf or any racket sport.',
    steps: [T('torso-twist', 30), T('cross-touch-reach', 30), T('arm-circles', 30), T('standing-hip-opener', 20), R('band-pull-apart', 15), R('bird-dog', 8), T('side-plank', 25), T('lying-twist', 30), T('figure-four', 30), T('seated-twist', 30)],
  },

  // ───────────── Stretch & mobility ─────────────
  {
    id: 'x-morning-wake-up', name: 'Morning Wake-Up', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'Gentle, standing-friendly moves to loosen your neck, spine, and hips before the day starts.',
    steps: [T('neck-tilts', 30), T('shoulder-rolls', 30), T('arm-circles', 30), T('cat-cow', 40), T('torso-twist', 30), T('standing-hip-opener', 20), T('forward-fold', 30), T('side-bend', 20)],
  },
  {
    id: 'x-full-body-stretch', name: 'Full-Body Stretch', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'A head-to-toe stretch hitting calves, quads, hips, back, and shoulders. Great after any workout.',
    steps: [T('calf-stretch', 35), T('standing-quad', 25), T('low-lunge', 30), T('cobra', 30), T('childs-pose', 30), T('cat-cow', 40), T('downward-dog', 30), T('figure-four', 30), T('seated-single-hamstring', 30), T('lying-twist', 30), T('double-knee-chest', 30), T('cross-body-shoulder', 25)],
  },
  {
    id: 'x-morning-mobility', name: 'Morning Mobility', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'A quick flow from neck to hips to get moving.',
    steps: [T('neck-side', 20), T('arm-circles', 30), T('cat-cow', 40), T('downward-dog', 30), T('low-lunge', 30), T('standing-quad', 30), T('forward-fold', 30), T('childs-pose', 40)],
  },
  {
    id: 'x-hip-opener', name: 'Hip Opener Flow', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'For tight hips from sitting or running: hip flexors, glutes, and inner thighs.',
    steps: [T('low-lunge', 40), T('pigeon', 45), T('butterfly', 40), T('figure-four', 40), T('standing-adductor', 30), T('lying-butterfly', 45), T('knee-to-chest', 30)],
  },
  {
    id: 'x-hamstrings', name: 'Hamstrings & Hips', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'Work toward touching your toes with dynamic swings and longer holds.',
    steps: [T('leg-swings', 30), T('supine-hamstring', 40), T('seated-single-hamstring', 40), T('single-leg-forward-fold', 40), T('seated-forward-fold', 45), T('downward-dog', 40)],
  },
  {
    id: 'x-posture-opener', name: 'Chest & Posture Opener', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'Undo rounded shoulders: open the chest and wake up the upper back.',
    steps: [T('chest-opener', 30), T('doorway-chest', 30), T('anterior-shoulder', 30), R('floor-slides', 10), T('cobra', 30), T('biceps-stretch', 20), R('superman', 10)],
  },
  {
    id: 'x-pre-run', name: 'Pre-Run Warm-Up', goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'Dynamic moves to raise your heart rate and loosen your legs before a run. No long holds.',
    steps: [T('marching', 30), T('leg-swings', 30), T('high-knees', 20), T('butt-kicks', 20), R('side-lunge', 8), T('knee-circles', 20), R('calf-raises', 15)],
  },
  {
    id: 'x-post-run', name: "Runner's Cool-Down", goal: 'Stretch & Mobility', level: 'Beginner', rest: 5,
    desc: 'Static stretches for calves, quads, hamstrings, and hips after a run.',
    steps: [T('calf-stretch', 40), T('standing-quad', 30), T('low-lunge', 30), T('supine-hamstring', 40), T('figure-four', 40), T('butterfly', 30), T('pigeon', 40)],
  },

  // ───────────── Recovery ─────────────
  {
    id: 'x-lower-back', name: 'Lower Back Relief', goal: 'Recovery', level: 'Beginner', rest: 5,
    desc: 'Gentle stretches plus a little core work for a stiff lower back. Stop any move that sends pain down your leg or makes it worse.',
    steps: [T('knee-to-chest', 30), T('double-knee-chest', 30), T('cat-cow', 40), T('childs-pose', 40), T('lying-twist', 30), R('glute-bridge', 10), R('bird-dog', 6), T('cobra', 20)],
  },
  {
    id: 'x-bedtime', name: 'Before Bed Wind-Down', goal: 'Recovery', level: 'Beginner', rest: 5,
    desc: 'Slow floor stretches to relax before sleep. Breathe slowly and stay in each one.',
    steps: [T('childs-pose', 45), T('cat-cow', 40), T('figure-four', 40), T('lying-twist', 40), T('double-knee-chest', 40), T('lying-butterfly', 60), T('legs-up-wall', 90)],
  },
  {
    id: 'x-rest-day', name: 'Rest Day Recovery', goal: 'Recovery', level: 'Beginner', rest: 5,
    desc: 'Light movement for sore muscles on a day off.',
    steps: [T('arm-circles', 30), T('cat-cow', 40), T('downward-dog', 30), T('low-lunge', 30), T('figure-four', 40), T('supine-hamstring', 30), T('spinal-twist-supine', 30), T('childs-pose', 45)],
  },

  // ───────────── Desk & travel ─────────────
  {
    id: 'x-desk-break', name: 'Desk Break', goal: 'Desk & Travel', level: 'Beginner', rest: 3,
    desc: 'Four minutes in your chair for your neck, shoulders, and wrists.',
    steps: [T('neck-tilts', 30), T('neck-turns', 30), T('shoulder-rolls', 30), T('levator-scapulae', 20), R('shoulder-rotation', 12), T('wrist-ankle-circles', 20)],
  },
  {
    id: 'x-neck-shoulders', name: 'Neck & Shoulder Release', goal: 'Desk & Travel', level: 'Beginner', rest: 5,
    desc: 'For screen-time tension in your neck, traps, and shoulders.',
    steps: [T('neck-side', 25), T('levator-scapulae', 25), T('neck-nods', 30), T('shoulder-rolls', 30), T('cross-body-shoulder', 25), T('doorway-chest', 30), T('overhead-triceps', 25)],
  },
  {
    id: 'x-travel', name: 'Travel Reset', goal: 'Desk & Travel', level: 'Beginner', rest: 5,
    desc: 'After a long flight or drive: get blood moving and loosen up in a small space.',
    steps: [T('neck-turns', 30), T('shoulder-rolls', 30), T('wrist-ankle-circles', 30), T('standing-knee-chest', 20), T('calf-stretch', 30), T('forward-fold', 30), T('side-bend', 20), R('calf-raises', 15)],
  },
  {
    id: 'x-standing-desk', name: 'Standing Office Stretch', goal: 'Desk & Travel', level: 'Beginner', rest: 3,
    desc: 'Everything is standing — do it beside your desk without getting on the floor.',
    steps: [T('chest-opener', 30), T('side-bend', 20), T('standing-quad', 25), T('calf-stretch', 30), T('torso-twist', 30), T('cross-body-shoulder', 25), T('forward-fold', 30)],
  },

  // ───────────── Cardio & HIIT ─────────────
  {
    id: 'x-7-minute', name: '7-Minute Workout', goal: 'Cardio & HIIT', level: 'Intermediate', rest: 10,
    desc: 'Based on the classic 12-move circuit (Klika & Jordan, 2013): 30 seconds each, 10 seconds rest, alternating body areas. Step-ups are swapped for high stepping.',
    steps: [T('jumping-jacks', 30), T('wall-sit', 30), T('push-up', 30), T('crunch', 30), T('marching', 30), T('squat', 30), T('bench-dip', 30), T('plank', 30), T('high-knees', 30), T('reverse-lunge', 30, { sides: 'one' }), T('push-up', 30), T('side-plank', 15)],
  },
  {
    id: 'x-tabata', name: 'Tabata Cardio Blast', goal: 'Cardio & HIIT', level: 'Advanced', rest: 10,
    desc: 'Twenty seconds all-out, ten seconds rest. Two rounds of four moves.',
    steps: [T('burpee', 20), T('mountain-climbers', 20), T('high-knees', 20), T('jumping-jacks', 20), T('burpee', 20), T('mountain-climbers', 20), T('high-knees', 20), T('jumping-jacks', 20)],
  },
  {
    id: 'x-low-impact', name: 'Low-Impact Cardio', goal: 'Cardio & HIIT', level: 'Beginner', rest: 15,
    desc: 'Gets your heart rate up with no jumping — easy on knees and neighbors.',
    steps: [T('marching', 45), R('side-lunge', 10), T('cross-touch-reach', 40), R('squat', 12), T('torso-twist', 40), R('calf-raises', 15), T('marching', 45)],
  },
  {
    id: 'x-hiit-beginner', name: 'Beginner HIIT', goal: 'Cardio & HIIT', level: 'Beginner', rest: 20,
    desc: 'Short bursts with generous rest. Two rounds.',
    steps: [T('jumping-jacks', 30), T('squat', 30), T('butt-kicks', 30), T('knee-push-up', 30), T('jumping-jacks', 30), T('squat', 30), T('butt-kicks', 30), T('knee-push-up', 30)],
  },
  {
    id: 'x-conditioning', name: 'Total Body Conditioning', goal: 'Cardio & HIIT', level: 'Intermediate', rest: 30,
    desc: 'Strength and cardio together with a dumbbell and a kettlebell.',
    steps: [R('burpee', 8, 3, { setRest: 30 }), R('goblet-squat', 12, 3), R('push-up', 10, 3, { setRest: 30 }), R('db-row', 10, 2), R('kb-swing', 15, 3), T('plank', 40)],
  },

  // ───────────── Core ─────────────
  {
    id: 'x-abs-5', name: 'Abs in 5', goal: 'Core', level: 'Beginner', rest: 10,
    desc: 'Five fast core moves, done in under five minutes.',
    steps: [R('crunch', 15), R('reverse-crunch', 12), T('mountain-climbers', 30), T('plank', 30), T('hollow-hold', 20)],
  },
  {
    id: 'x-core-crusher', name: 'Core Crusher', goal: 'Core', level: 'Intermediate', rest: 15,
    desc: 'Front, sides, and back of your core — anti-extension, rotation, and stability.',
    steps: [R('dead-bug', 12), R('crunch', 15), R('reverse-crunch', 12), R('leg-raises', 12), T('plank', 45), T('side-plank', 30), T('hollow-hold', 30), R('bird-dog', 10)],
  },
  {
    id: 'x-back-strength', name: 'Strong Back, Happy Back', goal: 'Core', level: 'Beginner', rest: 15,
    desc: 'Builds the muscles that support your spine: glutes, back extensors, and deep core.',
    steps: [R('bird-dog', 8, 2), R('glute-bridge', 12, 2), R('superman', 10, 2), R('dead-bug', 10), T('swimmers', 30), T('side-plank', 20)],
  },

  // ───────────── Strength: bodyweight ─────────────
  {
    id: 'x-beginner-calisthenics', name: 'Beginner Calisthenics', goal: 'Strength', level: 'Beginner', rest: 20,
    desc: 'Learn the basics: squat, push, bridge, lunge, and plank.',
    steps: [T('jumping-jacks', 30), R('squat', 12, 2, { setRest: 30 }), R('knee-push-up', 8, 2, { setRest: 30 }), R('glute-bridge', 12, 2, { setRest: 30 }), R('reverse-lunge', 8), T('plank', 30), R('dead-bug', 10)],
  },
  {
    id: 'x-bodyweight-strength', name: 'Bodyweight Strength', goal: 'Strength', level: 'Intermediate', rest: 90,
    desc: 'Modeled on the r/bodyweightfitness routine: pull, squat, dip, hinge, push, then a core finisher. 3 sets of 5–8.',
    steps: [T('dead-bug', 30), R('pull-up', 6, 3, { setRest: 90 }), R('squat', 8, 3, { setRest: 90 }), R('bench-dip', 8, 3, { setRest: 90 }), R('glute-bridge', 10, 3, { setRest: 90 }), R('push-up', 8, 3, { setRest: 90 }), T('plank', 45), R('leg-raises', 10), R('superman', 10)],
  },
  {
    id: 'x-upper-bodyweight', name: 'Upper Body (No Equipment)', goal: 'Strength', level: 'Intermediate', rest: 45,
    desc: 'Chest, shoulders, and arms with just a chair.',
    steps: [R('push-up', 10, 3), R('pike-push-up', 8, 3), R('bench-dip', 10, 3), R('knee-push-up', 12), R('superman', 12), T('plank', 40)],
  },
  {
    id: 'x-legs-bodyweight', name: 'Leg Day (No Equipment)', goal: 'Strength', level: 'Beginner', rest: 30,
    desc: 'Quads, glutes, and calves with your bodyweight.',
    steps: [R('squat', 15, 3), R('reverse-lunge', 10, 2), R('side-lunge', 10, 2), T('wall-sit', 40), R('glute-bridge', 15, 2), R('calf-raises', 20, 2)],
  },
  {
    id: 'x-glutes', name: 'Glute Builder', goal: 'Strength', level: 'Beginner', rest: 20,
    desc: 'Glute-focused moves to support your hips, knees, and lower back.',
    steps: [R('glute-bridge', 15, 3), R('reverse-lunge', 10, 2), R('side-lunge', 10, 2), R('squat', 15), R('bird-dog', 10), T('swimmers', 30)],
  },
  {
    id: 'x-stretch-strength', name: 'Stretch & Strength', goal: 'Strength', level: 'Beginner', rest: 10,
    desc: 'A balanced mix: warm up, a few strength moves, then stretch it out.',
    steps: [T('arm-circles', 30), T('leg-swings', 20), R('push-up', 10), R('squat', 15), T('mountain-climbers', 30), T('side-plank', 20), T('chest-opener', 30), T('pigeon', 40), T('seated-forward-fold', 40)],
  },

  // ───────────── Strength: free weights ─────────────
  {
    id: 'x-db-full-body', name: 'Dumbbell Full Body', goal: 'Strength', level: 'Beginner', rest: 45,
    desc: 'Squat, push, pull, hinge, press, and carry — the whole body with one pair of dumbbells. 2–3 sets of 8–12.',
    steps: [R('goblet-squat', 10, 3), R('db-bench-press', 10, 3), R('db-row', 10, 2), R('db-rdl', 10, 3), R('db-shoulder-press', 10, 2), R('db-curl', 12, 2), T('farmers-carry', 40, { sets: 2 })],
  },
  {
    id: 'x-db-upper', name: 'Dumbbell Upper Body', goal: 'Strength', level: 'Intermediate', rest: 60,
    desc: 'Chest, back, shoulders, and arms. Pair it with Dumbbell Lower Body for an upper/lower split.',
    steps: [R('db-bench-press', 10, 3), R('db-row', 10, 3), R('db-shoulder-press', 10, 3), R('db-lateral-raise', 12, 2), R('db-curl', 12, 2), R('db-overhead-triceps', 12, 2)],
  },
  {
    id: 'x-db-lower', name: 'Dumbbell Lower Body', goal: 'Strength', level: 'Intermediate', rest: 60,
    desc: 'Quads, glutes, hamstrings, and grip.',
    steps: [R('goblet-squat', 10, 3), R('db-rdl', 10, 3), R('db-lunge', 10, 2), R('glute-bridge', 15, 2), R('calf-raises', 15, 2), T('farmers-carry', 40, { sets: 2 })],
  },
  {
    id: 'x-arms', name: 'Arms & Shoulders', goal: 'Strength', level: 'Beginner', rest: 45,
    desc: 'Biceps, triceps, and delts with dumbbells and a chair.',
    steps: [R('db-curl', 12, 3), R('db-hammer-curl', 10, 2), R('db-overhead-triceps', 12, 3), R('bench-dip', 10, 2), R('db-lateral-raise', 12, 3), R('db-front-raise', 10, 2), R('db-shrug', 12, 2)],
  },
  {
    id: 'x-5x5-a', name: 'Barbell 5×5 — Day A', goal: 'Strength', level: 'Intermediate', rest: 120,
    desc: 'Classic linear strength: 5 sets of 5 on squat, bench, and row. Alternate with Day B and add a little weight each session.',
    steps: [R('bb-back-squat', 5, 5, { setRest: 120 }), R('bb-bench-press', 5, 5, { setRest: 120 }), R('bb-row', 5, 5, { setRest: 120 })],
  },
  {
    id: 'x-5x5-b', name: 'Barbell 5×5 — Day B', goal: 'Strength', level: 'Intermediate', rest: 120,
    desc: 'Squat, overhead press, and one heavy set of deadlifts. Alternate with Day A.',
    steps: [R('bb-back-squat', 5, 5, { setRest: 120 }), R('bb-overhead-press', 5, 5, { setRest: 120 }), R('bb-deadlift', 5, 1)],
  },
  {
    id: 'x-kettlebell', name: 'Kettlebell Quick Burn', goal: 'Strength', level: 'Intermediate', rest: 30,
    desc: 'Swings are the star — hip power, grip, and conditioning in about 15 minutes.',
    steps: [R('kb-swing', 15, 4, { setRest: 30 }), R('goblet-squat', 10, 3), R('push-up', 10, 2), T('farmers-carry', 40), T('plank', 30)],
  },

  // ───────────── Strength: bands ─────────────
  {
    id: 'x-band-basics', name: 'Resistance Band Basics', goal: 'Strength', level: 'Beginner', rest: 30,
    desc: 'A full-body band workout you can do anywhere.',
    steps: [R('band-squat', 12, 2), R('band-row', 12, 2), R('band-chest-press', 12, 2), R('band-deadlift', 12, 2), R('band-overhead-press', 10, 2), R('band-pull-apart', 15, 2), T('band-lateral-walk', 30, { sets: 2 })],
  },
  {
    id: 'x-band-upper', name: 'Band Upper Body', goal: 'Strength', level: 'Beginner', rest: 30,
    desc: 'Pushes, pulls, and arms with a band and a door anchor.',
    steps: [R('band-row', 12, 3), R('band-chest-press', 12, 3), R('band-face-pull', 15, 2), R('band-overhead-press', 10, 2), R('band-curl', 12, 2), R('band-pushdown', 15, 2), R('band-pull-apart', 15, 2)],
  },
  {
    id: 'x-band-lower', name: 'Band Glutes & Legs', goal: 'Strength', level: 'Beginner', rest: 30,
    desc: 'Loop-band glute work plus squats and deadlifts.',
    steps: [T('band-lateral-walk', 30, { sets: 2 }), R('band-glute-bridge', 15, 3), R('band-squat', 12, 3), R('band-deadlift', 12, 3), R('reverse-lunge', 10), R('calf-raises', 15)],
  },
  {
    id: 'x-posture-bands', name: 'Posture Fix', goal: 'Desk & Travel', level: 'Beginner', rest: 15,
    desc: 'Strengthen your upper back with a light band, then open the chest.',
    steps: [R('band-pull-apart', 15, 2), R('band-face-pull', 15, 2), R('band-row', 12, 2), T('doorway-chest', 30), T('chest-opener', 30), R('floor-slides', 10)],
  },
];
