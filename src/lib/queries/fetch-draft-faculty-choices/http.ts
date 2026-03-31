import * as devalue from 'devalue';
import * as v from 'valibot';

import { DraftFacultyChoiceRecords } from './schema';

export async function fetchDraftFacultyChoices(draftId: string) {
  const response = await fetch(`/dashboard/drafts/${draftId}/faculty-choices`);
  if (!response.ok) throw new Error('Failed to fetch draft faculty choices.');

  const serialized = await response.text();
  return v.parse(DraftFacultyChoiceRecords, devalue.parse(serialized));
}
