// Junkwing flight core. Deterministic, fixed-step physics with no DOM/Firebase dependencies.
// World units are meters, seconds, kilograms and radians. Positive Y is altitude.
export const FIXED_STEP = 1 / 120;
export const MAX_RUN_SECONDS = 120;
export const UPGRADE_IDS = Object.freeze(['sling', 'ramp', 'wings', 'engine', 'controls', 'frame', 'income']);
export const AIRFRAMES = Object.freeze([
  { id: 'flyer', name: '1903 Flyer', unlock: 0, price: 0, mass: 210, wing: 7.7, drag: 1.45, thrust: 90 },
  { id: 'scout', name: 'Spruce Scout', unlock: 300, price: 500, mass: 235, wing: 9.0, drag: 1.40, thrust: 170 },
  { id: 'biplane', name: 'Barnstormer', unlock: 650, price: 1800, mass: 270, wing: 10.6, drag: 1.56, thrust: 310 },
  { id: 'monoplane', name: 'Silverwing', unlock: 1100, price: 5500, mass: 255, wing: 11.0, drag: 1.20, thrust: 440 },
  { id: 'racer', name: 'Sky Racer', unlock: 1600, price: 12000, mass: 300, wing: 12.3, drag: 1.03, thrust: 650 },
  { id: 'experimental', name: 'X-1903', unlock: 2050, price: 25000, mass: 340, wing: 14.1, drag: 0.95, thrust: 900 }
]);
// Scenic obstacles and their collision envelopes share one world coordinate system.
export const LANDMARKS = Object.freeze([
  { x: -95, type: 'hangar' }, { x: 240, type: 'tower' },
  { x: 520, type: 'windmill' }, { x: 950, type: 'balloon' },
  { x: 1510, type: 'windmill' }, { x: 2100, type: 'tower' },
]);

export function treeAt(index) {
  const x = index * 29;
  if (x < 75 || (index % 8 === 2 && x < 275)) return null;
  return { x, height: 7 + Math.abs(Math.sin(index * 2.3)) * 7 };
}

const UPGRADE_BASE_COST = Object.freeze({
  sling: 45, ramp: 55, wings: 65, engine: 90, controls: 50, frame: 70, income: 65,
});
export const MAX_UPGRADE_LEVEL = 12;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function terrainHeight(x) {
  // Natural hills; runway at x=0 and no discontinuities.
  if (x < 60) return 0;
  const blend = clamp((x - 60) / 140, 0, 1);
  return blend * (2.3 * Math.sin(x / 117) + 1.4 * Math.sin(x / 47));
}

export function costFor(id, level) {
  if (!Object.hasOwn(UPGRADE_BASE_COST, id)) throw new Error('Unknown upgrade: ' + id);
  return Math.round(UPGRADE_BASE_COST[id] * Math.pow(1.55, clamp(level, 0, MAX_UPGRADE_LEVEL)));
}

export function sanitizeUpgrades(raw = {}) {
  return Object.fromEntries(UPGRADE_IDS.map((id) => [
    id, clamp(Math.floor(Number(raw[id]) || 0), 0, MAX_UPGRADE_LEVEL),
  ]));
}

export function getAirframe(id) {
  return AIRFRAMES.find((frame) => frame.id === id) ?? AIRFRAMES[0];
}

export function getTuning(upgradesInput = {}, airframeId = 'flyer') {
  const upgrades = sanitizeUpgrades(upgradesInput);
  const frame = getAirframe(airframeId);
  return {
    mass: frame.mass * 1.08 + 5 * upgrades.frame,
    wingArea: frame.wing * 1.18 * (1 + 0.058 * upgrades.wings),
    dragArea: frame.drag * (1 - 0.012 * upgrades.frame),
    thrust: frame.thrust + 56 * upgrades.engine,
    fuelSeconds: 8.5 + 1.85 * upgrades.engine,
    launchSpeed: 31 + 2.85 * upgrades.sling + (frame.id === 'flyer' ? 0 : 1.6),
    rampAngle: 0.22 + 0.018 * upgrades.ramp,
    controlRate: 1.02 + 0.065 * upgrades.controls,
    controlDamping: 2.55,
    stallAngle: 0.235 + 0.0085 * upgrades.wings,
    airframeId: frame.id,
  };
}

export function makeRun(upgrades, airframeId, pull = 1) {
  const tune = getTuning(upgrades, airframeId);
  const power = clamp(Number(pull) || 0, 0, 1);
  const speed = tune.launchSpeed * (0.28 + 0.72 * power);
  return {
    x: 0,
    y: terrainHeight(0) + 6.8,
    z: 0,
    vx: speed * Math.cos(tune.rampAngle),
    vy: speed * Math.sin(tune.rampAngle),
    vz: 0,
    pitch: tune.rampAngle,
    pitchRate: 0,
    yaw: 0,
    yawRate: 0,
    roll: 0,
    time: 0,
    distance: 0,
    peakHeight: 6.8,
    fuel: tune.fuelSeconds,
    ended: false,
    endReason: null,
    tuning: tune,
  };
}

function angularDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function stepRun(run, control = 0, dt = FIXED_STEP) {
  if (run.ended) return run;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05) throw new RangeError('Use a fixed step of at most 0.05 seconds');

  const tune = run.tuning;
  const pitchInput = clamp(
    typeof control === 'number' ? (Number(control) || 0) : (Number(control?.pitch) || 0),
    -1, 1);
  const turnInput = clamp(
    typeof control === 'object' ? (Number(control?.turn) || 0) : 0,
    -1, 1);

  // Arcade-flight principle: inputs request a pitch rate, but the airframe has inertia.
  // Releasing the input lets the aircraft gently seek the flight path instead of snapping level.
  const horizontalBefore = Math.max(0.001, Math.hypot(run.vx, run.vz));
  const flightAngleBefore = Math.atan2(run.vy, horizontalBefore);
  const stability = clamp(angularDifference(flightAngleBefore + 0.035, run.pitch), -0.45, 0.45);
  run.pitchRate += (
    pitchInput * tune.controlRate +
    stability * 0.72 -
    run.pitchRate * tune.controlDamping
  ) * dt;
  run.pitch = clamp(run.pitch + run.pitchRate * dt, -0.62, 0.78);

  // Banking produces the turn. No direct sideways velocity injection.
  const bankLimit = 0.36 + Math.min(0.10, (tune.controlRate - 1) * 0.18);
  const bankTarget = -turnInput * bankLimit;
  run.roll += (bankTarget - run.roll) * Math.min(1, dt * (2.4 + tune.controlRate * 0.45));

  const horizontalSpeed = Math.max(0.001, Math.hypot(run.vx, run.vz));
  let heading = Math.atan2(run.vz, run.vx);
  const coordinatedTurnRate = -Math.tan(run.roll) * 9.81 /
    Math.max(17, horizontalSpeed) * clamp(horizontalSpeed / 28, 0.42, 1.15);
  heading += coordinatedTurnRate * dt;
  run.yaw = heading;
  run.yawRate = coordinatedTurnRate;

  const speed = Math.max(0.001, Math.hypot(horizontalSpeed, run.vy));
  const flightAngle = Math.atan2(run.vy, horizontalSpeed);
  const alpha = angularDifference(run.pitch, flightAngle);
  const absAlpha = Math.abs(alpha);
  const stallExcess = Math.max(0, absAlpha - tune.stallAngle);
  const stall = stallExcess <= 0 ? 1 : clamp(1 - stallExcess * 4.4, 0.025, 1);

  // More lift is useful only while airspeed and angle-of-attack stay healthy.
  const liftCoefficient = clamp((0.30 + 2.55 * alpha) * stall, -0.58, 1.42);
  const airDensity = 1.225 * Math.exp(-Math.max(0, run.y) / 9200);
  const pressure = 0.5 * airDensity * speed * speed;
  const lift = pressure * tune.wingArea * liftCoefficient;
  const induced = liftCoefficient * liftCoefficient;
  const controlDeflection = Math.abs(pitchInput);
  const controlSurfaceDrag = pressure * tune.dragArea *
    Math.max(0, controlDeflection - 0.12) ** 2 * 2.8;
  const drag = pressure * tune.dragArea *
    (0.31 + 0.47 * induced + stallExcess * 3.7) + controlSurfaceDrag;

  const power = run.fuel > 0 ? tune.thrust : 0;
  const pathCos = horizontalSpeed / speed;
  const pathSin = run.vy / speed;
  const forwardAccel =
    (power * Math.cos(run.pitch) - drag * pathCos) / tune.mass;
  const verticalAccel =
    (lift * Math.cos(run.roll) + power * Math.sin(run.pitch) - drag * pathSin) /
      tune.mass - 9.81;

  const nextHorizontal = Math.max(0.01, horizontalSpeed + forwardAccel * dt);
  run.vx = nextHorizontal * Math.cos(heading);
  run.vz = nextHorizontal * Math.sin(heading);
  run.vy += verticalAccel * dt;

  run.x += run.vx * dt;
  run.y += run.vy * dt;
  run.z += run.vz * dt;
  run.time += dt;
  run.fuel = Math.max(0, run.fuel - dt);
  run.distance = Math.max(run.distance, run.x);
  run.peakHeight = Math.max(run.peakHeight, run.y);

  // Landing tolerates a shallow arrival; hard dives still terminate immediately.
  const ground = terrainHeight(run.x + (run.worldOffset || 0));
  if (run.y <= ground + 1.0) {
    run.y = ground + 1.0;
    run.ended = true;
    run.endReason = 'landed';
  } else if (run.time >= MAX_RUN_SECONDS || run.x < -80 || Math.abs(run.z) > 620) {
    run.ended = true;
    run.endReason = 'timeout';
  }

  if (!run.ended && (!run.stage || run.stage === 0)) {
    const tree = treeAt(Math.round(run.x / 29));
    if (tree && Math.abs(run.x - tree.x) < 2.0 && Math.abs(run.z) < 18 &&
        run.y < terrainHeight(tree.x) + tree.height - .5) {
      run.ended = true;
      run.endReason = 'tree';
    }
    for (const mark of LANDMARKS) {
      if (run.ended) break;
      const markGround = terrainHeight(mark.x);
      if (mark.type === 'tower' && Math.abs(run.x - mark.x) < 3.5 &&
          Math.abs(run.z) < 8 && run.y < markGround + 23) {
        run.ended = true;
        run.endReason = 'tower';
      } else if (mark.type === 'windmill' && Math.abs(run.x - mark.x) < 10 &&
          Math.abs(run.z) < 14 && run.y < markGround + 53) {
        run.ended = true;
        run.endReason = 'windmill';
      } else if (mark.type === 'balloon' &&
          Math.hypot(run.x - (mark.x + 6), run.y - (markGround + 60), run.z) < 13.5) {
        run.ended = true;
        run.endReason = 'balloon';
      }
    }
  }
  return run;
}

export function flightReward(run, upgrades = {}) {
  const u = sanitizeUpgrades(upgrades);
  const base = run.distance * 0.35 + Math.max(0, run.peakHeight - 6.8) * 1.7 + run.time * 2;
  return Math.max(1, Math.round(base * (1 + u.income * 0.15)));
}

// Reuse a bounded accumulator in the browser: do not scale forces with render FPS.
export function integrateSteps(run, control, elapsed, carry = 0) {
  const next = clamp(Number(elapsed) || 0, 0, 0.1) + clamp(carry, 0, FIXED_STEP);
  const count = Math.min(12, Math.floor((next + 1e-10) / FIXED_STEP));
  for (let i = 0; i < count && !run.ended; i++) stepRun(run, control);
  return Math.max(0, next - count * FIXED_STEP);
}
