// Filters for the Platinum Atlas checklist: by kind, grade, earned state,
// missable flag and text search — plus the spoiler rule that hides story
// trophies until they are earned.

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side',
  collectibles: 'Collectibles',
  activities: 'Activities',
  completion: 'Completion',
};

export function createFilterState() {
  return {
    kind: 'all',
    grade: 'all',
    earned: 'all', // all | earned | unearned
    missableOnly: false,
    query: '',
    spoiler: false,
  };
}

export function applyFilters(trophies, earned, state) {
  const query = state.query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    if (state.earned === 'earned' && !earned.has(trophy.id)) return false;
    if (state.earned === 'unearned' && earned.has(trophy.id)) return false;
    if (state.missableOnly && !trophy.missable) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

// The spoiler rule: a story trophy the player has not earned yet shows a
// placeholder instead of its name, description and grade.
export function isSpoilerHidden(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
}
