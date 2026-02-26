import { round, coverageStatus, fovDegFromMm, fovMmFromDeg } from './calc.js';

export function bindUI(
  state,
  onInput,
  onLockToggle,
  onVisibilityToggle,
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
    hfov: document.getElementById('hfov'),
    vfov: document.getElementById('vfov'),
    refHfov: document.getElementById('refHfov'),
    refVfov: document.getElementById('refVfov'),
    resW: document.getElementById('resW'),
    resH: document.getElementById('resH'),
  };

  const lockButtons = document.querySelectorAll('.lock');
  const visibilityButtons = document.querySelectorAll('.visibility');
  const lensFitWValue = document.getElementById('lensFitWValue');
  const lensFitHValue = document.getElementById('lensFitHValue');
  const lensRefWValue = document.getElementById('lensRefWValue');
  const lensRefHValue = document.getElementById('lensRefHValue');
  const coverageFitValue = document.getElementById('coverageFitValue');
  const coverageRefValue = document.getElementById('coverageRefValue');
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
    inputs.distance.value = round(state.distance, 6);
    inputs.sensorW.value = round(state.sensorW, 8);
    inputs.sensorH.value = round(state.sensorH, 8);
    inputs.roiW.value = round(state.roiW, 6);
    inputs.roiH.value = round(state.roiH, 6);
    inputs.hfov.value = round(fovDegFromMm(state.distance, state.roiW), 8);
    inputs.vfov.value = round(fovDegFromMm(state.distance, state.roiH), 8);
    inputs.refHfov.value = round(state.refHfov, 8);
    inputs.refVfov.value = round(state.refVfov, 8);
    inputs.resW.value = state.resW ? round(state.resW, 0) : '';
    inputs.resH.value = state.resH ? round(state.resH, 0) : '';
    sensorLabel.textContent = state.sensorLabel;

    lockButtons.forEach((btn) => {
      const key = btn.dataset.lock;
      btn.setAttribute('aria-pressed', state.locks[key] ? 'true' : 'false');
    });

    visibilityButtons.forEach((btn) => {
      const key = btn.dataset.visible;
      btn.setAttribute('aria-pressed', state.visibility[key] ? 'true' : 'false');
    });
  }

  function updateDerived() {
    lensFitWValue.textContent = Number.isFinite(state.fitLensW) ? `${round(state.fitLensW, 8)} mm` : '--';
    lensFitHValue.textContent = Number.isFinite(state.fitLensH) ? `${round(state.fitLensH, 8)} mm` : '--';
    lensRefWValue.textContent = Number.isFinite(state.refLensW) ? `${round(state.refLensW, 8)} mm` : '--';
    lensRefHValue.textContent = Number.isFinite(state.refLensH) ? `${round(state.refLensH, 8)} mm` : '--';

    const fitCoverage = coverageStatus(state.roiW, state.roiH, state.roiW, state.roiH);
    const fitRatio = Math.min(fitCoverage.areaRatio * 100, 999);
    coverageFitValue.textContent = `${round(fitRatio, 1)}% ROI coverage`;
    coverageFitValue.style.color = 'var(--success)';

    const refFovW = fovMmFromDeg(state.distance, state.refHfov);
    const refFovH = fovMmFromDeg(state.distance, state.refVfov);
    const refCoverage = coverageStatus(state.roiW, state.roiH, refFovW, refFovH);
    const refRatio = Math.min(refCoverage.areaRatio * 100, 999);
    coverageRefValue.textContent = refCoverage.fits
      ? `${round(refRatio, 1)}% ROI coverage`
      : 'ROI exceeds FOV';
    coverageRefValue.style.color = refCoverage.fits ? 'var(--success)' : 'var(--error)';

    if (state.resW > 0 && state.resH > 0) {
      pixPerMmX.textContent = round(state.resW / state.roiW, 8);
      pixPerMmY.textContent = round(state.resH / state.roiH, 8);
      mmPerPixX.textContent = round(state.roiW / state.resW, 8);
      mmPerPixY.textContent = round(state.roiH / state.resH, 8);
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
      onLockToggle(key);
    });
  });

  visibilityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.visible;
      onVisibilityToggle(key);
    });
  });

  savePresetBtn.addEventListener('click', () => {
    const title = presetTitle.value.trim();
    onPresetSave(title);
    presetTitle.value = '';
  });

  resetViewBtn.addEventListener('click', () => onResetView());

  return { updateInputs, updateDerived, updateStatus, updatePresetList };
}
