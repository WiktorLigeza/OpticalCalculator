import { round, fovDegFromMm } from './calc.js';

// maps input field key → solveFor group name
const inputGroup = {
  distance: 'distance',
  sensorW: 'sensor',
  sensorH: 'sensor',
  roiW: 'roi',
  roiH: 'roi',
  focalLength: 'lens',
};

export function bindUI(
  state,
  onInput,
  onSolveFor,
  onRoiAxis,
  onPresetSave,
  onPresetLoad,
  onPresetDelete,
  onResetView
) {
  const inputs = {
    distance: document.getElementById('distance'),
    sensorW: document.getElementById('sensorW'),
    sensorH: document.getElementById('sensorH'),
    roiW: document.getElementById('roiW'),
    roiH: document.getElementById('roiH'),
    focalLength: document.getElementById('focalLength'),
    fNumber: document.getElementById('fNumber'),
    resW: document.getElementById('resW'),
    resH: document.getElementById('resH'),
  };

  const lockButtons = document.querySelectorAll('.lock');
  const solveForButtons = document.querySelectorAll('.solve-for-btn');
  const roiAxisButtons = document.querySelectorAll('.roi-axis-btn');
  const hfovDeg = document.getElementById('hfovDeg');
  const vfovDeg = document.getElementById('vfovDeg');
  const dfovDeg = document.getElementById('dfovDeg');
  const hyperfocalValue = document.getElementById('hyperfocalValue');
  const cocValue = document.getElementById('cocValue');
  const dofNearValue = document.getElementById('dofNearValue');
  const dofFarValue = document.getElementById('dofFarValue');
  const dofFrontValue = document.getElementById('dofFrontValue');
  const dofBehindValue = document.getElementById('dofBehindValue');
  const dofTotalValue = document.getElementById('dofTotalValue');
  const dofSplitValue = document.getElementById('dofSplitValue');
  const pixPerMmX = document.getElementById('pixPerMmX');
  const pixPerMmY = document.getElementById('pixPerMmY');
  const mmPerPixX = document.getElementById('mmPerPixX');
  const mmPerPixY = document.getElementById('mmPerPixY');
  const statusMessage = document.getElementById('statusMessage');
  const presetTitle = document.getElementById('presetTitle');
  const presetList = document.getElementById('presetList');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const resetViewBtn = document.getElementById('resetViewBtn');
  const sensorLabel = document.getElementById('sensorLabel');

  function setIfNotFocused(input, value) {
    if (document.activeElement !== input) input.value = value;
  }

  function updateInputs() {
    setIfNotFocused(inputs.distance, round(state.distance, 1));
    setIfNotFocused(inputs.sensorW, round(state.sensorW, 1));
    setIfNotFocused(inputs.sensorH, round(state.sensorH, 1));
    setIfNotFocused(inputs.roiW, round(state.roiW, 1));
    setIfNotFocused(inputs.roiH, round(state.roiH, 1));
    setIfNotFocused(inputs.focalLength, round(state.focalLength, 1));
    setIfNotFocused(inputs.fNumber, round(state.fNumber, 1));
    setIfNotFocused(inputs.resW, state.resW ? round(state.resW, 0) : '');
    setIfNotFocused(inputs.resH, state.resH ? round(state.resH, 0) : '');
    sensorLabel.textContent = state.sensorLabel;

    // Highlight active solve-for button
    solveForButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.solve === state.solveFor);
    });

    // Highlight active roi-axis button
    roiAxisButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.axis === (state.roiAxis || 'W'));
    });

    // Mark derived (computed) inputs as readonly with distinct style
    Object.entries(inputs).forEach(([key, input]) => {
      const group = inputGroup[key];
      const isDerived = group ? group === state.solveFor : false;
      input.readOnly = isDerived;
      input.classList.toggle('is-derived', isDerived);
    });
  }

  function updateDerived() {
    const aW = state.actualRoiW ?? state.roiW;
    const aH = state.actualRoiH ?? state.roiH;
    hfovDeg.textContent = Number.isFinite(state.distance) && Number.isFinite(aW)
      ? `${round(fovDegFromMm(state.distance, aW), 1)}°`
      : '--';
    vfovDeg.textContent = Number.isFinite(state.distance) && Number.isFinite(aH)
      ? `${round(fovDegFromMm(state.distance, aH), 1)}°`
      : '--';
    const diagMm = Math.sqrt(aW * aW + aH * aH);
    dfovDeg.textContent = Number.isFinite(state.distance) && diagMm > 0
      ? `${round(fovDegFromMm(state.distance, diagMm), 1)}°`
      : '--';

    const dof = state.dof;
    if (dof) {
      hyperfocalValue.textContent = `${round(dof.hyperfocal, 1)} mm`;
      cocValue.textContent = `${round(dof.coc, 1)} mm`;
      dofNearValue.textContent = `${round(dof.nearDist, 1)} mm`;
      dofFarValue.textContent = Number.isFinite(dof.farDist)
        ? `${round(dof.farDist, 1)} mm`
        : '∞';
      dofFrontValue.textContent = `${round(dof.dofFront, 1)} mm`;
      dofBehindValue.textContent = Number.isFinite(dof.dofBehind)
        ? `${round(dof.dofBehind, 1)} mm`
        : '∞';
      dofTotalValue.textContent = Number.isFinite(dof.dofTotal)
        ? `${round(dof.dofTotal, 1)} mm`
        : '∞';
      if (dof.frontFraction !== null) {
        const pct = round(dof.frontFraction * 100, 1);
        const behind = round((1 - dof.frontFraction) * 100, 1);
        const label = Math.abs(dof.frontFraction - 1 / 3) < 0.05 ? ' ≈ 1/3 rule' : '';
        dofSplitValue.textContent = `${pct}% front / ${behind}% behind${label}`;
      } else {
        dofSplitValue.textContent = '∞ far limit';
      }
    } else {
      hyperfocalValue.textContent = '--';
      cocValue.textContent = '--';
      dofNearValue.textContent = '--';
      dofFarValue.textContent = '--';
      dofFrontValue.textContent = '--';
      dofBehindValue.textContent = '--';
      dofTotalValue.textContent = '--';
      dofSplitValue.textContent = '--';
    }

    if (state.resW > 0 && state.resH > 0) {
      pixPerMmX.textContent = round(state.resW / aW, 1);
      pixPerMmY.textContent = round(state.resH / aH, 1);
      mmPerPixX.textContent = round(aW / state.resW, 1);
      mmPerPixY.textContent = round(aH / state.resH, 1);
    } else {
      pixPerMmX.textContent = '--';
      pixPerMmY.textContent = '--';
      mmPerPixX.textContent = '--';
      mmPerPixY.textContent = '--';
    }
  }

  function updateStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.style.color = type === 'error' ? 'var(--error)' : 'var(--muted)';
  }

  function updatePresetList(presets) {
    presetList.innerHTML = '';
    presets.forEach((preset) => {
      const li = document.createElement('li');
      li.className = 'preset-item';
      const title = document.createElement('span');
      title.textContent = preset.title;
      const actions = document.createElement('div');
      actions.className = 'preset-actions';
      const loadBtn = document.createElement('button');
      loadBtn.className = 'load';
      loadBtn.textContent = 'Load';
      loadBtn.addEventListener('click', () => onPresetLoad(preset.id));
      const delBtn = document.createElement('button');
      delBtn.className = 'delete';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => onPresetDelete(preset.id));
      actions.append(loadBtn, delBtn);
      li.append(title, actions);
      presetList.appendChild(li);
    });
  }

  Object.entries(inputs).forEach(([key, input]) => {
    input.addEventListener('input', (event) => {
      const raw = event.target.value.replace(',', '.');
      if (raw === '' || raw === '-' || raw.endsWith('.')) return; // still typing
      const value = Number(raw);
      if (Number.isFinite(value)) {
        onInput(key, value);
      }
    });
  });

  lockButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.lock;
      onSolveFor(key);
    });
  });

  solveForButtons.forEach((btn) => {
    btn.addEventListener('click', () => onSolveFor(btn.dataset.solve));
  });

  roiAxisButtons.forEach((btn) => {
    btn.addEventListener('click', () => onRoiAxis(btn.dataset.axis));
  });

  savePresetBtn.addEventListener('click', () => {
    const title = presetTitle.value.trim();
    onPresetSave(title);
    presetTitle.value = '';
  });

  resetViewBtn.addEventListener('click', () => onResetView());

  return { updateInputs, updateDerived, updateStatus, updatePresetList };
}
