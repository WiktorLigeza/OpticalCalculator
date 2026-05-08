const EPS = 1e-6;

/**
 * Multi-way calculator: given distance, sensorW/H, roiW/H, focalLength —
 * computes the first unlocked group from the other three.
 *
 * Optical relation: focalLength = distance * sensorW / roiW
 *                                = distance * sensorH / roiH
 */
export function computeUnlockedGroup(state) {
  const { distance, sensorW, sensorH, roiW, roiH, focalLength, locks } = state;
  const f = Math.max(focalLength, EPS);
  const d = Math.max(distance, EPS);
  const sW = Math.max(sensorW, EPS);
  const sH = Math.max(sensorH, EPS);
  const rW = Math.max(roiW, EPS);
  const rH = Math.max(roiH, EPS);

  if (!locks.lens) {
    return { focalLength: d * sW / rW };
  }
  if (!locks.distance) {
    return { distance: f * rW / sW };
  }
  if (!locks.roi) {
    return { roiW: d * sW / f, roiH: d * sH / f };
  }
  if (!locks.sensor) {
    return { sensorW: f * rW / d, sensorH: f * rH / d };
  }
  return {};
}

export function fovDegFromMm(distance, fovMm) {
  const safeDistance = Math.max(distance, EPS);
  const halfAngle = Math.atan((fovMm / 2) / safeDistance);
  return (halfAngle * 2 * 180) / Math.PI;
}

export function round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
