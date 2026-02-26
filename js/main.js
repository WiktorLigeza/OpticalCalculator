import { DEFAULT_STATE, loadState, saveState } from './state.js';
import { deriveLens, fovMmFromDeg } from './calc.js';
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
  hfov: 'roi',
  vfov: 'roi',
  refHfov: 'refFov',
  refVfov: 'refFov',
};

function computeDerived() {
  const fitLensData = deriveLens(state.distance, state.sensorW, state.sensorH, state.roiW, state.roiH);
  const refFovW = fovMmFromDeg(state.distance, state.refHfov);
  const refFovH = fovMmFromDeg(state.distance, state.refVfov);
  const refLensData = deriveLens(state.distance, state.sensorW, state.sensorH, refFovW, refFovH);

  state.fitLens = fitLensData.lens;
  state.fitLensW = fitLensData.lensW;
  state.fitLensH = fitLensData.lensH;
  state.fitLensDelta = fitLensData.delta;
  state.refLens = refLensData.lens;
  state.refLensW = refLensData.lensW;
  state.refLensH = refLensData.lensH;
  state.refLensDelta = refLensData.delta;
  state.refFovW = refFovW;
  state.refFovH = refFovH;
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
    fitFovW: state.roiW,
    fitFovH: state.roiH,
    refFovW: state.refFovW,
    refFovH: state.refFovH,
    visibility: state.visibility,
  });
}

function updateState(key, value) {
  const lockKey = lockMap[key];
  if (lockKey && state.locks[lockKey]) {
    ui.updateStatus(`"${lockKey}" is locked. Unlock to change this value.`, 'error');
    ui.updateInputs();
    return;
  }

  if (key === 'hfov') {
    state.roiW = fovMmFromDeg(state.distance, value);
  } else if (key === 'vfov') {
    state.roiH = fovMmFromDeg(state.distance, value);
  } else if (key === 'refHfov') {
    state.refHfov = value;
  } else if (key === 'refVfov') {
    state.refVfov = value;
  } else {
    state[key] = value;
  }

  computeDerived();
  updateUI();
}

function toggleLock(key) {
  state.locks[key] = !state.locks[key];
  updateUI();
}

function toggleVisibility(key) {
  state.visibility[key] = !state.visibility[key];
  updateUI();
}

function refreshStatus() {
  if (state.roiW <= 0 || state.roiH <= 0) {
    ui.updateStatus('ROI dimensions must be positive.', 'error');
    return;
  }

  if (state.refFovW && (state.roiW > state.refFovW || state.roiH > state.refFovH)) {
    ui.updateStatus('ROI exceeds reference FOV. Increase reference FOV or distance.', 'error');
    return;
  }

  if (state.fitLensDelta > 0.3 || state.refLensDelta > 0.3) {
    ui.updateStatus('FOV aspect mismatch with sensor size. Check sensor or FOV values.', 'error');
    return;
  }

  if (state.sensorLabel.includes('verify')) {
    ui.updateStatus('Sensor size is set to a placeholder. Update to the exact IMX5030 dimensions.');
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
    visibility: { ...DEFAULT_STATE.visibility, ...(snapshot.visibility || {}) },
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
  toggleVisibility,
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
  fitFovW: state.roiW,
  fitFovH: state.roiH,
  refFovW: state.refFovW,
  refFovH: state.refFovH,
  visibility: state.visibility,
});
