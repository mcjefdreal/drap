import { createQuery } from '@tanstack/svelte-query';

import { fetchDraftLateRegistrants } from './http';
import type { LateRegistrants } from './schema';

export function createFetchDraftLateRegistrantsQuery(
  draftId: string,
  select?: (data: LateRegistrants) => LateRegistrants,
) {
  return createQuery(() => ({
    queryKey: ['drafts', draftId, 'late-registrants'] as const,
    async queryFn({ queryKey: [, id] }) {
      return await fetchDraftLateRegistrants(id);
    },
    select,
  }));
}
