const STORAGE_KEY = 'opticalcalc_state_v2';

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
  locks: {
    distance: true,
    sensor: true,
    roi: true,
    lens: false,
  },
};

export function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE, locks: { ...DEFAULT_STATE.locks } };
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      locks: { ...DEFAULT_STATE.locks, ...(parsed.locks || {}) },
    };
  } catch (err) {
    return { ...DEFAULT_STATE, locks: { ...DEFAULT_STATE.locks } };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
