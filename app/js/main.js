// Platinum Atlas — wiring: load the trophy data, render the views, and keep
// the checklist, filters, spoiler setting, roadmap, Next Up planner and
// export/import in step with the saved progress.

import { loadEarned, toggleEarned, exportProgress, importProgress } from './store.js';
import { createFilterState, applyFilters } from './filters.js';
import {
  renderChecklist,
  updateProgress,
  buildRoadmap,
  flagMissable,
  suggestNextTrophy,
} from './views.js';

const state = createFilterState();
let trophies = [];
let sourceMap = {};
let earned = loadEarned();
let openGuideId = null;

async function loadData() {
  const response = await fetch('./data/trophies.json');
  const data = await response.json();
  trophies = data.trophies;
  sourceMap = data.sources ?? {};
}

function renderAll() {
  const filtered = applyFilters(trophies, earned, state);
  const shown = renderChecklist(filtered, trophies, earned, state, sourceMap, openGuideId);
  updateProgress(trophies, earned);
  buildRoadmap(trophies, earned);
  flagMissable(trophies, earned);
  document.getElementById('filter-summary').textContent =
    `Showing ${shown} of ${trophies.length} trophies — ${earned.size} earned.`;
}

function showView(name) {
  for (const view of ['tracker', 'roadmap', 'missables']) {
    document.getElementById(`view-${view}`).hidden = view !== name;
    document.getElementById(`tab-${view}`).classList.toggle('is-active', view === name);
  }
}

function jumpToNextTrophy() {
  const next = suggestNextTrophy(trophies, earned);
  if (!next) {
    document.getElementById('import-status').textContent = 'All 55 earned — platinum time.';
    return;
  }
  // Clear filters that could hide it, open its guide, and scroll it into view.
  state.kind = 'all';
  state.grade = 'all';
  state.earned = 'all';
  state.missableOnly = false;
  state.query = '';
  document.getElementById('search').value = '';
  syncFilterButtons();
  openGuideId = next.id;
  renderAll();
  showView('tracker');
  const row = document.getElementById(`trophy-${next.id}`);
  if (row) {
    row.classList.add('is-next');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => row.classList.remove('is-next'), 4000);
  }
  document.getElementById('import-status').textContent =
    `Next up: ${next.name} — stage ${next.roadmapStage}, ${next.roadmapStageName}.`;
}

function syncFilterButtons() {
  document.querySelectorAll('#kind-filters .chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.kind === state.kind);
  });
  document.querySelectorAll('#grade-filters .chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.grade === state.grade);
  });
  document.getElementById('filter-unearned').classList.toggle('is-active', state.earned === 'unearned');
  document.getElementById('filter-earned').classList.toggle('is-active', state.earned === 'earned');
  document.getElementById('filter-missable').classList.toggle('is-active', state.missableOnly);
}

function bindEvents() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderAll();
  });

  document.getElementById('kind-filters').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-kind]');
    if (!chip) return;
    state.kind = chip.dataset.kind;
    syncFilterButtons();
    renderAll();
  });

  document.getElementById('grade-filters').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-grade]');
    if (!chip) return;
    state.grade = chip.dataset.grade;
    syncFilterButtons();
    renderAll();
  });

  document.getElementById('filter-unearned').addEventListener('click', () => {
    state.earned = state.earned === 'unearned' ? 'all' : 'unearned';
    syncFilterButtons();
    renderAll();
  });
  document.getElementById('filter-earned').addEventListener('click', () => {
    state.earned = state.earned === 'earned' ? 'all' : 'earned';
    syncFilterButtons();
    renderAll();
  });
  document.getElementById('filter-missable').addEventListener('click', () => {
    state.missableOnly = !state.missableOnly;
    syncFilterButtons();
    renderAll();
  });

  document.getElementById('spoiler-toggle').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    renderAll();
  });

  document.getElementById('checklist').addEventListener('change', (event) => {
    const box = event.target.closest('[data-toggle-earned]');
    if (!box) return;
    earned = toggleEarned(earned, Number(box.dataset.toggleEarned));
    renderAll();
  });
  document.getElementById('checklist').addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-guide-toggle]');
    if (!toggle) return;
    const id = Number(toggle.dataset.guideToggle);
    openGuideId = openGuideId === id ? null : id;
    renderAll();
  });

  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  });

  document.getElementById('next-up').addEventListener('click', jumpToNextTrophy);

  document.getElementById('export-btn').addEventListener('click', () => {
    const count = exportProgress(earned);
    document.getElementById('import-status').textContent =
      `Exported ${count} earned trophies to platinum-atlas-progress.json.`;
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      earned = await importProgress(file, trophies.map((t) => t.id));
      document.getElementById('import-status').textContent =
        `Imported progress — ${earned.size} trophies earned.`;
    } catch {
      document.getElementById('import-status').textContent =
        'That file is not a Platinum Atlas progress export.';
    }
    event.target.value = '';
    renderAll();
  });
}

await loadData();
bindEvents();
renderAll();
