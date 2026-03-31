import { createQuery } from '@tanstack/svelte-query';

import type { LateRegistrants } from './schema';
import { fetchDraftLateRegistrants } from './http';

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