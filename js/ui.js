import { round, fovDegFromMm } from './calc.js';

const inputLockGroup = {
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
  onLockToggle,
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
    resW: document.getElementById('resW'),
    resH: document.getElementById('resH'),
  };

  const lockButtons = document.querySelectorAll('.lock');
  const hfovDeg = document.getElementById('hfovDeg');
  const vfovDeg = document.getElementById('vfovDeg');
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
    inputs.focalLength.value = round(state.focalLength, 8);
    inputs.resW.value = state.resW ? round(state.resW, 0) : '';
    inputs.resH.value = state.resH ? round(state.resH, 0) : '';
    sensorLabel.textContent = state.sensorLabel;

    lockButtons.forEach((btn) => {
      const key = btn.dataset.lock;
      btn.setAttribute('aria-pressed', state.locks[key] ? 'true' : 'false');
    });

    // Disable derived (unlocked) inputs — their value is computed, not typed
    Object.entries(inputs).forEach(([key, input]) => {
      const group = inputLockGroup[key];
      if (group) {
        const isDerived = !state.locks[group];
        input.disabled = isDerived;
        input.classList.toggle('is-derived', isDerived);
      }
    });
  }

  function updateDerived() {
    hfovDeg.textContent = Number.isFinite(state.distance) && Number.isFinite(state.roiW)
      ? `${round(fovDegFromMm(state.distance, state.roiW), 4)}°`
      : '--';
    vfovDeg.textContent = Number.isFinite(state.distance) && Number.isFinite(state.roiH)
      ? `${round(fovDegFromMm(state.distance, state.roiH), 4)}°`
      : '--';

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

  savePresetBtn.addEventListener('click', () => {
    const title = presetTitle.value.trim();
    onPresetSave(title);
    presetTitle.value = '';
  });

  resetViewBtn.addEventListener('click', () => onResetView());

  return { updateInputs, updateDerived, updateStatus, updatePresetList };
}
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
