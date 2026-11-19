// Platinum Atlas — the three views: checklist, roadmap and missables.
// Every view is built from the same trophy list, so the numbers always agree.
import { applyFilters, applySpoilerRule } from './filters.js';

const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', hidden: '—' };

// flagMissable: the red MISSABLE badge plus its reason, or nothing when safe.
export function flagMissable(trophy) {
  if (!trophy.missable) return null;
  const span = document.createElement('span');
  span.className = 'flag';
  span.textContent = 'MISSABLE';
  span.title = trophy.missableReason;
  return span;
}

// buildRoadmap: group the trophies into their six stages, in stage order.
export function buildRoadmap(trophies) {
  const stages = new Map();
  for (const t of trophies) {
    if (!stages.has(t.roadmapStage)) {
      stages.set(t.roadmapStage, { stage: t.roadmapStage, name: t.roadmapStageName, trophies: [] });
    }
    stages.get(t.roadmapStage).trophies.push(t);
  }
  return [...stages.values()].sort((a, b) => a.stage - b.stage);
}

// renderGuidePanel: the open guide under a trophy — guide text, when it can be
// missed, its roadmap stage and its Sources links.
export function renderGuidePanel(trophy) {
  const panel = document.createElement('div');
  panel.className = 'guide';
  const heading = document.createElement('h3');
  heading.textContent = 'Guide';
  panel.append(heading);
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  panel.append(guide);
  if (trophy.missable) {
    const miss = document.createElement('p');
    miss.className = 'miss';
    miss.textContent = 'When it can be missed: ' + trophy.missableReason;
    panel.append(miss);
  }
  const stage = document.createElement('p');
  stage.className = 'stage';
  stage.textContent = 'Roadmap: ' + trophy.roadmapStageName + ' · Sources: ';
  for (const s of trophy.sources) {
    const a = document.createElement('a');
    a.href = s.u;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.n;
    stage.append(a);
  }
  panel.append(stage);
  return panel;
}

// renderChecklist: one row per filtered trophy; click a row to open its guide.
export function renderChecklist(container, trophies, state, onToggle, onOpen) {
  container.replaceChildren();
  const shown = applyFilters(trophies, state.filters, state.earned);
  for (const trophy of shown) {
    const view = applySpoilerRule(trophy, state.earned, state.settings.spoilersHidden);
    const card = document.createElement('article');
    card.className = 'trophy' + (state.earned.has(trophy.id) ? ' earned' : '');
    card.dataset.trophyId = String(trophy.id);
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(trophy.id);
    box.setAttribute('aria-label', 'Earned: ' + view.name);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(trophy.id, box.checked));
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = view.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = view.description;
    main.append(name, desc);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const grade = document.createElement('span');
    grade.className = 'grade grade-' + view.grade;
    grade.textContent = GRADE_LABELS[view.grade] ?? view.grade;
    tags.append(grade);
    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = trophy.kind;
    tags.append(kind);
    const flag = flagMissable(trophy);
    if (flag) tags.append(flag);
    head.append(box, main, tags);
    head.addEventListener('click', () => onOpen(trophy.id));
    card.append(head);
    if (state.openGuide === trophy.id) {
      const isHidden = view.name === 'Hidden story trophy';
      if (isHidden) {
        const hidden = document.createElement('div');
        hidden.className = 'guide';
        const note = document.createElement('p');
        note.textContent = 'Guide hidden until earned — tick this trophy to reveal its guide.';
        hidden.append(note);
        card.append(hidden);
      } else {
        card.append(renderGuidePanel(trophy));
      }
    }
    container.append(card);
  }
  return shown.length;
}

// renderRoadmap: the six stages in order, each with its trophies and progress.
export function renderRoadmap(container, trophies, state) {
  container.replaceChildren();
  const stages = buildRoadmap(trophies);
  for (const stage of stages) {
    const block = document.createElement('section');
    block.className = 'stage-block';
    const earnedHere = stage.trophies.filter((t) => state.earned.has(t.id)).length;
    const heading = document.createElement('h2');
    heading.textContent = stage.name;
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = `${earnedHere} of ${stage.trophies.length} earned — play this stage in order, then move on.`;
    const list = document.createElement('ol');
    for (const t of stage.trophies) {
      const item = document.createElement('li');
      if (state.earned.has(t.id)) item.className = 'earned';
      const view = applySpoilerRule(t, state.earned, state.settings.spoilersHidden);
      item.textContent = `${view.name} — ${view.description} [${GRADE_LABELS[view.grade] ?? view.grade}]`;
      if (t.missable) {
        const note = document.createElement('span');
        note.className = 'miss-note';
        note.textContent = ' — MISSABLE: ' + t.missableReason;
        item.append(note);
      }
      list.append(item);
    }
    block.append(heading, meta, list);
    container.append(block);
  }
}

// renderMissables: every missable trophy with its "when it can be missed" note.
export function renderMissables(container, trophies, state) {
  container.replaceChildren();
  const missables = trophies.filter((t) => t.missable);
  const intro = document.createElement('p');
  intro.className = 'stage-meta';
  intro.textContent = `${missables.length} of ${trophies.length} trophies can be missed. Earn each one while its moment is open — the note under each says when that moment closes.`;
  container.append(intro);
  for (const t of missables) {
    const card = document.createElement('article');
    card.className = 'trophy' + (state.earned.has(t.id) ? ' earned' : '');
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) state.earned.add(t.id);
      else state.earned.delete(t.id);
      state.save();
      state.rerender();
    });
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const view = applySpoilerRule(t, state.earned, state.settings.spoilersHidden);
    const isHidden = view.name === 'Hidden story trophy';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = view.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = view.description;
    const miss = document.createElement('div');
    miss.className = 'miss-note';
    miss.textContent = isHidden
      ? 'When it can be missed: hidden with the story trophy — earn it to reveal the note.'
      : 'When it can be missed: ' + t.missableReason;
    main.append(name, desc, miss);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const grade = document.createElement('span');
    grade.className = 'grade grade-' + view.grade;
    grade.textContent = GRADE_LABELS[view.grade];
    tags.append(grade);
    const flag = flagMissable(t);
    if (flag) tags.append(flag);
    head.append(box, main, tags);
    if (isHidden) {
      const hidden = document.createElement('div');
      hidden.className = 'guide';
      const note = document.createElement('p');
      note.textContent = 'Guide hidden until earned — tick this trophy to reveal its guide.';
      hidden.append(note);
      card.append(head, hidden);
    } else {
      card.append(head, renderGuidePanel(t));
    }
    container.append(card);
  }
}
