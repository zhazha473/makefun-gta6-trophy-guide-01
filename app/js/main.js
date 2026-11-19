// Platinum Atlas — bootstrap: load the trophy list, wire the controls, render.
// The app fetches only app/data/trophies.json, a file of its own; nothing else.
import { loadEarned, saveEarned, loadSettings, saveSettings, exportProgress, importProgress } from './store.js';
import { renderChecklist, renderRoadmap, renderMissables, buildRoadmap } from './views.js';

const rows = document.getElementById('rows');
const empty = document.getElementById('empty');
const viewHint = document.getElementById('viewHint');
const railStages = document.getElementById('railStages');

const state = {
  trophies: [],
  earned: loadEarned(),
  settings: loadSettings(),
  filters: { kind: 'all', grade: 'all', earned: 'all', query: '' },
  view: 'checklist',
  openGuide: null,
  save() {
    saveEarned(state.earned);
  },
  rerender() {
    renderAll();
  },
};

const doc = await (await fetch('data/trophies.json')).json();
state.trophies = doc.trophies;

// suggestNextTrophy: the next unearned trophy in roadmap order (stage, then id).
export function suggestNextTrophy() {
  const ordered = [...state.trophies].sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
  return ordered.find((t) => !state.earned.has(t.id)) ?? null;
}

// renderProgress: the big count, per-grade counts and the platinum bar.
function renderProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  document.getElementById('earnedCount').textContent = String(earned);
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of state.trophies) {
    counts[t.grade][1] += 1;
    if (state.earned.has(t.id)) counts[t.grade][0] += 1;
  }
  document.getElementById('gradeCounts').textContent =
    `Platinum ${counts.platinum[0]}/${counts.platinum[1]} · Gold ${counts.gold[0]}/${counts.gold[1]} · Silver ${counts.silver[0]}/${counts.silver[1]} · Bronze ${counts.bronze[0]}/${counts.bronze[1]}`;
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  document.getElementById('platinumFill').style.width = pct + '%';
  document.getElementById('platinumLabel').textContent = 'Platinum progress: ' + pct + '%';
  const missables = state.trophies.filter((t) => t.missable).length;
  document.getElementById('missableCount').textContent = '(' + missables + ')';
}

// renderRail: the sticky roadmap rail — six stages with their earned counts.
function renderRail() {
  railStages.replaceChildren();
  for (const stage of buildRoadmap(state.trophies)) {
    const earnedHere = stage.trophies.filter((t) => state.earned.has(t.id)).length;
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'rail-stage';
    const name = document.createElement('span');
    name.className = 'n';
    name.textContent = stage.name;
    const count = document.createElement('span');
    count.className = 'c';
    count.textContent = `${earnedHere}/${stage.trophies.length}`;
    row.append(name, count);
    const bar = document.createElement('div');
    bar.className = 'railbar';
    const fill = document.createElement('span');
    fill.style.width = (stage.trophies.length === 0 ? 0 : Math.round((earnedHere / stage.trophies.length) * 100)) + '%';
    bar.append(fill);
    li.append(row, bar);
    li.addEventListener('click', () => setView('roadmap'));
    railStages.append(li);
  }
}

// renderAll: progress, rail and the current view.
function renderAll() {
  renderProgress();
  renderRail();
  for (const tab of document.querySelectorAll('.tabs button')) {
    tab.setAttribute('aria-selected', String(tab.dataset.view === state.view));
  }
  if (state.view === 'roadmap') {
    viewHint.hidden = false;
    viewHint.textContent = 'The road to the platinum, in the order to play it — story first, side strands next, then activities, collectibles and cleanup.';
    renderRoadmap(rows, state.trophies, state);
    empty.hidden = true;
  } else if (state.view === 'missables') {
    viewHint.hidden = false;
    viewHint.textContent = 'Every trophy that can be missed, with the moment it closes. Spoilers on: story trophies stay hidden until earned.';
    renderMissables(rows, state.trophies, state);
    empty.hidden = true;
  } else {
    viewHint.hidden = true;
    const shown = renderChecklist(rows, state.trophies, state, onToggleEarned, onOpenGuide);
    empty.hidden = shown !== 0;
  }
}

// onToggleEarned: a checkbox flip — save and re-render.
function onToggleEarned(id, checked) {
  if (checked) state.earned.add(id);
  else state.earned.delete(id);
  state.save();
  renderAll();
}

// onOpenGuide: click a row — open its guide, or close it when already open.
function onOpenGuide(id) {
  state.openGuide = state.openGuide === id ? null : id;
  renderAll();
  if (state.openGuide !== null) {
    const card = rows.querySelector(`[data-trophy-id="${id}"]`);
    if (card) card.scrollIntoView({ block: 'nearest' });
  }
}

// setView: switch views (and keep the URL hash in step so a view can be linked).
function setView(view) {
  state.view = view;
  state.openGuide = null;
  if (location.hash !== '#/' + view) history.replaceState(null, '', '#/' + view);
  renderAll();
  window.scrollTo(0, 0);
}

// Wire the controls.
document.getElementById('search').addEventListener('input', (e) => {
  state.filters.query = e.target.value;
  setView('checklist');
  renderAll();
});
document.getElementById('kind').addEventListener('change', (e) => {
  state.filters.kind = e.target.value;
  setView('checklist');
  renderAll();
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.filters.grade = e.target.value;
  setView('checklist');
  renderAll();
});
document.getElementById('earnedFilter').addEventListener('change', (e) => {
  state.filters.earned = e.target.value;
  setView('checklist');
  renderAll();
});
const spoilerToggle = document.getElementById('spoilerToggle');
function syncSpoilerButton() {
  spoilerToggle.setAttribute('aria-pressed', String(state.settings.spoilersHidden));
  spoilerToggle.textContent = state.settings.spoilersHidden ? 'Story trophies hidden' : 'Hide story trophies';
}
spoilerToggle.addEventListener('click', () => {
  state.settings.spoilersHidden = !state.settings.spoilersHidden;
  saveSettings(state.settings);
  syncSpoilerButton();
  renderAll();
});
syncSpoilerButton();

document.getElementById('nextUp').addEventListener('click', () => {
  const next = suggestNextTrophy();
  if (!next) return;
  setView('checklist');
  state.filters = { kind: 'all', grade: 'all', earned: 'all', query: '' };
  document.getElementById('search').value = '';
  document.getElementById('kind').value = 'all';
  document.getElementById('grade').value = 'all';
  document.getElementById('earnedFilter').value = 'all';
  state.openGuide = next.id;
  renderAll();
  const card = rows.querySelector(`[data-trophy-id="${next.id}"]`);
  if (card) card.scrollIntoView({ block: 'center' });
});

document.getElementById('export').addEventListener('click', () => exportProgress(state.earned));
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const imported = await importProgress(file);
  if (imported) {
    state.earned = imported;
    state.save();
    renderAll();
  } else {
    alert('That file is not a Platinum Atlas progress export.');
  }
  e.target.value = '';
});

for (const tab of document.querySelectorAll('.tabs button')) {
  tab.addEventListener('click', () => setView(tab.dataset.view));
}
window.addEventListener('hashchange', () => {
  const view = location.hash.replace('#/', '');
  if (['checklist', 'roadmap', 'missables'].includes(view)) setView(view);
});

// Start on the view the hash names, or the checklist.
const startView = location.hash.replace('#/', '');
if (['checklist', 'roadmap', 'missables'].includes(startView)) state.view = startView;
renderAll();
