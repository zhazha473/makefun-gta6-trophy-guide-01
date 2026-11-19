// Platinum Atlas — filtering and the spoiler rule. Pure functions over the trophy list.

// applySpoilerRule: when spoilers are hidden, a story trophy that is not yet
// earned shows a placeholder name and description and no grade at all.
export function applySpoilerRule(trophy, earned, spoilersHidden) {
  const hidden = spoilersHidden && trophy.kind === 'story' && !earned.has(trophy.id);
  if (!hidden) return trophy;
  return {
    ...trophy,
    name: 'Hidden story trophy',
    description: 'A story trophy — its name and description stay hidden until you earn it.',
    grade: 'hidden',
  };
}

// matchesSearch: the query matches a trophy's name or description (case-insensitive).
export function matchesSearch(trophy, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return trophy.name.toLowerCase().includes(q) || trophy.description.toLowerCase().includes(q);
}

// applyFilters: kind, grade, earned state and search, in one pass.
export function applyFilters(trophies, filters, earned) {
  return trophies.filter((t) => {
    if (filters.kind !== 'all') {
      if (filters.kind === 'missable') {
        if (!t.missable) return false;
      } else if (t.kind !== filters.kind) {
        return false;
      }
    }
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.earned === 'earned' && !earned.has(t.id)) return false;
    if (filters.earned === 'unearned' && earned.has(t.id)) return false;
    if (!matchesSearch(t, filters.query)) return false;
    return true;
  });
}

// filterCounts: how many trophies each filter value would show (for future badges).
export function filterCounts(trophies, earned) {
  const counts = { all: trophies.length, story: 0, missable: 0, collectibles: 0, activities: 0, platinum: 0 };
  for (const t of trophies) {
    if (t.kind === 'story') counts.story += 1;
    if (t.missable) counts.missable += 1;
    if (t.kind === 'collectibles') counts.collectibles += 1;
    if (t.kind === 'activities') counts.activities += 1;
    if (t.kind === 'platinum') counts.platinum += 1;
  }
  counts.earned = earned.size;
  counts.unearned = trophies.length - earned.size;
  return counts;
}
