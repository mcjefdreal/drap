import * as devalue from 'devalue';
import * as v from 'valibot';

import { LateRegistrants } from './schema';

export async function fetchDraftLateRegistrants(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/late-registrants`);
  if (!response.ok) throw new Error('Failed to fetch late registrants.');

  const serialized = await response.text();
  return v.parse(LateRegistrants, devalue.parse(serialized));
}
