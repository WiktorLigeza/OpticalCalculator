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
  const hfovDeg = document.getElementById('hfovDeg');
  const vfovDeg = document.getElementById('vfovDeg');
  const hyperfocalValue = document.getElementById('hyperfocalValue');
  const cocValue = document.getElementById('cocValue');
  const dofNearValue = document.getElementById('dofNearValue');
  const dofFarValue = document.getElementById('dofFarValue');
  const dofFrontValue = document.getElementById('dofFrontValue');
  const dofBehindValue = document.getElementById('dofBehindValue');
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

  function updateInputs() {
    inputs.distance.value = round(state.distance, 1);
    inputs.sensorW.value = round(state.sensorW, 1);
    inputs.sensorH.value = round(state.sensorH, 1);
    inputs.roiW.value = round(state.roiW, 1);
    inputs.roiH.value = round(state.roiH, 1);
    inputs.focalLength.value = round(state.focalLength, 1);
    inputs.fNumber.value = round(state.fNumber, 1);
    inputs.resW.value = state.resW ? round(state.resW, 0) : '';
    inputs.resH.value = state.resH ? round(state.resH, 0) : '';
    sensorLabel.textContent = state.sensorLabel;

    // Highlight active solve-for button
    solveForButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.solve === state.solveFor);
    });

    // Mark derived (computed) inputs as readonly with distinct style
    Object.entries(inputs).forEach(([key, input]) => {
      const group = inputGroup[key];
      if (group) {
        const isDerived = group === state.solveFor;
        input.readOnly = isDerived;
        input.classList.toggle('is-derived', isDerived);
      }
    });
  }

  function updateDerived() {
    hfovDeg.textContent = Number.isFinite(state.distance) && Number.isFinite(state.roiW)
      ? `${round(fovDegFromMm(state.distance, state.roiW), 1)}°`
      : '--';
    vfovDeg.textContent = Number.isFinite(state.distance) && Number.isFinite(state.roiH)
      ? `${round(fovDegFromMm(state.distance, state.roiH), 1)}°`
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
      dofSplitValue.textContent = '--';
    }

    if (state.resW > 0 && state.resH > 0) {
      pixPerMmX.textContent = round(state.resW / state.roiW, 1);
      pixPerMmY.textContent = round(state.resH / state.roiH, 1);
      mmPerPixX.textContent = round(state.roiW / state.resW, 1);
      mmPerPixY.textContent = round(state.roiH / state.resH, 1);
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
      if (event.target.value === '') {
        onInput(key, 0);
        return;
      }
      const value = Number(event.target.value);
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

  savePresetBtn.addEventListener('click', () => {
    const title = presetTitle.value.trim();
    onPresetSave(title);
    presetTitle.value = '';
  });

  resetViewBtn.addEventListener('click', () => onResetView());

  return { updateInputs, updateDerived, updateStatus, updatePresetList };
}
