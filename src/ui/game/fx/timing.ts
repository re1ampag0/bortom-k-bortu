// FX-D: the durations of the A5 clips in one table (ms at the normal speed; the queue multiplies them by its speed —
// «Быстрее», the catch-up ×2 — and «Пауза» / «До конца хода» stop or end them, as for every clip). The numbers are the
// prototype's (docs/mockups/a5/fx/src/fx3.js, template.html; ANIMATIONS.md §3.6–3.9, the user's call: as long as there).
// Each clip has its own factor: to make a clip shorter, change its K — every stage of the clip is counted from these
// numbers, the choreography stays. The traces (smoke, wreckage) live by their own clock (scars.ts), not by K.

export const VOLLEY_K = 1;
export const FIRE_K = 1;
export const SINK_K = 1;
export const SWAP_K = 1;
export const REPAIR_K = 1;
export const SOUL_K = 1;
export const DIVE_K = 1;
/** FX-B, FX-C (package 3): the Legends and the sea. */
export const LEGEND_K = 1;
export const KRAKEN_K = 1;
export const ARMADA_K = 1;
export const BOTTLE_K = 1;
export const JACK_K = 1;
export const ROUND_K = 1;
export const SEA_K = 1;

const scaled = <T extends Record<string, number>>(k: number, o: T): T => Object.fromEntries(Object.entries(o).map(([n, v]) => [n, v * k])) as T;

/** How long the smoke of a shot drifts (a trace: not scaled by VOLLEY_K). */
export const SMOKE_LIFE = 5600;

export const T = {
  /** A shot of the Volley (the volley() of template.html): the fuses, the guns one after another, the balls, the hits. */
  volley: scaled(VOLLEY_K, {
    /** the fuses spit sparks before the first gun */
    fuse: 420,
    /** between two guns of one broadside */
    gunStep: 150,
    /** the flash of a gun (the cone of fire) */
    flash: 420,
    /** the flight of a ball (with its lift); a ball that hits flies a little longer */
    fly: 700,
    flyHit: 820,
    /** a hit: the fireball and the shockwave */
    blast: 520,
    /** a board of the Hull falls off into the sea */
    fall: 1000,
    /** a spout of water of a miss */
    splash: 1700,
    /** after the last ball: the smoke rolls, the marks stay a while */
    linger: 1500,
    /** the plate and the frames fade */
    fade: 450,
    /** the breakdown plate stays after the clip (V5) */
    plateLinger: 2000,
  }),
  /** A Fire burns the Hull at the start of a turn (fxFire of fx3.js): the fire runs along the plank, the boards of the
   *  Hull glow and char one by one, the flames die down; a Fire set by a shot or a card flares up for `ignite`. */
  fire: scaled(FIRE_K, {
    /** the fire runs along the plank before the Hull chars */
    spread: 1200,
    /** between two spots of fire over the plank */
    spot: 110,
    /** a board of the Hull glows red, chars black */
    cell: 900,
    /** between two boards */
    cellStep: 450,
    /** the fire holds after the last board */
    hold: 1300,
    /** the flames die down */
    out: 520,
    /** the glow of the fire on the plank */
    glow: 3600,
    /** a Fire is set: the flame flares up at the head */
    ignite: 900,
  }),
  /** A ship goes down (fxSink of fx3.js): the last hits, the fire, the powder room goes up, the hull breaks in two and
   *  sinks, the plank comes back grey with the stamp, the wreck stays (a trace), the captain rows to the ally. */
  sink: scaled(SINK_K, {
    /** between the three last hits along the plank */
    hit: 280,
    /** the fire takes hold */
    take: 1000,
    /** the powder room goes up: the fireball, the shockwaves, the wreckage flying */
    blast: 600,
    /** a piece of wreckage flies into the sea */
    debris: 1100,
    /** the two halves go down */
    split: 2600,
    /** the water closes */
    settle: 200,
    /** the plank comes back grey */
    back: 700,
    /** the stamp falls */
    stamp: 380,
    /** the longboat: it pushes off, rows across, one stroke of the oars */
    boatIn: 300,
    boat: 3200,
    stroke: 640,
    /** the ally takes the captain aboard: a gold glow of its plank */
    glow: 1400,
    /** the end: the boat fades, the table is still a moment */
    end: 600,
  }),
  /** A change of places (fxSwap of fx3.js): the course is plotted in ink with a compass stamp, the ships lift and sail
   *  along it leaving wakes, settle with a bob and rings; the course fades. */
  swap: scaled(SWAP_K, {
    /** a course drawn with the pen */
    course: 700,
    /** the compass stamp falls on it */
    stamp: 300,
    /** the ships start when the course is plotted */
    plot: 1200,
    /** they sail */
    sail: 1700,
    /** they settle: a bob, rings */
    settle: 700,
    /** the course fades */
    fade: 900,
  }),
  /** A repair (the «repair» branch of runFx, template.html): for each board a new one drops in and the hammer nails it. */
  repair: scaled(REPAIR_K, {
    /** the green frame of the mended ship */
    aura: 1500,
    /** a new board drops into its place */
    drop: 300,
    /** one blow of the hammer (two blows a board) */
    strike: 300,
    /** a board after another */
    unit: 1050,
  }),
  /** A soul (the «souls» branch of runFx): a green wisp with a tail leaves the sailor, curls over the sea, enters the skull. */
  soul: scaled(SOUL_K, {
    fly: 1700,
    /** the skull takes it in: a ring, sparks, a glow */
    arrive: 900,
  }),
  /** Under the water and up (the «dive» / «surface» branches of runFx). */
  dive: scaled(DIVE_K, {
    /** the water rises over the plank («Толща воды») */
    down: 1300,
    /** the whole dive: rings, bubbles */
    hold: 1800,
    /** the water runs off the plank */
    up: 1000,
    /** the plank bobs up */
    rise: 1200,
    /** the green frame of a ship surfaced */
    glow: 1200,
  }),
  /** The entrance of a Legend (legendIntro of fx3.js, ANIMATIONS.md §3.1, ≈ 4.6 s): the medallion calls, the stage dims
   *  between the cinema bars, the card bursts out and turns over, lands, the wax seal stamps it, the name unfurls; the
   *  card collapses into a golden orb that flies to the target. */
  legend: scaled(LEGEND_K, {
    /** the medallion flares (×2.2) with its rings */
    medal: 900,
    /** the dim and the vignette come at… / take */
    backAt: 200,
    back: 500,
    /** the cinema bars slide in at… / take */
    barsAt: 250,
    bars: 450,
    /** the rays behind the middle come at… / take */
    raysAt: 500,
    rays: 900,
    /** the card bursts out of the medallion at… / flies along its arc */
    cardAt: 350,
    fly: 760,
    /** the card turns over (back → face) while it flies */
    flip: 1150,
    /** from the start of the flight to the landing */
    land: 780,
    /** the landing: the shockwave, the burst, the shake — then the seal comes */
    hit: 420,
    /** the seal falls (×3.2 → ×1) */
    seal: 360,
    /** the seal hits: the card quivers, the name unfurls */
    sealHit: 300,
    /** the ribbon with the name unrolls; a letter after a letter */
    ribbon: 520,
    letter: 40,
    /** the card is held, the shine runs over it */
    hold: 1700,
    /** the ribbon and the seal fade, the card collapses into the orb */
    fade: 300,
    collapse: 520,
    orbAt: 470,
    /** the golden orb flies to the target; the dim and the bars go */
    orb: 560,
    orbEnd: 580,
    /** the simple effects (ctx.rich = false): the card in the middle for… */
    simple: 1000,
  }),
  /** «Кракен» (fxKraken of fx3.js, §3.2): the sea darkens, the shadow of the beast, the eye; six arms, three fall across
   *  the plank and squeeze it — the wood cracks under each; the boards and the sailors of the events go; the ink stays. */
  kraken: scaled(KRAKEN_K, {
    /** the dark of the deep comes / the shadow glides under the target */
    deep: 900,
    glide: 1500,
    /** the eye opens at… and lives (opens, looks, blinks, closes) */
    eyeAt: 1300,
    eye: 5200,
    /** the arms burst out of the water after the eye opened */
    armsAt: 800,
    rise: 700,
    riseStep: 160,
    /** the three arms at the edge of the target come a little later */
    gripAt: 350,
    gripStep: 180,
    /** the arms sway before they fall */
    sway: 1500,
    /** the three arms fall across the plank, one after another */
    fall: 420,
    fallStep: 110,
    land: 560,
    /** a squeeze: the crack opens under the arm, the plank is pressed */
    crack: 520,
    squeeze: 440,
    squeezeStep: 480,
    /** a board of the Hull breaks off / a sailor is dragged to the sea */
    board: 900,
    boardStep: 170,
    drag: 900,
    dragStep: 220,
    /** the marks of the damage stay a while */
    after: 800,
    /** the ink bursts; the arms slide down into it */
    ink: 900,
    sink: 700,
    sinkStep: 90,
    release: 800,
    end: 1600,
  }),
  /** «Армада Компании» (fxArmada of fx3.js, §3.3): the line of battle comes in along the gap, a broadside ripples down
   *  it at each target, the hits of the events, the smoke stays (a short trace), the fleet sails away into it. */
  armada: scaled(ARMADA_K, {
    /** the haze of the horizon */
    haze: 3600,
    /** a ship of the line comes in; the next one after… */
    enter: 2200,
    enterStep: 160,
    /** the line is in place: the broadside begins */
    line: 3000,
    /** a ship of the line after the one before it; its three guns after one another */
    ship: 70,
    gun: 40,
    /** a ball flies */
    fly: 420,
    /** after the broadside at a target: the flash, the shake, the boards break */
    land: 500,
    /** before the next target */
    next: 700,
    /** the smoke comes / the fleet sails away into it */
    smoke: 1200,
    leave: 3200,
    leaveStep: 120,
    end: 2400,
  }),
  /** «Корабль в бутылке» (fxBottle of fx3.js, §3.4): the target glows, a bottle on its side draws itself in the gap,
   *  the plank spirals into its mouth, the little ship inside, the cork flies from the owner — «чпок!», the bottle drops
   *  onto the sea and stays afloat (a long trace); the plank comes back grey with the stamp. */
  bottle: scaled(BOTTLE_K, {
    /** the target glows / sparks orbit it (one after another) */
    glow: 900,
    orbit: 2200,
    orbitStep: 30,
    /** the glass draws itself at… for… / the light and the painted sea come at… for… */
    glassAt: 300,
    glass: 1000,
    fillAt: 1150,
    fill: 500,
    /** the glints */
    glintAt: 1100,
    glint: 600,
    glintStep: 70,
    /** the vortex begins / the plank spirals into the mouth */
    vortexAt: 1600,
    vortex: 1500,
    /** the little ship appears inside, at… for… */
    miniAt: 1480,
    mini: 600,
    /** the cork comes after… and flies from the owner */
    corkAt: 650,
    cork: 800,
    /** it pops in */
    pop: 220,
    popAt: 160,
    /** «чпок!» */
    word: 1100,
    /** the bottle lifts and drops onto the sea */
    dropAt: 900,
    drop: 900,
    splashAt: 880,
    /** the plank comes back grey, the stamp falls */
    back: 600,
    stamp: 380,
    end: 900,
  }),
  /** «Джек ускользает» (fxJack of fx3.js, §3.5): she should sink — the water rises, she lists; time freezes (the world
   *  grey, she in colour); the entrance; the compass spins and points to the ally, the golden course; the colour comes
   *  back, she slips along the course with ghosts, the ally the other way; the Hull 2 shines, coins scatter. */
  jack: scaled(JACK_K, {
    /** a board after another breaks (the last ones) */
    board: 160,
    /** the water rises over the plank, she lists, bubbles */
    sink: 1300,
    /** time freezes: the world goes grey */
    freeze: 300,
    /** the rings of the stopped time */
    ring: 1200,
    ringStep: 260,
    /** the compass appears / its needle spins at… for… */
    compass: 600,
    needleAt: 300,
    needle: 2000,
    /** the needle has pointed: the course is drawn */
    point: 2100,
    course: 300,
    /** before she goes */
    go: 400,
    /** the water runs off / the colour comes back / the compass fades */
    drain: 500,
    unfreeze: 500,
    /** she slips along the course with the ghosts; a ghost after a ghost */
    slip: 800,
    ghost: 60,
    /** the Hull 2 shines, the coins */
    shine: 1100,
    end: 1300,
  }),
  /** The start of a round (playRound of template.html, §3.12): the banner, the sea card comes up on its back, turns over,
   *  is shown, flies into the plaque of the sea; the plaque flashes; then what the card does. */
  round: scaled(ROUND_K, {
    /** the banner «— Раунд N —» unrolls and goes; the card comes after… */
    banner: 1500,
    bannerWait: 1300,
    /** the card comes up on its back; it turns over after… */
    cardIn: 380,
    cardWait: 520,
    flip: 560,
    /** the card is shown */
    show: 2200,
    /** it flies into the plaque of the sea */
    fly: 620,
    flyWait: 600,
    /** the plaque takes it with a flash; the effect after… */
    plaque: 1100,
    after: 300,
    /** a weather of the round rolls in over the sea, then stays */
    roll: 1200,
    rollEnd: 1600,
  }),
  /** The sea cards «сразу» (seaEffect2 of template.html, caravan3 and current3 of fx3.js, §3.11). */
  sea: scaled(SEA_K, {
    /** Гроза: the sky goes black; two far flashes; the bolt into the sails; the sails smoulder */
    thunderDim: 4200,
    flash1: 500,
    flash2: 700,
    boltAt: 600,
    bolt: 900,
    burn: 700,
    thunderNext: 500,
    /** Русалки: the tail rises, the song; the sailor is drawn into the sea */
    tail: 2800,
    drawAt: 900,
    draw: 900,
    mermaidNext: 500,
    /** Ром в волнах: the bottle bobs up to the plank, the cork pops, the sailor is back */
    bottle: 1500,
    popAt: 1150,
    cork: 800,
    rumNext: 700,
    /** Торговый караван: the merchantman crosses the sea; it throws the barrels at 40 % of its way */
    caravan: 5200,
    keg: 900,
    kegStep: 200,
    /** Сырой порох: the raincloud over each Hold, the barrels soak */
    cloud: 3000,
    soakAt: 900,
    soak: 900,
    soakStep: 180,
    wetEnd: 1300,
    /** Тортуга: the lanterns of the haven, the Holds glow */
    lantern: 3200,
    lanternStep: 90,
    glowAt: 600,
    glow: 2400,
    tortugaEnd: 3400,
    /** Течение: the gyres; the ships ride the arcs, pair after pair; the rings */
    gyre: 4200,
    rideAt: 900,
    ride: 1600,
    rings: 900,
    currentEnd: 1800,
    /** the end of a card: what is left on the table settles */
    end: 900,
  }),
  /** The windows of the interface (the CSS reads them through custom properties, see Alarm.tsx). */
  ui: {
    /** «Тревога!» rides in from the top / the bell swings */
    alarmIn: 250,
    bell: 600,
  },
} as const;
