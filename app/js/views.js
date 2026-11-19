// Rendering for Platinum Atlas: the checklist, the roadmap, the missables
// list, the roadmap rail and the progress header. Every view reads the same
// trophy data and the same earned set, so the numbers always agree.

import { KIND_LABELS, isSpoilerHidden } from './filters.js';

const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const STAGE_BLURBS = {
  1: 'Play the story in order — chapters, then the named missions, then the finale.',
  2: 'Meet the side characters and strangers, then finish each strand.',
  3: 'Work the repeatable activities: ranges, races, fishing, meditation and challenges.',
  4: 'Wanted levels, robberies and combat — all repeatable, except the choices.',
  5: 'The long grind: cards, vehicles, areas, money and property.',
  6: 'Finish the last percent, then the platinum is yours.',
};

function gradeTag(trophy) {
  return `<span class="tag tag-grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>`;
}

function sourceLinks(trophy, sourceMap) {
  return trophy.sources
    .map((key) => {
      const source = sourceMap[key];
      if (!source) return key;
      return `<a href="${source.url}" target="_blank" rel="noopener">${source.name}</a>`;
    })
    .join(' · ');
}

export function renderChecklist(list, trophies, earned, filters, sourceMap, openGuideId) {
  const checklist = document.getElementById('checklist');
  checklist.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const trophy of list) {
    const isEarned = earned.has(trophy.id);
    const hidden = isSpoilerHidden(trophy, earned, filters.spoiler);
    const item = document.createElement('li');
    item.className = 'trophy' + (isEarned ? ' is-earned' : '');
    item.id = `trophy-${trophy.id}`;
    item.dataset.trophyId = String(trophy.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isEarned;
    checkbox.setAttribute('aria-label', hidden ? 'Mark hidden story trophy as earned' : `Mark ${trophy.name} as earned`);
    checkbox.dataset.toggleEarned = String(trophy.id);

    const body = document.createElement('div');
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : trophy.name;
    head.appendChild(name);
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Earn this trophy to reveal its name and description.' : trophy.description;
    body.appendChild(head);
    body.appendChild(desc);

    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    if (hidden) {
      meta.insertAdjacentHTML('beforeend', '<span class="tag">Grade hidden</span>');
    } else {
      meta.insertAdjacentHTML('beforeend', gradeTag(trophy));
    }
    meta.insertAdjacentHTML('beforeend', `<span class="tag tag-kind">${KIND_LABELS[trophy.kind] ?? trophy.kind}</span>`);
    if (trophy.missable) meta.insertAdjacentHTML('beforeend', '<span class="tag tag-missable">Missable</span>');
    body.appendChild(meta);

    if (trophy.missable && !hidden) {
      const note = document.createElement('p');
      note.className = 'missable-note';
      note.textContent = `When it can be missed: ${trophy.missableReason}`;
      body.appendChild(note);
    }

    if (!hidden) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'guide-toggle';
      toggle.dataset.guideToggle = String(trophy.id);
      toggle.setAttribute('aria-expanded', openGuideId === trophy.id ? 'true' : 'false');
      toggle.textContent = openGuideId === trophy.id ? 'Hide guide −' : 'Show guide +';
      body.appendChild(toggle);
      if (openGuideId === trophy.id) {
        const guide = document.createElement('div');
        guide.className = 'guide';
        const text = document.createElement('p');
        text.textContent = trophy.guide;
        guide.appendChild(text);
        const sources = document.createElement('p');
        sources.className = 'sources';
        sources.innerHTML = `Sources: ${sourceLinks(trophy, sourceMap)}`;
        guide.appendChild(sources);
        body.appendChild(guide);
      }
    }

    item.appendChild(checkbox);
    item.appendChild(body);
    fragment.appendChild(item);
  }

  checklist.appendChild(fragment);
  document.getElementById('empty-note').hidden = list.length > 0;
  return list.length;
}

export function updateProgress(trophies, earned) {
  const total = trophies.length;
  const count = earned.size;
  document.getElementById('earned-count').textContent = String(count);
  const fill = document.getElementById('progress-fill');
  fill.style.width = total ? `${Math.round((count / total) * 100)}%` : '0%';
  const bar = document.getElementById('progress-bar');
  bar.setAttribute('aria-valuenow', String(count));

  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  const parts = grades.map((grade) => {
    const inGrade = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    return `<b>${got}/${inGrade}</b> ${GRADE_LABELS[grade].toLowerCase()}`;
  });
  document.getElementById('grade-counts').innerHTML = parts.join(' &middot; ');
  const remaining = total - count;
  document.getElementById('platinum-note').textContent =
    count === total
      ? 'Platinum earned — Vice Got a Price! is yours.'
      : `${remaining} to go — the platinum unlocks when all 55 are earned.`;
}

// The roadmap: stages in play order, each with its trophies and earned counts.
export function buildRoadmap(trophies, earned) {
  const host = document.getElementById('roadmap');
  host.innerHTML = '';
  const stages = [...new Set(trophies.map((t) => t.roadmapStage))].sort((a, b) => a - b);
  for (const stage of stages) {
    const members = trophies
      .filter((t) => t.roadmapStage === stage)
      .sort((a, b) => a.id - b.id);
    const got = members.filter((t) => earned.has(t.id)).length;
    const name = members[0].roadmapStageName;
    const section = document.createElement('section');
    section.className = 'roadmap-stage';
    section.innerHTML = `<h3><span class="stage-num">${stage}.</span>${name}</h3>
      <p class="stage-meta">${got}/${members.length} earned — ${STAGE_BLURBS[stage] ?? ''}</p>`;
    const list = document.createElement('ul');
    for (const trophy of members) {
      const li = document.createElement('li');
      if (earned.has(trophy.id)) li.className = 'is-earned';
      li.textContent = trophy.name;
      li.insertAdjacentHTML('beforeend', `<span class="grade-dot">${GRADE_LABELS[trophy.grade]}${trophy.missable ? ' · missable' : ''}</span>`);
      list.appendChild(li);
    }
    section.appendChild(list);
    host.appendChild(section);
  }

  // The sticky rail mirrors the same stages at a glance.
  const rail = document.getElementById('rail-stages');
  rail.innerHTML = '';
  for (const stage of stages) {
    const members = trophies.filter((t) => t.roadmapStage === stage);
    const got = members.filter((t) => earned.has(t.id)).length;
    const name = members[0].roadmapStageName;
    const li = document.createElement('li');
    li.innerHTML = `<b>Stage ${stage} — ${name}</b><span>${got}/${members.length} earned</span>`;
    rail.appendChild(li);
  }
}

// Every missable trophy, with the moment it can be missed, in roadmap order.
export function flagMissable(trophies, earned) {
  const host = document.getElementById('missables-list');
  host.innerHTML = '';
  const missables = trophies
    .filter((t) => t.missable)
    .sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
  for (const trophy of missables) {
    const card = document.createElement('article');
    card.className = 'missable-item';
    card.innerHTML = `<h3>${trophy.name} ${earned.has(trophy.id) ? '✓' : ''}</h3>
      <p>${trophy.description}</p>
      <p class="when">When it can be missed: ${trophy.missableReason}</p>
      <p>${trophy.guide}</p>`;
    host.appendChild(card);
  }
  document.getElementById('missable-pill').textContent = String(missables.length);
}

// The Next Up planner: the next unearned trophy in roadmap order.
export function suggestNextTrophy(trophies, earned) {
  const ordered = [...trophies].sort(
    (a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id,
  );
  return ordered.find((t) => !earned.has(t.id)) ?? null;
}
