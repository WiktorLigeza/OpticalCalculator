const EPS = 1e-6;

/**
 * Multi-way calculator: given distance, sensorW/H, roiW/H, focalLength —
 * computes the first unlocked group from the other three.
 *
 * Optical relation: focalLength = distance * sensorW / roiW
 *                                = distance * sensorH / roiH
 */
export function computeUnlockedGroup(state) {
  const { distance, sensorW, sensorH, roiW, roiH, focalLength, solveFor } = state;
  const f = Math.max(focalLength, EPS);
  const d = Math.max(distance, EPS);
  const sW = Math.max(sensorW, EPS);
  const sH = Math.max(sensorH, EPS);
  const rW = Math.max(roiW, EPS);
  const rH = Math.max(roiH, EPS);

  if (solveFor === 'lens') {
    return { focalLength: d * sW / rW };
  }
  if (solveFor === 'distance') {
    return { distance: f * rW / sW };
  }
  if (solveFor === 'roi') {
    return { roiW: d * sW / f, roiH: d * sH / f };
  }
  if (solveFor === 'sensor') {
    return { sensorW: f * rW / d, sensorH: f * rH / d };
  }
  return {};
}

export function fovDegFromMm(distance, fovMm) {
  const safeDistance = Math.max(distance, EPS);
  const halfAngle = Math.atan((fovMm / 2) / safeDistance);
  return (halfAngle * 2 * 180) / Math.PI;
}

/**
 * Depth of field calculation using hyperfocal method.
 * Circle of confusion derived from sensor diagonal / 1500 (standard machine-vision CoC).
 * Hyperfocal: H = f² / (N·c) + f
 * Near limit:  Dn = H·d / (H + d − f)
 * Far limit:   Df = H·d / (H − d + f)   [∞ when d ≥ H]
 */
export function computeDoF(distance, focalLength, fNumber, sensorW, sensorH) {
  const d = Math.max(distance, EPS);
  const f = Math.max(focalLength, EPS);
  const N = Math.max(fNumber, EPS);
  const diagonal = Math.sqrt(sensorW * sensorW + sensorH * sensorH);
  const coc = diagonal / 1500;

  const hyperfocal = (f * f) / (N * coc) + f;

  const nearDist = (hyperfocal * d) / (hyperfocal + d - f);

  const farDenom = hyperfocal - d + f;
  const farDist = farDenom <= EPS ? Infinity : (hyperfocal * d) / farDenom;

  const dofFront = d - nearDist;
  const dofBehind = Number.isFinite(farDist) ? farDist - d : Infinity;
  const dofTotal = Number.isFinite(farDist) ? farDist - nearDist : Infinity;

  // frontFraction: ideally ~0.33 (1/3 rule) at moderate distances
  const frontFraction = Number.isFinite(dofTotal) && dofTotal > EPS
    ? dofFront / dofTotal
    : null;

  return { coc, hyperfocal, nearDist, farDist, dofFront, dofBehind, dofTotal, frontFraction };
}

export function round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
