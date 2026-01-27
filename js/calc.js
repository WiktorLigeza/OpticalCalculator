const EPS = 1e-6;

export function deriveLens(distance, sensorW, sensorH, fovW, fovH) {
  const lensW = distance * sensorW / Math.max(fovW, EPS);
  const lensH = distance * sensorH / Math.max(fovH, EPS);
  const lens = (lensW + lensH) / 2;
  const delta = Math.abs(lensW - lensH);
  return { lens, lensW, lensH, delta };
}

export function computeFov(distance, sensorW, sensorH, lens) {
  const fovW = distance * sensorW / Math.max(lens, EPS);
  const fovH = distance * sensorH / Math.max(lens, EPS);
  return { fovW, fovH };
}

export function coverageStatus(roiW, roiH, fovW, fovH) {
  const fits = roiW <= fovW && roiH <= fovH;
  const areaRatio = (roiW * roiH) / Math.max(fovW * fovH, EPS);
  return {
    fits,
    areaRatio,
    widthRatio: roiW / Math.max(fovW, EPS),
    heightRatio: roiH / Math.max(fovH, EPS),
  };
}

export function fovDegFromMm(distance, fovMm) {
  const safeDistance = Math.max(distance, EPS);
  const halfAngle = Math.atan((fovMm / 2) / safeDistance);
  return (halfAngle * 2 * 180) / Math.PI;
}

export function fovMmFromDeg(distance, fovDeg) {
  const safeDistance = Math.max(distance, EPS);
  const clamped = Math.min(Math.max(fovDeg, 0.001), 179.9);
  const halfAngle = (clamped * Math.PI) / 360;
  return 2 * safeDistance * Math.tan(halfAngle);
}

export function round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
