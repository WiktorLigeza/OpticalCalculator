import { DEFAULT_STATE, loadState, saveState } from './state.js';
import { computeUnlockedGroup, computeDoF } from './calc.js';
import { loadPresets, addPreset, removePreset } from './presets.js';
import { bindUI } from './ui.js';
import { createScene } from './three-scene.js';

let state = loadState();
let presets = loadPresets();

const lockMap = {
  distance: 'distance',
  sensorW: 'sensor',
  sensorH: 'sensor',
  roiW: 'roi',
  roiH: 'roi',
  focalLength: 'lens',
  fNumber: null, // never locked — pure DoF input
};

function computeDerived() {
  const result = computeUnlockedGroup(state);
  Object.assign(state, result);

  const dof = computeDoF(state.distance, state.focalLength, state.fNumber, state.sensorW, state.sensorH);
  state.dof = dof;
}

function updateUI() {
  saveState(state);
  ui.updateInputs();
  ui.updateDerived();
  refreshStatus();
  scene.update({
    distance: state.distance,
    roiW: state.roiW,
    roiH: state.roiH,
    dof: state.dof,
  });
}

function updateState(key, value) {
  const lockKey = lockMap[key];
  if (lockKey && state.locks[lockKey]) {
    ui.updateStatus(`"${lockKey}" is locked. Unlock to change this value.`, 'error');
    ui.updateInputs();
    return;
  }

  state[key] = value;
  computeDerived();
  updateUI();
}

function toggleLock(key) {
  state.locks[key] = !state.locks[key];
  computeDerived();
  updateUI();
}

function refreshStatus() {
  if (state.roiW <= 0 || state.roiH <= 0) {
    ui.updateStatus('ROI dimensions must be positive.', 'error');
    return;
  }
  if (state.focalLength <= 0) {
    ui.updateStatus('Focal length must be positive.', 'error');
    return;
  }
  const lockedCount = Object.values(state.locks).filter(Boolean).length;
  if (lockedCount === 4) {
    ui.updateStatus('All groups locked — unlock one to derive its value.', 'error');
    return;
  }
  if (state.sensorLabel && state.sensorLabel.includes('verify')) {
    ui.updateStatus('Sensor size is a placeholder. Update to exact dimensions.');
    return;
  }
  ui.updateStatus('All values consistent.');
}

function handlePresetSave(title) {
  const finalTitle = title || `Preset ${presets.length + 1}`;
  const preset = {
    id: crypto.randomUUID(),
    title: finalTitle,
    state: JSON.parse(JSON.stringify(state)),
  };
  presets = addPreset(presets, preset);
  ui.updatePresetList(presets);
}

function handlePresetLoad(id) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return;

  const snapshot = JSON.parse(JSON.stringify(preset.state || {}));
  const normalized = {
    ...DEFAULT_STATE,
    ...snapshot,
    locks: { ...DEFAULT_STATE.locks, ...(snapshot.locks || {}) },
  };

  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, normalized);

  computeDerived();
  updateUI();
}

function handlePresetDelete(id) {
  presets = removePreset(presets, id);
  ui.updatePresetList(presets);
}

const scene = createScene(document.getElementById('sceneWrap'));

const ui = bindUI(
  state,
  updateState,
  toggleLock,
  handlePresetSave,
  handlePresetLoad,
  handlePresetDelete,
  () => scene.resetView()
);

computeDerived();
ui.updateInputs();
ui.updateDerived();
ui.updatePresetList(presets);
refreshStatus();
scene.update({
  distance: state.distance,
  roiW: state.roiW,
  roiH: state.roiH,
  dof: state.dof,
});
