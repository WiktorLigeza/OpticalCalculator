import { DEFAULT_STATE, loadState, saveState } from './state.js';
import { computeUnlockedGroup, computeDoF } from './calc.js';
import { loadPresets, addPreset, removePreset } from './presets.js';
import { bindUI } from './ui.js';
import { createScene } from './three-scene.js';

let state = loadState();
let presets = loadPresets();

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
  state[key] = value;
  computeDerived();
  updateUI();
}

function setSolveFor(key) {
  state.solveFor = key;
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
  const label = { distance: 'Distance', sensor: 'Sensor', roi: 'ROI', lens: 'Focal Length' };
  ui.updateStatus(`Solving for: ${label[state.solveFor] ?? state.solveFor}`);
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
  setSolveFor,
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
