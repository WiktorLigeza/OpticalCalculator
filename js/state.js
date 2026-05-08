const STORAGE_KEY = 'opticalcalc_state_v3';

export const DEFAULT_STATE = {
  distance: 2000,
  sensorW: 8.8,
  sensorH: 6.6,
  sensorLabel: 'Sony IMX5030 (verify size)',
  roiW: 850,
  roiH: 1250,
  focalLength: 12,
  fNumber: 2.8,
  resW: 0,
  resH: 0,
  solveFor: 'lens',
};

export function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_STATE, ...parsed };
  } catch (err) {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
