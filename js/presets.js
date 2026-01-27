const PRESET_KEY = 'opticalcalc_presets_v1';

export function loadPresets() {
  try {
    const stored = localStorage.getItem(PRESET_KEY);
    if (!stored) return [];
    return JSON.parse(stored) || [];
  } catch (err) {
    return [];
  }
}

export function savePresets(presets) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

export function addPreset(presets, preset) {
  const next = [preset, ...presets];
  savePresets(next);
  return next;
}

export function removePreset(presets, id) {
  const next = presets.filter((item) => item.id !== id);
  savePresets(next);
  return next;
}
