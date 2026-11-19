// Platinum Atlas — saved progress and settings (localStorage), plus export/import.
// Nothing here touches the network: progress lives in this browser only.
export const EARNED_KEY = 'platinum-atlas-earned-v1';
export const SETTINGS_KEY = 'platinum-atlas-settings-v1';

// loadEarned: the saved set of earned trophy ids (numbers), or an empty set.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

// saveEarned: persist the earned set.
export function saveEarned(earned) {
  try {
    localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or unavailable: the checklist still works in memory.
  }
}

// loadSettings: spoiler setting and friends, with safe defaults.
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { spoilersHidden: false };
    const parsed = JSON.parse(raw);
    return { spoilersHidden: parsed.spoilersHidden === true };
  } catch {
    return { spoilersHidden: false };
  }
}

// saveSettings: persist the settings object.
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: the setting still applies for this visit.
  }
}

// exportProgress: download the earned ids as a JSON file.
export function exportProgress(earned) {
  const payload = {
    app: 'platinum-atlas',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'platinum-atlas-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// importProgress: read an exported file and return its earned-id set, or null when invalid.
export async function importProgress(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) return null;
    const clean = ids.filter((n) => Number.isInteger(n));
    if (clean.length === 0 && ids.length !== 0) return null;
    return new Set(clean);
  } catch {
    return null;
  }
}
