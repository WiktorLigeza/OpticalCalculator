const STORAGE_KEY = 'opticalcalc_state_v1';

export const DEFAULT_STATE = {
  distance: 2000,
  roiW: 850,
  roiH: 1250,
  refHfov: 30,
  refVfov: 20,
  sensorW: 8.8,
  sensorH: 6.6,
  sensorLabel: 'Sony IMX5030 (verify size)',
  resW: 0,
  resH: 0,
  visibility: {
    fitFov: true,
    refFov: true,
  },
  locks: {
    distance: true,
    roi: true,
    sensor: true,
    refFov: false,
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
      visibility: { ...DEFAULT_STATE.visibility, ...(parsed.visibility || {}) },
      locks: { ...DEFAULT_STATE.locks, ...(parsed.locks || {}) },
    };
  } catch (err) {
    return { ...DEFAULT_STATE, locks: { ...DEFAULT_STATE.locks } };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
